import { describe, expect, it } from 'vitest';
import type { CareLog, CareTaskWithLogs, TaskFrequency, TaskType } from '../types/careCalendar';
import { computeSmartStatus } from './smartStatusService';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function makeTask(options: {
  id: string;
  type: TaskType;
  frequency?: TaskFrequency;
  dueDaysAgo: number;
  completedLogsIn30d?: number;
  skippedLogsIn30d?: number;
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
    completedAt: daysAgo(idx + 1),
    skipped: true,
    skipReason: 'skip',
  }));

  return {
    id: options.id,
    animalId: 'whites-tree-frog',
    title: options.id,
    type: options.type,
    frequency: options.frequency ?? 'daily',
    nextDueAt: daysAgo(options.dueDaysAgo),
    isActive: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
    logs: [...completedLogs, ...skippedLogs],
    lastCompleted: completedLogs[0]?.completedAt,
    streak: completedLogs.length,
  };
}

describe('computeSmartStatus', () => {
  it('returns healthy for strong care history', () => {
    const result = computeSmartStatus({
      tasks: [
        makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 0, completedLogsIn30d: 15 }),
        makeTask({ id: 'water', type: 'water-change', frequency: 'weekly', dueDaysAgo: 0, completedLogsIn30d: 4 }),
        makeTask({ id: 'clean', type: 'spot-clean', dueDaysAgo: 0, completedLogsIn30d: 14 }),
      ],
      latestFeedingAt: daysAgo(1),
      latestWeightAt: daysAgo(4),
      latestPoopAt: daysAgo(2),
      streakDays: 10,
    });

    expect(result.level).toBe('healthy');
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it('flags urgent when critical task is clearly missed', () => {
    const result = computeSmartStatus({
      tasks: [
        makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 4, completedLogsIn30d: 2, skippedLogsIn30d: 2 }),
      ],
      latestFeedingAt: daysAgo(16),
      latestWeightAt: daysAgo(4),
      latestPoopAt: daysAgo(3),
      streakDays: 0,
    });

    expect(result.level).toBe('urgent');
    expect(result.reasons.some((r) => r.toLowerCase().includes('critical'))).toBe(true);
  });

  it('penalizes missed feeding more than missed spot-clean', () => {
    const feedingMiss = computeSmartStatus({
      tasks: [makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 4 })],
      latestFeedingAt: daysAgo(1),
      latestWeightAt: daysAgo(1),
      latestPoopAt: daysAgo(1),
      streakDays: 0,
    });

    const cleanMiss = computeSmartStatus({
      tasks: [makeTask({ id: 'clean', type: 'spot-clean', dueDaysAgo: 4 })],
      latestFeedingAt: daysAgo(1),
      latestWeightAt: daysAgo(1),
      latestPoopAt: daysAgo(1),
      streakDays: 0,
    });

    expect(feedingMiss.score).toBeLessThan(cleanMiss.score);
  });

  it('moves to watch when critical tasks are skipped', () => {
    const result = computeSmartStatus({
      tasks: [
        makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 0, completedLogsIn30d: 6, skippedLogsIn30d: 1 }),
        makeTask({ id: 'water', type: 'water-change', frequency: 'weekly', dueDaysAgo: 0, completedLogsIn30d: 3, skippedLogsIn30d: 1 }),
        makeTask({ id: 'clean', type: 'spot-clean', dueDaysAgo: 0, completedLogsIn30d: 6 }),
      ],
      latestFeedingAt: daysAgo(1),
      latestWeightAt: daysAgo(2),
      latestPoopAt: daysAgo(2),
      streakDays: 6,
    });

    expect(result.level).toBe('watch');
    expect(result.reasons.some((r) => r.toLowerCase().includes('important tasks were skipped'))).toBe(true);
  });

  it('responds to tuning threshold overrides', () => {
    const baseInput = {
      tasks: [
        makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 1, completedLogsIn30d: 9, skippedLogsIn30d: 2 }),
        makeTask({ id: 'water', type: 'water-change', frequency: 'weekly', dueDaysAgo: 2, completedLogsIn30d: 2 }),
      ],
      latestFeedingAt: daysAgo(8),
      latestWeightAt: daysAgo(9),
      latestPoopAt: daysAgo(8),
      streakDays: 1,
    };

    const defaultResult = computeSmartStatus(baseInput);
    const stricterResult = computeSmartStatus({
      ...baseInput,
      tuning: {
        needsCheckScoreThreshold: 85,
        watchScoreThreshold: 92,
        taskWeights: {
          feeding: 2.2,
        },
      },
    });

    expect(stricterResult.score).toBeLessThanOrEqual(defaultResult.score);
    expect(['needs-check', 'urgent']).toContain(stricterResult.level);
  });

  it('applies freshness days tuning override', () => {
    const normal = computeSmartStatus({
      tasks: [makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 0, completedLogsIn30d: 10 })],
      latestFeedingAt: daysAgo(10),
      latestWeightAt: daysAgo(10),
      latestPoopAt: daysAgo(10),
    });

    const strictFreshness = computeSmartStatus({
      tasks: [makeTask({ id: 'feed', type: 'feeding', dueDaysAgo: 0, completedLogsIn30d: 10 })],
      latestFeedingAt: daysAgo(10),
      latestWeightAt: daysAgo(10),
      latestPoopAt: daysAgo(10),
      tuning: {
        freshnessDays: 7,
      },
    });

    expect(strictFreshness.score).toBeLessThan(normal.score);
  });
});
