import { describe, it, expect } from 'vitest';
import { buildHealthReport, type HealthReportInput } from './healthReport';

const NOW = new Date('2026-06-01T12:00:00Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function base(overrides: Partial<HealthReportInput> = {}): HealthReportInput {
  return {
    animal: { name: 'Kermit', speciesName: "White's Tree Frog" },
    generatedAt: NOW,
    ...overrides,
  };
}

function concernIds(input: HealthReportInput): string[] {
  return buildHealthReport(input).concerns.map((concern) => concern.id);
}

describe('buildHealthReport — identification', () => {
  it('prefers the animal name as the label', () => {
    const report = buildHealthReport(base());
    expect(report.animalLabel).toBe('Kermit');
  });

  it('falls back to the animal number, then the species', () => {
    expect(buildHealthReport(base({ animal: { animalNumber: 3 } })).animalLabel).toBe('Animal #3');
    expect(buildHealthReport(base({ animal: { speciesName: 'Crested Gecko' } })).animalLabel).toBe(
      'Crested Gecko'
    );
    expect(buildHealthReport(base({ animal: {} })).animalLabel).toBe('Unnamed animal');
  });

  it('describes age from the birthday, falling back to acquisition date', () => {
    expect(buildHealthReport(base({ animal: { birthday: daysAgo(30) } })).ageDescription).toBe(
      '30 days old'
    );
    expect(buildHealthReport(base({ animal: { birthday: daysAgo(400) } })).ageDescription).toBe(
      '13 months old'
    );
    expect(buildHealthReport(base({ animal: { acquisitionDate: daysAgo(1000) } })).ageDescription).toContain(
      '2y'
    );
  });

  it('returns no age rather than a negative one when the date is in the future', () => {
    const future = new Date(NOW.getTime() + 86400000);
    expect(buildHealthReport(base({ animal: { birthday: future } })).ageDescription).toBeNull();
  });
});

describe('buildHealthReport — weight', () => {
  it('is null when nothing has ever been weighed', () => {
    expect(buildHealthReport(base()).weight).toBeNull();
  });

  it('measures loss against the 90-day peak, not the oldest reading', () => {
    // Starts at 100, climbs to 120, falls back to 100. First-to-last is flat,
    // but the animal has lost a sixth of its body weight from peak.
    const report = buildHealthReport(
      base({
        weights: [
          { date: daysAgo(80), grams: 100 },
          { date: daysAgo(40), grams: 120 },
          { date: daysAgo(2), grams: 100 },
        ],
      })
    );

    expect(report.weight?.peak90dGrams).toBe(120);
    expect(report.weight?.change90dPercent).toBeCloseTo(-16.7, 1);
    expect(report.weight?.trend).toBe('losing');
    expect(concernIds(base({
      weights: [
        { date: daysAgo(80), grams: 100 },
        { date: daysAgo(40), grams: 120 },
        { date: daysAgo(2), grams: 100 },
      ],
    }))).toContain('weight-loss');
  });

  it('raises loss past 10% as urgent and past 5% as watch', () => {
    const at12 = buildHealthReport(
      base({ weights: [{ date: daysAgo(30), grams: 100 }, { date: daysAgo(1), grams: 88 }] })
    );
    expect(at12.concerns.find((c) => c.id === 'weight-loss')?.severity).toBe('urgent');

    const at6 = buildHealthReport(
      base({ weights: [{ date: daysAgo(30), grams: 100 }, { date: daysAgo(1), grams: 94 }] })
    );
    expect(at6.concerns.find((c) => c.id === 'weight-loss')?.severity).toBe('watch');
  });

  it('treats small swings as stable rather than a finding', () => {
    const report = buildHealthReport(
      base({ weights: [{ date: daysAgo(30), grams: 100 }, { date: daysAgo(1), grams: 98 }] })
    );
    expect(report.weight?.trend).toBe('stable');
    expect(report.concerns.map((c) => c.id)).not.toContain('weight-loss');
  });

  it('reports insufficient-data rather than a trend from a single weigh-in', () => {
    const report = buildHealthReport(base({ weights: [{ date: daysAgo(5), grams: 100 }] }));
    expect(report.weight?.trend).toBe('insufficient-data');
    expect(report.weight?.change90dPercent).toBeNull();
  });

  it('ignores readings outside the 90-day window when finding the peak', () => {
    const report = buildHealthReport(
      base({
        weights: [
          { date: daysAgo(200), grams: 200 }, // long past — must not count
          { date: daysAgo(30), grams: 100 },
          { date: daysAgo(1), grams: 99 },
        ],
      })
    );
    expect(report.weight?.peak90dGrams).toBe(100);
  });
});

