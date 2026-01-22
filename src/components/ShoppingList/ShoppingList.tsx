import type { ShoppingItem } from '../../engine/types';

interface ShoppingListProps {
  items: ShoppingItem[];
  showHeader?: boolean;
}

export function ShoppingList({ items, showHeader = true }: ShoppingListProps) {
  const categories = {
    equipment: '🔧 Equipment',
    substrate: '🌱 Substrate & Drainage',
    decor: '🪨 Decor & Hardscape',
    live_plants: '🌿 Live Plants',
    cleanup_crew: '🐛 Cleanup Crew',
  };

  const budgetTiers = ['low', 'mid', 'premium'] as const;

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Shopping List</h3>
      )}
      
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-medium">Budget Options:</span>
          {' '}Items below show recommended brands for each budget tier (Budget, Mid-Range, Premium).
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
              {categories[category as keyof typeof categories]}
            </h4>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium text-gray-800 dark:text-white">{item.name}</h5>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400 ml-2">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.sizing}</p>
                  
                  {item.budgetTierOptions && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {budgetTiers.map((tier) => (
                        <div key={tier} className="bg-gray-50 dark:bg-gray-700/30 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1 capitalize">
                            {tier === 'low' ? '💰 Budget' : tier === 'mid' ? '💵 Mid-Range' : '💎 Premium'}
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                            {item.budgetTierOptions?.[tier]}
                          </p>
                          {item.purchaseLinks?.[tier] && (
                            <a
                              href={item.purchaseLinks[tier]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-block"
                            >
                              → Shop now
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.infoLinks && Object.entries(item.infoLinks).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Learn more:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(item.infoLinks).map(([label, url]) => (
                          <a
                            key={label}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          >
                            {label} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
