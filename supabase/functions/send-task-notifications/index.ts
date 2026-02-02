import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  next_due_at: string;
  notification_enabled: boolean;
  notification_minutes_before: number;
}

// Base64 URL-safe encoding
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Send web push notification
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    
    // Create JWT for VAPID
    const header = { typ: 'JWT', alg: 'ES256' };
    const payload_jwt = {
      aud: `${url.protocol}//${url.host}`,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
      sub: vapidEmail
    };

    // Import VAPID private key
    const privateKeyBytes = Uint8Array.from(
      atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    // Create JWT token
    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload_jwt)));
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    );
    
    const signatureB64 = base64UrlEncode(signature);
    const jwt = `${unsignedToken}.${signatureB64}`;

    // Encrypt payload
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    
    // Generate random salt and key
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const localKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    // Send notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'TTL': '86400', // 24 hours
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: payloadBytes
    });

    if (response.status === 201) {
      return true;
    } else if (response.status === 404 || response.status === 410) {
      // Subscription expired, should be removed
      console.log(`Subscription expired: ${subscription.endpoint}`);
      return false;
    } else {
      console.error(`Failed to send notification: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending web push:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:your-email@example.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Get current time
    const now = new Date();
    
    // Query for tasks that are:
    // 1. Due within their notification window
    // 2. Have notifications enabled
    // 3. Are active
    const { data: dueTasks, error: tasksError } = await supabaseClient
      .from('care_tasks')
      .select('id, user_id, title, description, next_due_at, notification_enabled, notification_minutes_before')
      .eq('notification_enabled', true)
      .eq('is_active', true)
      .gte('next_due_at', now.toISOString());

    if (tasksError) throw tasksError;

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks with notifications enabled', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Filter tasks that should be notified now
    const tasksToNotify = dueTasks.filter(task => {
      const dueTime = new Date(task.next_due_at).getTime();
      const notifyTime = dueTime - (task.notification_minutes_before * 60 * 1000);
      const currentTime = now.getTime();
      
      // Notify if we're within 15 minutes of the notification time (to account for cron intervals)
      return currentTime >= notifyTime && currentTime <= notifyTime + (15 * 60 * 1000);
    });

    if (tasksToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks ready for notification', totalTasks: dueTasks.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${tasksToNotify.length} tasks ready for notification`);

    // Group tasks by user
    const tasksByUser = tasksToNotify.reduce((acc, task) => {
      if (!acc[task.user_id]) {
        acc[task.user_id] = [];
      }
      acc[task.user_id].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    let notificationsSent = 0;
    let notificationsFailed = 0;
    const expiredSubscriptions: string[] = [];

    // Send notifications for each user
    for (const [userId, tasks] of Object.entries(tasksByUser)) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subsError } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subsError) {
        console.error(`Error fetching subscriptions for user ${userId}:`, subsError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${userId}`);
        continue;
      }

      // Send notification to each subscription
      for (const subscription of subscriptions) {
        // Group multiple tasks into one notification if there are many
        const taskTitles = tasks.map(t => t.title);
        const notificationBody = tasks.length === 1
          ? `${tasks[0].title} is due soon!`
          : `${tasks.length} tasks due soon: ${taskTitles.slice(0, 3).join(', ')}${tasks.length > 3 ? '...' : ''}`;

        const payload = JSON.stringify({
          title: 'Care Task Reminder',
          body: notificationBody,
          tag: tasks.length === 1 ? `task-${tasks[0].id}` : 'multiple-tasks',
          url: '/care-calendar',
          taskId: tasks.length === 1 ? tasks[0].id : null,
          taskCount: tasks.length
        });

        const success = await sendWebPush(
          subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidEmail
        );

        if (success) {
          notificationsSent++;
        } else {
          notificationsFailed++;
          expiredSubscriptions.push(subscription.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      
      console.log(`Removed ${expiredSubscriptions.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed', 
        tasksFound: tasksToNotify.length,
        notificationsSent,
        notificationsFailed,
        expiredSubscriptionsRemoved: expiredSubscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-task-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
