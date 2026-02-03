# Testing Push Notifications Locally

## Prerequisites Check

✅ **VAPID Keys**: Already configured in `.env.local`
- Public Key: `BBkdqfU7i0KuBzGKDVxNBa7BF8Nv86XxUA5ZCaDPYQsHPQq5MW7eoV4MEKgfczQr19tSv04hVJo-Vhk9pzFLG2w`
- Private Key: `J3o3HAyD-2mFRuLpIyEfIIDsSafoRIeUWW3adoewxUI`

## Step 1: Set Up Database Tables

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/lfetekraxyzdbabsopxy/sql
2. Run this SQL to check if tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('care_tasks', 'push_subscriptions', 'care_logs');
```

3. If tables don't exist, create them:

```sql
-- Care tasks table
CREATE TABLE IF NOT EXISTS care_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enclosure_id TEXT,
  animal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  custom_frequency_days INTEGER,
  scheduled_time TEXT,
  next_due_at TIMESTAMPTZ NOT NULL,
  notification_enabled BOOLEAN DEFAULT true,
  notification_minutes_before INTEGER DEFAULT 15,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE, -- UNIQUE constraint on endpoint for upsert
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Care logs table
CREATE TABLE IF NOT EXISTS care_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES care_tasks(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('completed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_care_tasks_user ON care_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_next_due ON care_tasks(next_due_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_task ON care_logs(task_id);

-- Enable RLS
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for care_tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON care_tasks;
CREATE POLICY "Users can view own tasks" ON care_tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON care_tasks;
CREATE POLICY "Users can insert own tasks" ON care_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON care_tasks;
CREATE POLICY "Users can update own tasks" ON care_tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON care_tasks;
CREATE POLICY "Users can delete own tasks" ON care_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for push_subscriptions
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for care_logs
DROP POLICY IF EXISTS "Users can view own logs" ON care_logs;
CREATE POLICY "Users can view own logs" ON care_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM care_tasks WHERE care_tasks.id = care_logs.task_id AND care_tasks.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own logs" ON care_logs;
CREATE POLICY "Users can insert own logs" ON care_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM care_tasks WHERE care_tasks.id = care_logs.task_id AND care_tasks.user_id = auth.uid())
);
```

## Step 2: Configure Supabase Edge Function Secrets

1. Go to: https://supabase.com/dashboard/project/lfetekraxyzdbabsopxy/settings/functions
2. Add these secrets:

```
VAPID_PUBLIC_KEY = BBkdqfU7i0KuBzGKDVxNBa7BF8Nv86XxUA5ZCaDPYQsHPQq5MW7eoV4MEKgfczQr19tSv04hVJo-Vhk9pzFLG2w
VAPID_PRIVATE_KEY = J3o3HAyD-2mFRuLpIyEfIIDsSafoRIeUWW3adoewxUI
VAPID_EMAIL = mailto:jstaraitis@example.com
```

## Step 3: Deploy Edge Function

```bash
# Login to Supabase CLI (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref lfetekraxyzdbabsopxy

# Deploy the edge function
npx supabase functions deploy send-task-notifications
```

## Step 4: Start Dev Server

```bash
npm run dev
```

## Step 5: Test the Flow

### A. Subscribe to Push Notifications

1. Open http://localhost:5173 in your browser
2. Sign in with your account (create one if needed)
3. Navigate to Care Calendar section
4. When prompted, click "Enable Notifications" and allow browser permission
5. Check browser console - should see: `"Push subscription registered successfully"`

### B. Verify Subscription in Database

Run this in Supabase SQL Editor:

```sql
-- Check your push subscriptions
SELECT * FROM push_subscriptions 
WHERE user_id = auth.uid();
```

You should see an entry with endpoint, p256dh, and auth keys.

### C. Create a Test Task (Due Soon)

1. In the Care Calendar UI, click "Add Task"
2. Fill in:
   - **Title**: "Test Feeding"
   - **Animal**: Select any animal
   - **Frequency**: "Daily"
   - **Next Due**: Set to **5 minutes from now** (e.g., if it's 2:00 PM, set to 2:05 PM)
   - **Enable Notifications**: ✅ Checked
   - **Notify Before**: 1 minute
3. Save the task

### D. Verify Task in Database

```sql
-- Check your tasks
SELECT 
  id,
  title,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  NOW() as current_time_utc,
  next_due_at - (notification_minutes_before || ' minutes')::interval as notification_should_send_at
