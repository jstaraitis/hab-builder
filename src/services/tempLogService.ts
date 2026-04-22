import { supabase } from '../lib/supabase';

export interface TempLog {
  id: string;
  enclosureId?: string;
  enclosureAnimalId: string;
  userId: string;
  recordedAt: string;
  temperatureValue: number;
  unit: 'f' | 'c';
  zone?: 'ambient' | 'basking' | 'cool' | 'water' | 'substrate' | 'other';
  deviceName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TempLogInput {
  enclosureId?: string;
  enclosureAnimalId: string;
  recordedAt?: string;
  temperatureValue: number;
  unit?: 'f' | 'c';
  zone?: TempLog['zone'];
  deviceName?: string;
  notes?: string;
}

class TempLogService {
  async getRecentLogsForEnclosure(enclosureId: string, limit: number = 10): Promise<TempLog[]> {
    const { data, error } = await supabase
      .from('temp_logs')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async getRecentLogs(enclosureAnimalId: string, limit: number = 10): Promise<TempLog[]> {
    const { data, error } = await supabase
      .from('temp_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapFromDb);
  }

  async createLog(userId: string, input: TempLogInput): Promise<TempLog> {
    const { data, error } = await supabase
      .from('temp_logs')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        enclosure_animal_id: input.enclosureAnimalId,
        recorded_at: input.recordedAt || new Date().toISOString(),
        temperature_value: input.temperatureValue,
        unit: input.unit || 'f',
        zone: input.zone,
        device_name: input.deviceName,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async updateLog(id: string, updates: Partial<TempLogInput>): Promise<TempLog> {
    const payload: Record<string, unknown> = {};

    if (updates.enclosureId !== undefined) payload.enclosure_id = updates.enclosureId;
    if (updates.enclosureAnimalId !== undefined) payload.enclosure_animal_id = updates.enclosureAnimalId;
    if (updates.recordedAt !== undefined) payload.recorded_at = updates.recordedAt;
    if (updates.temperatureValue !== undefined) payload.temperature_value = updates.temperatureValue;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.zone !== undefined) payload.zone = updates.zone;
    if (updates.deviceName !== undefined) payload.device_name = updates.deviceName;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from('temp_logs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('temp_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFromDb(row: any): TempLog {
    return {
      id: row.id,
      enclosureId: row.enclosure_id || undefined,
      enclosureAnimalId: row.enclosure_animal_id,
      userId: row.user_id,
      recordedAt: row.recorded_at,
      temperatureValue: Number(row.temperature_value),
      unit: row.unit,
      zone: row.zone,
      deviceName: row.device_name,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const tempLogService = new TempLogService();
