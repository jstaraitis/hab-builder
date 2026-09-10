/**
 * Cohort growth statistics
 *
 * Paediatricians have growth charts. Reptile keepers have a care sheet that
 * says "adults reach 45-65g" and no way to know whether a 14-month-old at 38g
 * is behind, on track, or simply small. This engine builds the missing chart
 * from what keepers collectively record.
 *
 * The statistics are deliberately conservative, because a growth percentile is
 * the kind of number people act on:
 *
 *   - Sample size counts ANIMALS, never observations. One diligent keeper
 *     weighing weekly for a year is 52 rows and a sample size of one. Getting
 *     this wrong would let a single animal define a species curve.
 *   - Each animal contributes at most one observation per age bucket, using
 *     its median weight in that bucket. Without this, frequent weighers pull
 *     the curve toward their own animals.
 *   - A bucket below the minimum animal count returns nothing at all rather
 *     than a wide-error-bar estimate. "Not enough data" is a usable answer;
 *     a percentile built on four animals is not.
 *   - Percentiles are reported without a verdict. The engine will say an animal
 *     sits at the 12th percentile; it will not say "underweight". Small can be
 *     genetics, sex, morph, or a late start, and the keeper and their vet are
 *     better placed to judge than a quantile is.
 */

export interface CohortObservation {
  /** Pseudonymous per-animal id — never a real animal or user id. */
  animalKey: string;
  ageDays: number;
  weightGrams: number;
  sex?: string | null;
}

export interface CohortBucket {
  /** Inclusive lower bound of the age bucket, in days. */
  ageStartDays: number;
  ageEndDays: number;
  /** Midpoint, for plotting. */
  ageMidDays: number;
  animals: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface CohortCurve {
  speciesId: string;
  buckets: CohortBucket[];
  /** Distinct animals across the whole species, not per bucket. */
  totalAnimals: number;
  totalObservations: number;
  /** True when no bucket cleared the minimum sample size. */
  insufficientData: boolean;
  /** How many more animals this species needs before anything is reportable. */
  animalsNeeded: number;
}

export interface CohortComparison {
  /** 0-100. Null when the animal's age falls outside any reportable bucket. */
  percentile: number | null;
  bucket: CohortBucket | null;
  /** Plain-language placement, e.g. "around the middle of the range". */
  description: string | null;
  /** Always present, so the reader can weigh the number. */
  sampleSize: number;
}

/**
 * Minimum distinct animals before a bucket is reportable.
 *
 * Eight is a judgement call, not a statistical guarantee: below it a single
 * unusual animal visibly bends the curve, and the resulting percentile would
 * imply a precision that is not there. Raise it as the dataset grows.
 */
export const MIN_ANIMALS_PER_BUCKET = 8;

/** Bucket width. Growth is fast early and slow later, so buckets widen. */
function bucketFor(ageDays: number): { start: number; end: number } {
  if (ageDays < 90) {
    // Two-week buckets through the first three months, when growth is fastest.
    const start = Math.floor(ageDays / 14) * 14;
    return { start, end: start + 13 };
  }
  if (ageDays < 730) {
    // Monthly to two years.
    const start = 90 + Math.floor((ageDays - 90) / 30) * 30;
    return { start, end: start + 29 };
  }
  // Quarterly thereafter — an adult's weight at 3y0m and 3y2m is the same
  // question, and splitting them just thins the sample.
  const start = 730 + Math.floor((ageDays - 730) / 91) * 91;
  return { start, end: start + 90 };
}

/**
 * Linear-interpolated percentile, matching the common "type 7" definition used
 * by NumPy and R's default. Interpolating rather than picking the nearest rank
 * keeps the curve smooth across bucket boundaries with modest sample sizes.
 */
function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return NaN;
  if (sortedValues.length === 1) return sortedValues[0];

  const position = (sortedValues.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];

  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return quantile(sorted, 0.5);
}