describe('buildHealthReport — feeding', () => {
  it('counts consecutive refusals back to the last accepted meal', () => {
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(40), quantityEaten: 2 },
          { date: daysAgo(30), refusalNoted: true },
          { date: daysAgo(20), refusalNoted: true },
          { date: daysAgo(10), refusalNoted: true },
        ],
      })
    );
    expect(report.feeding?.consecutiveRefusals).toBe(3);
    expect(report.concerns.find((c) => c.id === 'feeding-refusals')?.severity).toBe('watch');
  });

  it('escalates to urgent at five refusals in a row', () => {
    const feedings = [
      { date: daysAgo(60), quantityEaten: 2 },
      ...[50, 40, 30, 20, 10].map((d) => ({ date: daysAgo(d), refusalNoted: true })),
    ];
    expect(buildHealthReport(base({ feedings })).concerns.find((c) => c.id === 'feeding-refusals')?.severity).toBe(
      'urgent'
    );
  });

  it('treats a zero-quantity meal as a refusal even without the flag', () => {
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(30), quantityEaten: 2 },
          { date: daysAgo(20), quantityEaten: 0 },
          { date: daysAgo(10), quantityEaten: 0 },
          { date: daysAgo(5), quantityEaten: 0 },
        ],
      })
    );
    expect(report.feeding?.consecutiveRefusals).toBe(3);
  });

  it('resets the streak once a meal is accepted', () => {
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(30), refusalNoted: true },
          { date: daysAgo(20), refusalNoted: true },
          { date: daysAgo(10), refusalNoted: true },
          { date: daysAgo(5), quantityEaten: 3 },
        ],
      })
    );
    expect(report.feeding?.consecutiveRefusals).toBe(0);
    expect(report.concerns.map((c) => c.id)).not.toContain('feeding-refusals');
  });

  it('measures the average interval between accepted meals only', () => {
    // Refusals sit between accepted meals; counting them would halve the gap.
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(30), quantityEaten: 2 },
          { date: daysAgo(25), refusalNoted: true },
          { date: daysAgo(20), quantityEaten: 2 },
          { date: daysAgo(10), quantityEaten: 2 },
        ],
      })
    );
    expect(report.feeding?.averageDaysBetweenMeals).toBe(10);
  });

  it('flags a gap far beyond the animal’s own established rhythm', () => {
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(130), quantityEaten: 2 },
          { date: daysAgo(123), quantityEaten: 2 },
          { date: daysAgo(116), quantityEaten: 2 },
        ],
      })
    );
    expect(report.concerns.map((c) => c.id)).toContain('feeding-gap');
  });

  it('does not flag a gap for an animal that normally eats infrequently', () => {
    const report = buildHealthReport(
      base({
        feedings: [
          { date: daysAgo(90), quantityEaten: 1 },
          { date: daysAgo(60), quantityEaten: 1 },
          { date: daysAgo(30), quantityEaten: 1 },
        ],
      })
    );
    expect(report.concerns.map((c) => c.id)).not.toContain('feeding-gap');
  });
});

