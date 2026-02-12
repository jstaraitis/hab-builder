import { supabase } from '../lib/supabase';

/**
 * Brumation Log Types
 */
export interface BrumationLog {
  id: string;
  enclosureAnimalId: string;
  userId: string;
  startDate: string;
  endDate?: string | null;
  durationDays?: number;
  temperatureLow?: number;
  temperatureHigh?: number;
  activityLevel?: 'inactive' | 'occasional-movement' | 'restless' | 'normal';
  eatingDuring: boolean;
  drinkingDuring: boolean;
  weightLossGrams?: number;
  preparationNotes?: string;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrumationLogInput {
  enclosureAnimalId: string;
  startDate: string;
  endDate?: string | null;
  temperatureLow?: number;
  temperatureHigh?: number;
  activityLevel?: 'inactive' | 'occasional-movement' | 'restless' | 'normal';
  eatingDuring?: boolean;
  drinkingDuring?: boolean;
  weightLossGrams?: number;
  preparationNotes?: string;
  notes?: string;
  photos?: string[];
}

/**
 * Brumation Log Service
 * 
 * Handles brumation/hibernation tracking for reptiles
 */
class BrumationLogService {
  
  /**
   * Get all brumation logs for a specific animal
   */
  async getLogsForAnimal(enclosureAnimalId: string): Promise<BrumationLog[]> {
    const { data, error } = await supabase
      .from('brumation_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching brumation logs:', error);
      throw new Error('Failed to fetch brumation logs');
    }

    return this.mapToBrumationLogs(data || []);
  }

  /**
   * Get currently active brumation for an animal
   */
  async getActiveBrumation(enclosureAnimalId: string): Promise<BrumationLog | null> {
    const { data, error } = await supabase
      .from('brumation_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active brumation:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToBrumationLog(data[0]);
  }

  /**
   * Get all currently brumating animals for a user
   */
  async getActiveBrumationsByUser(userId: string): Promise<BrumationLog[]> {
    const { data, error } = await supabase
      .from('brumation_logs')
      .select('*')
      .eq('user_id', userId)
      .is('end_date', null)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching active brumations:', error);
      throw new Error('Failed to fetch active brumations');
    }

    return this.mapToBrumationLogs(data || []);
  }

  /**
   * Get a single brumation log by ID
   */
  async getLogById(id: string): Promise<BrumationLog | null> {
    const { data, error } = await supabase
      .from('brumation_logs')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error fetching brumation log:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToBrumationLog(data[0]);
  }

  /**
   * Create a new brumation log (start brumation)
   */
  async createLog(userId: string, input: BrumationLogInput): Promise<BrumationLog> {
    const { data, error } = await supabase
      .from('brumation_logs')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        start_date: input.startDate,
        end_date: input.endDate,
        temperature_low: input.temperatureLow,
        temperature_high: input.temperatureHigh,
        activity_level: input.activityLevel,
        eating_during: input.eatingDuring ?? false,
        drinking_during: input.drinkingDuring ?? true,
        weight_loss_grams: input.weightLossGrams,
        preparation_notes: input.preparationNotes,
        notes: input.notes,
        photos: input.photos,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brumation log:', error);
      throw new Error('Failed to create brumation log');
    }

    return this.mapToBrumationLog(data);
  }

  /**
   * Update an existing brumation log
   */
  async updateLog(id: string, updates: Partial<BrumationLogInput>): Promise<BrumationLog> {
    const updateData: any = {};
    
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.temperatureLow !== undefined) updateData.temperature_low = updates.temperatureLow;
    if (updates.temperatureHigh !== undefined) updateData.temperature_high = updates.temperatureHigh;
    if (updates.activityLevel !== undefined) updateData.activity_level = updates.activityLevel;
    if (updates.eatingDuring !== undefined) updateData.eating_during = updates.eatingDuring;
    if (updates.drinkingDuring !== undefined) updateData.drinking_during = updates.drinkingDuring;
    if (updates.weightLossGrams !== undefined) updateData.weight_loss_grams = updates.weightLossGrams;
    if (updates.preparationNotes !== undefined) updateData.preparation_notes = updates.preparationNotes;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.photos !== undefined) updateData.photos = updates.photos;

    const { data, error } = await supabase
      .from('brumation_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brumation log:', error);
      throw new Error('Failed to update brumation log');
    }

    return this.mapToBrumationLog(data);
  }

  /**
   * End brumation (set end_date, auto-calculates duration)
   */
  async endBrumation(id: string, endDate: string): Promise<BrumationLog> {
    return this.updateLog(id, { endDate });
  }

  /**
   * Delete a brumation log
   */
  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('brumation_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting brumation log:', error);
      throw new Error('Failed to delete brumation log');
    }
  }

  /**
   * Map database row to BrumationLog
   */
  private mapToBrumationLog(data: any): BrumationLog {
    return {
      id: data.id,
      enclosureAnimalId: data.enclosure_animal_id,
      userId: data.user_id,
      startDate: data.start_date,
      endDate: data.end_date,
      durationDays: data.duration_days,
      temperatureLow: data.temperature_low,
      temperatureHigh: data.temperature_high,
      activityLevel: data.activity_level,
      eatingDuring: data.eating_during,
      drinkingDuring: data.drinking_during,
      weightLossGrams: data.weight_loss_grams,
      preparationNotes: data.preparation_notes,
      notes: data.notes,
      photos: data.photos,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map array of database rows to BrumationLogs
   */
  private mapToBrumationLogs(data: any[]): BrumationLog[] {
    return data.map(row => this.mapToBrumationLog(row));
  }
}

export const brumationLogService = new BrumationLogService();
