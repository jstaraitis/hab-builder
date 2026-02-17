import React, { useState, useEffect, memo } from 'react';
import { 
  Pencil, 
  Check, 
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
  MoreVertical,
  type LucideIcon
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from '../Auth';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { FeedingLogModal } from './FeedingLogModal';
import { EnclosureManager } from './EnclosureManager';
import { CareAnalyticsDashboard } from '../CareAnalytics';
import type { CareTaskWithLogs, TaskType, CareTask, CareLog, Enclosure, EnclosureAnimal } from '../../types/careCalendar';

type ViewMode = 'all' | 'today' | 'week' | 'analytics';
type TimeBlock = 'overdue' | 'morning' | 'afternoon' | 'evening' | 'night' | 'tomorrow' | 'week' | 'future';

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
      <div className="absolute inset-0 sm:hidden flex items-center justify-end px-4 bg-emerald-500">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Check className="w-5 h-5" />
          <span>Complete</span>
        </div>
      </div>
      
      {/* Task Content (swipeable) */}
      <div
        className="relative bg-white dark:bg-gray-900 p-3 transition-colors touch-pan-y"
        style={{ 
          transform: swipeTransform,
          transition: isBeingSwiped ? 'none' : 'transform 0.3s ease'
        }}
        onTouchStart={(e) => onTouchStart(e, task.id)}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => onTouchEnd(e, task.id)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox for selection mode */}
          {selectionMode && (
            <input
              type="checkbox"
              checked={selectedTasks.has(task.id)}
              onChange={() => onToggleSelection(task.id)}
              className="mt-2 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
          )}

          {/* Icon */}
          <div className={`p-2 rounded-lg shrink-0 ${
            isOverdue 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : isDueToday
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {React.createElement(getTaskIcon(task.type), { 
              className: `w-4 h-4 ${
                isOverdue 
                  ? 'text-red-600 dark:text-red-400' 
                  : isDueToday
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400'
              }` 
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {task.title || 'Untitled Task'}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                  {task.enclosureId && (
                    <span>{getEnclosureName(task.enclosureId)}</span>
                  )}
                  {task.enclosureAnimalId && (() => {
                    const animalName = getAnimalName(task.enclosureAnimalId);
                    return (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                          {animalName}
                        </span>
                      </>
                    );
                  })()}
                  {task.scheduledTime && (
                    <>
                      <span>•</span>
                      <span>{formatTime(task.scheduledTime)}</span>
                    </>
                  )}
                  {task.lastCompleted && (
                    <>
                      <span>•</span>
                      <span>
                        Last: {new Date(task.lastCompleted).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {task.streak > 0 && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                        <Flame className="w-3 h-3" />
                        {task.streak} day streak!
                      </span>
                    </>
                  )}
                  {task.description && (
                    <>
                      <span>•</span>
                      <span className="truncate">{task.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!selectionMode && (
              <>
                <button
                  onClick={() => onEdit(task.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => onComplete(task.id)}
                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  title="Mark as done"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Additional Details */}
        {!selectionMode && task.notes && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Notes */}
            {task.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border-l-2 border-blue-400">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Note: </span>{task.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export function CareCalendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]); // All animals from all enclosures
  const [filterEnclosureId, setFilterEnclosureId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedingTask, setFeedingTask] = useState<CareTask | null>(null);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [expandedSections, setExpandedSections] = useState<Set<TimeBlock>>(new Set(['overdue', 'morning', 'afternoon', 'evening']));
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [swipedTask, setSwipedTask] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  useEffect(() => {
    if (user) {
      loadTasks();
      loadEnclosures();
      loadAnimals();
    }
  }, [user, location.key]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Show auth screen if not logged in
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 py-12">
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
      
      // If it's a feeding or gut-load task, show the detailed feeding modal
      if (task && (task.type === 'feeding' || task.type === 'gut-load')) {
        setFeedingTask(task);
        setShowFeedingModal(true);
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





  const getTaskIcon = (type: TaskType): LucideIcon => {
    const icons: Record<TaskType, LucideIcon> = {
      feeding: UtensilsCrossed,
      'gut-load': Flame, // Using flame icon for gut-loading
      misting: Droplets,
      'water-change': Waves,
      'spot-clean': Brush,
      'deep-clean': Sparkles,
      'health-check': Stethoscope,
      supplement: Pill,
      maintenance: Wrench,
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

  const toggleSection = (block: TimeBlock) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(block)) {
        newSet.delete(block);
      } else {
        newSet.add(block);
      }
      return newSet;
    });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading care tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Care Tasks
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your pets and their care tasks
        </p>
      </div>

      {/* Show Analytics if selected */}
      {viewMode === 'analytics' ? (
        <div>
          {/* Back Button */}
          <button
            onClick={() => setViewMode('today')}
            className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            ← Back to Tasks
          </button>
          <CareAnalyticsDashboard />
        </div>
      ) : (
        <>
          {/* Getting Started Guide (shown when no enclosures) */}
          {enclosures.length === 0 && !error && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
                <Hand className="w-5 h-5" />
                Welcome to Care Tasks!
              </h2>
              <div className="space-y-3 text-emerald-800 dark:text-emerald-200">
                <p>
                  <strong>Step 1:</strong> Create your first pet enclosure below
                </p>
                <p>
                  <strong>Step 2:</strong> Add care tasks for that pet
                </p>
                <p>
                  <strong>Step 3:</strong> Track completions and build your care streak!
                </p>
              </div>
            </div>
          )}

      {/* Enclosure Manager Section */}
      <div className="mb-12">
        <EnclosureManager onEnclosuresChanged={loadEnclosures} />
      </div>

      {/* Tasks Section */}
      <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Care Tasks
          </h2>
          {enclosures.length > 0 && (
            <div className="space-y-4">
              {/* Compact Single Row Filter */}
              <div className="flex items-center gap-2">
                {/* View Mode Dropdown */}
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="all">All Tasks</option>
                </select>

                {/* Pet Filter */}
                <select
                  value={filterEnclosureId}
                  onChange={(e) => setFilterEnclosureId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                >
                  <option value="">All Pets</option>
                  {enclosures.map(enc => (
                    <option key={enc.id} value={enc.id}>
                      {enc.name}
                    </option>
                  ))}
                </select>

                {/* Menu Button */}
                <div className="relative menu-container">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                      <div className="py-1">
                        {filteredTasks.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectionMode(!selectionMode);
                              if (selectionMode) {
                                setSelectedTasks(new Set());
                              }
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            {selectionMode ? 'Cancel Selection' : 'Select Tasks'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setViewMode('analytics');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Analytics
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reliability Badge (if exists) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {reliabilityTotals.expected > 0 && (
                    <div className="px-3 py-2 rounded-lg border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Reliability {reliabilityScore}%</span>
                      <span className="text-emerald-600/80 dark:text-emerald-300/80">30d</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/care-calendar/tasks/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                  className="w-full lg:w-fit px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          )}
        </div>

        {/* No enclosure message */}
        {enclosures.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Create a pet enclosure above to start adding care tasks
            </p>
          </div>
        )}
        
        {/* Tasks List */}
        {enclosures.length > 0 && filteredTasks.length > 0 && (
          <div className="space-y-4">
            {visibleBlocks.map(block => {
              const blockTasks = groupedTasks[block];
              const isExpanded = expandedSections.has(block);
              const isOverdue = block === 'overdue';
              
              return (
                <div key={block} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <div className={`p-4 ${
                    isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => toggleSection(block)}
                        className="flex items-center gap-2 flex-1 text-left group"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        } ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        {React.createElement(getTimeBlockIcon(block), { 
                          className: `w-5 h-5 ${
                            isOverdue 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }` 
                        })}
                        <span className={`text-base sm:text-lg font-semibold ${
                          isOverdue 
                            ? 'text-red-900 dark:text-red-100' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {getTimeBlockLabel(block)}
                        </span>
                        <span className={`text-sm ${
                          isOverdue 
                            ? 'text-red-700 dark:text-red-300' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          ({blockTasks.length})
                        </span>
                      </button>
                      
                      {isExpanded && blockTasks.length > 1 && (
                        <div className="flex items-center gap-2">
                          {selectionMode ? (
                            <button
                              onClick={() => selectAllInBlock(blockTasks.map(t => t.id))}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span className="hidden sm:inline">Select All</span>
                              <span className="sm:hidden">All</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => completeBulkTasks(blockTasks.map(t => t.id))}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                isOverdue
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline">Complete All</span>
                              <span className="sm:hidden">All</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className='divide-y divide-gray-200 dark:divide-gray-700'>
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

        {/* Empty state when no tasks yet */}
        {enclosures.length > 0 && filteredTasks.length === 0 && !error && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
              {viewMode === 'today'
                ? <><span>No tasks due today!</span><Sparkles className="w-5 h-5 text-emerald-500" /></>
                : viewMode === 'week'
                  ? "No tasks due this week."
                  : "No tasks yet. Click '+ Add Task' above to create care tasks for your pets."}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Floating Action Bar for Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedTasks.size} task{selectedTasks.size === 1 ? '' : 's'} selected
              </span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear
              </button>
            </div>
            <button
              onClick={() => completeBulkTasks(Array.from(selectedTasks))}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Complete Selected
            </button>
          </div>
        </div>
      )}
      </>
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
    </div>
  );
}
