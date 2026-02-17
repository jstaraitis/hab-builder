import { supabase } from '../lib/supabase';
import type { CareTask, CareLog, CareTaskWithLogs } from '../types/careCalendar';

/**
 * Care Task Service Interface
 * 
 * Provides abstraction layer for care task operations.
 * Can be swapped with different implementations (Supabase, localStorage, API, etc.)
 */
export interface ICareTaskService {
  // Tasks
  getTasks(userId?: string): Promise<CareTask[]>;
  getTaskById(id: string): Promise<CareTask | null>;
  getTasksWithLogs(userId?: string): Promise<CareTaskWithLogs[]>;
  createTask(task: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareTask>;
  updateTask(id: string, updates: Partial<CareTask>): Promise<CareTask>;
  deleteTask(id: string): Promise<void>;
  
  // Logs
  completeTask(taskId: string, additionalLogData?: Partial<CareLog>): Promise<CareLog>;
  skipTask(taskId: string, reason: string): Promise<CareLog>;
  getTaskLogs(taskId: string): Promise<CareLog[]>;
}

/**
 * Supabase Implementation of Care Task Service
 * 
 * Database Schema Required:
 * 
 * CREATE TABLE care_tasks (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES auth.users(id),
 *   enclosure_id TEXT,
 *   animal_id TEXT NOT NULL,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   type TEXT NOT NULL,
 *   frequency TEXT NOT NULL,
 *   custom_frequency_days INTEGER,
 *   scheduled_time TEXT,
 *   next_due_at TIMESTAMPTZ NOT NULL,
 *   notes TEXT,
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE care_logs (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   task_id UUID REFERENCES care_tasks(id) ON DELETE CASCADE,
 *   user_id UUID REFERENCES auth.users(id),
 *   completed_at TIMESTAMPTZ NOT NULL,
 *   notes TEXT,
 *   skipped BOOLEAN DEFAULT false,
 *   skip_reason TEXT
 * );
 * 
 * -- Indexes
 * CREATE INDEX idx_care_tasks_user_id ON care_tasks(user_id);
 * CREATE INDEX idx_care_tasks_next_due ON care_tasks(next_due_at);
 * CREATE INDEX idx_care_logs_task_id ON care_logs(task_id);
 * CREATE INDEX idx_care_logs_completed_at ON care_logs(completed_at);
 */
export class SupabaseCareService implements ICareTaskService {
  async getTasks(userId?: string): Promise<CareTask[]> {
    let query = supabase
      .from('care_tasks')
      .select(`
        *,
        enclosure_animals (
          id,
          name,
          animal_number,
          enclosures (
            id,
            name,
            animal_id,
            animal_name
          )
        )
      `)
      .eq('is_active', true)
      .order('next_due_at', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return this.mapTasksFromDb(data || []);
  }

  async getTaskById(id: string): Promise<CareTask | null> {
    const { data, error } = await supabase
      .from('care_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapTaskFromDb(data);
  }

  async getTasksWithLogs(userId?: string): Promise<CareTaskWithLogs[]> {
    let query = supabase
      .from('care_tasks')
      .select(`
        *,
        care_logs (*),
        enclosure_animals (
          id,
          name,
          animal_number,
          enclosures (
            id,
            name,
            animal_id,
            animal_name
          )
        )
      `)
      .eq('is_active', true)
      .order('next_due_at', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    return (data || []).map(row => {
      const task = this.mapTaskFromDb(row);
      const logs = (row.care_logs || []).map(this.mapLogFromDb);
      const lastCompleted = logs.length > 0
        ? new Date(Math.max(...logs.map((l: any) => l.completedAt.getTime())))
        : undefined;

      return {
        ...task,
        logs,
        lastCompleted,
        streak: this.calculateStreak(logs),
      };
    });
  }

  async createTask(taskData: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareTask> {
    const now = new Date();
    const dbTask = this.mapTaskToDb({
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    const { data, error } = await supabase
      .from('care_tasks')
      .insert([dbTask])
      .select()
      .single();

    if (error) throw error;

    return this.mapTaskFromDb(data);
  }

  async updateTask(id: string, updates: Partial<CareTask>): Promise<CareTask> {
    const dbUpdates = {
      ...this.mapTaskToDb(updates as CareTask),
      updated_at: new Date().toISOString(),
    };

    // Debug logging for notification updates
    if ('notificationEnabled' in updates) {
      console.log('[careTaskService] Updating notification settings:', {
        taskId: id,
        notificationEnabled: updates.notificationEnabled,
        notificationMinutesBefore: updates.notificationMinutesBefore,
        dbUpdates: {
          notification_enabled: dbUpdates.notification_enabled,
          notification_minutes_before: dbUpdates.notification_minutes_before,
        }
      });
    }

    const { data, error } = await supabase
      .from('care_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[careTaskService] Update failed:', error);
      throw error;
    }

    console.log('[careTaskService] Update successful, returned data:', {
      id: data.id,
      notification_enabled: data.notification_enabled,
      notification_minutes_before: data.notification_minutes_before,
    });

    return this.mapTaskFromDb(data);
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('care_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async completeTask(taskId: string, additionalLogData?: Partial<CareLog>): Promise<CareLog> {
    // Get current task to calculate next due date
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const completedAt = new Date();
    const nextDueAt = this.calculateNextDueDate(task, completedAt);

    // Create log entry with optional feeding data
    const log: Omit<CareLog, 'id'> = {
      taskId,
      userId: task.userId,
      completedAt,
      skipped: false,
      ...additionalLogData, // Merge in any additional log data (feeder type, quantities, etc.)
    };

    const dbLog = this.mapLogToDb({ ...log, id: crypto.randomUUID() });

    const { data: logData, error: logError } = await supabase
      .from('care_logs')
      .insert([dbLog])
      .select()
      .single();

    if (logError) throw logError;

    // Update task's next due date
    await this.updateTask(taskId, { nextDueAt });

    return this.mapLogFromDb(logData);
  }

  async skipTask(taskId: string, reason: string): Promise<CareLog> {
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const completedAt = new Date();
    const nextDueAt = this.calculateNextDueDate(task, completedAt);

    const log: Omit<CareLog, 'id'> = {
      taskId,
      userId: task.userId,
      completedAt,
      skipped: true,
      skipReason: reason,
    };

    const dbLog = this.mapLogToDb({ ...log, id: crypto.randomUUID() });

    const { data: logData, error: logError } = await supabase
      .from('care_logs')
      .insert([dbLog])
      .select()
      .single();

    if (logError) throw logError;

    await this.updateTask(taskId, { nextDueAt });

    return this.mapLogFromDb(logData);
  }

  async getTaskLogs(taskId: string): Promise<CareLog[]> {
    const { data, error } = await supabase
      .from('care_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapLogFromDb);
  }

  // Helper: Calculate next due date based on frequency
  private calculateNextDueDate(task: CareTask, from: Date): Date {
    const next = new Date(from);
    
    switch (task.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'every-other-day':
        next.setDate(next.getDate() + 2);
        break;
      case 'twice-weekly':
        next.setDate(next.getDate() + 3); // Approximate
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'custom':
        next.setDate(next.getDate() + (task.customFrequencyDays || 1));
        break;
    }

    // Set scheduled time if provided
    if (task.scheduledTime) {
      const [hours, minutes] = task.scheduledTime.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    return next;
  }

  // Helper: Calculate completion streak
  private calculateStreak(logs: CareLog[]): number {
    if (logs.length === 0) return 0;

    const completedLogs = logs
      .filter(l => !l.skipped)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    if (completedLogs.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(completedLogs[0].completedAt);

    for (let i = 1; i < completedLogs.length; i++) {
      const logDate = new Date(completedLogs[i].completedAt);
      const dayDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff <= 1) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // Database mapping helpers
  private mapTaskFromDb(row: any): CareTask {
    return {
      id: row.id,
      userId: row.user_id,
      enclosureId: row.enclosure_id,
      enclosureAnimalId: row.enclosure_animal_id,
      animalId: row.animal_id,
      title: row.title,
      description: row.description,
      type: row.type,
      frequency: row.frequency,
      customFrequencyDays: row.custom_frequency_days,
      scheduledTime: row.scheduled_time,
      nextDueAt: new Date(row.next_due_at),
      notes: row.notes,
      isActive: row.is_active,
      notificationEnabled: row.notification_enabled,
      notificationMinutesBefore: row.notification_minutes_before,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTasksFromDb(rows: any[]): CareTask[] {
    return rows.map(row => this.mapTaskFromDb(row));
  }

  private mapTaskToDb(task: Partial<CareTask>): any {
    const mapped: any = {};
    
    if (task.id !== undefined) mapped.id = task.id;
    if (task.userId !== undefined) mapped.user_id = task.userId;
    if (task.enclosureId !== undefined) mapped.enclosure_id = task.enclosureId;
    if (task.enclosureAnimalId !== undefined) mapped.enclosure_animal_id = task.enclosureAnimalId;
    if (task.animalId !== undefined) mapped.animal_id = task.animalId;
    if (task.title !== undefined) mapped.title = task.title;
    if (task.description !== undefined) mapped.description = task.description;
    if (task.type !== undefined) mapped.type = task.type;
    if (task.frequency !== undefined) mapped.frequency = task.frequency;
    if (task.customFrequencyDays !== undefined) mapped.custom_frequency_days = task.customFrequencyDays;
    if (task.scheduledTime !== undefined) mapped.scheduled_time = task.scheduledTime;
    if (task.nextDueAt !== undefined) mapped.next_due_at = task.nextDueAt.toISOString();
    if (task.notes !== undefined) mapped.notes = task.notes;
    if (task.isActive !== undefined) mapped.is_active = task.isActive;
    if (task.notificationEnabled !== undefined) mapped.notification_enabled = task.notificationEnabled;
    if (task.notificationMinutesBefore !== undefined) mapped.notification_minutes_before = task.notificationMinutesBefore;
    if (task.createdAt !== undefined) mapped.created_at = task.createdAt.toISOString();
    if (task.updatedAt !== undefined) mapped.updated_at = task.updatedAt.toISOString();
    
    return mapped;
  }

  private mapLogFromDb(row: any): CareLog {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      completedAt: new Date(row.completed_at),
      notes: row.notes,
      skipped: row.skipped,
      skipReason: row.skip_reason,
      feederType: row.feeder_type,
      quantityOffered: row.quantity_offered,
      quantityEaten: row.quantity_eaten,
      refusalNoted: row.refusal_noted,
      supplementUsed: row.supplement_used,
    };
  }

  private mapLogToDb(log: CareLog): any {
    return {
      id: log.id,
      task_id: log.taskId,
      user_id: log.userId,
      completed_at: log.completedAt.toISOString(),
      notes: log.notes,
      skipped: log.skipped,
      skip_reason: log.skipReason,
      feeder_type: log.feederType,
      quantity_offered: log.quantityOffered,
      quantity_eaten: log.quantityEaten,
      refusal_noted: log.refusalNoted,
      supplement_used: log.supplementUsed,
    };
  }
}

// Export singleton instance
export const careTaskService = new SupabaseCareService();
