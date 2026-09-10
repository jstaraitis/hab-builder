import { describe, it, expect } from 'vitest';
import { analyzeNutrition, categorizeFeeder, type NutritionFeeding, type NutritionInput } from './nutritionAnalysis';

const NOW = new Date('2026-06-01T12:00:00Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

/** Builds `count` feedings spread a week apart, newest first. */
function feedings(count: number, template: Partial<NutritionFeeding> = {}): NutritionFeeding[] {
  return Array.from({ length: count }, (_, index) => ({
    date: daysAgo(index * 7),
    quantityEaten: 3,
    ...template,
  }));
}

function analyze(overrides: Partial<NutritionInput> = {}) {
  return analyzeNutrition({ feedings: [], generatedAt: NOW, ...overrides });
}

function findingIds(overrides: Partial<NutritionInput> = {}): string[] {
  return analyze(overrides).findings.map((finding) => finding.id);
}

describe('categorizeFeeder', () => {
  it('separates staples, occasional feeders and treats', () => {
    expect(categorizeFeeder('Crickets')).toBe('staple-insect');
    expect(categorizeFeeder('Dubia Roaches')).toBe('staple-insect');
    expect(categorizeFeeder('Mealworms')).toBe('occasional-insect');
    expect(categorizeFeeder('Waxworms')).toBe('treat-insect');
    expect(categorizeFeeder('Frozen/Thawed Mouse')).toBe('vertebrate');
    expect(categorizeFeeder('Vegetable Mix')).toBe('plant');
  });

  it('treats a custom feeder name as unknown rather than guessing', () => {
    expect(categorizeFeeder('Isopods from my garden')).toBe('unknown');
    expect(categorizeFeeder(undefined)).toBe('unknown');
  });
});

describe('analyzeNutrition — windowing and sufficiency', () => {
  it('ignores feedings older than the window', () => {
    const result = analyze({
      feedings: [
        { date: daysAgo(200), feederType: 'Crickets' },
        { date: daysAgo(10), feederType: 'Crickets' },
      ],
    });
    expect(result.totalFeedings).toBe(1);
  });

  it('honours a custom window', () => {
    const result = analyze({
      feedings: [
        { date: daysAgo(45), feederType: 'Crickets' },
        { date: daysAgo(10), feederType: 'Crickets' },
      ],
      windowDays: 30,
    });
    expect(result.totalFeedings).toBe(1);
  });

  it('stays silent below six feedings rather than reading noise', () => {
    const result = analyze({
      feedings: feedings(5, { feederType: 'Waxworms', supplementUsed: 'None' }),
    });
    expect(result.insufficientData).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it('begins reporting at six feedings', () => {
    const result = analyze({
      feedings: feedings(6, { feederType: 'Crickets', supplementUsed: 'None' }),
    });
    expect(result.insufficientData).toBe(false);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});

describe('analyzeNutrition — diet profile gates the rules', () => {
  it('classifies a rodent diet as vertebrate', () => {
    const result = analyze({ feedings: feedings(8, { feederType: 'Frozen/Thawed Mouse' }) });
    expect(result.dietProfile).toBe('vertebrate');
  });

  it('never asks a rodent-fed animal to dust its food or vary its feeders', () => {
    // A snake eating only mice is correctly fed. Insectivore advice here would
    // be actively wrong, so no rule may fire.
    const ids = findingIds({
      feedings: feedings(10, { feederType: 'Frozen/Thawed Mouse', supplementUsed: 'None' }),
      hasEffectiveUvb: false,
    });
    expect(ids).toHaveLength(0);
  });

  it('classifies an insect diet and applies dusting rules to it', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'None' }),
    });
    expect(result.dietProfile).toBe('insect');
    expect(result.findings.map((f) => f.id)).toContain('supplementation-low');
  });

  it('classifies a plant diet', () => {
    const result = analyze({ feedings: feedings(8, { feederType: 'Vegetable Mix' }) });
    expect(result.dietProfile).toBe('plant');
  });

  it('reports unknown for entirely uncategorised feeders', () => {
    const result = analyze({ feedings: feedings(8, { feederType: 'Mystery Bug' }) });
    expect(result.dietProfile).toBe('unknown');
  });
});

