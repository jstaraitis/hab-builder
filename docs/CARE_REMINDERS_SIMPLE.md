# Smart Care Reminders - Single User Implementation (Simplest Path)

## For Personal Use Only - No Auth, No Backend Needed

Since you're the only user, we can skip 90% of the complexity:
- ❌ No Supabase/database
- ❌ No authentication
- ❌ No Netlify functions
- ❌ No server-side code at all
- ✅ Just localStorage + service worker + browser notifications

**Total implementation time: 2-3 hours**

---

## 🎯 Minimal Architecture

```
┌─────────────────────────────────────────┐
│      Your React App (Habitat Builder)   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Care Task Manager Component      │ │
│  │   - Add/edit/complete tasks        │ │
│  │   - Stored in localStorage         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│     Service Worker (sw.js)              │
│  - Reads tasks from localStorage        │
│  - Shows notifications when due         │
│  - Runs every 5 minutes via interval    │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│   Browser Notification API              │
│   (Built into Chrome/Edge/Firefox)      │
└─────────────────────────────────────────┘
```

---

## 📦 Step 1: Data Structure (localStorage)

**File: `src/types/careReminders.ts`** (if not exists, add to existing types.ts)

```typescript
export interface CareTask {
  id: string;
  enclosureId: string; // Link to your enclosure
  title: string;
  description: string;
  type: 'feeding' | 'misting' | 'cleaning' | 'maintenance' | 'health_check';
  frequencyType: 'daily' | 'every_n_days' | 'weekly' | 'monthly';
  frequencyValue?: number; // For 'every_n_days' (e.g., feed every 2 days)
  scheduledTime: string; // "HH:MM" format (e.g., "19:00")
  nextDueAt: string; // ISO date string
  lastCompletedAt?: string; // ISO date string
  isCritical: boolean;
  isEnabled: boolean;
  createdAt: string;
}

export interface CareLog {
  id: string;
  taskId: string;
  completedAt: string;
  notes?: string;
}
```

---

## 🔧 Step 2: Simple Care Task Service

**File: `src/services/careTaskService.ts`**

```typescript
import type { CareTask, CareLog } from '../types/careReminders';

const TASKS_KEY = 'habitat-builder-care-tasks';
const LOGS_KEY = 'habitat-builder-care-logs';

// Get all tasks from localStorage
export function getAllTasks(): CareTask[] {
  const stored = localStorage.getItem(TASKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save tasks to localStorage
export function saveTasks(tasks: CareTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  // Notify service worker of update
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TASKS_UPDATED'
    });
  }
}

// Add new task
export function addTask(task: Omit<CareTask, 'id' | 'createdAt'>): CareTask {
  const tasks = getAllTasks();
  const newTask: CareTask = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

// Update task
export function updateTask(id: string, updates: Partial<CareTask>): void {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
  }
}

// Delete task
export function deleteTask(id: string): void {
  const tasks = getAllTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

// Complete task (log it and calculate next due date)
export function completeTask(id: string, notes?: string): void {
  const tasks = getAllTasks();
  const task = tasks.find(t => t.id === id);
  
  if (!task) return;
  
  // Add to logs
  const logs = getLogs();
  logs.push({
    id: crypto.randomUUID(),
    taskId: id,
    completedAt: new Date().toISOString(),
    notes
  });
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  
  // Update task with next due date
  const now = new Date();
  const nextDue = calculateNextDue(task, now);
  
  updateTask(id, {
    lastCompletedAt: now.toISOString(),
    nextDueAt: nextDue.toISOString()
  });
}

// Get completion logs
export function getLogs(): CareLog[] {
  const stored = localStorage.getItem(LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Calculate next due date based on frequency
function calculateNextDue(task: CareTask, fromDate: Date): Date {
  const [hour, minute] = task.scheduledTime.split(':').map(Number);
  const next = new Date(fromDate);
  
  switch (task.frequencyType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'every_n_days':
      next.setDate(next.getDate() + (task.frequencyValue || 1));
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  next.setHours(hour, minute, 0, 0);
  return next;
}

// Create default tasks for an animal (call this after creating enclosure)
export function createDefaultTasksForAnimal(
  enclosureId: string,
  animalSpecies: string
): void {
  // Example: White's Tree Frog defaults
  if (animalSpecies === 'whites-tree-frog') {
    const now = new Date();
    
    const defaultTasks = [
      {
        enclosureId,
        title: 'Feed Dusted Insects',
        description: 'Offer 3-4 calcium-dusted crickets or roaches',
        type: 'feeding' as const,
        frequencyType: 'every_n_days' as const,
        frequencyValue: 2,
        scheduledTime: '19:00',
        isCritical: true,
        isEnabled: true
      },
      {
        enclosureId,
        title: 'Evening Mist',
        description: 'Light misting to maintain 60-70% humidity',
        type: 'misting' as const,
        frequencyType: 'daily' as const,
        scheduledTime: '20:00',
        isCritical: true,
        isEnabled: true
      },
      {
        enclosureId,
        title: 'Morning Mist',
        description: 'Light morning mist',
        type: 'misting' as const,
        frequencyType: 'daily' as const,
        scheduledTime: '08:00',
        isCritical: true,
        isEnabled: true
      },
      {
        enclosureId,
        title: 'Water Dish Change',
        description: 'Empty, clean, and refill with dechlorinated water',
        type: 'cleaning' as const,
        frequencyType: 'daily' as const,
        scheduledTime: '09:00',
        isCritical: true,
        isEnabled: true
      },
      {
        enclosureId,
        title: 'Check UVB Bulb Age',
        description: 'Replace if > 12 months old',
        type: 'maintenance' as const,
        frequencyType: 'monthly' as const,
        scheduledTime: '10:00',
        isCritical: true,
        isEnabled: true
      }
    ];
    
    defaultTasks.forEach(task => {
      const nextDue = calculateNextDue(
        { ...task, id: '', createdAt: '', nextDueAt: '' } as CareTask,
        now
      );
      addTask({
        ...task,
        nextDueAt: nextDue.toISOString()
      });
    });
  }
}
```

