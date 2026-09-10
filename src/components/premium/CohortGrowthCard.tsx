/**
 * CohortGrowthCard
 *
 * Places one animal against the growth curve of every other animal of its
 * species in the app — the reptile equivalent of a paediatric percentile chart,
 * which does not otherwise exist for most of these species.
 *
 * For a long time this card will show the empty state, because percentiles need
 * a population and the population is still being collected. That state is
 * written to be worth reading anyway: it says how many animals are contributing
 * and how many are needed, so the keeper understands they are early rather than
 * looking at something broken.
 */

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Info, Loader2 } from 'lucide-react';
import { cohortService } from '../../services/cohortService';
import { compareToCohort, type CohortCurve, type CohortComparison } from '../../engine/cohortStats';

interface CohortGrowthCardProps {
  readonly speciesId: string | undefined;
  readonly speciesName?: string;
  /** Age at the most recent weigh-in. Null when the hatch date is unknown. */
  readonly ageDays: number | null;
  readonly currentWeightGrams: number | null;
}

function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;
}

export function CohortGrowthCard({
  speciesId,
  speciesName,
  ageDays,
  currentWeightGrams,
}: CohortGrowthCardProps) {
  const [curve, setCurve] = useState<CohortCurve | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!speciesId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    setLoading(true);
    setFailed(false);

    cohortService
      .getCurve(speciesId)
      .then((result) => {
        if (!cancelled) setCurve(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Failed to load cohort curve:', error);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  // Nothing to compare against, and no useful empty state either.
  if (!speciesId) return null;

  const comparison: CohortComparison | null =
    curve && ageDays !== null && currentWeightGrams !== null
      ? compareToCohort(curve, ageDays, currentWeightGrams)
      : null;

  return (
    <div className="bg-card border border-divider rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">Growth vs other keepers</h3>
      </div>
      <p className="text-xs text-muted mb-3">
        {speciesName ? `${speciesName} in Habitat Builder` : 'Across this species'}
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading benchmark…
        </div>
      )}

      {failed && !loading && (
        <p className="text-sm text-muted">
          Could not load the benchmark right now. Your own records are unaffected.
        </p>
      )}

      {curve && !loading && !failed && (
        <>
          {curve.insufficientData ? (
            <div className="space-y-2">
              <p className="text-sm text-white">Not enough animals yet to build a curve.</p>
              <p className="text-xs text-muted">
                {curve.totalAnimals === 0
                  ? 'No keepers are contributing weights for this species yet.'
                  : `${curve.totalAnimals} animal${curve.totalAnimals === 1 ? '' : 's'} contributing so far.`}
                {curve.animalsNeeded > 0 && (
                  <> At least {curve.animalsNeeded} more needed before percentiles mean anything.</>
                )}
              </p>
              <p className="text-xs text-muted">
                Every weight you log adds to this. It is anonymous — species, age and weight only.
              </p>
            </div>
          ) : ageDays === null ? (
            <p className="text-sm text-muted">
              Add a hatch or acquisition date for this animal to compare it against the{' '}
              {curve.totalAnimals} animals contributing. Without an age there is no cohort to place
              it in.
            </p>
          ) : currentWeightGrams === null ? (
            <p className="text-sm text-muted">
              Log a weight to compare against {curve.totalAnimals} other animals of this species.
            </p>
          ) : comparison?.percentile === null ? (
            <p className="text-sm text-muted">
              No other animals of this species have been weighed at a similar age yet, so there is
              nothing meaningful to compare against.
            </p>
          ) : comparison ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{comparison.percentile}</span>
                <span className="text-sm text-muted">th percentile</span>
              </div>

              <p className="text-sm text-secondary">
                At {formatGrams(currentWeightGrams)}, {comparison.description}.
              </p>

              {comparison.bucket && (
                <div>
                  {/* A simple range bar: p10 to p90, with the animal marked. */}
                  <div className="relative h-2 bg-card-elevated rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 bg-accent/25"
                      style={{ left: '10%', right: '10%' }}
                    />
                    <div
                      className="absolute inset-y-0 w-1 bg-white rounded-full"
                      style={{
                        left: `${Math.min(98, Math.max(0, comparison.percentile ?? 50))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>{formatGrams(comparison.bucket.p10)}</span>
                    <span>median {formatGrams(comparison.bucket.p50)}</span>
                    <span>{formatGrams(comparison.bucket.p90)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-1.5 pt-2 border-t border-divider">
                <Users className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted" />
                <p className="text-xs text-muted">
                  Based on {comparison.sampleSize} animals of a similar age.
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted" />
                <p className="text-xs text-muted">
                  A percentile is a comparison, not a diagnosis. Sex, morph, genetics and a late
                  start all move this number without anything being wrong.
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
