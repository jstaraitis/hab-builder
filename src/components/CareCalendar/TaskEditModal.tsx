import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import type { CareTask, Enclosure, TaskType } from '../../types/careCalendar';
import { WEEKDAY_OPTIONS } from '../../utils/customTaskFrequency';

interface TaskEditModalProps {
  task: CareTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  layout?: 'modal' | 'page';
}

export function TaskEditModal({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  layout = 'modal'
}: TaskEditModalProps) {
  const [formData, setFormData] = useState<Partial<CareTask>>({});
  const [customFrequencyType, setCustomFrequencyType] = useState<'weekdays' | 'interval'>('weekdays');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);

  useEffect(() => {
    if (task) {
      const inferredCustomType = task.customFrequencyDays && task.customFrequencyDays > 0 && (!task.customFrequencyWeekdays || task.customFrequencyWeekdays.length === 0)
        ? 'interval'
        : 'weekdays';
      setCustomFrequencyType(inferredCustomType);

      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        frequency: task.frequency,
        customFrequencyDays: task.customFrequencyDays,
        customFrequencyWeekdays: task.customFrequencyWeekdays,
        scheduledTime: task.scheduledTime,
        startDate: task.startDate,
        notes: task.notes,
        enclosureId: task.enclosureId,
        // Explicitly set to false if undefined to ensure updates work correctly
        notificationEnabled: task.notificationEnabled ?? false,
        notificationMinutesBefore: task.notificationMinutesBefore || 15,
      });
    }
  }, [task]);

  useEffect(() => {
    const loadEnclosures = async () => {
      try {
        const data = await enclosureService.getEnclosures();
        setEnclosures(data);
      } catch (err) {
        console.error('Failed to load enclosures:', err);
      }
    };
    loadEnclosures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (formData.frequency === 'custom') {
      if (customFrequencyType === 'interval') {
        if (!formData.customFrequencyDays || formData.customFrequencyDays < 1) {
          setError('Enter a valid number of days for custom frequency.');
          return;
        }
      } else if (!formData.customFrequencyWeekdays || formData.customFrequencyWeekdays.length === 0) {
        setError('Select at least one weekday for custom frequency.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Debug logging for notification settings
    console.log('[TaskEditModal] Submitting form data:', {
      taskId: task.id,
      formData: {
        notificationEnabled: formData.notificationEnabled,
        notificationMinutesBefore: formData.notificationMinutesBefore,
        ...formData
      }
    });

    try {
      const updates: Partial<CareTask> = { ...formData };

      if (updates.frequency !== 'custom') {
        updates.customFrequencyDays = undefined;
        updates.customFrequencyWeekdays = undefined;
      } else if (customFrequencyType === 'interval') {
        updates.customFrequencyDays = Math.max(1, updates.customFrequencyDays || 1);
        updates.customFrequencyWeekdays = undefined;
      } else {
        updates.customFrequencyDays = undefined;
        updates.customFrequencyWeekdays = updates.customFrequencyWeekdays && updates.customFrequencyWeekdays.length > 0
          ? updates.customFrequencyWeekdays
          : [1, 3, 5];
      }

      await careTaskService.updateTask(task.id, updates);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm(`Are you sure you want to delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await careTaskService.deleteTask(task.id);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CareTask>(field: K, value: CareTask[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFrequency = (value: string) => {
    const frequency = value as CareTask['frequency'];

    setFormData(prev => {
      const nextCustomType = frequency === 'custom'
        ? (prev.customFrequencyDays && prev.customFrequencyDays > 0 && (!prev.customFrequencyWeekdays || prev.customFrequencyWeekdays.length === 0)
          ? 'interval'
          : customFrequencyType)
        : customFrequencyType;

      if (frequency === 'custom') {
        setCustomFrequencyType(nextCustomType);
      }

      return {
        ...prev,
        frequency,
        customFrequencyDays: frequency === 'custom'
          ? (nextCustomType === 'interval' ? (prev.customFrequencyDays && prev.customFrequencyDays > 0 ? prev.customFrequencyDays : 3) : undefined)
          : undefined,
        customFrequencyWeekdays: frequency === 'custom'
          ? (nextCustomType === 'weekdays'
            ? (prev.customFrequencyWeekdays && prev.customFrequencyWeekdays.length > 0
              ? prev.customFrequencyWeekdays
              : [1, 3, 5])
            : undefined)
          : undefined,
      };
    });
  };

  const updateCustomFrequencyType = (value: 'weekdays' | 'interval') => {
    setCustomFrequencyType(value);
    setFormData(prev => ({
      ...prev,
      customFrequencyDays: value === 'interval'
        ? (prev.customFrequencyDays && prev.customFrequencyDays > 0 ? prev.customFrequencyDays : 3)
        : undefined,
      customFrequencyWeekdays: value === 'weekdays'
        ? (prev.customFrequencyWeekdays && prev.customFrequencyWeekdays.length > 0 ? prev.customFrequencyWeekdays : [1, 3, 5])
        : undefined,
    }));
  };

  const toggleCustomWeekday = (day: number) => {
    setFormData(prev => {
      const currentDays = prev.customFrequencyWeekdays || [];
      const hasDay = currentDays.includes(day);
      const nextDays = hasDay
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);

      return {
        ...prev,
        customFrequencyWeekdays: nextDays,
      };
    });
  };

  if (!task) return null;
  if (layout === 'modal' && !isOpen) return null;

  const inputClass = 'w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-muted';
  const selectClass = 'w-full bg-card-elevated text-white text-sm focus:outline-none border-0';

  if (layout === 'page') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-between border-b border-divider">
          <h1 className="text-lg font-bold text-white">Edit Task</h1>
          <button onClick={onClose} className="text-sm font-semibold text-accent">Back</button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-28">
          <div className="space-y-3 px-4 py-4">

            {/* Enclosure */}
            {enclosures.length > 0 && (
              <div className="bg-card border border-divider rounded-2xl overflow-hidden">
                <div className="px-4 py-3">
                  <label htmlFor="enclosure" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Enclosure
                  </label>
                  <select
                    id="enclosure"
                    value={formData.enclosureId || ''}
                    onChange={(e) => updateField('enclosureId', e.target.value || '')}
                    className={selectClass}
                  >
                    <option value="">No specific enclosure</option>
                    {enclosures.map(enc => (
                      <option key={enc.id} value={enc.id}>
                        {enc.name} ({enc.animalName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Title + Description */}
            <div className="bg-card border border-divider rounded-2xl overflow-hidden divide-y divide-divider">
              <div className="px-4 py-3">
                <label htmlFor="title" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Task Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Feed dubia roaches"
                  required
                />
              </div>
              <div className="px-4 py-3">
                <label htmlFor="description" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Optional details..."
                />
              </div>
            </div>

            {/* Type + Frequency */}
            <div className="bg-card border border-divider rounded-2xl overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-divider">
                <div className="px-4 py-3">
                  <label htmlFor="type" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type || ''}
                    onChange={(e) => updateField('type', e.target.value as TaskType)}
                    className={selectClass}
                    required
                  >
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
                  <label htmlFor="frequency" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency || ''}
                    onChange={(e) => updateFrequency(e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="every-other-day">Every Other Day</option>
                    <option value="twice-weekly">Twice Weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>
              </div>

              {/* Custom weekday pills */}
              {formData.frequency === 'custom' && (
                <div className="px-4 py-3 border-t border-divider">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Custom Type</label>
                  <select
                    value={customFrequencyType}
                    onChange={(e) => updateCustomFrequencyType(e.target.value as 'weekdays' | 'interval')}
                    className={`${selectClass} mb-2`}
                  >
                    <option value="weekdays">Specific weekdays</option>
                    <option value="interval">Every X days</option>
                  </select>

                  {customFrequencyType === 'interval' ? (
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Days Interval</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.customFrequencyDays ?? 3}
                        onChange={(e) => updateField('customFrequencyDays', Math.max(1, parseInt(e.target.value || '1', 10)))}
                        className="w-full bg-transparent text-white text-sm focus:outline-none"
                      />
                      <p className="text-xs text-muted mt-2">Example: 4 means this task appears every 4 days.</p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Weekdays</label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAY_OPTIONS.map((weekday) => {
                          const isSelected = (formData.customFrequencyWeekdays || []).includes(weekday.value);
                          return (
                            <button
                              key={weekday.value}
                              type="button"
                              onClick={() => toggleCustomWeekday(weekday.value)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-accent border-accent text-on-accent'
                                  : 'bg-card-elevated border-divider text-muted'
                              }`}
                            >
                              {weekday.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                      {(formData.customFrequencyWeekdays || []).length === 0 && (
                        <p className="text-xs text-amber-400 mt-2">Select at least one day.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Time + Start Date */}
              <div className="grid grid-cols-2 divide-x divide-divider border-t border-divider">
                <div className="px-4 py-3">
                  <label htmlFor="scheduledTime" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Time
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime || ''}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="px-4 py-3">
                  <label htmlFor="startDate" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={
                      formData.startDate
                        ? formData.startDate instanceof Date
                          ? formData.startDate.toISOString().split('T')[0]
                          : formData.startDate
                        : ''
                    }
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-xs text-muted mt-1">Schedule a future task</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-divider rounded-2xl overflow-hidden">
              <div className="px-4 py-3">
                <label htmlFor="notes" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Any extra care notes..."
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-divider rounded-2xl overflow-hidden divide-y divide-divider">
              <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
                <span className="text-sm font-semibold text-white">Push notifications</span>
                <input
                  type="checkbox"
                  checked={formData.notificationEnabled || false}
                  onChange={(e) => {
                    console.log('[TaskEditModal] Notification checkbox changed:', {
                      checked: e.target.checked,
                      previousValue: formData.notificationEnabled,
                    });
                    setFormData(prev => ({ ...prev, notificationEnabled: e.target.checked }));
                  }}
                  className="w-5 h-5 accent-accent rounded"
                />
              </label>
              {formData.notificationEnabled && (
                <div className="px-4 py-3">
                  <label htmlFor="notificationMinutes" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Remind me
                  </label>
                  <select
                    id="notificationMinutes"
                    value={formData.notificationMinutesBefore || 15}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificationMinutesBefore: parseInt(e.target.value) }))}
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
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-surface border-t border-divider px-4 py-3 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 text-red-400 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-card border border-divider text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal layout (bottom sheet / centered dialog)
  const modalContent = (
    <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[calc(100vh-5rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
        <h2 className="text-lg font-bold text-white">Edit Task</h2>
        <button onClick={onClose} className="text-muted p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
        {enclosures.length > 0 && (
          <div>
            <label htmlFor="enclosure-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Enclosure</label>
            <select id="enclosure-modal" value={formData.enclosureId || ''} onChange={(e) => updateField('enclosureId', e.target.value || '')}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none">
              <option value="">No specific enclosure</option>
              {enclosures.map(enc => <option key={enc.id} value={enc.id}>{enc.name} ({enc.animalName})</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="title-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Task Title</label>
          <input id="title-modal" type="text" value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)}
            className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none" required />
        </div>
        <div>
          <label htmlFor="description-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Description</label>
          <textarea id="description-modal" value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)}
            rows={2} className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="type-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Type</label>
            <select id="type-modal" value={formData.type || ''} onChange={(e) => updateField('type', e.target.value as TaskType)}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none" required>
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
          <div>
            <label htmlFor="frequency-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Frequency</label>
            <select id="frequency-modal" value={formData.frequency || ''} onChange={(e) => updateFrequency(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none" required>
              <option value="daily">Daily</option>
              <option value="every-other-day">Every Other Day</option>
              <option value="twice-weekly">Twice Weekly</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Days</option>
            </select>
          </div>
        </div>
        {formData.frequency === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Custom Type</label>
            <select
              value={customFrequencyType}
              onChange={(e) => updateCustomFrequencyType(e.target.value as 'weekdays' | 'interval')}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none mb-2"
            >
              <option value="weekdays">Specific weekdays</option>
              <option value="interval">Every X days</option>
            </select>

            {customFrequencyType === 'interval' ? (
              <input
                type="number"
                min={1}
                value={formData.customFrequencyDays ?? 3}
                onChange={(e) => updateField('customFrequencyDays', Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((weekday) => {
                  const isSelected = (formData.customFrequencyWeekdays || []).includes(weekday.value);
                  return (
                    <button key={weekday.value} type="button" onClick={() => toggleCustomWeekday(weekday.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${isSelected ? 'bg-accent border-accent text-on-accent' : 'bg-card-elevated border-divider text-muted'}`}>
                      {weekday.shortLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {customFrequencyType === 'weekdays' && (formData.customFrequencyWeekdays || []).length === 0 && (
              <p className="text-xs text-amber-400 mt-1">Select at least one day.</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="time-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Time</label>
            <input id="time-modal" type="time" value={formData.scheduledTime || ''} onChange={(e) => updateField('scheduledTime', e.target.value)}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label htmlFor="date-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Start Date</label>
            <input id="date-modal" type="date"
              value={formData.startDate ? formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : formData.startDate : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
              className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        <div>
          <label htmlFor="notes-modal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Notes (optional)</label>
          <textarea id="notes-modal" value={formData.notes || ''} onChange={(e) => updateField('notes', e.target.value)}
            rows={2} className="w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none resize-none" />
        </div>
        <div className="bg-card-elevated border border-divider rounded-xl divide-y divide-divider">
          <label className="flex items-center justify-between px-3 py-3 cursor-pointer">
            <span className="text-sm text-white">Push notifications</span>
            <input type="checkbox" checked={formData.notificationEnabled || false}
              onChange={(e) => {
                console.log('[TaskEditModal] Notification checkbox changed:', { checked: e.target.checked, previousValue: formData.notificationEnabled });
                setFormData(prev => ({ ...prev, notificationEnabled: e.target.checked }));
              }}
              className="w-4 h-4 accent-accent rounded" />
          </label>
          {formData.notificationEnabled && (
            <div className="px-3 py-3">
              <select value={formData.notificationMinutesBefore || 15}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationMinutesBefore: parseInt(e.target.value) }))}
                className="w-full bg-transparent text-white text-sm focus:outline-none">
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
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">{error}</div>
        )}
      </form>

      {/* Footer */}
      <div className="border-t border-divider px-4 py-3 bg-surface shrink-0 flex items-center justify-between">
        <button type="button" onClick={handleDelete} disabled={loading}
          className="flex items-center gap-1.5 text-red-400 text-sm font-semibold disabled:opacity-50">
          <Trash2 className="w-4 h-4" />Delete
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 rounded-full bg-card border border-divider text-white text-sm font-semibold disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold disabled:opacity-50">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 pb-16 sm:pb-0">
      {modalContent}
    </div>
  );
}

