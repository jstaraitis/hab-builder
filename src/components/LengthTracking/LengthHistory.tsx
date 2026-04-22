import { useEffect, useState } from 'react';
import { Edit2, Trash2, Calendar } from 'lucide-react';
import { lengthLogService, type LengthLog } from '../../services/lengthLogService';
import { useToast } from '../../contexts/ToastContext';
import { LengthLogForm } from './LengthLogForm';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface LengthHistoryProps {
  enclosureAnimalId: string;
  refreshKey?: number;
  onUpdate: () => void;
}

export function LengthHistory({ enclosureAnimalId, refreshKey, onUpdate }: LengthHistoryProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LengthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<LengthLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [enclosureAnimalId, refreshKey]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await lengthLogService.getLogsForAnimal(enclosureAnimalId);
      setLogs(data);
    } catch (error) {
      console.error('Error loading length logs:', error);
      showToast('Failed to load length history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this length entry?')) {
      return;
    }

    try {
      await lengthLogService.deleteLog(id);
      showToast('Length entry deleted', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting length log:', error);
      showToast('Failed to delete length entry', 'error');
    }
  };

  const handleEditSuccess = () => {
    setEditingLog(null);
    onUpdate();
  };

  const formatLength = (log: LengthLog) => {
    return `${log.length} ${log.unit}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card-elevated rounded-lg h-16"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-muted">No length entries yet</p>
        <p className="text-sm text-muted mt-1">
          Click "Log Length" above to add your first measurement
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        if (editingLog?.id === log.id) {
          return (
            <div key={log.id} className="bg-surface rounded-lg p-4 border border-divider">
              <LengthLogForm
                animal={{ id: enclosureAnimalId } as EnclosureAnimal}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingLog(null)}
                initialData={{
                  id: log.id,
                  length: log.length,
                  unit: log.unit,
                  date: new Date(log.date),
                  measurementType: log.measurementType,
                  notes: log.notes,
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={log.id}
            className="bg-card rounded-lg p-3 border border-divider
                     hover:shadow-sm transition-shadow flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-accent">
                  {formatLength(log)}
                </span>
                <span className="text-sm text-muted">
                  {new Date(log.date).toLocaleDateString()}
                </span>
              </div>
              
              {log.measurementType && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {log.measurementType === 'snout-to-vent' && 'Snout-to-Vent'}
                  {log.measurementType === 'total-length' && 'Total Length'}
                  {log.measurementType === 'carapace-length' && 'Carapace Length'}
                  {log.measurementType === 'other' && 'Other Measurement'}
                </p>
              )}
              
              {log.notes && (
                <p className="text-sm text-muted mt-1">
                  {log.notes}
                </p>
              )}
            </div>

            <div className="flex gap-1 ml-4">
              <button
                onClick={() => setEditingLog(log)}
                className="p-2 text-muted hover:text-accent dark:hover:text-accent
                         hover:bg-card-elevated rounded transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(log.id)}
                className="p-2 text-muted hover:text-red-600 dark:hover:text-red-400
                         hover:bg-card-elevated rounded transition-colors"
                title="Delete"
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



