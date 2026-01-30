# Smart Care Reminders - Technical Implementation Guide

## Overview
Smart Care Reminders automate routine enclosure maintenance tasks (feeding, misting, cleaning, equipment maintenance) through **PWA push notifications** with intelligent scheduling based on species-specific care requirements. Built as a Progressive Web App hosted on Netlify with offline-first architecture.

---

## 🏗️ Architecture (PWA + Netlify)

```
┌─────────────────────────────────────────────────────────────┐
│                  PWA Frontend (React + Vite)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Care Calendar│  │ Reminder UI  │  │ Notification │      │
│  │   Component  │  │   Settings   │  │   Center     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Service Worker (Background Sync)              │  │
│  │  • Local notification scheduling                      │  │
│  │  • Offline task queue                                 │  │
│  │  • Background periodic sync                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Netlify Functions (Serverless)                  │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Scheduled Function  │  │   Task Sync API      │        │
│  │   (Every 5 min)      │  │  (REST endpoints)    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Supabase (Database + Auth + Realtime)               │
│  • PostgreSQL database for care tasks                        │
│  • Row Level Security                                        │
│  • Realtime subscriptions for multi-device sync             │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ **Offline-first**: Works without internet, syncs when online
- ✅ **No external services**: No SendGrid/Twilio costs
- ✅ **Native notifications**: Browser/OS-level push notifications
- ✅ **Netlify hosting**: Free tier supports scheduled functions
- ✅ **PWA installable**: Add to home screen, app-like experience

---

## 📊 Database Schema (Supabase PostgreSQL)

### Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{
    "enabled": true,
    "quiet_hours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    },
    "sound": true,
    "vibrate": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enclosures
CREATE TABLE enclosures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Leo's Terrarium"
  animal_species TEXT NOT NULL, -- e.g., "whites-tree-frog"
  dimensions JSONB, -- { width, depth, height, units }
  setup_type TEXT, -- 'bioactive', 'standard'
  setup_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enclosures_user ON enclosures(user_id);
CREATE INDEX idx_enclosures_species ON enclosures(animal_species);

-- Care Tasks (species-specific templates)
CREATE TABLE care_task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_species TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'feeding', 'misting', 'cleaning', 'maintenance', 'health_check'
  title TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'every_n_days', 'custom'
  frequency_value INTEGER, -- For 'every_n_days' (e.g., 3 = every 3 days)
  default_time TIME, -- Preferred time of day
  is_critical BOOLEAN DEFAULT false, -- Red flag if missed
  estimated_duration INTEGER, -- Minutes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data
INSERT INTO care_task_templates (animal_species, task_type, title, description, frequency_type, default_time, is_critical, estimated_duration) VALUES
('whites-tree-frog', 'feeding', 'Feed Dusted Insects', 'Offer calcium-dusted crickets or roaches (3-4 appropriately sized)', 'every_n_days', '19:00', true, 10, 2),
('whites-tree-frog', 'misting', 'Evening Mist', 'Light misting to maintain 60-70% humidity', 'daily', '20:00', true, 5),
('whites-tree-frog', 'misting', 'Morning Mist', 'Light misting after lights turn on', 'daily', '08:00', true, 5),
('whites-tree-frog', 'cleaning', 'Spot Clean Waste', 'Remove fecal matter and uneaten food', 'daily', '09:00', false, 5),
('whites-tree-frog', 'cleaning', 'Water Dish Change', 'Empty, clean, and refill water dish with dechlorinated water', 'daily', '09:00', true, 5),
('whites-tree-frog', 'cleaning', 'Deep Clean', 'Full enclosure breakdown, disinfect surfaces', 'monthly', '10:00', false, 120),
('whites-tree-frog', 'maintenance', 'Check UVB Bulb Age', 'Replace if > 12 months old (mark date on bulb)', 'monthly', '10:00', true, 10),
('whites-tree-frog', 'maintenance', 'Inspect Equipment', 'Test thermostat, hygrometer calibration, timer function', 'weekly', '10:00', false, 15),
('whites-tree-frog', 'health_check', 'Weight Check', 'Weigh frog and log weight (normal: 60-80g adult)', 'weekly', '19:00', false, 5);

CREATE INDEX idx_task_templates_species ON care_task_templates(animal_species);

-- User's Active Care Tasks (instances based on templates)
CREATE TABLE care_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE,
  template_id UUID REFERENCES care_task_templates(id),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  frequency_type TEXT NOT NULL,
  frequency_value INTEGER,
  scheduled_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  last_completed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL, -- When next occurrence should trigger
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_care_tasks_enclosure ON care_tasks(enclosure_id);
CREATE INDEX idx_care_tasks_next_due ON care_tasks(next_due_at) WHERE is_enabled = true;

-- Care Logs (completion history)
CREATE TABLE care_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_task_id UUID REFERENCES care_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  skipped BOOLEAN DEFAULT false,
  metadata JSONB -- e.g., { weight: 65, food_type: 'crickets', quantity: 4 }
);

CREATE INDEX idx_care_logs_task ON care_logs(care_task_id);
CREATE INDEX idx_care_logs_enclosure ON care_logs(enclosure_id);

-- Notification Interaction Logs (for analytics only)
CREATE TABLE notification_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  care_task_id UUID REFERENCES care_tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'shown', 'clicked', 'dismissed', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_interactions_user ON notification_interactions(user_id);
CREATE INDEX idx_notification_interactions_task ON notification_interactions(care_task_id);

-- Push Subscriptions (for Web Push API - optional, can use local notifications only)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own enclosures" ON enclosures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tasks" ON care_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own logs" ON care_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own interactions" ON notification_interactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own push subs" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Templates are public (read-only)
ALTER TABLE care_task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are public" ON care_task_templates FOR SELECT USING (true);
```

