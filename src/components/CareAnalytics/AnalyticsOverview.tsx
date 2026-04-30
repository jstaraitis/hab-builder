import { useState } from 'react';
import { CheckCircle, Award, ShieldCheck, Target, CircleOff } from 'lucide-react';
import type { CareLogAnalytics } from '../../types/careAnalytics';

interface AnalyticsOverviewProps {
  analytics: CareLogAnalytics;
  consistencyScore?: number | null;
}

export function AnalyticsOverview({ analytics, consistencyScore = null }: Readonly<AnalyticsOverviewProps>) {
  const [showMetricHelp, setShowMetricHelp] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => setShowMetricHelp((v) => !v)}
          className="px-3 py-1.5 rounded-full border border-divider bg-card text-xs sm:text-sm text-muted hover:text-white hover:border-accent/40 transition-colors"
        >
          {showMetricHelp ? 'Hide metric formulas' : 'How are these metrics calculated?'}
        </button>
      </div>

      {showMetricHelp && (
        <div className="bg-card rounded-lg border border-divider p-3 sm:p-4 text-xs sm:text-sm text-muted space-y-2">
          <p><span className="text-white font-medium">Completed:</span> Total non-skipped task completions. Subtitle shows non-skipped completions in the last 30 days.</p>
          <p><span className="text-white font-medium">Skip Rate (30d):</span> Skipped logs divided by all logs in the last 30 days.</p>
          <p><span className="text-white font-medium">Coverage Score (30d):</span> Percentage of active tasks completed at least once in the last 30 days.</p>
          <p><span className="text-white font-medium">Current Best Streak:</span> Highest active per-task current streak based on task frequency interval.</p>
          <p><span className="text-white font-medium">Longest Streak:</span> Highest historical per-task streak across all active tasks.</p>
          <p><span className="text-white font-medium">Consistency:</span> In the last 30 days, expected vs completed cadence normalized by each task frequency (capped per task at 100%).</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4">
      {/* Consistency Score */}
      {consistencyScore !== null && (
        <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span className="text-xs sm:text-sm text-muted">Consistency</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {consistencyScore}%
          </p>
          <p className="text-xs text-muted mt-0.5 sm:mt-1">
            Last 30 days
          </p>
        </div>
      )}

      {/* Skip Rate */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <CircleOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          <span className="text-xs sm:text-sm text-muted">Skip Rate</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.skipRateLast30Days}%
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Last 30 days
        </p>
      </div>

      {/* Coverage Score */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          <span className="text-xs sm:text-sm text-muted">Coverage Score</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.coverageScoreLast30Days}%
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          Tasks touched in 30d
        </p>
      </div>

      {/* Total Completions */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
          <span className="text-xs sm:text-sm text-muted">Completed</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {analytics.completedLast30Days}
        </p>
        <p className="text-xs text-muted mt-0.5 sm:mt-1">
          {analytics.totalCompletions} total completed
        </p>
      </div>

      {/* Current Streak */}
      <div className="bg-card rounded-lg border border-divider p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-xs sm:text-sm text-muted">Current Best Streak</span>
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
          <span className="text-xs sm:text-sm text-muted">Longest Streak</span>
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

      </div>
    </div>
  );
}

