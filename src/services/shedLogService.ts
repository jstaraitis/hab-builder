import { supabase } from '../lib/supabase';

/**
 * Shed Log Types
 */
export interface ShedLog {
  id: string;
  enclosureAnimalId: string;
  userId: string;
  shedDate: string;
  quality?: 'complete' | 'incomplete' | 'stuck-shed' | 'assisted';
  shedInOnePiece?: boolean;
  problemAreas?: string[];
  humidityPercent?: number;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShedLogInput {
  enclosureAnimalId: string;
  shedDate: string;
  quality?: 'complete' | 'incomplete' | 'stuck-shed' | 'assisted';
  shedInOnePiece?: boolean;
  problemAreas?: string[];
  humidityPercent?: number;
  notes?: string;
  photos?: string[];
}

export interface ShedStats {
  totalSheds: number;
  averageDaysBetweenSheds: number;
  lastShedDate?: string;
  completeSheds: number;
  incompleteSheds: number;
  problemSheds: number;
}

/**
 * Shed Log Service
 * 
 * Handles all shed log operations for tracking reptile/amphibian sheds
 */
class ShedLogService {
  
  /**
   * Get all shed logs for a specific animal
   */
  async getLogsForAnimal(enclosureAnimalId: string): Promise<ShedLog[]> {
    const { data, error } = await supabase
      .from('shed_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('shed_date', { ascending: false });

    if (error) {
      console.error('Error fetching shed logs:', error);
      throw new Error('Failed to fetch shed logs');
    }

    return this.mapToShedLogs(data || []);
  }

  /**
   * Get recent shed logs for an animal
   */
  async getRecentSheds(enclosureAnimalId: string, limit: number = 10): Promise<ShedLog[]> {
    const { data, error } = await supabase
      .from('shed_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('shed_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent sheds:', error);
      throw new Error('Failed to fetch recent sheds');
    }

    return this.mapToShedLogs(data || []);
  }

  /**
   * Get a single shed log by ID
   */
  async getLogById(id: string): Promise<ShedLog | null> {
    const { data, error } = await supabase
      .from('shed_logs')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error fetching shed log:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToShedLog(data[0]);
  }

  /**
   * Create a new shed log
   */
  async createLog(userId: string, input: ShedLogInput): Promise<ShedLog> {
    const { data, error } = await supabase
      .from('shed_logs')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        shed_date: input.shedDate,
        quality: input.quality,
        shed_in_one_piece: input.shedInOnePiece,
        problem_areas: input.problemAreas,
        humidity_percent: input.humidityPercent,
        notes: input.notes,
        photos: input.photos,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shed log:', error);
      throw new Error('Failed to create shed log');
    }

    return this.mapToShedLog(data);
  }

  /**
   * Update an existing shed log
   */
  async updateLog(id: string, updates: Partial<ShedLogInput>): Promise<ShedLog> {
    const updateData: any = {};
    
    if (updates.shedDate !== undefined) updateData.shed_date = updates.shedDate;
    if (updates.quality !== undefined) updateData.quality = updates.quality;
    if (updates.shedInOnePiece !== undefined) updateData.shed_in_one_piece = updates.shedInOnePiece;
    if (updates.problemAreas !== undefined) updateData.problem_areas = updates.problemAreas;
    if (updates.humidityPercent !== undefined) updateData.humidity_percent = updates.humidityPercent;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.photos !== undefined) updateData.photos = updates.photos;

    const { data, error } = await supabase
      .from('shed_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shed log:', error);
      throw new Error('Failed to update shed log');
    }

    return this.mapToShedLog(data);
  }

  /**
   * Delete a shed log
   */
  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('shed_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shed log:', error);
      throw new Error('Failed to delete shed log');
    }
  }

  /**
   * Get shed statistics for an animal
   */
  async getShedStats(enclosureAnimalId: string): Promise<ShedStats> {
    const logs = await this.getLogsForAnimal(enclosureAnimalId);

    if (logs.length === 0) {
      return {
        totalSheds: 0,
        averageDaysBetweenSheds: 0,
        completeSheds: 0,
        incompleteSheds: 0,
        problemSheds: 0,
      };
    }

    // Calculate days between sheds
    let totalDays = 0;
    let intervals = 0;
    
    for (let i = 0; i < logs.length - 1; i++) {
      const date1 = new Date(logs[i].shedDate);
      const date2 = new Date(logs[i + 1].shedDate);
      const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += daysDiff;
      intervals++;
    }

    const averageDaysBetweenSheds = intervals > 0 ? Math.round(totalDays / intervals) : 0;

    // Count by quality
    const completeSheds = logs.filter(log => log.quality === 'complete').length;
    const incompleteSheds = logs.filter(log => log.quality === 'incomplete').length;
    const problemSheds = logs.filter(log => 
      log.quality === 'stuck-shed' || log.quality === 'assisted'
    ).length;

    return {
      totalSheds: logs.length,
      averageDaysBetweenSheds,
      lastShedDate: logs[0]?.shedDate,
      completeSheds,
      incompleteSheds,
      problemSheds,
    };
  }

  /**
   * Map database row to ShedLog
   */
  private mapToShedLog(data: any): ShedLog {
    return {
      id: data.id,
      enclosureAnimalId: data.enclosure_animal_id,
      userId: data.user_id,
      shedDate: data.shed_date,
      quality: data.quality,
      shedInOnePiece: data.shed_in_one_piece,
      problemAreas: data.problem_areas,
      humidityPercent: data.humidity_percent,
      notes: data.notes,
      photos: data.photos,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map array of database rows to ShedLogs
   */
  private mapToShedLogs(data: any[]): ShedLog[] {
    return data.map(row => this.mapToShedLog(row));
  }
}

export const shedLogService = new ShedLogService();
