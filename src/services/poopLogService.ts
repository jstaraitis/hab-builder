import { supabase } from '../lib/supabase';

export interface PoopLog {
  id: string;
  enclosureAnimalId: string;
  userId: string;
  loggedAt: string;
  consistency?: 'normal' | 'soft' | 'runny' | 'hard' | 'dry' | 'watery' | 'mucus' | 'bloody' | 'unknown';
  color?: string;
  amount?: 'small' | 'medium' | 'large' | 'unknown';
  uratePresent?: boolean;
  parasitesSeen?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoopLogInput {
  enclosureAnimalId: string;
  loggedAt?: string;
  consistency?: PoopLog['consistency'];
  color?: string;
  amount?: PoopLog['amount'];
  uratePresent?: boolean;
  parasitesSeen?: boolean;
  notes?: string;
}

class PoopLogService {
  async getRecentLogs(enclosureAnimalId: string, limit: number = 10): Promise<PoopLog[]> {
    const { data, error } = await supabase
      .from('poop_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async createLog(userId: string, input: PoopLogInput): Promise<PoopLog> {
    const { data, error } = await supabase
      .from('poop_logs')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        logged_at: input.loggedAt || new Date().toISOString(),
        consistency: input.consistency,
        color: input.color,
        amount: input.amount,
        urate_present: input.uratePresent,
        parasites_seen: input.parasitesSeen,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async deleteLog(logId: string): Promise<void> {
    const { error } = await supabase
      .from('poop_logs')
      .delete()
      .eq('id', logId);

    if (error) throw error;
  }

  private mapFromDb(row: any): PoopLog {
    return {
      id: row.id,
      enclosureAnimalId: row.enclosure_animal_id,
      userId: row.user_id,
      loggedAt: row.logged_at,
      consistency: row.consistency,
      color: row.color,
      amount: row.amount,
      uratePresent: row.urate_present,
      parasitesSeen: row.parasites_seen,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const poopLogService = new PoopLogService();
