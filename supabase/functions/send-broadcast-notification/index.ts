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

async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<'sent' | 'expired'> {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload
    );
    return 'sent';
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) return 'expired';
    console.error('Web push error:', error.body || error.message);
    return 'sent'; // don't delete on transient errors
  }
}

async function createApnsJwt(teamId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey('pkcs8', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const b64url = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const header = b64url({ alg: 'ES256', kid: keyId });
  const payload = b64url({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signingInput}.${sigB64}`;
}

async function sendApns(
  deviceToken: string,
  title: string,
  body: string,
  url: string,
  apnsKeyId: string,
  apnsTeamId: string,
  apnsBundleId: string,
  apnsPrivateKey: string,
  production: boolean
): Promise<'sent' | 'expired' | 'failed'> {
  try {
    const jwt = await createApnsJwt(apnsTeamId, apnsKeyId, apnsPrivateKey);
    const host = production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
    const response = await fetch(`https://${host}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': apnsBundleId,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ aps: { alert: { title, body }, badge: 1, sound: 'default' }, url }),
    });
    if (response.status === 200) return 'sent';
    const result = await response.json().catch(() => ({}));
    const reason = result?.reason ?? '';
    if (response.status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered') return 'expired';
    return 'failed';
  } catch (err) {
    console.error('APNs send error:', err);
    return 'failed';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Authenticate caller — must be an owner email
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ownerEmails = (Deno.env.get('OWNER_EMAILS') ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const ownerUserIds = (Deno.env.get('OWNER_USER_IDS') ?? '').split(',').map(id => id.trim()).filter(Boolean);
    const isOwner = ownerEmails.includes((user.email ?? '').toLowerCase()) || ownerUserIds.includes(user.id);
    if (!isOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { title, message, url = '/', targetUserId } = body as {
      title: string;
      message: string;
      url?: string;
      targetUserId?: string; // omit to broadcast to all subscribers
    };

    if (!title?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'title and message are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidEmail = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@habitatbuilder.app';
    const apnsKeyId = Deno.env.get('APNS_KEY_ID') ?? '';
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID') ?? '';
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') ?? 'com.habitatbuilder.app';
    const apnsPrivateKey = Deno.env.get('APNS_PRIVATE_KEY') ?? '';
    const apnsProduction = Deno.env.get('APNS_PRODUCTION') !== 'false';

    const stats = { webSent: 0, webExpired: 0, nativeSent: 0, nativeExpired: 0, nativeFailed: 0 };
    const expiredWebIds: string[] = [];
    const expiredNativeIds: string[] = [];

    // --- Web push ---
    if (vapidPublicKey && vapidPrivateKey) {
      let webQuery = supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth');
      if (targetUserId) webQuery = webQuery.eq('user_id', targetUserId);
      const { data: webSubs } = await webQuery;

      if (webSubs?.length) {
        const payload = JSON.stringify({ title, body: message, url, icon: '/animals/default.png' });
        await Promise.all((webSubs as PushSubscription[]).map(async (sub) => {
          const result = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey, vapidEmail);
          if (result === 'expired') { expiredWebIds.push(sub.id); stats.webExpired++; }
          else stats.webSent++;
        }));
      }
    }

    // --- Native push (APNs) ---
    if (apnsKeyId && apnsTeamId && apnsPrivateKey) {
      let nativeQuery = supabase.from('native_push_tokens').select('id, user_id, device_token, platform').eq('platform', 'ios');
      if (targetUserId) nativeQuery = nativeQuery.eq('user_id', targetUserId);
      const { data: nativeTokens } = await nativeQuery;

      if (nativeTokens?.length) {
        await Promise.all((nativeTokens as NativePushToken[]).map(async (token) => {
          const result = await sendApns(token.device_token, title, message, url, apnsKeyId, apnsTeamId, apnsBundleId, apnsPrivateKey, apnsProduction);
          if (result === 'expired') { expiredNativeIds.push(token.id); stats.nativeExpired++; }
          else if (result === 'failed') stats.nativeFailed++;
          else stats.nativeSent++;
        }));
      }
    }

    // Cleanup expired subscriptions
    if (expiredWebIds.length) await supabase.from('push_subscriptions').delete().in('id', expiredWebIds);
    if (expiredNativeIds.length) await supabase.from('native_push_tokens').delete().in('id', expiredNativeIds);

    return new Response(JSON.stringify({ ok: true, stats }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-broadcast-notification error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
