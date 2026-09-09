import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Lock, ChevronDown, HelpCircle } from 'lucide-react';
import type {
  HabitatDimensionId,
  HabitatScoreResult,
  HabitatGrade,
  FindingSeverity,
  HabitatFinding,
} from '../../engine/habitatScore';

const GRADE_STYLES: Record<HabitatGrade, { text: string; ring: string; bg: string }> = {
  A: { text: 'text-accent', ring: 'border-accent/40', bg: 'bg-accent/10' },
  B: { text: 'text-accent', ring: 'border-accent/30', bg: 'bg-accent/[0.07]' },
  C: { text: 'text-amber-300', ring: 'border-amber-400/30', bg: 'bg-amber-500/[0.07]' },
  D: { text: 'text-orange-300', ring: 'border-orange-500/30', bg: 'bg-orange-500/[0.07]' },
  F: { text: 'text-red-300', ring: 'border-red-500/35', bg: 'bg-red-500/[0.07]' },
};

const SEVERITY_STYLES: Record<FindingSeverity, { chip: string; label: string }> = {
  critical: { chip: 'text-red-300 bg-red-500/10', label: 'Critical' },
  important: { chip: 'text-amber-300 bg-amber-500/10', label: 'Important' },
  minor: { chip: 'text-sky-300 bg-sky-500/10', label: 'Minor' },
};

function FindingBlock({ finding }: { readonly finding: HabitatFinding }) {
  const styles = SEVERITY_STYLES[finding.severity];
  return (
    <div className="bg-card-elevated border border-divider rounded-xl p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${styles.chip}`}>
          {styles.label}
        </span>
        <span className="text-[13px] font-semibold text-white">{finding.title}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed mt-1.5">{finding.detail}</p>
      <p className="text-xs text-white/90 leading-relaxed mt-2">
        <span className="font-semibold text-accent">Fix: </span>
        {finding.fix}
      </p>
    </div>
  );
}

interface HabitatScoreCardProps {
  readonly result: HabitatScoreResult;
  readonly enclosureName: string;
  readonly isPremium: boolean;
  /**
   * Dimensions already shown elsewhere on screen — the attention list at the
   * top, or the dedicated UVB card. Their findings are hidden here so one
   * problem isn't reported three times, but they still count toward the score:
   * suppressing the display must never quietly improve the grade.
   */
  readonly suppressDimensions?: ReadonlySet<HabitatDimensionId>;
}

export function HabitatScoreCard({
  result,
  enclosureName,
  isPremium,
  suppressDimensions,
}: HabitatScoreCardProps) {
  const [showAll, setShowAll] = useState(false);

  // A grade built on almost no evidence would be worse than no grade — say
  // what's missing instead of inventing confidence.
  if (result.insufficientData) {
    return (
      <div className="mx-4 bg-card border border-divider rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-muted" />
          <h3 className="text-med font-bold text-white">Habitat Score</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed mt-2">
          Not enough recorded yet to score {enclosureName}. Log a temperature reading, or add
          the enclosure&apos;s dimensions and UVB bulb, and a grade will appear here.
        </p>
      </div>
    );
  }

  const grade = GRADE_STYLES[result.grade];
  const visibleFindings = suppressDimensions
    ? result.findings.filter((f) => !suppressDimensions.has(f.dimension))
    : result.findings;
  const issues = visibleFindings.length;
  const hidden = Math.max(0, issues - 1);
  // Counted from the full set, so the grade and the "issues found" line never
  // disagree with each other.
  const suppressed = result.findings.length - issues;

  return (
    <div className={`mx-4 bg-card border rounded-2xl overflow-hidden ${grade.ring}`}>
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3">
        <ClipboardCheck className="w-4 h-4 text-accent" />
        <h3 className="text-med font-bold text-white">Habitat Score</h3>
        <span className="ml-auto text-xs text-muted">{enclosureName}</span>
      </div>

      {/* Grade */}
      <div className="px-4 pb-3 flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0 ${grade.ring} ${grade.bg}`}>
          <span className={`text-3xl font-extrabold ${grade.text}`}>{result.grade}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {issues === 0
              ? 'No problems found'
              : `${issues} ${issues === 1 ? 'issue' : 'issues'} found`}
          </p>
          <p className="text-xs text-muted leading-relaxed mt-0.5">
            {issues === 0
              ? 'Conditions match what this species needs.'
              : 'Ranked by how much they affect the animal.'}
          </p>
          <p className="text-[11px] text-muted mt-1">
            Scored on {result.assessedCount} of {result.totalCount} checks
            {suppressed > 0 && ` · ${suppressed} shown above`}
          </p>
        </div>
      </div>

      {/* The per-check breakdown is a report, not a daily glance — it lives
          behind the expand so the dashboard stays scannable. */}
      {isPremium && showAll && (
        <div className="px-4 pb-3 space-y-1.5">
          {result.dimensions.map((dim) => (
            <div key={dim.id} className="flex items-center gap-2.5">
              <span className="text-[11px] text-muted w-28 flex-shrink-0">{dim.label}</span>
              <div className="flex-1 h-1.5 bg-card-elevated rounded-full overflow-hidden">
                {dim.score !== null && (
                  <div
                    className={`h-full ${dim.score >= 80 ? 'bg-accent' : dim.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${dim.score}%` }}
                  />
                )}
              </div>
              <span className="text-[11px] text-muted w-12 text-right flex-shrink-0">
                {dim.score === null ? 'n/a' : `${dim.score}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Findings */}
      {issues > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {(isPremium && showAll ? visibleFindings : visibleFindings.slice(0, 1)).map((finding) => (
            <FindingBlock key={finding.id} finding={finding} />
          ))}

          {/* Premium users expand; free users see the paywall in its place.
              The first fix is given away in full — a locked list with nothing
              readable reads as extraction rather than help. */}
          {(hidden > 0 || isPremium) && (
            isPremium ? (
              !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full min-h-[44px] rounded-xl bg-card-elevated border border-divider text-sm font-semibold text-muted active:opacity-70 transition-opacity flex items-center justify-center gap-1.5"
                >
                  View full report                  <ChevronDown className="w-4 h-4" />
                </button>
              )
            ) : (
              <Link
                to="/upgrade"
                className="block bg-card-elevated border border-divider rounded-xl p-3 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">
                      {hidden} more {hidden === 1 ? 'issue' : 'issues'} found
                    </p>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Premium shows every issue with a fix, plus a per-check breakdown so you can
                      see what&apos;s pulling the grade down.
                    </p>
                    <p className="text-xs font-semibold text-accent mt-1.5">See what&apos;s included →</p>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      )}

      <div className="px-4 pb-4">
        <p className="text-[10px] text-muted leading-relaxed">
          Husbandry guidance based on your species targets and logged readings — not veterinary
          advice.
        </p>
      </div>
    </div>
  );
}
