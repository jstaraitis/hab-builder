/**
 * Cost of keeping
 *
 * "What does this actually cost me per month?" is a question almost no keeper
 * can answer, because the spend arrives in unrelated lumps: an enclosure once,
 * a bulb twice a year, feeders every fortnight, a vet visit when something goes
 * wrong, and electricity continuously and invisibly.
 *
 * The invisible one usually dominates. A 100W basking lamp on twelve hours a
 * day costs more over a year than the animal did, and nobody notices because it
 * arrives inside a household bill. Surfacing that is the point of this engine.
 *
 * THREE RULES
 *
 *   1. ONE-OFF AND RECURRING ARE NEVER ADDED TOGETHER. A "total cost" that
 *      mixes a £300 enclosure with £4 of crickets tells you nothing. They are
 *      reported separately and only the recurring figure is projected forward.
 *   2. RECURRING EQUIPMENT IS AMORTISED. A £40 bulb replaced yearly is £3.33 a
 *      month, not £40 in whichever month you happened to buy it.
 *   3. THIS IS WHAT WAS RECORDED, NOT WHAT IT COSTS. Most keepers will not
 *      enter everything, so the output states its own coverage rather than
 *      presenting a partial figure as complete.
 */

export type CostCategory =
  | 'acquisition'
  | 'enclosure'
  | 'equipment'
  | 'consumables'
  | 'feeders'
  | 'veterinary'
  | 'electricity';

export interface OneOffCost {
  category: CostCategory;
  amount: number;
  date?: Date;
  label?: string;
}

export interface RecurringCost {
  category: CostCategory;
  amount: number;
  /** How often the amount recurs. Amortised to a monthly figure. */
  everyMonths: number;
  label?: string;
}

export interface PoweredDevice {
  label: string;
  watts: number;
  /** Hours per day the device draws power. Thermostatted devices cycle. */
  hoursPerDay: number;
  /**
   * Fraction of the time a thermostat actually lets it draw power. A basking
   * lamp on a dimming stat may only pull half its rated wattage over a day, so
   * assuming 100% would roughly double the estimate.
   */
  dutyCycle?: number;
}

export interface CostInput {
  oneOff?: OneOffCost[];
  recurring?: RecurringCost[];
  devices?: PoweredDevice[];
  /** Cost per kilowatt-hour in the keeper's currency. */
  electricityRate?: number;
  /** Feeders consumed per month and their unit cost, e.g. from a colony. */
  feedersPerMonth?: number;
  costPerFeeder?: number;
  /** How many animals this spend covers. Used only for the per-animal split. */
  animalCount?: number;
  currency?: string;
}

export interface CategoryTotal {
  category: CostCategory;
  monthly: number;
  /** Share of the recurring monthly total, 0-100. */
  sharePercent: number;
}

export interface CostBreakdown {
  currency: string;
  /** Spend that happened once — setup, the animal itself, past vet bills. */
  oneOffTotal: number;
  /** Everything ongoing, amortised to a month. */
  monthlyTotal: number;
  /** Straight ×12. Stated as a projection, never as a measurement. */
  annualProjection: number;
  perAnimalMonthly: number | null;
  categories: CategoryTotal[];
  /** The single largest recurring category — usually a surprise. */
  largestCategory: CategoryTotal | null;
  /** Categories with nothing recorded, so a gap never reads as £0 spent. */
  missingCategories: CostCategory[];
  /** True when too little is recorded for the total to mean anything. */
  insufficientData: boolean;
}

const DAYS_PER_MONTH = 30.44;
const WATTS_PER_KW = 1000;

/**
 * A thermostatted heat source spends much of its time off. Without a duty
 * cycle the estimate assumes continuous draw, which roughly doubles it for
 * anything on a stat — so the default is deliberately conservative rather than
 * worst-case.
 */
export const DEFAULT_DUTY_CYCLE = 0.6;

/** Below this many recorded categories, a total is more misleading than useful. */
const MIN_CATEGORIES = 2;

const ALL_CATEGORIES: CostCategory[] = [
  'acquisition',
  'enclosure',
  'equipment',
  'consumables',
  'feeders',
  'veterinary',
  'electricity',
];

/**
 * Energy a device uses in a month. Split out from the cost so the inventory
 * form can show a keeper what they just typed in kWh without needing a
 * tariff — and so the two can never drift apart.
 */
export function monthlyKwh(device: PoweredDevice): number {
  const duty = device.dutyCycle ?? DEFAULT_DUTY_CYCLE;
  const kwhPerDay = (device.watts / WATTS_PER_KW) * device.hoursPerDay * duty;
  return kwhPerDay * DAYS_PER_MONTH;
}

/** Monthly running cost of one device, from wattage, hours and duty cycle. */
export function monthlyElectricityCost(device: PoweredDevice, ratePerKwh: number): number {
  return monthlyKwh(device) * ratePerKwh;
}

export function buildCostBreakdown(input: CostInput): CostBreakdown {
  const currency = input.currency ?? '$';
  const monthlyByCategory = new Map<CostCategory, number>();

  const add = (category: CostCategory, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    monthlyByCategory.set(category, (monthlyByCategory.get(category) ?? 0) + amount);
  };

  // --- Recurring, amortised to a month -----------------------------------
  for (const item of input.recurring ?? []) {
    if (item.everyMonths <= 0) continue;
    add(item.category, item.amount / item.everyMonths);
  }

  // --- Electricity --------------------------------------------------------
  if (input.electricityRate !== undefined && input.electricityRate > 0) {
    for (const device of input.devices ?? []) {
      add('electricity', monthlyElectricityCost(device, input.electricityRate));
    }
  }

  // --- Feeders ------------------------------------------------------------
  if (input.feedersPerMonth !== undefined && input.costPerFeeder !== undefined) {
    add('feeders', input.feedersPerMonth * input.costPerFeeder);
  }

  const monthlyTotal = [...monthlyByCategory.values()].reduce((sum, v) => sum + v, 0);

  const categories: CategoryTotal[] = [...monthlyByCategory.entries()]
    .map(([category, monthly]) => ({
      category,
      monthly: Number(monthly.toFixed(2)),
      sharePercent: monthlyTotal > 0 ? Math.round((monthly / monthlyTotal) * 100) : 0,
    }))
    .sort((a, b) => b.monthly - a.monthly);

  const oneOffTotal = (input.oneOff ?? []).reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) && item.amount > 0 ? item.amount : 0),
    0
  );

  // Categories with no data are listed rather than shown as zero — "you have
  // not recorded vet costs" and "you have spent nothing on vets" are very
  // different statements.
  const recorded = new Set<CostCategory>([
    ...monthlyByCategory.keys(),
    ...(input.oneOff ?? []).map((item) => item.category),
  ]);
  const missingCategories = ALL_CATEGORIES.filter((c) => !recorded.has(c));

  const animalCount = input.animalCount ?? 0;

  return {
    currency,
    oneOffTotal: Number(oneOffTotal.toFixed(2)),
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
    // Deliberately a plain ×12 rather than anything cleverer. A seasonal model
    // would imply the data supports one, and it does not.
    annualProjection: Number((monthlyTotal * 12).toFixed(2)),
    perAnimalMonthly:
      animalCount > 0 ? Number((monthlyTotal / animalCount).toFixed(2)) : null,
    categories,
    largestCategory: categories[0] ?? null,
    missingCategories,
    insufficientData: recorded.size < MIN_CATEGORIES,
  };
}