describe('buildHealthReport — defecation', () => {
  it('raises visible parasites as urgent regardless of age', () => {
    const report = buildHealthReport(
      base({ poops: [{ date: daysAgo(300), parasitesSeen: true }] })
    );
    const concern = report.concerns.find((c) => c.id === 'parasites-seen');
    expect(concern?.severity).toBe('urgent');
  });

  it('raises a single bloody stool as urgent', () => {
    const report = buildHealthReport(base({ poops: [{ date: daysAgo(5), consistency: 'bloody' }] }));
    expect(report.concerns.find((c) => c.id === 'stool-critical')?.severity).toBe('urgent');
  });

  it('needs three abnormal stools before calling it a pattern', () => {
    const two = buildHealthReport(
      base({ poops: [{ date: daysAgo(10), consistency: 'runny' }, { date: daysAgo(5), consistency: 'soft' }] })
    );
    expect(two.concerns.map((c) => c.id)).not.toContain('stool-abnormal');

    const three = buildHealthReport(
      base({
        poops: [
          { date: daysAgo(15), consistency: 'runny' },
          { date: daysAgo(10), consistency: 'soft' },
          { date: daysAgo(5), consistency: 'watery' },
        ],
      })
    );
    expect(three.concerns.find((c) => c.id === 'stool-abnormal')?.severity).toBe('watch');
  });

  it('does not double-report when blood is already raised as critical', () => {
    const ids = concernIds(
      base({
        poops: [
          { date: daysAgo(15), consistency: 'runny' },
          { date: daysAgo(10), consistency: 'soft' },
          { date: daysAgo(5), consistency: 'bloody' },
        ],
      })
    );
    expect(ids).toContain('stool-critical');
    expect(ids).not.toContain('stool-abnormal');
  });

  it('ignores normal stools entirely', () => {
    const report = buildHealthReport(
      base({
        poops: [
          { date: daysAgo(15), consistency: 'normal' },
          { date: daysAgo(10), consistency: 'normal' },
          { date: daysAgo(5), consistency: 'normal' },
        ],
      })
    );
    expect(report.defecation?.abnormalIn90Days).toBe(0);
    expect(report.concerns).toHaveLength(0);
  });
});

describe('buildHealthReport — shedding', () => {
  it('notes a single problem shed but escalates to watch at two', () => {
    const one = buildHealthReport(base({ sheds: [{ date: daysAgo(20), quality: 'stuck-shed' }] }));
    expect(one.concerns.find((c) => c.id === 'shed-problems')?.severity).toBe('note');

    const two = buildHealthReport(
      base({
        sheds: [
          { date: daysAgo(60), quality: 'incomplete' },
          { date: daysAgo(20), quality: 'stuck-shed' },
        ],
      })
    );
    expect(two.concerns.find((c) => c.id === 'shed-problems')?.severity).toBe('watch');
  });

  it('ignores problem sheds older than the 180-day window', () => {
    const report = buildHealthReport(base({ sheds: [{ date: daysAgo(300), quality: 'stuck-shed' }] }));
    expect(report.concerns.map((c) => c.id)).not.toContain('shed-problems');
  });

  it('averages the interval between sheds', () => {
    const report = buildHealthReport(
      base({
        sheds: [
          { date: daysAgo(60), quality: 'complete' },
          { date: daysAgo(40), quality: 'complete' },
          { date: daysAgo(20), quality: 'complete' },
        ],
      })
    );
    expect(report.shed?.averageDaysBetweenSheds).toBe(20);
    expect(report.shed?.daysSinceLastShed).toBe(20);
  });
});

describe('buildHealthReport — UVB and follow-ups', () => {
  it('raises an expired bulb using the shared lifecycle engine', () => {
    const report = buildHealthReport(
      base({ enclosure: { uvbBulbType: 't5-ho', uvbBulbInstalledOn: daysAgo(600) } })
    );
    const concern = report.concerns.find((c) => c.id === 'uvb-expired');
    expect(concern).toBeDefined();
    expect(concern?.title).toContain('rated 12');
  });

  it('says nothing about a bulb still inside its rated life', () => {
    const report = buildHealthReport(
      base({ enclosure: { uvbBulbType: 't5-ho', uvbBulbInstalledOn: daysAgo(30) } })
    );
    expect(report.concerns.map((c) => c.id)).not.toContain('uvb-expired');
  });

  it('flags a follow-up whose date has passed', () => {
    const report = buildHealthReport(
      base({
        vetVisits: [
          {
            date: daysAgo(60),
            visitType: 'illness',
            followUpNeeded: true,
            followUpDate: daysAgo(10),
            followUpNotes: 'Recheck weight',
          },
        ],
      })
    );
    const concern = report.concerns.find((c) => c.id === 'followup-overdue');
    expect(concern?.detail).toBe('Recheck weight');
  });

  it('leaves a future follow-up alone', () => {
    const future = new Date(NOW.getTime() + 7 * 86400000);
    const report = buildHealthReport(
      base({ vetVisits: [{ date: daysAgo(10), visitType: 'checkup', followUpNeeded: true, followUpDate: future }] })
    );
    expect(report.concerns.map((c) => c.id)).not.toContain('followup-overdue');
  });
});

