import { useState, useMemo, memo } from 'react';
import { Home, Wrench, Layers, Image, Leaf, Bug, ChevronRight, ShoppingBag, Utensils, Gauge, Sparkles } from 'lucide-react';
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
    monitoring: 'Monitoring & Tools',
    maintenance: 'Maintenance & Cleaning',
  };

  const tierLabels = {
    minimum: { label: 'Minimum', color: 'text-muted' },
    recommended: { label: 'Recommended', color: 'text-amber-600 dark:text-amber-400' },
    ideal: { label: 'Ideal', color: 'text-accent' },
  };

  // Memoize expensive grouping calculation - only recalculates when items change
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  }, [items]);

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(groupedItems).reduce((acc, category) => {
      acc[category] = false; // Start collapsed
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

  // Memoized shopping item component
  const ShoppingItem = memo(({ item, itemKey, selectedTier, input, affiliateTag, isExpanded, onToggle }: {
    item: ShoppingItem;
    itemKey: string;
    selectedTier: SetupTier;
    input: EnclosureInput;
    affiliateTag?: string;
    isExpanded: boolean;
    onToggle: (key: string) => void;
  }) => {
    const tierOption = item.setupTierOptions?.[selectedTier];
    
    return (
      <div className="bg-card hover:bg-card dark:hover:bg-gray-900/30 transition-colors">
        {/* Compact Row */}
        <div className="p-2.5 sm:p-3">
          <div className="flex items-start justify-between gap-1 sm:gap-3">
            <button
              onClick={() => onToggle(itemKey)}
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
                  <h5 className="font-medium text-sm sm:text-base text-white inline">
                    {item.name}
                  </h5>
                  <span className="text-xs sm:text-sm text-muted ml-2 whitespace-nowrap">
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
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-accent hover:bg-accent-dim text-white text-xs sm:text-sm font-medium rounded-lg transition-colors active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Buy Now</span>
                <ChevronRight className="w-3 h-3 sm:hidden" />
              </a>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 space-y-1.5 border-t border-divider pt-2">
            {tierOption && (
              <div className="space-y-1">
                <p className="text-xs lg:text-sm text-secondary">
                  {tierOption.description}
                </p>
                {item.sizing && (
                  <p className="text-xs lg:text-sm text-muted">
                    {item.sizing}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs lg:text-sm text-muted">
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
                  'text-muted'
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
  });

  ShoppingItem.displayName = 'ShoppingItem';

  return (
    <div className="bg-card rounded-lg shadow-md px-0 py-3 sm:px-2 sm:py-4">
      {showHeader && (
        <div className="mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Shopping List</h3>
          <p className="text-base text-muted">
            Showing <span className={`font-semibold ${tierLabels[selectedTier].color}`}>{tierLabels[selectedTier].label}</span> tier
          </p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const isExpanded = expandedCategories[category];
          return (
            <div key={category} className="border border-divider rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-surface/50 hover:bg-card-elevated dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {(() => {
                    const imap: Record<string, React.ReactNode> = {
                      enclosure: <Home className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      equipment: <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      substrate: <Layers className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      decor: <Image className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      live_plants: <Leaf className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      cleanup_crew: <Bug className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      nutrition: <Utensils className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      monitoring: <Gauge className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                      maintenance: <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />,
                    };
                    return imap[category] ?? null;
                  })()}
                  <h4 className="text-sm sm:text-base font-semibold text-white">
                    {categories[category as keyof typeof categories]}
                  </h4>
                  <span className="text-xs sm:text-sm font-medium text-muted bg-card-elevated px-2 py-1 rounded-full">
                    {categoryItems.length}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 lg:w-5 lg:h-5 text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="divide-y divide-divider dark:divide-gray-700">
                  {categoryItems.map((item, index) => {
                    const itemKey = item.uid ?? `${category}-${item.id}-${index}`;
                    return (
                      <ShoppingItem
                        key={itemKey}
                        item={item}
                        itemKey={itemKey}
                        selectedTier={selectedTier}
                        input={input}
                        affiliateTag={affiliateTag}
                        isExpanded={expandedItems[itemKey]}
                        onToggle={toggleItem}
                      />
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
