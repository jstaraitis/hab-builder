/**
 * NutritionInsights
 *
 * The interpretive layer over feeder and supplement records. The surrounding
 * charts answer "what did I feed"; this answers "is that a problem".
 *
 * Rendered in two places with the same component: the care-analytics dashboard
 * across a whole collection, and the vet report for a single animal. The vet
 * report path is the one that can pass UVB state, which is what lets the D3
 * cross-reference fire — so the same records produce a sharper reading there.
 */

import { Pill, AlertTriangle, Info, Utensils } from 'lucide-react';
import type { NutritionAnalysis, NutritionFindingSeverity } from '../../engine/nutritionAnalysis';

const SEVERITY_STYLES: Record<
  NutritionFindingSeverity,
  { chip: string; label: string; border: string }
> = {
  urgent: {
    chip: 'bg-red-500/15 text-red-300 border-red-500/30',
    label: 'Urgent',
    border: 'border-l-red-400',
  },
  watch: {
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    label: 'Watch',
    border: 'border-l-amber-400',
  },
  note: {
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    label: 'Note',
    border: 'border-l-sky-400',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  'staple-insect': 'Staple',
  'occasional-insect': 'Occasional',
  'treat-insect': 'Treat',
  plant: 'Plant',
  vertebrate: 'Whole prey',
  unknown: 'Uncategorised',
};

const CATEGORY_STYLES: Record<string, string> = {
  'staple-insect': 'bg-accent/15 text-accent',
  'occasional-insect': 'bg-sky-500/15 text-sky-300',
  'treat-insect': 'bg-amber-500/15 text-amber-300',
  plant: 'bg-accent/15 text-accent',
  vertebrate: 'bg-accent/15 text-accent',
  unknown: 'bg-card-elevated text-muted',
};

interface NutritionInsightsProps {
  readonly analysis: NutritionAnalysis;
  /** Suppresses the outer card when embedded in a section that supplies one. */
  readonly bare?: boolean;
}

export function NutritionInsights({ analysis, bare = false }: NutritionInsightsProps) {
  const body = (
    <>
      {analysis.insufficientData ? (
        <p className="text-sm text-muted">
          {analysis.totalFeedings === 0
            ? `No feedings logged in the last ${analysis.windowDays} days.`
            : `Only ${analysis.totalFeedings} feedings logged in the last ${analysis.windowDays} days — too few to read a pattern from. Insights appear at six.`}
        </p>
      ) : (
        <>
          {/* Headline rates. Separate numbers because they answer different
              questions: whether anything is dusted at all, and how often D3
              specifically is involved. */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-card-elevated rounded-xl p-3">
              <p className="text-xs text-muted">Feedings dusted</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {analysis.supplementationRatePercent === null
                  ? '—'
                  : `${analysis.supplementationRatePercent}%`}
              </p>
            </div>
            <div className="bg-card-elevated rounded-xl p-3">
              <p className="text-xs text-muted">With D3</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {analysis.d3RatePercent === null ? '—' : `${analysis.d3RatePercent}%`}
              </p>
            </div>
            <div className="bg-card-elevated rounded-xl p-3">
              <p className="text-xs text-muted">Feeder variety</p>
              <p className="text-xl font-bold text-white mt-0.5">{analysis.distinctFeeders}</p>
            </div>
          </div>

          {analysis.findings.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-muted mb-4">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
              <span>
                Nothing stood out across {analysis.totalFeedings} feedings — supplementation and
                feeder variety both look reasonable for this diet.
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 mb-4">
              {analysis.findings.map((finding) => {
                const style = SEVERITY_STYLES[finding.severity];
                return (
                  <div
                    key={finding.id}
                    className={`report-finding border-l-4 ${style.border} bg-card-elevated rounded-r-xl p-3`}
                    data-severity={finding.severity}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{finding.title}</p>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${style.chip}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1.5">{finding.detail}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Per-feeder acceptance. Not available from any care sheet — it is
              specific to this animal's own preferences. */}
          {analysis.feeders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                What it actually eats
              </p>
              <div className="space-y-1.5">
                {analysis.feeders.map((feeder) => (
                  <div key={feeder.name} className="flex items-center gap-3">
                    <span className="text-sm text-white flex-1 truncate">{feeder.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${CATEGORY_STYLES[feeder.category]}`}
                    >
                      {CATEGORY_LABELS[feeder.category]}
                    </span>
                    <span className="text-xs text-muted w-16 text-right shrink-0">
                      {feeder.sharePercent}% of diet
                    </span>
                    <span className="text-xs w-20 text-right shrink-0 text-muted">
                      {feeder.acceptanceRatePercent === null
                        ? 'no outcome'
                        : `${feeder.acceptanceRatePercent}% eaten`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.dietProfile === 'vertebrate' && (
            <p className="text-xs text-muted mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              This animal eats whole prey, so dusting and feeder-variety guidance does not apply — a
              whole rodent is already a complete diet.
            </p>
          )}
        </>
      )}
    </>
  );

  if (bare) return body;

  return (
    <div className="bg-card rounded-xl border border-divider p-4">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-white">Nutrition insights</h3>
      </div>
      {body}
    </div>
  );
}

/** Shown when the analysis could not be run at all. */
export function NutritionInsightsEmpty() {
  return (
    <div className="bg-card rounded-xl border border-divider p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-amber-300" />
        <h3 className="text-lg font-semibold text-white">Nutrition insights</h3>
      </div>
      <p className="text-sm text-muted">
        Log feeder type and supplement on your feeding tasks to see supplementation and diet
        analysis here.
      </p>
    </div>
  );
}
