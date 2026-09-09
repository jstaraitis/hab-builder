/**
 * Brumation safety monitoring
 *
 * Brumation is the highest-stakes routine event in reptile keeping: the animal
 * stops eating for weeks or months and looks, to an inexperienced keeper,
 * indistinguishable from dying. Some weight loss is normal — until it isn't,
 * and by the time it's obvious the animal is in trouble.
 *
 * The existing BrumationTracker records weight loss once, manually, when the
 * keeper ends brumation. That's a historical record, not a safety net. This
 * engine watches the actual weight log *during* brumation and says plainly
 * when it's time to wake the animal up.
 *
 * Thresholds below reflect widely published husbandry guidance. They are
 * decision support, not veterinary advice, and the copy says so.
 */

import type { AlertSeverity } from '../types/thresholds';
import type { WeightLog } from '../types/weightTracking';

export interface BrumationSpeciesProfile {
  /** Whether a true brumation is normal for this species. */
  brumates: boolean;
  typicalWeeksMin: number;
  typicalWeeksMax: number;
  /** Past this, length itself becomes the concern regardless of weight. */
  maxSafeWeeks: number;
  note: string;
}

const DEFAULT_PROFILE: BrumationSpeciesProfile = {
  brumates: false,
  typicalWeeksMin: 4,
  typicalWeeksMax: 12,
  maxSafeWeeks: 16,
  note: 'A true brumation is not typical for this species. Extended inactivity or refusal to eat is worth discussing with an exotics vet.',
};

/**
 * Keyed by the substring that appears in the app's species ids, so a species
 * added later inherits the conservative default rather than silently getting
 * bearded-dragon thresholds.
 */
const SPECIES_PROFILES: Array<{ match: string; profile: BrumationSpeciesProfile }> = [
  {
    match: 'bearded-dragon',
    profile: {
      brumates: true,
      typicalWeeksMin: 4,
      typicalWeeksMax: 12,
      maxSafeWeeks: 16,
      note: 'Bearded dragons commonly brumate for one to three months, usually in autumn and winter. Offer water regularly and weigh every two weeks.',
    },
  },
  {
    match: 'blue-tongue-skink',
    profile: {
      brumates: true,
      typicalWeeksMin: 6,
      typicalWeeksMax: 12,
      maxSafeWeeks: 14,
      note: 'Blue-tongue skinks typically brumate six to twelve weeks. They often surface periodically to drink — that is normal.',
    },
  },
  {
    match: 'corn-snake',
    profile: {
      brumates: true,
      typicalWeeksMin: 8,
      typicalWeeksMax: 12,
      maxSafeWeeks: 14,
      note: 'Corn snakes brumate roughly eight to twelve weeks. Ensure the gut is fully empty before cooling — undigested food can rot at brumation temperatures.',
    },
  },
  {
    match: 'red-eared-slider',
    profile: {
      brumates: true,
      typicalWeeksMin: 8,
      typicalWeeksMax: 16,
      maxSafeWeeks: 18,
      note: 'Sliders brumate eight to sixteen weeks. Water quality and temperature stability matter more than for terrestrial species.',
    },
  },
  {
    match: 'uromastyx',
    profile: {
      brumates: true,
      typicalWeeksMin: 4,
      typicalWeeksMax: 10,
      maxSafeWeeks: 12,
      note: 'Uromastyx brumation is usually shorter than other desert species — four to ten weeks is typical.',
    },
  },
  {
    match: 'leopard-gecko',
    profile: {
      brumates: true,
      typicalWeeksMin: 4,
      typicalWeeksMax: 8,
      maxSafeWeeks: 10,
      note: 'Leopard geckos undergo a lighter cool-down rather than a deep brumation. Four to eight weeks is typical.',
    },
  },
];

export function getBrumationProfile(speciesId: string | null | undefined): BrumationSpeciesProfile {
  if (!speciesId) return DEFAULT_PROFILE;
  const id = speciesId.toLowerCase();
  return SPECIES_PROFILES.find((entry) => id.includes(entry.match))?.profile ?? DEFAULT_PROFILE;
}

