# Care Calendar - Quick Start

## 🎯 What Was Built

A complete care task management system with:
- ✅ Database schema and service layer
- ✅ Task viewing with due dates and streaks
- ✅ Complete/skip functionality with automatic rescheduling
- ✅ Mobile-responsive UI with dark mode
- ✅ Full Supabase integration

## 🚀 Getting Started (3 Steps)

### 1. Create Supabase Project (5 min)

1. Visit [supabase.com](https://supabase.com) → Sign up (free)
2. Click **New Project**:
   - Name: `habitat-builder`
   - Password: Generate strong password
   - Region: Choose nearest
3. Wait ~2 minutes for project creation

### 2. Set Up Database (3 min)

1. In Supabase dashboard → **SQL Editor**
2. Click **New query**
3. Copy/paste SQL from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md#step-4-create-database-tables)
4. Click **Run** → Should see "Success"

### 3. Connect Your App (2 min)

1. In Supabase → **Settings** → **API**
2. Copy **Project URL** and **anon public key**
3. Create `.env.local` in project root:
   ```bash
   cp .env.local.example .env.local
   ```
4. Edit `.env.local` and paste your credentials
5. **Restart dev server**: `npm run dev`

## ✅ Test It Works

1. Navigate to `/care-calendar` in the app
2. Should see empty task list (no errors)
3. Add a test task via SQL:
   ```sql
   INSERT INTO care_tasks (animal_id, title, type, frequency, next_due_at)
   VALUES ('whites-tree-frog', 'Daily Feeding', 'feeding', 'daily', NOW() + INTERVAL '8 hours');
   ```
4. Refresh page → Task appears!
5. Click **Complete** → Task reschedules to tomorrow

## 🎉 You're Done!

The Care Calendar is now functional. Next steps:
- Add more tasks via SQL (see examples in SUPABASE_SETUP.md)
- Build task creation UI (future work)
- Enable browser notifications (future work)

## 📚 More Info

- **Full setup guide**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Implementation details**: [CARE_CALENDAR_IMPLEMENTATION_SUMMARY.md](./CARE_CALENDAR_IMPLEMENTATION_SUMMARY.md)
- **Feature roadmap**: [CARE_REMINDERS_IMPLEMENTATION.md](./CARE_REMINDERS_IMPLEMENTATION.md)

## 🐛 Troubleshooting

**"Failed to load care tasks"**
- Check browser console (F12) for errors
- Verify `.env.local` has correct URL and key
- Restart dev server after changing `.env.local`

**Tasks not showing**
- Check data exists: `SELECT * FROM care_tasks;` in SQL Editor
- Verify `is_active = true` in database
- Check console for errors

**Need help?**
See detailed troubleshooting in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md#troubleshooting)
