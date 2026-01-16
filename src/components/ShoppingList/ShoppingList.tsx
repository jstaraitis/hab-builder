import type { ShoppingItem, BudgetTier } from '../../engine/types';

interface ShoppingListProps {
  items: ShoppingItem[];
  budget: BudgetTier;
  showHeader?: boolean;
}

export function ShoppingList({ items, budget, showHeader = true }: ShoppingListProps) {
  const categories = {
    equipment: '🔧 Equipment',
    substrate: '🌱 Substrate & Drainage',
    decor: '🪨 Decor & Hardscape',
    live_plants: '🌿 Live Plants',
    cleanup_crew: '🐛 Cleanup Crew',
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Shopping List</h3>
      )}
      
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-900">
          <span className="font-medium">Budget Level: </span>
          <span className="capitalize">{budget}</span>
          {' — '}Items show recommended brands for your budget tier.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              {categories[category as keyof typeof categories]}
            </h4>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-gray-800">{item.name}</h5>
                    <span className="text-sm font-medium text-primary-600 ml-2">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.sizing}</p>
                  
                  {item.budgetTierOptions && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Recommended: </span>
                      <span className="text-primary-600">
                        {item.budgetTierOptions[budget]}
                      </span>
                    </div>
                  )}
                  
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{item.notes}</p>
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
