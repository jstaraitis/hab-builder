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
      checkup: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      illness: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      injury: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      surgery: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      emergency: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      'follow-up': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || styles.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No vet records yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Track your animal's veterinary visits and health records
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        if (editingRecord?.id === record.id) {
          return (
            <div key={record.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700
                     hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(record.visitDate).toLocaleDateString()}
                  </span>
                  {getVisitTypeBadge(record.visitType)}
                  {record.followUpNeeded && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Follow-up
                    </span>
                  )}
                </div>

                {(record.vetName || record.clinicName) && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {record.vetName}
                    {record.vetName && record.clinicName && ' at '}
                    {record.clinicName}
                  </p>
                )}

                {record.diagnosis && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                  </p>
                )}

                {record.treatment && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Treatment:</span> {record.treatment}
                  </p>
                )}

                {record.cost && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <DollarSign className="w-4 h-4" />
                    <span>${record.cost.toFixed(2)}</span>
                  </div>
                )}

                {record.followUpNeeded && record.followUpDate && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Follow-up scheduled: {new Date(record.followUpDate).toLocaleDateString()}
                  </p>
                )}

                {record.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {record.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-1 ml-4">
                <button
                  onClick={() => setEditingRecord(record)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
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
