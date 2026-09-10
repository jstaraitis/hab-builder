import { describe, it, expect } from 'vitest';
import {
  buildCohortCurve,
  compareToCohort,
  MIN_ANIMALS_PER_BUCKET,
  type CohortObservation,
} from './cohortStats';

/** N animals, one observation each, all at the same age. */
function cohort(weights: number[], ageDays = 200): CohortObservation[] {
  return weights.map((weightGrams, i) => ({
    animalKey: `animal-${i}`,
    ageDays,
    weightGrams,
  }));
}

const TEN_ANIMALS = cohort([30, 34, 38, 40, 42, 44, 46, 50, 54, 60]);

describe('buildCohortCurve — sample size discipline', () => {
  it('reports nothing until a bucket has enough animals', () => {
    const curve = buildCohortCurve('crested-gecko', cohort([40, 42, 44, 46, 48]));
    expect(curve.insufficientData).toBe(true);
    expect(curve.buckets).toHaveLength(0);
  });

  it('says how many more animals are needed', () => {
    const curve = buildCohortCurve('crested-gecko', cohort([40, 42, 44]));
    expect(curve.animalsNeeded).toBe(MIN_ANIMALS_PER_BUCKET - 3);
  });

  it('reports once the threshold is met', () => {
    const curve = buildCohortCurve('crested-gecko', TEN_ANIMALS);
    expect(curve.insufficientData).toBe(false);
    expect(curve.buckets).toHaveLength(1);
    expect(curve.buckets[0].animals).toBe(10);
    expect(curve.animalsNeeded).toBe(0);
  });

  it('counts ANIMALS, not observations', () => {
    // One keeper weighing weekly for a year is 52 rows and a sample size of 1.
    const obsessive: CohortObservation[] = Array.from({ length: 52 }, (_, i) => ({
      animalKey: 'the-one-animal',
      ageDays: 200,
      weightGrams: 40 + i,
    }));

    const curve = buildCohortCurve('crested-gecko', obsessive);
    expect(curve.totalObservations).toBe(52);
    expect(curve.totalAnimals).toBe(1);
    expect(curve.insufficientData).toBe(true);
  });

  it('lets one animal contribute only once per bucket', () => {
    // Nine animals, but one of them weighed in twenty times. Its twenty rows
    // must collapse to a single value, leaving nine — one over the threshold.
    const many: CohortObservation[] = [
      ...cohort([30, 34, 38, 42, 46, 50, 54, 58]),
      ...Array.from({ length: 20 }, (_, i) => ({
        animalKey: 'frequent',
        ageDays: 200,
        weightGrams: 100 + i,
      })),
    ];

    const curve = buildCohortCurve('crested-gecko', many);
    expect(curve.buckets[0].animals).toBe(9);
  });

  it('uses an animal median when it has several weights in a bucket', () => {
    const withRepeat: CohortObservation[] = [
      ...cohort([10, 10, 10, 10, 10, 10, 10]),
      { animalKey: 'varied', ageDays: 200, weightGrams: 100 },
      { animalKey: 'varied', ageDays: 200, weightGrams: 200 },
      { animalKey: 'varied', ageDays: 200, weightGrams: 300 },
    ];
    const curve = buildCohortCurve('crested-gecko', withRepeat);
    // The varied animal contributes 200 (its median), so it is the maximum.
    expect(curve.buckets[0].animals).toBe(8);
    expect(curve.buckets[0].p90).toBeGreaterThan(10);
  });
});

