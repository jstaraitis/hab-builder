import { DollarSign, TrendingUp, Package } from 'lucide-react';
import type { CostEstimate, SetupTier } from '../../engine/types';
import { formatPriceRange, getPriceDifference } from '../../engine/shopping/calculateCosts';

interface CostSummaryProps {
  costEstimate: CostEstimate;
  selectedTier: SetupTier;
  onTierChange?: (tier: SetupTier) => void;
  compact?: boolean;
}

export function CostSummary({ costEstimate, selectedTier, onTierChange, compact = false }: CostSummaryProps) {
  const tierLabels: Record<SetupTier, { label: string; color: string; bgColor: string }> = {
    minimum: {
      label: 'Minimum',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
    recommended: {
      label: 'Recommended',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    ideal: {
      label: 'Ideal',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
  };

  const selectedTierInfo = tierLabels[selectedTier];
  const currentTotal = costEstimate.byTier[selectedTier];

  // Calculate differences from recommended tier
  const tierComparisons =
    selectedTier !== 'recommended'
      ? {
          recommended: getPriceDifference(
            costEstimate.byTier.recommended,
            costEstimate.byTier[selectedTier]
          ),
        }
      : null;

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-2 border-emerald-200 dark:border-emerald-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Estimated Total
            </span>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${selectedTierInfo.color}`}>
              {formatPriceRange(currentTotal)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedTierInfo.label} tier • {costEstimate.itemCount} items
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        <DollarSign className="w-6 h-6 text-emerald-600" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Cost Estimate</h3>
      </div>

      {/* Selected Tier Total */}
      <div className={`${selectedTierInfo.bgColor} rounded-lg p-4`}>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {selectedTierInfo.label} Tier Total
        </p>
        <p className={`text-3xl font-bold ${selectedTierInfo.color}`}>
          {formatPriceRange(currentTotal)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {costEstimate.itemCount} items • Initial setup cost
        </p>
      </div>

      {/* Tier Comparison */}
      {onTierChange && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Compare Tiers</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(tierLabels) as SetupTier[]).map((tier) => {
              const isSelected = tier === selectedTier;
              const tierInfo = tierLabels[tier];
              const tierTotal = costEstimate.byTier[tier];

              return (
                <button
                  key={tier}
                  onClick={() => onTierChange(tier)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {tierInfo.label}
                  </p>
                  <p className={`text-sm font-bold ${isSelected ? tierInfo.color : 'text-gray-700 dark:text-gray-300'}`}>
                    ${tierTotal.min.toLocaleString()}-${tierTotal.max.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>

          {tierComparisons && (
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {tierComparisons.recommended.avgPercent > 0 ? (
                <span>
                  <span className="font-semibold text-amber-600">
                    +{tierComparisons.recommended.avgPercent}%
                  </span>{' '}
                  more than Recommended
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-emerald-600">
                    {tierComparisons.recommended.avgPercent}%
                  </span>{' '}
                  less than Recommended
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">By Category</p>
        </div>
        
        {/* Stacked Category Bar */}
        <div className="space-y-2">
          <div className="flex h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm border-2 border-gray-300 dark:border-gray-600">
            {costEstimate.byCategory.map((cat, idx) => {
              const percentage = Math.round((cat.max / currentTotal.max) * 100);
              const colors = [
                'bg-orange-500',
                'bg-blue-500',
                'bg-amber-500',
                'bg-cyan-500',
                'bg-rose-500',
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-violet-500',
              ];
              const color = colors[idx % colors.length];
              
              return (
                <div
                  key={cat.category}
                  className={`${color} transition-all flex items-center justify-center text-white text-xs font-semibold`}
                  style={{ width: `${percentage}%`, minWidth: percentage > 8 ? 'auto' : 0 }}
                  title={`${cat.category}: $${cat.min.toLocaleString()}-$${cat.max.toLocaleString()}`}
                >
                  {percentage > 8 && <span>{percentage}%</span>}
                </div>
              );
            })}
          </div>
          
          {/* Category Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {costEstimate.byCategory.map((cat, idx) => {
              const colors = [
                'bg-orange-500',
                'bg-blue-500',
                'bg-amber-500',
                'bg-cyan-500',
                'bg-rose-500',
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-violet-500',
              ];
              const color = colors[idx % colors.length];
              
              return (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <div className={`${color} w-3 h-3 rounded-sm flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {cat.category}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      ${cat.min.toLocaleString()}-${cat.max.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <span className="font-semibold">Note:</span> Prices are estimates based on typical market
          prices and may vary by retailer, sales, and region. Use these ranges as planning guides.
        </p>
      </div>
    </div>
  );
}
