import React, { useState, useEffect } from 'react';
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
  Zap,
  Calendar,
  List,
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  CalendarClock,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from '../Auth';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { TaskCreationModal } from './TaskCreationModal';
import { TaskEditModal } from './TaskEditModal';
import { EnclosureManager } from './EnclosureManager';
import { NotificationPrompt } from './NotificationPrompt';
import type { CareTaskWithLogs, TaskType, CareTask, Enclosure, EnclosureAnimal } from '../../types/careCalendar';

type ViewMode = 'all' | 'today' | 'week';
type LayoutMode = 'cards' | 'list';
type TimeBlock = 'overdue' | 'morning' | 'afternoon' | 'evening' | 'night' | 'tomorrow' | 'week' | 'future';

export function CareCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]); // All animals from all enclosures
  const [filterEnclosureId, setFilterEnclosureId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTask | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('cards');
  const [expandedSections, setExpandedSections] = useState<Set<TimeBlock>>(new Set(['overdue', 'morning', 'afternoon', 'evening']));
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [swipedTask, setSwipedTask] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  useEffect(() => {
    if (user) {
      loadTasks();
      loadEnclosures();
      loadAnimals();
    }
  }, [user]);

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
      await careTaskService.completeTask(taskId);
      await loadTasks(); // Refresh list
    } catch (err) {
      console.error('Failed to complete task:', err);
      setError('Failed to complete task.');
    }
  };



  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTaskIcon = (type: TaskType): LucideIcon => {
    const icons: Record<TaskType, LucideIcon> = {
      feeding: UtensilsCrossed,
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

  const formatDueDate = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Overdue';
    if (hours < 1) return 'Due now';
    if (hours < 24) return `Due in ${hours}h`;
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const formatFrequency = (frequency: string, customDays?: number): string => {
    const frequencyMap: Record<string, string> = {
      'daily': 'Daily',
      'every-other-day': 'Every other day',
      'twice-weekly': 'Twice weekly',
      'weekly': 'Weekly',
      'bi-weekly': 'Every 2 weeks',
      'monthly': 'Monthly',
    };
    
    if (frequency === 'custom' && customDays) {
      return `Every ${customDays} day${customDays > 1 ? 's' : ''}`;
    }
    
    return frequencyMap[frequency] || frequency;
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
    const hours = date.getHours();
    
    // Overdue
    if (date < now) return 'overdue';
    
    // Today
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      if (hours < 12) return 'morning';
      if (hours < 17) return 'afternoon';
      if (hours < 21) return 'evening';
      return 'night';
    }
    
    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    
    // This week (next 7 days from now)
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    if (date < weekEnd) return 'week';
    
    // Future (more than 7 days away)
    return 'future';
  };

  const getTimeBlockLabel = (block: TimeBlock): string => {
    const labels: Record<TimeBlock, string> = {
      overdue: 'Overdue',
      morning: 'Morning (before 12pm)',
      afternoon: 'Afternoon (12pm-5pm)',
      evening: 'Evening (5pm-9pm)',
      night: 'Night (after 9pm)',
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
              {/* Top Row: View Mode Toggle */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setViewMode('today')}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    viewMode === 'today'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  This Week
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    viewMode === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  All Tasks
                </button>
              </div>

              {/* Second Row: Filters & Layout Toggle */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/70 px-3 py-2 shadow-sm">
                  {/* Enclosure Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="enclosure-filter" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Pet
                    </label>
                    <select
                      id="enclosure-filter"
                      value={filterEnclosureId}
                      onChange={(e) => setFilterEnclosureId(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                    >
                      <option value="">All Pets</option>
                      {enclosures.map(enc => (
                        <option key={enc.id} value={enc.id}>
                          {enc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Layout Toggle */}
                  <div className="flex w-full items-center gap-1 rounded-lg bg-gray-100/80 dark:bg-gray-700/80 p-1">
                    <button
                      onClick={() => setLayoutMode('cards')}
                      className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        layoutMode === 'cards'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="Card view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        layoutMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="List view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="hidden sm:inline">List</span>
                    </button>
                  </div>

                  {/* Selection Mode Toggle */}
                  {filteredTasks.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        if (selectionMode) {
                          setSelectedTasks(new Set());
                        }
                      }}
                      className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center sm:justify-start gap-1.5 ${
                        selectionMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      {selectionMode ? 'Cancel' : 'Select'}
                    </button>
                  )}

                  {reliabilityTotals.expected > 0 && (
                    <div className="w-full sm:w-auto px-3 py-2 rounded-lg border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Reliability {reliabilityScore}%</span>
                      </div>
                      <span className="text-emerald-600/80 dark:text-emerald-300/80">30d</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowModal(true)}
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
                    <div className={layoutMode === 'cards' 
                      ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4' 
                      : 'divide-y divide-gray-200 dark:divide-gray-700'
                    }>
                      {blockTasks.map(task => {
                        const isDueToday = task.nextDueAt.toDateString() === new Date().toDateString();
                        const isTaskExpanded = expandedTasks.has(task.id);
                        
                        if (layoutMode === 'list') {
                          // Compact List View
                          const isBeingSwiped = swipedTask === task.id;
                          const swipeTransform = isBeingSwiped ? `translateX(${swipeOffset}px)` : 'translateX(0)';
                          
                          return (
                            <div
                              key={task.id}
                              className="relative overflow-hidden"
                            >
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
                                onTouchStart={(e) => handleTouchStart(e, task.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={(e) => handleTouchEnd(e, task.id)}
                              >
                              <div className="flex items-start gap-3">
                                {/* Checkbox for selection mode */}
                                {selectionMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedTasks.has(task.id)}
                                    onChange={() => toggleTaskSelection(task.id)}
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
                                        {task.streak && task.streak > 0 && (
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
                                        onClick={() => setEditingTask(task)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                      </button>
                                      <button
                                        onClick={() => handleCompleteTask(task.id)}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Done
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Additional Details (desktop only) */}
                              {!selectionMode && task.notes && (
                                <div className="hidden sm:block mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
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
                        }
                        
                        // Card View (existing design)
                        const isBeingSwiped = swipedTask === task.id;
                        const swipeTransform = isBeingSwiped ? `translateX(${swipeOffset}px)` : 'translateX(0)';
                        
                        return (
                          <div
                            key={task.id}
                            className="relative overflow-hidden rounded-xl"
                          >
                            {/* Swipe Action Background */}
                            <div className="absolute inset-0 sm:hidden flex items-center justify-end px-4 bg-emerald-500 rounded-xl">
                              <div className="flex items-center gap-2 text-white font-semibold">
                                <Check className="w-5 h-5" />
                                <span>Complete</span>
                              </div>
                            </div>
                            
                            {/* Card Content (swipeable) */}
                            <div
                            className={`relative border-2 transition-all touch-pan-y ${
                              isOverdue 
                                ? 'bg-white dark:bg-gray-800 border-red-400 dark:border-red-700' 
                                : isDueToday
                                ? 'bg-white dark:bg-gray-800 border-emerald-400 dark:border-emerald-700'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                            style={{ 
                              transform: swipeTransform,
                              transition: isBeingSwiped ? 'none' : 'transform 0.3s ease',
                              borderRadius: '0.75rem'
                            }}
                            onTouchStart={(e) => handleTouchStart(e, task.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={(e) => handleTouchEnd(e, task.id)}
                          >
                            <div className="p-4">
                              {/* Compact Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {/* Checkbox for selection mode */}
                                  {selectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedTasks.has(task.id)}
                                      onChange={() => toggleTaskSelection(task.id)}
                                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                  )}
                                  
                                  <div className={`p-2 rounded-lg ${
                                    isOverdue 
                                      ? 'bg-red-100 dark:bg-red-900/30' 
                                      : isDueToday
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}>
                                    {React.createElement(getTaskIcon(task.type), { 
                                      className: `w-5 h-5 ${
                                        isOverdue 
                                          ? 'text-red-600 dark:text-red-400' 
                                          : isDueToday
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-gray-600 dark:text-gray-400'
                                      }` 
                                    })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        {task.title || 'Untitled Task'}
                                      </h3>
                                      {task.enclosureId && (
                                        <>
                                          <span className="text-xs text-gray-400">•</span>
                                          <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {getEnclosureName(task.enclosureId)}
                                          </span>
                                        </>
                                      )}
                                      {task.enclosureAnimalId && (
                                        <>
                                          <span className="text-xs text-gray-400">•</span>
                                          <span className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                                            {getAnimalName(task.enclosureAnimalId)}
                                          </span>
                                        </>
                                      )}
                                      {task.scheduledTime && (
                                        <>
                                          <span className="text-xs text-gray-400">•</span>
                                          <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {formatTime(task.scheduledTime)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {!selectionMode && (
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-400" />
                                  </button>
                                )}
                              </div>

                              {/* Status & Action Row */}
                              {!selectionMode && (
                                <div className="flex items-center gap-3">
                                <div className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold text-center ${
                                  isOverdue 
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' 
                                    : isDueToday
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {formatDueDate(task.nextDueAt)}
                                </div>
                                
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Check className="w-4 h-4" />
                                  Done
                                </button>
                              </div>
                              )}

                              {/* Expandable Details */}
                              {!selectionMode && (task.description || task.notes || task.streak || task.lastCompleted) && (
                                <button
                                  onClick={() => toggleTaskExpanded(task.id)}
                                  className="w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                  <span>{isTaskExpanded ? 'Less' : 'More'} info</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isTaskExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}

                              {/* Collapsible Content */}
                              {isTaskExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                  {/* Description */}
                                  {task.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Frequency & Schedule */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      {formatFrequency(task.frequency, task.customFrequencyDays)}
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  {(task.lastCompleted || task.streak) && (
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                      {task.lastCompleted && (
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Last: {task.lastCompleted.toLocaleDateString()}
                                        </span>
                                      )}
                                      {task.streak && task.streak > 0 && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                                          <Flame className="w-3 h-3" />
                                          {task.streak} day streak
                                        </div>
                                      )}
                                    </div>
                                  )}

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
                          </div>
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
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
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

      {/* Notification Permission Prompt */}
      <NotificationPrompt 
        show={showNotificationPrompt} 
        onClose={() => setShowNotificationPrompt(false)} 
      />

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTaskCreated={() => {
          loadTasks();
          setShowModal(false);
        }}
        onNotificationPromptNeeded={() => setShowNotificationPrompt(true)}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => {
          loadTasks();
          setEditingTask(null);
        }}
      />
    </div>
  );
}
