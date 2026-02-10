import { useState, useEffect } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { careAnalyticsService } from '../../services/careAnalyticsService';
import { AnalyticsOverview } from './AnalyticsOverview';
import { TaskTypeBreakdown } from './TaskTypeBreakdown';
import { ActivityHeatmap } from './ActivityHeatmap';
import { RecentActivity } from './RecentActivity';
import { FeedingAnalytics } from './FeedingAnalytics';
import type { CareLogAnalytics } from '../../types/careAnalytics';

export function CareAnalyticsDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<CareLogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await careAnalyticsService.getAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load care analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 text-center">
          <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sign In to View Analytics
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create a account to track your care routine and see insights.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.logsAllTime === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 sm:p-8 text-center">
          <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Care History Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            Start completing care tasks to see your analytics and track your routine!
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            Your feeding, misting, cleaning, and other care activities will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Care Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Your care routine insights and statistics
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <AnalyticsOverview analytics={analytics} />

      {/* Activity Heatmap */}
      <ActivityHeatmap heatmapData={analytics.heatmapData} />

      {/* Task Type Breakdown */}
      <TaskTypeBreakdown taskTypeStats={analytics.taskTypeStats} />

      {/* Feeding Analytics */}
      <FeedingAnalytics userId={user.id} />

      {/* Recent Activity */}
      <RecentActivity recentLogs={analytics.recentLogs} />
    </div>
  );
}
