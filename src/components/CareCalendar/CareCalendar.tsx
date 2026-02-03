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
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from '../Auth';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { TaskCreationModal } from './TaskCreationModal';
import { TaskEditModal } from './TaskEditModal';
import { EnclosureManager } from './EnclosureManager';
import { NotificationPrompt } from './NotificationPrompt';
import type { CareTaskWithLogs, TaskType, CareTask, Enclosure } from '../../types/careCalendar';

export function CareCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [filterEnclosureId, setFilterEnclosureId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTask | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  useEffect(() => {
    if (user) {
      loadTasks();
      loadEnclosures();
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

  // Filter tasks based on selected enclosure
  const filteredTasks = filterEnclosureId === ''
    ? tasks // Show all
    : filterEnclosureId === 'none'
    ? tasks.filter(t => !t.enclosureId) // Show tasks without enclosure
    : tasks.filter(t => t.enclosureId === filterEnclosureId); // Show specific enclosure

  // Helper to get enclosure name
  const getEnclosureName = (enclosureId?: string) => {
    if (!enclosureId) return null;
    const enclosure = enclosures.find(e => e.id === enclosureId);
    return enclosure ? enclosure.name : 'Unknown';
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
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
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
            <Hand className="w-5 h-5" />
            Welcome to Care Tasks!
          </h2>
          <div className="space-y-2 text-emerald-800 dark:text-emerald-200">
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Care Tasks
          </h2>
          {enclosures.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="enclosure-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter:
                </label>
                <select
                  id="enclosure-filter"
                  value={filterEnclosureId}
                  onChange={(e) => setFilterEnclosureId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Tasks</option>
                  {enclosures.map(enc => (
                    <option key={enc.id} value={enc.id}>
                      {enc.name} ({enc.animalName})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTasks.map(task => {
              const isOverdue = task.nextDueAt < new Date();
              const isDueToday = task.nextDueAt.toDateString() === new Date().toDateString();
              const isExpanded = expandedTasks.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                    isOverdue 
                      ? 'bg-white dark:bg-gray-800 border-red-400 dark:border-red-700' 
                      : isDueToday
                      ? 'bg-white dark:bg-gray-800 border-emerald-400 dark:border-emerald-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="p-3">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
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
                      
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Status & Action Row */}
                    <div className="flex items-center gap-2">
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

                    {/* Expandable Details */}
                    {(task.description || task.notes || task.streak || task.lastCompleted) && (
                      <button
                        onClick={() => toggleTaskExpanded(task.id)}
                        className="w-full mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <span>{isExpanded ? 'Less' : 'More'} info</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
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
                          <div className="flex flex-wrap items-center gap-2 text-xs">
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
              );
            })}
          </div>
        )}

        {/* Empty state when no tasks yet */}
        {enclosures.length > 0 && filteredTasks.length === 0 && !error && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No tasks yet. Click "+ Add Task" above to create care tasks for your pets.
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
