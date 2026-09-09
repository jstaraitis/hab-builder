/**
 * UVB bulb lifecycle
 *
 * A UVB bulb keeps producing visible light long after its UV output has fallen
 * below a therapeutic level. A keeper doing everything else right can give an
 * animal metabolic bone disease with a bulb that looks like it's working, so
 * the only reliable signal is elapsed time since installation.
 *
 * Lifespan varies by roughly 2x across bulb technologies, which is why this
 * engine keys off bulb type rather than a single global interval.
 */

export type UvbBulbType =
  | 'compact'
  | 't8'
  | 't5-ho'
  | 'mercury-vapor'
  | 'metal-halide'
  | 'unknown';

export interface UvbBulbSpec {
  id: UvbBulbType;
  label: string;
  /** Manufacturer-stated useful UV life. Conservative where sources disagree. */
  lifespanMonths: number;
  /** Shown in the picker so keepers can identify what they actually own. */
  hint: string;
  /** Feeds the Amazon affiliate search for a replacement. */
  searchQuery: string;
}

export const UVB_BULB_SPECS: Record<UvbBulbType, UvbBulbSpec> = {
  'compact': {
    id: 'compact',
    label: 'Compact / Coil',
    lifespanMonths: 6,
    hint: 'Screws into a dome fixture like a normal bulb',
    searchQuery: 'reptile compact UVB bulb 10.0',
  },
  't8': {
    id: 't8',
    label: 'T8 Linear Tube',
    lifespanMonths: 6,
    hint: 'Long tube, about 1 inch thick',
    searchQuery: 'reptile T8 UVB fluorescent tube',
  },
  't5-ho': {
    id: 't5-ho',
    label: 'T5 HO Linear Tube',
    lifespanMonths: 12,
    hint: 'Long tube, about 5/8 inch thick — thinner than a T8',
    searchQuery: 'reptile T5 HO UVB fluorescent tube',
  },
  'mercury-vapor': {
    id: 'mercury-vapor',
    label: 'Mercury Vapor',
    lifespanMonths: 12,
    hint: 'Single bulb providing both heat and UVB',
    searchQuery: 'reptile mercury vapor UVB bulb',
  },
  'metal-halide': {
    id: 'metal-halide',
    label: 'Metal Halide',
    lifespanMonths: 12,
    hint: 'High-output flood bulb, needs a dedicated fixture',
    searchQuery: 'reptile metal halide UVB bulb',
  },
  'unknown': {
    id: 'unknown',
    label: "I'm not sure",
    // Deliberately the shortest lifespan: replacing early wastes money,
    // replacing late costs the animal its bone density.
    lifespanMonths: 6,
    hint: "We'll assume 6 months, the shortest common lifespan",
    searchQuery: 'reptile UVB bulb',
  },
};

/** Picker order — most common first, with the fallback last. */
export const UVB_BULB_TYPE_ORDER: UvbBulbType[] = [
  't5-ho',
  'compact',
  't8',
  'mercury-vapor',
  'metal-halide',
  'unknown',
];

export type UvbLifecycleState = 'fresh' | 'good' | 'due-soon' | 'overdue' | 'critical';

export interface UvbLifecycleStatus {
  spec: UvbBulbSpec;
  installedOn: Date;
  replaceDueOn: Date;
  daysInstalled: number;
  /** Negative once the replacement date has passed. */
  daysRemaining: number;
  /** 0-100, clamped, for progress bars. */
  percentElapsed: number;
  state: UvbLifecycleState;
  headline: string;
  detail: string;
}

const MS_PER_DAY = 86_400_000;

export function resolveBulbSpec(type: UvbBulbType | null | undefined): UvbBulbSpec {
  return UVB_BULB_SPECS[type ?? 'unknown'] ?? UVB_BULB_SPECS.unknown;
}

/** Replacement date implied by install date + bulb type. */
export function calculateReplaceDueOn(
  installedOn: Date,
  type: UvbBulbType | null | undefined
): Date {
  const spec = resolveBulbSpec(type);
  const due = new Date(installedOn);
  due.setMonth(due.getMonth() + spec.lifespanMonths);
  return due;
}

function describe(
  state: UvbLifecycleState,
  spec: UvbBulbSpec,
  monthsInstalled: number,
  daysRemaining: number
): { headline: string; detail: string } {
  const overdueDays = Math.abs(daysRemaining);

  switch (state) {
    case 'critical':
      return {
        headline: `Replace this bulb now`,
        detail: `It went in ${monthsInstalled} months ago — ${overdueDays} days past its ${spec.lifespanMonths}-month life. It may be emitting little to no usable UVB, even though it still lights up.`,
      };
    case 'overdue':
      return {
        headline: `Bulb is ${overdueDays} days overdue`,
        detail: `UV output drops off well before a bulb stops glowing. Replacing it now restores the UVB your animal needs to process calcium.`,
      };
    case 'due-soon':
      return {
        headline: `Replace in ${daysRemaining} days`,
        detail: `This ${spec.label} bulb is nearing the end of its ${spec.lifespanMonths}-month UV life. Ordering now avoids a gap in coverage.`,
      };
    case 'good':
      return {
        headline: `${daysRemaining} days of UV life left`,
        detail: `Installed ${monthsInstalled} months ago. Still well within its ${spec.lifespanMonths}-month rating.`,
      };
    default:
      return {
        headline: `${daysRemaining} days of UV life left`,
        detail: `This bulb is fresh. We'll tell you when it's time to replace it.`,
      };
  }
}

/**
 * Returns null when there's no bulb on record — callers should prompt for an
 * install date rather than rendering an empty state.
 */
export function getUvbLifecycleStatus(
  installedOn: Date | string | null | undefined,
  type: UvbBulbType | null | undefined,
  now: Date = new Date()
): UvbLifecycleStatus | null {
  if (!installedOn) return null;

  const installed = installedOn instanceof Date ? installedOn : new Date(installedOn);
  if (Number.isNaN(installed.getTime())) return null;

  const spec = resolveBulbSpec(type);
  const replaceDueOn = calculateReplaceDueOn(installed, spec.id);

  const daysInstalled = Math.max(0, Math.floor((now.getTime() - installed.getTime()) / MS_PER_DAY));
  const daysRemaining = Math.ceil((replaceDueOn.getTime() - now.getTime()) / MS_PER_DAY);
  const totalDays = Math.max(1, Math.round((replaceDueOn.getTime() - installed.getTime()) / MS_PER_DAY));

  const rawPercent = (daysInstalled / totalDays) * 100;
  const percentElapsed = Math.min(100, Math.max(0, Math.round(rawPercent)));

  let state: UvbLifecycleState;
  if (rawPercent >= 133) state = 'critical';
  else if (rawPercent >= 100) state = 'overdue';
  else if (rawPercent >= 80) state = 'due-soon';
  else if (rawPercent >= 50) state = 'good';
  else state = 'fresh';

  const monthsInstalled = Math.max(1, Math.round(daysInstalled / 30));
  const { headline, detail } = describe(state, spec, monthsInstalled, daysRemaining);

  return {
    spec,
    installedOn: installed,
    replaceDueOn,
    daysInstalled,
    daysRemaining,
    percentElapsed,
    state,
    headline,
    detail,
  };
}

/** True once the keeper should be actively told to act. */
export function isReplacementDue(status: UvbLifecycleStatus | null): boolean {
  if (!status) return false;
  return status.state === 'due-soon' || status.state === 'overdue' || status.state === 'critical';
}
