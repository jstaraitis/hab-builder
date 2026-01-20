import type { Warning } from '../../engine/types';

interface WarningsProps {
  warnings: Warning[];
  showHeader?: boolean;
}

export function Warnings({ warnings, showHeader = true }: WarningsProps) {
  if (warnings.length === 0) return null;

  const severityStyles = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-400 dark:border-red-700',
      text: 'text-red-800 dark:text-red-300',
      icon: '🚨',
    },
    important: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-400 dark:border-orange-700',
      text: 'text-orange-800 dark:text-orange-300',
      icon: '⚠️',
    },
    tip: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-400 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-300',
      icon: '💡',
    },
  };

  // Sort: critical > important > tip
  const sortedWarnings = [...warnings].sort((a, b) => {
    const order = { critical: 0, important: 1, tip: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Safety & Important Notes
        </h3>
      )}
      
      <div className="space-y-3">
        {sortedWarnings.map((warning) => {
          const style = severityStyles[warning.severity];
          return (
            <div
              key={warning.id}
              className={`${style.bg} ${style.border} border-l-4 p-4 rounded-r-md`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm ${style.text} font-medium capitalize mb-1`}>
                    {warning.severity} — {warning.category.replace('_', ' ')}
                  </p>
                  <p className={`text-sm ${style.text} whitespace-pre-line`}>{warning.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
