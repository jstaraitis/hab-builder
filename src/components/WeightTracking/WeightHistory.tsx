import { useEffect, useState } from 'react';
import { Edit2, Trash2, Calendar } from 'lucide-react';
import { weightTrackingService } from '../../services/weightTrackingService';
import { useToast } from '../../contexts/ToastContext';
import { WeightLogForm } from './WeightLogForm';
import type { WeightLog } from '../../types/weightTracking';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface WeightHistoryProps {
  enclosureAnimalId: string;
  refreshKey?: number;
  onUpdate: () => void;
}

export function WeightHistory({ enclosureAnimalId, refreshKey, onUpdate }: WeightHistoryProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [enclosureAnimalId, refreshKey]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await weightTrackingService.getWeightLogs(enclosureAnimalId);
      setLogs(data);
    } catch (error) {
      console.error('Error loading weight logs:', error);
      showToast('Failed to load weight history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return;
    }

    try {
      await weightTrackingService.deleteWeightLog(id);
      showToast('Weight entry deleted', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting weight log:', error);
      showToast('Failed to delete weight entry', 'error');
    }
  };

  const handleEditSuccess = () => {
    setEditingLog(null);
    onUpdate();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-16"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No weight entries yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Click "Log Weight" above to add your first entry
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        if (editingLog?.id === log.id) {
          return (
            <div key={log.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <WeightLogForm
                animal={{ id: enclosureAnimalId } as EnclosureAnimal}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingLog(null)}
                initialData={{
                  id: log.id,
                  weightGrams: log.weightGrams,
                  measurementDate: log.measurementDate,
                  notes: log.notes,
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={log.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 
                     rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 
                     dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {log.weightGrams.toFixed(0)}g
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {log.measurementDate.toLocaleDateString()} at {log.measurementDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {log.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {log.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setEditingLog(log)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 
                         dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 
                         rounded-lg transition-colors"
                title="Edit entry"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(log.id)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 
                         dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 
                         rounded-lg transition-colors"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
