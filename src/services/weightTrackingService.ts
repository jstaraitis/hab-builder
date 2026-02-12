import { supabase } from '../lib/supabase';
import type { WeightLog, WeightLogInput, WeightStats, WeightAnalytics } from '../types/weightTracking';

/**
 * Weight Tracking Service
 * 
 * Handles all weight log operations and analytics calculations
 */
class WeightTrackingService {
  
  /**
   * Get all weight logs for a specific animal
   */
  async getWeightLogs(enclosureAnimalId: string): Promise<WeightLog[]> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('measurement_date', { ascending: false });

    if (error) {
      console.error('Error fetching weight logs:', error);
      throw new Error('Failed to fetch weight logs');
    }

    return this.mapToWeightLogs(data || []);
  }

  /**
   * Get weight logs for multiple animals (for dashboard view)
   */
  async getWeightLogsByUser(userId: string): Promise<WeightLog[]> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching user weight logs:', error);
      throw new Error('Failed to fetch weight logs');
    }

    return this.mapToWeightLogs(data || []);
  }

  /**
   * Get a single weight log by ID
   */
  async getWeightLogById(id: string): Promise<WeightLog | null> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error fetching weight log:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToWeightLog(data[0]);
  }

  /**
   * Create a new weight log entry
   */
  async createWeightLog(userId: string, input: WeightLogInput): Promise<WeightLog> {
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        weight_grams: input.weightGrams,
        measurement_date: input.measurementDate || new Date().toISOString(),
        notes: input.notes,
        photo_url: input.photoUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating weight log:', error);
      throw new Error('Failed to create weight log');
    }

    return this.mapToWeightLog(data);
  }

  /**
   * Update an existing weight log
   */
  async updateWeightLog(id: string, updates: Partial<WeightLogInput>): Promise<WeightLog> {
    const updateData: any = {};
    
    if (updates.weightGrams !== undefined) updateData.weight_grams = updates.weightGrams;
    if (updates.measurementDate !== undefined) updateData.measurement_date = updates.measurementDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

    const { data, error } = await supabase
      .from('weight_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating weight log:', error);
      throw new Error('Failed to update weight log');
    }

    return this.mapToWeightLog(data);
  }

  /**
   * Delete a weight log
   */
  async deleteWeightLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('weight_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting weight log:', error);
      throw new Error('Failed to delete weight log');
    }
  }

  /**
   * Calculate weight statistics for an animal
   */
  async getWeightStats(enclosureAnimalId: string): Promise<WeightStats> {
    const logs = await this.getWeightLogs(enclosureAnimalId);
    
    if (logs.length === 0) {
      return {
        currentWeight: 0,
      };
    }

    const currentLog = logs[0];
    const previousLog = logs[1];

    const stats: WeightStats = {
      currentWeight: currentLog.weightGrams,
    };

    // Calculate change from previous weighing
    if (previousLog) {
      stats.previousWeight = previousLog.weightGrams;
      stats.weightChange = currentLog.weightGrams - previousLog.weightGrams;
      stats.weightChangePercent = (stats.weightChange / previousLog.weightGrams) * 100;
      
      const daysDiff = Math.floor(
        (currentLog.measurementDate.getTime() - previousLog.measurementDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      stats.daysSinceLastWeigh = daysDiff;
    }

    // Calculate 30-day average
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = logs.filter(log => log.measurementDate >= thirtyDaysAgo);
    
    if (recentLogs.length > 0) {
      stats.averageWeight = recentLogs.reduce((sum, log) => sum + log.weightGrams, 0) / recentLogs.length;
    }

    // Determine trend (last 3 measurements)
    if (logs.length >= 3) {
      const last3 = logs.slice(0, 3);
      const firstWeight = last3[2].weightGrams;
      const lastWeight = last3[0].weightGrams;
      const changePercent = ((lastWeight - firstWeight) / firstWeight) * 100;

      if (changePercent > 2) {
        stats.trend = 'gaining';
      } else if (changePercent < -2) {
        stats.trend = 'losing';
      } else {
        stats.trend = 'stable';
      }

      // Calculate growth rate (grams per month)
      const daysDiff = Math.floor(
        (last3[0].measurementDate.getTime() - last3[2].measurementDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 0) {
        const gramsPerDay = (lastWeight - firstWeight) / daysDiff;
        stats.growthRate = gramsPerDay * 30; // Convert to monthly rate
      }
    }

    return stats;
  }

  /**
   * Get comprehensive analytics for an animal
   */
  async getWeightAnalytics(enclosureAnimalId: string): Promise<WeightAnalytics> {
    const logs = await this.getWeightLogs(enclosureAnimalId);
    const stats = await this.getWeightStats(enclosureAnimalId);

    const analytics: WeightAnalytics = {
      totalEntries: logs.length,
      stats,
      chartData: [],
    };

    if (logs.length > 0) {
      // Reverse logs for chronological chart data
      const chronologicalLogs = [...logs].reverse();
      
      analytics.firstWeighDate = chronologicalLogs[0].measurementDate;
      analytics.lastWeighDate = logs[0].measurementDate;
      analytics.minWeight = Math.min(...logs.map(l => l.weightGrams));
      analytics.maxWeight = Math.max(...logs.map(l => l.weightGrams));
      analytics.averageWeight = logs.reduce((sum, l) => sum + l.weightGrams, 0) / logs.length;

      // Prepare chart data
      analytics.chartData = chronologicalLogs.map(log => ({
        date: log.measurementDate,
        weightGrams: log.weightGrams,
        formattedDate: log.measurementDate.toLocaleDateString(),
        formattedWeight: `${log.weightGrams.toFixed(0)}g`,
      }));
    }

    return analytics;
  }

  /**
   * Map database records to WeightLog objects
   */
  private mapToWeightLogs(data: any[]): WeightLog[] {
    return data.map(row => this.mapToWeightLog(row));
  }

  private mapToWeightLog(data: any): WeightLog {
    return {
      id: data.id,
      userId: data.user_id,
      enclosureAnimalId: data.enclosure_animal_id,
      weightGrams: parseFloat(data.weight_grams),
      measurementDate: new Date(data.measurement_date),
      notes: data.notes,
      photoUrl: data.photo_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export const weightTrackingService = new WeightTrackingService();
