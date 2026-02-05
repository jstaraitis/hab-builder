import { supabase } from '../lib/supabase';
import { careTaskService } from './careTaskService';
import { enclosureService } from './enclosureService';
import { enclosureAnimalService } from './enclosureAnimalService';
import type { CareLog, CareTask, TaskType } from '../types/careCalendar';
import type {
  CareLogAnalytics,
  TaskTypeStats,
  CareLogWithTask,
  HeatmapDay,
  CareLogFilters,
} from '../types/careAnalytics';
import { TASK_TYPE_CONFIG } from '../types/careAnalytics';

/**
 * Care Analytics Service
 * 
 * Analyzes care task completion logs to provide insights and statistics
 */
class CareAnalyticsService {
  
  /**
   * Get comprehensive analytics for a user's care logs
   */
  async getAnalytics(userId: string, filters?: CareLogFilters): Promise<CareLogAnalytics> {
    const logs = await this.getUserLogs(userId, filters);
    const tasks = await careTaskService.getTasks(userId);
    
    const analytics: CareLogAnalytics = {
      totalCompletions: logs.filter(l => !l.skipped).length,
      totalSkipped: logs.filter(l => l.skipped).length,
      completionRate: this.calculateCompletionRate(logs),
      logsLast7Days: this.countLogsInRange(logs, 7),
      logsLast30Days: this.countLogsInRange(logs, 30),
      logsAllTime: logs.length,
      currentStreak: await this.calculateCurrentStreak(logs),
      longestStreak: await this.calculateLongestStreak(logs),
      taskTypeStats: await this.calculateTaskTypeStats(logs, tasks),
      recentLogs: await this.enrichLogsWithTaskInfo(logs.slice(0, 20)),
      heatmapData: this.generateHeatmapData(logs),
    };
    
    return analytics;
  }

  /**
   * Get all care logs for a user with optional filters
   */
  async getUserLogs(userId: string, filters?: CareLogFilters): Promise<CareLog[]> {
    let query = supabase
      .from('care_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('completed_at', filters.startDate.toISOString());
    }
    
    if (filters?.endDate) {
      query = query.lte('completed_at', filters.endDate.toISOString());
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching care logs:', error);
      throw new Error('Failed to fetch care logs');
    }

    let logs = this.mapLogsFromDb(data || []);

    // Filter by task type if specified
    if (filters?.taskTypes && filters.taskTypes.length > 0) {
      const tasks = await careTaskService.getTasks(userId);
      const taskIdsByType = new Set(
        tasks
          .filter(t => filters.taskTypes!.includes(t.type))
          .map(t => t.id)
      );
      logs = logs.filter(l => taskIdsByType.has(l.taskId));
    }

    // Exclude skipped if specified
    if (filters?.excludeSkipped) {
      logs = logs.filter(l => !l.skipped);
    }

    return logs;
  }

  /**
   * Calculate completion rate (completed vs skipped)
   */
  private calculateCompletionRate(logs: CareLog[]): number {
    if (logs.length === 0) return 100;
    const completed = logs.filter(l => !l.skipped).length;
    return Math.round((completed / logs.length) * 100);
  }

  /**
   * Count logs within date range (days ago)
   */
  private countLogsInRange(logs: CareLog[], daysAgo: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    return logs.filter(l => l.completedAt >= cutoff).length;
  }

