import React, { useState, useEffect, memo } from 'react';
import { 
  Pencil, 
  Check,
  CheckCircle2,
  SkipForward,
  UtensilsCrossed, 
  Droplets, 
  Waves, 
  Brush, 
  Sparkles, 
  Stethoscope,
  Pill,
  Wrench,
  FileText,
  Flame,
  Plus,
  ChevronDown,
  Hand,
  Calendar,
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  CalendarClock,
  BarChart3,
  Thermometer,
  AlertTriangle,
  Leaf,
  Bug,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { useToast } from '../../contexts/ToastContext';
import { Auth } from '../Auth';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { estimateCustomWeekdayOccurrences } from '../../utils/customTaskFrequency';
import { FeedingLogModal } from './FeedingLogModal';
import { EnvironmentReadingsModal } from './EnvironmentReadingsModal';
import { CareAnalyticsDashboard } from '../CareAnalytics';
import { PremiumPaywall } from '../Upgrade/PremiumPaywall';
import type { CareTaskWithLogs, TaskType, CareTask, CareLog, Enclosure, EnclosureAnimal, TaskFrequency } from '../../types/careCalendar';

type ViewMode = 'all' | 'today' | 'week' | 'analytics';
type TimeBlock = 'overdue' | 'morning' | 'afternoon' | 'evening' | 'night' | 'tomorrow' | 'week' | 'future';
type TaskActionMode = 'skip' | 'snooze' | 'reschedule';
type EditableFrequency = Exclude<TaskFrequency, 'custom'>;

const EDITABLE_FREQUENCIES: { value: EditableFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: 'twice-weekly', label: 'Twice Weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as-needed', label: 'As Needed' },
];

const SNOOZE_OPTIONS_HOURS = [1, 3, 24, 72] as const;

const toDateTimeLocalInputValue = (value: Date): string => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};


