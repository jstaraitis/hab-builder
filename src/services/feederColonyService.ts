import { supabase } from '../lib/supabase';
import {
  assessColony,
  type ColonyAssessment,
  type ColonyEvent,
  type FeederSpecies,
} from '../engine/feederColony';

/**
 * Feeder colonies and their harvest history.
 *
 * Colony counts are stored as the keeper's most recent ESTIMATE with the date
 * they made it, not as a running total maintained by the app. Nobody counts a
 * roach bin exactly, and a running count would imply a precision the
 * sustainability maths does not have — it would also drift wrong forever after
 * a single mis-entered harvest.
 */

export interface FeederColony {
  id: string;
  userId: string;
  name: string;
  species: FeederSpecies;
  startedOn: Date;
  breedingFemales?: number;
  breedingMales?: number;
  countedOn?: Date;
  setupCost?: number;
  notes?: string;
  isActive: boolean;
}

export interface ColonyWithAssessment {
  colony: FeederColony;
  events: ColonyEvent[];
  assessment: ColonyAssessment;
}

export interface ColonyEventInput {
  colonyId: string;
  eventDate: Date;
  kind: ColonyEvent['kind'];
  /** Always positive from the UI; the sign is applied here from `kind`. */
  count: number;
  cost?: number;
  notes?: string;
}

interface ColonyRow {
  id: string;
  user_id: string;
  name: string;
  species: string;
  started_on: string;
  breeding_females: number | null;
  breeding_males: number | null;
  counted_on: string | null;
  setup_cost: number | null;
  notes: string | null;
  is_active: boolean;
}

interface EventRow {
  event_date: string;
  kind: string;
  count_change: number;
  cost: number | null;
  notes: string | null;
}

function orUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function mapColony(row: ColonyRow): FeederColony {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    species: row.species as FeederSpecies,
    startedOn: new Date(row.started_on),
    breedingFemales: orUndefined(row.breeding_females),
    breedingMales: orUndefined(row.breeding_males),
    countedOn: row.counted_on ? new Date(row.counted_on) : undefined,
    setupCost: orUndefined(row.setup_cost),
    notes: orUndefined(row.notes),
    isActive: row.is_active,
  };
}

function mapEvent(row: EventRow): ColonyEvent {
  return {
    date: new Date(row.event_date),
    countChange: row.count_change,
    kind: row.kind as ColonyEvent['kind'],
    cost: orUndefined(row.cost),
    notes: orUndefined(row.notes),
  };
}

/** A date-only column; sending a full timestamp shifts it a day in some zones. */
function toDateOnly(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

class FeederColonyService {
  async getColonies(userId: string): Promise<FeederColony[]> {
    const { data, error } = await supabase
      .from('feeder_colonies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ColonyRow[]).map(mapColony);
  }

  async getEvents(colonyId: string): Promise<ColonyEvent[]> {
    const { data, error } = await supabase
      .from('colony_events')
      .select('event_date, kind, count_change, cost, notes')
      .eq('colony_id', colonyId)
      .order('event_date', { ascending: false })
      .limit(500);

    if (error) throw error;
    return ((data ?? []) as EventRow[]).map(mapEvent);
  }

  /** One colony with its history and verdict. */
  async getWithAssessment(colony: FeederColony, now?: Date): Promise<ColonyWithAssessment> {
    let events: ColonyEvent[] = [];
    try {
      events = await this.getEvents(colony.id);
    } catch (error) {
      // A colony that cannot load its history is still worth showing — the
      // assessment simply reports insufficient data rather than failing.
      console.error('[colony] failed to load events:', error);
    }

    return {
      colony,
      events,
      assessment: assessColony({
        species: colony.species,
        startedOn: colony.startedOn,
        breedingFemales: colony.breedingFemales,
        breedingMales: colony.breedingMales,
        setupCost: colony.setupCost,
        events,
        generatedAt: now,
      }),
    };
  }

  async createColony(
    userId: string,
    input: Omit<FeederColony, 'id' | 'userId' | 'isActive'>
  ): Promise<FeederColony> {
    const { data, error } = await supabase
      .from('feeder_colonies')
      .insert({
        user_id: userId,
        name: input.name,
        species: input.species,
        started_on: toDateOnly(input.startedOn),
        breeding_females: input.breedingFemales ?? null,
        breeding_males: input.breedingMales ?? null,
        counted_on: input.countedOn ? toDateOnly(input.countedOn) : null,
        setup_cost: input.setupCost ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapColony(data as ColonyRow);
  }

  async updateCounts(
    colonyId: string,
    counts: { breedingFemales?: number; breedingMales?: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('feeder_colonies')
      .update({
        breeding_females: counts.breedingFemales ?? null,
        breeding_males: counts.breedingMales ?? null,
        // Stamped so the UI can say how old the estimate is. A six-month-old
        // count driving a sustainability verdict should be visibly stale.
        counted_on: toDateOnly(new Date()),
        updated_at: new Date().toISOString(),
      })
      .eq('id', colonyId);

    if (error) throw error;
  }

  async addEvent(userId: string, input: ColonyEventInput): Promise<void> {
    // The UI collects a positive number; direction belongs to the event kind,
    // so it is applied once here rather than trusted from the caller.
    const magnitude = Math.abs(input.count);
    const signed = input.kind === 'purchase' ? magnitude : -magnitude;

    const { error } = await supabase.from('colony_events').insert({
      colony_id: input.colonyId,
      user_id: userId,
      event_date: toDateOnly(input.eventDate),
      kind: input.kind,
      count_change: input.kind === 'count' ? magnitude : signed,
      cost: input.cost ?? null,
      notes: input.notes ?? null,
    });

    if (error) throw error;
  }

  async archiveColony(colonyId: string): Promise<void> {
    const { error } = await supabase
      .from('feeder_colonies')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', colonyId);

    if (error) throw error;
  }
}

export const feederColonyService = new FeederColonyService();
