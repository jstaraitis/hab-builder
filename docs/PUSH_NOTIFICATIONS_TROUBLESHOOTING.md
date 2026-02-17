# Push Notifications Troubleshooting Guide

## Common Issue: Notifications Stop After PWA Reinstall

### Problem
When a user reinstalls the PWA (Progressive Web App) on their device, push notifications stop working. This happens because:

1. The browser generates a **new push subscription endpoint** after reinstall
2. The **old endpoint** remains in the database but is no longer valid
3. The system tries to send notifications to both endpoints, but the old one fails
4. The new subscription may not be properly registered

### Solution Implemented

We've implemented a three-layer fix:

#### 1. Automatic Cleanup on Subscribe
When a user enables notifications, the system now:
- Deletes all old subscriptions for that user
- Creates a fresh subscription with the new endpoint
- Ensures only one valid subscription exists

**File**: `src/services/notificationService.ts` - `subscribe()` method

#### 2. Validation on App Startup
When the app loads (and user is logged in), the system:
- Checks if the browser has a push subscription
- Compares it to database subscriptions
- If there's a mismatch, cleans up and re-registers
- Runs automatically in the background

**File**: `src/App.tsx` - useEffect hook after profile load

#### 3. Database Cleanup Script
For existing installations with orphaned subscriptions:
- SQL script to identify users with multiple subscriptions
- Safe cleanup process to keep only the most recent
- Verification queries to confirm cleanup

**File**: `docs/PUSH_SUBSCRIPTIONS_CLEANUP_MIGRATION.sql`

## How to Fix on Your Phone

### Option 1: Re-enable Notifications (Easiest)
1. Open the app on your phone
2. Go to any care task
3. Try to enable notifications for a task
4. When prompted, click "Enable Notifications"
5. The system will automatically clean up old subscriptions

### Option 2: Clear and Reinstall (Nuclear Option)
If notifications still don't work:
1. **Clear App Data**:
   - iOS: Settings → Safari → Advanced → Website Data → Remove habitat-builder
   - Android: Settings → Apps → Chrome → Site Settings → habitat-builder → Clear & Reset
2. **Reinstall PWA**:
   - Visit the site in browser
   - Add to Home Screen again
3. **Re-enable Notifications**:
   - Log in
   - Go to Care Calendar
   - Enable notifications (the system will set up fresh)

### Option 3: Manual Database Cleanup (Admin)
If you have database access:
1. Open Supabase Dashboard → SQL Editor
2. Run the cleanup script from `docs/PUSH_SUBSCRIPTIONS_CLEANUP_MIGRATION.sql`
3. Verify cleanup with the verification queries
4. User should then re-enable notifications in the app

## Verification Steps

### Check if Notifications are Working
1. **Browser Level**:
   ```javascript
   // In browser console
   Notification.permission // should be "granted"
   ```

2. **Service Worker Level**:
   ```javascript
   // In browser console
   navigator.serviceWorker.ready.then(reg => 
     reg.pushManager.getSubscription().then(sub => 
       console.log(sub ? 'Subscribed' : 'Not subscribed')
     )
   );
   ```

3. **Database Level**:
   ```sql
   -- In Supabase SQL Editor
   SELECT user_id, endpoint, created_at, updated_at 
   FROM push_subscriptions 
   WHERE user_id = 'YOUR_USER_ID';
   ```

### Expected State
- **One subscription per user** in the database
- **Matching endpoint** between browser and database
- **Recent updated_at** timestamp (within the last login)

## Technical Details

### Database Schema
```sql
push_subscriptions
  - id (uuid)
  - user_id (uuid) → references auth.users
  - endpoint (text) → unique per device/browser
  - p256dh (text) → encryption key
  - auth (text) → authentication key
  - created_at (timestamp)
  - updated_at (timestamp)
  - UNIQUE constraint on (user_id, endpoint)
```

### Key Methods Added

#### `validateAndCleanup()`
Automatically runs on app startup:
- Compares browser subscription to database
- Detects mismatches (e.g., after reinstall)
- Cleans up and re-registers if needed
- Silent - no user interaction required

#### `cleanupOldSubscriptions()`
Internal method called before subscribing:
- Deletes ALL existing subscriptions for the user
- Ensures clean slate for new subscription
- Prevents orphaned endpoints

### Code Flow

```
App Startup (logged in user)
  └─> validateAndCleanup()
      ├─> Check if browser has subscription
      ├─> Check if database has matching endpoint
      └─> If mismatch: cleanupOldSubscriptions() + saveSubscription()

User Enables Notifications
  └─> subscribe()
      ├─> Request browser permission
      ├─> cleanupOldSubscriptions() ← NEW
      ├─> Create new push subscription
      └─> saveSubscription() in database
```

## Edge Function Considerations

If you're sending notifications via Supabase Edge Function, ensure it:
1. **Handles expired subscriptions gracefully**
   - Wrap web-push calls in try-catch
   - If sending fails with 410 (Gone), delete that subscription
   
2. **Doesn't spam with retries**
   - If a subscription fails, mark it as invalid
   - Don't keep retrying failed endpoints

Example edge function error handling:
```typescript
try {
  await webpush.sendNotification(subscription, payload);
} catch (error) {
  if (error.statusCode === 410 || error.statusCode === 404) {
    // Subscription expired - remove from database
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint);
  }
}
```

## Prevention

The implemented fixes should prevent this issue going forward:
- ✅ Automatic cleanup on subscribe
- ✅ Validation on app startup
- ✅ Single source of truth (one subscription per user)
- ✅ Silent recovery (no user action needed)

## Monitoring

To monitor subscription health:
```sql
-- Check for users with multiple subscriptions (should be 0)
SELECT user_id, COUNT(*) as count
FROM push_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check subscription age distribution
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions
FROM push_subscriptions
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Check recent updates (should see activity)
SELECT COUNT(*)
FROM push_subscriptions
WHERE updated_at > NOW() - INTERVAL '7 days';
```

## Additional Resources
- [Push API MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm package](https://www.npmjs.com/package/web-push)
