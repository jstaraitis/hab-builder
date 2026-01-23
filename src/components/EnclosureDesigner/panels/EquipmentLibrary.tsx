import { useState } from 'react';

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
      { type: 'heat', name: '💡 Heat Lamp', description: 'Basking heat source' },
      { type: 'heat', name: '🔴 Ceramic Heater', description: 'Non-light heat' },
      { type: 'heat', name: '🟫 Heat Mat', description: 'Under-tank heating' },
      { type: 'heat', name: '🔆 Deep Heat Projector', description: 'DHP radiant heat' },
      { type: 'heat', name: '📛 Radiant Heat Panel', description: 'RHP overhead heat' },
    ]
  },
  {
    name: 'Lighting',
    icon: '☀️',
    items: [
      { type: 'uvb', name: '💡 UVB Fixture', description: 'T5 HO UVB lighting' },
      { type: 'uvb', name: '💡 LED Light', description: 'Plant growth light' },
      { type: 'uvb', name: '💡 Halogen Bulb', description: 'Basking with IR-A' },
      { type: 'uvb', name: '💡 Compact UVB', description: 'Small UVB bulb' },
    ]
  },
  {
    name: 'Monitoring',
    icon: '📊',
    items: [
      { type: 'decor', name: '🌡️ Thermometer/Hygrometer', variant: 'monitor', description: 'Temp & humidity gauge' },
      { type: 'decor', name: '📏 Digital Probe', variant: 'probe', description: 'Temperature probe' },
      { type: 'decor', name: '⏰ Timer Switch', variant: 'timer', description: 'Lighting timer' },
      { type: 'decor', name: '🎛️ Thermostat', variant: 'thermostat', description: 'Heat controller' },
    ]
  },
  {
    name: 'Water & Humidity',
    icon: '💧',
    items: [
      { type: 'water', name: '🥣 Water Dish', description: 'Drinking water' },
      { type: 'water', name: '⛲ Water Feature', description: 'Waterfall/fountain' },
      { type: 'water', name: '💦 Misting System', description: 'Humidity control' },
      { type: 'water', name: '🌫️ Fogger Unit', description: 'Fog generator' },
      { type: 'water', name: '🚿 Automatic Mister', description: 'Timed misting' },
      { type: 'water', name: '📦 Humidity Box', description: 'Shedding chamber' },
    ]
  },
  {
    name: 'Hides & Shelter',
    icon: '🏠',
    items: [
      { type: 'hide', name: '🪵 Cork Hide', description: 'Natural hide' },
      { type: 'hide', name: '🕳️ Cave', description: 'Rock/resin cave' },
      { type: 'hide', name: '💧 Humid Hide', description: 'Shedding box' },
      { type: 'hide', name: '🪵 Half Log', description: 'Log hide' },
      { type: 'hide', name: '🍂 Leaf Litter Pile', description: 'Natural cover' },
      { type: 'hide', name: '⛰️ Burrow Entrance', description: 'Underground entrance' },
      { type: 'hide', name: '🏰 Multi-Level Hide', description: 'Stacked hide' },
    ]
  },
  {
    name: 'Climbing Structures',
    icon: '🪜',
    items: [
      { type: 'decor', name: '🪵 Cork Bark Tube', variant: 'cork-tube', description: 'Hollow cork log' },
      { type: 'decor', name: '🪵 Cork Bark Flat', variant: 'cork-flat', description: 'Flat cork panel' },
      { type: 'decor', name: '🌳 Driftwood', variant: 'driftwood', description: 'Natural wood' },
      { type: 'decor', name: '🎋 Bamboo Poles', variant: 'bamboo', description: 'Bamboo branches' },
      { type: 'decor', name: '🕸️ Climbing Net', variant: 'net', description: 'Mesh climbing surface' },
      { type: 'decor', name: '🪢 Hammock', variant: 'hammock', description: 'Hanging platform' },
    ]
  },
  {
    name: 'Basking & Platforms',
    icon: '🪨',
    items: [
      { type: 'decor', name: '🪨 Basking Stone', variant: 'basking-stone', description: 'Flat basking rock' },
      { type: 'decor', name: '📐 Basking Platform', variant: 'platform', description: 'Elevated platform' },
      { type: 'decor', name: '🧲 Magnetic Ledge', variant: 'ledge', description: 'Magnetic shelf' },
      { type: 'decor', name: '📐 Corner Shelf', variant: 'corner-shelf', description: 'Corner platform' },
    ]
  },
  {
    name: 'Feeding',
    icon: '🍽️',
    items: [
      { type: 'decor', name: '🥣 Food Dish', variant: 'food-dish', description: 'Feeding bowl' },
      { type: 'decor', name: '🍽️ Feeding Ledge', variant: 'feeding-ledge', description: 'Elevated feeding platform' },
      { type: 'decor', name: '🪱 Worm Dish', variant: 'worm-dish', description: 'Escape-proof dish' },
      { type: 'decor', name: '🧂 Supplement Dish', variant: 'supplement-dish', description: 'Calcium dish' },
    ]
  },
  {
    name: 'Substrate',
    icon: '🪨',
    items: [
      { type: 'substrate', name: '🟫 Substrate Layer', description: 'Soil/bedding' },
      { type: 'substrate', name: '⚪ Drainage Layer', description: 'LECA/hydroballs' },
      { type: 'substrate', name: '🍂 Leaf Litter', description: 'Natural leaf cover' },
      { type: 'substrate', name: '🌿 Sphagnum Moss', description: 'Moisture retention' },
    ]
  },
  {
    name: 'Backgrounds',
    icon: '🖼️',
    items: [
      { type: 'decor', name: '🪵 Cork Background', variant: 'cork-bg', description: 'Cork panel background' },
      { type: 'decor', name: '🪨 Foam Background', variant: 'foam-bg', description: 'Carved foam background' },
      { type: 'decor', name: '🧱 Rock Wall Panel', variant: 'rock-wall', description: 'Stone background' },
      { type: 'decor', name: '🕸️ Mesh Surface', variant: 'mesh', description: 'Climbing mesh' },
    ]
  },
  {
    name: 'Plants - Foliage',
    icon: '🌿',
    items: [
      { type: 'decor', name: '🌿 Pothos', variant: 'pothos', description: 'Climbing vine plant' },
      { type: 'decor', name: '🌱 Snake Plant', variant: 'snake-plant', description: 'Tall succulent' },
      { type: 'decor', name: '🌿 Fern', variant: 'fern', description: 'Fern plant' },
      { type: 'decor', name: '🌺 Bromeliad', variant: 'bromeliad', description: 'Tropical plant' },
      { type: 'decor', name: '🌱 Air Plant', variant: 'air-plant', description: 'Epiphyte plant' },
      { type: 'decor', name: '🌵 Succulent', variant: 'succulent', description: 'Desert plant' },
      { type: 'decor', name: '🟢 Moss Patch', variant: 'moss', description: 'Sheet moss' },
    ]
  },
  {
    name: 'Plants - Trees & Shrubs',
    icon: '🌳',
    items: [
      { type: 'decor', name: '🌳 Tree', variant: 'tree', description: 'Large tree' },
      { type: 'decor', name: '🌳 Bush', variant: 'bush', description: 'Bushy plant' },
      { type: 'decor', name: '🌿 Vine', variant: 'vine', description: 'Climbing vine' },
      { type: 'decor', name: '🌾 Grass', variant: 'grass', description: 'Ground cover' },
    ]
  },
  {
    name: 'Landscaping',
    icon: '⛰️',
    items: [
      { type: 'decor', name: '🪨 Large Rock', variant: 'large-rock', description: 'Rock formation' },
      { type: 'decor', name: '🪵 Log/Stump', variant: 'log', description: 'Natural wood stump' },
      { type: 'decor', name: '🗿 Stone Pile', variant: 'stone-pile', description: 'Stacked stones' },
      { type: 'decor', name: '🌳 Centerpiece Wood', variant: 'centerpiece', description: 'Feature driftwood' },
      { type: 'decor', name: '🌿 Branch', description: 'Climbing branch' },
      { type: 'decor', name: '🪨 Rock', description: 'Decorative rock' },
    ]
  },
];

export default function EquipmentLibrary({ onAddItem }: EquipmentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

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
          {equipmentCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.name);
            return (
          <div key={category.name} className="space-y-2">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <span className="text-lg">{category.icon}</span>
              <span className="flex-1 text-left">{category.name}</span>
              <span className="text-xs transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
            </button>
            {isExpanded && (
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
            )}
          </div>
            );
          })}
          
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
