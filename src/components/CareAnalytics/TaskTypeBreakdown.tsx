import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UtensilsCrossed, Droplets, Waves, Brush, Sparkles, Stethoscope, Pill, Wrench, FileText } from 'lucide-react';
import type { TaskTypeStats } from '../../types/careAnalytics';

interface TaskTypeBreakdownProps {
  taskTypeStats: TaskTypeStats[];
}

const iconMap: Record<string, any> = {
  UtensilsCrossed,
  Droplets,
  Waves,
  Brush,
  Sparkles,
  Stethoscope,
  Pill,
  Wrench,
  FileText,
};

const colorMap: Record<string, string> = {
  emerald: '#10b981',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  purple: '#a855f7',
  violet: '#8b5cf6',
  red: '#ef4444',
  orange: '#f97316',
  gray: '#6b7280',
  slate: '#64748b',
};

export function TaskTypeBreakdown({ taskTypeStats }: TaskTypeBreakdownProps) {
  if (taskTypeStats.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = taskTypeStats.map(stat => ({
    name: stat.label,
    completions: stat.totalCompletions,
    fill: colorMap[stat.color] || '#6b7280',
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
        Task Type Breakdown
      </h2>

      {/* Chart */}
      <div className="mb-4 sm:mb-6 h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="name" 
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
            <Bar dataKey="completions" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {taskTypeStats.map(stat => {
          const IconComponent = iconMap[stat.icon];
          
          return (
            <div
              key={stat.type}
              className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className={`p-1.5 sm:p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex-shrink-0`}>
                {IconComponent && <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                  {stat.label}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.totalCompletions}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({stat.averagePerWeek}/week)
                  </span>
                </div>
                {stat.lastCompleted && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Last: {stat.lastCompleted.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
