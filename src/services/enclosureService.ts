import { supabase } from '../lib/supabase';
import type { Enclosure } from '../types/careCalendar';
import { calculateReplaceDueOn, resolveBulbSpec, type UvbBulbType } from '../engine/uvbLifecycle';
import { enclosureEventService } from './enclosureEventService';

export interface IEnclosureService {
  getEnclosures(userId?: string): Promise<Enclosure[]>;
  getEnclosureById(id: string): Promise<Enclosure | null>;
  createEnclosure(enclosure: Omit<Enclosure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Enclosure>;
  updateEnclosure(id: string, updates: Partial<Enclosure>): Promise<Enclosure>;
  deleteEnclosure(id: string): Promise<void>;
}

class SupabaseEnclosureService implements IEnclosureService {
  async getEnclosures(userId?: string): Promise<Enclosure[]> {
    let query = supabase
      .from('enclosures')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return this.mapEnclosuresFromDb(data || []);
  }

  async getEnclosureById(id: string): Promise<Enclosure | null> {
    const { data, error } = await supabase
      .from('enclosures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapEnclosureFromDb(data);
  }

  async createEnclosure(enclosureData: Omit<Enclosure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Enclosure> {
    const dbEnclosure = this.mapEnclosureToDb(enclosureData as Enclosure);

    const { data, error } = await supabase
      .from('enclosures')
      .insert([dbEnclosure])
      .select()
      .single();

    if (error) throw error;

    return this.mapEnclosureFromDb(data);
  }

  async updateEnclosure(id: string, updates: Partial<Enclosure>): Promise<Enclosure> {
    const dbUpdates = {
      ...this.mapEnclosureToDb(updates as Enclosure),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enclosures')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapEnclosureFromDb(data);
  }

  /**
   * Records a UVB bulb replacement: restarts the lifecycle from today and
   * writes an enclosure event so the swap shows up on the history timeline.
   *
   * The event write is best-effort — losing a timeline entry is not a reason
   * to leave the keeper's bulb dates stale.
   */
  async replaceUvbBulb(
    id: string,
    userId: string,
    bulbType: UvbBulbType,
    installedOn: Date = new Date()
  ): Promise<Enclosure> {
    const updated = await this.updateEnclosure(id, {
      uvbBulbInstalledOn: installedOn,
      uvbBulbType: bulbType,
      uvbReplaceDueOn: calculateReplaceDueOn(installedOn, bulbType),
    });

    try {
      await enclosureEventService.createEvent(userId, {
        enclosureId: id,
        eventDate: installedOn,
        eventType: 'uvb_bulb_replaced',
        severity: 'info',
        notes: `Installed a ${resolveBulbSpec(bulbType).label} bulb.`,
      });
    } catch (error) {
      console.error('Bulb replaced, but the timeline event failed to save:', error);
    }

    return updated;
  }

  async deleteEnclosure(id: string): Promise<void> {
    // First, delete all tasks associated with this enclosure
    const { error: tasksError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('enclosure_id', id);

    if (tasksError) throw tasksError;

    // Then delete the enclosure itself
    const { error } = await supabase
      .from('enclosures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Database mapping helpers
  private mapEnclosureFromDb(row: any): Enclosure {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      animalId: row.animal_id,
      animalName: row.animal_name,
      photoUrl: row.photo_url,
      description: row.description,
      setupDate: row.setup_date ? new Date(row.setup_date) : undefined,
      animalBirthday: row.animal_birthday ? new Date(row.animal_birthday) : undefined,
      substrateType: row.substrate_type,
      substrateDepthInches: row.substrate_depth_inches == null ? undefined : Number(row.substrate_depth_inches),
      drainageLayerDepthInches: row.drainage_layer_depth_inches == null ? undefined : Number(row.drainage_layer_depth_inches),
      bioactiveStartedOn: row.bioactive_started_on ? new Date(row.bioactive_started_on) : undefined,
      uvbBulbInstalledOn: row.uvb_bulb_installed_on ? new Date(row.uvb_bulb_installed_on) : undefined,
      uvbReplaceDueOn: row.uvb_replace_due_on ? new Date(row.uvb_replace_due_on) : undefined,
      uvbBulbType: row.uvb_bulb_type ?? undefined,
      // Setup Check answers. NULL stays undefined throughout — a missing answer
      // must never resolve to a default, or an unasked question becomes a pass.
      uvbDistanceInches: row.uvb_distance_inches == null ? undefined : Number(row.uvb_distance_inches),
      uvbOverMesh: row.uvb_over_mesh ?? undefined,
      baskingToCoolInches:
        row.basking_to_cool_inches == null ? undefined : Number(row.basking_to_cool_inches),
      hidesWarmSide: row.hides_warm_side == null ? undefined : Number(row.hides_warm_side),
      hidesCoolSide: row.hides_cool_side == null ? undefined : Number(row.hides_cool_side),
      waterPosition: row.water_position ?? undefined,
      probeLocation: row.probe_location ?? undefined,
      heatSource: row.heat_source ?? undefined,
      heatOnThermostat: row.heat_on_thermostat ?? undefined,
      // Narrowed rather than relying on the mapper's `any`, so this line does
      // not add to the file's existing unsafe-argument count.
      setupCheckedAt: row.setup_checked_at ? new Date(row.setup_checked_at as string) : undefined,
      widthInches: row.width_inches == null ? undefined : Number(row.width_inches),
      depthInches: row.depth_inches == null ? undefined : Number(row.depth_inches),
      heightInches: row.height_inches == null ? undefined : Number(row.height_inches),
      mistingSystemType: row.misting_system_type,
      lightingScheduleHours: row.lighting_schedule_hours == null ? undefined : Number(row.lighting_schedule_hours),
      baselineDayTempTarget: row.baseline_day_temp_target == null ? undefined : Number(row.baseline_day_temp_target),
      baselineNightTempTarget: row.baseline_night_temp_target == null ? undefined : Number(row.baseline_night_temp_target),
      baselineHumidityMinTarget: row.baseline_humidity_min_target == null ? undefined : Number(row.baseline_humidity_min_target),
      baselineHumidityMaxTarget: row.baseline_humidity_max_target == null ? undefined : Number(row.baseline_humidity_max_target),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapEnclosuresFromDb(rows: any[]): Enclosure[] {
    return rows.map(row => this.mapEnclosureFromDb(row));
  }

  private mapEnclosureToDb(enclosure: Partial<Enclosure>): any {
    const mapped: any = {};
    
    if (enclosure.id !== undefined) mapped.id = enclosure.id;
    if (enclosure.userId !== undefined) mapped.user_id = enclosure.userId;
    if (enclosure.name !== undefined) mapped.name = enclosure.name;
    if (enclosure.animalId !== undefined) mapped.animal_id = enclosure.animalId;
    if (enclosure.animalName !== undefined) mapped.animal_name = enclosure.animalName;
    if (enclosure.photoUrl !== undefined) mapped.photo_url = enclosure.photoUrl;
    if (enclosure.description !== undefined) mapped.description = enclosure.description;
    if (enclosure.setupDate !== undefined) mapped.setup_date = enclosure.setupDate?.toISOString().split('T')[0];
    if (enclosure.animalBirthday !== undefined) mapped.animal_birthday = enclosure.animalBirthday?.toISOString().split('T')[0];
    if (enclosure.substrateType !== undefined) mapped.substrate_type = enclosure.substrateType;
    if (enclosure.substrateDepthInches !== undefined) mapped.substrate_depth_inches = enclosure.substrateDepthInches;
    if (enclosure.drainageLayerDepthInches !== undefined) mapped.drainage_layer_depth_inches = enclosure.drainageLayerDepthInches;
    if (enclosure.bioactiveStartedOn !== undefined) mapped.bioactive_started_on = enclosure.bioactiveStartedOn?.toISOString().split('T')[0];
    if (enclosure.uvbBulbInstalledOn !== undefined) mapped.uvb_bulb_installed_on = enclosure.uvbBulbInstalledOn?.toISOString().split('T')[0];
    if (enclosure.uvbReplaceDueOn !== undefined) mapped.uvb_replace_due_on = enclosure.uvbReplaceDueOn?.toISOString().split('T')[0];
    if (enclosure.uvbBulbType !== undefined) mapped.uvb_bulb_type = enclosure.uvbBulbType;
    if (enclosure.widthInches !== undefined) mapped.width_inches = enclosure.widthInches;
    if (enclosure.depthInches !== undefined) mapped.depth_inches = enclosure.depthInches;
    if (enclosure.heightInches !== undefined) mapped.height_inches = enclosure.heightInches;
    if (enclosure.mistingSystemType !== undefined) mapped.misting_system_type = enclosure.mistingSystemType;
    if (enclosure.lightingScheduleHours !== undefined) mapped.lighting_schedule_hours = enclosure.lightingScheduleHours;
    if (enclosure.baselineDayTempTarget !== undefined) mapped.baseline_day_temp_target = enclosure.baselineDayTempTarget;
    if (enclosure.baselineNightTempTarget !== undefined) mapped.baseline_night_temp_target = enclosure.baselineNightTempTarget;
    if (enclosure.baselineHumidityMinTarget !== undefined) mapped.baseline_humidity_min_target = enclosure.baselineHumidityMinTarget;
    if (enclosure.baselineHumidityMaxTarget !== undefined) mapped.baseline_humidity_max_target = enclosure.baselineHumidityMaxTarget;
    if (enclosure.isActive !== undefined) mapped.is_active = enclosure.isActive;
    if (enclosure.createdAt !== undefined) mapped.created_at = enclosure.createdAt.toISOString();
    if (enclosure.updatedAt !== undefined) mapped.updated_at = enclosure.updatedAt.toISOString();

    return mapped;
  }
}

export const enclosureService = new SupabaseEnclosureService();
