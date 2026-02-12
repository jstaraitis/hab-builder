import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { weightTrackingService } from '../../services/weightTrackingService';
import { WEIGHT_CONVERSIONS, WEIGHT_UNIT_INFO, type WeightUnit } from '../../types/weightTracking';
import { formStyles, fieldLayouts } from '../../lib/formStyles';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface WeightLogFormProps {
  animal: EnclosureAnimal;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id: string;
    weightGrams: number;
    measurementDate: Date;
    notes?: string;
  };
}

export function WeightLogForm({ animal, onSuccess, onCancel, initialData }: WeightLogFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [unit, setUnit] = useState<WeightUnit>('g');
  const [weight, setWeight] = useState<string>(
    initialData 
      ? WEIGHT_CONVERSIONS.fromGrams[unit](initialData.weightGrams).toFixed(WEIGHT_UNIT_INFO[unit].decimals)
      : ''
  );
  const [date, setDate] = useState<string>(
    initialData
      ? initialData.measurementDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(
    initialData
      ? initialData.measurementDate.toTimeString().slice(0, 5)
      : new Date().toTimeString().slice(0, 5)
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Please sign in to log weight', 'error');
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      showToast('Please enter a valid weight', 'error');
      return;
    }

    setLoading(true);

    try {
      // Convert weight to grams
      const weightGrams = WEIGHT_CONVERSIONS.toGrams[unit](weightValue);

      // Combine date and time
      const measurementDate = new Date(`${date}T${time}`);

      if (initialData) {
        // Update existing log
        await weightTrackingService.updateWeightLog(initialData.id, {
          weightGrams,
          measurementDate,
          notes: notes.trim() || undefined,
        });
        showToast('Weight log updated successfully', 'success');
      } else {
        // Create new log
        await weightTrackingService.createWeightLog(user.id, {
          enclosureAnimalId: animal.id,
          weightGrams,
          measurementDate,
          notes: notes.trim() || undefined,
        });
        showToast('Weight logged successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving weight log:', error);
      showToast('Failed to save weight log', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update weight display when unit changes
  const handleUnitChange = (newUnit: WeightUnit) => {
    if (weight) {
      const weightValue = parseFloat(weight);
      if (!isNaN(weightValue)) {
        // Convert current weight to grams, then to new unit
        const grams = WEIGHT_CONVERSIONS.toGrams[unit](weightValue);
        const newValue = WEIGHT_CONVERSIONS.fromGrams[newUnit](grams);
        setWeight(newValue.toFixed(WEIGHT_UNIT_INFO[newUnit].decimals));
      }
    }
    setUnit(newUnit);
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      {/* Weight Input */}
      <div>
        <label className={formStyles.label}>
          Weight *
        </label>
        <div className={fieldLayouts.inputWithSelect}>
          <div className={fieldLayouts.inputWithSelectInput}>
            <input
              type="number"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className={formStyles.inputFull}
              required
            />
          </div>
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as WeightUnit)}
            className={fieldLayouts.inputWithSelectSelect}
          >
            {(Object.keys(WEIGHT_UNIT_INFO) as WeightUnit[]).map(u => (
              <option key={u} value={u}>
                {WEIGHT_UNIT_INFO[u].label}
              </option>
            ))}
          </select>
        </div>
        <p className={formStyles.helperText}>
          {WEIGHT_UNIT_INFO[unit].typical}
        </p>
      </div>

      {/* Date and Time Inputs */}
      <div className={fieldLayouts.twoColumnGrid}>
        <div>
          <label className={formStyles.label}>
            Measurement Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={formStyles.selectFull}
            required
          />
        </div>
        <div>
          <label className={formStyles.label}>
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={formStyles.selectFull}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={formStyles.label}>
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any observations (e.g., 'After feeding', 'Looks healthy')"
          rows={2}
          className={formStyles.textarea}
        />
      </div>

      {/* Action Buttons */}
      <div className={formStyles.buttonContainer}>
        <button
          type="submit"
          disabled={loading}
          className={formStyles.buttonPrimary}
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={formStyles.buttonSecondary}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
