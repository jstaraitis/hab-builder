/**
 * Feeder colony sustainability
 *
 * Keepers who breed their own feeders almost all make the same mistake, and it
 * is invisible until the colony is already gone: they harvest at the rate they
 * feed, without accounting for how long a nymph takes to reach feeder size.
 *
 * A dubia colony started today produces nothing usable for three to four
 * months. Harvest during that window and you are eating your breeding stock,
 * which cuts future production, which makes you harvest more of the remaining
 * adults. Colonies do not decline gently — they look fine, then collapse.
 *
 * This engine answers one question: at the rate you are pulling feeders, is
 * this colony growing, holding, or being eaten faster than it can replace
 * itself.
 *
 * ON PRECISION
 * Home colony output varies enormously with temperature, feed quality, humidity
 * and container density — easily two-fold either way. Every rate here is a
 * conservative mid-range figure and the output is banded, never a single
 * confident number. The engine is built to catch "you are clearly
 * over-harvesting", not to predict next month's yield.
 */

export type FeederSpecies =
  | 'dubia'
  | 'crickets'
  | 'mealworms'
  | 'superworms'
  | 'bsfl'
  | 'other';

export interface FeederSpeciesProfile {
  id: FeederSpecies;
  label: string;
  /**
   * Offspring per breeding female per month, at typical colony temperatures.
   * Conservative end of published ranges.
   */
  offspringPerFemalePerMonth: number;
  /** Months from birth to usable feeder size. The number keepers overlook. */
  maturationMonths: number;
  /** Recommended females per male. Too few males also stalls production. */
  femalesPerMale: number;
  /** Months a new colony should be left alone before any harvesting. */
  establishMonths: number;
  note: string;
}

export const FEEDER_SPECIES: Record<FeederSpecies, FeederSpeciesProfile> = {
  dubia: {
    id: 'dubia',
    label: 'Dubia roaches',
    offspringPerFemalePerMonth: 20,
    maturationMonths: 4,
    femalesPerMale: 3,
    establishMonths: 4,
    note: 'Slow to establish but very stable once running. Keep warm — output drops sharply below about 80°F.',
  },
  crickets: {
    id: 'crickets',
    label: 'Crickets',
    offspringPerFemalePerMonth: 100,
    maturationMonths: 2,
    femalesPerMale: 2,
    establishMonths: 2,
    note: 'Fast and prolific, but adults die off within weeks, so production comes in waves rather than steadily.',
  },
  mealworms: {
    id: 'mealworms',
    label: 'Mealworms',
    offspringPerFemalePerMonth: 60,
    maturationMonths: 3,
    femalesPerMale: 1,
    establishMonths: 3,
    note: 'Low effort. Beetles must be separated from larvae or they eat the eggs.',
  },
  superworms: {
    id: 'superworms',
    label: 'Superworms',
    offspringPerFemalePerMonth: 40,
    maturationMonths: 4,
    femalesPerMale: 1,
    establishMonths: 5,
    note: 'Larvae only pupate when isolated individually, which makes scaling up laborious.',
  },
  bsfl: {
    id: 'bsfl',
    label: 'Black soldier fly larvae',
    offspringPerFemalePerMonth: 200,
    maturationMonths: 1,
    femalesPerMale: 1,
    establishMonths: 2,
    note: 'Very fast, but a self-sustaining colony needs a flight cage for the adult flies — most keepers buy in instead.',
  },
  other: {
    id: 'other',
    label: 'Other',
    offspringPerFemalePerMonth: 30,
    maturationMonths: 3,
    femalesPerMale: 2,
    establishMonths: 3,
    note: 'Generic estimates — treat the verdict as indicative only.',
  },
};

export interface ColonyEvent {
  date: Date;
  /** Positive when adding stock, negative when harvesting. */
  countChange: number;
  /** Money spent on this event, if any. */
  cost?: number;
  kind: 'harvest' | 'purchase' | 'loss' | 'count';
  notes?: string;
}

export interface ColonyInput {
  species: FeederSpecies;
  startedOn: Date;
  /** Breeding adults, from the keeper's most recent estimate. */
  breedingFemales?: number;
  breedingMales?: number;
  events: ColonyEvent[];
  /** Everything spent setting the colony up — bins, heat, substrate. */
  setupCost?: number;
  generatedAt?: Date;
}

