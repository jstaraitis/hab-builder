import { supabase } from '../lib/supabase';
import { enclosureAnimalService } from './enclosureAnimalService';
import { vetRecordService } from './vetRecordService';
import { feederColonyService } from './feederColonyService';
import { assessColony } from '../engine/feederColony';
import {
  buildCostBreakdown,
  type CostBreakdown,
  type CostInput,
  type OneOffCost,
  type PoweredDevice,
  type RecurringCost,
} from '../engine/costOfKeeping';
import type { InventoryCategory } from '../types/inventory';

/**
 * Gathers everything the cost engine needs from across the app.
 *
 * Costs are scattered by nature — the animal's price sits on the animal, vet
 * bills on vet records, consumables on inventory, feeders in a colony, and
 * electricity nowhere at all until someone records a wattage. Pulling them
 * together is most of the work; the engine only does the arithmetic.
 */

export interface CostBundle {
  breakdown: CostBreakdown;
  /** Devices found with a wattage, so the UI can show what is being counted. */
  devices: PoweredDevice[];
  /** True when no electricity rate is set, so that whole category is missing. */
  missingElectricityRate: boolean;
  failedStreams: string[];
}

/** How often each inventory frequency recurs, in months. */
const FREQUENCY_MONTHS: Record<string, number> = {
  daily: 1 / 30.44,
  'every-other-day': 2 / 30.44,
  'twice-weekly': 0.5 / 4.35,
  weekly: 1 / 4.35,
  'bi-weekly': 2 / 4.35,
  monthly: 1,
};

/**
 * Inventory categories mapped onto cost categories. Equipment is a durable
 * thing replaced occasionally; consumables get used up. They behave differently
 * enough in a monthly budget to be worth separating.
 */
const CATEGORY_MAP: Record<InventoryCategory, 'equipment' | 'consumables'> = {
  supplement: 'consumables',
  bulb: 'equipment',
  substrate: 'consumables',
  'filter-media': 'consumables',
  'water-conditioner': 'consumables',
  food: 'consumables',
  heater: 'equipment',
  uvb: 'equipment',
  lighting: 'equipment',
  cleaning: 'consumables',
  other: 'consumables',
};

interface InventoryCostRow {
  title: string;
  category: string;
  unit_cost: number | null;
  watts: number | null;
  hours_per_day: number | null;
  duty_cycle: number | null;
  reminder_frequency: string;
  custom_frequency_days: number | null;
}

