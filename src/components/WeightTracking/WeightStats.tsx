import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Scale } from 'lucide-react';
import { weightTrackingService } from '../../services/weightTrackingService';
import type { WeightStats as WeightStatsType } from '../../types/weightTracking';

interface WeightStatsProps {
  enclosureAnimalId: string;
  refreshKey?: number;
}

export function WeightStats({ enclosureAnimalId, refreshKey }: WeightStatsProps) {
  const [stats, setStats] = useState<WeightStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [enclosureAnimalId, refreshKey]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await weightTrackingService.getWeightStats(enclosureAnimalId);
      setStats(data);
    } catch (error) {
      console.error('Error loading weight stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || stats.currentWeight === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 text-center">
        <Scale className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
          No Weight Data Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
          Start tracking your animal's weight to see trends and analytics
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!stats.trend) return <Minus className="w-5 h-5" />;
    
    switch (stats.trend) {
      case 'gaining':
        return <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'losing':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!stats.trend) return 'bg-gray-100 dark:bg-gray-800';
    
    switch (stats.trend) {
      case 'gaining':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'losing':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {/* Current Weight */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Current Weight</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.currentWeight.toFixed(0)}
          <span className="text-base sm:text-lg font-normal text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1">g</span>
        </p>
      </div>

      {/* Weight Change */}
      {stats.weightChange !== undefined && (
        <div className={`rounded-lg border p-3 sm:p-4 ${getTrendColor()}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            {getTrendIcon()}
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Change</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.weightChange > 0 ? '+' : ''}
            {stats.weightChange.toFixed(1)}
            <span className="text-base sm:text-lg font-normal text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1">g</span>
          </p>
          {stats.weightChangePercent !== undefined && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              {stats.weightChangePercent > 0 ? '+' : ''}
              {stats.weightChangePercent.toFixed(1)}%
            </p>
          )}
        </div>
      )}

      {/* Days Since Last Weigh */}
      {stats.daysSinceLastWeigh !== undefined && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Last Weighed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.daysSinceLastWeigh}
            <span className="text-sm sm:text-base font-normal text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1 block sm:inline">
              {stats.daysSinceLastWeigh === 1 ? 'day' : 'days'} ago
            </span>
          </p>
        </div>
      )}

      {/* Growth Rate */}
      {stats.growthRate !== undefined && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Growth Rate</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.growthRate > 0 ? '+' : ''}
            {stats.growthRate.toFixed(1)}
            <span className="text-base sm:text-lg font-normal text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1">g/mo</span>
          </p>
        </div>
      )}

      {/* 30-Day Average */}
      {stats.averageWeight !== undefined && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">30-Day Avg</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.averageWeight.toFixed(0)}
            <span className="text-base sm:text-lg font-normal text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1">g</span>
          </p>
        </div>
      )}
    </div>
  );
}
