import { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { careTaskService } from '../../services/careTaskService';
import { enclosureService } from '../../services/enclosureService';
import type { CareTask, Enclosure } from '../../types/careCalendar';

interface TaskEditModalProps {
  task: CareTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TaskEditModal({ task, isOpen, onClose, onTaskUpdated }: TaskEditModalProps) {
  const [formData, setFormData] = useState<Partial<CareTask>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        frequency: task.frequency,
        scheduledTime: task.scheduledTime,
        notes: task.notes,
        enclosureId: task.enclosureId,
        notificationEnabled: task.notificationEnabled,
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

    setLoading(true);
    setError(null);

    try {
      await careTaskService.updateTask(task.id, formData);
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

  const updateField = (field: keyof CareTask, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 pb-16 sm:pb-0">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-5rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Edit Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Enclosure Selection (Optional) */}
          {enclosures.length > 0 && (
            <div>
              <label htmlFor="enclosure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enclosure
              </label>
              <select
                id="enclosure"
                value={formData.enclosureId || ''}
                onChange={(e) => updateField('enclosureId', e.target.value || '')}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              >
                <option value="">No specific enclosure</option>
                {enclosures.map(enc => (
                  <option key={enc.id} value={enc.id}>
                    {enc.name} ({enc.animalName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            />
          </div>

          {/* Type, Frequency, Time */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                id="type"
                value={formData.type || ''}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                required
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
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                id="frequency"
                value={formData.frequency || ''}
                onChange={(e) => updateField('frequency', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                required
              >
                <option value="daily">Daily</option>
                <option value="every-other-day">Every Other Day</option>
                <option value="twice-weekly">Twice Weekly</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime || ''}
                onChange={(e) => updateField('scheduledTime', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            />
          </div>

          {/* Notification Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notification Settings</h3>
            
            <div className="space-y-3">
              {/* Enable Notifications Toggle */}
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={formData.notificationEnabled || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, notificationEnabled: e.target.checked }))}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Send push notification reminders
                </span>
              </label>

              {/* Minutes Before Dropdown */}
              {formData.notificationEnabled && (
                <div>
                  <label htmlFor="notificationMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remind me
                  </label>
                  <select
                    id="notificationMinutes"
                    value={formData.notificationMinutesBefore || 15}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificationMinutesBefore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
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

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 shrink-0 relative z-10">
          {/* Mobile layout: Save on top, Cancel/Delete on bottom */}
          <div className="sm:hidden space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              aria-label="Save changes"
              className="w-full px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm text-base flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                aria-label="Delete task"
                className="flex-1 px-4 py-3 text-red-600 hover:text-white dark:text-red-400 bg-red-50 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 font-semibold text-base border-2 border-red-200 dark:border-red-800 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Cancel"
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 font-semibold text-base flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Desktop layout: Delete on left, actions on right */}
          <div className="hidden sm:flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              aria-label="Delete task"
              className="p-2.5 text-red-600 hover:text-white dark:text-red-400 bg-red-50 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Cancel"
                className="p-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                aria-label="Save changes"
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