export type ColonyVerdict =
  | 'establishing'
  | 'sustainable'
  | 'over-harvesting'
  | 'under-used'
  | 'unknown';

export type ColonyFindingSeverity = 'critical' | 'warning' | 'note';

export interface ColonyFinding {
  id: string;
  severity: ColonyFindingSeverity;
  title: string;
  detail: string;
  fix: string;
}

export interface ColonyAssessment {
  verdict: ColonyVerdict;
  ageMonths: number;
  /** Feeders pulled per week, averaged over the measured window. */
  harvestPerWeek: number | null;
  /**
   * Feeders per week the breeding stock can replace, as a band. Null when the
   * keeper has not estimated their breeding adults.
   */
  sustainablePerWeek: { low: number; high: number } | null;
  totalHarvested: number;
  totalSpent: number;
  /** Total spend divided by feeders produced. Null before anything is harvested. */
  costPerFeeder: number | null;
  findings: ColonyFinding[];
  insufficientData: boolean;
}

const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 30.44;

/**
 * Real output varies about twofold either side of the book figure, so the
 * sustainable rate is reported as a band. A single number here would imply a
 * precision that home colonies simply do not have.
 */
const PRODUCTION_LOW_FACTOR = 0.6;
const PRODUCTION_HIGH_FACTOR = 1.4;

/** Harvest must exceed the top of the band by this much before it is a problem. */
const OVER_HARVEST_MARGIN = 1.1;
/** Below this share of capacity, the colony is bigger than it needs to be. */
const UNDER_USE_THRESHOLD = 0.25;

/** Not enough history to average a weekly rate from. */
const MIN_DAYS_FOR_RATE = 21;

const SEVERITY_RANK: Record<ColonyFindingSeverity, number> = {
  critical: 3,
  warning: 2,
  note: 1,
};

function monthsBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / DAY_MS / DAYS_PER_MONTH;
}

