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
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        );
      case 'incomplete':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Incomplete
          </span>
        );
      case 'stuck-shed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 border border-orange-400/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Stuck Shed
          </span>
        );
      case 'assisted':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
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
          <div key={i} className="animate-pulse bg-card-elevated rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-muted">No shed records yet</p>
        <p className="text-sm text-muted mt-1">
          Start tracking your animal's shedding cycles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        if (editingLog?.id === log.id) {
          return (
            <div key={log.id} className="bg-surface rounded-lg p-3 border border-divider">
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
            className="bg-surface rounded-lg p-3 border border-divider"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted">
                    {new Date(log.shedDate).toLocaleDateString()}
                  </span>
                  {getQualityBadge(log.quality)}
                </div>
                
                {log.shedInOnePiece !== undefined && (
                  <p className="text-xs text-muted">
                    Shed in one piece: {log.shedInOnePiece ? 'Yes' : 'No'}
                  </p>
                )}
                
                {log.humidityPercent && (
                  <p className="text-xs text-muted">
                    Humidity: {log.humidityPercent}%
                  </p>
                )}
                
                {log.problemAreas && log.problemAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {log.problemAreas.map(area => (
                      <span
                        key={area}
                        className="px-2 py-0.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 rounded text-xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                
                {log.notes && (
                  <p className="text-xs text-muted mt-2 pt-2 border-t border-divider">
                    {log.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingLog(log)}
                  className="px-2 py-1 rounded-md border border-divider bg-card text-white hover:bg-card-elevated"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="px-2 py-1 rounded-md border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}




