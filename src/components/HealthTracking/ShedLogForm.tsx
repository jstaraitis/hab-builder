import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { shedLogService, type ShedLogInput } from '../../services/shedLogService';
import { formStyles, fieldLayouts } from '../../lib/formStyles';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface ShedLogFormProps {
  animal: EnclosureAnimal;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id: string;
    shedDate: string;
    quality?: 'complete' | 'incomplete' | 'stuck-shed' | 'assisted';
    shedInOnePiece?: boolean;
    problemAreas?: string[];
    humidityPercent?: number;
    notes?: string;
  };
}

const QUALITY_OPTIONS = [
  { value: 'complete', label: 'Complete Shed', color: 'text-green-600' },
  { value: 'incomplete', label: 'Incomplete', color: 'text-yellow-600' },
  { value: 'stuck-shed', label: 'Stuck Shed', color: 'text-orange-600' },
  { value: 'assisted', label: 'Assisted', color: 'text-blue-600' },
];

const PROBLEM_AREA_OPTIONS = [
  'toes', 'tail-tip', 'eye-caps', 'snout', 'vent', 'body', 'limbs'
];

export function ShedLogForm({ animal, onSuccess, onCancel, initialData }: ShedLogFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [shedDate, setShedDate] = useState(
    initialData?.shedDate || new Date().toISOString().split('T')[0]
  );
  const [quality, setQuality] = useState<string>(initialData?.quality || '');
  const [shedInOnePiece, setShedInOnePiece] = useState<string>(
    initialData?.shedInOnePiece !== undefined 
      ? initialData.shedInOnePiece ? 'yes' : 'no'
      : ''
  );
  const [problemAreas, setProblemAreas] = useState<string[]>(initialData?.problemAreas || []);
  const [humidity, setHumidity] = useState<string>(
    initialData?.humidityPercent?.toString() || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  const toggleProblemArea = (area: string) => {
    setProblemAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in to log shed', 'error');
      return;
    }

    setLoading(true);

    try {
      const input: Partial<ShedLogInput> = {
        enclosureAnimalId: animal.id,
        shedDate,
        quality: quality as any || undefined,
        shedInOnePiece: shedInOnePiece === 'yes' ? true : shedInOnePiece === 'no' ? false : undefined,
        problemAreas: problemAreas.length > 0 ? problemAreas : undefined,
        humidityPercent: humidity ? parseInt(humidity) : undefined,
        notes: notes.trim() || undefined,
      };

      if (initialData) {
        await shedLogService.updateLog(initialData.id, input);
        showToast('Shed log updated successfully', 'success');
      } else {
        await shedLogService.createLog(user.id, input as ShedLogInput);
        showToast('Shed logged successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving shed log:', error);
      showToast('Failed to save shed log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      <div className={fieldLayouts.twoColumnGrid}>
        {/* Shed Date */}
        <div>
          <label className={formStyles.label}>
            Shed Date *
          </label>
          <input
            type="date"
            value={shedDate}
            onChange={(e) => setShedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={formStyles.selectFull}
            required
          />
        </div>

        {/* Quality */}
        <div>
          <label className={formStyles.label}>
            Shed Quality
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className={formStyles.selectFull}
          >
            <option value="">Select quality...</option>
            {QUALITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Shed in One Piece */}
        <div>
          <label className={formStyles.label}>
            Shed in One Piece?
          </label>
          <select
            value={shedInOnePiece}
            onChange={(e) => setShedInOnePiece(e.target.value)}
            className={formStyles.selectFull}
          >
            <option value="">Not specified</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Humidity */}
        <div>
          <label className={formStyles.label}>
            Humidity (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            placeholder="e.g., 70"
            className={formStyles.inputFull}
          />
        </div>
      </div>

      {/* Problem Areas */}
      <div>
        <label className={formStyles.label}>
          Problem Areas (if any)
        </label>
        <div className="flex flex-wrap gap-2">
          {PROBLEM_AREA_OPTIONS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleProblemArea(area)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                problemAreas.includes(area)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {area}
            </button>
          ))}
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
          placeholder="Any observations about the shed..."
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
