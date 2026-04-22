import { TrendingUp, CheckCircle, Calendar, Award } from 'lucide-react';
import type { CareLogAnalytics } from '../../types/careAnalytics';

interface AnalyticsOverviewProps {
  analytics: CareLogAnalytics;
}

export function AnalyticsOverview({ analytics }: Readonly<AnalyticsOverviewProps>) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
      {/* Total Completions */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
          <span className="text-xs sm:text-sm text-muted">Completed</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.totalCompletions}
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          {analytics.logsLast30Days} this month
        </p>
      </div>

      {/* Completion Rate */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs sm:text-sm text-muted">Rate</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.completionRate}%
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Success rate
        </p>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-xs sm:text-sm text-white">Task Streak</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.currentStreak}
          <span className="text-sm sm:text-base font-normal text-muted ml-0.5 sm:ml-1">
            {analytics.currentStreak === 1 ? 'completion' : 'completions'}
          </span>
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Current best per-task streak
        </p>
        {analytics.currentStreakTask?.taskTitle && (
          <p className="text-[11px] sm:text-xs text-muted mt-1 truncate">
            {analytics.currentStreakTask.taskTitle}
          </p>
        )}
      </div>

      {/* Longest Streak */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs sm:text-sm text-muted">Best Task</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.longestStreak}
          <span className="text-sm sm:text-base font-normal text-muted ml-0.5 sm:ml-1">
            {analytics.longestStreak === 1 ? 'completion' : 'completions'}
          </span>
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Best per-task streak
        </p>
        {analytics.longestStreakTask?.taskTitle && (
          <p className="text-[11px] sm:text-xs text-muted mt-1 truncate">
            {analytics.longestStreakTask.taskTitle}
          </p>
        )}
      </div>

      {/* Last 7 Days */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted" />
          <span className="text-xs sm:text-sm text-muted">This Week</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.logsLast7Days}
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Completions
        </p>
      </div>
    </div>
  );
}

