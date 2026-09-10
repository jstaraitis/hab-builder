import { describe, it, expect } from 'vitest';
import { assessColony, FEEDER_SPECIES, type ColonyEvent, type ColonyInput } from './feederColony';

const NOW = new Date(2026, 8, 10);

function monthsAgo(months: number): Date {
  return new Date(NOW.getTime() - months * 30.44 * 86_400_000);
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function assess(overrides: Partial<ColonyInput> = {}) {
  return assessColony({
    species: 'dubia',
    startedOn: monthsAgo(12),
    events: [],
    generatedAt: NOW,
    ...overrides,
  });
}

function ids(overrides: Partial<ColonyInput> = {}): string[] {
  return assess(overrides).findings.map((f) => f.id);
}

/** Weekly harvests spread across `weeks`, `count` each time. */
function harvests(weeks: number, count: number): ColonyEvent[] {
  return Array.from({ length: weeks }, (_, i) => ({
    date: daysAgo(i * 7),
    countChange: -count,
    kind: 'harvest' as const,
  }));
}

describe('assessColony — establishment', () => {
  it('reports a young colony as establishing, not failing', () => {
    const result = assess({ startedOn: monthsAgo(1) });
    expect(result.verdict).toBe('establishing');
    expect(result.findings[0].severity).toBe('note');
  });

  it('treats harvesting during establishment as critical', () => {
    // The central failure mode: anything pulled now is breeding stock, because
    // nothing born since the colony started is feeder-sized yet.
    const result = assess({ startedOn: monthsAgo(2), events: harvests(4, 20) });
    const finding = result.findings[0];
    expect(finding.id).toBe('harvesting-too-early');
    expect(finding.severity).toBe('critical');
    expect(finding.detail).toContain('breeding stock');
  });

  it('uses a species-specific establishment window', () => {
    // Crickets establish in 2 months; dubia take 4.
    expect(assess({ species: 'crickets', startedOn: monthsAgo(3) }).verdict).not.toBe('establishing');
    expect(assess({ species: 'dubia', startedOn: monthsAgo(3) }).verdict).toBe('establishing');
  });

  it('tells the keeper how much longer to wait, on both branches', () => {
    // Waiting patiently: the countdown is in the title.
    const patient = assess({ startedOn: monthsAgo(1) }).findings[0];
    expect(patient.title).toMatch(/\d+ month/);

    // Already harvesting: the countdown is in the fix, where the action is.
    const harvesting = assess({ startedOn: monthsAgo(1), events: harvests(4, 20) }).findings[0];
    expect(harvesting.fix).toMatch(/\d+ more month/);
  });
});

describe('assessColony — breeding ratio', () => {
  it('treats a colony with no males as critical', () => {
    const result = assess({ breedingFemales: 100, breedingMales: 0 });
    const finding = result.findings.find((f) => f.id === 'no-males');
    expect(finding?.severity).toBe('critical');
  });

  it('warns when males are far too few', () => {
    // Dubia want ~1:3. 100 females to 5 males is 20:1.
    expect(ids({ breedingFemales: 100, breedingMales: 5 })).toContain('too-few-males');
  });

  it('accepts a healthy ratio', () => {
    expect(ids({ breedingFemales: 100, breedingMales: 30 })).not.toContain('too-few-males');
  });

  it('notes an excess of males as wasted resources, not a failure', () => {
    const finding = assess({ breedingFemales: 20, breedingMales: 40 }).findings.find(
      (f) => f.id === 'too-many-males'
    );
    expect(finding?.severity).toBe('note');
  });

  it('skips the ratio rule when the keeper has not counted', () => {
    expect(ids({ breedingFemales: 100 })).not.toContain('too-few-males');
  });
});

describe('assessColony — sustainability', () => {
  it('flags harvesting faster than the colony can replace', () => {
    // 20 females × 20/month × 1.4 ÷ 4.35 ≈ 129/week at the top of the band.
    const result = assess({ breedingFemales: 20, events: harvests(8, 400) });
    expect(result.verdict).toBe('over-harvesting');
    expect(result.findings[0].id).toBe('over-harvesting');
    expect(result.findings[0].detail).toContain('compounds');
  });

  it('reports a matched harvest rate as sustainable', () => {
    // 50 females support roughly 138-322/week; 57/week sits comfortably inside.
    const result = assess({ breedingFemales: 50, events: harvests(8, 50) });
    expect(result.verdict).toBe('sustainable');
    expect(result.findings).toHaveLength(0);
  });

  it('notes a colony far larger than the feeding need', () => {
    const result = assess({ breedingFemales: 500, events: harvests(8, 5) });
    expect(result.verdict).toBe('under-used');
    expect(result.findings[0].id).toBe('under-used');
  });

  it('reports the sustainable rate as a band, never a single number', () => {
    // Home output swings roughly twofold; one figure would overstate certainty.
    const result = assess({ breedingFemales: 100 });
    const band = result.sustainablePerWeek;
    expect(band).not.toBeNull();
    expect(band?.high).toBeGreaterThan(band?.low ?? 0);
  });

  it('cannot judge sustainability without a breeding estimate', () => {
    const result = assess({ events: harvests(8, 50) });
    expect(result.sustainablePerWeek).toBeNull();
    expect(result.verdict).toBe('unknown');
  });
});

describe('assessColony — harvest rate', () => {
  it('measures from the first harvest, not the colony start', () => {
    // A colony left a year to establish then harvested for a month must not
    // read as barely used.
    const result = assess({
      startedOn: monthsAgo(12),
      breedingFemales: 100,
      events: harvests(5, 50),
    });
    // 5 harvests of 50 land on days 0, 7, 14, 21 and 28 — that is 250 feeders
    // across a 28-day window, so 62.5/week. Measuring from the colony start
    // instead would have reported about 4/week.
    expect(result.harvestPerWeek).toBeCloseTo(62.5, 1);
  });

  it('declines to average a rate from too short a window', () => {
    const result = assess({ breedingFemales: 100, events: [{ date: daysAgo(2), countChange: -50, kind: 'harvest' }] });
    expect(result.harvestPerWeek).toBeNull();
  });

  it('counts only harvests, not purchases or losses', () => {
    const result = assess({
      breedingFemales: 100,
      events: [
        ...harvests(6, 10),
        { date: daysAgo(10), countChange: 500, kind: 'purchase' },
        { date: daysAgo(5), countChange: -200, kind: 'loss' },
      ],
    });
    expect(result.totalHarvested).toBe(60);
  });
});

describe('assessColony — cost', () => {
  it('computes cost per feeder from setup plus purchases', () => {
    const result = assess({
      breedingFemales: 100,
      setupCost: 60,
      events: [
        ...harvests(8, 50),
        { date: monthsAgo(11), countChange: 200, kind: 'purchase', cost: 40 },
      ],
    });
    // £100 across 400 harvested feeders.
    expect(result.totalSpent).toBe(100);
    expect(result.totalHarvested).toBe(400);
    expect(result.costPerFeeder).toBeCloseTo(0.25, 2);
  });

  it('returns no cost per feeder before anything has been harvested', () => {
    expect(assess({ setupCost: 60 }).costPerFeeder).toBeNull();
  });

  it('returns no cost per feeder when nothing was spent', () => {
    expect(assess({ events: harvests(8, 50) }).costPerFeeder).toBeNull();
  });
});

describe('assessColony — species profiles and honesty', () => {
  it('gives every species a maturation time and an establishment window', () => {
    for (const profile of Object.values(FEEDER_SPECIES)) {
      expect(profile.maturationMonths).toBeGreaterThan(0);
      expect(profile.establishMonths).toBeGreaterThan(0);
      expect(profile.note.length).toBeGreaterThan(10);
    }
  });

  it('rates crickets as far more prolific than superworms', () => {
    expect(FEEDER_SPECIES.crickets.offspringPerFemalePerMonth).toBeGreaterThan(
      FEEDER_SPECIES.superworms.offspringPerFemalePerMonth
    );
  });

  it('flags a bare record as insufficient rather than guessing a verdict', () => {
    const result = assess();
    expect(result.insufficientData).toBe(true);
  });

  it('is not insufficient once either input is present', () => {
    expect(assess({ breedingFemales: 50 }).insufficientData).toBe(false);
    expect(assess({ events: harvests(8, 20) }).insufficientData).toBe(false);
  });

  it('gives every finding an actionable fix', () => {
    const result = assess({ startedOn: monthsAgo(1), breedingFemales: 50, breedingMales: 0, events: harvests(4, 30) });
    expect(result.findings.length).toBeGreaterThan(0);
    for (const finding of result.findings) {
      expect(finding.fix.length).toBeGreaterThan(10);
    }
  });

  it('orders findings most severe first', () => {
    const result = assess({ breedingFemales: 20, breedingMales: 40, events: harvests(8, 400) });
    expect(result.findings[0].severity).toBe('critical');
    expect(result.findings[result.findings.length - 1].severity).toBe('note');
  });
});
