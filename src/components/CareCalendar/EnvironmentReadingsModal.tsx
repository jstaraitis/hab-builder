import { useState } from 'react';
import { X, Thermometer, Droplets } from 'lucide-react';
import { saveEnvironmentReadings } from '../../services/environmentReadingsService';
import type { CareTaskWithLogs } from '../../types/careCalendar';

interface EnvironmentReadingsModalProps {
  isOpen: boolean;
  task: CareTaskWithLogs;
  userId: string;
  fallbackEnclosureAnimalId?: string;
  onClose: () => void;
  onSubmit: () => Promise<void>; // called after readings saved — completes the task
}

export function EnvironmentReadingsModal({
  isOpen,
  task,
  userId,
  fallbackEnclosureAnimalId,
  onClose,
  onSubmit,
}: EnvironmentReadingsModalProps) {
  const normalizedType = (task.type || '').toLowerCase().trim();
  const normalizedTitle = (task.title || '').toLowerCase();
  const isTemp =
    normalizedType === 'temperature-check' ||
    normalizedType === 'temperature_check' ||
    normalizedType === 'temperature check' ||
    normalizedTitle.includes('temperature');
  const isHumidity =
    normalizedType === 'humidity-check' ||
    normalizedType === 'humidity_check' ||
    normalizedType === 'humidity check' ||
    normalizedTitle.includes('humidity');

  // Temp fields
  const [baskingTemp, setBaskingTemp] = useState('');
  const [coolTemp, setCoolTemp] = useState('');
  const [ambientTemp, setAmbientTemp] = useState('');
  const [tempUnit, setTempUnit] = useState<'f' | 'c'>('f');

  // Humidity field
  const [humidity, setHumidity] = useState('');

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const enclosureId = task.enclosureId;
      const enclosureAnimalId = task.enclosureAnimalId || fallbackEnclosureAnimalId;

      if (!enclosureId) {
        throw new Error('Missing enclosure link on task.');
      }

      if (isTemp) {
        const basking = parseFloat(baskingTemp);
        const cool = parseFloat(coolTemp);
        const ambient = parseFloat(ambientTemp);

        await saveEnvironmentReadings({
          userId,
          enclosureId,
          enclosureAnimalId,
          requireAnimal: true,
          ambientTemp: isNaN(ambient) ? undefined : ambient,
          ambientTempZone: 'ambient',
          baskingTemp: isNaN(basking) ? undefined : basking,
          coolTemp: isNaN(cool) ? undefined : cool,
          tempUnit,
          notes,
        });
      }

      if (isHumidity) {
        const h = parseInt(humidity, 10);

        await saveEnvironmentReadings({
          userId,
          enclosureId,
          enclosureAnimalId,
          requireAnimal: true,
          humidityPercent: isNaN(h) ? undefined : h,
          humidityZone: 'ambient',
          notes,
        });
      }

      await onSubmit();
      onClose();

      // Reset
      setBaskingTemp('');
      setCoolTemp('');
      setAmbientTemp('');
      setHumidity('');
      setNotes('');
    } catch (err) {
      console.error('Failed to save readings:', err);
      setError('Failed to save readings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReadings = async () => {
    setLoading(true);
    try {
      await onSubmit();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/15 rounded-lg">
              {isTemp
                ? <Thermometer className="w-5 h-5 text-accent" />
                : <Droplets className="w-5 h-5 text-accent" />
              }
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Reading</h2>
              <p className="text-sm text-muted">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted p-1 rounded-lg" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {isTemp && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Temperature Readings</h3>
                <div className="flex rounded-lg overflow-hidden border border-divider text-xs">
                  <button
                    type="button"
                    onClick={() => setTempUnit('f')}
                    className={`px-3 py-1.5 font-semibold transition-colors ${tempUnit === 'f' ? 'bg-accent text-white' : 'text-muted'}`}
                  >°F</button>
                  <button
                    type="button"
                    onClick={() => setTempUnit('c')}
                    className={`px-3 py-1.5 font-semibold transition-colors ${tempUnit === 'c' ? 'bg-accent text-white' : 'text-muted'}`}
                  >°C</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Basking</label>
                  <input
                    type="number"
                    step="0.1"
                    value={baskingTemp}
                    onChange={e => setBaskingTemp(e.target.value)}
                    placeholder="—"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Cool Side</label>
                  <input
                    type="number"
                    step="0.1"
                    value={coolTemp}
                    onChange={e => setCoolTemp(e.target.value)}
                    placeholder="—"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Ambient</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ambientTemp}
                    onChange={e => setAmbientTemp(e.target.value)}
                    placeholder="—"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {isHumidity && (
            <>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Humidity Reading</h3>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Humidity %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={humidity}
                  onChange={e => setHumidity(e.target.value)}
                  placeholder="e.g. 65"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations..."
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save & Complete Task'}
            </button>
            <button
              type="button"
              onClick={handleSkipReadings}
              disabled={loading}
              className="w-full py-2 text-xs text-muted hover:text-white transition-colors"
            >
              Complete without logging
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
