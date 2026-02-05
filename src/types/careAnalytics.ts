/**
 * Care Log Analytics Types
 * 
 * Analytics and statistics derived from care task completion logs
 */

import type { TaskType, CareLog } from './careCalendar';

export interface CareLogAnalytics {
  // Overall stats
  totalCompletions: number;
  totalSkipped: number;
  completionRate: number; // Percentage of completions vs skips
  
  // Time-based stats
  logsLast7Days: number;
  logsLast30Days: number;
  logsAllTime: number;
  
  // Streak tracking
  currentStreak: number; // Days in a row with at least one completion
  longestStreak: number;
  
  // Task type breakdown
  taskTypeStats: TaskTypeStats[];
  
  // Recent activity
  recentLogs: CareLogWithTask[];
  
  // Calendar heatmap data
  heatmapData: HeatmapDay[];
}

export interface TaskTypeStats {
  type: TaskType;
  label: string;
  icon: string; // Icon name for display
  totalCompletions: number;
  lastCompleted?: Date;
  averagePerWeek: number;
  completionRate: number; // Percentage
  color: string; // Tailwind color class
}

export interface CareLogWithTask {
  log: CareLog;
  taskTitle: string;
  taskType: TaskType;
  animalName?: string;
  enclosureName?: string;
}

export interface HeatmapDay {
  date: Date;
  count: number;
  formattedDate: string;
}

export interface CareLogFilters {
  startDate?: Date;
  endDate?: Date;
  taskTypes?: TaskType[];
  enclosureId?: string;
  enclosureAnimalId?: string;
  excludeSkipped?: boolean;
}

export interface TaskTypeComparison {
  type: TaskType;
  label: string;
  expected: number; // Expected completions based on frequency
  actual: number; // Actual completions
  percentage: number; // Actual / Expected * 100
  color: string;
}

/**
 * Task type display configuration
 */
export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string; color: string }> = {
  feeding: {
    label: 'Feeding',
    icon: 'UtensilsCrossed',
    color: 'emerald',
  },
  misting: {
    label: 'Misting',
    icon: 'Droplets',
    color: 'blue',
  },
  'water-change': {
    label: 'Water Change',
    icon: 'Waves',
    color: 'cyan',
  },
  'spot-clean': {
    label: 'Spot Clean',
    icon: 'Brush',
    color: 'purple',
  },
  'deep-clean': {
    label: 'Deep Clean',
    icon: 'Sparkles',
    color: 'violet',
  },
  'health-check': {
    label: 'Health Check',
    icon: 'Stethoscope',
    color: 'red',
  },
  supplement: {
    label: 'Supplement',
    icon: 'Pill',
    color: 'orange',
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'Wrench',
    color: 'gray',
  },
  custom: {
    label: 'Custom',
    icon: 'FileText',
    color: 'slate',
  },
};