---

## 🔔 Step 3: Service Worker (Notifications)

**File: `public/sw.js`**

```javascript
const CACHE_NAME = 'habitat-builder-v1';
const TASKS_KEY = 'habitat-builder-care-tasks';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Install service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  // Start checking for due tasks
  startTaskChecker();
});

// Listen for messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TASKS_UPDATED') {
    console.log('Tasks updated, will check on next interval');
  }
});

// Check for due tasks periodically
let checkInterval;
function startTaskChecker() {
  if (checkInterval) clearInterval(checkInterval);
  
  checkInterval = setInterval(() => {
    checkDueTasks();
  }, CHECK_INTERVAL);
  
  // Also check immediately
  checkDueTasks();
}

async function checkDueTasks() {
  try {
    // Read tasks from localStorage (service worker has access to localStorage)
    const stored = await getLocalStorage(TASKS_KEY);
    if (!stored) return;
    
    const tasks = JSON.parse(stored);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
    
    for (const task of tasks) {
      if (!task.isEnabled) continue;
      
      const dueDate = new Date(task.nextDueAt);
      
      // If task is due within next 5 minutes and hasn't been notified today
      if (dueDate <= fiveMinutesFromNow && dueDate > new Date(now.getTime() - 60000)) {
        await showTaskNotification(task);
      }
    }
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
}

// Show notification for a task
async function showTaskNotification(task) {
  const options = {
    body: task.description,
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    tag: `care-task-${task.id}`,
    data: {
      taskId: task.id,
      url: '/care-tasks'
    },
    actions: [
      { action: 'complete', title: '✓ Done' },
      { action: 'snooze', title: '⏰ +1hr' }
    ],
    requireInteraction: task.isCritical,
    vibrate: [200, 100, 200]
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
    // Open app to complete task
    event.waitUntil(
      clients.openWindow(`/care-tasks?complete=${taskId}`)
    );
  } else if (event.action === 'snooze') {
    // Snooze for 1 hour (handled by app when opened)
    event.waitUntil(
      clients.openWindow(`/care-tasks?snooze=${taskId}`)
    );
  } else {
    // Just open app
    event.waitUntil(
      clients.openWindow('/care-tasks')
    );
  }
});

// Helper to read localStorage (service workers can't access it directly in newer browsers)
async function getLocalStorage(key) {
  // Get all window clients
  const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
  
  if (allClients.length === 0) {
    // No windows open - can't access localStorage
    return null;
  }
  
  // Ask a window to read localStorage for us
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    allClients[0].postMessage({
      type: 'GET_LOCALSTORAGE',
      key: key
    }, [messageChannel.port2]);
  });
}
```

---

## 🎨 Step 4: React Component

