interface EquipmentLibraryProps {
  onAddItem: (type: string, variant?: string) => void;
}

interface EquipmentCategory {
  name: string;
  icon: string;
  items: {
    type: 'heat' | 'uvb' | 'water' | 'hide' | 'decor' | 'substrate';
    name: string;
    variant?: string;
    description: string;
  }[];
}

const equipmentCategories: EquipmentCategory[] = [
  {
    name: 'Heating',
    icon: '🔥',
    items: [
      { type: 'heat', name: 'Heat Lamp', description: 'Basking heat source' },
      { type: 'heat', name: 'Ceramic Heater', description: 'Non-light heat' },
      { type: 'heat', name: 'Heat Mat', description: 'Under-tank heating' },
    ]
  },
  {
    name: 'Lighting',
    icon: '☀️',
    items: [
      { type: 'uvb', name: 'UVB Fixture', description: 'T5 HO UVB lighting' },
      { type: 'uvb', name: 'LED Light', description: 'Plant growth light' },
    ]
  },
  {
    name: 'Water',
    icon: '💧',
    items: [
      { type: 'water', name: 'Water Dish', description: 'Drinking water' },
      { type: 'water', name: 'Water Feature', description: 'Waterfall/fountain' },
      { type: 'water', name: 'Misting System', description: 'Humidity control' },
    ]
  },
  {
    name: 'Hides & Shelter',
    icon: '🏠',
    items: [
      { type: 'hide', name: 'Cork Hide', description: 'Natural hide' },
      { type: 'hide', name: 'Cave', description: 'Rock/resin cave' },
      { type: 'hide', name: 'Humid Hide', description: 'Shedding box' },
    ]
  },
  {
    name: 'Substrate',
    icon: '🪨',
    items: [
      { type: 'substrate', name: 'Substrate Layer', description: 'Soil/bedding' },
      { type: 'substrate', name: 'Drainage Layer', description: 'LECA/hydroballs' },
    ]
  },
  {
    name: 'Plants & Decor',
    icon: '🌿',
    items: [
      { type: 'decor', name: 'Tree', variant: 'tree', description: 'Large tree' },
      { type: 'decor', name: 'Bush', variant: 'bush', description: 'Bushy plant' },
      { type: 'decor', name: 'Fern', variant: 'fern', description: 'Fern plant' },
      { type: 'decor', name: 'Vine', variant: 'vine', description: 'Climbing vine' },
      { type: 'decor', name: 'Grass', variant: 'grass', description: 'Ground cover' },
      { type: 'decor', name: 'Branch', description: 'Climbing branch' },
      { type: 'decor', name: 'Rock', description: 'Decorative rock' },
    ]
  },
];

export default function EquipmentLibrary({ onAddItem }: EquipmentLibraryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ height: '600px' }}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Equipment Library</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Click items to add them to your enclosure
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {equipmentCategories.map((category) => (
          <div key={category.name} className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              {category.name}
            </h4>
            <div className="space-y-1">
              {category.items.map((item) => (
                <button
                  key={`${item.type}-${item.name}`}
                  onClick={() => onAddItem(item.type, item.variant)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          ))}
          
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-900 dark:text-purple-200">
              <strong>💡 Pro Tip:</strong> Add items, then drag, rotate, and resize them on the canvas to create your perfect layout!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