FROM care_tasks 
WHERE user_id = auth.uid()
ORDER BY next_due_at ASC;
```

### E. Manually Trigger Edge Function (Testing)

Since the edge function needs to be called on a schedule, test it manually:

```bash
# Invoke the function directly
curl -i --location --request POST 'https://lfetekraxyzdbabsopxy.supabase.co/functions/v1/send-task-notifications' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXRla3JheHl6ZGJhYnNvcHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDYxMjgsImV4cCI6MjA4NTYyMjEyOH0.eO2-mMCYuz_xzXcRGtNJfgI6L92jIHrfxtowQmf0COs'
```

**OR** use Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/lfetekraxyzdbabsopxy/functions
2. Click on `send-task-notifications`
3. Click "Invoke Function"

### F. Check for Notification

Within 1 minute of the notification time:
- You should see a browser notification appear with the task title
- Check browser console for any errors

## Step 6: Debug Issues

### Check Browser Console

Look for:
- `"Push subscription registered successfully"` - subscription worked
- `"Service worker registered"` - service worker loaded
- Any errors related to push notifications

### Check Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/lfetekraxyzdbabsopxy/functions
2. Click `send-task-notifications`
3. View "Logs" tab
4. Look for:
   - "Found X tasks ready for notification"
   - "Sent X notifications successfully"
   - Any error messages

### Common Issues

**"Notification permission denied"**
- Reset browser permissions: Chrome Settings → Privacy → Site Settings → Notifications
- Remove localhost from blocked list
- Reload and try again

**"Service worker not registered"**
- Check `public/sw.js` exists
- Check browser DevTools → Application → Service Workers
- Unregister and reload if needed

**"No push subscription found"**
- Check `push_subscriptions` table has your user_id
- Re-enable notifications from UI

**"VAPID keys not configured" (Edge Function)**
- Verify secrets are set in Supabase Edge Functions settings
- Redeploy the function after adding secrets

## Step 7: Set Up Automatic Scheduling (Optional)

For production, set up a cron job to call the edge function every 5 minutes:

**Option A: Supabase Cron (Recommended)**

```sql
-- Create a cron job (requires pg_cron extension)
SELECT cron.schedule(
  'send-task-notifications',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://lfetekraxyzdbabsopxy.supabase.co/functions/v1/send-task-notifications',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Option B: External Cron Service**

Use services like:
- GitHub Actions (scheduled workflow)
- Cron-job.org
- EasyCron
- Zapier

Call this endpoint every 5 minutes:
```
POST https://lfetekraxyzdbabsopxy.supabase.co/functions/v1/send-task-notifications
```

## Success Criteria

✅ Push subscription created in database
✅ Service worker registered in browser
✅ Task created with notification enabled
✅ Edge function successfully queries tasks
✅ Browser notification appears at scheduled time

---

## Quick Test Script

For rapid testing, here's a SQL script to create a task due in 2 minutes:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Get your user ID: SELECT auth.uid();

INSERT INTO care_tasks (
  user_id,
  animal_id,
  title,
  description,
  type,
  frequency,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  is_active
) VALUES (
  'YOUR_USER_ID', -- Replace with your user ID
  'whites-tree-frog',
  'Quick Test Task',
  'This task should notify in 1 minute',
  'feeding',
  'daily',
  NOW() + INTERVAL '2 minutes', -- Due in 2 minutes
  true,
  1, -- Notify 1 minute before
  true
);
```

Then invoke the edge function after 1 minute to see the notification!