// Memoized Task Item Component for better list performance
const TaskItem = memo(({ 
  task, 
  isOverdue, 
  isDueToday,
  selectionMode,
  selectedTasks,
  swipedTask,
  swipeOffset,
  getTaskIcon,
  getEnclosureName,
  getAnimalName,
  formatTime,
  formatShortDate,
  onToggleSelection,
  onEdit,
  onSkip,
  onComplete,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  task: CareTaskWithLogs;
  isOverdue: boolean;
  isDueToday: boolean;
  selectionMode: boolean;
  selectedTasks: Set<string>;
  swipedTask: string | null;
  swipeOffset: number;
  getTaskIcon: (type: TaskType) => LucideIcon;
  getEnclosureName: (id?: string) => string | null;
  getAnimalName: (id?: string) => string | null;
  formatTime: (time: string) => string;
  formatShortDate: (date: Date) => string;
  onToggleSelection: (id: string) => void;
  onEdit: (id: string) => void;
  onSkip: (id: string) => void;
  onComplete: (id: string) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent, id: string) => void;
}) => {
  const isBeingSwiped = swipedTask === task.id;
  const swipeTransform = isBeingSwiped ? `translateX(${swipeOffset}px)` : 'translateX(0)';

  const animalName = task.enclosureAnimalId ? getAnimalName(task.enclosureAnimalId) : null;
  const enclosureName = task.enclosureId ? getEnclosureName(task.enclosureId) : null;
  // Name the animal when we have one; fall back to the enclosure. Showing both
  // is how "Sir Rand Barnaby · Sir Rand Barnaby" ends up on a row.
  const subject = animalName ?? enclosureName;
  // Inside a dated section the date is already stated — only the time adds
  // anything, and only for tasks that carry one.
  const when = task.scheduledTime
    ? (isDueToday || isOverdue
        ? formatTime(task.scheduledTime)
        : `${formatShortDate(task.nextDueAt)} ${formatTime(task.scheduledTime)}`)
    : null;
  const contextLine = [subject, when].filter(Boolean).join(' · ');


  return (
    <div className="relative overflow-hidden">
      {/* Swipe Action Background */}
      <div className="absolute inset-0 sm:hidden flex items-center justify-end px-4 bg-accent">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Check className="w-5 h-5" />
          <span>Complete</span>
        </div>
      </div>
      
      {/* Task Content */}
      <div
        className="relative bg-card px-4 py-3 touch-pan-y"
        style={{ transform: swipeTransform, transition: isBeingSwiped ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={(e) => onTouchStart(e, task.id)}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => onTouchEnd(e, task.id)}
      >
        <div className="flex items-center gap-3">
          {selectionMode && (
            <input
              type="checkbox"
              checked={selectedTasks.has(task.id)}
              onChange={() => onToggleSelection(task.id)}
              className="w-4 h-4 text-accent border-gray-300 rounded"
            />
          )}

          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isOverdue ? 'bg-red-500/15' : isDueToday ? 'bg-accent/15' : 'bg-card-elevated'
          }`}>
            {React.createElement(getTaskIcon(task.type), {
              className: `w-4 h-4 ${isOverdue ? 'text-red-400' : isDueToday ? 'text-accent' : 'text-muted'}`
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{task.title || 'Untitled Task'}</p>
            {/* One context line: who and when. The enclosure is dropped when
                it repeats the animal's name (keepers often name the tank after
                the animal), and recurrence + streak move to the edit screen —
                they're authoring detail, noise while working through a list. */}
            <p className="text-[11px] text-muted truncate mt-0.5">{contextLine}</p>
            {task.notes && (
              <p className="text-[11px] text-muted/80 mt-0.5 truncate">{task.notes}</p>
            )}
          </div>

          {/* Actions */}
          {!selectionMode && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onEdit(task.id)}
                className="p-1.5 hover:bg-card-elevated rounded-lg transition-colors"
                title="Edit task"
              >
                <Pencil className="w-3.5 h-3.5 text-muted" />
              </button>
              <button
                onClick={() => onSkip(task.id)}
                className="p-1.5 bg-card-elevated text-muted rounded-lg transition-colors hover:text-white"
                title="Skip, snooze, or reschedule"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => onComplete(task.id)}
                className="p-1.5 bg-accent text-on-accent rounded-lg transition-colors"
                title="Mark as done"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export function CareCalendar() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]); // All animals from all enclosures
  const [filterEnclosureId, setFilterEnclosureId] = useState<string>('');
  const [filterAnimalId, setFilterAnimalId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedingTask, setFeedingTask] = useState<CareTask | null>(null);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [envTask, setEnvTask] = useState<CareTaskWithLogs | null>(null);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [swipedTask, setSwipedTask] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<TaskActionMode>('skip');
  const [skipReason, setSkipReason] = useState('');
  const [snoozeHours, setSnoozeHours] = useState<number>(24);
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [updateFrequencyOnSkip, setUpdateFrequencyOnSkip] = useState(false);
  const [updatedFrequency, setUpdatedFrequency] = useState<EditableFrequency>('weekly');
  const [bulkConfirm, setBulkConfirm] = useState<{ label: string; tasks: CareTaskWithLogs[] } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  useEffect(() => {
    if (user) {
      loadTasks();
      loadEnclosures();
      loadAnimals();
    }
  }, [user, location.key]);

  // Show auth screen if not logged in
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <Auth />
      </div>
    );
  }

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careTaskService.getTasksWithLogs();
      setTasks(data);
    } catch (err) {
      console.error('❌ Failed to load tasks:', err);
      setError('Failed to load care tasks. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const loadEnclosures = async () => {
    try {
      const data = await enclosureService.getEnclosures();
      setEnclosures(data);
    } catch (err) {
      console.error('Failed to load enclosures:', err);
    }
  };

  const loadAnimals = async () => {
    if (!user) return;
    try {
      const data = await enclosureAnimalService.getAllUserAnimals(user.id);
      console.log('Loaded animals:', data);
      setAnimals(data);
    } catch (err) {
      console.error('Failed to load animals:', err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);

      const normalizedType = (task?.type || '').toLowerCase().trim();
      const normalizedTitle = (task?.title || '').toLowerCase();
      const isTemperatureTask =
        normalizedType === 'temperature-check' ||
        normalizedType === 'temperature_check' ||
        normalizedType === 'temperature check' ||
        normalizedTitle.includes('temperature');
      const isHumidityTask =
        normalizedType === 'humidity-check' ||
        normalizedType === 'humidity_check' ||
        normalizedType === 'humidity check' ||
        normalizedTitle.includes('humidity');
      
      // If it's a feeding or gut-load task, show the detailed feeding modal
      if (task && (task.type === 'feeding' || task.type === 'gut-load')) {
        setFeedingTask(task);
        setShowFeedingModal(true);
        return;
      }

      // Temperature / humidity check — show readings modal
      if (task && (isTemperatureTask || isHumidityTask)) {
        setEnvTask(task);
        setShowEnvModal(true);
        return;
      }
      
      // For other tasks, complete directly
      await careTaskService.completeTask(taskId);
      await loadTasks(); // Refresh list
    } catch (err) {
      console.error('Failed to complete task:', err);
      setError('Failed to complete task.');
    }
  };

  const handleFeedingLogSubmit = async (logData: Partial<CareLog>) => {
    if (!feedingTask) return;
    
    try {
      await careTaskService.completeTask(feedingTask.id, logData);
      await loadTasks(); // Refresh list
      setShowFeedingModal(false);
      setFeedingTask(null);
    } catch (err) {
      console.error('Failed to log feeding:', err);
      setError('Failed to log feeding.');
      throw err; // Re-throw to let modal handle it
    }
  };

  const closeSkipTaskModal = () => {
    setShowSkipModal(false);
    setSkipTaskId(null);
    setActionMode('skip');
    setSkipReason('');
    setSnoozeHours(24);
    setRescheduleAt('');
    setUpdateFrequencyOnSkip(false);
    setUpdatedFrequency('weekly');
  };

  const openSkipTaskModal = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const initialFrequency = task && task.frequency !== 'custom' ? task.frequency as EditableFrequency : 'weekly';
    const defaultReschedule = task?.nextDueAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    setSkipTaskId(taskId);
    setActionMode('skip');
    setSkipReason('');
    setSnoozeHours(24);
    setRescheduleAt(toDateTimeLocalInputValue(defaultReschedule));
    setUpdateFrequencyOnSkip(false);
    setUpdatedFrequency(initialFrequency);
    setShowSkipModal(true);
  };

  const handleTaskAction = async () => {
    if (!skipTaskId) return;

    try {
      setError(null);

      if (actionMode === 'skip') {
        const reason = skipReason.trim();
        if (!reason) {
          setError('Please enter a reason when skipping a task.');
          return;
        }

        if (updateFrequencyOnSkip) {
          await careTaskService.updateTask(skipTaskId, {
            frequency: updatedFrequency,
            customFrequencyDays: undefined,
            customFrequencyWeekdays: undefined,
          });
        }

        await careTaskService.skipTask(skipTaskId, reason);
      } else if (actionMode === 'snooze') {
        const nextDueAt = new Date();
        nextDueAt.setHours(nextDueAt.getHours() + snoozeHours);
        await careTaskService.rescheduleTask(skipTaskId, nextDueAt);
      } else {
        if (!rescheduleAt) {
          setError('Choose a new due date and time to reschedule this task.');
          return;
        }

        const parsed = new Date(rescheduleAt);
        if (Number.isNaN(parsed.getTime())) {
          setError('Enter a valid date and time.');
          return;
        }

        await careTaskService.rescheduleTask(skipTaskId, parsed);
      }

      await loadTasks();
      closeSkipTaskModal();
    } catch (err) {
      console.error('Failed to update task action:', err);
      setError('Failed to apply task action.');
    }
  };





  const getTaskIcon = (type: TaskType): LucideIcon => {
    const icons: Record<TaskType, LucideIcon> = {
      feeding: UtensilsCrossed,
      'gut-load': Flame, // Using flame icon for gut-loading
      misting: Droplets,
      'water-change': Waves,
      'temperature-check': Thermometer,
      'humidity-check': Droplets,
      'uvb-check': Sun,
      'spot-clean': Brush,
      'deep-clean': Sparkles,
      'health-check': Stethoscope,
      supplement: Pill,
      maintenance: Wrench,
      'substrate-check': Brush,
      'mold-check': AlertTriangle,
      'cleanup-crew-check': Sparkles,
      'plant-care': Leaf,
      'pest-check': Bug,
      custom: FileText,
    };
    return icons[type] || FileText;
  };





  const formatTime = (time?: string): string | null => {
    if (!time) return null;
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatShortDate = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getTimeBlock = (date: Date): TimeBlock => {
    const now = new Date();
    const hours = date.getHours(); // Local hour for time-of-day blocks
    
    // Overdue
    if (date < now) return 'overdue';
    
    // Use local dates for calendar day comparison (users think in their local timezone)
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    // Today
    if (dateLocal === todayLocal) {
      if (hours < 12) return 'morning';
      if (hours < 17) return 'afternoon';
      if (hours < 21) return 'evening';
      return 'night';
    }
    
    // Tomorrow
    const tomorrowLocal = todayLocal + (24 * 60 * 60 * 1000);
    if (dateLocal === tomorrowLocal) return 'tomorrow';
    
    // This week (next 7 days from today)
    const weekEndLocal = todayLocal + (7 * 24 * 60 * 60 * 1000);
    if (dateLocal < weekEndLocal) return 'week';
    
    // Future (more than 7 days away)
    return 'future';
  };

  const getTimeBlockLabel = (block: TimeBlock): string => {
    const labels: Record<TimeBlock, string> = {
      overdue: 'Overdue',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
      tomorrow: 'Tomorrow',
      week: 'This Week',
      future: 'Future',
    };
    return labels[block];
  };

  const getTimeBlockIcon = (block: TimeBlock): LucideIcon => {
    const icons: Record<TimeBlock, LucideIcon> = {
      overdue: AlertCircle,
      morning: Sunrise,
      afternoon: Sun,
      evening: Sunset,
      night: Moon,
      tomorrow: CalendarDays,
      week: CalendarClock,
      future: Calendar,
    };
    return icons[block];
  };

  /**
   * Bulk completion writes real history — a care_log per task, a feeding_log
   * for feeding tasks, and a new due date — and none of it is cheaply
   * reversible. So it asks first, shows progress while it runs, and reports
   * per-task results instead of collapsing a partial failure into one
   * generic error.
   */
  // The two filter states are kept as-is underneath; the single control just
  // encodes which one it's setting.
  // Today's completion, counted from the logs rather than the visible list so
  // filtering the view doesn't change what "done today" means.
  const todayProgress = (() => {
    const today = new Date().toDateString();
    const dueToday = tasks.filter(
      (t) => t.isActive && new Date(t.nextDueAt).toDateString() === today
    );
    const doneToday = tasks.filter((t) =>
      t.lastCompleted ? new Date(t.lastCompleted).toDateString() === today : false
    );
    const total = dueToday.length + doneToday.length;
    return { done: doneToday.length, total };
  })();

  const overdueCount = tasks.filter(
    (t) => t.isActive && new Date(t.nextDueAt).getTime() < Date.now()
  ).length;

  const scopeValue = filterAnimalId
    ? `animal:${filterAnimalId}`
    : filterEnclosureId
      ? `enc:${filterEnclosureId}`
      : '';

  const applyScope = (value: string) => {
    if (value.startsWith('animal:')) {
      setFilterAnimalId(value.slice('animal:'.length));
      setFilterEnclosureId('');
    } else if (value.startsWith('enc:')) {
      setFilterEnclosureId(value.slice('enc:'.length));
      setFilterAnimalId('');
    } else {
      setFilterEnclosureId('');
      setFilterAnimalId('');
    }
  };

  const completeBulkTasks = async (taskIds: string[], blockLabel: string) => {
    const tasksToComplete = tasks.filter((t) => taskIds.includes(t.id));
    if (tasksToComplete.length === 0) return;

    setBulkConfirm({ label: blockLabel, tasks: tasksToComplete });
  };

  const runBulkComplete = async () => {
    if (!bulkConfirm) return;

    const { tasks: tasksToComplete } = bulkConfirm;
    setBulkProgress({ done: 0, total: tasksToComplete.length });

    const failed: string[] = [];
    let completed = 0;

    for (const task of tasksToComplete) {
      try {
        await careTaskService.completeTask(task.id);
        completed += 1;
      } catch (err) {
        console.error(`Failed to complete "${task.title}":`, err);
        failed.push(task.title || 'Untitled task');
      }
      setBulkProgress({ done: completed + failed.length, total: tasksToComplete.length });
    }

    await loadTasks();
    setSelectedTasks(new Set());
    setSelectionMode(false);
    setBulkProgress(null);
    setBulkConfirm(null);

    // Say exactly what happened, naming what didn't work.
    if (failed.length === 0) {
      showToast(
        `${completed} ${completed === 1 ? 'task' : 'tasks'} marked done`,
        'success'
      );
    } else if (completed === 0) {
      showToast(`Couldn't complete ${failed.length === 1 ? failed[0] : `${failed.length} tasks`}`, 'error');
    } else {
      showToast(
        `${completed} done · ${failed.length} failed (${failed.slice(0, 2).join(', ')}${failed.length > 2 ? '…' : ''})`,
        'warning',
        6000
      );
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      // Exit selection mode if no tasks selected
      if (newSet.size === 0) {
        setSelectionMode(false);
      }
      return newSet;
    });
  };

  const selectAllInBlock = (taskIds: string[]) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      taskIds.forEach(id => newSet.add(id));
      return newSet;
    });
    setSelectionMode(true);
  };

  const deselectAll = () => {
    setSelectedTasks(new Set());
    setSelectionMode(false);
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    if (selectionMode) return; // Don't allow swipe in selection mode
    const touch = e.touches[0];
    setSwipedTask(taskId);
    setSwipeOffset(0);
    (e.currentTarget as any).swipeStartX = touch.clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipedTask || selectionMode) return;
    const touch = e.touches[0];
    const startX = (e.currentTarget as any).swipeStartX;
    const diff = touch.clientX - startX;
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -120)); // Max swipe distance
    }
  };

  const handleTouchEnd = async (_e: React.TouchEvent, taskId: string) => {
    if (!swipedTask || selectionMode) return;
    
    // If swiped more than 80px, complete the task
    if (swipeOffset < -80) {
      await handleCompleteTask(taskId);
    }
    
    // Reset swipe state
    setSwipedTask(null);
    setSwipeOffset(0);
  };

  // Helper to get enclosure name
  let filteredTasks = filterEnclosureId === ''
    ? tasks // Show all
    : filterEnclosureId === 'none'
    ? tasks.filter(t => !t.enclosureId) // Show tasks without enclosure
    : tasks.filter(t => t.enclosureId === filterEnclosureId); // Show specific enclosure

  if (filterAnimalId !== '') {
    filteredTasks = filterAnimalId === 'none'
      ? filteredTasks.filter(t => !t.enclosureAnimalId)
      : filteredTasks.filter(t => t.enclosureAnimalId === filterAnimalId);
  }

  // Apply view mode filter
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  if (viewMode === 'today') {
    filteredTasks = filteredTasks.filter(t => {
      const taskDate = new Date(t.nextDueAt);
      return taskDate < tomorrow || taskDate < now; // Include overdue and today
    });
  } else if (viewMode === 'week') {
    filteredTasks = filteredTasks.filter(t => {
      const taskDate = new Date(t.nextDueAt);
      return taskDate < weekEnd;
    });
  }


  const reliabilityWindowDays = 30;
  const reliabilityWindowStart = new Date(now);
  reliabilityWindowStart.setDate(reliabilityWindowStart.getDate() - reliabilityWindowDays);

  const expectedCountForTask = (task: CareTaskWithLogs) => {
    const days = reliabilityWindowDays;
    switch (task.frequency) {
      case 'daily':
        return days;
      case 'every-other-day':
        return Math.ceil(days / 2);
      case 'twice-weekly':
        return Math.ceil(days / 3.5);
      case 'weekly':
        return Math.ceil(days / 7);
      case 'bi-weekly':
        return Math.ceil(days / 14);
      case 'monthly':
        return 1;
      case 'custom':
        if (task.customFrequencyWeekdays && task.customFrequencyWeekdays.length > 0) {
          return estimateCustomWeekdayOccurrences(days, task.customFrequencyWeekdays);
        }
        return Math.max(1, Math.ceil(days / (task.customFrequencyDays ?? 7)));
      default:
        return 0;
    }
  };

  const reliabilityTotals = filteredTasks.reduce(
    (acc, task) => {
      const expected = expectedCountForTask(task);
      if (expected <= 0) return acc;
      const completed = task.logs.filter(
        log => !log.skipped && new Date(log.completedAt) >= reliabilityWindowStart
      ).length;
      return {
        expected: acc.expected + expected,
        completed: acc.completed + Math.min(completed, expected),
      };
    },
    { expected: 0, completed: 0 }
  );

  const reliabilityScore = reliabilityTotals.expected > 0
    ? Math.round((reliabilityTotals.completed / reliabilityTotals.expected) * 100)
    : 0;

  // Group tasks by time block
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const block = getTimeBlock(task.nextDueAt);
    if (!acc[block]) acc[block] = [];
    acc[block].push(task);
    return acc;
  }, {} as Record<TimeBlock, CareTaskWithLogs[]>);

  // Define display order for time blocks
  const blockOrder: TimeBlock[] = ['overdue', 'morning', 'afternoon', 'evening', 'night', 'tomorrow', 'week', 'future'];
  const visibleBlocks = blockOrder.filter(block => groupedTasks[block]?.length > 0);

  // Helper to get enclosure name
  const getEnclosureName = (enclosureId?: string) => {
    if (!enclosureId) return null;
    const enclosure = enclosures.find(e => e.id === enclosureId);
    return enclosure ? enclosure.name : 'Unknown';
  };

  // Helper to get animal name
  const getAnimalName = (animalId?: string) => {
    if (!animalId) return null;
    const animal = animals.find(a => a.id === animalId);
    return animal ? (animal.name || `Animal #${animal.animalNumber || '?'}`) : 'Unknown Animal';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-28">
        <div className="animate-pulse space-y-4 px-4 pt-16">
          <div className="h-10 bg-card rounded-2xl w-40" />
          <div className="h-8 bg-card rounded-xl w-64" />
          <div className="h-36 bg-card rounded-2xl" />
          <div className="h-48 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-bold text-white">Care Tasks</h1>
        </div>
        <div className="flex items-center gap-2">
          {enclosures.length > 0 && (
            <button
              onClick={() => navigate('/sitter-sheet')}
              title="Build a printable care sheet for a pet sitter"
              className="w-9 h-9 rounded-full border border-divider bg-card flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Pet sitter care sheet"
            >
              <ClipboardList className="w-4 h-4 text-muted" />
            </button>
          )}
          {enclosures.length > 0 && (
            <button
              onClick={() => navigate(`/care-calendar/tasks/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
              className="flex items-center gap-1.5 bg-accent text-on-accent font-semibold px-3 py-1.5 rounded-full text-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'analytics' ? 'week' : 'analytics')}
            className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-transform ${
              viewMode === 'analytics' ? 'bg-accent border-accent text-on-accent' : 'bg-card border-divider'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${viewMode === 'analytics' ? 'text-on-accent' : 'text-muted'}`} />
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        isPremium ? (
          <div className="px-4 pt-2">
            <CareAnalyticsDashboard consistencyScore={reliabilityTotals.expected > 0 ? reliabilityScore : null} />
          </div>
        ) : (
          <div className="px-4 pt-2">
            <PremiumPaywall source="care-analytics" />
          </div>
        )
      ) : (
        <div className="space-y-4 pt-2">
          {/* Progress — a care routine is something you finish, and the page
              never used to say so. */}
          {todayProgress.total > 0 && (
            <div className="px-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-muted">
                  <span className="text-white font-semibold">
                    {todayProgress.done} of {todayProgress.total}
                  </span>{' '}
                  done today
                </span>
                {overdueCount > 0 && (
                  <span className="text-xs font-semibold text-red-300">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              <div className="h-1 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(todayProgress.done / todayProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Filters */}
          {enclosures.length > 0 && (
            <div className="flex flex-col gap-2 px-4">
              {/* Time filter tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {(['today', 'week', 'all'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      viewMode === mode ? 'bg-accent text-on-accent' : 'bg-card text-muted border border-divider'
                    }`}
                  >
                    {mode === 'today' ? 'Today' : mode === 'week' ? 'This Week' : 'All Tasks'}
                  </button>
                ))}
              </div>
              {/* One scope control. Previously this was an enclosure pill row
                  labelled "All Pets" sitting above an animal dropdown labelled
                  "All Animals" — two filters whose labels contradicted what
                  they actually filtered. Animals are nested under the
                  enclosure they live in, so one control covers both. */}
              {(enclosures.length > 1 || animals.length > 0) && (
                <div className="relative">
                  <select
                    value={scopeValue}
                    onChange={(e) => applyScope(e.target.value)}
                    className="w-full appearance-none h-10 pl-3 pr-10 rounded-xl bg-card border border-divider text-white text-sm font-medium focus:outline-none focus:border-accent/50"
                  >
                    <option value="">Everything</option>
                    {enclosures.map((enc) => {
                      const encAnimals = animals.filter((a) => a.enclosureId === enc.id);
                      return (
                        <optgroup key={enc.id} label={enc.name}>
                          <option value={`enc:${enc.id}`}>All of {enc.name}</option>
                          {encAnimals.map((animal) => (
                            <option key={animal.id} value={`animal:${animal.id}`}>
                              {animal.name || `Animal #${animal.animalNumber || '?'}`}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    <option value="enc:none">Not assigned to an enclosure</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

            </div>
          )}

          {/* Getting started — no enclosures */}
          {enclosures.length === 0 && !error && (
            <div className="mx-4 bg-card border border-divider rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hand className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Welcome to Care Tasks!</h2>
              </div>
              <div className="space-y-2 text-xs text-muted">
                <p><span className="text-white font-medium">Step 1:</span> Create your first pet enclosure</p>
                <p><span className="text-white font-medium">Step 2:</span> Add recurring care tasks</p>
                <p><span className="text-white font-medium">Step 3:</span> Complete tasks to build your streak!</p>
              </div>
            </div>
          )}

          {/* No enclosure empty */}
          {enclosures.length === 0 && (
            <div className="mx-4 bg-card border border-dashed border-divider rounded-2xl p-8 text-center">
              <p className="text-muted text-sm">Create a pet enclosure to start adding care tasks</p>
            </div>
          )}

          {/* Task groups */}
          {enclosures.length > 0 && filteredTasks.length > 0 && (
            <div className="space-y-3 px-4">
              {visibleBlocks.map(block => {
                const blockTasks = groupedTasks[block];
                const isExpanded = true;
                const isOverdue = block === 'overdue';

                return (
                  <div key={block} className={`bg-card border rounded-2xl overflow-hidden ${isOverdue ? 'border-red-500/40' : 'border-divider'}`}>
                    {/* Section header */}
                    <div className={`flex items-center justify-between px-4 pt-3.5 pb-3 ${isExpanded ? 'border-b border-divider' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 text-left">
                        {React.createElement(getTimeBlockIcon(block), {
                          className: `w-4 h-4 ${isOverdue ? 'text-red-400' : 'text-muted'}`
                        })}
                        <span className={`text-sm font-semibold ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                          {getTimeBlockLabel(block)}
                        </span>
                        <span className="text-xs text-muted">({blockTasks.length})</span>
                        <ChevronDown className="w-4 h-4 text-muted ml-auto" />
                      </div>
                      {isExpanded && blockTasks.length > 1 && (
                        <button
                          onClick={() => selectionMode
                            ? selectAllInBlock(blockTasks.map(t => t.id))
                            : void completeBulkTasks(blockTasks.map(t => t.id), getTimeBlockLabel(block))
                          }
                          className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-accent/15 text-accent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          {selectionMode ? 'Select All' : 'All Done'}
                        </button>
                      )}
                    </div>

                    {/* Task list */}
                    {isExpanded && (
                      <div className="divide-y divide-divider">
                        {blockTasks.map(task => {
                          const isDueToday = task.nextDueAt.toDateString() === new Date().toDateString();
                          return (
                            <TaskItem
                              key={task.id}
                              task={task}
                              isOverdue={isOverdue}
                              isDueToday={isDueToday}
                              selectionMode={selectionMode}
                              selectedTasks={selectedTasks}
                              swipedTask={swipedTask}
                              swipeOffset={swipeOffset}
                              getTaskIcon={getTaskIcon}
                              getEnclosureName={getEnclosureName}
                              getAnimalName={getAnimalName}
                              formatTime={formatTime}
                              formatShortDate={formatShortDate}
                              onToggleSelection={toggleTaskSelection}
                              onEdit={(id) => navigate(`/care-calendar/tasks/edit/${id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                              onSkip={openSkipTaskModal}
                              onComplete={handleCompleteTask}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {enclosures.length > 0 && filteredTasks.length === 0 && !error && (
            <div className="mx-4 bg-card border border-divider rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-sm text-muted">
                {viewMode === 'today'
                  ? 'All caught up for today!'
                  : viewMode === 'week'
                  ? 'No tasks due this week.'
                  : 'No tasks yet. Tap "Add Task" to get started.'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-card border-t border-divider shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-white">
                {selectedTasks.size} selected
              </span>
              <button onClick={deselectAll} className="text-sm text-muted">Clear</button>
            </div>
            <button
              onClick={() => { void completeBulkTasks(Array.from(selectedTasks), 'your selection'); }}
              className="px-4 py-2 bg-accent text-on-accent rounded-full font-semibold text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Complete
            </button>
          </div>
        </div>
      )}

      {/* Environment Readings Modal */}
      {envTask && (
        <EnvironmentReadingsModal
          isOpen={showEnvModal}
          task={envTask}
          userId={user.id}
          fallbackEnclosureAnimalId={
            envTask.enclosureAnimalId ||
            animals.find((a) => a.enclosureId === envTask.enclosureId)?.id
          }
          onClose={() => { setShowEnvModal(false); setEnvTask(null); }}
          onSubmit={async () => {
            await careTaskService.completeTask(envTask.id);
            await loadTasks();
            setShowEnvModal(false);
            setEnvTask(null);
          }}
        />
      )}

      {/* Feeding Log Modal */}
      <FeedingLogModal
        isOpen={showFeedingModal}
        taskTitle={feedingTask?.title || ''}
        task={feedingTask}
        onClose={() => {
          setShowFeedingModal(false);
          setFeedingTask(null);
        }}
        onSubmit={handleFeedingLogSubmit}
      />

      {/* Bulk complete — confirm, then show progress in place */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-divider rounded-2xl overflow-hidden">
            <div className="p-5">
              <h3 className="text-base font-bold text-white">
                Mark {bulkConfirm.tasks.length} {bulkConfirm.tasks.length === 1 ? 'task' : 'tasks'} done?
              </h3>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                This logs {bulkConfirm.tasks.length === 1 ? 'it' : 'them'} as completed now in {bulkConfirm.label}.
                Feeding tasks also record a feeding, which health tracking reads. There&apos;s no undo.
              </p>

              <ul className="mt-3.5 space-y-1.5 max-h-44 overflow-y-auto">
                {bulkConfirm.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2.5 text-sm text-white">
                    <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="truncate">{task.title || 'Untitled task'}</span>
                    {task.type === 'feeding' && (
                      <span className="ml-auto text-[10px] text-muted flex-shrink-0">logs feeding</span>
                    )}
                  </li>
                ))}
              </ul>

              {bulkProgress && (
                <div className="mt-4">
                  <div className="h-1 bg-card-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted mt-1.5">
                    Completing {bulkProgress.done} of {bulkProgress.total}…
                  </p>
                </div>
              )}
            </div>

            <div className="flex border-t border-divider">
              <button
                type="button"
                onClick={() => setBulkConfirm(null)}
                disabled={bulkProgress !== null}
                className="flex-1 min-h-[48px] text-sm font-semibold text-muted border-r border-divider active:opacity-70 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void runBulkComplete(); }}
                disabled={bulkProgress !== null}
                className="flex-1 min-h-[48px] text-sm font-bold text-accent active:opacity-70 disabled:opacity-40"
              >
                {bulkProgress ? 'Working…' : 'Mark all done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Action Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-20">
          <div className="w-full max-w-md bg-card border border-divider rounded-2xl shadow-xl">
            <div className="px-4 py-3 border-b border-divider">
              <h3 className="text-white font-semibold">Task Action</h3>
              <p className="text-xs text-muted mt-1">
                {actionMode === 'skip'
                  ? 'Skip this occurrence and keep a reason in your history.'
                  : actionMode === 'snooze'
                  ? 'Move this occurrence out by a short amount of time.'
                  : 'Set an exact new due date and time for this occurrence.'}
              </p>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionMode('skip')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                    actionMode === 'skip'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-card-elevated border-divider text-muted'
                  }`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode('snooze')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                    actionMode === 'snooze'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-card-elevated border-divider text-muted'
                  }`}
                >
                  Snooze
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode('reschedule')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                    actionMode === 'reschedule'
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-card-elevated border-divider text-muted'
                  }`}
                >
                  Reschedule
                </button>
              </div>

              {actionMode === 'skip' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Reason</label>
                    <textarea
                      value={skipReason}
                      onChange={(e) => setSkipReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Traveling this weekend"
                      className="w-full resize-none rounded-xl border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={updateFrequencyOnSkip}
                      onChange={(e) => setUpdateFrequencyOnSkip(e.target.checked)}
                      className="w-4 h-4 rounded border-divider bg-card-elevated text-accent"
                    />
                    Update frequency for future occurrences
                  </label>

                  {updateFrequencyOnSkip && (
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">New Frequency</label>
                      <select
                        value={updatedFrequency}
                        onChange={(e) => setUpdatedFrequency(e.target.value as EditableFrequency)}
                        className="w-full rounded-xl border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                      >
                        {EDITABLE_FREQUENCIES.map((freq) => (
                          <option key={freq.value} value={freq.value}>
                            {freq.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {actionMode === 'snooze' && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Snooze Duration</label>
                  <select
                    value={snoozeHours}
                    onChange={(e) => setSnoozeHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  >
                    {SNOOZE_OPTIONS_HOURS.map((hours) => (
                      <option key={hours} value={hours}>
                        {hours < 24 ? `${hours} hour${hours === 1 ? '' : 's'}` : `${hours / 24} day${hours / 24 === 1 ? '' : 's'}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {actionMode === 'reschedule' && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">New Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={rescheduleAt}
                    onChange={(e) => setRescheduleAt(e.target.value)}
                    className="w-full rounded-xl border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent [&::-webkit-calendar-picker-indicator]:invert"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-divider flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSkipTaskModal}
                className="px-4 py-2 rounded-full bg-card-elevated border border-divider text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTaskAction}
                disabled={actionMode === 'skip' && skipReason.trim().length === 0}
                className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold disabled:opacity-50"
              >
                {actionMode === 'skip' ? 'Skip Task' : actionMode === 'snooze' ? 'Snooze Task' : 'Reschedule Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

