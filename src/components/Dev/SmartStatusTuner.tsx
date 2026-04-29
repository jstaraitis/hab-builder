import { useMemo, useState } from 'react';
import type { CareLog, CareTaskWithLogs, TaskFrequency, TaskType } from '../../types/careCalendar';
import { computeSmartStatus, type SmartStatusTuning } from '../../services/smartStatusService';

type ScenarioKey = 'balanced' | 'slipping' | 'critical';

interface ScenarioData {
  key: ScenarioKey;
  label: string;
  description: string;
  tasks: CareTaskWithLogs[];
  latestFeedingAt: Date | null;
  latestWeightAt: Date | null;
  latestPoopAt: Date | null;
  streakDays: number;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function createTask(options: {
  id: string;
  title: string;
  type: TaskType;
  frequency?: TaskFrequency;
  nextDueDaysAgo?: number;
  skippedLogsIn30d?: number;
  completedLogsIn30d?: number;
}): CareTaskWithLogs {
  const completedLogs: CareLog[] = Array.from({ length: options.completedLogsIn30d ?? 0 }).map((_, idx) => ({
    id: `${options.id}-c-${idx}`,
    taskId: options.id,
    completedAt: daysAgo(idx + 1),
    skipped: false,
  }));

  const skippedLogs: CareLog[] = Array.from({ length: options.skippedLogsIn30d ?? 0 }).map((_, idx) => ({
    id: `${options.id}-s-${idx}`,
    taskId: options.id,
    completedAt: daysAgo(idx + 2),
    skipped: true,
    skipReason: 'Sample skip',
  }));

  const logs = [...completedLogs, ...skippedLogs];

  return {
    id: options.id,
    animalId: 'whites-tree-frog',
    title: options.title,
    type: options.type,
    frequency: options.frequency ?? 'daily',
    nextDueAt: daysAgo(options.nextDueDaysAgo ?? -1),
    isActive: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
    logs,
    lastCompleted: completedLogs[0]?.completedAt,
    streak: completedLogs.length,
  };
}

function buildScenarios(): ScenarioData[] {
  return [
    {
      key: 'balanced',
      label: 'Balanced Care',
      description: 'Mostly on-time task completion with fresh core logs.',
      tasks: [
        createTask({ id: 'feed-1', title: 'Feed', type: 'feeding', completedLogsIn30d: 18, skippedLogsIn30d: 1, nextDueDaysAgo: 0 }),
        createTask({ id: 'water-1', title: 'Water Change', type: 'water-change', frequency: 'weekly', completedLogsIn30d: 4, nextDueDaysAgo: 0 }),
        createTask({ id: 'clean-1', title: 'Spot Clean', type: 'spot-clean', completedLogsIn30d: 14, nextDueDaysAgo: 0 }),
        createTask({ id: 'health-1', title: 'Health Check', type: 'health-check', frequency: 'weekly', completedLogsIn30d: 3, nextDueDaysAgo: 1 }),
      ],
      latestFeedingAt: daysAgo(2),
      latestWeightAt: daysAgo(6),
      latestPoopAt: daysAgo(3),
      streakDays: 9,
    },
    {
      key: 'slipping',
      label: 'Slipping Consistency',
      description: 'Some skips and overdues, but no severe critical misses.',
      tasks: [
        createTask({ id: 'feed-2', title: 'Feed', type: 'feeding', completedLogsIn30d: 10, skippedLogsIn30d: 3, nextDueDaysAgo: 1 }),
        createTask({ id: 'water-2', title: 'Water Change', type: 'water-change', frequency: 'weekly', completedLogsIn30d: 2, skippedLogsIn30d: 1, nextDueDaysAgo: 3 }),
        createTask({ id: 'clean-2', title: 'Spot Clean', type: 'spot-clean', completedLogsIn30d: 8, skippedLogsIn30d: 2, nextDueDaysAgo: 2 }),
      ],
      latestFeedingAt: daysAgo(9),
      latestWeightAt: daysAgo(13),
      latestPoopAt: daysAgo(11),
      streakDays: 2,
    },
    {
      key: 'critical',
      label: 'Critical Risk',
      description: 'Critical task misses and stale logs driving urgent risk.',
      tasks: [
        createTask({ id: 'feed-3', title: 'Feed', type: 'feeding', completedLogsIn30d: 4, skippedLogsIn30d: 4, nextDueDaysAgo: 4 }),
        createTask({ id: 'water-3', title: 'Water Change', type: 'water-change', frequency: 'weekly', completedLogsIn30d: 1, skippedLogsIn30d: 2, nextDueDaysAgo: 11 }),
        createTask({ id: 'health-3', title: 'Health Check', type: 'health-check', frequency: 'weekly', completedLogsIn30d: 1, nextDueDaysAgo: 9 }),
      ],
      latestFeedingAt: daysAgo(19),
      latestWeightAt: daysAgo(26),
      latestPoopAt: daysAgo(21),
      streakDays: 0,
    },
  ];
}

function sliderRow(label: string, value: number, onChange: (value: number) => void, min: number, max: number, step = 1) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="text-white font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </label>
  );
}

