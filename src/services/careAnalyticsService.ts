import { supabase } from '../lib/supabase';
import { careTaskService } from './careTaskService';
import { getCustomWeekdayIntervalDays } from '../utils/customTaskFrequency';
import type { CareLog, CareTask, TaskType, Enclosure, EnclosureAnimal } from '../types/careCalendar';
import type {
  CareLogAnalytics,
  TaskTypeStats,
  CareLogWithTask,
  HeatmapDay,
  CareLogFilters,
  TaskStreakSummary,
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
    const currentStreakTask = this.getBestCurrentStreakTask(logs, tasks);
    const longestStreakTask = this.getBestLongestStreakTask(logs, tasks);
    const logsLast30Days = this.getLogsInRange(logs, 30);
    
    const analytics: CareLogAnalytics = {
      totalCompletions: logs.filter(l => !l.skipped).length,
      totalSkipped: logs.filter(l => l.skipped).length,
      completionRate: this.calculateCompletionRate(logs),
      completedLast30Days: this.countLogsInRange(logs.filter(l => !l.skipped), 30),
      skipRateLast30Days: this.calculateSkipRate(logsLast30Days),
      coverageScoreLast30Days: this.calculateCoverageScore(tasks, logsLast30Days),
      logsLast7Days: this.countLogsInRange(logs, 7),
      logsLast30Days: this.countLogsInRange(logs, 30),
      logsAllTime: logs.length,
      currentStreak: currentStreakTask?.streak ?? 0,
      longestStreak: longestStreakTask?.streak ?? 0,
      currentStreakTask,
      longestStreakTask,
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

  private getLogsInRange(logs: CareLog[], daysAgo: number): CareLog[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    return logs.filter(l => l.completedAt >= cutoff);
  }

  private calculateSkipRate(logs: CareLog[]): number {
    if (logs.length === 0) return 0;
    const skipped = logs.filter(l => l.skipped).length;
    return Math.round((skipped / logs.length) * 100);
  }

  private calculateCoverageScore(tasks: CareTask[], logs: CareLog[]): number {
    if (tasks.length === 0) return 0;

    const taskIds = new Set(tasks.map(t => t.id));
    const coveredTaskIds = new Set(
      logs
        .filter(l => !l.skipped && taskIds.has(l.taskId))
        .map(l => l.taskId)
    );

    return Math.round((coveredTaskIds.size / tasks.length) * 100);
  }

  private getBestCurrentStreakTask(logs: CareLog[], tasks: CareTask[]): TaskStreakSummary | undefined {
    if (logs.length === 0 || tasks.length === 0) return undefined;

    const logsByTask = this.groupLogsByTask(logs);
    let best: TaskStreakSummary | undefined;

    tasks.forEach(task => {
      const taskLogs = logsByTask.get(task.id) || [];
      const streak = this.calculateTaskCurrentStreak(task, taskLogs);
      if (!best || streak > best.streak) {
        best = {
          taskId: task.id,
          taskTitle: task.title,
          streak,
        };
      }
    });

    return best?.streak ? best : undefined;
  }

  private getBestLongestStreakTask(logs: CareLog[], tasks: CareTask[]): TaskStreakSummary | undefined {
    if (logs.length === 0 || tasks.length === 0) return undefined;

    const logsByTask = this.groupLogsByTask(logs);
    let best: TaskStreakSummary | undefined;

    tasks.forEach(task => {
      const taskLogs = logsByTask.get(task.id) || [];
      const streak = this.calculateTaskLongestStreak(task, taskLogs);
      if (!best || streak > best.streak) {
        best = {
          taskId: task.id,
          taskTitle: task.title,
          streak,
        };
      }
    });

    return best?.streak ? best : undefined;
  }

  private groupLogsByTask(logs: CareLog[]): Map<string, CareLog[]> {
    const grouped = new Map<string, CareLog[]>();
    logs.forEach(log => {
      if (log.skipped) return;
      const current = grouped.get(log.taskId) || [];
      current.push(log);
      grouped.set(log.taskId, current);
    });
    return grouped;
  }

  private calculateTaskCurrentStreak(task: CareTask, logs: CareLog[]): number {
    if (logs.length === 0) return 0;

    const completedDates = this.getUniqueCompletionDates(logs);
    if (completedDates.length === 0) return 0;

    const intervalDays = this.getFrequencyIntervalDays(task);
    let streak = 1;
    let currentDate = completedDates[0];

    for (let i = 1; i < completedDates.length; i++) {
      const logDate = completedDates[i];
      const dayDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff <= intervalDays) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateTaskLongestStreak(task: CareTask, logs: CareLog[]): number {
    if (logs.length === 0) return 0;

    const completedDates = this.getUniqueCompletionDates(logs).slice().reverse();
    if (completedDates.length === 0) return 0;

    const intervalDays = this.getFrequencyIntervalDays(task);
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const currentDate = completedDates[i];
      const previousDate = completedDates[i - 1];
      const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff <= intervalDays) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(maxStreak, currentStreak);
  }

  private getUniqueCompletionDates(logs: CareLog[]): Date[] {
    return logs
      .map(log => {
        const day = new Date(log.completedAt);
        day.setHours(0, 0, 0, 0);
        return day;
      })
      .sort((a, b) => b.getTime() - a.getTime())
      .filter((date, index, arr) => index === 0 || date.getTime() !== arr[index - 1].getTime());
  }

  private getFrequencyIntervalDays(task: CareTask): number {
    switch (task.frequency) {
      case 'daily':
        return 1;
      case 'every-other-day':
        return 2;
      case 'twice-weekly':
        return 3;
      case 'weekly':
        return 7;
      case 'bi-weekly':
        return 14;
      case 'monthly':
        return 31;
      case 'custom':
        if (task.customFrequencyWeekdays && task.customFrequencyWeekdays.length > 0) {
          return getCustomWeekdayIntervalDays(task.customFrequencyWeekdays);
        }
        return task.customFrequencyDays && task.customFrequencyDays > 0
          ? task.customFrequencyDays
          : 1;
      default:
        return 1;
    }
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
   * 
   * PERFORMANCE: Batch fetch all animals and enclosures upfront to avoid N+1 queries
   */
  private async enrichLogsWithTaskInfo(logs: CareLog[]): Promise<CareLogWithTask[]> {
    if (logs.length === 0) return [];

    const tasks = await careTaskService.getTasksWithLogs();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Collect unique animal and enclosure IDs needed
    const animalIds = new Set<string>();
    const enclosureIds = new Set<string>();
    
    logs.forEach(log => {
      const task = taskMap.get(log.taskId);
      if (task) {
        if (task.enclosureAnimalId) animalIds.add(task.enclosureAnimalId);
        if (task.enclosureId) enclosureIds.add(task.enclosureId);
      }
    });

    // Batch fetch all animals and enclosures at once
    const [animals, enclosures] = await Promise.all([
      animalIds.size > 0 ? this.batchFetchAnimals(Array.from(animalIds)) : Promise.resolve([]),
      enclosureIds.size > 0 ? this.batchFetchEnclosures(Array.from(enclosureIds)) : Promise.resolve([]),
    ]);

    // Create lookup maps
    const animalMap = new Map(animals.map(a => [a.id, a]));
    const enclosureMap = new Map(enclosures.map(e => [e.id, e]));

    // Enrich logs using the maps (no additional queries)
    const enrichedLogs: CareLogWithTask[] = [];

    for (const log of logs) {
      const task = taskMap.get(log.taskId);
      if (!task) continue;

      let animalName: string | undefined;
      let enclosureName: string | undefined;

      if (task.enclosureAnimalId) {
        const animal = animalMap.get(task.enclosureAnimalId);
        if (animal) {
          animalName = animal.name || `Animal #${animal.animalNumber}`;
        }
      }

      if (task.enclosureId) {
        const enclosure = enclosureMap.get(task.enclosureId);
        if (enclosure) {
          enclosureName = enclosure.name;
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
   * Batch fetch multiple animals by IDs
   */
  private async batchFetchAnimals(ids: string[]): Promise<EnclosureAnimal[]> {
    try {
      const { data, error } = await supabase
        .from('enclosure_animals')
        .select('*')
        .in('id', ids);
      
      if (error) throw error;
      
      // Map the results inline
      return (data || []).map(row => ({
        id: row.id,
        enclosureId: row.enclosure_id || undefined,
        userId: row.user_id,
        name: row.name,
        animalNumber: row.animal_number,
        gender: row.gender,
        morph: row.morph,
        birthday: row.birthday ? new Date(row.birthday) : undefined,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (e) {
      console.error('Error batch fetching animals:', e);
      return [];
    }
  }

  /**
   * Batch fetch multiple enclosures by IDs
   */
  private async batchFetchEnclosures(ids: string[]): Promise<Enclosure[]> {
    try {
      const { data, error } = await supabase
        .from('enclosures')
        .select('*')
        .in('id', ids);
      
      if (error) throw error;
      
      // Map the results inline
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        animalId: row.animal_id,
        animalName: row.animal_name,
        description: row.description,
        setupDate: row.setup_date ? new Date(row.setup_date) : undefined,
        animalBirthday: row.animal_birthday ? new Date(row.animal_birthday) : undefined,
        substrateType: row.substrate_type,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (e) {
      console.error('Error batch fetching enclosures:', e);
      return [];
    }
  }

  /**
   * Generate heatmap data (activity per day)
   */
  private generateHeatmapData(logs: CareLog[]): HeatmapDay[] {
    // Group by day
    const completedByDay = new Map<string, number>();
    const skippedByDay = new Map<string, number>();

    logs.forEach(log => {
      const day = new Date(log.completedAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();

      if (log.skipped) {
        skippedByDay.set(key, (skippedByDay.get(key) || 0) + 1);
      } else {
        completedByDay.set(key, (completedByDay.get(key) || 0) + 1);
      }
    });

    // Generate last 90 days
    const heatmapData: HeatmapDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString();
      const completedCount = completedByDay.get(key) || 0;
      const skippedCount = skippedByDay.get(key) || 0;
      
      heatmapData.push({
        date,
        count: completedCount + skippedCount,
        completedCount,
        skippedCount,
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
