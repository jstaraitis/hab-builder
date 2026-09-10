/**
 * HealthReportView
 *
 * A printable clinical summary for one animal, built for the fifteen minutes a
 * keeper gets with an exotics vet.
 *
 * Two audiences, one document. On screen it belongs to the app's dark theme;
 * on paper it has to be a clean black-on-white clinical document, because that
 * is what gets handed across a consulting table. The `@media print` block at
 * the bottom of this file is not decoration — it is the deliverable.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import { healthReportService, type HealthReportBundle } from '../../services/healthReportService';
import type { ConcernSeverity, HealthReport } from '../../engine/healthReport';
import { track } from '../../services/analyticsService';
import { reportToPlainText } from '../../utils/healthReportText';
import { NutritionInsights } from '../CareAnalytics/NutritionInsights';
import { PRINT_STYLES } from './printStyles';
import {
  shareDocument,
  shareOutcomeMessage,
  shareActionLabel,
  canPrint,
} from '../../utils/shareDocument';
import { CohortGrowthCard } from '../premium/CohortGrowthCard';

const SEVERITY_STYLES: Record<ConcernSeverity, { chip: string; label: string; border: string }> = {
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

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${Math.round(grams)} g`;
}

function formatTemp(value: number | undefined): string {
  return value === undefined ? '—' : `${Math.round(value)}°F`;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
}

/** A labelled row in the husbandry block. Renders an em dash rather than hiding. */
function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="report-field">
      <dt className="text-xs text-muted uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-white mt-0.5">{value}</dd>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="report-section bg-card border border-divider rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="text-xs text-muted mt-0.5 mb-3">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

