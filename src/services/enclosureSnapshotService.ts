import { supabase } from '../lib/supabase';
import type { EnclosureHealthScore, EnclosureSnapshot, MoldSeverity } from '../types/careCalendar';

export interface EnclosureSnapshotInput {
  enclosureId: string;
  recordedAt?: Date;
  dayWarmTemp?: number;
  dayCoolTemp?: number;
  nightTemp?: number;
  humidityMin?: number;
  humidityMax?: number;
  substrateMoistureScore?: EnclosureHealthScore;
  substrateCompactionScore?: EnclosureHealthScore;
  moldSeverity?: MoldSeverity;
  cleanupCrewActivityScore?: EnclosureHealthScore;
  plantHealthScore?: EnclosureHealthScore;
  notes?: string;
  photoUrls?: string[];
}

class EnclosureSnapshotService {
  async getRecentSnapshotsForEnclosure(enclosureId: string, limit: number = 20): Promise<EnclosureSnapshot[]> {
    const { data, error } = await supabase
      .from('enclosure_snapshots')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => this.mapFromDb(row));
  }

  async createSnapshot(userId: string, input: EnclosureSnapshotInput): Promise<EnclosureSnapshot> {
    const { data, error } = await supabase
      .from('enclosure_snapshots')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        recorded_at: input.recordedAt ? input.recordedAt.toISOString() : new Date().toISOString(),
        day_warm_temp: input.dayWarmTemp,
        day_cool_temp: input.dayCoolTemp,
        night_temp: input.nightTemp,
        humidity_min: input.humidityMin,
        humidity_max: input.humidityMax,
        substrate_moisture_score: input.substrateMoistureScore,
        substrate_compaction_score: input.substrateCompactionScore,
        mold_severity: input.moldSeverity,
        cleanup_crew_activity_score: input.cleanupCrewActivityScore,
        plant_health_score: input.plantHealthScore,
        notes: input.notes,
        photo_urls: input.photoUrls,
      })
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFromDb(data);
  }

  async updateSnapshot(id: string, updates: Partial<EnclosureSnapshotInput>): Promise<EnclosureSnapshot> {
    const payload: Record<string, unknown> = {};

    if (updates.enclosureId !== undefined) payload.enclosure_id = updates.enclosureId;
    if (updates.recordedAt !== undefined) payload.recorded_at = updates.recordedAt.toISOString();
    if (updates.dayWarmTemp !== undefined) payload.day_warm_temp = updates.dayWarmTemp;
    if (updates.dayCoolTemp !== undefined) payload.day_cool_temp = updates.dayCoolTemp;
    if (updates.nightTemp !== undefined) payload.night_temp = updates.nightTemp;
    if (updates.humidityMin !== undefined) payload.humidity_min = updates.humidityMin;
    if (updates.humidityMax !== undefined) payload.humidity_max = updates.humidityMax;
    if (updates.substrateMoistureScore !== undefined) payload.substrate_moisture_score = updates.substrateMoistureScore;
    if (updates.substrateCompactionScore !== undefined) payload.substrate_compaction_score = updates.substrateCompactionScore;
    if (updates.moldSeverity !== undefined) payload.mold_severity = updates.moldSeverity;
    if (updates.cleanupCrewActivityScore !== undefined) payload.cleanup_crew_activity_score = updates.cleanupCrewActivityScore;
    if (updates.plantHealthScore !== undefined) payload.plant_health_score = updates.plantHealthScore;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.photoUrls !== undefined) payload.photo_urls = updates.photoUrls;

    const { data, error } = await supabase
      .from('enclosure_snapshots')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFromDb(data);
  }

  async deleteSnapshot(id: string): Promise<void> {
    const { error } = await supabase
      .from('enclosure_snapshots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFromDb(row: any): EnclosureSnapshot {
    return {
      id: row.id,
      enclosureId: row.enclosure_id,
      userId: row.user_id,
      recordedAt: new Date(row.recorded_at),
      dayWarmTemp: row.day_warm_temp == null ? undefined : Number(row.day_warm_temp),
      dayCoolTemp: row.day_cool_temp == null ? undefined : Number(row.day_cool_temp),
      nightTemp: row.night_temp == null ? undefined : Number(row.night_temp),
      humidityMin: row.humidity_min == null ? undefined : Number(row.humidity_min),
      humidityMax: row.humidity_max == null ? undefined : Number(row.humidity_max),
      substrateMoistureScore: row.substrate_moisture_score == null ? undefined : row.substrate_moisture_score,
      substrateCompactionScore: row.substrate_compaction_score == null ? undefined : row.substrate_compaction_score,
      moldSeverity: row.mold_severity ?? undefined,
      cleanupCrewActivityScore: row.cleanup_crew_activity_score == null ? undefined : row.cleanup_crew_activity_score,
      plantHealthScore: row.plant_health_score == null ? undefined : row.plant_health_score,
      notes: row.notes ?? undefined,
      photoUrls: row.photo_urls ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const enclosureSnapshotService = new EnclosureSnapshotService();
