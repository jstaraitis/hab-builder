import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import type { CareLogWithTask } from '../../types/careAnalytics';

interface RecentActivityProps {
  recentLogs: CareLogWithTask[];
}

export function RecentActivity({ recentLogs }: RecentActivityProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (recentLogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border border-divider overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-6 hover:bg-card-elevated transition-colors"
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-divider p-3 sm:p-6 pt-3 sm:pt-4">
          <div className="space-y-2">
            {recentLogs.map((item) => {
          const isSkipped = item.log.skipped;
          const timeAgo = getTimeAgo(item.log.completedAt);

          return (
            <div
              key={item.log.id}
              className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Icon */}
              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                isSkipped 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-jade-100 dark:bg-jade-900/30'
              }`}>
                {isSkipped ? (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.taskTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                      {item.animalName && (
                        <span className="truncate">{item.animalName}</span>
                      )}
                      {item.enclosureName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.enclosureName}</span>
                        </>
                      )}
                    </div>
                    {item.log.notes && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">
                        {item.log.notes}
                      </p>
                    )}
                    {isSkipped && item.log.skipReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Skipped: {item.log.skipReason}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
          </div>

          {recentLogs.length >= 20 && (
            <p className="text-xs text-center text-muted mt-3 sm:mt-4">
              Showing last 20 activities
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

