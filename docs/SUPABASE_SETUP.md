# Care Calendar - Supabase Setup Guide

This document walks you through setting up Supabase for the Care Calendar feature.

## Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier available)
2. Click **New Project**
3. Fill in:
   - **Name**: `habitat-builder` (or your preference)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to you
4. Click **Create new project** (takes ~2 minutes)

## Step 2: Get API Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Add Credentials to Your App

1. In your project root, create `.env.local`:
   ```bash
   # Copy from .env.local.example
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: `.env.local` is in `.gitignore` - never commit this file!

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste this SQL and click **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Care Tasks Table
CREATE TABLE care_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  enclosure_id TEXT,
  animal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'feeding',
    'misting',
    'water-change',
    'spot-clean',
    'deep-clean',
    'health-check',
    'supplement',
    'maintenance',
    'custom'
  )),
  frequency TEXT NOT NULL CHECK (frequency IN (
    'daily',
    'every-other-day',
    'twice-weekly',
    'weekly',
    'bi-weekly',
    'monthly',
    'custom'
  )),
  custom_frequency_days INTEGER,
  scheduled_time TEXT, -- HH:MM format
  next_due_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care Logs Table
CREATE TABLE care_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES care_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_care_tasks_user_id ON care_tasks(user_id);
CREATE INDEX idx_care_tasks_animal_id ON care_tasks(animal_id);
CREATE INDEX idx_care_tasks_next_due ON care_tasks(next_due_at);
CREATE INDEX idx_care_tasks_active ON care_tasks(is_active) WHERE is_active = true;
CREATE INDEX idx_care_logs_task_id ON care_logs(task_id);
CREATE INDEX idx_care_logs_user_id ON care_logs(user_id);
CREATE INDEX idx_care_logs_completed_at ON care_logs(completed_at);

-- Row Level Security (RLS) - Optional for single-user MVP
-- Enable when you add authentication
-- ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

-- Sample data for testing (optional)
-- INSERT INTO care_tasks (animal_id, title, description, type, frequency, next_due_at)
-- VALUES (
--   'whites-tree-frog',
--   'Feed crickets',
--   'Feed 3-4 appropriately sized crickets',
--   'feeding',
--   'daily',
--   NOW() + INTERVAL '1 day'
-- );
```

4. You should see "Success. No rows returned"

## Step 5: Test the Connection

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to **Care Calendar** in the app

3. If setup is correct, you'll see:
   - No errors in console
   - Empty task list with setup instructions
   - "Add New Task" button (disabled for now)

4. If you see errors:
   - Check browser console (F12)
   - Verify `.env.local` has correct credentials
   - Ensure dev server was restarted after adding `.env.local`

## Step 6: Add Sample Task (Testing)

You can add a test task via SQL Editor:

```sql
INSERT INTO care_tasks (
  animal_id,
  title,
  description,
  type,
  frequency,
  next_due_at,
  notes
) VALUES (
  'whites-tree-frog',
  'Daily Misting',
  'Mist enclosure 2-3 times per day',
  'misting',
  'daily',
  NOW() + INTERVAL '8 hours',
  'Focus on live plants and glass walls'
);
```

Refresh the Care Calendar page - you should see your task!

## Authentication (Future Phase)

Currently, the app works without authentication (single user). When ready to add:

1. Enable email auth in Supabase dashboard
2. Add RLS policies (see commented SQL above)
3. Implement login/signup UI
4. Filter tasks by `auth.uid()`

## Troubleshooting

### "Failed to load care tasks"
- Check browser console for specific error
- Verify Supabase URL and key in `.env.local`
- Ensure tables were created (check Supabase Table Editor)

### Tasks not showing
- Verify data exists: `SELECT * FROM care_tasks;` in SQL Editor
- Check `is_active = true` filter
- Look for console errors

### Changes to .env.local not working
- **You MUST restart the dev server** after changing `.env.local`
- Vite only reads env vars on startup

## Database Schema Diagram

```
┌─────────────────────┐
│   care_tasks        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ animal_id           │
│ title               │
│ type                │
│ frequency           │
│ next_due_at         │
│ ...                 │
└─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│   care_logs         │
├─────────────────────┤
│ id (PK)             │
│ task_id (FK)        │
│ user_id (FK)        │
│ completed_at        │
│ skipped             │
│ ...                 │
└─────────────────────┘
```

## Next Steps

Once basic tasks work, you can:
1. Build task creation UI (currently disabled)
2. Add edit/delete functionality
3. Implement species-specific task templates
4. Add browser notifications
5. Create completion history/analytics
6. Add authentication for multi-user support

See `docs/CARE_REMINDERS_IMPLEMENTATION.md` for full roadmap.