export function assessColony(input: ColonyInput): ColonyAssessment {
  const now = input.generatedAt ?? new Date();
  const profile = FEEDER_SPECIES[input.species];
  const ageMonths = Math.max(0, monthsBetween(now, input.startedOn));

  const harvests = input.events.filter((e) => e.kind === 'harvest');
  const totalHarvested = harvests.reduce((sum, e) => sum + Math.abs(e.countChange), 0);

  const totalSpent =
    (input.setupCost ?? 0) + input.events.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  // Measured from the first harvest, not from colony start — a colony left to
  // establish for three months would otherwise look like it was barely used.
  const firstHarvest = harvests
    .map((e) => e.date)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const harvestWindowDays = firstHarvest
    ? Math.max(1, (now.getTime() - firstHarvest.getTime()) / DAY_MS)
    : 0;

  const harvestPerWeek =
    firstHarvest && harvestWindowDays >= MIN_DAYS_FOR_RATE
      ? Number(((totalHarvested / harvestWindowDays) * 7).toFixed(1))
      : null;

  const females = input.breedingFemales;
  const sustainablePerWeek =
    females !== undefined && females > 0
      ? {
          low: Number(
            ((females * profile.offspringPerFemalePerMonth * PRODUCTION_LOW_FACTOR) / 4.35).toFixed(1)
          ),
          high: Number(
            ((females * profile.offspringPerFemalePerMonth * PRODUCTION_HIGH_FACTOR) / 4.35).toFixed(1)
          ),
        }
      : null;

  const costPerFeeder =
    totalHarvested > 0 && totalSpent > 0
      ? Number((totalSpent / totalHarvested).toFixed(3))
      : null;

  const findings: ColonyFinding[] = [];
  let verdict: ColonyVerdict = 'unknown';

  // --- Still establishing --------------------------------------------------
  if (ageMonths < profile.establishMonths) {
    verdict = 'establishing';
    const remaining = Math.ceil(profile.establishMonths - ageMonths);

    if (totalHarvested > 0) {
      // The central failure mode. Harvesting during establishment removes the
      // very animals whose offspring would have been the future harvest.
      findings.push({
        id: 'harvesting-too-early',
        severity: 'critical',
        title: `Harvesting a colony that is only ${ageMonths.toFixed(1)} months old`,
        detail: `${profile.label} take about ${profile.maturationMonths} months to reach feeder size, so anything you pull now is breeding stock rather than surplus. Every adult removed reduces what the colony can produce later, which is how colonies collapse suddenly rather than gradually.`,
        fix: `Buy feeders in for roughly ${remaining} more month${remaining === 1 ? '' : 's'} and leave this colony alone. It should then sustain itself.`,
      });
    } else {
      findings.push({
        id: 'establishing',
        severity: 'note',
        title: `Establishing — about ${remaining} month${remaining === 1 ? '' : 's'} to go`,
        detail: `${profile.note}`,
        fix: 'Keep feeding and heating it, but do not harvest yet.',
      });
    }
  }

  // --- Breeding ratio ------------------------------------------------------
  const males = input.breedingMales;
  if (females !== undefined && males !== undefined && females > 0) {
    const ratio = males > 0 ? females / males : Infinity;
    if (males === 0) {
      findings.push({
        id: 'no-males',
        severity: 'critical',
        title: 'No breeding males recorded',
        detail: 'Without males the colony cannot reproduce, and current stock will simply age out.',
        fix: `Add males to reach roughly 1 male per ${profile.femalesPerMale} females.`,
      });
    } else if (ratio > profile.femalesPerMale * 2) {
      findings.push({
        id: 'too-few-males',
        severity: 'warning',
        title: `About ${Math.round(ratio)} females per male`,
        detail: `${profile.label} do best near 1 male per ${profile.femalesPerMale} females. Too few males leaves females unmated and output below what the colony size suggests.`,
        fix: 'Add males, or expect production to run under the estimate below.',
      });
    } else if (ratio < 1) {
      findings.push({
        id: 'too-many-males',
        severity: 'note',
        title: 'More males than females',
        detail: 'Males eat and take space without adding to output, and can harass females.',
        fix: `Rebalance toward 1 male per ${profile.femalesPerMale} females.`,
      });
    }
  }

  // --- Sustainability ------------------------------------------------------
  if (harvestPerWeek !== null && sustainablePerWeek) {
    if (harvestPerWeek > sustainablePerWeek.high * OVER_HARVEST_MARGIN) {
      if (verdict !== 'establishing') verdict = 'over-harvesting';
      findings.push({
        id: 'over-harvesting',
        severity: 'critical',
        title: `Pulling ${harvestPerWeek}/week from a colony that replaces about ${sustainablePerWeek.low}–${sustainablePerWeek.high}`,
        detail:
          'You are removing feeders faster than this breeding stock can replace them. The colony will look healthy for a while and then drop off quickly, because the shortfall compounds each generation.',
        fix: 'Increase the breeding stock, run a second colony alongside this one, or buy in the difference.',
      });
    } else if (harvestPerWeek < sustainablePerWeek.low * UNDER_USE_THRESHOLD) {
      if (verdict !== 'establishing') verdict = 'under-used';
      findings.push({
        id: 'under-used',
        severity: 'note',
        title: 'Colony is much larger than your feeding needs',
        detail: `You pull about ${harvestPerWeek} a week from stock that could support ${sustainablePerWeek.low}–${sustainablePerWeek.high}. That is feed, heat and space spent on feeders you are not using.`,
        fix: 'Scale the colony down, or sell the surplus to other keepers locally.',
      });
    } else if (verdict !== 'establishing') {
      verdict = 'sustainable';
    }
  } else if (verdict !== 'establishing') {
    verdict = 'unknown';
  }

  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  return {
    verdict,
    ageMonths: Number(ageMonths.toFixed(1)),
    harvestPerWeek,
    sustainablePerWeek,
    totalHarvested,
    totalSpent: Number(totalSpent.toFixed(2)),
    costPerFeeder,
    findings,
    // Without either a harvest rate or a breeding estimate there is nothing to
    // judge sustainability from, whatever else was recorded.
    insufficientData: harvestPerWeek === null && sustainablePerWeek === null,
  };
}