describe('buildCohortCurve — bucketing', () => {
  it('uses two-week buckets in the first three months', () => {
    const curve = buildCohortCurve('crested-gecko', cohort(Array.from({ length: 10 }, () => 5), 20));
    expect(curve.buckets[0].ageStartDays).toBe(14);
    expect(curve.buckets[0].ageEndDays).toBe(27);
  });

  it('uses monthly buckets between three months and two years', () => {
    const curve = buildCohortCurve('crested-gecko', cohort(Array.from({ length: 10 }, () => 40), 200));
    const bucket = curve.buckets[0];
    expect(bucket.ageEndDays - bucket.ageStartDays).toBe(29);
  });

  it('uses quarterly buckets past two years', () => {
    const curve = buildCohortCurve('crested-gecko', cohort(Array.from({ length: 10 }, () => 55), 900));
    const bucket = curve.buckets[0];
    expect(bucket.ageEndDays - bucket.ageStartDays).toBe(90);
  });

  it('keeps separate age groups in separate buckets', () => {
    const curve = buildCohortCurve('crested-gecko', [
      ...cohort(Array.from({ length: 10 }, () => 20), 150),
      ...cohort(Array.from({ length: 10 }, () => 45), 400).map((o) => ({ ...o, animalKey: `old-${o.animalKey}` })),
    ]);
    expect(curve.buckets).toHaveLength(2);
    expect(curve.buckets[0].p50).toBeLessThan(curve.buckets[1].p50);
  });

  it('drops an under-populated bucket while keeping a healthy one', () => {
    const curve = buildCohortCurve('crested-gecko', [
      ...cohort(Array.from({ length: 10 }, () => 20), 150),
      ...cohort(Array.from({ length: 3 }, () => 45), 400).map((o) => ({ ...o, animalKey: `old-${o.animalKey}` })),
    ]);
    expect(curve.buckets).toHaveLength(1);
    expect(curve.buckets[0].ageStartDays).toBeLessThan(200);
  });
});

describe('buildCohortCurve — percentile values', () => {
  it('orders the quantiles correctly', () => {
    const b = buildCohortCurve('crested-gecko', TEN_ANIMALS).buckets[0];
    expect(b.p10).toBeLessThanOrEqual(b.p25);
    expect(b.p25).toBeLessThanOrEqual(b.p50);
    expect(b.p50).toBeLessThanOrEqual(b.p75);
    expect(b.p75).toBeLessThanOrEqual(b.p90);
  });

  it('puts the median in the middle of the sample', () => {
    const b = buildCohortCurve('crested-gecko', TEN_ANIMALS).buckets[0];
    expect(b.p50).toBeCloseTo(43, 0);
  });

  it('handles a cohort where every animal weighs the same', () => {
    const b = buildCohortCurve('crested-gecko', cohort(Array.from({ length: 10 }, () => 42))).buckets[0];
    expect(b.p10).toBe(42);
    expect(b.p90).toBe(42);
  });
});

describe('compareToCohort', () => {
  const curve = buildCohortCurve('crested-gecko', TEN_ANIMALS);

  it('places a mid-range animal near the middle', () => {
    const result = compareToCohort(curve, 200, 43);
    expect(result.percentile).toBeGreaterThan(40);
    expect(result.percentile).toBeLessThan(60);
    expect(result.description).toContain('middle');
  });

  it('places a light animal low and a heavy animal high', () => {
    expect(compareToCohort(curve, 200, 31).percentile).toBeLessThanOrEqual(15);
    expect(compareToCohort(curve, 200, 58).percentile).toBeGreaterThanOrEqual(85);
  });

  it('clamps at the boundaries rather than inventing extreme percentiles', () => {
    // The curve is only defined at p10-p90; extrapolating past it would produce
    // a confident 2nd or 99th percentile the data cannot support.
    expect(compareToCohort(curve, 200, 1).percentile).toBe(10);
    expect(compareToCohort(curve, 200, 100000).percentile).toBe(90);
  });

  it('returns null when the animal has no reportable bucket for its age', () => {
    const result = compareToCohort(curve, 5000, 45);
    expect(result.percentile).toBeNull();
    expect(result.bucket).toBeNull();
    expect(result.description).toBeNull();
  });

  it('always reports the sample size behind the number', () => {
    expect(compareToCohort(curve, 200, 43).sampleSize).toBe(10);
  });

  it('never returns a clinical verdict', () => {
    const result = compareToCohort(curve, 200, 31);
    expect(result.description).not.toMatch(/underweight|obese|unhealthy|malnourished/i);
  });

  it('returns nothing usable against an empty curve', () => {
    const empty = buildCohortCurve('crested-gecko', cohort([40, 42]));
    expect(compareToCohort(empty, 200, 41).percentile).toBeNull();
  });
});
