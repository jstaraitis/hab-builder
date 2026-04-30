import { useState, useEffect } from 'react';
import { X, ClipboardList, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { notificationService } from '../../services/notificationService';
import { buildTasksFromEnclosureById } from '../../services/enclosureTaskBuilder';
import type { TaskType, TaskFrequency, CareTask, Enclosure, EnclosureAnimal } from '../../types/careCalendar';
import { getNextDateForCustomWeekdays, WEEKDAY_OPTIONS } from '../../utils/customTaskFrequency';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onNotificationPromptNeeded?: () => void;
  layout?: 'modal' | 'page';
}

interface TaskFormData {
  animalId: string;
  title: string;
  description: string;
  type: TaskType;
  frequency: TaskFrequency;
  customFrequencyType?: 'weekdays' | 'interval';
  customFrequencyDays?: number;
  customFrequencyWeekdays?: number[];
  startDate?: string; // ISO date string (YYYY-MM-DD)
  scheduledTime: string;
  notificationEnabled: boolean;
  notificationMinutesBefore: number;
}

export function TaskCreationModal({
  isOpen,
  onClose,
  onTaskCreated,
  onNotificationPromptNeeded,
  layout = 'modal'
}: TaskCreationModalProps) {
  const { user } = useAuth();
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [selectedEnclosure, setSelectedEnclosure] = useState<string>('');
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(''); // enclosureAnimalId (empty = whole enclosure)
  const [taskMode, setTaskMode] = useState<'choose' | 'template' | 'custom'>('choose');
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
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

  // Load animals when enclosure is selected
  useEffect(() => {
    if (selectedEnclosure) {
      loadAnimals();
    } else {
      setAnimals([]);
      setSelectedAnimalId('');
    }
  }, [selectedEnclosure]);

  const loadAnimals = async () => {
    try {
      const data = await enclosureAnimalService.getAnimalsByEnclosure(selectedEnclosure);
      setAnimals(data);
    } catch (err) {
      console.error('Failed to load animals:', err);
    }
  };

  const handleLoadRecommended = async () => {
    if (!selectedEnclosure || !user) return;
    const enclosure = enclosures.find(e => e.id === selectedEnclosure);
    if (!enclosure) return;

    setTaskMode('template');
    setGeneratingTemplate(true);
    setTasks([]);
    setError(null);

    try {
      const builtTasks = await buildTasksFromEnclosureById(enclosure, user.id);

      if (builtTasks && builtTasks.length > 0) {
        setTasks(builtTasks.map(t => ({
          animalId: t.animalId,
          title: t.title,
          description: t.description ?? '',
          type: t.type,
          frequency: t.frequency,
          customFrequencyType: undefined,
          customFrequencyDays: undefined,
          customFrequencyWeekdays: undefined,
          startDate: undefined,
          scheduledTime: t.scheduledTime ?? '09:00',
          notificationEnabled: true,
          notificationMinutesBefore: 15,
        })));
      } else {
        // Fallback for custom/unknown species
        const { getTemplateForAnimal } = await import('../../data/care-templates');
        const fallback = getTemplateForAnimal('basic-care');
        if (fallback) {
          setTasks(fallback.tasks.map(t => ({
            animalId: enclosure.animalId,
            title: t.title,
            description: t.description,
            type: t.type as TaskType,
            frequency: t.frequency as TaskFrequency,
            customFrequencyType: undefined,
            customFrequencyDays: undefined,
            customFrequencyWeekdays: undefined,
            startDate: undefined,
            scheduledTime: t.scheduledTime,
            notificationEnabled: true,
            notificationMinutesBefore: 15,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to generate recommended tasks:', err);
      setError('Failed to generate recommended tasks. Try creating tasks manually.');
      setTaskMode('choose');
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!user) {
      setError('You must be logged in to create tasks');
      return;
    }

    const invalidCustomTaskIndex = tasks.findIndex(task => {
      if (task.frequency !== 'custom') return false;
      if (task.customFrequencyType === 'interval') {
        return !task.customFrequencyDays || task.customFrequencyDays < 1;
      }
      return !task.customFrequencyWeekdays || task.customFrequencyWeekdays.length === 0;
    });

    if (invalidCustomTaskIndex >= 0) {
      const invalidTask = tasks[invalidCustomTaskIndex];
      setError(
        invalidTask.customFrequencyType === 'interval'
          ? `Task ${invalidCustomTaskIndex + 1}: enter a valid number of days for custom frequency.`
          : `Task ${invalidCustomTaskIndex + 1}: select at least one weekday for custom frequency.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create all tasks
      for (const taskData of tasks) {
        const now = new Date();
        let nextDueAt = new Date();

        // Use start date if provided, otherwise use today
        if (taskData.startDate) {
          // Parse date as local date, not UTC (add 'T00:00:00' to force local timezone)
          const [year, month, day] = taskData.startDate.split('-').map(Number);
          nextDueAt = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          nextDueAt.setHours(0, 0, 0, 0); // Start from today
        }

        // Parse scheduled time and apply it to nextDueAt
        if (taskData.scheduledTime) {
          const [hours, minutes] = taskData.scheduledTime.split(':').map(Number);
          nextDueAt.setHours(hours, minutes, 0, 0);

          // If no start date was provided and the scheduled time has already passed today, move to tomorrow
          if (!taskData.startDate && nextDueAt <= now) {
            nextDueAt.setDate(nextDueAt.getDate() + 1);
          }
        } else {
          // No scheduled time - default to tomorrow at 9 AM if no start date
          if (!taskData.startDate) {
            nextDueAt.setDate(nextDueAt.getDate() + 1);
          }
          nextDueAt.setHours(9, 0, 0, 0);
        }

        if (
          taskData.frequency === 'custom' &&
          taskData.customFrequencyType !== 'interval' &&
          taskData.customFrequencyWeekdays &&
          taskData.customFrequencyWeekdays.length > 0
        ) {
          const isMatchingDay = taskData.customFrequencyWeekdays.includes(nextDueAt.getDay());
          if (!isMatchingDay || nextDueAt <= now) {
            const nextWeekday = getNextDateForCustomWeekdays(nextDueAt, taskData.customFrequencyWeekdays);
            nextWeekday.setHours(nextDueAt.getHours(), nextDueAt.getMinutes(), 0, 0);
            nextDueAt = nextWeekday;
          }
        }

        // 'as-needed' tasks: set far in the future so they never appear overdue
        if (taskData.frequency === 'as-needed') {
          nextDueAt = new Date();
          nextDueAt.setDate(nextDueAt.getDate() + 30);
          if (taskData.scheduledTime) {
            const [hours, minutes] = taskData.scheduledTime.split(':').map(Number);
            nextDueAt.setHours(hours, minutes, 0, 0);
          } else {
            nextDueAt.setHours(9, 0, 0, 0);
          }
        }

        const newTask: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.id,
          enclosureId: selectedEnclosure || undefined,
          enclosureAnimalId: selectedAnimalId || undefined, // Add animal selection
          animalId: taskData.animalId,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          frequency: taskData.frequency,
          customFrequencyDays: taskData.frequency === 'custom' && taskData.customFrequencyType === 'interval'
            ? Math.max(1, taskData.customFrequencyDays || 1)
            : undefined,
          customFrequencyWeekdays: taskData.frequency === 'custom' && taskData.customFrequencyType !== 'interval'
            ? (taskData.customFrequencyWeekdays || [1, 3, 5])
            : undefined,
          scheduledTime: taskData.scheduledTime,
          startDate: taskData.startDate ? new Date(taskData.startDate) : undefined,
          nextDueAt,
          isActive: true,
          notificationEnabled: taskData.notificationEnabled,
          notificationMinutesBefore: taskData.notificationMinutesBefore,
        };

        await careTaskService.createTask(newTask);
      }

      // Check if any tasks had notifications enabled and prompt user if notifications not set up
      const hasNotifications = tasks.some(t => t.notificationEnabled);
      const notificationPermission = notificationService.getPermissionStatus();
      const isSubscribed = await notificationService.isSubscribed();
      
      console.log('[TaskCreation] Notification check:', {
        hasNotifications,
        notificationPermission,
        isSubscribed
      });

      // Clear any previous dismissals so prompt can show again
      if (hasNotifications && !isSubscribed) {
        sessionStorage.removeItem('notification-prompt-dismissed');
      }

      // Show prompt if notifications needed but not properly set up
      // This includes: permission not granted OR permission granted but no active subscription
      if (hasNotifications && onNotificationPromptNeeded) {
        if (notificationPermission === 'default' || (notificationPermission === 'granted' && !isSubscribed)) {
          console.log('[TaskCreation] Triggering notification prompt');
          // Trigger notification prompt after a brief delay so modal closes first
          setTimeout(() => {
            onNotificationPromptNeeded();
          }, 500);
        }
      }

      onTaskCreated();
      onClose();
      setSelectedEnclosure('');
      setTasks([]);
      setTaskMode('choose');
    } catch (err) {
      console.error('Failed to create tasks:', err);
      const errorCode = typeof err === 'object' && err && 'code' in err ? String((err as any).code) : '';
      const errorMessage = typeof err === 'object' && err && 'message' in err ? String((err as any).message) : '';

      if (errorCode === '23514' && errorMessage.includes('care_tasks_type_check')) {
        setError('Your database schema is outdated for the selected task type. Run docs/CARE_TASK_TYPES_EXPANSION_MIGRATION.sql in Supabase, then try again.');
      } else {
        setError('Failed to create tasks. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTask = <K extends keyof TaskFormData>(index: number, field: K, value: TaskFormData[K]) => {
    setTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateTaskFrequency = (index: number, frequencyValue: string) => {
    const frequency = frequencyValue as TaskFrequency;

    setTasks(prev => {
      const updated = [...prev];
      const current = updated[index];

      updated[index] = {
        ...current,
        frequency,
        customFrequencyType: frequency === 'custom'
          ? (current.customFrequencyType || 'weekdays')
          : undefined,
        customFrequencyDays: frequency === 'custom'
          ? current.customFrequencyDays
          : undefined,
        customFrequencyWeekdays: frequency === 'custom'
          ? (current.customFrequencyWeekdays && current.customFrequencyWeekdays.length > 0
            ? current.customFrequencyWeekdays
            : [1, 3, 5])
          : undefined,
      };

      return updated;
    });
  };

  const toggleCustomWeekday = (index: number, day: number) => {
    setTasks(prev => {
      const updated = [...prev];
      const current = updated[index];
      const currentDays = current.customFrequencyWeekdays || [];
      const hasDay = currentDays.includes(day);
      const nextDays = hasDay
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);

      updated[index] = {
        ...current,
        customFrequencyType: 'weekdays',
        customFrequencyWeekdays: nextDays,
      };

      return updated;
    });
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomFrequencyType = (index: number, customFrequencyType: 'weekdays' | 'interval') => {
    setTasks(prev => {
      const updated = [...prev];
      const current = updated[index];
      updated[index] = {
        ...current,
        customFrequencyType,
        customFrequencyDays: customFrequencyType === 'interval'
          ? (current.customFrequencyDays && current.customFrequencyDays > 0 ? current.customFrequencyDays : 3)
          : undefined,
        customFrequencyWeekdays: customFrequencyType === 'weekdays'
          ? (current.customFrequencyWeekdays && current.customFrequencyWeekdays.length > 0 ? current.customFrequencyWeekdays : [1, 3, 5])
          : undefined,
      };
      return updated;
    });
  };

  const isTaskCustomInvalid = (task: TaskFormData) => {
    if (task.frequency !== 'custom') return false;
    if (task.customFrequencyType === 'interval') {
      return !task.customFrequencyDays || task.customFrequencyDays < 1;
    }
    return !task.customFrequencyWeekdays || task.customFrequencyWeekdays.length === 0;
  };

  if (!isOpen) return null;

  const selectClass = 'w-full bg-card-elevated text-white text-sm focus:outline-none border-0';
  const inputClass = 'w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-muted';

  // ─── Page layout ────────────────────────────────────────────────────────────
  if (layout === 'page') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-between border-b border-divider">
          <h1 className="text-lg font-bold text-white">Create Care Tasks</h1>
          <button onClick={onClose} className="text-sm font-semibold text-accent">Back</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-28">
          <div className="space-y-3 px-4 py-4">

            {/* Step 1: Enclosure selection */}
            {!selectedEnclosure && (
              <>
                {enclosures.length === 0 ? (
                  <div className="bg-card border border-divider rounded-2xl p-5 text-center">
                    <p className="text-white text-sm font-semibold mb-1">No enclosures yet</p>
                    <p className="text-muted text-xs">Close this and add your first pet to get started.</p>
                  </div>
                ) : (
                  <div className="bg-card border border-divider rounded-2xl overflow-hidden">
                    <div className="px-4 py-3">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                        Select Enclosure <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedEnclosure}
                        onChange={(e) => { setSelectedEnclosure(e.target.value); setTaskMode('choose'); }}
                        className={selectClass}
                        required
                      >
                        <option value="">Choose which pet these tasks are for...</option>
                        {enclosures.map(enc => (
                          <option key={enc.id} value={enc.id}>{enc.name} ({enc.animalName})</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted mt-1.5">Tasks will be linked to this enclosure</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Mode selection */}
            {selectedEnclosure && taskMode === 'choose' && (
              <>
                <button onClick={() => setSelectedEnclosure('')} className="text-xs text-accent flex items-center gap-1 px-1">
                  ← Change enclosure
                </button>
                <p className="text-sm font-semibold text-white px-1">How would you like to create tasks?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLoadRecommended}
                    className="bg-card border border-divider rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm font-semibold text-white">Recommended</span>
                  </button>
                  <button
                    onClick={() => {
                      const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                      setTaskMode('custom');
                      setTasks([{ animalId: selectedEnc?.animalId || 'custom', title: '', description: '', type: 'custom', frequency: 'daily', customFrequencyType: undefined, customFrequencyDays: undefined, customFrequencyWeekdays: undefined, startDate: undefined, scheduledTime: '09:00', notificationEnabled: true, notificationMinutesBefore: 15 }]);
                    }}
                    className="bg-card border border-divider rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Custom</span>
                  </button>
                </div>
              </>
            )}

            {/* Generating state */}
            {selectedEnclosure && taskMode === 'template' && generatingTemplate && (
              <div className="flex items-center justify-center py-8 gap-3">
                <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-muted">Generating recommended tasks…</span>
              </div>
            )}

            {/* Step 4: Task configuration */}
            {selectedEnclosure && tasks.length > 0 && !generatingTemplate && (
              <>
                {/* Back + header */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => { setTaskMode('choose'); setTasks([]); }}
                    className="text-xs text-accent"
                  >← Back</button>
                </div>
                <div className="px-1">
                  <p className="text-sm font-semibold text-white">{taskMode === 'custom' ? 'Custom Care Tasks' : (enclosures.find(e => e.id === selectedEnclosure)?.animalName ?? 'Recommended Tasks')}</p>
                  <p className="text-xs text-muted">{tasks.length} task{tasks.length !== 1 ? 's' : ''} • Customize as needed</p>
                </div>

                {/* Animal selector card */}
                <div className="bg-card border border-divider rounded-2xl overflow-hidden">
                  <div className="px-4 py-3">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                      {taskMode === 'custom' ? 'These tasks are for' : 'Tasks will be for'}
                    </label>
                    <select
                      value={selectedAnimalId}
                      onChange={(e) => setSelectedAnimalId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Whole Enclosure (all animals)</option>
                      {animals.map(animal => (
                        <option key={animal.id} value={animal.id}>{animal.name || `Animal #${animal.animalNumber || '?'}`}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted mt-1">
                      {selectedAnimalId
                        ? `Specific to ${animals.find(a => a.id === selectedAnimalId)?.name || 'this animal'}`
                        : 'Applies to the whole enclosure'}
                    </p>
                  </div>
                </div>

                {/* Task cards */}
                {tasks.map((task, index) => (
                  <div key={index} className="bg-card border border-divider rounded-2xl overflow-hidden">
                    {/* Title row */}
                    <div className="px-4 py-3 border-b border-divider flex items-center gap-3">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        placeholder="Task name (e.g. Feed, Mist, Clean)"
                        className={`flex-1 ${inputClass} font-semibold`}
                      />
                      <button onClick={() => removeTask(index)} type="button" className="text-xs text-red-400 shrink-0">Remove</button>
                    </div>

                    {/* Type + Frequency */}
                    <div className="grid grid-cols-2 divide-x divide-divider border-b border-divider">
                      <div className="px-4 py-3">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Type</label>
                        <select value={task.type} onChange={(e) => updateTask(index, 'type', e.target.value as TaskType)} className={selectClass}>
                          <option value="feeding">Feeding</option>
                          <option value="gut-load">Gut-Load</option>
                          <option value="misting">Misting</option>
                          <option value="water-change">Water Change</option>
                          <option value="temperature-check">Temperature Check</option>
                          <option value="humidity-check">Humidity Check</option>
                          <option value="uvb-check">UVB Check</option>
                          <option value="spot-clean">Spot Clean</option>
                          <option value="deep-clean">Deep Clean</option>
                          <option value="health-check">Health Check</option>
                          <option value="supplement">Supplement</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="substrate-check">Substrate Maintenance</option>
                          <option value="mold-check">Mold Monitoring</option>
                          <option value="cleanup-crew-check">Cleanup Crew Check</option>
                          <option value="plant-care">Plant Care</option>
                          <option value="pest-check">Pest Monitoring</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div className="px-4 py-3">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Frequency</label>
                        <select value={task.frequency} onChange={(e) => updateTaskFrequency(index, e.target.value)} className={selectClass}>
                          <option value="daily">Daily</option>
                          <option value="every-other-day">Every Other Day</option>
                          <option value="twice-weekly">Twice Weekly</option>
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="as-needed">As Needed</option>
                          <option value="custom">Custom Days</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom weekdays */}
                    {task.frequency === 'custom' && (
                      <div className="px-4 py-3 border-b border-divider">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Custom Type</label>
                        <select
                          value={task.customFrequencyType || 'weekdays'}
                          onChange={(e) => updateCustomFrequencyType(index, e.target.value as 'weekdays' | 'interval')}
                          className={`${selectClass} mb-2`}
                        >
                          <option value="weekdays">Specific weekdays</option>
                          <option value="interval">Every X days</option>
                        </select>

                        {(task.customFrequencyType || 'weekdays') === 'interval' ? (
                          <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Days Interval</label>
                            <input
                              type="number"
                              min={1}
                              value={task.customFrequencyDays ?? 3}
                              onChange={(e) => updateTask(index, 'customFrequencyDays', Math.max(1, parseInt(e.target.value || '1', 10)))}
                              className="w-full bg-transparent text-white text-sm focus:outline-none"
                            />
                            <p className="text-xs text-muted mt-1.5">Example: 4 means this task appears every 4 days.</p>
                          </div>
                        ) : (
                          <>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Weekdays</label>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAY_OPTIONS.map((weekday) => {
                                const isSelected = (task.customFrequencyWeekdays || []).includes(weekday.value);
                                return (
                                  <button
                                    key={weekday.value}
                                    type="button"
                                    onClick={() => toggleCustomWeekday(index, weekday.value)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${isSelected ? 'bg-accent border-accent text-on-accent' : 'bg-card-elevated border-divider text-muted'}`}
                                  >
                                    {weekday.shortLabel}
                                  </button>
                                );
                              })}
                            </div>
                            {(task.customFrequencyWeekdays || []).length === 0 && (
                              <p className="text-xs text-amber-400 mt-1.5">Select at least one day.</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Time + Start Date */}
                    <div className="grid grid-cols-2 divide-x divide-divider border-b border-divider">
                      <div className="px-4 py-3">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Time</label>
                        <input
                          type="time"
                          value={task.scheduledTime}
                          onChange={(e) => updateTask(index, 'scheduledTime', e.target.value)}
                          className="w-full bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="px-4 py-3">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={task.startDate || ''}
                          onChange={(e) => updateTask(index, 'startDate', e.target.value)}
                          className="w-full bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    {/* Notifications */}
                    <label className="flex items-center justify-between px-4 py-3 cursor-pointer border-b border-divider">
                      <span className="text-sm text-white">Push notifications</span>
                      <input
                        type="checkbox"
                        checked={task.notificationEnabled}
                        onChange={(e) => setTasks(prev => { const u = [...prev]; u[index] = { ...u[index], notificationEnabled: e.target.checked }; return u; })}
                        className="w-5 h-5 accent-accent rounded"
                      />
                    </label>
                    {task.notificationEnabled && (
                      <div className="px-4 py-3 border-b border-divider">
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Remind me</label>
                        <select
                          value={task.notificationMinutesBefore}
                          onChange={(e) => setTasks(prev => { const u = [...prev]; u[index] = { ...u[index], notificationMinutesBefore: parseInt(e.target.value) }; return u; })}
                          className={selectClass}
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

                    {/* Description */}
                    <div className="px-4 py-3">
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Details (optional)</label>
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                        placeholder="Add details about this task..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                ))}

                {/* Add task button (custom mode) */}
                {taskMode === 'custom' && (
                  <button
                    type="button"
                    onClick={() => {
                      const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                      setTasks(prev => [...prev, { animalId: selectedEnc?.animalId || 'custom', title: '', description: '', type: 'custom', frequency: 'daily', customFrequencyType: undefined, customFrequencyDays: undefined, customFrequencyWeekdays: undefined, startDate: undefined, scheduledTime: '09:00', notificationEnabled: true, notificationMinutesBefore: 15 }]);
                    }}
                    className="w-full bg-card border border-dashed border-divider rounded-2xl py-3 text-sm font-semibold text-accent"
                  >
                    + Add Another Task
                  </button>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">{error}</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sticky footer — shown once tasks are ready */}
        {tasks.length > 0 && !generatingTemplate && (
          <div className="sticky bottom-0 bg-surface border-t border-divider px-4 py-3 flex items-center justify-between z-10">
            <span className="text-xs text-muted">{tasks.length} task{tasks.length !== 1 ? 's' : ''} ready</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-full bg-card border border-divider text-white text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTasks}
                disabled={loading || tasks.length === 0 || tasks.some(isTaskCustomInvalid)}
                className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating…' : `Create ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Modal layout (bottom sheet / centered dialog) ───────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 pb-16 sm:pb-0">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <h2 className="text-lg font-bold text-white">Create Care Tasks</h2>
          <button onClick={onClose} className="text-muted p-1 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Step 1 */}
          {!selectedEnclosure && (
            enclosures.length === 0 ? (
              <div className="bg-card-elevated border border-divider rounded-xl p-5 text-center">
                <p className="text-white text-sm font-semibold mb-1">No enclosures yet</p>
                <p className="text-muted text-xs">Close this and add your first pet to get started.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Select Enclosure <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedEnclosure}
                  onChange={(e) => { setSelectedEnclosure(e.target.value); setTaskMode('choose'); }}
                  className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none"
                  required
                >
                  <option value="">Choose which pet these tasks are for...</option>
                  {enclosures.map(enc => <option key={enc.id} value={enc.id}>{enc.name} ({enc.animalName})</option>)}
                </select>
              </div>
            )
          )}

          {/* Step 2 */}
          {selectedEnclosure && taskMode === 'choose' && (
            <div className="space-y-3">
              <button onClick={() => setSelectedEnclosure('')} className="text-xs text-accent">← Change enclosure</button>
              <p className="text-sm font-semibold text-white">How would you like to create tasks?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleLoadRecommended}
                  className="bg-card-elevated border border-divider rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-accent" /></div>
                  <span className="text-sm font-semibold text-white">Recommended</span>
                </button>
                <button
                  onClick={() => {
                    const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                    setTaskMode('custom');
                    setTasks([{ animalId: selectedEnc?.animalId || 'custom', title: '', description: '', type: 'custom', frequency: 'daily', customFrequencyType: undefined, customFrequencyDays: undefined, customFrequencyWeekdays: undefined, startDate: undefined, scheduledTime: '09:00', notificationEnabled: true, notificationMinutesBefore: 15 }]);
                  }}
                  className="bg-card-elevated border border-divider rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><Edit3 className="w-4 h-4 text-blue-400" /></div>
                  <span className="text-sm font-semibold text-white">Custom</span>
                </button>
              </div>
            </div>
          )}

          {/* Generating state */}
          {selectedEnclosure && taskMode === 'template' && generatingTemplate && (
            <div className="flex items-center justify-center py-8 gap-3">
              <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm text-muted">Generating recommended tasks…</span>
            </div>
          )}

          {/* Step 4 */}
          {selectedEnclosure && tasks.length > 0 && !generatingTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button onClick={() => { setTaskMode('choose'); setTasks([]); }} className="text-xs text-accent">← Back</button>
              </div>

              {/* Per-task cards */}
              {tasks.map((task, index) => (
                <div key={index} className="bg-card-elevated border border-divider rounded-xl divide-y divide-divider">
                  <div className="px-3 py-2.5 flex items-center gap-2">
                    <input type="text" value={task.title} onChange={(e) => updateTask(index, 'title', e.target.value)}
                      placeholder="Task name" className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none placeholder:text-muted" />
                    <button onClick={() => removeTask(index)} type="button" className="text-xs text-red-400">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-divider">
                    <div className="px-3 py-2">
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Type</label>
                      <select value={task.type} onChange={(e) => updateTask(index, 'type', e.target.value as TaskType)} className="w-full bg-transparent text-white text-xs focus:outline-none">
                        <option value="feeding">Feeding</option>
                        <option value="gut-load">Gut-Load</option>
                        <option value="misting">Misting</option>
                        <option value="water-change">Water Change</option>
                        <option value="temperature-check">Temperature Check</option>
                        <option value="humidity-check">Humidity Check</option>
                        <option value="uvb-check">UVB Check</option>
                        <option value="spot-clean">Spot Clean</option>
                        <option value="deep-clean">Deep Clean</option>
                        <option value="health-check">Health Check</option>
                        <option value="supplement">Supplement</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="substrate-check">Substrate Maintenance</option>
                        <option value="mold-check">Mold Monitoring</option>
                        <option value="cleanup-crew-check">Cleanup Crew Check</option>
                        <option value="plant-care">Plant Care</option>
                        <option value="pest-check">Pest Monitoring</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="px-3 py-2">
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Frequency</label>
                      <select value={task.frequency} onChange={(e) => updateTaskFrequency(index, e.target.value)} className="w-full bg-transparent text-white text-xs focus:outline-none">
                        <option value="daily">Daily</option>
                        <option value="every-other-day">Every Other Day</option>
                        <option value="twice-weekly">Twice Weekly</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="as-needed">As Needed</option>
                        <option value="custom">Custom Days</option>
                      </select>
                    </div>
                  </div>
                  {task.frequency === 'custom' && (
                    <div className="px-3 py-2.5">
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Custom Type</label>
                      <select
                        value={task.customFrequencyType || 'weekdays'}
                        onChange={(e) => updateCustomFrequencyType(index, e.target.value as 'weekdays' | 'interval')}
                        className="w-full bg-transparent text-white text-xs focus:outline-none mb-2"
                      >
                        <option value="weekdays">Specific weekdays</option>
                        <option value="interval">Every X days</option>
                      </select>

                      {(task.customFrequencyType || 'weekdays') === 'interval' ? (
                        <input
                          type="number"
                          min={1}
                          value={task.customFrequencyDays ?? 3}
                          onChange={(e) => updateTask(index, 'customFrequencyDays', Math.max(1, parseInt(e.target.value || '1', 10)))}
                          className="w-full bg-transparent text-white text-xs focus:outline-none"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAY_OPTIONS.map((weekday) => {
                            const isSelected = (task.customFrequencyWeekdays || []).includes(weekday.value);
                            return (
                              <button key={weekday.value} type="button" onClick={() => toggleCustomWeekday(index, weekday.value)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${isSelected ? 'bg-accent border-accent text-on-accent' : 'border-divider text-muted'}`}>
                                {weekday.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 divide-x divide-divider">
                    <div className="px-3 py-2">
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Time</label>
                      <input type="time" value={task.scheduledTime} onChange={(e) => updateTask(index, 'scheduledTime', e.target.value)}
                        className="w-full bg-transparent text-white text-xs focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" style={{ colorScheme: 'dark' }} />
                    </div>
                    <div className="px-3 py-2">
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Start Date</label>
                      <input type="date" value={task.startDate || ''} onChange={(e) => updateTask(index, 'startDate', e.target.value)}
                        className="w-full bg-transparent text-white text-xs focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" style={{ colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
                    <span className="text-xs text-white">Push notifications</span>
                    <input type="checkbox" checked={task.notificationEnabled}
                      onChange={(e) => setTasks(prev => { const u = [...prev]; u[index] = { ...u[index], notificationEnabled: e.target.checked }; return u; })}
                      className="w-4 h-4 accent-accent rounded" />
                  </label>
                </div>
              ))}

              {taskMode === 'custom' && (
                <button type="button"
                  onClick={() => {
                    const selectedEnc = enclosures.find(e => e.id === selectedEnclosure);
                    setTasks(prev => [...prev, { animalId: selectedEnc?.animalId || 'custom', title: '', description: '', type: 'custom', frequency: 'daily', customFrequencyType: undefined, customFrequencyDays: undefined, customFrequencyWeekdays: undefined, startDate: undefined, scheduledTime: '09:00', notificationEnabled: true, notificationMinutesBefore: 15 }]);
                  }}
                  className="w-full border border-dashed border-divider rounded-xl py-2.5 text-sm font-semibold text-accent">
                  + Add Another Task
                </button>
              )}

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && !generatingTemplate && (
          <div className="border-t border-divider px-4 py-3 bg-surface shrink-0 flex items-center justify-between">
            <span className="text-xs text-muted">{tasks.length} task{tasks.length !== 1 ? 's' : ''} ready</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={loading}
                className="px-4 py-2 rounded-full bg-card border border-divider text-white text-sm font-semibold disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleCreateTasks}
                disabled={loading || tasks.length === 0 || tasks.some(isTaskCustomInvalid)}
                className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating…' : `Create ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

