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
          <p className="text-gray-600 dark:text-gray-400">Loading care calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Care Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your pets and their care tasks
        </p>
        {/* Temporary debug button */}
        <button
          onClick={async () => {
            try {
              const { notificationService } = await import('../../services/notificationService');
              await notificationService.subscribe();
              alert('✅ Subscription saved! Check database.');
            } catch (error) {
              const errorMsg = error instanceof Error 
                ? `${error.message}\n\nStack: ${error.stack}` 
                : JSON.stringify(error, null, 2);
              alert(`❌ Error:\n${errorMsg}`);
              console.error('Subscription error:', error);
            }
          }}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
        >
          🔔 Test Push Subscription
        </button>
      </div>

      {/* Getting Started Guide (shown when no enclosures) */}
      {enclosures.length === 0 && !error && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
            <Hand className="w-5 h-5" />
            Welcome to Care Calendar!
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
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const isOverdue = task.nextDueAt < new Date();
              const isDueToday = task.nextDueAt.toDateString() === new Date().toDateString();
              const isExpanded = expandedTasks.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`relative overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-lg ${
                    isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                      : isDueToday
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Status Bar */}
                  <div className={`h-1 ${
                    isOverdue ? 'bg-red-500' : isDueToday ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  
                  <div className="p-2.5 sm:p-3.5">
                    {/* Header Row - Clickable to expand/collapse */}
                    <div 
                      onClick={() => toggleTaskExpanded(task.id)}
                      className="flex items-start justify-between gap-1.5 sm:gap-2 mb-2 cursor-pointer"
                    >
                      <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                          isOverdue 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}>
                          {React.createElement(getTaskIcon(task.type), { 
                            className: `w-4 h-4 sm:w-5 sm:h-5 ${
                              isOverdue 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-emerald-600 dark:text-emerald-400'
                            }` 
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-0.5">
                            {task.title}
                          </h3>
                          {task.enclosureId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                               {getEnclosureName(task.enclosureId)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                        {/* Due Status Badge */}
                        <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          isOverdue 
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' 
                            : isDueToday
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {formatDueDate(task.nextDueAt)}
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <>
                        {/* Description */}
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 text-xs sm:text-sm">
                          {task.lastCompleted && (
                            <div className="flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Last:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {task.lastCompleted.toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {task.streak && task.streak > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border-2 border-orange-300 dark:border-orange-700">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className="font-bold text-orange-700 dark:text-orange-400">
                                {task.streak} day streak
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        aria-label="Complete task"
                        className="flex-1 sm:flex-none sm:px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center border-2 border-emerald-700 dark:border-emerald-500"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingTask(task)}
                        aria-label="Edit task"
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-colors flex items-center justify-center border-2 border-blue-300 dark:border-blue-700"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes (if any) - Only show when expanded */}
                  {isExpanded && task.notes && (
                    <div className="px-3 sm:px-3.5 pb-3 pt-0">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Note: </span>{task.notes}
                        </p>
                      </div>
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
      <NotificationPrompt />

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTaskCreated={() => {
          loadTasks();
          setShowModal(false);
        }}
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
