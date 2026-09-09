import { describe, it, expect } from 'vitest';
import { assessBrumation, getBrumationProfile } from './brumationSafety';
import type { WeightLog } from '../types/weightTracking';

const NOW = new Date('2026-09-09T12:00:00Z');

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 86_400_000);
}

function weight(grams: number, measuredDaysAgo: number): WeightLog {
  return {
    id: `w-${measuredDaysAgo}-${grams}`,
    userId: 'u1',
    enclosureAnimalId: 'a1',
    weightGrams: grams,
    measurementDate: daysAgo(measuredDaysAgo),
    createdAt: daysAgo(measuredDaysAgo),
    updatedAt: daysAgo(measuredDaysAgo),
  };
}

/** Started 30 days ago, baseline logged the day before that. */
function baseCase(logs: WeightLog[], speciesId = 'bearded-dragon') {
  return assessBrumation({
    speciesId,
    animalName: 'Spike',
    startDate: daysAgo(30),
    weightLogs: logs,
    now: NOW,
  });
}

describe('getBrumationProfile', () => {
  it('returns species-specific windows for known brumators', () => {
    expect(getBrumationProfile('bearded-dragon').brumates).toBe(true);
    expect(getBrumationProfile('corn-snake').typicalWeeksMax).toBe(12);
  });

  it('falls back to a conservative non-brumating default for unknown species', () => {
    expect(getBrumationProfile('crested-gecko').brumates).toBe(false);
    expect(getBrumationProfile(null).brumates).toBe(false);
    expect(getBrumationProfile(undefined).brumates).toBe(false);
  });
});

describe('assessBrumation — weight loss', () => {
  it('stays ok for normal loss with recent weigh-ins', () => {
    // 500g -> 480g = 4% loss
    const result = baseCase([weight(500, 31), weight(480, 3)]);
    expect(result.weightLossPercent).toBe(4);
    expect(result.level).toBe('ok');
    expect(result.alerts).toHaveLength(0);
  });

  it('flags watch at 7% loss', () => {
    const result = baseCase([weight(500, 31), weight(462, 3)]); // 7.6%
    expect(result.level).toBe('watch');
    expect(result.alerts.some((a) => a.id === 'brumation-weight-watch')).toBe(true);
  });

  it('flags concern at 10% loss', () => {
    const result = baseCase([weight(500, 31), weight(445, 3)]); // 11%
    expect(result.level).toBe('concern');
    expect(result.alerts.some((a) => a.id === 'brumation-weight-concern')).toBe(true);
  });

  it('escalates to urgent past 15% loss', () => {
    const result = baseCase([weight(500, 31), weight(420, 3)]); // 16%
    expect(result.level).toBe('urgent');
    const alert = result.alerts.find((a) => a.id === 'brumation-weight-critical');
    expect(alert?.severity).toBe('urgent');
    expect(alert?.body).toContain('vet');
  });

  it('reports weight gain as a negative loss without alerting', () => {
    const result = baseCase([weight(500, 31), weight(510, 3)]);
    expect(result.weightLossPercent).toBe(-2);
    expect(result.level).toBe('ok');
  });
});

describe('assessBrumation — baseline handling', () => {
  it('uses the last weight recorded before brumation started', () => {
    const result = baseCase([
      weight(600, 90), // older, should be ignored
      weight(500, 31), // the true baseline
      weight(480, 3),
    ]);
    expect(result.baselineWeightGrams).toBe(500);
  });

  it('warns and reports null when there is no pre-brumation weight', () => {
    const result = baseCase([weight(480, 3)]);
    expect(result.baselineWeightGrams).toBeNull();
    expect(result.weightLossPercent).toBeNull();
    expect(result.alerts.some((a) => a.id === 'brumation-no-baseline')).toBe(true);
  });

  it('does not compute a percentage from a pre-brumation weight alone', () => {
    // A baseline with no follow-up weigh-in must not read as 0% loss —
    // that would look reassuring while nothing is actually being measured.
    const result = baseCase([weight(500, 31)]);
    expect(result.weightLossPercent).toBeNull();
    expect(result.alerts.some((a) => a.id === 'brumation-no-weigh-in')).toBe(true);
  });
});

describe('assessBrumation — weigh-in cadence', () => {
  it('nudges when weigh-ins go stale', () => {
    const result = baseCase([weight(500, 31), weight(490, 25)]);
    expect(result.daysSinceLastWeighIn).toBe(25);
    expect(result.alerts.some((a) => a.id === 'brumation-weigh-in-stale')).toBe(true);
  });

  it('stays quiet when weighed within the interval', () => {
    const result = baseCase([weight(500, 31), weight(490, 10)]);
    expect(result.alerts.some((a) => a.id === 'brumation-weigh-in-stale')).toBe(false);
  });
});

describe('assessBrumation — duration', () => {
  const healthy = [weight(500, 200), weight(490, 2)];

  it('is quiet inside the typical window', () => {
    const result = assessBrumation({
      speciesId: 'bearded-dragon',
      startDate: daysAgo(60),
      weightLogs: healthy,
      now: NOW,
    });
    expect(result.alerts.some((a) => a.id.startsWith('brumation-duration'))).toBe(false);
  });

  it('warns once past the typical maximum', () => {
    const result = assessBrumation({
      speciesId: 'bearded-dragon', // typical max 12 weeks
      startDate: daysAgo(92),
      weightLogs: healthy,
      now: NOW,
    });
    expect(result.level).toBe('concern');
    expect(result.alerts.some((a) => a.id === 'brumation-duration-long')).toBe(true);
  });

  it('escalates past the outer safe limit regardless of healthy weight', () => {
    const result = assessBrumation({
      speciesId: 'bearded-dragon', // max safe 16 weeks
      startDate: daysAgo(130),
      weightLogs: healthy,
      now: NOW,
    });
    expect(result.level).toBe('urgent');
    expect(result.alerts.some((a) => a.id === 'brumation-duration-critical')).toBe(true);
  });

  it('applies shorter windows to species that brumate briefly', () => {
    // 60 days is fine for a bearded dragon but past a leopard gecko's 8 weeks.
    const gecko = assessBrumation({
      speciesId: 'leopard-gecko',
      startDate: daysAgo(60),
      weightLogs: healthy,
      now: NOW,
    });
    expect(gecko.alerts.some((a) => a.id === 'brumation-duration-long')).toBe(true);
  });
});

describe('assessBrumation — species suitability', () => {
  it('flags brumation logged for a species that does not brumate', () => {
    const result = assessBrumation({
      speciesId: 'crested-gecko',
      startDate: daysAgo(20),
      weightLogs: [weight(50, 25), weight(49, 2)],
      now: NOW,
    });
    expect(result.alerts.some((a) => a.id === 'brumation-atypical-species')).toBe(true);
  });
});

describe('assessBrumation — elapsed time', () => {
  it('reports days and whole weeks elapsed', () => {
    const result = baseCase([weight(500, 31), weight(495, 2)]);
    expect(result.daysElapsed).toBe(30);
    expect(result.weeksElapsed).toBe(4);
  });

  it('never reports negative elapsed time for a future start date', () => {
    const result = assessBrumation({
      speciesId: 'bearded-dragon',
      startDate: new Date(NOW.getTime() + 86_400_000),
      weightLogs: [],
      now: NOW,
    });
    expect(result.daysElapsed).toBe(0);
  });
});
