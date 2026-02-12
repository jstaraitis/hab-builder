import { supabase } from '../lib/supabase';

/**
 * Length Log Types
 */
export interface LengthLog {
  id: string;
  enclosureAnimalId: string;
  userId: string;
  date: string;
  length: number;
  unit: 'inches' | 'cm' | 'feet' | 'meters';
  measurementType?: 'snout-to-vent' | 'total-length' | 'carapace-length' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LengthLogInput {
  enclosureAnimalId: string;
  date: string;
  length: number;
  unit: 'inches' | 'cm' | 'feet' | 'meters';
  measurementType?: 'snout-to-vent' | 'total-length' | 'carapace-length' | 'other';
  notes?: string;
}

export interface LengthStats {
  totalMeasurements: number;
  firstLength?: number;
  latestLength?: number;
  totalGrowth?: number;
  growthRate?: number; // per month
  unit: string;
}

/**
 * Length Log Service
 * 
 * Handles length measurement tracking for growth monitoring
 */
class LengthLogService {
  
  /**
   * Get all length logs for a specific animal
   */
  async getLogsForAnimal(enclosureAnimalId: string): Promise<LengthLog[]> {
    const { data, error } = await supabase
      .from('length_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching length logs:', error);
      throw new Error('Failed to fetch length logs');
    }

    return this.mapToLengthLogs(data || []);
  }

  /**
   * Get recent length logs for an animal
   */
  async getRecentLogs(enclosureAnimalId: string, limit: number = 10): Promise<LengthLog[]> {
    const { data, error } = await supabase
      .from('length_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent length logs:', error);
      throw new Error('Failed to fetch recent length logs');
    }

    return this.mapToLengthLogs(data || []);
  }

  /**
   * Get length logs by user (across all animals)
   */
  async getLogsByUser(userId: string): Promise<LengthLog[]> {
    const { data, error } = await supabase
      .from('length_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching user length logs:', error);
      throw new Error('Failed to fetch length logs');
    }

    return this.mapToLengthLogs(data || []);
  }

  /**
   * Get a single length log by ID
   */
  async getLogById(id: string): Promise<LengthLog | null> {
    const { data, error } = await supabase
      .from('length_logs')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error fetching length log:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToLengthLog(data[0]);
  }

  /**
   * Create a new length log
   */
  async createLog(userId: string, input: LengthLogInput): Promise<LengthLog> {
    const { data, error } = await supabase
      .from('length_logs')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        date: input.date,
        length: input.length,
        unit: input.unit,
        measurement_type: input.measurementType,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating length log:', error);
      throw new Error('Failed to create length log');
    }

    return this.mapToLengthLog(data);
  }

  /**
   * Update an existing length log
   */
  async updateLog(id: string, updates: Partial<LengthLogInput>): Promise<LengthLog> {
    const updateData: any = {};
    
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.length !== undefined) updateData.length = updates.length;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.measurementType !== undefined) updateData.measurement_type = updates.measurementType;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('length_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating length log:', error);
      throw new Error('Failed to update length log');
    }

    return this.mapToLengthLog(data);
  }

  /**
   * Delete a length log
   */
  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('length_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting length log:', error);
      throw new Error('Failed to delete length log');
    }
  }

  /**
   * Get growth statistics for an animal
   */
  async getGrowthStats(enclosureAnimalId: string): Promise<LengthStats> {
    const logs = await this.getLogsForAnimal(enclosureAnimalId);

    if (logs.length === 0) {
      return {
        totalMeasurements: 0,
        unit: 'inches',
      };
    }

    // Sort by date ascending for growth calculations
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstLog = sortedLogs[0];
    const latestLog = sortedLogs[sortedLogs.length - 1];

    // Convert all to same unit for growth calculation (use first log's unit)
    const normalizedLogs = sortedLogs.map(log => ({
      ...log,
      normalizedLength: this.convertLength(log.length, log.unit, firstLog.unit),
    }));

    const totalGrowth = normalizedLogs[normalizedLogs.length - 1].normalizedLength - 
                        normalizedLogs[0].normalizedLength;

    // Calculate growth rate per month
    const firstDate = new Date(firstLog.date);
    const latestDate = new Date(latestLog.date);
    const monthsDiff = (latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const growthRate = monthsDiff > 0 ? totalGrowth / monthsDiff : 0;

    return {
      totalMeasurements: logs.length,
      firstLength: firstLog.length,
      latestLength: latestLog.length,
      totalGrowth: Math.round(totalGrowth * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      unit: firstLog.unit,
    };
  }

  /**
   * Convert length between units
   */
  private convertLength(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    // Convert to inches first
    let inches: number;
    switch (fromUnit) {
      case 'inches':
        inches = value;
        break;
      case 'cm':
        inches = value / 2.54;
        break;
      case 'feet':
        inches = value * 12;
        break;
      case 'meters':
        inches = value * 39.37;
        break;
      default:
        inches = value;
    }

    // Convert from inches to target unit
    switch (toUnit) {
      case 'inches':
        return inches;
      case 'cm':
        return inches * 2.54;
      case 'feet':
        return inches / 12;
      case 'meters':
        return inches / 39.37;
      default:
        return inches;
    }
  }

  /**
   * Map database row to LengthLog
   */
  private mapToLengthLog(data: any): LengthLog {
    return {
      id: data.id,
      enclosureAnimalId: data.enclosure_animal_id,
      userId: data.user_id,
      date: data.date,
      length: data.length,
      unit: data.unit,
      measurementType: data.measurement_type,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map array of database rows to LengthLogs
   */
  private mapToLengthLogs(data: any[]): LengthLog[] {
    return data.map(row => this.mapToLengthLog(row));
  }
}

export const lengthLogService = new LengthLogService();