---

## 🔔 PWA Notification System

### Architecture Choice: Local Notifications vs Web Push

We're using **local browser notifications** scheduled by the service worker, not server-push notifications. This means:
- ✅ No Firebase/FCM setup required
- ✅ Works completely offline
- ✅ No server costs for notification delivery
- ✅ Privacy-friendly (no tracking)
- ❌ Only works when browser is open (but PWA keeps service worker alive)

### 1. PWA Manifest Configuration

**File: `public/manifest.json`**

```json
{
  "name": "Habitat Builder",
  "short_name": "HabBuild",
  "description": "Smart enclosure planning & care reminders for reptile and amphibian keepers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/logo-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["pets", "lifestyle", "utilities"],
  "orientation": "portrait-primary",
  "scope": "/",
  "permissions": [
    "notifications",
    "periodicBackgroundSync"
  ]
}
```

### 2. Service Worker with Local Notifications (Frontend)

**File: `src/services/pushNotifications.ts`**

```typescript
import { supabase } from './supabase';

// Check if browser supports push notifications
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request permission and register push subscription
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get public VAPID key from backend
    const { data: config } = await supabase.functions.invoke('get-push-config');
    const publicVapidKey = config.publicKey;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Save subscription to database
    const subscriptionJson = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: userId,
      endpoint: subscriptionJson.endpoint,
      auth_key: subscriptionJson.keys?.auth,
      p256dh_key: subscriptionJson.keys?.p256dh,
      user_agent: navigator.userAgent
    });

    if (error) throw error;

    console.log('Push subscription registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Unsubscribe from push
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await subscription.unsubscribe();
    
    // Remove from database
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint);
  }
}
```

**Service Worker: `public/sw.js`**

