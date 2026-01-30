import { useState, useMemo } from 'react';
import { Home, Wrench, Layers, Image, Leaf, Bug, ChevronRight, ShoppingBag, Utensils } from 'lucide-react';
import type { ShoppingItem, SetupTier, EnclosureInput } from '../../engine/types';
import { generateAmazonLink } from '../../utils/amazonLinks';

interface ShoppingListProps {
  items: ShoppingItem[];
  selectedTier: SetupTier;
  input: EnclosureInput;
  showHeader?: boolean;
  affiliateTag?: string;
}

export function ShoppingList({ items, selectedTier, input, showHeader = true, affiliateTag }: ShoppingListProps) {
  const categories = {
    enclosure: 'Enclosure',
    equipment: 'Equipment',
    substrate: 'Substrate & Drainage',
    decor: 'Decor & Hardscape',
    live_plants: 'Live Plants',
    cleanup_crew: 'Cleanup Crew',
    nutrition: 'Nutrition & Feeding',
  };

  const tierLabels = {
    minimum: { label: 'Minimum', color: 'text-gray-600 dark:text-gray-400' },
    recommended: { label: 'Recommended', color: 'text-amber-600 dark:text-amber-400' },
    ideal: { label: 'Ideal', color: 'text-emerald-600 dark:text-emerald-400' },
  };

  // Memoize expensive grouping calculation - only recalculates when items change
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  }, [items]);

  // Track which categories are expanded (default all expanded on desktop, collapsed on mobile)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(groupedItems).reduce((acc, category) => {
      acc[category] = true; // Start expanded
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-0 py-3 sm:px-2 sm:py-4">
      {showHeader && (
        <div className="mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1.5">Shopping List</h3>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Showing <span className={`font-semibold ${tierLabels[selectedTier].color}`}>{tierLabels[selectedTier].label}</span> tier
          </p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const isExpanded = expandedCategories[category];
          return (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {(() => {
                    const imap: Record<string, React.ReactNode> = {
                      enclosure: <Home className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      equipment: <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      substrate: <Layers className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      decor: <Image className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      live_plants: <Leaf className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      cleanup_crew: <Bug className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                      nutrition: <Utensils className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />,
                    };
                    return imap[category] ?? null;
                  })()}
                  <h4 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
                    {categories[category as keyof typeof categories]}
                  </h4>
                  <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {categoryItems.length}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 lg:w-5 lg:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryItems.map((item) => {
                    const tierOption = item.setupTierOptions?.[selectedTier];
                    const isItemExpanded = expandedItems[item.id];
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        {/* Compact Row */}
                        <div className="p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-1 sm:gap-3">
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-start gap-2">
                                {/* Importance Badge */}
                                {item.importance === 'required' && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>
                                )}
                                {item.importance === 'recommended' && (
                                  <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1.5"></span>
                                )}
                                {item.importance === 'conditional' && (
                                  <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-1.5"></span>
                                )}
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white inline">
                                    {item.name}
                                  </h5>
                                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                                    × {item.quantity}
                                  </span>
                                </div>
                              </div>
                            </button>
                            
                            {/* Buy Now Button */}
                            {tierOption?.searchQuery && (
                              <a
                                href={generateAmazonLink(tierOption.searchQuery, input, affiliateTag)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors active:scale-95"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                <span className="hidden sm:inline">Buy Now</span>
                                <ChevronRight className="w-3 h-3 sm:hidden" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isItemExpanded && (
                          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                            {tierOption && (
                              <div className="space-y-1">
                                <p className="text-xs lg:text-sm text-gray-700 dark:text-gray-300">
                                  {tierOption.description}
                                </p>
                                {item.sizing && (
                                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                                    {item.sizing}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            )}
                            {item.importance && (
                              <p className="text-xs font-medium">
                                <span className={`${
                                  item.importance === 'required' ? 'text-red-600 dark:text-red-400' :
                                  item.importance === 'recommended' ? 'text-cyan-500 dark:text-cyan-400' :
                                  item.importance === 'conditional' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {item.importance === 'required' ? '● Required' :
                                  item.importance === 'recommended' ? '● Recommended' :
                                  item.importance === 'conditional' ? '● Conditional' :
                                  'Optional'}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
