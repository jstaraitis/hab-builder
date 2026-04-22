import { useEffect, useState } from 'react';
import { TrendingUp, Ruler, Activity } from 'lucide-react';
import { lengthLogService, type LengthStats } from '../../services/lengthLogService';

interface LengthStatsProps {
  enclosureAnimalId: string;
  refreshKey?: number;
}

export function LengthStats({ enclosureAnimalId, refreshKey }: LengthStatsProps) {
  const [stats, setStats] = useState<LengthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [enclosureAnimalId, refreshKey]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await lengthLogService.getGrowthStats(enclosureAnimalId);
      setStats(data);
    } catch (error) {
      console.error('Error loading length stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card-elevated rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (!stats || stats.totalMeasurements === 0) {
    return (
      <div className="text-center py-8 bg-card rounded-lg">
        <Ruler className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-muted">No length data yet</p>
        <p className="text-sm text-muted">
          Add measurements to see growth statistics
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Growth */}
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Total Growth</h3>
        </div>
        <p className="text-2xl font-bold text-accent">
          {stats.totalGrowth !== undefined 
            ? `${stats.totalGrowth > 0 ? '+' : ''}${stats.totalGrowth} ${stats.unit}`
            : 'N/A'
          }
        </p>
        {stats.firstLength !== undefined && stats.latestLength !== undefined && (
          <p className="text-xs text-accent mt-1">
            {stats.firstLength} → {stats.latestLength} {stats.unit}
          </p>
        )}
      </div>

      {/* Growth Rate */}
      <div className="bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Growth Rate</h3>
        </div>
        <p className="text-2xl font-bold text-blue-400">
          {stats.growthRate !== undefined
            ? `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}`
            : 'N/A'
          }
        </p>
        <p className="text-xs text-blue-400 mt-1">
          {stats.unit}/month average
        </p>
      </div>

      {/* Measurements */}
      <div className="bg-purple-500/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">Measurements</h3>
        </div>
        <p className="text-2xl font-bold text-purple-400">
          {stats.totalMeasurements}
        </p>
        <p className="text-xs text-purple-400 mt-1">
          Total recorded
        </p>
      </div>
    </div>
  );
}



