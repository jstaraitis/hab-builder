import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { vetRecordService, type VetRecordInput } from '../../services/vetRecordService';
import { formStyles, fieldLayouts, checkboxStyles } from '../../lib/formStyles';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface VetRecordFormProps {
  animal: EnclosureAnimal;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id: string;
    visitDate: string;
    visitType: string;
    vetName?: string;
    clinicName?: string;
    diagnosis?: string;
    treatment?: string;
    cost?: number;
    followUpNeeded: boolean;
    followUpDate?: string;
    notes?: string;
  };
}

const VISIT_TYPES = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'illness', label: 'Illness' },
  { value: 'injury', label: 'Injury' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

export function VetRecordForm({ animal, onSuccess, onCancel, initialData }: VetRecordFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [visitDate, setVisitDate] = useState(
    initialData?.visitDate || new Date().toISOString().split('T')[0]
  );
  const [visitType, setVisitType] = useState(initialData?.visitType || '');
  const [vetName, setVetName] = useState(initialData?.vetName || '');
  const [clinicName, setClinicName] = useState(initialData?.clinicName || '');
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || '');
  const [treatment, setTreatment] = useState(initialData?.treatment || '');
  const [cost, setCost] = useState(initialData?.cost?.toString() || '');
  const [followUpNeeded, setFollowUpNeeded] = useState(initialData?.followUpNeeded || false);
  const [followUpDate, setFollowUpDate] = useState(initialData?.followUpDate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in to log vet visit', 'error');
      return;
    }

    if (!visitType) {
      showToast('Please select visit type', 'error');
      return;
    }

    setLoading(true);

    try {
      const input: Partial<VetRecordInput> = {
        enclosureAnimalId: animal.id,
        visitDate,
        visitType: visitType as any,
        vetName: vetName.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        treatment: treatment.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        followUpNeeded,
        followUpDate: followUpNeeded && followUpDate ? followUpDate : undefined,
        notes: notes.trim() || undefined,
      };

      if (initialData) {
        await vetRecordService.updateRecord(initialData.id, input);
        showToast('Vet record updated successfully', 'success');
      } else {
        await vetRecordService.createRecord(user.id, input as VetRecordInput);
        showToast('Vet visit logged successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving vet record:', error);
      showToast('Failed to save vet record', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      <div className={fieldLayouts.twoColumnGrid}>
        {/* Visit Date */}
        <div>
          <label className={formStyles.label}>
            Visit Date *
          </label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={formStyles.selectFull}
            required
          />
        </div>

        {/* Visit Type */}
        <div>
          <label className={formStyles.label}>
            Visit Type *
          </label>
          <select
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
            className={formStyles.selectFull}
            required
          >
            <option value="">Select type...</option>
            {VISIT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Vet Name */}
        <div>
          <label className={formStyles.label}>
            Vet Name
          </label>
          <input
            type="text"
            value={vetName}
            onChange={(e) => setVetName(e.target.value)}
            placeholder="Dr. Smith"
            className={formStyles.inputFull}
          />
        </div>

        {/* Clinic Name */}
        <div>
          <label className={formStyles.label}>
            Clinic Name
          </label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Exotic Animal Clinic"
            className={formStyles.inputFull}
          />
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <label className={formStyles.label}>
          Diagnosis
        </label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g., Healthy, Respiratory infection, Metabolic bone disease"
          className={formStyles.inputFull}
        />
      </div>

      {/* Treatment */}
      <div>
        <label className={formStyles.label}>
          Treatment
        </label>
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          rows={2}
          placeholder="Prescribed medications, instructions, etc."
          className={formStyles.textarea}
        />
      </div>

      {/* Cost */}
      <div>
        <label className={formStyles.label}>
          Cost ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0.00"
          className={formStyles.inputFull}
        />
      </div>

      {/* Follow-up Needed */}
      <div>
        <label className={checkboxStyles.label}>
          <input
            type="checkbox"
            checked={followUpNeeded}
            onChange={(e) => setFollowUpNeeded(e.target.checked)}
            className={checkboxStyles.checkbox}
          />
          <span>Follow-up needed</span>
        </label>

        {followUpNeeded && (
          <div className="mt-4">
            <label className={formStyles.label}>
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={formStyles.selectFull}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={formStyles.label}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional observations or instructions..."
          className={formStyles.textarea}
        />
      </div>

      {/* Buttons */}
      <div className={formStyles.buttonContainer}>
        <button
          type="button"
          onClick={onCancel}
          className={formStyles.buttonSecondary}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={formStyles.buttonPrimary}
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
