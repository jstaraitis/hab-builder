# Notification Scheduling & Task Polling Analysis

## Executive Summary

The Habitat Builder app implements a **server-side scheduled notification system** combined with **browser-based push notifications**. Notifications are calculated on the server (Supabase Edge Functions) every 15 minutes using a cron job, then sent to users via Web Push API (browsers) and APNs (iOS/Android).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Client Layer (React + Service Worker)                           │
│ • usePWAUpdate hook checks for updates every 30 min             │
│ • Service worker receives push events in background             │
│ • Push notifications displayed via browser API                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (HTTP POST every 15 minutes)
┌─────────────────────────────────────────────────────────────────┐
│ Server Layer (Supabase Edge Functions)                          │
│ • send-task-notifications function runs on cron schedule        │
│ • Queries due tasks from database                               │
│ • Calculates which tasks are ready for notification             │
│ • Sends via Web Push API (web browsers)                         │
│ • Sends via APNs (iOS/Android native)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Database Layer (Supabase PostgreSQL)                            │
│ • care_tasks table (notification_enabled, notification_minutes_before)
│ • push_subscriptions table (web browser subscriptions)          │
│ • native_push_tokens table (iOS/Android tokens)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Server-Side Notification Scheduling (PRIMARY)

### File: [supabase/functions/send-task-notifications/index.ts](supabase/functions/send-task-notifications/index.ts)

**Purpose**: Runs on a 15-minute cron schedule to check for due tasks and send push notifications.

#### Key Logic Flow

```typescript
// 1. Query tasks due in the last 24 hours with notifications enabled
const { data: dueTasks } = await supabaseClient
  .from('care_tasks')
  .select('id, user_id, title, description, next_due_at, notification_enabled, notification_minutes_before')
  .eq('notification_enabled', true)
  .eq('is_active', true)
  .gte('next_due_at', twentyFourHoursAgo.toISOString());

// 2. Filter tasks that are READY FOR NOTIFICATION NOW
const tasksToNotify = dueTasks.filter(task => {
  const dueTime = new Date(task.next_due_at).getTime();
  const notifyTime = dueTime - (task.notification_minutes_before * 60 * 1000);
  const currentTime = now.getTime();
  
  // Notify if within 15 minutes of the notification time
  // (accounts for cron running every 15 minutes)
  return currentTime >= notifyTime && currentTime <= notifyTime + (15 * 60 * 1000);
});

// 3. Send via Web Push (browsers)
const webPayload = JSON.stringify({
  title: notificationTitle,
  body: notificationBody,
  tag: `task-${firstTask.id}`,
  url: '/care-calendar',
  taskId: tasks.length === 1 ? firstTask.id : null
});

await webpush.sendNotification(pushSubscription, webPayload);

// 4. Send via APNs (iOS/Android native apps)
await sendApns(
  deviceToken,
  notificationTitle,
  notificationBody,
  extraPayload,
  ...apnsCredentials
);
```

#### Notification Time Calculation

```
Task: next_due_at = 2026-05-15 14:00:00
      notification_minutes_before = 15

Calculation:
  dueTime = 1716057600000 ms
  notifyTime = 1716056900000 ms (14:00 - 15 min = 13:45)
  
Cron runs every 15 minutes at: :00, :15, :30, :45
  If cron runs at 13:45 → Send notification
  If cron runs at 13:30 → Wait until next cycle
  If cron runs at 14:00 → Still send (within 15 min window)
```

#### Key Variables in Database Query

| Field | Purpose | Example |
|-------|---------|---------|
| `next_due_at` | When task is due | `2026-05-15T14:00:00Z` |
| `notification_minutes_before` | Minutes before due time to notify | `15` |
| `notification_enabled` | Whether notifications are enabled for this task | `true` |
| `is_active` | Whether task is active | `true` |

---

## 2. Service Worker: Push Event Handler

### File: [public/sw.js](public/sw.js) (Lines 125-156)

**Purpose**: Receives and displays push notifications from the server.