**File: `src/components/CareReminders/SimpleCareManager.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { 
  getAllTasks, 
  completeTask, 
  addTask, 
  deleteTask,
  createDefaultTasksForAnimal 
} from '../../services/careTaskService';
import type { CareTask } from '../engine/types';

export function SimpleCareManager() {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadTasks();
    checkNotificationPermission();
    registerServiceWorker();
    listenForMessages();
  }, []);

  async function loadTasks() {
    setTasks(getAllTasks());
  }

  async function checkNotificationPermission() {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }

  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  async function enableNotifications() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        // Test notification
        new Notification('🦎 Care Reminders Enabled!', {
          body: 'You\'ll get notifications when tasks are due',
          icon: '/logo-192.png'
        });
      }
    }
  }

  function handleComplete(taskId: string) {
    completeTask(taskId);
    loadTasks();
  }

  function handleDelete(taskId: string) {
    if (confirm('Delete this reminder?')) {
      deleteTask(taskId);
      loadTasks();
    }
  }

  // Listen for messages from service worker
  function listenForMessages() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        // Service worker asking for localStorage data
        if (event.data && event.data.type === 'GET_LOCALSTORAGE') {
          const value = localStorage.getItem(event.data.key);
          event.ports[0].postMessage(value);
        }
      });
    }
  }

  // Get due/upcoming tasks
  const now = new Date();
  const dueTasks = tasks.filter(t => t.isEnabled && new Date(t.nextDueAt) <= now);
  const upcomingTasks = tasks.filter(t => t.isEnabled && new Date(t.nextDueAt) > now);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Care Reminders</h2>
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

        {/* Due Now */}
        {dueTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Due Now</h3>
            <div className="space-y-2">
              {dueTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  isDue={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onComplete={handleComplete}
                onDelete={handleDelete}
                isDue={false}
              />
            ))}
          </div>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No care reminders set up yet.</p>
            <p className="text-sm mt-2">
              Create an enclosure to automatically add care tasks!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  onComplete, 
  onDelete,
  isDue 
}: { 
  task: CareTask; 
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isDue: boolean;
}) {
  const dueDate = new Date(task.nextDueAt);
  const isToday = dueDate.toDateString() === new Date().toDateString();
  
  return (
    <div className={`border rounded-lg p-4 ${isDue ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{task.title}</h4>
            {task.isCritical && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                Critical
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {task.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {task.scheduledTime}
            </span>
            <span>
              {isToday ? 'Today' : dueDate.toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onComplete(task.id)}
            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            title="Mark complete"
          >
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Step 5: Integration with Your App

### Add to DesignView (after plan generation):

```typescript
// In DesignView.tsx, after user creates an enclosure
import { createDefaultTasksForAnimal } from '../services/careTaskService';

function handleCreateEnclosure(input: EnclosureInput) {
  // ... your existing plan generation code ...
  
  // Add care reminders
  const enclosureId = crypto.randomUUID(); // or however you ID enclosures
  createDefaultTasksForAnimal(enclosureId, input.animal);
  
  // Show success message
  alert('Enclosure created with automatic care reminders!');
}
```

### Add route in App.tsx:

```typescript
// In App.tsx
import { SimpleCareManager } from './components/CareReminders/SimpleCareManager';

// Add route
<Route path="/care-reminders" element={<SimpleCareManager />} />
```

### Add to navigation:

```typescript
<Link to="/care-reminders" className="nav-link">
  🔔 Care Reminders
</Link>
```

---

## 🎯 Testing Locally

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools → Application → Service Workers**
   - Verify `sw.js` is registered

3. **Enable notifications:**
   - Click "Enable Notifications" button
   - Grant permission when prompted

4. **Test a task:**
   - Create an enclosure (or manually add a task)
   - Set `nextDueAt` to 2 minutes from now
   - Wait 2 minutes
   - You should see a browser notification!

---

## 📱 Deploy to Netlify (Optional)

If you want to access from phone:

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod
   ```

3. **Enable HTTPS** (required for service workers)
   - Netlify provides this automatically

4. **Install as PWA on your phone:**
   - Open site in Chrome/Safari
   - Tap "Add to Home Screen"
   - Now you have a native-feeling app!

---

## 🎉 Done!

**Total files created/modified:**
1. `src/types/careReminders.ts` (or add to existing types)
2. `src/services/careTaskService.ts` (new)
3. `public/sw.js` (new)
4. `src/components/CareReminders/SimpleCareManager.tsx` (new)
5. `src/App.tsx` (add route)
6. `src/components/Views/DesignView.tsx` (call createDefaultTasksForAnimal)

**What you get:**
- ✅ Automatic care reminders for your White's Tree Frog
- ✅ Browser notifications when tasks are due
- ✅ Simple UI to manage tasks
- ✅ Works offline
- ✅ No database, no auth, no backend costs
- ✅ Takes 2-3 hours to implement

**Limitations (acceptable for personal use):**
- Only works on devices where you access the app
- Data stored locally (not synced across devices)
- Can't share with others
- No history/analytics beyond basic logs

**If you want to upgrade later:**
- Add Supabase for multi-device sync
- Add auth for multiple users
- Add analytics dashboard
- This simple version can easily migrate to the full system!

---

## 🐛 Troubleshooting

**Notifications not showing?**
- Check browser console for errors
- Verify service worker is active (DevTools → Application)
- Make sure you granted notification permission
- Try in Chrome (best PWA support)

**Tasks not updating?**
- Check localStorage in DevTools → Application → Local Storage
- Verify `habitat-builder-care-tasks` key exists
- Clear cache and reload if needed

**Service worker not registering?**
- Must be served over HTTPS (or localhost)
- Check for syntax errors in `sw.js`
- Try unregister and re-register in DevTools

---

Start with this simple version, and once it's working for you, we can add the full multi-user system!
