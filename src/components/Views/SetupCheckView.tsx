/**
 * SetupCheckView
 *
 * The replacement for the drag-and-drop enclosure designer.
 *
 * One question per screen, large targets, no spatial manipulation — because
 * the value was never in dragging things around a canvas, it was in checking
 * eight measurements against husbandry rules. A questionnaire delivers the same
 * findings, works on a phone, and can be re-run in two minutes after a rebuild.
 *
 * Every question offers an explicit "not sure" rather than forcing an answer.
 * A guessed measurement produces a confident wrong finding, which is worse than
 * a skipped rule — and the results screen names what went unanswered so a gap
 * never reads as a pass.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react';
import { setupCheckService } from '../../services/setupCheckService';
import {
  runSetupCheck,
  type SetupCheckAnswers,
  type SetupCheckContext,
  type SetupSeverity,
} from '../../engine/setupCheck';
import { track } from '../../services/analyticsService';
import { ZONE_SPECS, baskingUviTarget } from '../../engine/fergusonZones';

type QuestionId = keyof SetupCheckAnswers;

interface Choice {
  value: string | number | boolean;
  label: string;
  hint?: string;
}

interface Question {
  id: QuestionId;
  title: string;
  /** Why this is being asked — keeps the wizard from feeling arbitrary. */
  why: string;
  kind: 'number' | 'choice';
  unit?: string;
  placeholder?: string;
  choices?: Choice[];
  /** Hidden when this returns false, e.g. mat-only follow-ups. */
  when?: (answers: SetupCheckAnswers, context: SetupCheckContext) => boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 'uvbDistanceInches',
    title: 'How far is the UVB lamp from the basking spot?',
    why: 'UVB output falls off sharply with distance. A lamp mounted too far away looks like it is working while delivering almost nothing.',
    kind: 'number',
    unit: 'inches',
    placeholder: 'e.g. 14',
    when: (_answers, context) => context.uvbRequired !== false,
  },
  {
    id: 'uvbOverMesh',
    title: 'Does the UVB sit on top of a mesh lid?',
    why: 'Mesh blocks a large share of UVB, so the same lamp needs to sit closer than it would mounted inside.',
    kind: 'choice',
    choices: [
      { value: true, label: 'Yes, it sits on mesh' },
      { value: false, label: 'No, it is mounted inside' },
    ],
    when: (_answers, context) => context.uvbRequired !== false,
  },
  {
    id: 'baskingToCoolInches',
    title: 'How far is it from the basking spot to the coolest point?',
    why: 'An animal thermoregulates by moving. Too little distance and the whole enclosure ends up one temperature.',
    kind: 'number',
    unit: 'inches',
    placeholder: 'e.g. 30',
  },
  {
    id: 'hidesWarmSide',
    title: 'How many hides are on the warm side?',
    why: 'Cover at both ends means the animal never has to trade feeling safe against being the right temperature.',
    kind: 'choice',
    choices: [
      { value: 0, label: 'None' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3 or more' },
    ],
  },
  {
    id: 'hidesCoolSide',
    title: 'How many hides are on the cool side?',
    why: 'The cool-side hide is the one most often missing.',
    kind: 'choice',
    choices: [
      { value: 0, label: 'None' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3 or more' },
    ],
  },
  {
    id: 'heatSource',
    title: 'What provides heat?',
    why: 'Different heat sources fail in different ways, and are regulated differently.',
    kind: 'choice',
    choices: [
      { value: 'overhead-bulb', label: 'Overhead basking bulb' },
      { value: 'ceramic-emitter', label: 'Ceramic heat emitter' },
      { value: 'deep-heat-projector', label: 'Deep heat projector' },
      { value: 'heat-mat', label: 'Heat mat' },
      { value: 'radiant-panel', label: 'Radiant heat panel' },
      { value: 'none', label: 'No supplemental heat' },
    ],
  },
  {
    id: 'heatOnThermostat',
    title: 'Is the heat source on a thermostat?',
    why: 'An unregulated heat source tracks room temperature — it runs hottest on the warmest days, when it is least needed.',
    kind: 'choice',
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
    when: (answers) => answers.heatSource !== undefined && answers.heatSource !== 'none',
  },
  {
    id: 'probeLocation',
    title: 'Where is the thermostat probe?',
    why: 'A thermostat only controls the point its probe is measuring. Probe placement is one of the most common serious setup errors.',
    kind: 'choice',
    choices: [
      { value: 'basking-surface', label: 'At the basking surface' },
      { value: 'ambient-warm', label: 'In the air, warm end' },
      { value: 'cool-end', label: 'At the cool end' },
      { value: 'none', label: 'There is no probe' },
      { value: 'unknown', label: 'Not sure' },
    ],
    when: (answers) => answers.heatOnThermostat !== false && answers.heatSource !== 'none',
  },
  {
    id: 'waterPosition',
    title: 'Where is the water dish?',
    why: 'Water under a heat source evaporates fast, which changes humidity and empties the dish sooner than expected.',
    kind: 'choice',
    choices: [
      { value: 'warm-end', label: 'Warm end' },
      { value: 'middle', label: 'Middle' },
      { value: 'cool-end', label: 'Cool end' },
      { value: 'none', label: 'No water dish' },
    ],
  },
];

const SEVERITY_STYLE: Record<SetupSeverity, { chip: string; label: string; border: string }> = {
  critical: { chip: 'bg-red-500/15 text-red-300 border-red-500/30', label: 'Fix this', border: 'border-l-red-400' },
  important: { chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Worth changing', border: 'border-l-amber-400' },
  advisory: { chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30', label: 'Minor', border: 'border-l-sky-400' },
};

export function SetupCheckView() {
  const { enclosureId } = useParams<{ enclosureId: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<SetupCheckAnswers>({});
  const [context, setContext] = useState<SetupCheckContext>({});
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enclosureId) return;
    let cancelled = false;

    setupCheckService
      .load(enclosureId)
      .then((result) => {
        if (cancelled) return;
        setAnswers(result.answers);
        setContext(result.context);
        // A previously completed check opens on its results, not back at
        // question one — re-checking is meant to be cheap.
        if (result.completedAt) setShowResults(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to load setup check:', err);
        setError('Could not load this enclosure.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enclosureId]);

  // Questions whose `when` guard passes, given what has been answered so far.
  const activeQuestions = useMemo(
    () => QUESTIONS.filter((question) => !question.when || question.when(answers, context)),
    [answers, context]
  );

  const result = useMemo(() => runSetupCheck(answers, context), [answers, context]);

  const zoneSpec = context.fergusonZone ? ZONE_SPECS[context.fergusonZone] : null;

  const current = activeQuestions[step];
  const isLast = step >= activeQuestions.length - 1;

  const setAnswer = (id: QuestionId, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFinish = async () => {
    if (!enclosureId) return;
    setSaving(true);
    setError(null);
    try {
      await setupCheckService.save(enclosureId, answers);
      track('feature_opened', {
        feature: 'setup-check',
        findings: result.findings.length,
        critical: result.findings.filter((f) => f.severity === 'critical').length,
      });
      setShowResults(true);
    } catch (err) {
      console.error('Failed to save setup check:', err);
      setError('Could not save your answers. Your results are still shown below.');
      setShowResults(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // ---- Results ----------------------------------------------------------
  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Link
          to={`/care-calendar/enclosures/edit/${enclosureId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to enclosure
        </Link>

        <header className="bg-card border border-divider rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-white">Setup check</h1>
          </div>
          <p className="text-sm text-muted mt-1">
            {result.findings.length === 0
              ? 'Nothing flagged from what you told us.'
              : `${result.findings.length} thing${result.findings.length === 1 ? '' : 's'} worth looking at.`}
          </p>
        </header>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {result.insufficientAnswers && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <p className="text-sm text-amber-200">
              Only a few questions were answered, so most checks did not run. The result below is
              not a clean bill of health.
            </p>
          </div>
        )}

        {result.findings.map((finding) => {
          const style = SEVERITY_STYLE[finding.severity];
          return (
            <div
              key={finding.id}
              className={`bg-card border border-divider border-l-4 ${style.border} rounded-2xl p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">{finding.title}</h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${style.chip}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="text-xs text-secondary mt-2">{finding.detail}</p>
              <p className="text-xs text-white mt-2">
                <span className="text-muted">What to do: </span>
                {finding.fix}
              </p>
            </div>
          );
        })}

        {result.findings.length === 0 && !result.insufficientAnswers && (
          <div className="bg-card border border-divider rounded-2xl p-5">
            <p className="text-sm text-white">
              Everything you answered checks out — UVB distance, gradient, hides, thermostat and
              water are all within the usual ranges.
            </p>
          </div>
        )}

        {/* Gaps are stated, never left to look like passes. */}
        {result.unanswered.length > 0 && (
          <div className="bg-card border border-divider rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Not checked
            </p>
            <ul className="space-y-1">
              {result.unanswered.map((question) => (
                <li key={question} className="text-xs text-muted flex gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{question} — you skipped this, so the rule did not run.</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pb-8">
          <button
            type="button"
            onClick={() => {
              setShowResults(false);
              setStep(0);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-card-elevated border border-divider text-white"
          >
            <RotateCcw className="w-4 h-4" />
            Run it again
          </button>
          <button
            type="button"
            onClick={() => navigate(`/care-calendar/enclosures/edit/${enclosureId}`)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-accent text-on-accent"
          >
            Done
          </button>
        </div>

        <p className="text-xs text-muted px-1 pb-8">
          These are general husbandry guidelines, not manufacturer specifications. Bulb output
          varies by model — check the distance chart for yours.
        </p>
      </div>
    );
  }

  // ---- Wizard -----------------------------------------------------------
  if (!current) return null;

  const value = answers[current.id];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs text-muted">
          {step + 1} of {activeQuestions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1 bg-card-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((step + 1) / activeQuestions.length) * 100}%` }}
        />
      </div>

      <div className="bg-card border border-divider rounded-2xl p-5">
        <h1 className="text-lg font-bold text-white">{current.title}</h1>
        <p className="text-sm text-muted mt-1.5">{current.why}</p>

        {/* On UVB questions, name the species' Ferguson zone and its UVI target.
            It explains where the answer will be judged from, and it is the piece
            of husbandry most keepers have never been told. */}
        {zoneSpec && current.id.startsWith('uvb') && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-card-elevated border border-divider">
            <p className="text-xs font-semibold text-accent">{zoneSpec.label}</p>
            <p className="text-xs text-muted mt-0.5">
              {zoneSpec.behaviour} Target: {baskingUviTarget(zoneSpec.zone)}.
            </p>
          </div>
        )}

        <div className="mt-5 space-y-2">
          {current.kind === 'number' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={value === undefined ? '' : String(value)}
                placeholder={current.placeholder}
                onChange={(event) =>
                  setAnswer(
                    current.id,
                    event.target.value === '' ? undefined : Number(event.target.value)
                  )
                }
                className="w-32 px-3 py-3 rounded-xl bg-card-elevated border border-divider text-white text-lg"
              />
              <span className="text-sm text-muted">{current.unit}</span>
            </div>
          ) : (
            current.choices?.map((choice) => {
              const selected = value === choice.value;
              return (
                <button
                  key={String(choice.value)}
                  type="button"
                  onClick={() => setAnswer(current.id, choice.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selected
                      ? 'bg-accent/15 border-accent text-white'
                      : 'bg-card-elevated border-divider text-secondary'
                  }`}
                >
                  <span className="text-sm font-medium">{choice.label}</span>
                  {choice.hint && <span className="block text-xs text-muted mt-0.5">{choice.hint}</span>}
                </button>
              );
            })
          )}
        </div>

        {/* Skipping is a first-class answer. A guessed measurement produces a
            confident wrong finding; a skip just means the rule does not run. */}
        <button
          type="button"
          onClick={() => {
            setAnswer(current.id, undefined);
            if (isLast) void handleFinish();
            else setStep((s) => s + 1);
          }}
          className="mt-4 text-xs text-muted underline"
        >
          I'm not sure — skip this
        </button>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => {
          if (isLast) void handleFinish();
          else setStep((s) => s + 1);
        }}
        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-on-accent disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving…
          </>
        ) : isLast ? (
          <>
            <Check className="w-4 h-4" />
            See results
          </>
        ) : (
          <>
            Next
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-300 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}
