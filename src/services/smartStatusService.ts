import type { CareTaskWithLogs, TaskFrequency, TaskType } from '../types/careCalendar';
import { getCustomWeekdayIntervalDays } from '../utils/customTaskFrequency';

export type SmartStatusLevel = 'healthy' | 'watch' | 'needs-check' | 'urgent';

export interface SmartStatusResult {
  level: SmartStatusLevel;
  score: number;
  reasons: string[];
}

export interface SmartStatusInput {
  tasks: CareTaskWithLogs[];
  now?: Date;
  latestFeedingAt?: Date | null;
  latestWeightAt?: Date | null;
  latestPoopAt?: Date | string | null;
  streakDays?: number;
  tuning?: SmartStatusTuning;
}

export interface SmartStatusTuning {
  taskWeights?: Partial<Record<TaskType, number>>;
  freshnessDays?: number;
  urgentScoreThreshold?: number;
  needsCheckScoreThreshold?: number;
  watchScoreThreshold?: number;
  criticalMissPenaltyPerWeight?: number;
  nonCriticalMissPenaltyPerWeight?: number;
  criticalOverduePenaltyPerWeight?: number;
  nonCriticalOverduePenaltyPerWeight?: number;
  skipPenaltyPerWeight?: number;
  criticalSkipPenaltyPerWeight?: number;
}

type Reason = {
  message: string;
  priority: number;
};

const CRITICAL_TASK_TYPES = new Set(['feeding', 'water-change', 'health-check']);

const TASK_WEIGHTS: Record<TaskType, number> = {
  feeding: 1.6,
  'water-change': 1.45,
  'health-check': 1.35,
  supplement: 1.15,
  misting: 1.1,
  maintenance: 1.05,
  'gut-load': 1,
  'spot-clean': 0.95,
  'deep-clean': 0.95,
  custom: 1,
};

function getTaskWeight(taskType: TaskType): number {
  return TASK_WEIGHTS[taskType] ?? 1;
}

function getEffectiveTaskWeight(taskType: TaskType, tuning?: SmartStatusTuning): number {
  return tuning?.taskWeights?.[taskType] ?? getTaskWeight(taskType);
}

function getFrequencyIntervalDays(taskFrequency: TaskFrequency, customFrequencyDays?: number, customFrequencyWeekdays?: number[]): number {
  switch (taskFrequency) {
    case 'daily':
      return 1;
    case 'every-other-day':
      return 2;
    case 'twice-weekly':
      return 3;
    case 'weekly':
      return 7;
    case 'bi-weekly':
      return 14;
    case 'monthly':
      return 31;
    case 'custom':
      if (customFrequencyWeekdays && customFrequencyWeekdays.length > 0) {
        return getCustomWeekdayIntervalDays(customFrequencyWeekdays);
      }
      return customFrequencyDays && customFrequencyDays > 0 ? customFrequencyDays : 1;
    default:
      return 1;
  }
}