export type BrumationConcernLevel = 'ok' | 'watch' | 'concern' | 'urgent';

export interface BrumationAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
}

export interface BrumationAssessment {
  profile: BrumationSpeciesProfile;
  daysElapsed: number;
  weeksElapsed: number;
  /** Last weight recorded on or before the brumation start date. */
  baselineWeightGrams: number | null;
  currentWeightGrams: number | null;
  /** Positive number = percent of body weight lost. */
  weightLossPercent: number | null;
  daysSinceLastWeighIn: number | null;
  level: BrumationConcernLevel;
  alerts: BrumationAlert[];
}

// Percent of starting body weight lost.
const WEIGHT_LOSS_WATCH = 7;
const WEIGHT_LOSS_CONCERN = 10;
const WEIGHT_LOSS_URGENT = 15;

/** Weighing more often than this during brumation disturbs the animal. */
const WEIGH_IN_INTERVAL_DAYS = 14;
const WEIGH_IN_STALE_DAYS = 21;

const MS_PER_DAY = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

const LEVEL_ORDER: Record<BrumationConcernLevel, number> = {
  ok: 0,
  watch: 1,
  concern: 2,
  urgent: 3,
};

function escalate(current: BrumationConcernLevel, next: BrumationConcernLevel): BrumationConcernLevel {
  return LEVEL_ORDER[next] > LEVEL_ORDER[current] ? next : current;
}

export interface BrumationAssessmentInput {
  speciesId: string | null | undefined;
  animalName?: string;
  startDate: Date | string;
  weightLogs: WeightLog[];
  now?: Date;
}

