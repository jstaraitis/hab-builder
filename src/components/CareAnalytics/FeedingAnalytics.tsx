import { useState, useEffect } from 'react';
import { UtensilsCrossed, TrendingUp, AlertTriangle, Pill, PieChart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import type { CareLog } from '../../types/careCalendar';

interface FeedingAnalyticsProps {
  userId: string;
  animalId?: string; // Optional filter by specific animal
}

interface FeedingTrendData {
  date: string;
  quantityOffered: number;
  quantityEaten: number;
  consumptionRate: number;
}

interface FeederTypeData {
  name: string;
  count: number;
  avgEaten: number;
}

interface SupplementData {
  name: string;
  count: number;
  percentage: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function FeedingAnalytics({ userId, animalId }: FeedingAnalyticsProps) {
  const [feedingLogs, setFeedingLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadFeedingLogs();
  }, [userId, animalId, timeRange]);

  const loadFeedingLogs = async () => {
    setLoading(true);
    try {
      // Get feeding tasks for this user
      const tasksQuery = supabase
        .from('care_tasks')
        .select('id')
        .eq('user_id', userId)
        .in('type', ['feeding', 'gut-load']);

      const { data: tasks, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        setFeedingLogs([]);
        setLoading(false);
        return;
      }

      const taskIds = tasks.map(t => t.id);

      // Get logs for feeding tasks with feeding data
      let logsQuery = supabase
        .from('care_logs')
        .select('*')
        .in('task_id', taskIds)
        .eq('skipped', false)
        .not('feeder_type', 'is', null) // Only logs with feeding data
        .order('completed_at', { ascending: false });

      // Apply time range filter
      if (timeRange !== 'all') {
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        logsQuery = logsQuery.gte('completed_at', cutoffDate.toISOString());
      }

      const { data: logs, error: logsError } = await logsQuery;
      if (logsError) throw logsError;

      setFeedingLogs(mapLogsFromDb(logs || []));
    } catch (err) {
      console.error('Error loading feeding logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapLogsFromDb = (rows: any[]): CareLog[] => {
    return rows.map(row => ({
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
    }));
  };

  // Calculate feeding trend data
  const getTrendData = (): FeedingTrendData[] => {
    const dataByDate = new Map<string, { offered: number[]; eaten: number[] }>();

    feedingLogs.forEach(log => {
      if (log.quantityOffered !== undefined && log.quantityEaten !== undefined) {
        const date = log.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { offered: [], eaten: [] });
        }
        dataByDate.get(date)!.offered.push(log.quantityOffered);
        dataByDate.get(date)!.eaten.push(log.quantityEaten);
      }
    });

    return Array.from(dataByDate.entries())
      .map(([date, values]) => {
        const avgOffered = values.offered.reduce((a, b) => a + b, 0) / values.offered.length;
        const avgEaten = values.eaten.reduce((a, b) => a + b, 0) / values.eaten.length;
        return {
          date,
          quantityOffered: Math.round(avgOffered * 10) / 10,
          quantityEaten: Math.round(avgEaten * 10) / 10,
          consumptionRate: Math.round((avgEaten / avgOffered) * 100),
        };
      })
      .reverse()
      .slice(-14); // Show last 14 data points
  };

  // Calculate feeder type breakdown
  const getFeederTypeData = (): FeederTypeData[] => {
    const typeMap = new Map<string, { count: number; totalEaten: number }>();

    feedingLogs.forEach(log => {
      if (log.feederType) {
        if (!typeMap.has(log.feederType)) {
          typeMap.set(log.feederType, { count: 0, totalEaten: 0 });
        }
        const data = typeMap.get(log.feederType)!;
        data.count++;
        if (log.quantityEaten) {
          data.totalEaten += log.quantityEaten;
        }
      }
    });

    return Array.from(typeMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgEaten: data.count > 0 ? Math.round((data.totalEaten / data.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  // Calculate supplement usage
  const getSupplementData = (): SupplementData[] => {
    const supplementMap = new Map<string, number>();
    let total = 0;

    feedingLogs.forEach(log => {
      if (log.supplementUsed) {
        supplementMap.set(log.supplementUsed, (supplementMap.get(log.supplementUsed) || 0) + 1);
        total++;
      }
    });

    return Array.from(supplementMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate refusal stats
  const getRefusalStats = () => {
    const totalFeedings = feedingLogs.length;
    const refusals = feedingLogs.filter(l => l.refusalNoted).length;
    const refusalRate = totalFeedings > 0 ? Math.round((refusals / totalFeedings) * 100) : 0;

    // Get recent trend (last 7 vs previous 7)
    const recentLogs = feedingLogs.slice(0, 7);
    const previousLogs = feedingLogs.slice(7, 14);
    const recentRefusals = recentLogs.filter(l => l.refusalNoted).length;
    const previousRefusals = previousLogs.filter(l => l.refusalNoted).length;
    const recentRate = recentLogs.length > 0 ? (recentRefusals / recentLogs.length) * 100 : 0;
    const previousRate = previousLogs.length > 0 ? (previousRefusals / previousLogs.length) * 100 : 0;
    const trend = recentRate - previousRate;

    return { totalFeedings, refusals, refusalRate, trend };
  };

  // Calculate average consumption
  const getAverageConsumption = () => {
    const logsWithData = feedingLogs.filter(l => l.quantityOffered !== undefined && l.quantityEaten !== undefined);
    if (logsWithData.length === 0) return { avgOffered: 0, avgEaten: 0, consumptionRate: 0 };

    const totalOffered = logsWithData.reduce((sum, log) => sum + (log.quantityOffered || 0), 0);
    const totalEaten = logsWithData.reduce((sum, log) => sum + (log.quantityEaten || 0), 0);

    return {
      avgOffered: Math.round((totalOffered / logsWithData.length) * 10) / 10,
      avgEaten: Math.round((totalEaten / logsWithData.length) * 10) / 10,
      consumptionRate: Math.round((totalEaten / totalOffered) * 100),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading feeding analytics...</p>
        </div>
      </div>
    );
  }

  if (feedingLogs.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <UtensilsCrossed className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Feeding Data Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Complete feeding tasks with detailed logs to see feeding analytics here.
        </p>
      </div>
    );
  }

  const trendData = getTrendData();
  const feederTypeData = getFeederTypeData();
  const supplementData = getSupplementData();
  const refusalStats = getRefusalStats();
  const avgConsumption = getAverageConsumption();

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <UtensilsCrossed className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Feeding Analytics</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feedingLogs.length} logged feedings</p>
          </div>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Offered */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Offered</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgConsumption.avgOffered}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">per feeding</p>
        </div>

        {/* Average Eaten */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Eaten</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgConsumption.avgEaten}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">per feeding</p>
        </div>

        {/* Consumption Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Consumption Rate</span>
            <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgConsumption.consumptionRate}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">eaten vs offered</p>
        </div>

        {/* Refusal Rate */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg border ${refusalStats.refusalRate > 20 ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Refusal Rate</span>
            <AlertTriangle className={`w-4 h-4 ${refusalStats.refusalRate > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{refusalStats.refusalRate}%</p>
          <p className={`text-xs mt-1 ${refusalStats.trend > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {refusalStats.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(refusalStats.trend))}% vs last week
          </p>
        </div>
      </div>

      {/* Feeding Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feeding Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="quantityOffered" 
                name="Offered"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="quantityEaten" 
                name="Eaten"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feeder Type & Supplement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feeder Type Breakdown */}
        {feederTypeData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feeder Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={feederTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '11px' }}
                  height={60}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" name="Feedings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Supplement Usage */}
        {supplementData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supplement Usage</h3>
            </div>
            <div className="space-y-3">
              {supplementData.map((supp, index) => (
                <div key={supp.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supp.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{supp.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${supp.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Health Alerts */}
      {refusalStats.refusalRate > 20 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">High Refusal Rate Detected</h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Your animal has refused food in {refusalStats.refusalRate}% of recent feedings ({refusalStats.refusals} out of {refusalStats.totalFeedings}). 
                This could indicate stress, illness, or environmental issues. Consider monitoring closely or consulting a veterinarian if the pattern continues.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
