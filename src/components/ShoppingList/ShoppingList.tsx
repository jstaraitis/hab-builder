import { useState } from 'react';
import { Home, Wrench, Layers, Image, Leaf, Bug, Check, Star, Award } from 'lucide-react';
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
  };

  const tierLabels = {
    minimum: { icon: <Check className="w-5 h-5" />, label: 'Minimum', description: 'Bare essentials' },
    recommended: { icon: <Star className="w-5 h-5" />, label: 'Recommended', description: 'Best value' },
    ideal: { icon: <Award className="w-5 h-5" />, label: 'Ideal', description: 'Premium quality' },
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  // Track which categories are expanded (default all collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(groupedItems).reduce((acc, category) => {
      acc[category] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Shopping List</h3>
          <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
            <span className="text-2xl">{tierLabels[selectedTier].icon}</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {tierLabels[selectedTier].label} Quality Level
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tierLabels[selectedTier].description} - Showing your selected tier for each item
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const isExpanded = expandedCategories[category];
          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between py-4 px-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-xl"
              >
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            {(() => {
                              const imap: Record<string, React.ReactNode> = {
                                enclosure: <Home className="w-5 h-5 text-green-600" />,
                                equipment: <Wrench className="w-5 h-5 text-green-600" />,
                                substrate: <Layers className="w-5 h-5 text-green-600" />,
                                decor: <Image className="w-5 h-5 text-green-600" />,
                                live_plants: <Leaf className="w-5 h-5 text-green-600" />,
                                cleanup_crew: <Bug className="w-5 h-5 text-green-600" />,
                              };
                              return <>{imap[category] ?? null}<span>{categories[category as keyof typeof categories]}</span></>;
                            })()}
                          </h4>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {categoryItems.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="px-1 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {categoryItems.map((item) => {
                    const tierOption = item.setupTierOptions?.[selectedTier];
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="mb-3">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white break-words">{item.name}</h5>
                            {item.importance && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                                item.importance === 'required' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                item.importance === 'conditional' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                  {item.importance === 'required' ? 'Required' :
                                  item.importance === 'conditional' ? 'Conditional' :
                                  'Optional'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 block">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        
                        {tierOption && (
                          <div className="space-y-2 mb-3">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {tierOption.description}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.sizing}
                              </p>
                            </div>
                            {tierOption.searchQuery && (
                              <a
                                href={generateAmazonLink(tierOption.searchQuery, input, affiliateTag)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Buy Now
                              </a>
                            )}
                          </div>
                        )}
                        
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed">{item.notes}</p>
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
