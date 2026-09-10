/**
 * WhatChangedView
 *
 * Answers "what did I change before this went wrong?" — the question the hobby
 * makes almost impossible to answer unaided, because the cause is typically two
 * months upstream of the symptom.
 *
 * The interface deliberately does not lead with an answer. It leads with the
 * question and a window, then lists candidates in time order. The moment this
 * screen says "this is why", it becomes a diagnosis from a database that has
 * never seen the animal.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, History } from 'lucide-react';
import { changeTimelineService, type ChangeTimelineBundle } from '../../services/changeTimelineService';
import type { IncidentKind, Relevance } from '../../engine/changeTimeline';
import { track } from '../../services/analyticsService';

const INCIDENTS: Array<{ value: IncidentKind; label: string }> = [
  { value: 'feeding-refusal', label: 'Stopped eating' },
  { value: 'weight-loss', label: 'Lost weight' },
  { value: 'stuck-shed', label: 'Bad or stuck shed' },
  { value: 'abnormal-stool', label: 'Abnormal stool' },
  { value: 'lethargy', label: 'Lethargic or hiding' },
  { value: 'custom', label: 'Something else' },
];

const WINDOWS = [30, 60, 90] as const;

const RELEVANCE_STYLE: Record<Relevance, { chip: string; label: string; border: string }> = {
  high: { chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Worth checking', border: 'border-l-amber-400' },
  medium: { chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30', label: 'Possible', border: 'border-l-sky-400' },
  low: { chip: 'bg-card-elevated text-muted border-divider', label: 'Unlikely', border: 'border-l-divider' },
};

const CATEGORY_LABEL: Record<string, string> = {
  environment: 'Environment',
  enclosure: 'Enclosure',
  diet: 'Diet',
  lighting: 'Lighting',
  health: 'Health',
  husbandry: 'Husbandry',
};

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function WhatChangedView() {
  const { animalId } = useParams<{ animalId: string }>();
  const [searchParams] = useSearchParams();

  const [incidentKind, setIncidentKind] = useState<IncidentKind>(
    (searchParams.get('kind') as IncidentKind) || 'feeding-refusal'
  );
  const [incidentDate, setIncidentDate] = useState(() => toDateInputValue(new Date()));
  const [windowDays, setWindowDays] = useState<number>(60);

  const [bundle, setBundle] = useState<ChangeTimelineBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animalId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    changeTimelineService
      .build({
        enclosureAnimalId: animalId,
        incidentKind,
        incidentDate: fromDateInputValue(incidentDate),
        windowDays,
      })
      .then((result) => {
        if (cancelled) return;
        setBundle(result);
        track('feature_opened', {
          feature: 'what-changed',
          incidentKind,
          windowDays,
          changes: result.timeline.changes.length,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to build change timeline:', err);
        setError('Could not build the timeline. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [animalId, incidentKind, incidentDate, windowDays]);

  const grouped = useMemo(() => {
    if (!bundle) return [];
    const high = bundle.timeline.changes.filter((c) => c.relevance === 'high');
    const rest = bundle.timeline.changes.filter((c) => c.relevance !== 'high');
    return [
      { title: 'Most worth checking', items: high },
      { title: 'Everything else that changed', items: rest },
    ].filter((group) => group.items.length > 0);
  }, [bundle]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <Link
        to={`/my-animals/${animalId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <header className="bg-card border border-divider rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-white">What changed?</h1>
        </div>
        <p className="text-sm text-muted mt-1">
          Husbandry problems usually show up weeks after their cause. This reads your records back
          from before the problem started.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-card border border-divider rounded-2xl p-4 space-y-3">
        <div>
          <span className="block text-xs text-muted mb-1.5">What went wrong?</span>
          <div className="flex flex-wrap gap-1.5">
            {INCIDENTS.map((incident) => (
              <button
                key={incident.value}
                type="button"
                onClick={() => setIncidentKind(incident.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  incidentKind === incident.value
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-card-elevated text-muted border-divider'
                }`}
              >
                {incident.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="incident-date" className="block text-xs text-muted mb-1">
              When did you notice it?
            </label>
            <input
              id="incident-date"
              type="date"
              value={incidentDate}
              max={toDateInputValue(new Date())}
              onChange={(event) => setIncidentDate(event.target.value)}
              className="px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
            />
          </div>
          <div>
            <span className="block text-xs text-muted mb-1">Look back</span>
            <div className="flex gap-1">
              {WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWindowDays(days)}
                  className={`text-xs font-semibold px-2.5 py-2 rounded-xl border transition-colors ${
                    windowDays === days
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-card-elevated text-muted border-divider'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      {bundle && !loading && (
        <>
          {bundle.failedStreams.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-sm text-amber-200">
                <strong>Incomplete.</strong> These could not be loaded, so changes in them are
                missing rather than absent: {bundle.failedStreams.join(', ')}.
              </p>
            </div>
          )}

          {bundle.timeline.nothingRecorded ? (
            <div className="bg-card border border-divider rounded-2xl p-5">
              <p className="text-sm text-white font-semibold mb-1">Nothing was logged in this window.</p>
              <p className="text-sm text-muted">
                That is not the same as nothing changing — it means there are no records to read
                back.
                {bundle.timeline.emptyStreams.length > 0 && (
                  <> No data at all for: {bundle.timeline.emptyStreams.join(', ')}.</>
                )}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <section key={group.title} className="bg-card border border-divider rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                  {group.title}
                </h2>
                <div className="space-y-2.5">
                  {group.items.map((change) => {
                    const style = RELEVANCE_STYLE[change.relevance];
                    return (
                      <div
                        key={change.id}
                        className={`border-l-4 ${style.border} bg-card-elevated rounded-r-xl p-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{change.title}</p>
                            <p className="text-xs text-muted mt-0.5">
                              {CATEGORY_LABEL[change.category] ?? change.category} ·{' '}
                              {change.daysBefore === 0
                                ? 'same day'
                                : `${change.daysBefore} days before`}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${style.chip}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        {change.detail && (
                          <p className="text-xs text-secondary mt-1.5">{change.detail}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* The disclaimer is part of the feature, not boilerplate. */}
          <div className="flex items-start gap-2 px-1 pb-8">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted" />
            <p className="text-xs text-muted">
              These are things that happened before the problem, not causes of it. Ranking reflects
              how often each kind of change is associated with this kind of symptom in general — it says
              nothing about your animal specifically. Unlikely items are shown rather than hidden,
              because the app does not know your setup well enough to rule them out.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