```javascript
// When a push notification is received from server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🦎 Habitat Builder - Care Reminder';
  const options = {
    body: data.body || 'You have a care task due',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'task-reminder',
    data: {
      url: data.url || '/care-calendar',
      taskId: data.taskId
    },
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Task' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// When user clicks notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing Care Calendar window or open new one
      for (const client of clientList) {
        if (client.url.includes('/care-calendar') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
```

---

## 3. Client-Side Notification Service

### File: [src/services/notificationService.ts](src/services/notificationService.ts) (Lines 1-280)

**Purpose**: Manages browser/native push notification subscription and permission handling.

#### Web Push Subscription

```typescript
async subscribe(): Promise<void> {
  // 1. Request user permission
  if (Notification.permission !== 'granted') {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
  }

  // 2. Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // 3. Clean up old subscriptions (e.g., after PWA reinstall)
  await this.cleanupOldSubscriptions();

  // 4. Subscribe to push manager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
  });

  // 5. Save subscription to database
  await this.saveSubscription(subscription);
}
```

#### Subscription Validation on Login

```typescript
async validateAndCleanup(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const browserSubscription = await registration.pushManager.getSubscription();

  if (!browserSubscription) {
    // No browser subscription, clean up database entries
    await this.cleanupOldSubscriptions();
    return;
  }

  // Compare browser subscription endpoint with database entries
  const { data: dbSubscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint')
    .eq('user_id', userData.user.id);

  const browserEndpoint = browserSubscription.toJSON().endpoint;
  
  // If mismatch (e.g., after PWA reinstall), clean up and resave
  if (dbSubscriptions?.length && !dbSubscriptions.some(sub => sub.endpoint === browserEndpoint)) {
    await this.cleanupOldSubscriptions();
    await this.saveSubscription(browserSubscription);
  }
}
```

#### Called in App.tsx (Lines 37-44)

```typescript
// Validate and cleanup push notification subscriptions on login
useEffect(() => {
  if (!user) return;
  notificationService.validateAndCleanup().catch((error) => {
    console.error('Error validating push subscriptions:', error);
  });
}, [user]);
```

---

## 4. Care Task Service: Notification Field Mapping

### File: [src/services/careTaskService.ts](src/services/careTaskService.ts)

**Purpose**: Maps between frontend CareTask type and database schema.

#### Fields Related to Notifications

```typescript
// Database schema mapping (lines 440-448)
return {
  id: row.id,
  scheduledTime: row.scheduled_time,           // HH:MM format
  notificationEnabled: row.notification_enabled,
  notificationMinutesBefore: row.notification_minutes_before,
  // ... other fields
};

// When updating task (lines 477-482)
if (task.scheduledTime !== undefined) mapped.scheduled_time = task.scheduledTime;
if (task.notificationEnabled !== undefined) mapped.notification_enabled = task.notificationEnabled;
if (task.notificationMinutesBefore !== undefined) mapped.notification_minutes_before = task.notificationMinutesBefore;
```

#### Task Update with Notification Settings (Lines 188-195)

```typescript
await supabase
  .from('care_tasks')
  .update({
    notification_enabled: updates.notificationEnabled,
    notification_minutes_before: updates.notificationMinutesBefore,
    // ... other fields
  })
  .eq('id', taskId);

console.log('[careTaskService] Updating notification settings:', {
  taskId,
  notificationEnabled: updates.notificationEnabled,
  notificationMinutesBefore: updates.notificationMinutesBefore
});
```

---

## 5. Task Scheduling Utility

### File: [src/utils/taskScheduling.ts](src/utils/taskScheduling.ts)

**Purpose**: Calculates next due date based on task frequency and scheduled time.