```javascript
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

const CACHE_NAME = 'habitat-builder-v1';
const DB_NAME = 'care-reminders-db';
const TASK_STORE = 'scheduled-tasks';

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/logo-192.png',
        '/logo-512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Periodic background sync to check for due tasks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-care-tasks') {
    event.waitUntil(checkAndNotifyDueTasks());
  }
});

// Check for due tasks and show notifications
async function checkAndNotifyDueTasks() {
  try {
    // Open IndexedDB to get scheduled tasks
    const db = await idb.openDB(DB_NAME, 1);
    const now = new Date();
    const tasks = await db.getAll(TASK_STORE);

    for (const task of tasks) {
      const dueTime = new Date(task.next_due_at);
      
      // If task is due within next 5 minutes and not yet notified
      if (dueTime <= new Date(now.getTime() + 5 * 60000) && !task.notified_today) {
        await showTaskNotification(task);
        
        // Mark as notified to prevent duplicates
        task.notified_today = true;
        await db.put(TASK_STORE, task);
      }
    }
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
}

// Show notification for a task
async function showTaskNotification(task) {
  const options = {
    body: task.description || `Time for: ${task.title}`,
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    tag: `care-task-${task.id}`,
    data: {
      taskId: task.id,
      url: '/care-tasks'
    },
    actions: [
      { action: 'complete', title: '✓ Complete' },
      { action: 'snooze', title: '⏰ Snooze 1hr' },
      { action: 'view', title: 'View Details' }
    ],
    requireInteraction: task.is_critical || false,
    vibrate: [200, 100, 200],
    sound: '/notification.mp3'
  };

  await self.registration.showNotification(
    `🦎 ${task.title}`,
    options
  );
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const taskId = event.notification.data.taskId;

  if (event.action === 'complete') {
    // Open app and trigger completion
    event.waitUntil(
      clients.openWindow(`/care-tasks?complete=${taskId}`)
    );
  } else if (event.action === 'snooze') {
    // Reschedule notification for 1 hour from now
    event.waitUntil(
      snoozeTask(taskId, 60) // 60 minutes
    );
  } else {
    // Open app to care tasks page
    event.waitUntil(
      clients.openWindow('/care-tasks')
    );
  }
});

// Snooze task by updating next_due_at
async function snoozeTask(taskId, minutes) {
  try {
    const db = await idb.openDB(DB_NAME, 1);
    const task = await db.get(TASK_STORE, taskId);
    
    if (task) {
      const newDueTime = new Date(Date.now() + minutes * 60000);
      task.next_due_at = newDueTime.toISOString();
      task.notified_today = false; // Allow re-notification
      await db.put(TASK_STORE, task);
      
      // Sync to server when online
      if (navigator.onLine) {
        await fetch('/.netlify/functions/update-task', {
          method: 'POST',
          body: JSON.stringify({
            taskId,
            next_due_at: task.next_due_at
          })
        });
      }
    }
  } catch (error) {
    console.error('Error snoozing task:', error);
  }
}
```
```

### 3. Netlify Scheduled Function (Background Task Sync)

**File: `netlify/functions/sync-care-tasks.ts`**

```typescript
import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// This function runs every hour to calculate and update next_due_at for recurring tasks
// Client-side service workers handle actual notification delivery
const handler: Handler = async (event) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();

    // Find completed tasks that need their next occurrence calculated
    const { data: completedTasks } = await supabase
      .from('care_logs')
      .select(`
        care_task_id,
        care_tasks!inner(
          id,
          frequency_type,
          frequency_value,
          scheduled_time,
          next_due_at
        )
      `)
      .gte('completed_at', new Date(now.getTime() - 60 * 60000).toISOString()); // Last hour

    if (!completedTasks || completedTasks.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ processed: 0, message: 'No tasks to update' })
      };
    }

    // Update next_due_at for each completed task
    const updates = completedTasks.map(async (log: any) => {
      const task = log.care_tasks;
      const nextDue = calculateNextDue(task, now);
      
      return supabase
        .from('care_tasks')
        .update({ 
          next_due_at: nextDue.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', task.id);
    });

    await Promise.all(updates);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        processed: updates.length,
        message: 'Tasks updated successfully'
      })
    };
  } catch (error) {
    console.error('Task sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message })
    };
  }
};

// Run every hour
export const handler = schedule('@hourly', handler);