function daysSince(dateValue: Date | string, now: Date): number {
  return Math.floor((now.getTime() - new Date(dateValue).getTime()) / 86_400_000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeSmartStatus(input: SmartStatusInput): SmartStatusResult {
  const now = input.now ?? new Date();
  const tasks = input.tasks;
  const tuning = input.tuning;
  const reasons: Reason[] = [];
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 30);

  let score = 100;
  let completed30d = 0;
  let skipped30d = 0;
  let skippedWeighted = 0;
  let criticalSkippedWeighted = 0;
  let criticalSkippedTasks = 0;
  let missedWeighted = 0;
  let overdueWeighted = 0;
  let missedCriticalTasks = 0;
  let criticalOverdueWeighted = 0;
  let criticalMissedWeighted = 0;
  let criticalTaskCount = 0;

  const skippedByType: Record<string, number> = {};
  const missedByType: Record<string, number> = {};

  for (const task of tasks) {
    const recentLogs = task.logs.filter((log) => new Date(log.completedAt) >= windowStart);
    const completedCount = recentLogs.filter((log) => !log.skipped).length;
    const skippedCount = recentLogs.filter((log) => !!log.skipped).length;
    const weight = getEffectiveTaskWeight(task.type, tuning);

    completed30d += completedCount;
    skipped30d += skippedCount;
    skippedWeighted += skippedCount * weight;

    if (skippedCount > 0) {
      skippedByType[task.type] = (skippedByType[task.type] ?? 0) + skippedCount;
    }

    const isCritical = CRITICAL_TASK_TYPES.has(task.type);
    if (isCritical) criticalTaskCount += 1;
    if (isCritical && skippedCount > 0) {
      criticalSkippedWeighted += skippedCount * weight;
      criticalSkippedTasks += skippedCount;
    }
    const overdueDays = daysSince(task.nextDueAt, now);

    if (overdueDays > 0) {
      overdueWeighted += weight;
      if (isCritical) criticalOverdueWeighted += weight;

      const intervalDays = getFrequencyIntervalDays(task.frequency, task.customFrequencyDays, task.customFrequencyWeekdays);
      const missGraceDays = Math.max(1, Math.ceil(intervalDays * 0.5));
      if (overdueDays > missGraceDays) {
        missedWeighted += weight;
        missedByType[task.type] = (missedByType[task.type] ?? 0) + 1;
        if (isCritical) {
          missedCriticalTasks += 1;
          criticalMissedWeighted += weight;
        }
      }
    }
  }

  if (criticalMissedWeighted > 0) {
    const criticalMissPenaltyPerWeight = tuning?.criticalMissPenaltyPerWeight ?? 14;
    score -= Math.round(criticalMissedWeighted * criticalMissPenaltyPerWeight);
    reasons.push({ message: `${missedCriticalTasks > 1 ? `${missedCriticalTasks} important tasks haven't been done` : "An important task hasn't been done"}`, priority: 100 });
  }

  const nonCriticalMissedWeighted = Math.max(0, missedWeighted - criticalMissedWeighted);
  if (nonCriticalMissedWeighted > 0) {
    const nonCriticalMissPenaltyPerWeight = tuning?.nonCriticalMissPenaltyPerWeight ?? 8;
    score -= Math.round(nonCriticalMissedWeighted * nonCriticalMissPenaltyPerWeight);
    reasons.push({ message: 'Some routine tasks were missed this month', priority: 80 });
  }

  const criticalOverdueNotMissedWeighted = Math.max(0, criticalOverdueWeighted - criticalMissedWeighted);
  if (criticalOverdueNotMissedWeighted > 0) {
    const criticalOverduePenaltyPerWeight = tuning?.criticalOverduePenaltyPerWeight ?? 6;
    score -= Math.round(criticalOverdueNotMissedWeighted * criticalOverduePenaltyPerWeight);
    reasons.push({ message: 'Important tasks are overdue', priority: 70 });
  }

  const nonCriticalOverdueWeighted = Math.max(0, overdueWeighted - criticalOverdueWeighted);
  if (nonCriticalOverdueWeighted > 0) {
    const nonCriticalOverduePenaltyPerWeight = tuning?.nonCriticalOverduePenaltyPerWeight ?? 3;
    score -= Math.round(nonCriticalOverdueWeighted * nonCriticalOverduePenaltyPerWeight);
    reasons.push({ message: 'Some routine tasks are overdue', priority: 50 });
  }

  if (skipped30d > 0) {
    const skipPenaltyPerWeight = tuning?.skipPenaltyPerWeight ?? 1.8;
    const skipPenalty = Math.min(14, Math.round(skippedWeighted * skipPenaltyPerWeight));
    score -= skipPenalty;
  }

  if (criticalSkippedWeighted > 0) {
    const criticalSkipPenaltyPerWeight = tuning?.criticalSkipPenaltyPerWeight ?? 5;
    score -= Math.round(criticalSkippedWeighted * criticalSkipPenaltyPerWeight);
  }

  const nonCriticalSkippedTasks = Math.max(0, skipped30d - criticalSkippedTasks);
  if (criticalSkippedTasks > 0 && nonCriticalSkippedTasks > 0) {
    reasons.push({
      message: `${skipped30d} tasks were skipped recently, including ${criticalSkippedTasks} important ${criticalSkippedTasks === 1 ? 'task' : 'tasks'}`,
      priority: 88,
    });
  } else if (criticalSkippedTasks > 0) {
    reasons.push({
      message: criticalSkippedTasks > 1
        ? `${criticalSkippedTasks} important tasks were skipped recently`
        : 'An important task was skipped recently',
      priority: 88,
    });
  } else if (skipped30d > 0) {
    reasons.push({
      message: skipped30d > 1 ? `${skipped30d} tasks were skipped recently` : 'A task was skipped recently',
      priority: 55,
    });
  }

  const trackedEvents = completed30d + skipped30d + Math.ceil(missedWeighted);
  const completionRate = trackedEvents > 0 ? completed30d / trackedEvents : 1;
  if (completionRate < 0.6) {
    score -= 12;
    reasons.push({ message: 'Tasks have been missed a lot lately', priority: 65 });
  } else if (completionRate < 0.8) {
    score -= 6;
    reasons.push({ message: "Tasks are starting to be missed more often", priority: 45 });
  }

  const freshnessDays = tuning?.freshnessDays ?? 14;

  if (!input.latestFeedingAt) {
    score -= 15;
    reasons.push({ message: "No feeding has been logged yet", priority: 95 });
  } else {
    const feedingAge = daysSince(input.latestFeedingAt, now);
    if (feedingAge > freshnessDays) {
      score -= 15;
      reasons.push({ message: `No feeding logged in the last ${freshnessDays} days`, priority: 90 });
    }
  }

  if (!input.latestWeightAt) {
    score -= 12;
    reasons.push({ message: "No weight has been logged yet", priority: 85 });
  } else {
    const weightAge = daysSince(input.latestWeightAt, now);
    if (weightAge > freshnessDays) {
      score -= 12;
      reasons.push({ message: `No weight logged in the last ${freshnessDays} days`, priority: 78 });
    }
  }

  if (!input.latestPoopAt) {
    score -= 10;
    reasons.push({ message: "No poop has been logged yet", priority: 75 });
  } else {
    const poopAge = daysSince(input.latestPoopAt, now);
    if (poopAge > freshnessDays) {
      score -= 10;
      reasons.push({ message: `No poop logged in the last ${freshnessDays} days`, priority: 72 });
    }
  }

  if (input.streakDays && input.streakDays >= 3) {
    score += Math.min(8, Math.floor(input.streakDays / 3));
  }

  const topMissType = Object.entries(missedByType).sort((a, b) => b[1] - a[1])[0];
  if (topMissType && topMissType[1] >= 2) {
    reasons.push({ message: `${topMissType[0]} tasks keep getting missed`, priority: 60 });
  }

  const topSkipType = Object.entries(skippedByType).sort((a, b) => b[1] - a[1])[0];
  if (topSkipType && topSkipType[1] >= 3) {
    reasons.push({ message: `${topSkipType[0]} tasks keep getting skipped`, priority: 58 });
  }

  score = clamp(Math.round(score), 0, 100);

  const highRiskBehavior = criticalMissedWeighted >= 1.4 || criticalOverdueNotMissedWeighted >= 2.4;
  const criticalCareCoverage = criticalTaskCount > 0
    ? Math.max(0, 1 - criticalMissedWeighted / Math.max(1, criticalTaskCount))
    : 1;

  let level: SmartStatusLevel = 'healthy';
  const urgentScoreThreshold = tuning?.urgentScoreThreshold ?? 45;
  const needsCheckScoreThreshold = tuning?.needsCheckScoreThreshold ?? 70;
  const watchScoreThreshold = tuning?.watchScoreThreshold ?? 86;

  if (highRiskBehavior || score < urgentScoreThreshold || criticalCareCoverage < 0.5) {
    level = 'urgent';
  } else if (score < needsCheckScoreThreshold || criticalCareCoverage < 0.75) {
    level = 'needs-check';
  } else if (score < watchScoreThreshold) {
    level = 'watch';
  }

  const topReasons = reasons
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((r) => r.message);

  if (topReasons.length === 0) {
    topReasons.push('Everything looks good — keep it up!');
  }

  return {
    level,
    score,
    reasons: topReasons,
  };
}
