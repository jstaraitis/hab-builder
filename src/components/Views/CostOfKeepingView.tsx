/**
 * CostOfKeepingView
 *
 * Answers "what does this actually cost me per month", which almost no keeper
 * can say, because the spend arrives in unrelated lumps and the largest part of
 * it — electricity — hides inside a household bill.
 *
 * The screen leads with the recurring monthly figure rather than a grand total,
 * because a number that adds a £300 enclosure to £4 of crickets is not useful
 * for any decision.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Loader2, AlertTriangle, Info, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { costOfKeepingService, type CostBundle } from '../../services/costOfKeepingService';
import type { CostCategory } from '../../engine/costOfKeeping';
import { track } from '../../services/analyticsService';

const CATEGORY_LABEL: Record<CostCategory, string> = {
  acquisition: 'The animals themselves',
  enclosure: 'Enclosures',
  equipment: 'Equipment',
  consumables: 'Consumables',
  feeders: 'Feeders',
  veterinary: 'Veterinary',
  electricity: 'Electricity',
};

export function CostOfKeepingView() {
  const { user } = useAuth();

  const [bundle, setBundle] = useState<CostBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await costOfKeepingService.build(user.id);
      setBundle(result);
      track('feature_opened', {
        feature: 'cost-of-keeping',
        monthly: result.breakdown.monthlyTotal,
      });
    } catch (err) {
      console.error('Failed to build cost breakdown:', err);
      setError('Could not work out your costs.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveRate = async () => {
    if (!user || !rate) return;
    setSavingRate(true);
    try {
      await costOfKeepingService.saveSettings(user.id, { electricityRate: Number(rate) });
      setRate('');
      await load();
    } catch (err) {
      console.error('Failed to save electricity rate:', err);
      setError('Could not save that rate.');
    } finally {
      setSavingRate(false);
    }
  };

  const money = (amount: number) => `${bundle?.breakdown.currency ?? '$'}${amount.toFixed(2)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <header className="bg-card border border-divider rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-white">Cost of keeping</h1>
        </div>
        <p className="text-sm text-muted mt-1">
          What your collection costs to run, built from what you have recorded.
        </p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}

      {bundle && !loading && (
        <>
          {bundle.breakdown.insufficientData ? (
            <div className="bg-card border border-divider rounded-2xl p-5">
              <p className="text-sm text-white font-semibold">Not enough recorded yet.</p>
              <p className="text-sm text-muted mt-1">
                Open an inventory item and fill in its cost, plus a wattage and daily runtime for
                anything that draws power. Acquisition prices and vet costs are picked up
                automatically from what you have already logged.
              </p>
              <Link
                to="/inventory"
                className="inline-block mt-3 text-sm font-semibold text-accent hover:underline"
              >
                Go to inventory
              </Link>
            </div>
          ) : (
            <>
              {/* Recurring leads. A grand total mixing one-off and ongoing spend
                  is not a number anyone can act on. */}
              <div className="bg-card border border-divider rounded-2xl p-5">
                <p className="text-xs text-muted uppercase tracking-wide">Ongoing</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {money(bundle.breakdown.monthlyTotal)}
                  <span className="text-base text-muted font-normal"> / month</span>
                </p>
                <p className="text-sm text-muted mt-1">
                  About {money(bundle.breakdown.annualProjection)} a year at this rate
                  {bundle.breakdown.perAnimalMonthly !== null && (
                    <> · {money(bundle.breakdown.perAnimalMonthly)} per animal per month</>
                  )}
                  .
                </p>
              </div>

              {bundle.breakdown.largestCategory && (
                <div className="bg-card-elevated border border-divider rounded-2xl p-4">
                  <p className="text-sm text-white">
                    <span className="font-semibold">
                      {CATEGORY_LABEL[bundle.breakdown.largestCategory.category]}
                    </span>{' '}
                    is your largest ongoing cost at {bundle.breakdown.largestCategory.sharePercent}%
                    of the monthly total.
                  </p>
                </div>
              )}

              <div className="bg-card border border-divider rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                  Where it goes
                </h2>
                <div className="space-y-2.5">
                  {bundle.breakdown.categories.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm text-white">
                          {CATEGORY_LABEL[category.category]}
                        </span>
                        <span className="text-sm text-muted">
                          {money(category.monthly)}/mo · {category.sharePercent}%
                        </span>
                      </div>
                      <div className="h-2 bg-card-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${category.sharePercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {bundle.breakdown.oneOffTotal > 0 && (
                <div className="bg-card border border-divider rounded-2xl p-5">
                  <p className="text-xs text-muted uppercase tracking-wide">Already spent, once</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {money(bundle.breakdown.oneOffTotal)}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Animals, enclosures and past vet bills. Kept separate from the monthly figure
                    because they are not going to happen again every month.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Electricity is usually the largest ongoing cost and the one nobody
              attributes to the animal, so its absence is called out. */}
          {bundle.missingElectricityRate && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-sm text-amber-200 font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Electricity is not being counted
              </p>
              <p className="text-xs text-amber-200/90 mt-1">
                Heat lamps run for hours every day, and for most keepers this is the single largest
                ongoing cost. Add your rate per kWh — it is on your energy bill.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 0.28"
                  className="flex-1 px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
                />
                <button
                  type="button"
                  disabled={savingRate || !rate}
                  onClick={() => void handleSaveRate()}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent text-sm font-semibold disabled:opacity-50"
                >
                  {savingRate ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {!bundle.missingElectricityRate && bundle.devices.length === 0 && (
            <div className="bg-card border border-divider rounded-2xl p-4">
              <p className="text-xs text-muted">
                No equipment has a wattage recorded, so electricity is not in the figures above.{' '}
                <Link to="/inventory" className="text-accent hover:underline">
                  Add watts and daily hours
                </Link>{' '}
                to your inventory items to include it.
              </p>
            </div>
          )}

          {/* Missing categories are named so a gap never reads as zero spend. */}
          {bundle.breakdown.missingCategories.length > 0 && (
            <div className="bg-card border border-divider rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Not recorded
              </p>
              <ul className="space-y-1">
                {bundle.breakdown.missingCategories.map((category) => (
                  <li key={category} className="text-xs text-muted flex gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{CATEGORY_LABEL[category]} — nothing recorded, so counted as nothing.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bundle.failedStreams.length > 0 && (
            <p className="text-xs text-amber-200">
              Some data could not be loaded and is missing from these figures:{' '}
              {bundle.failedStreams.join(', ')}.
            </p>
          )}

          <p className="text-xs text-muted px-1 pb-8">
            These figures reflect what you have entered, not everything you have spent. Electricity
            is an estimate from wattage and runtime, not a meter reading.
          </p>
        </>
      )}
    </div>
  );
}
