import { describe, it, expect } from 'vitest';
import {
  getUvbLifecycleStatus,
  calculateReplaceDueOn,
  resolveBulbSpec,
  isReplacementDue,
} from './uvbLifecycle';

const NOW = new Date('2026-09-09T12:00:00Z');

/** Date N days before NOW. */
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 86_400_000);
}

describe('resolveBulbSpec', () => {
  it('falls back to the shortest lifespan when type is unknown or missing', () => {
    expect(resolveBulbSpec(null).lifespanMonths).toBe(6);
    expect(resolveBulbSpec(undefined).lifespanMonths).toBe(6);
    expect(resolveBulbSpec('unknown').lifespanMonths).toBe(6);
  });

  it('distinguishes T5 HO from T8 — the whole point of the feature', () => {
    expect(resolveBulbSpec('t5-ho').lifespanMonths).toBe(12);
    expect(resolveBulbSpec('t8').lifespanMonths).toBe(6);
  });
});

describe('calculateReplaceDueOn', () => {
  it('adds the bulb-specific lifespan to the install date', () => {
    const installed = new Date('2026-01-15T00:00:00Z');
    expect(calculateReplaceDueOn(installed, 't5-ho').getUTCFullYear()).toBe(2027);
    expect(calculateReplaceDueOn(installed, 'compact').getUTCMonth()).toBe(6); // July
  });
});

describe('getUvbLifecycleStatus', () => {
  it('returns null with no bulb on record', () => {
    expect(getUvbLifecycleStatus(null, 't5-ho', NOW)).toBeNull();
    expect(getUvbLifecycleStatus(undefined, 't5-ho', NOW)).toBeNull();
  });

  it('returns null for an unparseable date rather than NaN-filled output', () => {
    expect(getUvbLifecycleStatus('not-a-date', 't5-ho', NOW)).toBeNull();
  });

  it('accepts an ISO string as well as a Date', () => {
    const status = getUvbLifecycleStatus(daysAgo(30).toISOString(), 't5-ho', NOW);
    expect(status?.state).toBe('fresh');
  });

  it('treats a 7-month compact bulb as overdue but a 7-month T5 HO as fine', () => {
    const sevenMonths = daysAgo(213);

    expect(getUvbLifecycleStatus(sevenMonths, 'compact', NOW)?.state).toBe('overdue');
    expect(getUvbLifecycleStatus(sevenMonths, 't5-ho', NOW)?.state).toBe('good');
  });

  it('escalates through the lifecycle states as the bulb ages', () => {
    // 6-month (≈182 day) compact bulb
    expect(getUvbLifecycleStatus(daysAgo(10), 'compact', NOW)?.state).toBe('fresh');
    expect(getUvbLifecycleStatus(daysAgo(100), 'compact', NOW)?.state).toBe('good');
    expect(getUvbLifecycleStatus(daysAgo(160), 'compact', NOW)?.state).toBe('due-soon');
    expect(getUvbLifecycleStatus(daysAgo(200), 'compact', NOW)?.state).toBe('overdue');
    expect(getUvbLifecycleStatus(daysAgo(300), 'compact', NOW)?.state).toBe('critical');
  });

  it('reports negative days remaining once overdue', () => {
    const status = getUvbLifecycleStatus(daysAgo(200), 'compact', NOW);
    expect(status?.daysRemaining).toBeLessThan(0);
  });

  it('clamps percentElapsed to 100 so progress bars never overflow', () => {
    const status = getUvbLifecycleStatus(daysAgo(400), 'compact', NOW);
    expect(status?.percentElapsed).toBe(100);
  });

  it('never reports negative days installed for a future install date', () => {
    const status = getUvbLifecycleStatus(new Date(NOW.getTime() + 86_400_000), 'compact', NOW);
    expect(status?.daysInstalled).toBe(0);
    expect(status?.percentElapsed).toBe(0);
  });
});

describe('isReplacementDue', () => {
  it('is false while the bulb still has meaningful life', () => {
    expect(isReplacementDue(getUvbLifecycleStatus(daysAgo(10), 'compact', NOW))).toBe(false);
    expect(isReplacementDue(getUvbLifecycleStatus(daysAgo(100), 'compact', NOW))).toBe(false);
  });

  it('is true from due-soon onward', () => {
    expect(isReplacementDue(getUvbLifecycleStatus(daysAgo(160), 'compact', NOW))).toBe(true);
    expect(isReplacementDue(getUvbLifecycleStatus(daysAgo(300), 'compact', NOW))).toBe(true);
  });

  it('is false with no bulb on record', () => {
    expect(isReplacementDue(null)).toBe(false);
  });
});