function calculateNextDue(task: any, fromDate: Date = new Date()): Date {
  const now = new Date();
  const [hour, minute] = task.scheduled_time.split(':').map(Number);

  switch (task.frequency_type) {
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);
      return tomorrow;

    case 'every_n_days':
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + task.frequency_value);
      nextDay.setHours(hour, minute, 0, 0);
      return nextDay;

    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(hour, minute, 0, 0);
      return nextWeek;

    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(hour, minute, 0, 0);
      return nextMonth;

    default:
      return fromDate;
  }
}
```

**Netlify Configuration: `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-functions-install-core"

# PWA headers for service worker
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

---

## 🎨 Frontend Components

### Care Task Manager Component

**File: `src/components/CareReminders/CareTaskManager.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { subscribeToPushNotifications } from '../../services/pushNotifications';

interface CareTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  frequency_type: string;
  scheduled_time: string;
  is_critical: boolean;
  next_due_at: string;
  last_completed_at: string | null;
}

export function CareTaskManager({ enclosureId }: { enclosureId: string }) {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    checkNotificationStatus();
  }, [enclosureId]);

  async function loadTasks() {
    const { data, error } = await supabase
      .from('care_tasks')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .eq('is_enabled', true)
      .order('next_due_at');

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  }

  async function checkNotificationStatus() {
    const permission = await Notification.permission;
    setNotificationsEnabled(permission === 'granted');
  }

  async function enableNotifications() {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const success = await subscribeToPushNotifications(user.data.user.id);
    if (success) {
      setNotificationsEnabled(true);
    }
  }

  async function completeTask(taskId: string) {
    const { error } = await supabase.from('care_logs').insert({
      care_task_id: taskId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      enclosure_id: enclosureId,
      completed_at: new Date().toISOString()
    });

    if (!error) {
      loadTasks(); // Refresh list
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Care Reminders</h3>
        {!notificationsEnabled && (
          <button
            onClick={enableNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onComplete={completeTask} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onComplete }: { task: CareTask; onComplete: (id: string) => void }) {
  const isDue = new Date(task.next_due_at) <= new Date();
  const isOverdue = isDue && !task.last_completed_at;

  return (
    <div className={`border rounded-lg p-4 ${isOverdue ? 'border-red-500' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{task.title}</h4>
            {task.is_critical && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Critical</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {task.scheduled_time}
            </span>
            <span>Next: {new Date(task.next_due_at).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => onComplete(task.id)}
          className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </button>
      </div>
    </div>
  );
}
```

---

## 📱 Integration Points

### 1. Animal Profile → Auto-Generate Tasks

When user creates an enclosure, automatically create care tasks from templates:

```typescript
// In generatePlan.ts or DesignView.tsx
async function setupEnclosureWithCare(input: EnclosureInput, userId: string) {
  // 1. Create enclosure
  const { data: enclosure } = await supabase
    .from('enclosures')
    .insert({
      user_id: userId,
      name: `${animalProfile.commonName} Enclosure`,
      animal_species: input.animal,
      dimensions: { width: input.width, depth: input.depth, height: input.height },
      setup_type: input.bioactive ? 'bioactive' : 'standard',
      setup_date: new Date().toISOString()
    })
    .select()
    .single();

  // 2. Load task templates for this species
  const { data: templates } = await supabase
    .from('care_task_templates')
    .select('*')
    .eq('animal_species', input.animal);

  // 3. Create care tasks from templates
  const tasks = templates.map(template => ({
    enclosure_id: enclosure.id,
    template_id: template.id,
    user_id: userId,
    title: template.title,
    description: template.description,
    task_type: template.task_type,
    frequency_type: template.frequency_type,
    frequency_value: template.frequency_value,
    scheduled_time: template.default_time,
    is_critical: template.is_critical,
    next_due_at: calculateFirstDue(template.default_time)
  }));

  await supabase.from('care_tasks').insert(tasks);

  return enclosure;
}