  /**
   * Calculate current streak (consecutive days with at least one completion)
   */
  private async calculateCurrentStreak(logs: CareLog[]): Promise<number> {
    if (logs.length === 0) return 0;

    const completedLogs = logs.filter(l => !l.skipped);
    if (completedLogs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group logs by day
    const logsByDay = new Map<string, CareLog[]>();
    completedLogs.forEach(log => {
      const day = new Date(log.completedAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();
      if (!logsByDay.has(key)) {
        logsByDay.set(key, []);
      }
      logsByDay.get(key)!.push(log);
    });

    // Check each day backwards from today
    let currentDate = new Date(today);
    while (true) {
      const key = currentDate.toISOString();
      if (logsByDay.has(key)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate longest streak ever
   */
  private async calculateLongestStreak(logs: CareLog[]): Promise<number> {
    if (logs.length === 0) return 0;

    const completedLogs = logs.filter(l => !l.skipped);
    if (completedLogs.length === 0) return 0;

    // Group logs by day
    const logsByDay = new Map<string, CareLog[]>();
    completedLogs.forEach(log => {
      const day = new Date(log.completedAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();
      if (!logsByDay.has(key)) {
        logsByDay.set(key, []);
      }
      logsByDay.get(key)!.push(log);
    });

    // Sort days
    const sortedDays = Array.from(logsByDay.keys()).sort();
    
    let maxStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;

    sortedDays.forEach(dayKey => {
      const currentDate = new Date(dayKey);
      
      if (previousDate) {
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      previousDate = currentDate;
    });

    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  }

  /**
   * Calculate statistics broken down by task type
   */
  private async calculateTaskTypeStats(logs: CareLog[], tasks: CareTask[]): Promise<TaskTypeStats[]> {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const statsByType = new Map<TaskType, { completions: number; lastCompleted?: Date }>();

    // Group logs by task type
    logs.forEach(log => {
      if (log.skipped) return;
      
      const task = taskMap.get(log.taskId);
      if (!task) return;

      const current = statsByType.get(task.type) || { completions: 0 };
      current.completions++;
      
      if (!current.lastCompleted || log.completedAt > current.lastCompleted) {
        current.lastCompleted = log.completedAt;
      }
      
      statsByType.set(task.type, current);
    });

    // Calculate average per week
    const oldestLog = logs.length > 0 ? logs[logs.length - 1].completedAt : new Date();
    const weeksSinceStart = Math.max(1, Math.ceil((Date.now() - oldestLog.getTime()) / (1000 * 60 * 60 * 24 * 7)));

    // Build stats array
    const stats: TaskTypeStats[] = [];
    
    statsByType.forEach((data, type) => {
      const config = TASK_TYPE_CONFIG[type];
      stats.push({
        type,
        label: config.label,
        icon: config.icon,
        totalCompletions: data.completions,
        lastCompleted: data.lastCompleted,
        averagePerWeek: Math.round((data.completions / weeksSinceStart) * 10) / 10,
        completionRate: 100, // Could calculate based on expected frequency
        color: config.color,
      });
    });

    return stats.sort((a, b) => b.totalCompletions - a.totalCompletions);
  }

  /**
   * Enrich logs with task information
   */
  private async enrichLogsWithTaskInfo(logs: CareLog[]): Promise<CareLogWithTask[]> {
    if (logs.length === 0) return [];

    const tasks = await careTaskService.getTasksWithLogs();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const enrichedLogs: CareLogWithTask[] = [];

    for (const log of logs) {
      const task = taskMap.get(log.taskId);
      if (!task) continue;

      // Get animal/enclosure names if available
      let animalName: string | undefined;
      let enclosureName: string | undefined;

      if (task.enclosureAnimalId) {
        try {
          const animal = await enclosureAnimalService.getAnimalById(task.enclosureAnimalId);
          if (animal) {
            animalName = animal.name || `Animal #${animal.animalNumber}`;
          }
        } catch (e) {
          console.error('Error fetching animal:', e);
        }
      }

      if (task.enclosureId) {
        try {
          const enclosure = await enclosureService.getEnclosureById(task.enclosureId);
          if (enclosure) {
            enclosureName = enclosure.name;
          }
        } catch (e) {
          console.error('Error fetching enclosure:', e);
        }
      }

      enrichedLogs.push({
        log,
        taskTitle: task.title,
        taskType: task.type,
        animalName,
        enclosureName,
      });
    }

    return enrichedLogs;
  }

  /**
   * Generate heatmap data (activity per day)
   */
  private generateHeatmapData(logs: CareLog[]): HeatmapDay[] {
    const completedLogs = logs.filter(l => !l.skipped);
    
    // Group by day
    const countsByDay = new Map<string, number>();
    completedLogs.forEach(log => {
      const day = new Date(log.completedAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();
      countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    });

    // Generate last 90 days
    const heatmapData: HeatmapDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString();
      
      heatmapData.push({
        date,
        count: countsByDay.get(key) || 0,
        formattedDate: date.toLocaleDateString(),
      });
    }

    return heatmapData;
  }

  /**
   * Map database records to CareLog objects
   */
  private mapLogsFromDb(data: any[]): CareLog[] {
    return data.map(row => ({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      completedAt: new Date(row.completed_at),
      notes: row.notes,
      skipped: row.skipped || false,
      skipReason: row.skip_reason,
    }));
  }
}

export const careAnalyticsService = new CareAnalyticsService();
