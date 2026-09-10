/**
 * SitterSheetView
 *
 * A printable instruction pack for whoever is covering the collection while
 * the keeper is away.
 *
 * The reader is assumed to be competent and completely unfamiliar with
 * reptiles. That shapes every choice here: the schedule is a dated tick-list
 * rather than a set of recurrence rules, targets are stated as plain numbers,
 * and the things that must NOT happen are given the same prominence as the
 * things that must. A sitter who skips a misting is a nuisance; one who
 * "rescues" a brumating animal or opens a hide to check on a shedding snake
 * causes real harm.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  Copy,
  Check,
  Loader2,
  Phone,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sitterSheetService, type SitterSheetBundle } from '../../services/sitterSheetService';
import { track } from '../../services/analyticsService';
import { sitterSheetToPlainText } from '../../utils/sitterSheetText';
import { PRINT_STYLES } from './printStyles';
import { shareDocument, shareOutcomeMessage, shareActionLabel, canPrint } from '../../utils/shareDocument';

/** Things a well-meaning sitter does that cause harm. Stated once, prominently. */
const DO_NOT_LIST = [
  'Do not handle any animal unless a task below says to. Handling is stressful and is not needed for basic care.',
  'Do not open or lift a hide to check on an animal. If it is tucked away, it is doing what it should.',
  'Do not offer more food than a feeding task specifies, and do not re-offer food that was refused.',
  'Do not change any thermostat, timer or light schedule, even if a reading looks wrong. Note it and contact the keeper.',
  'Do not remove an animal that looks dull, cloudy-eyed or is shedding. That is normal and it should be left alone.',
];

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Parsed as local midnight, so a date picked as the 4th is the 4th. */
function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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

