import { useEffect, useState } from 'react';
import { Edit2, Trash2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { shedLogService, type ShedLog } from '../../services/shedLogService';
import { useToast } from '../../contexts/ToastContext';
import { ShedLogForm } from './ShedLogForm';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface ShedLogListProps {
  animal: EnclosureAnimal;
  refreshKey?: number;
  onUpdate: () => void;
}

export function ShedLogList({ animal, refreshKey, onUpdate }: ShedLogListProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ShedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<ShedLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [animal.id, refreshKey]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await shedLogService.getRecentSheds(animal.id, 10);
      setLogs(data);
    } catch (error) {
      console.error('Error loading shed logs:', error);
      showToast('Failed to load shed history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shed entry?')) {
      return;
    }

    try {
      await shedLogService.deleteLog(id);
      showToast('Shed entry deleted', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting shed log:', error);
      showToast('Failed to delete shed entry', 'error');
    }
  };

  const handleEditSuccess = () => {
    setEditingLog(null);
    onUpdate();
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'complete':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        );
      case 'incomplete':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Incomplete
          </span>
        );
      case 'stuck-shed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Stuck Shed
          </span>
        );
      case 'assisted':
        return (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            Assisted
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No shed records yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Start tracking your animal's shedding cycles
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
              <ShedLogForm
                animal={animal}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingLog(null)}
                initialData={{
                  id: log.id,
                  shedDate: log.shedDate,
                  quality: log.quality,
                  shedInOnePiece: log.shedInOnePiece,
                  problemAreas: log.problemAreas,
                  humidityPercent: log.humidityPercent,
                  notes: log.notes,
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={log.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700
                     hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(log.shedDate).toLocaleDateString()}
                  </span>
                  {getQualityBadge(log.quality)}
                </div>
                
                {log.shedInOnePiece !== undefined && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Shed in one piece: {log.shedInOnePiece ? 'Yes' : 'No'}
                  </p>
                )}
                
                {log.humidityPercent && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Humidity: {log.humidityPercent}%
                  </p>
                )}
                
                {log.problemAreas && log.problemAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.problemAreas.map(area => (
                      <span
                        key={area}
                        className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                
                {log.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {log.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-1 ml-4">
                <button
                  onClick={() => setEditingLog(log)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
