import type { InventoryCategory, InventoryFrequency } from '../types/inventory';

export const CATEGORY_OPTIONS: { readonly value: InventoryCategory; readonly label: string }[] = [
  { value: 'supplement', label: 'Supplement' },
  { value: 'bulb', label: 'Bulb' },
  { value: 'uvb', label: 'UVB' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'substrate', label: 'Substrate' },
  { value: 'filter-media', label: 'Filter Media' },
  { value: 'water-conditioner', label: 'Water Conditioner' },
  { value: 'food', label: 'Food' },
  { value: 'heater', label: 'Heater' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' }
];

export const FREQUENCY_OPTIONS: { readonly value: InventoryFrequency; readonly label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every other day' },
  { value: 'twice-weekly', label: 'Twice weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' }
];

export interface InventoryFormState {
  title: string;
  category: InventoryCategory;
  brand: string;
  lastReplacedAt: string;
  reminderFrequency: InventoryFrequency;
  customFrequencyDays: string;
  reminderTime: string;
  buyAgainUrl: string;
  notes: string;
  /** Cost and power are kept as strings so an empty field stays empty. */
  unitCost: string;
  watts: string;
  hoursPerDay: string;
  /** Entered as a percentage; stored as a 0-1 fraction. */
  dutyCyclePercent: string;
}

export const EMPTY_INVENTORY_FORM: InventoryFormState = {
  title: '',
  category: 'supplement',
  brand: '',
  lastReplacedAt: '',
  reminderFrequency: 'monthly',
  customFrequencyDays: '30',
  reminderTime: '09:00',
  buyAgainUrl: '',
  notes: '',
  unitCost: '',
  watts: '',
  hoursPerDay: '',
  dutyCyclePercent: ''
};

/**
 * Categories that plug into the wall. Only these open the power fields by
 * default — asking for the wattage of a bag of substrate is noise. Anything
 * else can still be marked as powered by hand, because a fogger, pump or
 * thermostat lands under "other".
 */
export const POWERED_CATEGORIES: ReadonlySet<InventoryCategory> = new Set<InventoryCategory>([
  'bulb',
  'uvb',
  'lighting',
  'heater'
]);

/**
 * Bounds mirroring the inventory_power_sane constraint in the database. They
 * are repeated here so a typo comes back as a sentence rather than a Postgres
 * error the keeper cannot read; the constraint remains the real guard.
 */
const MAX_WATTS = 5000;
const MAX_HOURS_PER_DAY = 24;

export interface ParsedInventoryCosts {
  unitCost: number | null;
  watts: number | null;
  hoursPerDay: number | null;
  dutyCycle: number | null;
}

export interface ParsedCostResult {
  /**
   * Null when everything entered is valid. A discriminated union would read
   * better, but this project compiles with strict mode off, where narrowing on
   * a boolean literal is not reliable.
   */
  error: string | null;
  values: ParsedInventoryCosts;
}

const NOTHING_RECORDED: ParsedInventoryCosts = {
  unitCost: null,
  watts: null,
  hoursPerDay: null,
  dutyCycle: null
};

/** Blank means "not recorded", which is different from zero and stays null. */
function readOptionalNumber(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export function parseInventoryCosts(form: InventoryFormState): ParsedCostResult {
  const reject = (message: string): ParsedCostResult => ({ error: message, values: NOTHING_RECORDED });

  const unitCost = readOptionalNumber(form.unitCost);
  if (unitCost === undefined) return reject('Cost must be a number.');
  if (unitCost !== null && unitCost < 0) return reject('Cost cannot be negative.');

  const watts = readOptionalNumber(form.watts);
  if (watts === undefined) return reject('Wattage must be a number.');
  if (watts !== null && (watts < 0 || watts > MAX_WATTS)) {
    return reject(`Wattage must be between 0 and ${MAX_WATTS}.`);
  }

  const hoursPerDay = readOptionalNumber(form.hoursPerDay);
  if (hoursPerDay === undefined) return reject('Hours per day must be a number.');
  if (hoursPerDay !== null && (hoursPerDay < 0 || hoursPerDay > MAX_HOURS_PER_DAY)) {
    return reject('Hours per day must be between 0 and 24.');
  }

  const percent = readOptionalNumber(form.dutyCyclePercent);
  if (percent === undefined) return reject('Duty cycle must be a number.');
  if (percent !== null && (percent <= 0 || percent > 100)) {
    return reject('Duty cycle must be between 1 and 100 percent.');
  }

  return {
    error: null,
    values: {
      unitCost,
      watts,
      hoursPerDay,
      // The database stores a fraction, and rejects 0 outright.
      dutyCycle: percent === null ? null : percent / 100
    }
  };
}

export function calculateNextDueDate(
  frequency: InventoryFrequency,
  customDays: number | undefined,
  reminderTime: string | undefined,
  from: Date
): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'every-other-day':
      next.setDate(next.getDate() + 2);
      break;
    case 'twice-weekly':
      next.setDate(next.getDate() + 3);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      next.setDate(next.getDate() + (customDays || 1));
      break;
  }

  if (reminderTime) {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);
  }

  return next;
}
