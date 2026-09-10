import { supabase } from '../lib/supabase';

export interface FeedingLog {
  id: string;
  userId: string;
  enclosureId?: string;
  /** The specific animal this log describes. Undefined means enclosure-level. */
  enclosureAnimalId?: string;
  careTaskId?: string;
  completedAt: string;
  feederType?: string;
  quantityOffered?: number;
  quantityEaten?: number;
  supplementUsed?: string;
  refusalNoted?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedingLogInput {
  enclosureAnimalId?: string;
  careTaskId?: string;
  enclosureId?: string;
  loggedAt?: string;
  feederType?: string;
  quantityOffered?: string;
  quantityEaten?: string;
  supplementUsed?: string;
  refusalNoted?: boolean;
  notes?: string;
}

const LOG_COLUMNS =
  'id, user_id, enclosure_id, enclosure_animal_id, completed_at, feeder_type, quantity_offered, quantity_eaten, refusal_noted, supplement_used, notes, task_id';

/** What a set of feeding logs actually describes. */
export interface FeedingLogScope {
  logs: FeedingLog[];
  /**
   * True when some returned logs are not attributed to a specific animal and
   * the enclosure holds more than one, so the set describes the group.
   */
  includesGroupLevelLogs: boolean;
  /** How many of the returned logs name this animal explicitly. */
  attributedCount: number;
}

class FeedingLogService {
  async getRecentLogs(enclosureId: string | undefined, limit?: number): Promise<FeedingLog[]> {
    if (!enclosureId) return [];

    let query = supabase
      .from('care_logs')
      .select(LOG_COLUMNS)
      .eq('enclosure_id', enclosureId)
      .or('feeder_type.not.is.null,task_id.is.null')
      .order('completed_at', { ascending: false });

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((row) => this.mapFromDb(row));
  }

  /**
   * Feeding history for one animal.
   *
   * Returns logs naming this animal, plus any unattributed logs from its
   * enclosure — those predate attribution or were entered against the
   * enclosure as a whole, and dropping them would silently shorten the
   * animal's history. The caller is told how much of the set is group-level so
   * it can say so rather than implying a precision the data does not have.
   *
   * In a single-animal enclosure the unattributed logs genuinely are this
   * animal's, so no caveat is raised.
   */
  async getLogsForAnimal(
    enclosureAnimalId: string,
    enclosureId: string | undefined,
    options: { limit?: number; enclosureAnimalCount?: number } = {}
  ): Promise<FeedingLogScope> {
    const { limit, enclosureAnimalCount } = options;

    // Without an enclosure there is nothing to fall back to, so this is simply
    // every log naming the animal.
    const filter = enclosureId
      ? `enclosure_animal_id.eq.${enclosureAnimalId},and(enclosure_id.eq.${enclosureId},enclosure_animal_id.is.null)`
      : `enclosure_animal_id.eq.${enclosureAnimalId}`;

    let query = supabase
      .from('care_logs')
      .select(LOG_COLUMNS)
      .or(filter)
      .not('feeder_type', 'is', null)
      .order('completed_at', { ascending: false });

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = (data || []).map((row) => this.mapFromDb(row));
    const attributedCount = logs.filter((log) => log.enclosureAnimalId === enclosureAnimalId).length;
    const unattributedCount = logs.length - attributedCount;

    return {
      logs,
      // Only a genuine ambiguity: unattributed logs in an enclosure that holds
      // more than one animal. One animal means no ambiguity to disclose.
      includesGroupLevelLogs: unattributedCount > 0 && (enclosureAnimalCount ?? 1) > 1,
      attributedCount,
    };
  }

  async createLog(userId: string, input: FeedingLogInput): Promise<FeedingLog> {
    const { data, error } = await supabase
      .from('care_logs')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        // Was accepted on the input type but silently dropped here, so every
        // manually created feeding log landed unattributed.
        enclosure_animal_id: input.enclosureAnimalId ?? null,
        task_id: input.careTaskId,
        completed_at: input.loggedAt || new Date().toISOString(),
        feeder_type: input.feederType,
        quantity_offered: input.quantityOffered ? parseInt(input.quantityOffered, 10) : null,
        quantity_eaten: input.quantityEaten ? parseInt(input.quantityEaten, 10) : null,
        refusal_noted: input.refusalNoted || false,
        supplement_used: input.supplementUsed,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async deleteLog(logId: string): Promise<void> {
    const { error } = await supabase
      .from('care_logs')
      .delete()
      .eq('id', logId);

    if (error) throw error;
  }

  private mapFromDb(row: any): FeedingLog {
    return {
      id: row.id,
      userId: row.user_id,
      enclosureId: row.enclosure_id,
      enclosureAnimalId: row.enclosure_animal_id ?? undefined,
      careTaskId: row.task_id,
      completedAt: row.completed_at,
      feederType: row.feeder_type,
      quantityOffered: row.quantity_offered,
      quantityEaten: row.quantity_eaten,
      supplementUsed: row.supplement_used,
      refusalNoted: row.refusal_noted,
      notes: row.notes,
    };
  }
}

export const feedingLogService = new FeedingLogService();
