# Row Level Security (RLS) Setup for Care Calendar

Run this SQL in your Supabase SQL Editor to enable user authentication and data isolation.

## Step 1: Enable RLS on Tables

```sql
-- Enable Row Level Security
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
```

## Step 2: Create Policies for care_tasks

```sql
-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON care_tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON care_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON care_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON care_tasks FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 3: Create Policies for care_logs

```sql
-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON care_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON care_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Step 4: Update Existing Tasks (if any)

If you have test tasks without a user_id, you can either:

**Option A: Delete them** (fresh start):
```sql
DELETE FROM care_logs;
DELETE FROM care_tasks;
```

**Option B: Assign to a test user** (after creating account):
```sql
-- First, sign up in the app and get your user ID
-- Then update existing tasks:
UPDATE care_tasks 
SET user_id = 'your-user-uuid-here' 
WHERE user_id IS NULL;

UPDATE care_logs 
SET user_id = 'your-user-uuid-here' 
WHERE user_id IS NULL;
```

## Step 5: Enable Email Auth in Supabase Dashboard

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Choose **Magic Link** (recommended, no password needed)
4. Save changes

## Verification

After running the SQL and signing up:

1. Sign up with your email in the app
2. Click the magic link in your email
3. You should be redirected to the Care Calendar
4. Create a task → should work
5. Sign out and sign in with different email → should see empty list (data isolated)

## Troubleshooting

**"new row violates row-level security policy"**
- The service is trying to insert without user_id
- Make sure user is authenticated before calling service methods

**Can't see tasks after signing in**
- Check that existing tasks have your user_id
- Run: `SELECT * FROM care_tasks WHERE user_id = auth.uid();` in SQL editor

**Magic link not working**
- Check spam folder
- Verify Email provider is enabled in Supabase
- Try with different email provider (Gmail works best)
