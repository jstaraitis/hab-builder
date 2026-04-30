import type { HeatmapDay } from '../../types/careAnalytics';

interface ActivityHeatmapProps {
  heatmapData: HeatmapDay[];
}

export function ActivityHeatmap({ heatmapData }: ActivityHeatmapProps) {
  if (heatmapData.length === 0) {
    return null;
  }

  // Get max counts for color scaling
  const maxCompletedCount = Math.max(...heatmapData.map(d => d.completedCount), 1);
  const maxSkippedCount = Math.max(...heatmapData.map(d => d.skippedCount), 1);

  // Completed-only days stay green, skipped-only days are red, mixed days are amber.
  const getColorClass = (day: HeatmapDay): string => {
    if (day.completedCount === 0 && day.skippedCount === 0) {
      return 'bg-gray-100 dark:bg-gray-800';
    }

    if (day.completedCount > 0 && day.skippedCount > 0) {
      return 'bg-amber-400 dark:bg-amber-600/80';
    }

    if (day.skippedCount > 0) {
      const intensity = Math.ceil((day.skippedCount / maxSkippedCount) * 4);
      switch (intensity) {
        case 1: return 'bg-rose-200 dark:bg-rose-900/40';
        case 2: return 'bg-rose-400 dark:bg-rose-700/60';
        case 3: return 'bg-rose-500 dark:bg-rose-600/80';
        case 4: return 'bg-rose-600 dark:bg-rose-500';
        default: return 'bg-gray-100 dark:bg-gray-800';
      }
    }

    const intensity = Math.ceil((day.completedCount / maxCompletedCount) * 4);
    switch (intensity) {
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/40';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700/60';
      case 3: return 'bg-accent dark:bg-accent/80';
      case 4: return 'bg-accent dark:bg-accent';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDaySummary = (day: HeatmapDay): string => {
    return `${day.formattedDate}: ${day.completedCount} ${day.completedCount === 1 ? 'completion' : 'completions'}, ${day.skippedCount} ${day.skippedCount === 1 ? 'skip' : 'skips'}`;
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
    <div className="bg-card rounded-lg border border-divider p-3 sm:p-6">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Activity Heatmap (Last 90 Days)
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent dark:bg-accent rounded-sm"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-rose-500 dark:bg-rose-600 rounded-sm"></div>
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-400 dark:bg-amber-600/80 rounded-sm"></div>
            <span>Mixed</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5 sm:gap-1 min-w-max">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
            <div key={day} className="flex gap-0.5 sm:gap-1 items-center">
              <span className="text-xs text-muted w-8 sm:w-10 text-right pr-1 sm:pr-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </span>
              {weeks.map((week, weekIndex) => {
                const dayData = week[dayIndex];
                if (!dayData) return <div key={weekIndex} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;

                return (
                  <div
                    key={weekIndex}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${getColorClass(dayData)} hover:ring-2 hover:ring-accent/70 transition-all cursor-pointer group relative`}
                    title={formatDaySummary(dayData)}
                  >
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10">
                      {formatDaySummary(dayData)}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted mt-3 sm:mt-4">
        Each square represents a day. Green indicates completions, red indicates skips, and amber indicates both on the same day.
      </p>
    </div>
  );
}

