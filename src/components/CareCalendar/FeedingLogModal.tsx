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

  const inputClass = 'w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/15 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Feeding</h2>
              <p className="text-sm text-muted">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Food Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">What did they eat?</h3>
            
            {/* Feeder Type */}
            <div>
              <label htmlFor="feederType" className="block text-xs font-medium text-muted mb-1">
                Feeder Type
              </label>
              <select
                id="feederType"
                value={feederType}
                onChange={(e) => setFeederType(e.target.value)}
                className={inputClass}
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
                <label htmlFor="customFeeder" className="block text-xs font-medium text-muted mb-1">
                  Specify Feeder Type
                </label>
                <input
                  type="text"
                  id="customFeeder"
                  value={customFeeder}
                  onChange={(e) => setCustomFeeder(e.target.value)}
                  placeholder="e.g., Earthworms, Pinkie Mice"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Quantity Section */}
          <div className="space-y-3 p-3 bg-card-elevated/30 rounded-xl border border-divider">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">How much?</h3>
            
            {/* Quantity Offered */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2">
                Quantity Offered
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustQuantity('offered', -1)}
                  className="p-2 bg-card border border-divider rounded-lg hover:bg-card-elevated transition-colors"
                >
                  <Minus className="w-4 h-4 text-muted" />
                </button>
                <input
                  type="number"
                  value={quantityOffered}
                  onChange={(e) => setQuantityOffered(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-3 py-2 border border-divider rounded-lg bg-card text-white text-center text-sm focus:outline-none focus:border-accent"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => adjustQuantity('offered', 1)}
                  className="p-2 bg-card border border-divider rounded-lg hover:bg-card-elevated transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted" />
                </button>
              </div>
            </div>

            {/* Quantity Eaten */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2">
                Quantity Eaten
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustQuantity('eaten', -1)}
                  className="p-2 bg-card border border-divider rounded-lg hover:bg-card-elevated transition-colors"
                >
                  <Minus className="w-4 h-4 text-muted" />
                </button>
                <input
                  type="number"
                  value={quantityEaten}
                  onChange={(e) => setQuantityEaten(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-3 py-2 border border-divider rounded-lg bg-card text-white text-center text-sm focus:outline-none focus:border-accent"
                  min="0"
                  max={quantityOffered}
                />
                <button
                  type="button"
                  onClick={() => adjustQuantity('eaten', 1)}
                  className="p-2 bg-card border border-divider rounded-lg hover:bg-card-elevated transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted" />
                </button>
              </div>
              {quantityEaten > quantityOffered && quantityOffered > 0 && (
                <p className="text-xs text-amber-400 mt-2">
                  ⚠️ Eaten quantity exceeds offered quantity
                </p>
              )}
            </div>
          </div>

          {/* Supplement Section */}
          <div className="space-y-3 p-3 bg-accent/10 rounded-xl border border-accent/20">
            <h3 className="text-xs font-semibold text-accent uppercase tracking-wide">Supplements</h3>
            <select
              id="supplementUsed"
              value={supplementUsed}
              onChange={(e) => setSupplementUsed(e.target.value)}
              className={inputClass}
            >
              {SUPPLEMENTS.map(supplement => (
                <option key={supplement} value={supplement}>{supplement}</option>
              ))}
            </select>
          </div>

          {/* Feeding Behavior Section */}
          <div className="space-y-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Behavior</h3>
            <label htmlFor="refusalNoted" className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="refusalNoted"
                checked={refusalNoted}
                onChange={(e) => setRefusalNoted(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="text-sm font-medium text-white flex-1">
                Animal refused food or showed reduced appetite
              </span>
            </label>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-xs font-semibold text-muted uppercase tracking-wide">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Behavior during feeding, unusual activity, etc."
              className={`${inputClass} resize-none`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-divider shrink-0 bg-card">
          <button
            type="button"
            onClick={handleQuickComplete}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-muted bg-card-elevated border border-divider rounded-lg hover:bg-card-elevated/80 transition-colors disabled:opacity-50"
          >
            Quick Log
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-card border border-divider text-white text-sm font-semibold hover:bg-card-elevated transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Feeding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

