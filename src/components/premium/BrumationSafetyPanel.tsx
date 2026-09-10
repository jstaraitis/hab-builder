import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, Scale, CalendarDays } from 'lucide-react';
import { assessBrumation, type BrumationAssessment, type BrumationConcernLevel } from '../../engine/brumationSafety';
import { weightTrackingService } from '../../services/weightTrackingService';
import type { AlertSeverity } from '../../types/thresholds';
import type { EnclosureAnimal } from '../../types/careCalendar';

const SEVERITY_ICON: Record<AlertSeverity, React.ReactNode> = {
  urgent: <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />,
};

const SEVERITY_STYLES: Record<AlertSeverity, { border: string; bg: string; title: string }> = {
  urgent: { border: 'border-red-500/30', bg: 'bg-red-500/8', title: 'text-red-300' },
  warning: { border: 'border-amber-400/30', bg: 'bg-amber-500/8', title: 'text-amber-300' },
  info: { border: 'border-blue-400/30', bg: 'bg-blue-500/8', title: 'text-blue-300' },
};

const LEVEL_STYLES: Record<BrumationConcernLevel, { ring: string; label: string; tone: string }> = {
  ok: { ring: 'border-divider', label: 'On track', tone: 'text-accent' },
  watch: { ring: 'border-blue-400/30', label: 'Keep watching', tone: 'text-blue-300' },
  concern: { ring: 'border-amber-400/40', label: 'Needs attention', tone: 'text-amber-300' },
  urgent: { ring: 'border-red-500/40', label: 'Act now', tone: 'text-red-300' },
};

interface BrumationSafetyPanelProps {
  readonly animal: EnclosureAnimal;
  readonly startDate: string;
  readonly refreshKey?: number;
}

export function BrumationSafetyPanel({ animal, startDate, refreshKey }: BrumationSafetyPanelProps) {
  const [assessment, setAssessment] = useState<BrumationAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const weightLogs = await weightTrackingService.getWeightLogs(animal.id);
        if (cancelled) return;

        setAssessment(
          assessBrumation({
            speciesId: animal.speciesId,
            animalName: animal.name,
            startDate,
            weightLogs,
          })
        );
      } catch (error) {
        console.error('Failed to assess brumation:', error);
        if (!cancelled) setAssessment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [animal.id, animal.speciesId, animal.name, startDate, refreshKey]);

  if (loading) {
    return (
      <div className="bg-card-elevated border border-divider rounded-xl p-4">
        <p className="text-sm text-muted">Checking brumation safety…</p>
      </div>
    );
  }

  if (!assessment) return null;

  const level = LEVEL_STYLES[assessment.level];
  const { weightLossPercent, baselineWeightGrams, currentWeightGrams } = assessment;

  return (
    <div className={`bg-card-elevated border ${level.ring} rounded-xl overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-bold text-white">Brumation Safety</h3>
        <span className={`ml-auto text-xs font-semibold ${level.tone}`}>{level.label}</span>
      </div>

      {/* At-a-glance numbers */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="bg-card border border-divider rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Elapsed</span>
          </div>
          <p className="text-lg font-bold text-white leading-none">
            {assessment.weeksElapsed}
            <span className="text-xs text-muted font-normal ml-1">
              {assessment.weeksElapsed === 1 ? 'week' : 'weeks'}
            </span>
          </p>
          <p className="text-[11px] text-muted mt-1">
            Typical {assessment.profile.typicalWeeksMin}–{assessment.profile.typicalWeeksMax} wks
          </p>
        </div>

        <div className="bg-card border border-divider rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Weight</span>
          </div>
          {weightLossPercent === null ? (
            <p className="text-sm font-semibold text-muted leading-tight">Not tracked</p>
          ) : (
            <>
              <p className="text-lg font-bold text-white leading-none">
                {weightLossPercent > 0 ? '−' : '+'}
                {Math.abs(weightLossPercent)}
                <span className="text-xs text-muted font-normal ml-0.5">%</span>
              </p>
              <p className="text-[11px] text-muted mt-1">
                {baselineWeightGrams}g → {currentWeightGrams}g
              </p>
            </>
          )}
        </div>
      </div>

      {/* Findings */}
      <div className="px-4 pb-4 space-y-2">
        {assessment.alerts.length === 0 ? (
          <div className="flex gap-2.5 p-3 rounded-xl border border-divider bg-card">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              Weight loss and duration are both within a normal range. Keep weighing every two weeks
              and make sure fresh water stays available.
            </p>
          </div>
        ) : (
          assessment.alerts.map((alert) => {
            const styles = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className={`flex gap-3 p-3 rounded-xl border ${styles.border} ${styles.bg}`}
              >
                {SEVERITY_ICON[alert.severity]}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${styles.title}`}>{alert.title}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{alert.body}</p>
                </div>
              </div>
            );
          })
        )}

        <p className="text-[11px] text-muted leading-relaxed pt-1">
          {assessment.profile.note} This is husbandry guidance, not veterinary advice — when in
          doubt, contact an exotics vet.
        </p>
      </div>
    </div>
  );
}
