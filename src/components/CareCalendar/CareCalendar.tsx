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
  type LucideIcon
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { Auth } from '../Auth';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { estimateCustomWeekdayOccurrences } from '../../utils/customTaskFrequency';
import { formatCareTaskFrequency } from '../../utils/careTaskFrequencyLabel';
import { FeedingLogModal } from './FeedingLogModal';
import { EnvironmentReadingsModal } from './EnvironmentReadingsModal';
import { CareAnalyticsDashboard } from '../CareAnalytics';
import type { CareTaskWithLogs, TaskType, CareTask, CareLog, Enclosure, EnclosureAnimal } from '../../types/careCalendar';

type ViewMode = 'all' | 'today' | 'week' | 'analytics';
type TimeBlock = 'overdue' | 'morning' | 'afternoon' | 'evening' | 'night' | 'tomorrow' | 'week' | 'future';

const formatTaskFrequencySummary = (task: CareTaskWithLogs): string => {
  return formatCareTaskFrequency(task);
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
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {task.enclosureId && (
                <span className="text-[10px] text-muted truncate">{getEnclosureName(task.enclosureId)}</span>
              )}
              {task.enclosureAnimalId && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-accent/15 text-accent rounded-full">
                  {getAnimalName(task.enclosureAnimalId)}
                </span>
              )}
              {task.scheduledTime && (
                <span className="text-[10px] text-muted">{formatTime(task.scheduledTime)}</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-card-elevated text-muted">
                {formatTaskFrequencySummary(task)}
              </span>
              {task.streak > 0 && (
                <span className="text-[10px] inline-flex items-center gap-0.5 text-orange-400 font-semibold">
                  <Flame className="w-2.5 h-2.5" />
                  {task.streak}
                </span>
              )}
            </div>
            {task.notes && (
              <p className="text-xs text-muted mt-1 truncate">{task.notes}</p>
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
                title="Skip or delay with reason"
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
  const [skipReason, setSkipReason] = useState('');

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

  const openSkipTaskModal = (taskId: string) => {
    setSkipTaskId(taskId);
    setSkipReason('');
    setShowSkipModal(true);
  };

  const handleSkipTask = async () => {
    if (!skipTaskId) return;

    const reason = skipReason.trim();
    if (!reason) {
      setError('Please enter a reason when skipping or delaying a task.');
      return;
    }

    try {
      setError(null);
      await careTaskService.skipTask(skipTaskId, reason);
      await loadTasks();
      setShowSkipModal(false);
      setSkipTaskId(null);
      setSkipReason('');
    } catch (err) {
      console.error('Failed to skip task:', err);
      setError('Failed to skip task.');
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

  const completeBulkTasks = async (taskIds: string[]) => {
    try {
      for (const taskId of taskIds) {
        await careTaskService.completeTask(taskId);
      }
      await loadTasks();
      setSelectedTasks(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Failed to complete tasks:', err);
      setError('Failed to complete some tasks.');
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
        <div className="px-4 pt-2">
          <CareAnalyticsDashboard consistencyScore={reliabilityTotals.expected > 0 ? reliabilityScore : null} />
        </div>
      ) : (
        <div className="space-y-4 pt-2">
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
              {/* Enclosure filter pills */}
              {enclosures.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setFilterEnclosureId('')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterEnclosureId === '' ? 'bg-card-elevated text-white border border-accent/30' : 'bg-card text-muted border border-divider'
                    }`}
                  >
                    All Pets
                  </button>
                  {enclosures.map((enc) => (
                    <button
                      key={enc.id}
                      onClick={() => setFilterEnclosureId(enc.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filterEnclosureId === enc.id ? 'bg-card-elevated text-white border border-accent/30' : 'bg-card text-muted border border-divider'
                      }`}
                    >
                      {enc.name}
                    </button>
                  ))}
                </div>
              )}

              {animals.length > 0 && (
                <div className="relative">
                  <select
                    value={filterAnimalId}
                    onChange={(e) => setFilterAnimalId(e.target.value)}
                    className="w-full appearance-none h-10 pl-3 pr-10 rounded-xl bg-card border border-divider text-white text-sm font-medium focus:outline-none focus:border-accent/50"
                  >
                    <option value="">All Animals</option>
                    <option value="none">Unassigned</option>
                    {animals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.name || `Animal #${animal.animalNumber || '?'}`}
                      </option>
                    ))}
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
                            : completeBulkTasks(blockTasks.map(t => t.id))
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
              onClick={() => completeBulkTasks(Array.from(selectedTasks))}
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
        onClose={() => {
          setShowFeedingModal(false);
          setFeedingTask(null);
        }}
        onSubmit={handleFeedingLogSubmit}
      />

      {/* Skip/Delay Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-divider rounded-2xl shadow-xl">
            <div className="px-4 py-3 border-b border-divider">
              <h3 className="text-white font-semibold">Skip or Delay Task</h3>
              <p className="text-xs text-muted mt-1">This will mark this occurrence as skipped and move it to the next scheduled date.</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide">Reason</label>
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                rows={3}
                placeholder="e.g. Traveling this weekend"
                className="w-full resize-none rounded-xl border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="px-4 py-3 border-t border-divider flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSkipModal(false);
                  setSkipTaskId(null);
                  setSkipReason('');
                }}
                className="px-4 py-2 rounded-full bg-card-elevated border border-divider text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipTask}
                disabled={skipReason.trim().length === 0}
                className="px-4 py-2 rounded-full bg-amber-500 text-black text-sm font-semibold disabled:opacity-50"
              >
                Skip/Delay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

