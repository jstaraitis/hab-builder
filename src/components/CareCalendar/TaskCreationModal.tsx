import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { notificationService } from '../../services/notificationService';
import { getTemplateForAnimal, type CareTemplate } from '../../data/care-templates';
import type { TaskType, TaskFrequency, CareTask, Enclosure } from '../../types/careCalendar';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onNotificationPromptNeeded?: () => void;
}

interface TaskFormData {
  animalId: string;
  title: string;
  description: string;
  type: TaskType;
  frequency: TaskFrequency;
  scheduledTime: string;
  notificationEnabled: boolean;
  notificationMinutesBefore: number;
}

export function TaskCreationModal({ isOpen, onClose, onTaskCreated, onNotificationPromptNeeded }: TaskCreationModalProps) {
  const { user } = useAuth();
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [selectedEnclosure, setSelectedEnclosure] = useState<string>('');
  const [taskMode, setTaskMode] = useState<'choose' | 'template' | 'custom'>('choose');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [template, setTemplate] = useState<CareTemplate | null>(null);
  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load enclosures when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadEnclosures();
    }
  }, [isOpen, user]);

  const loadEnclosures = async () => {
    try {
      const data = await enclosureService.getEnclosures();
      setEnclosures(data);
    } catch (err) {
      console.error('Failed to load enclosures:', err);
    }
  };

  // Available animals (expand this as more templates are added)
  const availableAnimals = [
    { id: 'whites-tree-frog', name: "White's Tree Frog" },
  ];

  useEffect(() => {
    if (selectedAnimal) {
      const animalTemplate = getTemplateForAnimal(selectedAnimal);
      setTemplate(animalTemplate);
      
      if (animalTemplate) {
        // Convert template tasks to form data
        const templateTasks = animalTemplate.tasks.map(t => ({
          animalId: selectedAnimal,
          title: t.title,
          description: t.description,
          type: t.type as TaskType,
          frequency: t.frequency as TaskFrequency,
          scheduledTime: t.scheduledTime,
          notificationEnabled: true,
          notificationMinutesBefore: 15,
        }));
        console.log('Loading template tasks:', templateTasks);
        setTasks(templateTasks);
      }
    }
  }, [selectedAnimal]);

  const handleCreateTasks = async () => {
    if (!user) {
      setError('You must be logged in to create tasks');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create all tasks
      for (const taskData of tasks) {
        const now = new Date();
        const nextDueAt = new Date();
        nextDueAt.setHours(0, 0, 0, 0); // Start from today
        
        // Parse scheduled time and apply it to nextDueAt
        if (taskData.scheduledTime) {
          const [hours, minutes] = taskData.scheduledTime.split(':').map(Number);
          nextDueAt.setHours(hours, minutes, 0, 0);
          
          // If the scheduled time has already passed today, move to tomorrow
          if (nextDueAt <= now) {
            nextDueAt.setDate(nextDueAt.getDate() + 1);
          }
        } else {
          // No scheduled time - default to tomorrow at 9 AM
          nextDueAt.setDate(nextDueAt.getDate() + 1);
          nextDueAt.setHours(9, 0, 0, 0);
        }

        const newTask: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.id,
          enclosureId: selectedEnclosure || undefined,
          animalId: taskData.animalId,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          frequency: taskData.frequency,
          scheduledTime: taskData.scheduledTime,
          nextDueAt,
          isActive: true,
          notificationEnabled: taskData.notificationEnabled,
          notificationMinutesBefore: taskData.notificationMinutesBefore,
        };

        console.log('Creating task with title:', taskData.title, 'Full task data:', newTask);
        await careTaskService.createTask(newTask);
      }

      // Check if any tasks had notifications enabled and prompt user if notifications not set up
      const hasNotifications = tasks.some(t => t.notificationEnabled);
      const notificationPermission = notificationService.getPermissionStatus();
      const hasSeenPrompt = sessionStorage.getItem('notification-prompt-dismissed');
      
      if (hasNotifications && notificationPermission === 'default' && !hasSeenPrompt && onNotificationPromptNeeded) {
        // Trigger notification prompt after a brief delay so modal closes first
        setTimeout(() => {
          onNotificationPromptNeeded();
        }, 500);
      }

      onTaskCreated();
      onClose();
      setSelectedAnimal('');
      setSelectedEnclosure('');
      setTasks([]);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      setError('Failed to create tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (index: number, field: keyof TaskFormData, value: string) => {
    setTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Create Care Tasks
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mr-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
          {/* Step 1: Enclosure Selection */}
          {!selectedEnclosure ? (
            <div className="space-y-3 sm:space-y-4">
              {enclosures.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                    You need to create a pet enclosure first
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Close this dialog and add your first pet above to get started.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Enclosure <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEnclosure}
                    onChange={(e) => {
                      setSelectedEnclosure(e.target.value);
                      setTaskMode('choose');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required
                  >
                    <option value="">Choose which pet these tasks are for...</option>
                    {enclosures.map(enc => (
                      <option key={enc.id} value={enc.id}>
                        {enc.name} ({enc.animalName})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tasks will be linked to this pet
                  </p>
                </div>
              )}
            </div>
          ) : taskMode === 'choose' ? (
            /* Step 2: Choose Task Creation Mode */
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setSelectedEnclosure('')}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4"
                >
                  ← Change enclosure
                </button>
              </div>
              
              <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-4">
                How would you like to create tasks?
              </p>
              
              <div className="grid gap-4">
                {/* Recommended Tasks Option */}
                <button
                  onClick={() => setTaskMode('template')}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Use Recommended Tasks
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose from pre-made care schedules for different species with recommended frequencies and descriptions
                      </p>
                    </div>
                  </div>
                </button>

                {/* Custom Tasks Option */}
                <button
                  onClick={() => {
                    const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                    setTaskMode('custom');
                    setTasks([{
                      animalId: selectedEnc?.animalId || 'custom',
                      title: '',
                      description: '',
                      type: 'custom',
                      frequency: 'daily',
                      scheduledTime: '09:00',
                      notificationEnabled: true,
                      notificationMinutesBefore: 15,
                    }]);
                  }}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-2xl">✏️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Create Custom Tasks
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Build your own care tasks from scratch with custom names, types, and schedules
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : taskMode === 'template' && !selectedAnimal ? (
            /* Step 3a: Animal Template Selection */
            <div className="space-y-3 sm:space-y-4">
              <div>
                <button
                  onClick={() => {
                    setTaskMode('choose');
                    setSelectedAnimal('');
                  }}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4"
                >
                  ← Back
                </button>
              </div>
              
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Select an animal to load recommended care tasks:
              </p>
              <div className="grid gap-2 sm:gap-3">
                {availableAnimals.map(animal => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className="p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-left"
                  >
                    <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {animal.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Includes {template?.tasks.length || '7'} recommended care tasks
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Step 4: Task Configuration (Template or Custom) */
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      if (taskMode === 'template') {
                        setSelectedAnimal('');
                      } else {
                        setTaskMode('choose');
                        setTasks([]);
                      }
                    }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-2"
                  >
                    ← Back
                  </button>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {taskMode === 'custom' ? 'Custom Care Tasks' : (template?.species || selectedAnimal)}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {tasks.length} tasks • Customize as needed
                  </p>
                </div>
                {taskMode === 'custom' && (
                  <button
                    onClick={() => {
                      const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                      setTasks(prev => [...prev, {
                        animalId: selectedEnc?.animalId || 'custom',
                        title: '',
                        description: '',
                        type: 'custom',
                        frequency: 'daily',
                        scheduledTime: '09:00',
                        notificationEnabled: true,
                        notificationMinutesBefore: 15,
                      }]);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors shrink-0"
                  >
                    + Add Task
                  </button>
                )}
                {taskMode === 'template' && (
                  <button
                    onClick={() => {
                      setSelectedAnimal('');
                      setTasks([]);
                    }}
                    className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Task List */}
              <div className="space-y-3 sm:space-y-4">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        placeholder="Task name (e.g., 'Feed', 'Clean tank')"
                        className="flex-1 text-base sm:text-lg font-medium px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        onClick={() => removeTask(index)}
                        className="text-red-500 hover:text-red-700 shrink-0 -mr-1"
                        title="Remove task"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      placeholder="Optional: Add details about this task..."
                      rows={2}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-xs sm:text-sm"
                    />

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Type
                        </label>
                        <select
                          value={task.type}
                          onChange={(e) => updateTask(index, 'type', e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                        >
                          <option value="feeding">Feeding</option>
                          <option value="misting">Misting</option>
                          <option value="water-change">Water Change</option>
                          <option value="spot-clean">Spot Clean</option>
                          <option value="deep-clean">Deep Clean</option>
                          <option value="health-check">Health Check</option>
                          <option value="supplement">Supplement</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Frequency
                        </label>
                        <select
                          value={task.frequency}
                          onChange={(e) => updateTask(index, 'frequency', e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="every-other-day">Every Other Day</option>
                          <option value="twice-weekly">Twice Weekly</option>
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={task.scheduledTime}
                          onChange={(e) => updateTask(index, 'scheduledTime', e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.notificationEnabled}
                          onChange={(e) => setTasks(prev => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], notificationEnabled: e.target.checked };
                            return updated;
                          })}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          Send push notification reminders
                        </span>
                      </label>

                      {task.notificationEnabled && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Remind me
                          </label>
                          <select
                            value={task.notificationMinutesBefore}
                            onChange={(e) => setTasks(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], notificationMinutesBefore: parseInt(e.target.value) };
                              return updated;
                            })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                          >
                            <option value="5">5 minutes before</option>
                            <option value="10">10 minutes before</option>
                            <option value="15">15 minutes before</option>
                            <option value="30">30 minutes before</option>
                            <option value="60">1 hour before</option>
                            <option value="120">2 hours before</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(selectedAnimal || (taskMode === 'custom' && tasks.length > 0)) && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-between bg-gray-50 dark:bg-gray-900 shrink-0">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} ready
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTasks}
                disabled={loading || tasks.length === 0}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Creating...' : `Create ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