export function assessBrumation({
  speciesId,
  animalName,
  startDate,
  weightLogs,
  now = new Date(),
}: BrumationAssessmentInput): BrumationAssessment {
  const profile = getBrumationProfile(speciesId);
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const name = animalName?.trim() || 'Your animal';

  const daysElapsed = Math.max(0, daysBetween(start, now));
  const weeksElapsed = Math.floor(daysElapsed / 7);

  const sorted = [...weightLogs]
    .filter((log) => !Number.isNaN(new Date(log.measurementDate).getTime()))
    .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());

  // Baseline is the animal's weight going *into* brumation. Without it a
  // percentage is meaningless, so we report null rather than guessing.
  const baselineLog = [...sorted]
    .reverse()
    .find((log) => new Date(log.measurementDate).getTime() <= start.getTime());

  const latestLog = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;

  const baselineWeightGrams = baselineLog?.weightGrams ?? null;
  const currentWeightGrams = latestLog?.weightGrams ?? null;

  const duringBrumationLog =
    latestLog && new Date(latestLog.measurementDate).getTime() >= start.getTime()
      ? latestLog
      : undefined;

  const daysSinceLastWeighIn = duringBrumationLog
    ? Math.max(0, daysBetween(new Date(duringBrumationLog.measurementDate), now))
    : null;

  let weightLossPercent: number | null = null;
  if (baselineWeightGrams && baselineWeightGrams > 0 && duringBrumationLog) {
    const lost = baselineWeightGrams - duringBrumationLog.weightGrams;
    weightLossPercent = Math.round((lost / baselineWeightGrams) * 1000) / 10;
  }

  const alerts: BrumationAlert[] = [];
  let level: BrumationConcernLevel = 'ok';

  // ─── Weight loss ─────────────────────────────────────────────────────────
  if (weightLossPercent !== null && weightLossPercent >= WEIGHT_LOSS_URGENT) {
    level = escalate(level, 'urgent');
    alerts.push({
      id: 'brumation-weight-critical',
      severity: 'urgent',
      title: `${weightLossPercent}% body weight lost — end brumation`,
      body: `${name} has lost more than ${WEIGHT_LOSS_URGENT}% of starting body weight. That is past what brumation alone accounts for. Warm the animal back up gradually and contact an exotics vet.`,
    });
  } else if (weightLossPercent !== null && weightLossPercent >= WEIGHT_LOSS_CONCERN) {
    level = escalate(level, 'concern');
    alerts.push({
      id: 'brumation-weight-concern',
      severity: 'warning',
      title: `${weightLossPercent}% body weight lost`,
      body: `Loss above ${WEIGHT_LOSS_CONCERN}% is more than a healthy brumation usually costs. Consider ending brumation early and offering water and warmth.`,
    });
  } else if (weightLossPercent !== null && weightLossPercent >= WEIGHT_LOSS_WATCH) {
    level = escalate(level, 'watch');
    alerts.push({
      id: 'brumation-weight-watch',
      severity: 'info',
      title: `${weightLossPercent}% body weight lost`,
      body: `Still within the normal range for brumation, but worth watching. Weigh ${name} again in about a week rather than the usual two.`,
    });
  }

  // ─── Duration ────────────────────────────────────────────────────────────
  const maxSafeDays = profile.maxSafeWeeks * 7;
  const typicalMaxDays = profile.typicalWeeksMax * 7;

  if (daysElapsed > maxSafeDays) {
    level = escalate(level, 'urgent');
    alerts.push({
      id: 'brumation-duration-critical',
      severity: 'urgent',
      title: `Brumation has run ${weeksElapsed} weeks`,
      body: `That is beyond the ${profile.maxSafeWeeks}-week outer limit for this species. Begin warming ${name} back up and have a vet check for an underlying reason it hasn't roused.`,
    });
  } else if (daysElapsed > typicalMaxDays) {
    level = escalate(level, 'concern');
    alerts.push({
      id: 'brumation-duration-long',
      severity: 'warning',
      title: `Brumation is running long (${weeksElapsed} weeks)`,
      body: `Typical is ${profile.typicalWeeksMin}–${profile.typicalWeeksMax} weeks. Consider starting to raise temperatures and photoperiod to bring ${name} out.`,
    });
  }

  // ─── Monitoring gaps ─────────────────────────────────────────────────────
  if (baselineWeightGrams === null) {
    level = escalate(level, 'watch');
    alerts.push({
      id: 'brumation-no-baseline',
      severity: 'warning',
      title: 'No starting weight recorded',
      body: `Without a weight from before brumation began, weight loss can't be tracked — the single most important safety signal. Log ${name}'s weight now to at least establish a floor.`,
    });
  } else if (daysSinceLastWeighIn === null) {
    level = escalate(level, 'watch');
    alerts.push({
      id: 'brumation-no-weigh-in',
      severity: 'info',
      title: 'No weight logged since brumation started',
      body: `Weigh ${name} every ${WEIGH_IN_INTERVAL_DAYS} days during brumation. It's a brief disturbance and it's the only reliable way to catch trouble early.`,
    });
  } else if (daysSinceLastWeighIn >= WEIGH_IN_STALE_DAYS) {
    level = escalate(level, 'watch');
    alerts.push({
      id: 'brumation-weigh-in-stale',
      severity: 'info',
      title: `${daysSinceLastWeighIn} days since last weigh-in`,
      body: `Aim for every ${WEIGH_IN_INTERVAL_DAYS} days during brumation so a downward trend shows up while there's still time to act.`,
    });
  }

  // ─── Species suitability ─────────────────────────────────────────────────
  if (!profile.brumates) {
    level = escalate(level, 'watch');
    alerts.push({
      id: 'brumation-atypical-species',
      severity: 'info',
      title: 'Brumation is unusual for this species',
      body: profile.note,
    });
  }

  return {
    profile,
    daysElapsed,
    weeksElapsed,
    baselineWeightGrams,
    currentWeightGrams,
    weightLossPercent,
    daysSinceLastWeighIn,
    level,
    alerts,
  };
}