```typescript
export function computeNextDueAt(
  frequency: TaskFrequency,
  scheduledTime: string,  // "HH:MM" format
  fromDate: Date = new Date()
): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);

  const at = (base: Date): Date => {
    const d = new Date(base);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const todayAt = at(fromDate);
  const timeHasPassed = fromDate >= todayAt;

  // Examples:
  // - 'daily': Today at scheduled time (if not passed), else tomorrow
  // - 'weekly': 3 days from now at scheduled time
  // - 'monthly': 14 days from now at scheduled time

  switch (frequency) {
    case 'daily':
      return timeHasPassed ? daysFromNow(1) : todayAt;
    case 'every-other-day':
      return daysFromNow(1);
    case 'twice-weekly':
      return daysFromNow(2);
    case 'weekly':
      return daysFromNow(3);
    // ... etc
  }
}
```

---

## 6. UI Components: Notification Preferences

### File: [src/components/CareCalendar/TaskCreationModal.tsx](src/components/CareCalendar/TaskCreationModal.tsx)

**Lines 660-670**: Notification UI in task creation

```tsx
<input 
  type="checkbox" 
  checked={task.notificationEnabled}
  onChange={(e) => setTasks(prev => { 
    const u = [...prev]; 
    u[index] = { ...u[index], notificationEnabled: e.target.checked }; 
    return u; 
  })}
/>

{task.notificationEnabled && (
  <input 
    type="number"
    value={task.notificationMinutesBefore}
    onChange={(e) => setTasks(prev => { 
      const u = [...prev]; 
      u[index] = { ...u[index], notificationMinutesBefore: parseInt(e.target.value) }; 
      return u; 
    })}
  />
)}
```

### File: [src/components/CareCalendar/TaskEditModal.tsx](src/components/CareCalendar/TaskEditModal.tsx)

**Lines 43-49**: Pre-fills notification settings when editing

```tsx
const [formData, setFormData] = useState({
  scheduledTime: task.scheduledTime,
  notificationEnabled: task.notificationEnabled ?? false,
  notificationMinutesBefore: task.notificationMinutesBefore || 15,
  // ... other fields
});
```

### File: [src/components/CareCalendar/NotificationPrompt.tsx](src/components/CareCalendar/NotificationPrompt.tsx)

**Lines 88**: Prompts user to enable push notifications when creating task with notifications

```tsx
'You enabled a notification for this task, but push notifications aren\'t set up yet. Enable now to receive reminders when your care tasks are due.'
```

---

## 7. Type Definitions

### File: [src/types/careCalendar.ts](src/types/careCalendar.ts) (Lines 50-65)

```typescript
export interface CareTask {
  id: string;
  user_id: string;
  title: string;
  type: TaskType;
  frequency: TaskFrequency;
  
  // Scheduling
  scheduledTime?: string;  // HH:MM format (e.g., "09:00")
  nextDueAt: Date;
  
  // Notifications
  notificationEnabled?: boolean;
  notificationMinutesBefore?: number;  // Default: 15 minutes
  
  // ... other fields
}
```

---

## 8. Cron Schedule Configuration

### File: [docs/EDGE_FUNCTION_DEPLOYMENT.md](docs/EDGE_FUNCTION_DEPLOYMENT.md) (Lines 44-70)

