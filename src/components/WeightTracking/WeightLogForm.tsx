import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { weightTrackingService } from '../../services/weightTrackingService';
import { WEIGHT_CONVERSIONS, WEIGHT_UNIT_INFO, type WeightUnit } from '../../types/weightTracking';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weight *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value as WeightUnit)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {(Object.keys(WEIGHT_UNIT_INFO) as WeightUnit[]).map(u => (
                <option key={u} value={u}>
                  {WEIGHT_UNIT_INFO[u].label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {WEIGHT_UNIT_INFO[unit].typical}
          </p>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Measurement Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base min-h-[44px] sm:min-h-[42px]
                     focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            style={{ colorScheme: 'light' }}
            required
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base min-h-[44px] sm:min-h-[42px]
                     focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            style={{ colorScheme: 'light' }}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any observations (e.g., 'After feeding', 'Looks healthy')"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 
                   text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 
                   dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 
                   rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
