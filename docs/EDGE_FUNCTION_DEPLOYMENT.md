# Deploy Supabase Edge Function for Push Notifications

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project linked: `supabase link --project-ref YOUR_PROJECT_REF`

## Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

## Step 2: Link Your Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in: Supabase Dashboard → Settings → General → Reference ID

## Step 3: Deploy the Edge Function

```bash
supabase functions deploy send-task-notifications
```

## Step 4: Set Environment Variables

Go to your Supabase Dashboard → Edge Functions → send-task-notifications → Settings

Add these secrets:
- `VAPID_PUBLIC_KEY` - Your VAPID public key (same as VITE_VAPID_PUBLIC_KEY)
- `VAPID_PRIVATE_KEY` - Your VAPID private key
- `VAPID_EMAIL` - Your email (e.g., mailto:your-email@example.com)

Or via CLI:
```bash
supabase secrets set VAPID_PUBLIC_KEY=your-public-key
supabase secrets set VAPID_PRIVATE_KEY=your-private-key
supabase secrets set VAPID_EMAIL=mailto:your-email@example.com
```

## Step 5: Set Up Cron Schedule

**Option A: Using Supabase Cron Extension (Recommended)**

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Grant usage on cron schema
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Schedule function to run every 15 minutes
select cron.schedule(
  'send-task-notifications-every-15-min',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  select
    net.http_post(
      url:='YOUR_EDGE_FUNCTION_URL/send-task-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Replace:
- `YOUR_EDGE_FUNCTION_URL` with your function URL (found in Supabase Dashboard → Edge Functions)
- `YOUR_SERVICE_ROLE_KEY` with your service role key (Dashboard → Settings → API → service_role key)

**Option B: External Cron Service**

Use a service like:
- Cron-job.org
- EasyCron
- GitHub Actions with scheduled workflows

Schedule a POST request to your edge function URL every 15 minutes.

## Step 6: Test the Function

You can manually invoke it to test:

```bash
supabase functions invoke send-task-notifications --no-verify-jwt
```

Or via curl:
```bash
curl -X POST YOUR_EDGE_FUNCTION_URL/send-task-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Monitoring

Check function logs:
```bash
supabase functions logs send-task-notifications
```

Or in Dashboard → Edge Functions → send-task-notifications → Logs

## Troubleshooting

**Function not deploying:**
- Ensure you're logged in: `supabase login`
- Check your project is linked: `supabase projects list`

**Notifications not sending:**
- Check Edge Function logs for errors
- Verify VAPID keys are set correctly
- Ensure push_subscriptions table has valid data
- Confirm tasks have notification_enabled = true

**Cron not running:**
- Verify pg_cron extension is enabled
- Check cron.job table: `SELECT * FROM cron.job;`
- View cron history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