describe('analyzeNutrition — supplementation', () => {
  it('escalates missing supplementation to urgent when UVB is also absent', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'None' }),
      hasEffectiveUvb: false,
    });
    const finding = result.findings.find((f) => f.id === 'supplementation-low');
    expect(finding?.severity).toBe('urgent');
    expect(finding?.detail).toContain('metabolic bone disease');
  });

  it('keeps missing supplementation at watch when UVB is working', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'None' }),
      hasEffectiveUvb: true,
    });
    expect(result.findings.find((f) => f.id === 'supplementation-low')?.severity).toBe('watch');
  });

  it('does not escalate when UVB status is simply unknown', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'None' }),
    });
    expect(result.findings.find((f) => f.id === 'supplementation-low')?.severity).toBe('watch');
  });

  it('computes supplementation and D3 rates separately', () => {
    const result = analyze({
      feedings: [
        ...feedings(4, { feederType: 'Crickets', supplementUsed: 'Calcium + D3' }),
        ...feedings(4, { feederType: 'Crickets', supplementUsed: 'Calcium (no D3)' }).map((f, i) => ({
          ...f,
          date: daysAgo(30 + i * 7),
        })),
      ],
    });
    expect(result.supplementationRatePercent).toBe(100);
    expect(result.d3RatePercent).toBe(50);
  });

  it('raises D3 saturation only when UVB is genuinely working', () => {
    const saturated = feedings(10, { feederType: 'Crickets', supplementUsed: 'Calcium + D3' });

    expect(findingIds({ feedings: saturated, hasEffectiveUvb: true })).toContain('d3-saturation');
    // Without UVB, heavy D3 may be exactly right — saying otherwise would be
    // dangerous advice.
    expect(findingIds({ feedings: saturated, hasEffectiveUvb: false })).not.toContain('d3-saturation');
    expect(findingIds({ feedings: saturated })).not.toContain('d3-saturation');
  });

  it('notes the absence of any multivitamin', () => {
    const ids = findingIds({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'Calcium (no D3)' }),
    });
    expect(ids).toContain('no-multivitamin');
  });

  it('says nothing about multivitamins once one is recorded', () => {
    const mixed = [
      ...feedings(7, { feederType: 'Crickets', supplementUsed: 'Calcium (no D3)' }),
      { date: daysAgo(60), feederType: 'Crickets', supplementUsed: 'Multivitamin', quantityEaten: 3 },
    ];
    expect(findingIds({ feedings: mixed })).not.toContain('no-multivitamin');
  });

  it('counts a combined calcium and multivitamin as both', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'Calcium + Multivitamin' }),
    });
    expect(result.supplementationRatePercent).toBe(100);
    expect(result.findings.map((f) => f.id)).not.toContain('no-multivitamin');
  });

  it('treats an unrecognised supplement string as no supplement', () => {
    const result = analyze({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'Some brand name' }),
    });
    expect(result.supplementationRatePercent).toBe(0);
  });
});

describe('analyzeNutrition — feeder variety', () => {
  it('flags a treat-heavy diet', () => {
    const mixed = [
      ...feedings(6, { feederType: 'Waxworms', supplementUsed: 'Calcium + Multivitamin' }),
      ...feedings(4, { feederType: 'Crickets', supplementUsed: 'Calcium + Multivitamin' }).map((f, i) => ({
        ...f,
        date: daysAgo(50 + i * 7),
      })),
    ];
    const finding = analyze({ feedings: mixed }).findings.find((f) => f.id === 'treat-heavy');
    expect(finding?.severity).toBe('watch');
    expect(finding?.title).toContain('60%');
    expect(finding?.detail).toContain('Waxworms');
  });

  it('leaves an occasional treat alone', () => {
    const mixed = [
      { date: daysAgo(7), feederType: 'Waxworms', supplementUsed: 'Calcium + Multivitamin', quantityEaten: 2 },
      ...feedings(9, { feederType: 'Crickets', supplementUsed: 'Calcium + Multivitamin' }).map((f, i) => ({
        ...f,
        date: daysAgo(14 + i * 7),
      })),
    ];
    expect(findingIds({ feedings: mixed })).not.toContain('treat-heavy');
  });

  it('flags a single-feeder diet even when the feeder is a good staple', () => {
    const ids = findingIds({
      feedings: feedings(8, { feederType: 'Crickets', supplementUsed: 'Calcium + Multivitamin' }),
    });
    expect(ids).toContain('single-feeder');
  });

  it('does not flag monotony once a second feeder appears', () => {
    const mixed = [
      ...feedings(5, { feederType: 'Crickets', supplementUsed: 'Calcium + Multivitamin' }),
      ...feedings(5, { feederType: 'Dubia Roaches', supplementUsed: 'Calcium + Multivitamin' }).map((f, i) => ({
        ...f,
        date: daysAgo(40 + i * 7),
      })),
    ];
    expect(findingIds({ feedings: mixed })).not.toContain('single-feeder');
  });

  it('flags a rotation containing no staple at all', () => {
    const mixed = [
      ...feedings(5, { feederType: 'Mealworms', supplementUsed: 'Calcium + Multivitamin' }),
      ...feedings(4, { feederType: 'Superworms', supplementUsed: 'Calcium + Multivitamin' }).map((f, i) => ({
        ...f,
        date: daysAgo(40 + i * 7),
      })),
    ];
    expect(findingIds({ feedings: mixed })).toContain('no-staple');
  });

  it('computes each feeder’s share of the diet', () => {
    const mixed = [
      ...feedings(5, { feederType: 'Crickets' }),
      ...feedings(5, { feederType: 'Dubia Roaches' }).map((f, i) => ({ ...f, date: daysAgo(40 + i * 7) })),
    ];
    const result = analyze({ feedings: mixed });
    expect(result.distinctFeeders).toBe(2);
    expect(result.feeders.every((feeder) => feeder.sharePercent === 50)).toBe(true);
  });
});

