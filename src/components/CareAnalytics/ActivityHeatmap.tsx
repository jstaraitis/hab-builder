import type { HeatmapDay } from '../../types/careAnalytics';

interface ActivityHeatmapProps {
  heatmapData: HeatmapDay[];
}

export function ActivityHeatmap({ heatmapData }: ActivityHeatmapProps) {
  if (heatmapData.length === 0) {
    return null;
  }

  // Get max count for color scaling
  const maxCount = Math.max(...heatmapData.map(d => d.count), 1);

  // Get color intensity based on count
  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = Math.ceil((count / maxCount) * 4);
    
    switch (intensity) {
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/40';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700/60';
      case 3: return 'bg-emerald-500 dark:bg-emerald-600/80';
      case 4: return 'bg-emerald-600 dark:bg-emerald-500';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // Group by weeks
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0 || index === heatmapData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Activity Heatmap (Last 90 Days)
        </h2>
        <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-0.5 sm:gap-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-200 dark:bg-emerald-900/40 rounded-sm"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 dark:bg-emerald-700/60 rounded-sm"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 dark:bg-emerald-600/80 rounded-sm"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-600 dark:bg-emerald-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5 sm:gap-1 min-w-max">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
            <div key={day} className="flex gap-0.5 sm:gap-1 items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2">
                {window.innerWidth >= 640 ? day : day[0]}
              </span>
              {weeks.map((week, weekIndex) => {
                const dayData = week[dayIndex];
                if (!dayData) return <div key={weekIndex} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
                
                return (
                  <div
                    key={weekIndex}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${getColorClass(dayData.count)} 
                               hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer group relative`}
                    title={`${dayData.formattedDate}: ${dayData.count} ${dayData.count === 1 ? 'completion' : 'completions'}`}
                  >
                    {/* Tooltip on hover (hidden by default, shown on desktop) */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                  px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10">
                      {dayData.formattedDate}: {dayData.count}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 
                                    border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
        Each square represents a day. Darker colors mean more completed tasks.
      </p>
    </div>
  );
}
