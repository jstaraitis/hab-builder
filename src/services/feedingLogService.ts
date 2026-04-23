import { supabase } from '../lib/supabase';

export interface FeedingLog {
  id: string;
  userId: string;
  enclosureId?: string;
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

class FeedingLogService {
  async getRecentLogs(enclosureId: string | undefined, limit: number = 10): Promise<FeedingLog[]> {
    if (!enclosureId) return [];
    
    // Query care_logs where feeder_type is not null (feeding logs) for this enclosure
    const { data, error } = await supabase
      .from('care_logs')
      .select('id, user_id, completed_at, feeder_type, quantity_offered, quantity_eaten, refusal_noted, supplement_used, notes, task_id')
      .eq('enclosure_id', enclosureId)
      .not('feeder_type', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async createLog(userId: string, input: FeedingLogInput): Promise<FeedingLog> {
    const { data, error } = await supabase
      .from('care_logs')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
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
