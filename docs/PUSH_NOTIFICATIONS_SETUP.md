# Push Notifications Setup Guide

## 1. Generate VAPID Keys

Run this command in your terminal to generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

## 2. Add to Environment Variables

Add these to your `.env.local` file:

```env
VITE_VAPID_PUBLIC_KEY=<your-public-key>
```

## 3. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create push_subscriptions table
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one subscription per user per endpoint
  unique(user_id, endpoint)
);

-- Enable RLS
alter table push_subscriptions enable row level security;

-- Users can only manage their own subscriptions
create policy "Users can insert their own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Add indexes
create index push_subscriptions_user_id_idx on push_subscriptions(user_id);
```

## 4. Install web-push Package

```bash
npm install web-push
```

## 5. Create Supabase Edge Function

You'll need to create a Supabase Edge Function to send push notifications. This will be done after the client-side setup is complete.

The edge function will:
- Check for due tasks
- Look up user's push subscriptions
- Send push notifications using web-push library

## 6. Test Notifications

After setup:
1. Grant notification permission in browser
2. Subscribe to push notifications
3. Create a task due soon
4. You should receive a notification when the task is due