describe('analyzeNutrition — acceptance by feeder', () => {
  it('reports acceptance per feeder and flags one that is consistently refused', () => {
    const mixed = [
      ...feedings(4, { feederType: 'Mealworms', refusalNoted: true, quantityEaten: 0 }),
      ...feedings(6, { feederType: 'Crickets', quantityEaten: 4 }).map((f, i) => ({
        ...f,
        date: daysAgo(35 + i * 7),
      })),
    ];
    const result = analyze({ feedings: mixed });

    const mealworms = result.feeders.find((feeder) => feeder.name === 'Mealworms');
    const crickets = result.feeders.find((feeder) => feeder.name === 'Crickets');
    expect(mealworms?.acceptanceRatePercent).toBe(0);
    expect(crickets?.acceptanceRatePercent).toBe(100);
    expect(result.findings.map((f) => f.id)).toContain('refused-mealworms');
  });

  it('reports null acceptance rather than assuming a blank means eaten', () => {
    const result = analyze({
      feedings: feedings(6, { feederType: 'Crickets', quantityEaten: undefined }),
    });
    expect(result.feeders[0].acceptanceRatePercent).toBeNull();
  });

  it('needs at least three offerings before calling a feeder refused', () => {
    const mixed = [
      ...feedings(2, { feederType: 'Waxworms', refusalNoted: true, quantityEaten: 0 }),
      ...feedings(6, { feederType: 'Crickets', quantityEaten: 3 }).map((f, i) => ({
        ...f,
        date: daysAgo(25 + i * 7),
      })),
    ];
    expect(findingIds({ feedings: mixed })).not.toContain('refused-waxworms');
  });
});

describe('analyzeNutrition — ordering and shape', () => {
  it('orders findings most severe first', () => {
    const result = analyze({
      feedings: feedings(10, { feederType: 'Waxworms', supplementUsed: 'None' }),
      hasEffectiveUvb: false,
    });
    const rank = { urgent: 3, watch: 2, note: 1 };
    const ranks = result.findings.map((f) => rank[f.severity]);
    expect(result.findings.length).toBeGreaterThan(1);
    expect(ranks[0]).toBe(rank.urgent);
    // Monotonically non-increasing — a note can never precede a watch.
    for (let i = 1; i < ranks.length; i += 1) {
      expect(ranks[i]).toBeLessThanOrEqual(ranks[i - 1]);
    }
  });

  it('produces no findings for a well-managed insect diet', () => {
    const good = [
      ...feedings(4, { feederType: 'Crickets', supplementUsed: 'Calcium (no D3)', quantityEaten: 4 }),
      ...feedings(4, { feederType: 'Dubia Roaches', supplementUsed: 'Calcium + Multivitamin', quantityEaten: 4 }).map(
        (f, i) => ({ ...f, date: daysAgo(35 + i * 7) })
      ),
      ...feedings(2, { feederType: 'Black Soldier Fly Larvae', supplementUsed: 'Calcium + D3', quantityEaten: 3 }).map(
        (f, i) => ({ ...f, date: daysAgo(70 + i * 7) })
      ),
    ];
    const result = analyze({ feedings: good, hasEffectiveUvb: true });
    expect(result.findings).toHaveLength(0);
    expect(result.dietProfile).toBe('insect');
  });

  it('returns null rates rather than zero when nothing is recorded', () => {
    const result = analyze({ feedings: [] });
    expect(result.supplementationRatePercent).toBeNull();
    expect(result.d3RatePercent).toBeNull();
    expect(result.totalFeedings).toBe(0);
  });
});
