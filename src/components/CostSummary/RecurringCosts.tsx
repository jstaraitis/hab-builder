import { RefreshCw, Calendar, DollarSign, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { CostEstimate } from '../../engine/types';
import { formatPriceRange } from '../../engine/shopping/calculateCosts';

interface RecurringCostsProps {
  costEstimate: CostEstimate;
}

export function RecurringCosts({ costEstimate }: RecurringCostsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!costEstimate.recurringCosts || costEstimate.recurringCosts.items.length === 0) {
    return null;
  }

  const { recurringCosts } = costEstimate;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        <RefreshCw className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ongoing Costs</h3>
      </div>

      {/* Monthly & Yearly Totals - Combined */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Monthly
            </span>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {formatPriceRange(recurringCosts.monthly)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Yearly
            </span>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {formatPriceRange(recurringCosts.yearly)}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <span className="font-semibold">Note:</span> These items require regular replacement to maintain your enclosure. Plan for these ongoing expenses alongside your initial setup cost.
        </p>
      </div>

      {/* Itemized List */}
      <div className="space-y-3 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 bg-emerald-50/30 dark:bg-emerald-900/10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-full px-2 py-0.5 text-xs font-bold">
              {recurringCosts.items.length}
            </span>
            Items Requiring Replacement
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isExpanded && (
          <div className="space-y-2">
            {recurringCosts.items.map((item, index) => {
              const intervalLabel = formatInterval(item.interval);
              return (
                <div
                  key={`${item.name}-${index}`}
                  className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Replace {intervalLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {formatPriceRange(item.estimatedPrice)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">per replacement</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Planning Tip:</span> Budget for these recurring expenses when deciding on your setup tier. Higher quality items often last longer, potentially reducing long-term costs.
        </p>
      </div>
    </div>
  );
}

/**
 * Format interval string to be more human-readable
 */
function formatInterval(interval: string): string {
  const intervalMap: Record<string, string> = {
    weekly: 'every week',
    monthly: 'every month',
    bimonthly: 'every 2 months',
    quarterly: 'every 3 months',
    '6 months': 'every 6 months',
    yearly: 'every year',
    '12 months': 'every 12 months',
    '18 months': 'every 18 months',
  };

  return intervalMap[interval.toLowerCase()] || `every ${interval}`;
}