export default function SmartStatusTuner() {
  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-3xl bg-card border border-divider rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Smart Status Tuner</h1>
        <p className="text-sm text-muted mt-2">This page is only available in development builds.</p>
      </div>
    );
  }

  const scenarios = useMemo(() => buildScenarios(), []);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('balanced');
  const [freshnessDays, setFreshnessDays] = useState(14);
  const [urgentThreshold, setUrgentThreshold] = useState(45);
  const [needsCheckThreshold, setNeedsCheckThreshold] = useState(70);
  const [watchThreshold, setWatchThreshold] = useState(86);
  const [feedingWeight, setFeedingWeight] = useState(1.6);
  const [waterChangeWeight, setWaterChangeWeight] = useState(1.45);
  const [healthCheckWeight, setHealthCheckWeight] = useState(1.35);

  const selectedScenario = scenarios.find((s) => s.key === scenarioKey) ?? scenarios[0];

  const tuning: SmartStatusTuning = {
    freshnessDays,
    urgentScoreThreshold: urgentThreshold,
    needsCheckScoreThreshold: needsCheckThreshold,
    watchScoreThreshold: watchThreshold,
    taskWeights: {
      feeding: feedingWeight,
      'water-change': waterChangeWeight,
      'health-check': healthCheckWeight,
    },
  };

  const result = computeSmartStatus({
    tasks: selectedScenario.tasks,
    latestFeedingAt: selectedScenario.latestFeedingAt,
    latestWeightAt: selectedScenario.latestWeightAt,
    latestPoopAt: selectedScenario.latestPoopAt,
    streakDays: selectedScenario.streakDays,
    tuning,
  });

  const statusStyles: Record<string, string> = {
    healthy: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    watch: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    'needs-check': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    urgent: 'bg-red-500/20 text-red-300 border-red-400/40',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="bg-card border border-divider rounded-2xl p-5">
        <h1 className="text-xl font-bold text-white">Smart Status Tuner (Dev)</h1>
        <p className="text-sm text-muted mt-1">Adjust thresholds and critical weights, then test against sample animal care histories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-card border border-divider rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.key}
                onClick={() => setScenarioKey(scenario.key)}
                className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                  scenario.key === selectedScenario.key
                    ? 'border-emerald-400/60 bg-emerald-500/10'
                    : 'border-divider bg-card-elevated hover:border-emerald-500/40'
                }`}
              >
                <div className="text-sm font-semibold text-white">{scenario.label}</div>
                <div className="text-[11px] text-muted mt-1">{scenario.description}</div>
              </button>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-white pt-2">Thresholds</h2>
          {sliderRow('Freshness days', freshnessDays, setFreshnessDays, 7, 30)}
          {sliderRow('Urgent score threshold', urgentThreshold, setUrgentThreshold, 20, 65)}
          {sliderRow('Needs-check score threshold', needsCheckThreshold, setNeedsCheckThreshold, 45, 90)}
          {sliderRow('Watch score threshold', watchThreshold, setWatchThreshold, 60, 95)}

          <h2 className="text-sm font-semibold text-white pt-2">Critical task weights</h2>
          {sliderRow('Feeding weight', feedingWeight, setFeedingWeight, 0.8, 2.5, 0.05)}
          {sliderRow('Water-change weight', waterChangeWeight, setWaterChangeWeight, 0.8, 2.5, 0.05)}
          {sliderRow('Health-check weight', healthCheckWeight, setHealthCheckWeight, 0.8, 2.5, 0.05)}
        </section>

        <section className="bg-card border border-divider rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Result</h2>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusStyles[result.level]}`}>
            <span>{result.level}</span>
            <span>Score {result.score}</span>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted mb-2">Top reasons</h3>
            <ul className="space-y-1.5">
              {result.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-white bg-card-elevated border border-divider rounded-lg px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-muted border-t border-divider pt-3">
            Scenario task count: {selectedScenario.tasks.length} • Feeding log age: {selectedScenario.latestFeedingAt ? Math.floor((Date.now() - selectedScenario.latestFeedingAt.getTime()) / 86400000) : 'N/A'}d
          </div>
        </section>
      </div>
    </div>
  );
}
