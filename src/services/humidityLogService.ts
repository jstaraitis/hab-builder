import { supabase } from '../lib/supabase';

export interface HumidityLog {
  id: string;
  enclosureId?: string;
  enclosureAnimalId: string;
  userId: string;
  recordedAt: string;
  humidityPercent: number;
  zone?: 'ambient' | 'hide' | 'substrate' | 'water' | 'other';
  deviceName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HumidityLogInput {
  enclosureId?: string;
  enclosureAnimalId?: string;
  recordedAt?: string;
  humidityPercent: number;
  zone?: HumidityLog['zone'];
  deviceName?: string;
  notes?: string;
}

class HumidityLogService {
  async getRecentLogsForEnclosure(enclosureId: string, limit: number = 10): Promise<HumidityLog[]> {
    const { data, error } = await supabase
      .from('humidity_logs')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getRecentLogs(enclosureAnimalId: string, limit: number = 10): Promise<HumidityLog[]> {
    const { data, error } = await supabase
      .from('humidity_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async createLog(userId: string, input: HumidityLogInput): Promise<HumidityLog> {
    const { data, error } = await supabase
      .from('humidity_logs')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        enclosure_animal_id: input.enclosureAnimalId,
        recorded_at: input.recordedAt || new Date().toISOString(),
        humidity_percent: input.humidityPercent,
        zone: input.zone,
        device_name: input.deviceName,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async updateLog(id: string, updates: Partial<HumidityLogInput>): Promise<HumidityLog> {
    const payload: Record<string, unknown> = {};

    if (updates.enclosureId !== undefined) payload.enclosure_id = updates.enclosureId;
    if (updates.enclosureAnimalId !== undefined) payload.enclosure_animal_id = updates.enclosureAnimalId;
    if (updates.recordedAt !== undefined) payload.recorded_at = updates.recordedAt;
    if (updates.humidityPercent !== undefined) payload.humidity_percent = updates.humidityPercent;
    if (updates.zone !== undefined) payload.zone = updates.zone;
    if (updates.deviceName !== undefined) payload.device_name = updates.deviceName;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from('humidity_logs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('humidity_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFromDb(row: any): HumidityLog {
    return {
      id: row.id,
      enclosureId: row.enclosure_id || undefined,
      enclosureAnimalId: row.enclosure_animal_id,
      userId: row.user_id,
      recordedAt: row.recorded_at,
      humidityPercent: Number(row.humidity_percent),
      zone: row.zone,
      deviceName: row.device_name,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const humidityLogService = new HumidityLogService();
