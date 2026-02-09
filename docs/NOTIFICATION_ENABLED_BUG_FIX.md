# Notification Enabled Bug Fix

## Issue
When unchecking "send push notification reminders" in the task edit modal, the `notification_enabled` field in Supabase remained set to `true`.

## Root Cause
The bug occurred due to `undefined` values not being properly handled:

1. **Initial State Problem**: When a task was loaded with `notification_enabled` as `null` or `undefined` in the database (common for tasks created before the notification feature), the form would initialize with `notificationEnabled: undefined`

2. **Update Skipping**: The `mapTaskToDb` function uses this check:
   ```typescript
   if (task.notificationEnabled !== undefined) 
     mapped.notification_enabled = task.notificationEnabled;
   ```
   When the value was `undefined`, it would be excluded from the database update entirely

3. **Visual Mismatch**: The checkbox showed as unchecked (due to `|| false` fallback), but clicking Save wouldn't update the database because `undefined` was excluded from the update

## Solution

### 1. Explicit Default Value
Changed the form initialization in `TaskEditModal.tsx` to explicitly default to `false`:

```typescript
// Before:
notificationEnabled: task.notificationEnabled,

// After:
notificationEnabled: task.notificationEnabled ?? false,
```

This ensures the form always has a defined boolean value, never `undefined`.

### 2. Debugging Logging
Added console logging at three key points:

**A. Form Submission** (`TaskEditModal.tsx`):
```typescript
console.log('[TaskEditModal] Submitting form data:', {
  taskId: task.id,
  formData: { notificationEnabled, notificationMinutesBefore, ... }
});
```

**B. Checkbox Change** (`TaskEditModal.tsx`):
```typescript
console.log('[TaskEditModal] Notification checkbox changed:', {
  checked: e.target.checked,
  previousValue: formData.notificationEnabled,
});
```

**C. Service Layer** (`careTaskService.ts`):
```typescript
console.log('[careTaskService] Updating notification settings:', {
  taskId, notificationEnabled, dbUpdates: { notification_enabled, ... }
});
console.log('[careTaskService] Update successful, returned data:', {
  notification_enabled, notification_minutes_before
});
```

### 3. Database Migration
Created `NOTIFICATION_ENABLED_FIX.sql` to ensure:
- Columns exist with proper defaults
- No NOT NULL constraints preventing false values
- Index for efficient querying of enabled notifications

## How to Test

### 1. Run the Database Migration
```sql
-- In Supabase SQL Editor, run:
-- See docs/NOTIFICATION_ENABLED_FIX.sql

-- Verify columns exist:
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'care_tasks' 
  AND column_name IN ('notification_enabled', 'notification_minutes_before');
```

### 2. Test the Fix
1. **Open dev tools console** to see debug logs
2. **Open a task** in edit mode
3. **Watch for logs**: `[TaskEditModal] Submitting form data`
4. **Toggle notification checkbox** on/off
5. **Save the task**
6. **Check logs** for:
   - Form data shows correct boolean value
   - Service layer receives correct value
   - Database update succeeds

### 3. Verify in Supabase
```sql
-- Check a specific task:
SELECT id, title, notification_enabled, notification_minutes_before 
FROM care_tasks 
WHERE id = 'YOUR-TASK-ID';

-- Find all tasks with notifications disabled:
SELECT id, title, notification_enabled 
FROM care_tasks 
WHERE notification_enabled = false;
```

## Expected Console Output

### When unchecking notification:
```
[TaskEditModal] Notification checkbox changed: {
  checked: false,
  previousValue: true
}

[TaskEditModal] Submitting form data: {
  taskId: "abc-123",
  formData: { notificationEnabled: false, ... }
}

[careTaskService] Updating notification settings: {
  taskId: "abc-123",
  notificationEnabled: false,
  dbUpdates: { notification_enabled: false, ... }
}

[careTaskService] Update successful, returned data: {
  id: "abc-123",
  notification_enabled: false,
  notification_minutes_before: 15
}
```

## Files Changed

1. **src/components/CareCalendar/TaskEditModal.tsx**
   - Line ~33: Changed `notificationEnabled: task.notificationEnabled` to `task.notificationEnabled ?? false`
   - Line ~50: Added debug logging in `handleSubmit`
   - Line ~280: Added debug logging in checkbox onChange

2. **src/services/careTaskService.ts**
   - Line ~152: Added debug logging before/after database update in `updateTask`

3. **docs/NOTIFICATION_ENABLED_FIX.sql**
   - New file: Database migration to ensure columns exist and accept false values

## Preventing Future Issues

1. **Always use explicit defaults** for boolean fields in form initialization
2. **Use nullish coalescing (`??`)** instead of `||` for boolean defaults to avoid falsy value bugs
3. **Add debug logging** for critical state changes during development
4. **Test both true→false AND false→true** transitions

## Cleanup

Once verified working in production, the debug console.log statements can be removed or converted to conditional development-only logs:

```typescript
if (import.meta.env.DEV) {
  console.log('[careTaskService] Update successful:', data);
}
```
