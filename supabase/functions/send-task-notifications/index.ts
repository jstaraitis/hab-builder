import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

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
  enclosure_id: string | null;
}

interface Enclosure {
  id: string;
  name: string;
}

// Send web push notification using npm web-push via Deno npm: specifier
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<boolean> {
  try {
    console.log('Configuring VAPID details...');
    webpush.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    console.log('Sending push notification to:', subscription.endpoint);
    
    await webpush.sendNotification(pushSubscription, payload);
    
    console.log('Push notification sent successfully!');
    return true;
  } catch (error: any) {
    console.error('Error sending web push:', error);
    
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(`Subscription expired: ${subscription.endpoint}`);
      return false;
    }
    
    console.error('Push error details:', error.body || error.message);
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
    // 1. Have notifications enabled
    // 2. Are active
    // 3. Due time is recent (within last 24 hours to catch any we might have missed)
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const { data: dueTasks, error: tasksError } = await supabaseClient
      .from('care_tasks')
      .select('id, user_id, title, description, next_due_at, notification_enabled, notification_minutes_before, enclosure_id')
      .eq('notification_enabled', true)
      .eq('is_active', true)
      .gte('next_due_at', twentyFourHoursAgo.toISOString());

    if (tasksError) throw tasksError;

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks with notifications enabled', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get all unique enclosure IDs from tasks
    const enclosureIds = [...new Set(dueTasks.map(t => t.enclosure_id).filter(Boolean))];
    
    // Fetch enclosure names if there are any
    let enclosuresMap: Record<string, string> = {};
    if (enclosureIds.length > 0) {
      const { data: enclosures, error: encError } = await supabaseClient
        .from('enclosures')
        .select('id, name')
        .in('id', enclosureIds);
      
      if (!encError && enclosures) {
        enclosuresMap = enclosures.reduce((acc, enc) => {
          acc[enc.id] = enc.name;
          return acc;
        }, {} as Record<string, string>);
      }
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
        console.log(`Processing subscription for user ${userId}:`, subscription.endpoint);
        
        // Group multiple tasks into one notification if there are many
        const firstTask = tasks[0];
        if (!firstTask) continue; // Skip if no tasks (shouldn't happen)
        
        const enclosureName = firstTask.enclosure_id && enclosuresMap[firstTask.enclosure_id]
          ? enclosuresMap[firstTask.enclosure_id]
          : (firstTask.enclosure_id ? 'Your Enclosure' : 'Your Pet');
        const taskTitles = tasks.map(t => t.title);
        
        const notificationTitle = tasks.length === 1
          ? `🪱 ${enclosureName}`
          : `🪱 ${enclosureName} (${tasks.length} tasks)`;
        
        const notificationBody = tasks.length === 1
          ? `${firstTask.title}`
          : taskTitles.slice(0, 3).join(', ') + (tasks.length > 3 ? '...' : '');

        const payload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          tag: tasks.length === 1 ? `task-${firstTask.id}` : 'multiple-tasks',
          url: '/care-calendar',
          taskId: tasks.length === 1 ? firstTask.id : null,
          taskCount: tasks.length
        });

        console.log('Sending push with payload:', payload);

        const success = await sendWebPush(
          subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidEmail
        );

        console.log(`Push notification result for ${subscription.endpoint}: ${success ? 'SUCCESS' : 'FAILED'}`);

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
