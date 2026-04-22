import { useEffect, useState } from 'react';
import { Edit2, Trash2, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { vetRecordService, type VetRecord } from '../../services/vetRecordService';
import { useToast } from '../../contexts/ToastContext';
import { VetRecordForm } from './VetRecordForm';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface VetRecordListProps {
  animal: EnclosureAnimal;
  refreshKey?: number;
  onUpdate: () => void;
}

export function VetRecordList({ animal, refreshKey, onUpdate }: VetRecordListProps) {
  const { showToast } = useToast();
  const [records, setRecords] = useState<VetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<VetRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [animal.id, refreshKey]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await vetRecordService.getRecordsForAnimal(animal.id);
      setRecords(data);
    } catch (error) {
      console.error('Error loading vet records:', error);
      showToast('Failed to load vet records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vet record?')) {
      return;
    }

    try {
      await vetRecordService.deleteRecord(id);
      showToast('Vet record deleted', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting vet record:', error);
      showToast('Failed to delete vet record', 'error');
    }
  };

  const handleEditSuccess = () => {
    setEditingRecord(null);
    onUpdate();
  };

  const getVisitTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      checkup: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
      illness: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
      injury: 'bg-orange-500/20 text-orange-300 border border-orange-400/30',
      surgery: 'bg-red-500/20 text-red-300 border border-red-400/30',
      emergency: 'bg-red-500/20 text-red-300 border border-red-400/30',
      'follow-up': 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
      other: 'bg-card-elevated text-white border border-divider',
    };

    const labels: Record<string, string> = {
      checkup: 'Checkup',
      illness: 'Illness',
      injury: 'Injury',
      surgery: 'Surgery',
      emergency: 'Emergency',
      'follow-up': 'Follow-up',
      other: 'Other',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[type] || styles.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card-elevated rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-muted">No vet records yet</p>
        <p className="text-sm text-muted mt-1">
          Track your animal's veterinary visits and health records
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        if (editingRecord?.id === record.id) {
          return (
            <div key={record.id} className="bg-surface rounded-lg p-3 border border-divider">
              <VetRecordForm
                animal={animal}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingRecord(null)}
                initialData={{
                  id: record.id,
                  visitDate: record.visitDate,
                  visitType: record.visitType,
                  vetName: record.vetName,
                  clinicName: record.clinicName,
                  diagnosis: record.diagnosis,
                  treatment: record.treatment,
                  cost: record.cost,
                  followUpNeeded: record.followUpNeeded,
                  followUpDate: record.followUpDate,
                  notes: record.notes,
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={record.id}
            className="bg-surface rounded-lg p-3 border border-divider"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted">
                    {new Date(record.visitDate).toLocaleDateString()}
                  </span>
                  {getVisitTypeBadge(record.visitType)}
                  {record.followUpNeeded && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      Follow-up
                    </span>
                  )}
                </div>

                {(record.vetName || record.clinicName) && (
                  <p className="text-xs text-white">
                    {record.vetName}
                    {record.vetName && record.clinicName && ' at '}
                    {record.clinicName}
                  </p>
                )}

                {record.diagnosis && (
                  <p className="text-xs text-muted mt-1">
                    <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                  </p>
                )}

                {record.treatment && (
                  <p className="text-xs text-muted mt-1">
                    <span className="font-medium">Treatment:</span> {record.treatment}
                  </p>
                )}

                {record.cost && (
                  <div className="flex items-center gap-1 text-base text-muted mt-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>${record.cost.toFixed(2)}</span>
                  </div>
                )}

                {record.followUpNeeded && record.followUpDate && (
                  <p className="text-xs text-blue-400 mt-2">
                    Follow-up scheduled: {new Date(record.followUpDate).toLocaleDateString()}
                  </p>
                )}

                {record.notes && (
                  <p className="text-xs text-muted mt-2 pt-2 border-t border-divider">
                    {record.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingRecord(record)}
                  className="px-2 py-1 rounded-md border border-divider bg-card text-white hover:bg-card-elevated"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
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




