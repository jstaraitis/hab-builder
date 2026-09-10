import { useEffect, useState } from 'react';
import { ownerDashboardService, type OwnerFunnelAnalytics } from '../../services/ownerDashboardService';

const STEP_LABELS: Record<string, string> = {
  plan_generated: 'Generated a build plan',
  signup_completed: 'Created an account',
  paywall_viewed: 'Hit a paywall',
  checkout_started: 'Started checkout',
  trial_started: 'Started a trial',
  subscription_activated: 'Became a subscriber',
};

const RANGES = [7, 30, 90] as const;

export function FunnelPanel() {
  const [data, setData] = useState<OwnerFunnelAnalytics | null>(null);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    ownerDashboardService
      .getFunnelAnalytics(days)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to load funnel:', err);
        setError('Could not load funnel data. Has the analytics migration been run?');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [days]);

  const topStep = data?.steps[0]?.people ?? 0;

  return (
    <div className="bg-card border border-divider rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-white">Conversion funnel</h3>
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                days === range
                  ? 'bg-accent text-on-accent'
                  : 'bg-card-elevated text-muted border border-divider'
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted mb-4">Distinct people, not events.</p>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {data && !loading && (
        <>
          {data.totalEvents === 0 ? (
            <p className="text-sm text-muted">
              No events recorded in the last {data.sinceDays} days. If the migration has run,
              this fills in as people use the app.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.steps.map((step, index) => {
                const label = STEP_LABELS[step.event] ?? step.event;
                // Relative to the top of the funnel, so each bar reads as
                // "share of everyone who ever started".
                const width = topStep > 0 ? (step.people / topStep) * 100 : 0;
                const previous = index > 0 ? data.steps[index - 1].people : null;
                const dropoff =
                  previous && previous > 0
                    ? Math.round((1 - step.people / previous) * 100)
                    : null;

                return (
                  <div key={step.event}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-white">{label}</span>
                      <span className="text-xs text-muted">
                        {step.people}
                        {dropoff !== null && dropoff > 0 && (
                          <span className="text-red-300 ml-1.5">−{dropoff}%</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-card-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-divider grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Trial → paid</p>
              <p className="text-lg font-bold text-white">
                {data.trialConversionRate === null ? '—' : `${data.trialConversionRate}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Events recorded</p>
              <p className="text-lg font-bold text-white">{data.totalEvents}</p>
            </div>
          </div>

          {data.paywallSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-divider">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Which paywall they hit
              </p>
              <div className="space-y-1">
                {data.paywallSources.map((source) => (
                  <div key={source.label} className="flex justify-between text-xs">
                    <span className="text-white">{source.label}</span>
                    <span className="text-muted">{source.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
