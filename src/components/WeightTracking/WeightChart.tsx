import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      <div className="flex items-center justify-center w-full" style={{ height: '220px' }}>
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height: '220px' }}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height: '220px' }}>
        <div className="text-center">
          <p className="text-muted mb-2">No weight data yet</p>
          <p className="text-sm text-muted">
            Add your first weight entry to see the chart
          </p>
        </div>
      </div>
    );
  }

  const highestWeight = Math.max(...chartData.map((d) => d.weightGrams));
  const yAxisMax = Math.max(1, Math.ceil(highestWeight * 2));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
          <XAxis 
            dataKey="formattedDate" 
            className="text-xs fill-muted"
            tick={{ fontSize: 12 }}
            tickMargin={8}
            label={{ value: 'Date', position: 'bottom', offset: 6, style: { fontSize: 11, fill: '#8B909A' } }}
          />
          <YAxis 
            className="text-xs fill-muted"
            tick={{ fontSize: 12 }}
            domain={[0, yAxisMax]}
            label={{ value: 'Weight (g)', angle: -90, position: 'insideLeft', offset: 0, dy: 36, style: { fontSize: 12, fill: '#8B909A', textAnchor: 'middle' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1D24', 
              border: '1px solid #2A2D35',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#FFFFFF'
            }}
            labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
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