export function SitterSheetView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const [startDate, setStartDate] = useState(() => toDateInputValue(today));
  const [endDate, setEndDate] = useState(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
    return toDateInputValue(end);
  });

  const [bundle, setBundle] = useState<SitterSheetBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const start = fromDateInputValue(startDate);
    const end = fromDateInputValue(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    // A backwards range is a half-typed date, not an error worth shouting about.
    if (end.getTime() < start.getTime()) return;

    setLoading(true);
    setError(null);

    sitterSheetService
      .build({ userId: user.id, startDate: start, endDate: end })
      .then((result) => {
        if (cancelled) return;
        setBundle(result);
        track('feature_opened', {
          feature: 'sitter-sheet',
          days: result.schedule.dayCount,
          tasks: result.schedule.totalOccurrences,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to build sitter sheet:', err);
        setError('Could not build the care sheet. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, startDate, endDate]);

  const plainText = useMemo(() => (bundle ? sitterSheetToPlainText(bundle) : ''), [bundle]);

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

  // See utils/shareDocument: window.print() silently does nothing inside the
  // iOS app, so the route is chosen from what the platform actually supports
  // and the outcome is always reported.
  const handleShare = async () => {
    setError(null);
    const outcome = await shareDocument({
      title: "Care instructions — while I'm away",
      text: plainText,
    });
    const message = shareOutcomeMessage(outcome);
    if (outcome === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
    if (message) setError(message);
  };

  const animalLabel = (enclosureId: string): string => {
    const entry = bundle?.enclosures.find((item) => item.enclosure.id === enclosureId);
    if (!entry) return '';
    return entry.enclosure.name;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 report-root">
      {/* Controls — never printed. */}
      <div className="no-print space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/care-calendar"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { void handleCopy(); }}
              disabled={!bundle}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy as text'}
            </button>
            <button
              type="button"
              onClick={() => { void handleShare(); }}
              disabled={!bundle}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-accent text-on-accent disabled:opacity-50"
            >
              {canPrint() ? <Printer className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {shareActionLabel()}
            </button>
          </div>
        </div>

        <div className="bg-card border border-divider rounded-2xl p-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sitter-start" className="block text-xs text-muted mb-1">
              First day away
            </label>
            <input
              id="sitter-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
            />
          </div>
          <div>
            <label htmlFor="sitter-end" className="block text-xs text-muted mb-1">
              Last day away
            </label>
            <input
              id="sitter-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
            />
          </div>
          {bundle && (
            <p className="text-xs text-muted flex-1 min-w-[12rem]">
              {bundle.schedule.dayCount} days · {bundle.schedule.totalOccurrences} scheduled tasks
              {bundle.schedule.rangeTrimmed && ' · range trimmed to 60 days'}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>

      {loading && !bundle && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-sm text-muted">Building the care sheet…</p>
          </div>
        </div>
      )}

      {bundle && (
        <>
          <header className="report-header bg-card border border-divider rounded-2xl p-5">
            <p className="text-xs text-muted uppercase tracking-wide">Care instructions</p>
            <h1 className="text-2xl font-bold text-white mt-1">While I'm away</h1>
            <p className="text-sm text-muted mt-1">
              {formatDayLabel(bundle.startDate)} — {formatDayLabel(bundle.endDate)} ·{' '}
              {bundle.enclosures.length} enclosure{bundle.enclosures.length === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-white mt-3">
              Thank you for looking after these animals. Everything you need is on this sheet. If
              anything looks wrong and is not covered here, contact me before acting.
            </p>
          </header>

          {bundle.failedStreams.length > 0 && (
            <div className="report-section bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-sm text-amber-200">
                <strong>Incomplete sheet.</strong> These could not be loaded and are missing below:{' '}
                {bundle.failedStreams.join(', ')}.
              </p>
            </div>
          )}

          {/* Emergency contact leads. It is the one thing that matters at 2am. */}
          <Section title="If something is wrong">
            {bundle.emergencyContact ? (
              <div className="space-y-1">
                <p className="text-base font-semibold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {bundle.emergencyContact.clinicPhone ?? 'No phone number on record'}
                </p>
                <p className="text-sm text-white">
                  {[bundle.emergencyContact.clinicName, bundle.emergencyContact.vetName]
                    .filter(Boolean)
                    .join(' · ') || 'Clinic name not recorded'}
                </p>
                <p className="text-xs text-muted">
                  Last visit {bundle.emergencyContact.lastVisit.toLocaleDateString()} — confirm this
                  clinic is still current before you travel.
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-200">
                No vet contact is recorded in the app. Write a phone number here before you hand
                this sheet over — a sitter with no number to call has no options.
              </p>
            )}
            <p className="text-sm text-muted mt-3">
              Reptiles hide illness well, so anything sudden matters: refusing to move when touched,
              gaping or open-mouth breathing, visible blood, or a fall. Call rather than wait.
            </p>
          </Section>

          {/* What not to do sits high, before the task list. */}
          <Section
            title="Please do not"
            subtitle="Well-meant intervention causes more harm here than doing nothing."
          >
            <ul className="space-y-1.5">
              {DO_NOT_LIST.map((item) => (
                <li key={item} className="text-sm text-white flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-1 text-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* The enclosures themselves, so the sitter can find them. */}
          <Section title="The animals" subtitle="Where they live and what to keep them at.">
            <div className="space-y-3">
              {bundle.enclosures.map((entry) => (
                <div key={entry.enclosure.id} className="report-visit border-l-2 border-divider pl-3">
                  <p className="text-sm font-semibold text-white">{entry.enclosure.name}</p>
                  <p className="text-xs text-muted">
                    {entry.animals.length > 0
                      ? entry.animals
                          .map((animal) => animal.name ?? `Animal #${animal.animalNumber ?? '?'}`)
                          .join(', ')
                      : 'No animals recorded'}
                    {entry.enclosure.animalName ? ` · ${entry.enclosure.animalName}` : ''}
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Temperature:{' '}
                    {entry.dayTempTarget !== undefined
                      ? `${entry.dayTempTarget}°F by day`
                      : 'not recorded'}
                    {entry.nightTempTarget !== undefined ? `, ${entry.nightTempTarget}°F at night` : ''}
                    {' · '}
                    Humidity:{' '}
                    {entry.humidityMin !== undefined && entry.humidityMax !== undefined
                      ? `${entry.humidityMin}–${entry.humidityMax}%`
                      : 'not recorded'}
                  </p>
                </div>
              ))}
              {bundle.enclosures.length === 0 && (
                <p className="text-sm text-muted">No active enclosures found.</p>
              )}
            </div>
          </Section>

          {/* The schedule: the reason the sheet exists. */}
          <Section
            title="Daily checklist"
            subtitle="Tick each item as you go. An empty day genuinely means nothing is due."
          >
            <div className="space-y-3">
              {bundle.schedule.days.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className="sitter-day bg-card-elevated rounded-xl p-3"
                >
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDayLabel(day.date)}
                  </p>
                  {day.occurrences.length === 0 ? (
                    <p className="text-xs text-muted mt-1">Nothing scheduled — just a quick look over.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {day.occurrences.map((occurrence, index) => (
                        <li
                          key={`${occurrence.taskId}-${index}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="print-checkbox w-4 h-4 mt-0.5 shrink-0 rounded border border-divider bg-card" />
                          <span className="flex-1">
                            <span className="text-white">{occurrence.title}</span>
                            {occurrence.scheduledTime && (
                              <span className="text-muted"> · {occurrence.scheduledTime}</span>
                            )}
                            {occurrence.enclosureId && (
                              <span className="text-muted"> · {animalLabel(occurrence.enclosureId)}</span>
                            )}
                            {occurrence.wasOverdue && (
                              <span className="text-amber-300"> · was already due</span>
                            )}
                            {occurrence.supplementType && (
                              <span className="block text-xs text-muted">
                                Dust with {occurrence.supplementType}
                              </span>
                            )}
                            {occurrence.notes && (
                              <span className="block text-xs text-muted">{occurrence.notes}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* As-needed tasks are never dated, so they get their own list. */}
          {bundle.schedule.asNeeded.length > 0 && (
            <Section
              title="Watch for these"
              subtitle="No fixed day — do them only if you notice the thing they describe."
            >
              <ul className="space-y-1.5">
                {bundle.schedule.asNeeded.map((item) => (
                  <li key={item.id} className="text-sm text-white">
                    • {item.title}
                    {item.notes && <span className="block text-xs text-muted ml-3">{item.notes}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <footer className="report-footer text-xs text-muted px-1 pb-8">
            <p>
              Generated by Habitat Builder on {new Date().toLocaleString()} from the keeper's own
              care schedule. Add a phone number for yourself before handing this over.
            </p>
          </footer>
        </>
      )}

      {!user && !loading && (
        <div className="text-center py-10">
          <p className="text-sm text-muted mb-3">Sign in to build a care sheet.</p>
          <button type="button" onClick={() => navigate('/')} className="text-sm text-accent font-semibold">
            Go home
          </button>
        </div>
      )}

      <style>{PRINT_STYLES}</style>
    </div>
  );
}
