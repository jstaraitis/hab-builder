/**
 * Care Log Analytics Types
 * 
 * Analytics and statistics derived from care task completion logs
 */

import type { TaskType, CareLog, EnclosureSnapshot, EnclosureEvent, MoldSeverity } from './careCalendar';

export interface CareLogAnalytics {
  // Overall stats
  totalCompletions: number;
  totalSkipped: number;
  completionRate: number; // Percentage of completions vs skips
  completedLast30Days: number;
  skipRateLast30Days: number;
  coverageScoreLast30Days: number;
  
  // Time-based stats
  logsLast7Days: number;
  logsLast30Days: number;
  logsAllTime: number;
  
  // Streak tracking
  currentStreak: number; // Consecutive scheduled completions (max current task streak)
  longestStreak: number; // Best per-task streak across history
  currentStreakTask?: TaskStreakSummary;
  longestStreakTask?: TaskStreakSummary;
  
  // Task type breakdown
  taskTypeStats: TaskTypeStats[];
  
  // Recent activity
  recentLogs: CareLogWithTask[];
  
  // Calendar heatmap data
  heatmapData: HeatmapDay[];
}

export interface TaskStreakSummary {
  taskId: string;
  taskTitle: string;
  streak: number;
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
  completedCount: number;
  skippedCount: number;
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

export type BioactiveCycleStage = 'not-bioactive' | 'new' | 'cycling' | 'stabilizing' | 'stable';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface EnclosureStabilityMetrics {
  enclosureId: string;
  computedAt: Date;
  score: number; // 0-100 overall enclosure stability
  temperatureStabilityScore: number; // 0-100
  humidityStabilityScore: number; // 0-100
  ecosystemHealthScore: number; // 0-100
  incidentRateLast30Days: number;
  snapshotCountLast30Days: number;
  warningFlags: string[];
}

export interface BioactiveCycleStatus {
  enclosureId: string;
  stage: BioactiveCycleStage;
  daysSinceBioactiveStart?: number;
  lastMoldSeverity?: MoldSeverity;
  moldEventsLast30Days: number;
  cleanupCrewTrend: TrendDirection;
  plantHealthTrend: TrendDirection;
}

export interface PlantGrowthSummary {
  enclosureId: string;
  trend: TrendDirection;
  averageHealthLast30Days?: number;
  averageHealthPrevious30Days?: number;
  totalPlantEventsLast30Days: number;
  replacementsLast90Days: number;
}

export interface EnclosureExperienceAnalytics {
  enclosureId: string;
  generatedAt: Date;
  snapshots: EnclosureSnapshot[];
  events: EnclosureEvent[];
  stability: EnclosureStabilityMetrics;
  bioactive: BioactiveCycleStatus;
  plantGrowth: PlantGrowthSummary;
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
  'gut-load': {
    label: 'Gut-Load',
    icon: 'Flame',
    color: 'amber',
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
  'temperature-check': {
    label: 'Temperature Check',
    icon: 'Thermometer',
    color: 'orange',
  },
  'humidity-check': {
    label: 'Humidity Check',
    icon: 'Droplets',
    color: 'blue',
  },
  'uvb-check': {
    label: 'UVB Check',
    icon: 'Sun',
    color: 'yellow',
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
  'substrate-check': {
    label: 'Substrate Maintenance',
    icon: 'Brush',
    color: 'amber',
  },
  'mold-check': {
    label: 'Mold Monitoring',
    icon: 'AlertTriangle',
    color: 'orange',
  },
  'cleanup-crew-check': {
    label: 'Cleanup Crew Check',
    icon: 'Sparkles',
    color: 'emerald',
  },
  'plant-care': {
    label: 'Plant Care',
    icon: 'Leaf',
    color: 'green',
  },
  'pest-check': {
    label: 'Pest Monitoring',
    icon: 'Bug',
    color: 'red',
  },
  custom: {
    label: 'Custom',
    icon: 'FileText',
    color: 'slate',
  },
};