async function attempt<T>(label: string, failed: string[], fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[cost] failed to load ${label}:`, error);
    failed.push(label);
    return fallback;
  }
}

class CostOfKeepingService {
  async build(userId: string): Promise<CostBundle> {
    const failedStreams: string[] = [];

    const [profile, animals, vetRecords, inventory, colonies] = await Promise.all([
      attempt(
        'settings',
        failedStreams,
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('electricity_rate, currency_code')
            .eq('id', userId)
            .maybeSingle<{ electricity_rate: number | null; currency_code: string | null }>();
          if (error) throw error;
          return data;
        },
        null
      ),
      attempt('animals', failedStreams, () => enclosureAnimalService.getAllUserAnimals(userId), []),
      attempt('vet records', failedStreams, () => vetRecordService.getRecordsByUser(userId), []),
      attempt(
        'inventory',
        failedStreams,
        async () => {
          const { data, error } = await supabase
            .from('inventory_items')
            .select(
              'title, category, unit_cost, watts, hours_per_day, duty_cycle, reminder_frequency, custom_frequency_days'
            )
            .eq('user_id', userId)
            .eq('is_active', true);
          if (error) throw error;
          return (data ?? []) as InventoryCostRow[];
        },
        []
      ),
      attempt('colonies', failedStreams, () => feederColonyService.getColonies(userId), []),
    ]);

    const oneOff: OneOffCost[] = [];
    const recurring: RecurringCost[] = [];
    const devices: PoweredDevice[] = [];

    // --- What the animals themselves cost ---------------------------------
    for (const animal of animals) {
      if (animal.acquisitionPrice && animal.acquisitionPrice > 0) {
        oneOff.push({
          category: 'acquisition',
          amount: animal.acquisitionPrice,
          date: animal.acquisitionDate,
          label: animal.name,
        });
      }
    }

    // --- Vet bills are one-off by nature, not a monthly subscription -------
    for (const record of vetRecords) {
      if (record.cost && record.cost > 0) {
        oneOff.push({
          category: 'veterinary',
          amount: record.cost,
          date: new Date(record.visitDate),
          label: record.visitType,
        });
      }
    }

    // --- Inventory: recurring spend and power draw ------------------------
    for (const item of inventory) {
      const everyMonths =
        item.reminder_frequency === 'custom' && item.custom_frequency_days
          ? item.custom_frequency_days / 30.44
          : FREQUENCY_MONTHS[item.reminder_frequency];

      if (item.unit_cost && item.unit_cost > 0 && everyMonths && everyMonths > 0) {
        recurring.push({
          category: CATEGORY_MAP[item.category as InventoryCategory] ?? 'consumables',
          amount: item.unit_cost,
          everyMonths,
          label: item.title,
        });
      }

      // A wattage with no runtime cannot be costed, so it is skipped rather
      // than assumed to run all day.
      if (item.watts && item.watts > 0 && item.hours_per_day && item.hours_per_day > 0) {
        devices.push({
          label: item.title,
          watts: item.watts,
          hoursPerDay: item.hours_per_day,
          dutyCycle: item.duty_cycle ?? undefined,
        });
      }
    }

    // --- Feeders, priced from the keeper's own colony ----------------------
    let feedersPerMonth: number | undefined;
    let costPerFeeder: number | undefined;

    for (const colony of colonies) {
      const events = await attempt(
        'colony history',
        failedStreams,
        () => feederColonyService.getEvents(colony.id),
        []
      );
      const assessment = assessColony({
        species: colony.species,
        startedOn: colony.startedOn,
        breedingFemales: colony.breedingFemales,
        breedingMales: colony.breedingMales,
        setupCost: colony.setupCost,
        events,
      });

      if (assessment.harvestPerWeek !== null) {
        feedersPerMonth = (feedersPerMonth ?? 0) + assessment.harvestPerWeek * 4.35;
      }
      // Weighted averaging across colonies would be more precise, but with the
      // handful of colonies a keeper runs the last value is close enough and
      // far easier to explain.
      if (assessment.costPerFeeder !== null) costPerFeeder = assessment.costPerFeeder;

      if (colony.setupCost && colony.setupCost > 0) {
        oneOff.push({ category: 'feeders', amount: colony.setupCost, label: colony.name });
      }
    }

    const electricityRate = profile?.electricity_rate ?? undefined;

    const input: CostInput = {
      oneOff,
      recurring,
      devices,
      electricityRate: electricityRate ?? undefined,
      feedersPerMonth,
      costPerFeeder,
      animalCount: animals.length,
      currency: profile?.currency_code ?? '$',
    };

    return {
      breakdown: buildCostBreakdown(input),
      devices,
      missingElectricityRate: !electricityRate || electricityRate <= 0,
      failedStreams,
    };
  }

  /**
   * Only the keys actually passed are written. Coalescing both to null would
   * mean saving an electricity rate silently wiped the currency, which is the
   * kind of bug that surfaces months later as "why is everything in dollars".
   */
  async saveSettings(
    userId: string,
    settings: { electricityRate?: number; currencyCode?: string }
  ): Promise<void> {
    const patch: Record<string, number | string> = {};
    if (settings.electricityRate !== undefined) patch.electricity_rate = settings.electricityRate;
    if (settings.currencyCode !== undefined) patch.currency_code = settings.currencyCode;
    if (Object.keys(patch).length === 0) return;

    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);

    if (error) throw error;
  }
}

export const costOfKeepingService = new CostOfKeepingService();