**Cron Schedule**: Runs every 15 minutes using Supabase pg_cron extension

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Schedule function to run every 15 minutes
select cron.schedule(
  'send-task-notifications-every-15-min',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  select net.http_post(
    url:='YOUR_EDGE_FUNCTION_URL/send-task-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**Cron Pattern Explanation**:
- `*/15 * * * *` = Every 15 minutes of every hour, every day
- Runs at: :00, :15, :30, :45 UTC

---

## 9. PWA Update Check (Client-Side Interval)

### File: [src/hooks/usePWAUpdate.ts](src/hooks/usePWAUpdate.ts) (Lines 87)

**Note**: This is for app updates, NOT task notifications.

```typescript
// Check for PWA updates every 30 minutes
updateCheckInterval = setInterval(checkForUpdate, 30 * 60 * 1000);
```

This is NOT related to task notifications—it just checks if a new app version is available.

---

## 10. Care Calendar View: Task Display

### File: [src/components/CareCalendar/CareCalendar.tsx](src/components/CareCalendar/CareCalendar.tsx)

**Loads tasks on component mount**:

```typescript
useEffect(() => {
  if (user) {
    loadTasks();
    loadEnclosures();
    loadAnimals();
  }
}, [user, location.key]);

const loadTasks = async () => {
  try {
    setLoading(true);
    const data = await careTaskService.getTasksWithLogs();
    setTasks(data);
  } catch (err) {
    console.error('Failed to load tasks:', err);
  } finally {
    setLoading(false);
  }
};
```

**Note**: This is NOT periodic polling—tasks are only loaded when the component mounts or the route changes. Real-time updates would require Supabase Realtime subscriptions (not currently implemented).

---

## Summary of Notification Flow

### Timeline Example

```
13:30 UTC - User creates task: "Feed Leo"
           - next_due_at: 2026-05-15T14:00:00Z
           - notificationMinutesBefore: 15
           - notificationEnabled: true
           - Task saved to database

13:45 UTC - Cron job triggers send-task-notifications
           - Calculates: notifyTime = 13:45 (14:00 - 15 min)
           - currentTime = 13:45
           - Condition: 13:45 >= 13:45 && 13:45 <= 14:00 ✓
           - Task qualifies for notification
           - Queries browser subscriptions for this user
           - Calls webpush.sendNotification()
           - Service worker receives push event
           - Shows browser notification

14:00 UTC - Cron job triggers again
           - currentTime = 14:00
           - Condition: 14:00 >= 13:45 && 14:00 <= 14:00 ✓
           - Task STILL qualifies (within 15-min window)
           - Notification sent again? (Possible duplicate!)
           
14:15 UTC - Cron job triggers again
           - currentTime = 14:15
           - Condition: 14:15 >= 13:45 && 14:15 <= 14:00 ✗
           - Task no longer qualifies
           - Notification NOT sent
```

**Note**: The 15-minute notification window accounts for cron running every 15 minutes, but it may cause duplicate notifications if the task isn't marked as notified.

---

## Missing Pieces (Not Implemented)

### What's NOT Currently In Place:

1. ❌ **Client-side task polling** - No periodic check on client for overdue tasks
2. ❌ **Duplicate notification prevention** - No tracking of which tasks have already been notified
3. ❌ **Realtime updates** - No Supabase Realtime subscriptions for immediate task updates
4. ❌ **Background sync on app launch** - Service worker doesn't re-sync tasks when app is restored
5. ❌ **Local notification scheduling** - Commented code in CARE_REMINDERS_IMPLEMENTATION.md suggests this was considered but not implemented
6. ❌ **Offline notification queue** - No queueing system for notifications when server is unavailable

---

## Key Files Summary

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `supabase/functions/send-task-notifications/index.ts` | Server-side cron job | Every 15 minutes |
| `public/sw.js` | Service worker push handler | On-demand (push event) |
| `src/services/notificationService.ts` | Subscription management | On login |
| `src/services/careTaskService.ts` | Task CRUD + DB mapping | On demand |
| `src/utils/taskScheduling.ts` | Next due date calculation | On task creation |
| `src/components/CareCalendar/CareCalendar.tsx` | Task display UI | On route/user change |
| `docs/EDGE_FUNCTION_DEPLOYMENT.md` | Deployment guide | Reference |
| `src/hooks/usePWAUpdate.ts` | App update checker | Every 30 minutes |

---

## Configuration Required

### Environment Variables Needed

```env
# Frontend
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Backend (Supabase secrets)
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_EMAIL=mailto:your-email@example.com
APNS_KEY_ID=<apple-key-id>
APNS_TEAM_ID=<apple-team-id>
APNS_BUNDLE_ID=com.habitatbuilder.app
APNS_PRIVATE_KEY=<apple-private-key>
```

### Database Tables Required

- `care_tasks` - Task records with `notification_enabled`, `notification_minutes_before`, `next_due_at`
- `push_subscriptions` - Browser push subscriptions (Web Push API)
- `native_push_tokens` - Mobile device tokens (APNs for iOS/Android)
- `profiles` - User preferences
