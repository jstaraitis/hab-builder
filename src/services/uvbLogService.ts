import { supabase } from '../lib/supabase';

export interface UvbLog {
  id: string;
  enclosureId?: string;
  enclosureAnimalId: string;
  userId: string;
  recordedAt: string;
  uvIndex?: number;
  bulbType?: string;
  zone?: 'basking' | 'ambient' | 'other';
  distanceCm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UvbLogInput {
  enclosureId?: string;
  enclosureAnimalId: string;
  recordedAt?: string;
  uvIndex?: number;
  bulbType?: string;
  zone?: UvbLog['zone'];
  distanceCm?: number;
  notes?: string;
}

class UvbLogService {
  async getRecentLogsForEnclosure(enclosureId: string, limit: number = 10): Promise<UvbLog[]> {
    const { data, error } = await supabase
      .from('uvb_logs')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getRecentLogs(enclosureAnimalId: string, limit: number = 10): Promise<UvbLog[]> {
    const { data, error } = await supabase
      .from('uvb_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async createLog(userId: string, input: UvbLogInput): Promise<UvbLog> {
    const { data, error } = await supabase
      .from('uvb_logs')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        enclosure_animal_id: input.enclosureAnimalId,
        recorded_at: input.recordedAt || new Date().toISOString(),
        uv_index: input.uvIndex,
        bulb_type: input.bulbType,
        zone: input.zone,
        distance_cm: input.distanceCm,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async updateLog(id: string, updates: Partial<UvbLogInput>): Promise<UvbLog> {
    const payload: Record<string, unknown> = {};

    if (updates.enclosureId !== undefined) payload.enclosure_id = updates.enclosureId;
    if (updates.enclosureAnimalId !== undefined) payload.enclosure_animal_id = updates.enclosureAnimalId;
    if (updates.recordedAt !== undefined) payload.recorded_at = updates.recordedAt;
    if (updates.uvIndex !== undefined) payload.uv_index = updates.uvIndex;
    if (updates.bulbType !== undefined) payload.bulb_type = updates.bulbType;
    if (updates.zone !== undefined) payload.zone = updates.zone;
    if (updates.distanceCm !== undefined) payload.distance_cm = updates.distanceCm;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from('uvb_logs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('uvb_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFromDb(row: any): UvbLog {
    const uvIndex = row.uv_index === null || row.uv_index === undefined ? undefined : Number(row.uv_index);
    const distanceCm = row.distance_cm === null || row.distance_cm === undefined ? undefined : Number(row.distance_cm);

    return {
      id: row.id,
      enclosureId: row.enclosure_id || undefined,
      enclosureAnimalId: row.enclosure_animal_id,
      userId: row.user_id,
      recordedAt: row.recorded_at,
      uvIndex,
      bulbType: row.bulb_type,
      zone: row.zone,
      distanceCm,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const uvbLogService = new UvbLogService();