function calculateFirstDue(scheduledTime: string): string {
  const [hour, minute] = scheduledTime.split(':').map(Number);
  const now = new Date();
  const firstDue = new Date(now);
  firstDue.setHours(hour, minute, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (firstDue <= now) {
    firstDue.setDate(firstDue.getDate() + 1);
  }
  
  return firstDue.toISOString();
}
```

### 2. Plan View → Upsell Banner

Add prominent reminder system upsell in PlanView:

```typescript
// In PlanView.tsx
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
  <div className="flex items-start gap-4">
    <Bell className="w-10 h-10 text-emerald-600" />
    <div className="flex-1">
      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mb-2">
        Never Miss a Care Task!
      </h3>
      <p className="text-emerald-800 dark:text-emerald-300 mb-4">
        Get automatic reminders for feeding, misting, and maintenance. Track your frog's health over time with our smart care calendar.
      </p>
      <button
        onClick={() => navigate('/upgrade?feature=care-reminders')}
        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        Enable Smart Reminders → $29
      </button>
    </div>
  </div>
</div>
```

---

## 🚀 Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Supabase Auth (Google + email/password)
- [ ] Create database schema (tables + RLS policies)
- [ ] Populate `care_task_templates` for 5 species (start with White's Tree Frog)
- [ ] Build basic CareTaskManager component
- [ ] Implement task completion logging

### Phase 2: PWA Setup (Week 3)
- [ ] Create `manifest.json` with app icons
- [ ] Build service worker (`sw.js`) with notification scheduling
- [ ] Implement IndexedDB for offline task storage
- [ ] Add periodic background sync API
- [ ] Test PWA installation on mobile/desktop

### Phase 3: Notifications (Week 4-5)
- [ ] Implement local notification scheduling in service worker
- [ ] Add notification permission flow
- [ ] Create Netlify scheduled function for task sync
- [ ] Test notifications across devices
- [ ] Add snooze/complete actions in notifications

### Phase 4: Polish & Launch (Week 6-7)
- [ ] Add quiet hours logic (client-side)
- [ ] Create notification history/inbox component
- [ ] Build analytics dashboard (completion rates)
- [ ] Add PWA install prompt
- [ ] Launch beta to 50 test users

---

## 💰 Pricing Integration

**Free Tier:**
- Up to 2 enclosures
- PWA notifications (up to 5 active reminders)
- Basic task templates

**Pro Tier ($9.99/mo):**
- Unlimited enclosures
- Unlimited PWA notifications
- Custom task scheduling
- Health tracking logs with trends
- Advanced analytics dashboard
- Multi-device sync

**Care Bundle ($29 one-time):**
- Everything in Pro for 1 year
- Video masterclass
- Printable care guides PDF
- Discord access
- Priority support

---

## 📊 Success Metrics

Track these KPIs in your analytics:

1. **Activation Rate** - % of users who enable notifications
2. **Notification Open Rate** - % of push notifications clicked
3. **Task Completion Rate** - % of reminders acted upon
4. **Retention** - Weekly active users with enabled reminders
5. **Upgrade Conversion** - Free → Pro conversion from reminder upsell

**Target Benchmarks:**
- 40%+ activation rate (users enable notifications)
- 25%+ notification open rate
- 70%+ task completion rate
- 60%+ weekly retention for users with active reminders

---

## 🔒 Security Considerations

1. **API Keys**: Store all keys in Supabase Edge Function secrets
2. **RLS**: Strict row-level security on all tables
3. **Rate Limiting**: Prevent notification spam (max 10/hour per user)
4. **Opt-Out**: Easy unsubscribe from all notifications
5. **Data Privacy**: GDPR-compliant data handling, allow full deletion

---

## 🎯 Next Steps

1. **Start with PWA setup**: Create manifest.json and basic service worker
2. **Pick 1 species**: White's Tree Frog (your expertise)
3. **Test locally**: Install PWA on your device, verify notifications work
4. **Deploy to Netlify**: Test with 10 beta users
5. **Track metrics**: Use Netlify Analytics + Supabase for usage data

**Ready to build? Start with PWA manifest and service worker, then add database!** 🚀
