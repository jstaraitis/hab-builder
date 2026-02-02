# Supabase SQL Queries Reference

## Care Tasks Queries

### View All Tasks for Your User
```sql
SELECT 
  id,
  title,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  is_active,
  NOW() as current_time_utc,
  next_due_at - (notification_minutes_before || ' minutes')::interval as notification_should_send_at
FROM care_tasks 
WHERE user_id = auth.uid()
ORDER BY next_due_at ASC;
```

### View All Tasks (Admin - No Auth Filter)
```sql
SELECT 
  id,
  title,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  is_active,
  user_id,
  created_at
FROM care_tasks 
ORDER BY created_at DESC;
```

### View Specific Task by ID
```sql
SELECT 
  id,
  title,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  is_active,
  NOW() as current_time_utc,
  next_due_at - (notification_minutes_before || ' minutes')::interval as notification_should_send_at
FROM care_tasks 
WHERE id = 'TASK_ID_HERE';
```

### Update Task Due Time
```sql
-- Set task due at 5:00 PM EST (22:00 UTC on Feb 2, 2026)
UPDATE care_tasks 
SET next_due_at = '2026-02-02 22:00:00+00'
WHERE id = 'TASK_ID_HERE';
```

### Update Task Notification Settings
```sql
UPDATE care_tasks 
SET 
  notification_enabled = true,
  notification_minutes_before = 15
WHERE id = 'TASK_ID_HERE';
```

### Delete Task
```sql
DELETE FROM care_tasks 
WHERE id = 'TASK_ID_HERE';
```

---

## Push Subscriptions Queries

### View All Push Subscriptions
```sql
SELECT 
  id,
  user_id,
  endpoint,
  created_at,
  updated_at
FROM push_subscriptions 
ORDER BY created_at DESC;
```

### View Your Push Subscriptions
```sql
SELECT * FROM push_subscriptions 
WHERE user_id = auth.uid();
```

### View Push Subscription by User ID
```sql
SELECT * FROM push_subscriptions 
WHERE user_id = 'USER_ID_HERE';
```

### Delete Push Subscription
```sql
DELETE FROM push_subscriptions 
WHERE user_id = 'USER_ID_HERE';
```

### Delete All Push Subscriptions (Clean Slate)
```sql
DELETE FROM push_subscriptions;
```

---

## Cron Job Queries

### View All Cron Jobs
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job;
```

### View Specific Cron Job
```sql
SELECT * FROM cron.job 
WHERE jobname = 'send-task-notifications-every-15-min';
```

### View Cron Execution History
```sql
SELECT 
  runid,
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-task-notifications-every-15-min')
ORDER BY start_time DESC 
LIMIT 10;
```

### View Recent Cron Runs (All Jobs)
```sql
SELECT 
  j.jobname,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
ORDER BY r.start_time DESC 
LIMIT 20;
```

### Delete Cron Job
```sql
SELECT cron.unschedule('send-task-notifications-every-15-min');
```

### Create/Recreate Cron Job
```sql
-- First enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Delete old job if exists
SELECT cron.unschedule('send-task-notifications-every-15-min');

-- Create new job (replace YOUR_SERVICE_ROLE_KEY)
SELECT cron.schedule(
  'send-task-notifications-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lfetekraxyzdbabsopxy.supabase.co/functions/v1/send-task-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## User Queries

### Get Your User ID
```sql
SELECT auth.uid() as my_user_id;
```

### View Your User Info
```sql
SELECT * FROM auth.users 
WHERE id = auth.uid();
```

---

## Enclosures Queries

### View All Enclosures for Your User
```sql
SELECT * FROM enclosures 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### View All Enclosures (Admin)
```sql
SELECT 
  id,
  name,
  animal_id,
  user_id,
  created_at
FROM enclosures 
ORDER BY created_at DESC;
```

---

## Care Logs Queries

### View Recent Task Completions
```sql
SELECT 
  l.id,
  l.completed_at,
  l.notes,
  l.skipped,
  t.title as task_title
FROM care_logs l
JOIN care_tasks t ON l.task_id = t.id
WHERE l.user_id = auth.uid()
ORDER BY l.completed_at DESC
LIMIT 20;
```

### View Task Completion History
```sql
SELECT * FROM care_logs 
WHERE task_id = 'TASK_ID_HERE'
ORDER BY completed_at DESC;
```

---

## Debugging Queries

### Find Tasks Due Soon (Next Hour)
```sql
SELECT 
  id,
  title,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  next_due_at - (notification_minutes_before || ' minutes')::interval as notify_at
FROM care_tasks 
WHERE 
  is_active = true 
  AND notification_enabled = true
  AND next_due_at >= NOW()
  AND next_due_at <= NOW() + INTERVAL '1 hour'
ORDER BY next_due_at ASC;
```

### Find Tasks That Should Notify Now
```sql
SELECT 
  id,
  title,
  next_due_at,
  notification_minutes_before,
  next_due_at - (notification_minutes_before || ' minutes')::interval as notify_at,
  NOW() as current_time
FROM care_tasks 
WHERE 
  is_active = true 
  AND notification_enabled = true
  AND next_due_at >= NOW()
  AND (next_due_at - (notification_minutes_before || ' minutes')::interval) <= NOW()
  AND (next_due_at - (notification_minutes_before || ' minutes')::interval) >= NOW() - INTERVAL '15 minutes'
ORDER BY next_due_at ASC;
```

### Check Database Extensions
```sql
SELECT * FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
```

### Current Database Time (UTC)
```sql
SELECT NOW() as utc_time;
```

---

## Quick Test Task Setup

### Create a Test Task Due in 30 Minutes
```sql
INSERT INTO care_tasks (
  id,
  user_id,
  enclosure_id,
  title,
  description,
  type,
  frequency,
  scheduled_time,
  next_due_at,
  notification_enabled,
  notification_minutes_before,
  is_active
) VALUES (
  gen_random_uuid(),
  auth.uid(),
  (SELECT id FROM enclosures WHERE user_id = auth.uid() LIMIT 1),
  'Test Notification',
  'Testing push notifications',
  'feeding',
  'daily',
  '16:00',
  NOW() + INTERVAL '30 minutes',
  true,
  15,
  true
);
```

---

## Notes

### Time Zones
- Database stores all times in **UTC**
- EST = UTC - 5 hours
- When creating tasks, convert local time to UTC

### Cron Schedule Format
- `*/15 * * * *` = Every 15 minutes (at :00, :15, :30, :45)
- `0 * * * *` = Every hour (at :00)
- `0 9 * * *` = Every day at 9:00 AM UTC

### Service Role Key Location
- Supabase Dashboard → Settings → API → service_role key (keep secret!)