export function HealthReportView() {
  const { animalId } = useParams<{ animalId: string }>();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState<HealthReportBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!animalId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    healthReportService
      .buildForAnimal(animalId)
      .then((result) => {
        if (cancelled) return;
        setBundle(result);
        track('feature_opened', {
          feature: 'health-report',
          concerns: result.report.concerns.length,
          insufficientData: result.report.insufficientData,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to build health report:', err);
        setError('Could not build this report. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [animalId]);

  const report: HealthReport | null = bundle?.report ?? null;

  const plainText = useMemo(() => (bundle ? reportToPlainText(bundle) : ''), [bundle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard write failed:', err);
      setError('Could not copy to the clipboard.');
    }
  };

  // Routes to print, the share sheet, or the clipboard depending on what the
  // platform supports, and always reports which happened. window.print() is a
  // silent no-op in the iOS app, so calling it blind made this button look
  // broken on iPhone while raising no error.
  const handleShare = async () => {
    setError(null);
    const outcome = await shareDocument({
      title: `Health summary — ${report?.animalLabel ?? 'animal'}`,
      text: plainText,
    });
    const message = shareOutcomeMessage(outcome);
    if (outcome === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
    if (message) setError(message);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-sm text-muted">Gathering health records…</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-sm text-red-300 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-accent font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!report || !bundle) return null;

  const { animal, enclosure } = bundle;
  // Age at the most recent weigh-in, not age today — the cohort bucket must
  // match when the weight was actually taken.
  const birthForAge = animal.birthday ?? animal.acquisitionDate;
  const cohortAgeDays =
    birthForAge && report.weight
      ? Math.floor(
          (report.weight.currentDate.getTime() - new Date(birthForAge).getTime()) / 86400000
        )
      : null;
  const dimensions =
    enclosure?.widthInches && enclosure?.depthInches && enclosure?.heightInches
      ? `${enclosure.widthInches}" W × ${enclosure.depthInches}" D × ${enclosure.heightInches}" H`
      : '—';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 report-root">
      {/* Controls — never printed. */}
      <div className="flex items-center justify-between gap-2 no-print">
        <Link
          to={`/my-animals/${animalId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white"
          >
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy as text'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-accent text-on-accent"
          >
            {canPrint() ? <Printer className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shareActionLabel()}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300 no-print">{error}</p>}

      {/* Document header */}
      <header className="report-header bg-card border border-divider rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide">Health summary</p>
            <h1 className="text-2xl font-bold text-white mt-1">{report.animalLabel}</h1>
            <p className="text-sm text-muted mt-0.5">
              {[animal.speciesName ?? enclosure?.animalName, report.ageDescription]
                .filter(Boolean)
                .join(' · ') || 'Species not recorded'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted">Prepared</p>
            <p className="text-sm text-white">{formatDate(report.generatedAt)}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-divider">
          <Field label="Sex" value={animal.gender ? titleCase(animal.gender) : '—'} />
          <Field label="Morph" value={animal.morph || '—'} />
          <Field
            label="Hatch / birth"
            value={animal.birthday ? formatDate(new Date(animal.birthday)) : '—'}
          />
          <Field
            label="Acquired"
            value={animal.acquisitionDate ? formatDate(new Date(animal.acquisitionDate)) : '—'}
          />
        </dl>
      </header>

      {bundle.failedStreams.length > 0 && (
        <div className="report-section bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-sm text-amber-200">
            <strong>Incomplete report.</strong> These records could not be loaded and are missing
            below, rather than genuinely empty: {bundle.failedStreams.join(', ')}.
          </p>
        </div>
      )}

      {/* Concerns lead the document — this is what a vet reads first. */}
      <Section
        title="Points to raise"
        subtitle="Patterns found in the keeper's records. Observations, not diagnoses."
      >
        {report.concerns.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing in the recorded history stood out.{' '}
            {report.insufficientData
              ? 'Note that very little has been logged — see data gaps below.'
              : 'Weight, feeding, shedding and stool records were all reviewed.'}
          </p>
        ) : (
          <div className="space-y-3">
            {report.concerns.map((concern) => {
              const style = SEVERITY_STYLES[concern.severity];
              return (
                <div
                  key={concern.id}
                  className={`report-concern border-l-4 ${style.border} bg-card-elevated rounded-r-xl p-3`}
                  data-severity={concern.severity}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{concern.title}</p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${style.chip}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1.5">{concern.detail}</p>
                  <ul className="mt-2 space-y-0.5">
                    {concern.evidence.map((line) => (
                      <li key={line} className="text-xs text-white/80">
                        • {line}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Husbandry — the questions a vet asks first and keepers rarely have to hand. */}
      <Section
        title="Current husbandry"
        subtitle={
          bundle.report.dataGaps.some((gap) => gap.includes('target settings'))
            ? 'Temperature and humidity below are target settings — no measured readings are on record.'
            : 'Targets shown alongside the most recent measured readings.'
        }
      >
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Enclosure" value={enclosure?.name || '—'} />
          <Field label="Dimensions" value={dimensions} />
          <Field
            label="Substrate"
            value={enclosure?.substrateType ? titleCase(enclosure.substrateType) : '—'}
          />
          <Field label="Day temp target" value={formatTemp(enclosure?.baselineDayTempTarget)} />
          <Field label="Night temp target" value={formatTemp(enclosure?.baselineNightTempTarget)} />
          <Field
            label="Humidity target"
            value={
              enclosure?.baselineHumidityMinTarget !== undefined &&
              enclosure?.baselineHumidityMaxTarget !== undefined
                ? `${enclosure.baselineHumidityMinTarget}–${enclosure.baselineHumidityMaxTarget}%`
                : '—'
            }
          />
          <Field label="Basking (measured)" value={formatTemp(bundle.environment?.baskingTempF)} />
          <Field label="Cool end (measured)" value={formatTemp(bundle.environment?.coolTempF)} />
          <Field
            label="Humidity (measured)"
            value={
              bundle.environment?.humidityPercent !== undefined
                ? `${Math.round(bundle.environment.humidityPercent)}%`
                : '—'
            }
          />
          <Field
            label="UVB bulb"
            value={enclosure?.uvbBulbType ? titleCase(enclosure.uvbBulbType) : '—'}
          />
          <Field
            label="UVB installed"
            value={
              enclosure?.uvbBulbInstalledOn
                ? formatDate(new Date(enclosure.uvbBulbInstalledOn))
                : '—'
            }
          />
          <Field
            label="Photoperiod"
            value={
              enclosure?.lightingScheduleHours ? `${enclosure.lightingScheduleHours} h/day` : '—'
            }
          />
        </dl>
      </Section>

      {/* Weight */}
      <Section title="Weight">
        {report.weight ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Current" value={formatGrams(report.weight.currentGrams)} />
            <Field label="Measured" value={formatDate(report.weight.currentDate)} />
            <Field
              label="Change vs 90d peak"
              value={
                report.weight.change90dPercent === null
                  ? '—'
                  : `${report.weight.change90dPercent > 0 ? '+' : ''}${report.weight.change90dPercent}%`
              }
            />
            <Field label="Trend" value={titleCase(report.weight.trend)} />
            <Field label="Records" value={`${report.weight.entries}`} />
            <Field label="First weighed" value={formatDate(report.weight.firstDate)} />
          </dl>
        ) : (
          <p className="text-sm text-muted">No weight has ever been recorded for this animal.</p>
        )}
      </Section>

      {/* Cohort comparison sits with weight because it is a reading of the
          same number, not a separate finding. Screen only: the curve depends
          on a live population and would be stale the moment it is printed. */}
      <div className="no-print">
        <CohortGrowthCard
          speciesId={animal.speciesId}
          speciesName={animal.speciesName ?? enclosure?.animalName}
          ageDays={cohortAgeDays}
          currentWeightGrams={report.weight?.currentGrams ?? null}
        />
      </div>

      {/* Feeding */}
      <Section title="Feeding">
        {report.feeding ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Last accepted" value={formatDate(report.feeding.lastFedDate)} />
            <Field
              label="Days since"
              value={
                report.feeding.daysSinceLastFed === null
                  ? '—'
                  : `${report.feeding.daysSinceLastFed}`
              }
            />
            <Field
              label="Usual interval"
              value={
                report.feeding.averageDaysBetweenMeals === null
                  ? '—'
                  : `~${report.feeding.averageDaysBetweenMeals} days`
              }
            />
            <Field label="Refusals in a row" value={`${report.feeding.consecutiveRefusals}`} />
            <Field label="Accepted (90d)" value={`${report.feeding.acceptedIn90Days}`} />
            <Field label="Refused (90d)" value={`${report.feeding.refusalsIn90Days}`} />
          </dl>
        ) : (
          <p className="text-sm text-muted">No feeding history recorded.</p>
        )}
        {/* Stated only when the ambiguity is real. Previously this hedged on
            every report, which trained the reader to ignore it. */}
        {bundle.feedingIsGroupLevel && (
          <p className="text-xs text-amber-200/80 mt-3">
            This enclosure houses {bundle.enclosureAnimalCount} animals, and some feedings were
            logged against the enclosure rather than a specific animal. Those entries describe the
            group, not {report.animalLabel} alone.
          </p>
        )}
      </Section>

      {/* Diet and supplementation — a standard vet question, and the section
          most keepers cannot answer from memory. */}
      <Section
        title="Diet and supplementation"
        subtitle={`Feeder and supplement records from the last ${bundle.nutrition.windowDays} days.`}
      >
        <NutritionInsights analysis={bundle.nutrition} bare />
      </Section>

      {/* Shedding and stool side by side on wide screens. */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Shedding">
          {report.shed ? (
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Last shed" value={formatDate(report.shed.lastShedDate)} />
              <Field
                label="Days since"
                value={
                  report.shed.daysSinceLastShed === null ? '—' : `${report.shed.daysSinceLastShed}`
                }
              />
              <Field
                label="Usual interval"
                value={
                  report.shed.averageDaysBetweenSheds === null
                    ? '—'
                    : `~${report.shed.averageDaysBetweenSheds} days`
                }
              />
              <Field label="Problem sheds (180d)" value={`${report.shed.problemShedsIn180Days}`} />
            </dl>
          ) : (
            <p className="text-sm text-muted">No shed records.</p>
          )}
        </Section>

        <Section title="Defecation">
          {report.defecation ? (
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Most recent" value={formatDate(report.defecation.lastDate)} />
              <Field
                label="Days since"
                value={
                  report.defecation.daysSinceLast === null
                    ? '—'
                    : `${report.defecation.daysSinceLast}`
                }
              />
              <Field label="Abnormal (90d)" value={`${report.defecation.abnormalIn90Days}`} />
              <Field
                label="Parasites seen"
                value={
                  report.defecation.parasitesEverSeen ? 'Yes — keeper reported' : 'Not reported'
                }
              />
            </dl>
          ) : (
            <p className="text-sm text-muted">No stool records.</p>
          )}
        </Section>
      </div>

      {/* Prior veterinary history */}
      <Section title="Veterinary history">
        {report.vetVisits.length === 0 ? (
          <p className="text-sm text-muted">No prior visits recorded in this app.</p>
        ) : (
          <div className="space-y-3">
            {report.vetVisits.map((visit, index) => (
              <div
                key={`${visit.date.toISOString()}-${index}`}
                className="report-visit border-l-2 border-divider pl-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{titleCase(visit.visitType)}</p>
                  <p className="text-xs text-muted shrink-0">{formatDate(visit.date)}</p>
                </div>
                {(visit.clinicName || visit.vetName) && (
                  <p className="text-xs text-muted mt-0.5">
                    {[visit.vetName, visit.clinicName].filter(Boolean).join(' · ')}
                  </p>
                )}
                {visit.chiefComplaint && (
                  <p className="text-xs text-white/80 mt-1">
                    <span className="text-muted">Presenting:</span> {visit.chiefComplaint}
                  </p>
                )}
                {visit.diagnosis && (
                  <p className="text-xs text-white/80 mt-0.5">
                    <span className="text-muted">Diagnosis:</span> {visit.diagnosis}
                  </p>
                )}
                {visit.treatment && (
                  <p className="text-xs text-white/80 mt-0.5">
                    <span className="text-muted">Treatment:</span> {visit.treatment}
                  </p>
                )}
                {visit.prescriptions && visit.prescriptions.length > 0 && (
                  <p className="text-xs text-white/80 mt-0.5">
                    <span className="text-muted">Prescribed:</span> {visit.prescriptions.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Gaps are part of the document, not an omission from it. */}
      {report.dataGaps.length > 0 && (
        <Section
          title="Not recorded"
          subtitle="Stated explicitly so an absence is never mistaken for a normal result."
        >
          <ul className="space-y-1">
            {report.dataGaps.map((gap) => (
              <li key={gap} className="text-xs text-muted flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300/70" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <footer className="report-footer text-xs text-muted px-1 pb-8">
        <p className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Generated by Habitat Builder from keeper-entered records on{' '}
          {report.generatedAt.toLocaleString()}.
        </p>
        <p className="mt-1">
          This is a husbandry and observation summary, not a veterinary assessment. Records were
          entered by the keeper and have not been independently verified.
        </p>
      </footer>

      <style>{PRINT_STYLES}</style>
    </div>
  );
}