describe('buildHealthReport — ranking and gaps', () => {
  it('orders concerns most severe first', () => {
    const report = buildHealthReport(
      base({
        poops: [{ date: daysAgo(5), consistency: 'bloody' }],
        sheds: [{ date: daysAgo(20), quality: 'stuck-shed' }],
        weights: [{ date: daysAgo(30), grams: 100 }, { date: daysAgo(1), grams: 94 }],
      })
    );
    const severities = report.concerns.map((c) => c.severity);
    expect(severities[0]).toBe('urgent');
    expect(severities[severities.length - 1]).toBe('note');
  });

  it('attaches checkable evidence to every concern', () => {
    const report = buildHealthReport(
      base({ weights: [{ date: daysAgo(30), grams: 100 }, { date: daysAgo(1), grams: 85 }] })
    );
    expect(report.concerns.length).toBeGreaterThan(0);
    for (const concern of report.concerns) {
      expect(concern.evidence.length).toBeGreaterThan(0);
    }
  });

  it('states missing weight as a gap rather than staying silent', () => {
    const report = buildHealthReport(base());
    expect(report.dataGaps.some((gap) => gap.includes('No weight'))).toBe(true);
  });

  it('calls out a lone weigh-in as no trend', () => {
    const report = buildHealthReport(base({ weights: [{ date: daysAgo(3), grams: 100 }] }));
    expect(report.dataGaps.some((gap) => gap.includes('Only one weigh-in'))).toBe(true);
  });

  it('marks a nearly empty record as insufficient', () => {
    expect(buildHealthReport(base()).insufficientData).toBe(true);
  });

  it('clears the insufficient flag once two streams have data', () => {
    const report = buildHealthReport(
      base({
        weights: [{ date: daysAgo(10), grams: 100 }],
        feedings: [{ date: daysAgo(5), quantityEaten: 2 }],
      })
    );
    expect(report.insufficientData).toBe(false);
  });

  it('distinguishes target settings from measured readings in the gaps', () => {
    const withTargetsOnly = buildHealthReport(
      base({ enclosure: { baselineDayTempTarget: 82, baselineHumidityMinTarget: 60 } })
    );
    expect(withTargetsOnly.dataGaps.some((gap) => gap.includes('target settings, not readings'))).toBe(true);

    const withReadings = buildHealthReport(
      base({ environment: { baskingTempF: 92, humidityPercent: 65, recordedAt: daysAgo(2) } })
    );
    expect(withReadings.dataGaps.some((gap) => gap.includes('target settings, not readings'))).toBe(false);
  });

  it('produces a usable report for a healthy, well-logged animal', () => {
    const report = buildHealthReport(
      base({
        weights: [
          { date: daysAgo(60), grams: 100 },
          { date: daysAgo(30), grams: 104 },
          { date: daysAgo(2), grams: 107 },
        ],
        feedings: [
          { date: daysAgo(21), quantityEaten: 2 },
          { date: daysAgo(14), quantityEaten: 2 },
          { date: daysAgo(7), quantityEaten: 2 },
        ],
        poops: [{ date: daysAgo(6), consistency: 'normal' }],
        sheds: [{ date: daysAgo(25), quality: 'complete' }],
      })
    );

    expect(report.concerns).toHaveLength(0);
    expect(report.weight?.trend).toBe('gaining');
    expect(report.insufficientData).toBe(false);
  });
});
