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

interface NativePushToken {
  id: string;
  user_id: string;
  device_token: string;
  platform: string;
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

// Build an ES256 JWT for APNs token-based auth (no external library needed)
async function createApnsJwt(teamId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header = b64url({ alg: 'ES256', kid: keyId });
  const payload = b64url({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const signingInput = `${header}.${payload}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigB64}`;
}

// Send APNs notification to a native iOS device token.
// Returns: 'sent' | 'expired' | 'failed'
// Only 'expired' should cause the token to be deleted from the database.
async function sendApns(
  deviceToken: string,
  title: string,
  body: string,
  extraPayload: Record<string, unknown>,
  apnsKeyId: string,
  apnsTeamId: string,
  apnsBundleId: string,
  apnsPrivateKey: string,
  production = true
): Promise<'sent' | 'expired' | 'failed'> {
  try {
    const jwt = await createApnsJwt(apnsTeamId, apnsKeyId, apnsPrivateKey);
    const host = production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
    const url = `https://${host}/3/device/${deviceToken}`;

    const notification = {
      aps: { alert: { title, body }, badge: 1, sound: 'default' },
      ...extraPayload,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': apnsBundleId,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (response.status === 200) return 'sent';

    const result = await response.json().catch(() => ({}));
    const reason = result?.reason ?? '';
    console.error('APNs error:', response.status, result);

    // Only delete the token when Apple confirms it is no longer valid
    if (response.status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered') {
      return 'expired';
    }

    // Config errors (TopicDisallowed, InvalidProviderToken, etc.) — keep the token
    return 'failed';
  } catch (error: any) {
    console.error('APNs send error:', error);
    return 'failed';
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

    // APNs credentials for iOS native push
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.habitatbuilder.app';
    const apnsPrivateKey = Deno.env.get('APNS_PRIVATE_KEY'); // contents of .p8 file
    const apnsProduction = Deno.env.get('APNS_PRODUCTION') !== 'false'; // default true

    // Diagnostic — helps identify secret mismatches without exposing key contents
    console.log('[APNs config] keyId:', apnsKeyId ?? '(not set)');
    console.log('[APNs config] teamId:', apnsTeamId ?? '(not set)');
    console.log('[APNs config] bundleId:', apnsBundleId);
    console.log('[APNs config] production:', apnsProduction);
    console.log('[APNs config] privateKey set:', !!apnsPrivateKey, '| length:', apnsPrivateKey?.length ?? 0);

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
      
      // Notify if we're within 2 minutes of the notification time
      // (narrow window prevents duplicate notifications across cron cycles)
      return currentTime >= notifyTime && currentTime <= notifyTime + (2 * 60 * 1000);
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
    const expiredWebSubscriptions: string[] = [];
    const expiredNativeTokens: string[] = [];

    // Send notifications for each user
    for (const [userId, tasks] of Object.entries(tasksByUser)) {
      // Build notification content (shared across web + native)
      const firstTask = tasks[0];
      if (!firstTask) continue;

      const enclosureName = firstTask.enclosure_id && enclosuresMap[firstTask.enclosure_id]
        ? enclosuresMap[firstTask.enclosure_id]
        : (firstTask.enclosure_id ? 'Your Enclosure' : 'Your Pet');
      const taskTitles = tasks.map(t => t.title);

      const notificationTitle = tasks.length === 1
        ? `Habitat Builder - Care Reminder`
        : `Habitat Builder - ${tasks.length} Care Reminders`;

      const notificationBody = tasks.length === 1
        ? `${enclosureName}: ${firstTask.title}`
        : `${enclosureName}: ` + taskTitles.slice(0, 3).join(', ') + (tasks.length > 3 ? '...' : '');

      const notificationExtra = {
        url: '/care-calendar',
        taskId: tasks.length === 1 ? firstTask.id : null,
        taskCount: tasks.length,
      };

      // --- Web push subscriptions ---
      if (vapidPublicKey && vapidPrivateKey) {
        const { data: webSubscriptions, error: webSubsError } = await supabaseClient
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId);

        if (!webSubsError && webSubscriptions?.length) {
          const webPayload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
            tag: tasks.length === 1 ? `task-${firstTask.id}` : 'multiple-tasks',
            ...notificationExtra,
          });

          for (const subscription of webSubscriptions) {
            const success = await sendWebPush(subscription, webPayload, vapidPublicKey, vapidPrivateKey, vapidEmail);
            if (success) {
              notificationsSent++;
            } else {
              notificationsFailed++;
              expiredWebSubscriptions.push(subscription.id);
            }
          }
        }
      }

      // --- Native (iOS) push tokens ---
      if (apnsKeyId && apnsTeamId && apnsPrivateKey) {
        const { data: nativeTokens, error: nativeError } = await supabaseClient
          .from('native_push_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', 'ios');

        if (!nativeError && nativeTokens?.length) {
          for (const tokenRow of nativeTokens as NativePushToken[]) {
            const result = await sendApns(
              tokenRow.device_token,
              notificationTitle,
              notificationBody,
              notificationExtra,
              apnsKeyId,
              apnsTeamId,
              apnsBundleId,
              apnsPrivateKey,
              apnsProduction
            );
            if (result === 'sent') {
              notificationsSent++;
            } else if (result === 'expired') {
              notificationsFailed++;
              expiredNativeTokens.push(tokenRow.id);
            } else {
              // 'failed' = config/transient error — count as failed but keep the token
              notificationsFailed++;
            }
          }
        }
      }
    }

    // Clean up expired web subscriptions
    if (expiredWebSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredWebSubscriptions);
      console.log(`Removed ${expiredWebSubscriptions.length} expired web subscriptions`);
    }

    // Clean up expired native tokens
    if (expiredNativeTokens.length > 0) {
      await supabaseClient
        .from('native_push_tokens')
        .delete()
        .in('id', expiredNativeTokens);
      console.log(`Removed ${expiredNativeTokens.length} expired native tokens`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed', 
        tasksFound: tasksToNotify.length,
        notificationsSent,
        notificationsFailed,
        expiredWebSubscriptionsRemoved: expiredWebSubscriptions.length,
        expiredNativeTokensRemoved: expiredNativeTokens.length,
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