export function buildCohortCurve(speciesId: string, observations: CohortObservation[]): CohortCurve {
  // Collapse to one weight per animal per bucket before any statistics run.
  // This is the step that stops a frequent weigher from counting as a crowd.
  const perAnimalPerBucket = new Map<string, { bucketStart: number; weights: number[] }>();

  for (const observation of observations) {
    const { start } = bucketFor(observation.ageDays);
    const key = `${observation.animalKey}:${start}`;
    const existing = perAnimalPerBucket.get(key);
    if (existing) existing.weights.push(observation.weightGrams);
    else perAnimalPerBucket.set(key, { bucketStart: start, weights: [observation.weightGrams] });
  }

  const byBucket = new Map<number, number[]>();
  for (const { bucketStart, weights } of perAnimalPerBucket.values()) {
    const list = byBucket.get(bucketStart) ?? [];
    list.push(median(weights));
    byBucket.set(bucketStart, list);
  }

  const buckets: CohortBucket[] = [];
  for (const [start, weights] of [...byBucket.entries()].sort((a, b) => a[0] - b[0])) {
    if (weights.length < MIN_ANIMALS_PER_BUCKET) continue;

    const sorted = [...weights].sort((a, b) => a - b);
    const { end } = bucketFor(start);
    buckets.push({
      ageStartDays: start,
      ageEndDays: end,
      ageMidDays: Math.round((start + end) / 2),
      animals: sorted.length,
      p10: Number(quantile(sorted, 0.1).toFixed(1)),
      p25: Number(quantile(sorted, 0.25).toFixed(1)),
      p50: Number(quantile(sorted, 0.5).toFixed(1)),
      p75: Number(quantile(sorted, 0.75).toFixed(1)),
      p90: Number(quantile(sorted, 0.9).toFixed(1)),
    });
  }

  const distinctAnimals = new Set(observations.map((o) => o.animalKey)).size;

  return {
    speciesId,
    buckets,
    totalAnimals: distinctAnimals,
    totalObservations: observations.length,
    insufficientData: buckets.length === 0,
    animalsNeeded: Math.max(0, MIN_ANIMALS_PER_BUCKET - distinctAnimals),
  };
}

function describePercentile(percentile: number): string {
  if (percentile < 10) return 'lighter than most animals of this age';
  if (percentile < 25) return 'on the lighter side for this age';
  if (percentile < 75) return 'around the middle of the range for this age';
  if (percentile < 90) return 'on the heavier side for this age';
  return 'heavier than most animals of this age';
}

/**
 * Places one animal against the curve.
 *
 * Returns a null percentile rather than extrapolating when the animal's age has
 * no reportable bucket. Guessing outside the data is precisely how a benchmark
 * starts producing confident nonsense at the edges.
 */
export function compareToCohort(
  curve: CohortCurve,
  ageDays: number,
  weightGrams: number
): CohortComparison {
  const { start } = bucketFor(ageDays);
  const bucket = curve.buckets.find((b) => b.ageStartDays === start) ?? null;

  if (!bucket) {
    return { percentile: null, bucket: null, description: null, sampleSize: 0 };
  }

  // Interpolate the animal's position between the known quantiles. The curve is
  // only defined at five points, so anything outside p10-p90 is reported at the
  // boundary rather than extrapolated into a made-up 3rd or 99th percentile.
  const points: Array<[number, number]> = [
    [bucket.p10, 10],
    [bucket.p25, 25],
    [bucket.p50, 50],
    [bucket.p75, 75],
    [bucket.p90, 90],
  ];

  let percentile: number;
  if (weightGrams <= points[0][0]) {
    percentile = 10;
  } else if (weightGrams >= points[points.length - 1][0]) {
    percentile = 90;
  } else {
    percentile = 50;
    for (let i = 0; i < points.length - 1; i += 1) {
      const [lowWeight, lowPct] = points[i];
      const [highWeight, highPct] = points[i + 1];
      if (weightGrams >= lowWeight && weightGrams <= highWeight) {
        const span = highWeight - lowWeight;
        const ratio = span === 0 ? 0 : (weightGrams - lowWeight) / span;
        percentile = lowPct + ratio * (highPct - lowPct);
        break;
      }
    }
  }

  const rounded = Math.round(percentile);
  return {
    percentile: rounded,
    bucket,
    description: describePercentile(rounded),
    sampleSize: bucket.animals,
  };
}
