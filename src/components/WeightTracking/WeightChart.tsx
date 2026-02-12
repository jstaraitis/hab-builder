import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { weightTrackingService } from '../../services/weightTrackingService';
import { Loader2 } from 'lucide-react';
import type { WeightChartData } from '../../types/weightTracking';

interface WeightChartProps {
  enclosureAnimalId: string;
  refreshKey?: number;
}

export function WeightChart({ enclosureAnimalId, refreshKey }: WeightChartProps) {
  const [chartData, setChartData] = useState<WeightChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [enclosureAnimalId, refreshKey]);

  const loadChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      const analytics = await weightTrackingService.getWeightAnalytics(enclosureAnimalId);
      setChartData(analytics.chartData);
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height: '300px' }}>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height: '300px' }}>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height: '300px' }}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No weight data yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add your first weight entry to see the chart
          </p>
        </div>
      </div>
    );
  }

  // Calculate average weight for reference line
  const averageWeight = chartData.reduce((sum, d) => sum + d.weightGrams, 0) / chartData.length;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="formattedDate" 
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
            label={{ value: 'Weight (g)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <ReferenceLine 
            y={averageWeight} 
            stroke="#9ca3af" 
            strokeDasharray="5 5" 
            label={{ value: 'Average', position: 'right', fontSize: 10, fill: '#6b7280' }}
          />
          <Line 
            type="monotone" 
            dataKey="weightGrams" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Weight"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
