import { useState, useEffect } from 'react';
import { Moon, Play, Square, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { brumationLogService, type BrumationLog } from '../../services/brumationLogService';
import { formStyles, fieldLayouts } from '../../lib/formStyles';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface BrumationTrackerProps {
  animal: EnclosureAnimal;
  refreshKey?: number;
  onUpdate: () => void;
}

export function BrumationTracker({ animal, refreshKey, onUpdate }: BrumationTrackerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeBrumation, setActiveBrumation] = useState<BrumationLog | null>(null);
  const [history, setHistory] = useState<BrumationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartForm, setShowStartForm] = useState(false);
  const [showEndForm, setShowEndForm] = useState(false);
  
  // Start form fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempLow, setTempLow] = useState('');
  const [tempHigh, setTempHigh] = useState('');
  const [preparationNotes, setPreparationNotes] = useState('');
  
  // End form fields
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightLoss, setWeightLoss] = useState('');
  const [endNotes, setEndNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [animal.id, refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [active, logs] = await Promise.all([
        brumationLogService.getActiveBrumation(animal.id),
        brumationLogService.getLogsForAnimal(animal.id),
      ]);
      setActiveBrumation(active);
      setHistory(logs.filter(l => l.endDate !== null).slice(0, 5));
    } catch (error) {
      console.error('Error loading brumation data:', error);
      showToast('Failed to load brumation data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBrumation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await brumationLogService.createLog(user.id, {
        enclosureAnimalId: animal.id,
        startDate,
        temperatureLow: tempLow ? parseInt(tempLow) : undefined,
        temperatureHigh: tempHigh ? parseInt(tempHigh) : undefined,
        preparationNotes: preparationNotes.trim() || undefined,
        activityLevel: 'inactive',
      });
      
      showToast('Brumation started', 'success');
      setShowStartForm(false);
      setStartDate(new Date().toISOString().split('T')[0]);
      setTempLow('');
      setTempHigh('');
      setPreparationNotes('');
      onUpdate();
    } catch (error) {
      console.error('Error starting brumation:', error);
      showToast('Failed to start brumation', 'error');
    }
  };

  const handleEndBrumation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrumation) return;

    try {
      await brumationLogService.updateLog(activeBrumation.id, {
        endDate,
        weightLossGrams: weightLoss ? parseFloat(weightLoss) : undefined,
        notes: endNotes.trim() || undefined,
      });
      
      showToast('Brumation ended', 'success');
      setShowEndForm(false);
      setEndDate(new Date().toISOString().split('T')[0]);
      setWeightLoss('');
      setEndNotes('');
      onUpdate();
    } catch (error) {
      console.error('Error ending brumation:', error);
      showToast('Failed to end brumation', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brumation record?')) return;

    try {
      await brumationLogService.deleteLog(id);
      showToast('Brumation record deleted', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting brumation log:', error);
      showToast('Failed to delete brumation record', 'error');
    }
  };

  const getDaysInBrumation = (startDate: string, endDate?: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg h-48"></div>;
  }

  return (
    <div className="space-y-4">
      {/* Active Brumation Status */}
      {activeBrumation ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Currently Brumating
              </h3>
            </div>
            <button
              onClick={() => setShowEndForm(!showEndForm)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors
                       flex items-center gap-1 text-sm"
            >
              <Square className="w-4 h-4" />
              End Brumation
            </button>
          </div>
          
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <p>Started: {new Date(activeBrumation.startDate).toLocaleDateString()}</p>
            <p className="font-medium">
              Duration: {getDaysInBrumation(activeBrumation.startDate)} days
            </p>
            {activeBrumation.temperatureLow && activeBrumation.temperatureHigh && (
              <p>Temp Range: {activeBrumation.temperatureLow}°F - {activeBrumation.temperatureHigh}°F</p>
            )}
          </div>

          {showEndForm && (
            <form onSubmit={handleEndBrumation} className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={activeBrumation.startDate}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Weight Loss (grams)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightLoss}
                  onChange={(e) => setWeightLoss(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Notes
                </label>
                <textarea
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  rows={2}
                  placeholder="Any observations..."
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              
              <div className="flex gap-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  End Brumation
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Moon className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 mb-3">Not currently brumating</p>
          <button
            onClick={() => setShowStartForm(!showStartForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700
                     transition-colors flex items-center gap-2 mx-auto"
          >
            <Play className="w-4 h-4" />
            Start Brumation
          </button>
        </div>
      )}

      {/* Start Brumation Form */}
      {showStartForm && !activeBrumation && (
        <form onSubmit={handleStartBrumation} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-5">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Start Brumation Period
          </h4>
          
          <div>
            <label className={formStyles.label}>
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={formStyles.selectFull}
              required
            />
          </div>
          
          <div className={fieldLayouts.twoColumnGrid}>
            <div>
              <label className={formStyles.label}>
                Low Temp (°F)
              </label>
              <input
                type="number"
                value={tempLow}
                onChange={(e) => setTempLow(e.target.value)}
                placeholder="e.g., 50"
                className={formStyles.inputFull}
              />
            </div>
            <div>
              <label className={formStyles.label}>
                High Temp (°F)
              </label>
              <input
                type="number"
                value={tempHigh}
                onChange={(e) => setTempHigh(e.target.value)}
                placeholder="e.g., 55"
                className={formStyles.inputFull}
              />
            </div>
          </div>
          
          <div>
            <label className={formStyles.label}>
              Preparation Notes
            </label>
            <textarea
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              rows={2}
              placeholder="How you prepared for brumation..."
              className={formStyles.textarea}
            />
          </div>
          
          <div className={formStyles.buttonContainer}>
            <button
              type="button"
              onClick={() => setShowStartForm(false)}
              className={formStyles.buttonSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={formStyles.buttonPrimary}
            >
              Start Brumation
            </button>
          </div>
        </form>
      )}

      {/* Brumation History */}
      {history.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Brumation History
          </h4>
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700
                         flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Calendar className="w-4 h-4" />
                    {new Date(log.startDate).toLocaleDateString()} - {log.endDate && new Date(log.endDate).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Duration: {log.durationDays} days
                    {log.weightLossGrams && ` • Weight loss: ${log.weightLossGrams}g`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
