import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Zap, Sun, Cpu, Droplet, Home, Layers, Image, Leaf, Mountain, Plus, Lightbulb, ChevronRight } from 'lucide-react';

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
    name: 'Hides & Shelter',
    icon: '',
    items: [
      { type: 'hide', name: 'Cork Hide',variant: 'hide', description: 'Natural hide' },
      { type: 'hide', name: 'Cave', variant: 'hide1',description: 'Rock/resin cave' }
    ]
  },

  {
    name: 'Basking & Platforms',
    icon: '',
    items: [
      { type: 'decor', name: 'Basking Stone', variant: 'ledge', description: 'Flat basking rock' },
      { type: 'decor', name: 'Basking Platform', variant: 'baskingledge', description: 'Elevated platform' }
    ]
  },
  {
    name: 'Plants - Foliage',
    icon: '',
    items: [
      { type: 'decor', name: 'Pothos', variant: 'pothos', description: 'Climbing vine plant' },
      { type: 'decor', name: 'Snake Plant', variant: 'snake-plant', description: 'Tall succulent' },
      { type: 'decor', name: 'Fern', variant: 'fern', description: 'Fern plant' },
      { type: 'decor', name: 'Ficus', variant: 'ficus', description: 'Tropical plant' },
      { type: 'decor', name: 'Philodendron', variant: 'philodendron', description: 'Climbing vine plant' },
      { type: 'decor', name: 'Snake Plant 2', variant: 'snake-plant-single', description: 'Tall succulent' },
      { type: 'decor', name: 'Large Plant', variant: 'plant', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant1', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant2', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant3', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant4', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant5', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant6', description: 'Tall plant' },
      { type: 'decor', name: 'Large Plant', variant: 'plant7', description: 'Tall plant' },


    ]
  },
  {
    name: 'Plants - Trees & Shrubs',
    icon: '',
    items: [
      { type: 'decor', name: 'Tree', variant: 'tree', description: 'Branch 1' },
      { type: 'decor', name: 'Tree', variant: 'tree1', description: 'Branch 2' },
      { type: 'decor', name: 'Tree', variant: 'tree2', description: 'Branch 3' },
      { type: 'decor', name: 'Tree', variant: 'tree3', description: 'Branch 4' },
      { type: 'decor', name: 'Tree', variant: 'tree4', description: 'Branch 5' },
      { type: 'decor', name: 'Tree', variant: 'tree7', description: 'Branch 6' },
      { type: 'decor', name: 'Vine', variant: 'tree5', description: 'Vine 1' },
      { type: 'decor', name: 'Vine', variant: 'tree6', description: 'Vine 2' }

    ]
  },
];

export function EquipmentLibrary({ onAddItem }: Readonly<EquipmentLibraryProps>) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toKebabCase = (value: string) => {
    let slug = '';
    let previousWasDash = false;

    for (const char of value.toLowerCase()) {
      const isAlphanumeric =
        (char >= 'a' && char <= 'z') ||
        (char >= '0' && char <= '9');

      if (isAlphanumeric) {
        slug += char;
        previousWasDash = false;
      } else if (!previousWasDash && slug.length > 0) {
        slug += '-';
        previousWasDash = true;
      }
    }

    if (slug.endsWith('-')) {
      slug = slug.slice(0, -1);
    }

    return slug;
  };

  const getItemImagePath = (item: EquipmentCategory['items'][number]) => {
    const imageKey = item.variant || toKebabCase(item.name);
    return imageKey ? `/equiptment/${imageKey}.png` : null;
  };

  const getItemImageCandidates = (item: EquipmentCategory['items'][number]) => {
    const imageKey = item.variant || toKebabCase(item.name);

    if (!imageKey) {
      return [];
    }

    return [
      `/equiptment/${imageKey}.png`,
      `/equiptment/${imageKey}.webp`,
      `/equipment/${imageKey}.png`,
      `/equipment/${imageKey}.webp`,
      `/equipment/plants/${imageKey}.png`,
      `/equipment/decor/${imageKey}.png`,
    ];
  };

  const handleThumbnailError = (
    e: SyntheticEvent<HTMLImageElement>,
    sources: string[]
  ) => {
    const imageEl = e.currentTarget;
    const currentIndex = Number(imageEl.dataset.sourceIndex || '0');
    const nextIndex = currentIndex + 1;

    if (nextIndex < sources.length) {
      imageEl.dataset.sourceIndex = String(nextIndex);
      imageEl.src = sources[nextIndex];
      return;
    }

    imageEl.style.display = 'none';
    const fallback = imageEl.nextElementSibling as HTMLElement | null;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  const getTypeIcon = (type: EquipmentCategory['items'][number]['type']) => {
    switch (type) {
      case 'heat':
        return <Zap size={16} />;
      case 'uvb':
        return <Sun size={16} />;
      case 'water':
        return <Droplet size={16} />;
      case 'hide':
        return <Home size={16} />;
      case 'substrate':
        return <Layers size={16} />;
      default:
        return <Image size={16} />;
    }
  };

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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Library</h3>
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
              <span className="text-lg flex items-center gap-2">
                {(() => {
                  const map: Record<string, React.ReactNode> = {
                    'Heating': <Zap size={20} />,
                    'Lighting': <Sun size={20} />,
                    'Monitoring': <Cpu size={20} />,
                    'Water & Humidity': <Droplet size={20} />,
                    'Hides & Shelter': <Home size={20} />,
                    'Climbing Structures': <Image size={20} />,
                    'Basking & Platforms': <Layers size={20} />,
                    'Feeding': <Plus size={20} />,
                    'Substrate': <Layers size={20} />,
                    'Backgrounds': <Image size={20} />,
                    'Plants - Foliage': <Leaf size={20} />,
                    'Plants - Trees & Shrubs': <Leaf size={20} />,
                    'Landscaping': <Mountain size={20} />,
                  };
                  return map[category.name] ? <span className="text-green-600 dark:text-green-400">{map[category.name]}</span> : <span>{category.icon}</span>;
                })()}
                <span className="flex-1 text-left">{category.name}</span>
              </span>
              <span className="text-xs transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                <ChevronRight size={14} />
              </span>
            </button>
            {isExpanded && (
            <div className="grid grid-cols-3 gap-2">
              {category.items.map((item, index) => {
                const imageCandidates = getItemImageCandidates(item);
                const imageSrc = imageCandidates[0] || getItemImagePath(item);

                return (
                <button
                  key={`${item.type}-${item.name}-${item.variant || 'default'}-${index}`}
                  onClick={() => onAddItem(item.type, item.variant)}
                  className="w-full aspect-square rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group p-1.5"
                  title={item.name}
                  aria-label={`Add ${item.name}`}
                >
                  <div className="w-full h-full rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        data-source-index="0"
                        onError={(e) => handleThumbnailError(e, imageCandidates)}
                      />
                    ) : null}
                    <div
                      style={{ display: imageSrc ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center text-gray-500 dark:text-gray-300"
                    >
                      {getTypeIcon(item.type)}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
            )}
          </div>
            );
          })}
          
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Lightbulb size={16} className="text-purple-700 dark:text-purple-200" />
              <strong>Pro Tip:</strong>
              <span>Add items, then drag, rotate, and resize them on the canvas to create your perfect layout!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentLibrary;
