import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { lengthLogService, type LengthLogInput } from '../../services/lengthLogService';
import { formStyles, fieldLayouts } from '../../lib/formStyles';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface LengthLogFormProps {
  animal: EnclosureAnimal;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id: string;
    length: number;
    unit: 'inches' | 'cm' | 'feet' | 'meters';
    date: Date;
    measurementType?: string;
    notes?: string;
  };
}

type LengthUnit = 'inches' | 'cm' | 'feet' | 'meters';

const UNIT_INFO: Record<LengthUnit, { label: string; typical: string; decimals: number }> = {
  'inches': { label: 'Inches', typical: 'Most common for small reptiles', decimals: 2 },
  'cm': { label: 'Centimeters', typical: 'Metric measurement', decimals: 1 },
  'feet': { label: 'Feet', typical: 'For larger animals', decimals: 2 },
  'meters': { label: 'Meters', typical: 'For very large animals', decimals: 2 },
};

const MEASUREMENT_TYPES = [
  { value: 'snout-to-vent', label: 'Snout-to-Vent (SVL)' },
  { value: 'total-length', label: 'Total Length' },
  { value: 'carapace-length', label: 'Carapace Length (Turtles)' },
  { value: 'other', label: 'Other' },
];

export function LengthLogForm({ animal, onSuccess, onCancel, initialData }: LengthLogFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [unit, setUnit] = useState<LengthUnit>(initialData?.unit || 'inches');
  const [length, setLength] = useState<string>(
    initialData ? initialData.length.toFixed(UNIT_INFO[initialData.unit].decimals) : ''
  );
  const [date, setDate] = useState<string>(
    initialData
      ? initialData.date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [measurementType, setMeasurementType] = useState<string>(
    initialData?.measurementType || 'total-length'
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Please sign in to log length', 'error');
      return;
    }

    const lengthValue = parseFloat(length);
    if (isNaN(lengthValue) || lengthValue <= 0) {
      showToast('Please enter a valid length', 'error');
      return;
    }

    setLoading(true);

    try {
      const input: Partial<LengthLogInput> = {
        enclosureAnimalId: animal.id,
        date,
        length: lengthValue,
        unit,
        measurementType: measurementType as any,
        notes: notes.trim() || undefined,
      };

      if (initialData) {
        await lengthLogService.updateLog(initialData.id, input);
        showToast('Length log updated successfully', 'success');
      } else {
        await lengthLogService.createLog(user.id, input as LengthLogInput);
        showToast('Length logged successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving length log:', error);
      showToast('Failed to save length log', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Convert length when unit changes
  const handleUnitChange = (newUnit: LengthUnit) => {
    if (length) {
      const lengthValue = parseFloat(length);
      if (!isNaN(lengthValue)) {
        // Convert to inches first
        let inches: number;
        switch (unit) {
          case 'inches': inches = lengthValue; break;
          case 'cm': inches = lengthValue / 2.54; break;
          case 'feet': inches = lengthValue * 12; break;
          case 'meters': inches = lengthValue * 39.37; break;
          default: inches = lengthValue;
        }

        // Convert from inches to new unit
        let newValue: number;
        switch (newUnit) {
          case 'inches': newValue = inches; break;
          case 'cm': newValue = inches * 2.54; break;
          case 'feet': newValue = inches / 12; break;
          case 'meters': newValue = inches / 39.37; break;
          default: newValue = inches;
        }

        setLength(newValue.toFixed(UNIT_INFO[newUnit].decimals));
      }
    }
    setUnit(newUnit);
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      {/* Length Input */}
      <div>
        <label className={formStyles.label}>
          Length *
        </label>
        <div className={fieldLayouts.inputWithSelect}>
          <div className={fieldLayouts.inputWithSelectInput}>
            <input
              type="number"
              step="any"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="Enter length"
              className={formStyles.inputFull}
              required
            />
          </div>
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as LengthUnit)}
            className={fieldLayouts.inputWithSelectSelect}
          >
            {(Object.keys(UNIT_INFO) as LengthUnit[]).map(u => (
              <option key={u} value={u}>
                {UNIT_INFO[u].label}
              </option>
            ))}
          </select>
        </div>
        <p className={formStyles.helperText}>
          {UNIT_INFO[unit].typical}
        </p>
      </div>

      {/* Date and Measurement Type */}
      <div className={fieldLayouts.twoColumnGrid}>
        <div>
          <label className={formStyles.label}>
            Date *
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
            Measurement Type
          </label>
          <select
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value)}
            className={formStyles.selectFull}
          >
            {MEASUREMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
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
          placeholder="Optional notes about this measurement..."
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
