import { useState } from 'react';
import { X, UtensilsCrossed, Plus, Minus } from 'lucide-react';
import type { CareLog } from '../../types/careCalendar';

interface FeedingLogModalProps {
  isOpen: boolean;
  taskTitle: string;
  onClose: () => void;
  onSubmit: (logData: Partial<CareLog>) => Promise<void>;
}

const COMMON_FEEDERS = [
  'Crickets',
  'Dubia Roaches',
  'Black Soldier Fly Larvae',
  'Hornworms',
  'Mealworms',
  'Superworms',
  'Waxworms',
  'Silkworms',
  'Fruit Mix',
  'Vegetable Mix',
  'Frozen/Thawed Mouse',
  'Other',
];

const SUPPLEMENTS = [
  'None',
  'Calcium (no D3)',
  'Calcium + D3',
  'Multivitamin',
  'Calcium + Multivitamin',
];

export function FeedingLogModal({ isOpen, taskTitle, onClose, onSubmit }: FeedingLogModalProps) {
  const [feederType, setFeederType] = useState('');
  const [customFeeder, setCustomFeeder] = useState('');
  const [quantityOffered, setQuantityOffered] = useState<number>(0);
  const [quantityEaten, setQuantityEaten] = useState<number>(0);
  const [refusalNoted, setRefusalNoted] = useState(false);
  const [supplementUsed, setSupplementUsed] = useState('None');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalFeederType = feederType === 'Other' ? customFeeder : feederType;
      
      await onSubmit({
        notes,
        feederType: finalFeederType || undefined,
        quantityOffered: quantityOffered > 0 ? quantityOffered : undefined,
        quantityEaten: quantityEaten > 0 ? quantityEaten : undefined,
        refusalNoted: refusalNoted || undefined,
        supplementUsed: supplementUsed !== 'None' ? supplementUsed : undefined,
      });

      // Reset form
      setFeederType('');
      setCustomFeeder('');
      setQuantityOffered(0);
      setQuantityEaten(0);
      setRefusalNoted(false);
      setSupplementUsed('None');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to log feeding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickComplete = async () => {
    setLoading(true);
    try {
      await onSubmit({ notes: 'Quick log - no details' });
      onClose();
    } catch (err) {
      console.error('Failed to log feeding:', err);
    } finally {
      setLoading(false);
    }
  };

  const adjustQuantity = (
    type: 'offered' | 'eaten',
    delta: number
  ) => {
    if (type === 'offered') {
      setQuantityOffered(prev => Math.max(0, prev + delta));
    } else {
      setQuantityEaten(prev => Math.max(0, prev + delta));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 pb-16 sm:pb-0">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-5rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Log Feeding
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Feeder Type */}
          <div>
            <label htmlFor="feederType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feeder Type
            </label>
            <select
              id="feederType"
              value={feederType}
              onChange={(e) => setFeederType(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            >
              <option value="">Select feeder type (optional)</option>
              {COMMON_FEEDERS.map(feeder => (
                <option key={feeder} value={feeder}>{feeder}</option>
              ))}
            </select>
          </div>

          {/* Custom Feeder Type */}
          {feederType === 'Other' && (
            <div>
              <label htmlFor="customFeeder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specify Feeder Type
              </label>
              <input
                type="text"
                id="customFeeder"
                value={customFeeder}
                onChange={(e) => setCustomFeeder(e.target.value)}
                placeholder="e.g., Earthworms, Pinkie Mice"
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              />
            </div>
          )}

          {/* Quantity Offered */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity Offered
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQuantity('offered', -1)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <input
                type="number"
                value={quantityOffered}
                onChange={(e) => setQuantityOffered(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-base"
                min="0"
              />
              <button
                type="button"
                onClick={() => adjustQuantity('offered', 1)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Quantity Eaten */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity Eaten
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQuantity('eaten', -1)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <input
                type="number"
                value={quantityEaten}
                onChange={(e) => setQuantityEaten(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-base"
                min="0"
                max={quantityOffered}
              />
              <button
                type="button"
                onClick={() => adjustQuantity('eaten', 1)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {quantityEaten > quantityOffered && quantityOffered > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Eaten quantity exceeds offered quantity
              </p>
            )}
          </div>

          {/* Refusal Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <input
              type="checkbox"
              id="refusalNoted"
              checked={refusalNoted}
              onChange={(e) => setRefusalNoted(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="refusalNoted" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
              Animal refused food or showed reduced appetite
            </label>
          </div>

          {/* Supplement Used */}
          <div>
            <label htmlFor="supplementUsed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supplement/Dusting Used
            </label>
            <select
              id="supplementUsed"
              value={supplementUsed}
              onChange={(e) => setSupplementUsed(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            >
              {SUPPLEMENTS.map(supplement => (
                <option key={supplement} value={supplement}>{supplement}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Behavior during feeding, unusual activity, etc."
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            type="button"
            onClick={handleQuickComplete}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Quick Log (No Details)
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Logging...' : 'Log Feeding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
