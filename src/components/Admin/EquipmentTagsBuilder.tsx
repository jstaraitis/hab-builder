import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import enclosures from '../../data/equipment/enclosures.json';
import substrate from '../../data/equipment/substrate.json';
import cleanupCrew from '../../data/equipment/cleanup-crew.json';
import lighting from '../../data/equipment/lighting.json';
import heating from '../../data/equipment/heating.json';
import humidity from '../../data/equipment/humidity.json';
import monitoring from '../../data/equipment/monitoring.json';
import nutrition from '../../data/equipment/nutrition.json';
import decor from '../../data/equipment/decor.json';
import aquatic from '../../data/equipment/aquatic.json';
import { generateShoppingList } from '../../engine/shopping';
import type { AnimalProfile, EnclosureInput, ShoppingItem, EquipmentNeeds } from '../../engine/types';

interface EquipmentConfig {
  needsTags?: string[];
}

const EQUIPMENT_SOURCES: Array<Record<string, EquipmentConfig>> = [
  enclosures as Record<string, EquipmentConfig>,
  substrate as Record<string, EquipmentConfig>,
  cleanupCrew as Record<string, EquipmentConfig>,
  lighting as Record<string, EquipmentConfig>,
  heating as Record<string, EquipmentConfig>,
  humidity as Record<string, EquipmentConfig>,
  monitoring as Record<string, EquipmentConfig>,
  nutrition as Record<string, EquipmentConfig>,
  decor as Record<string, EquipmentConfig>,
  aquatic as Record<string, EquipmentConfig>,
];

const FIELD_ORDER = [
  'heatSource',
  'humidity',
  'lighting',
  'substrate',
  'diet',
  'waterFeature',
  'decor',
  'climbing',
  'activity',
  'climate',
  'animalType',
  'bioactiveSubstrate',
];

const SCHEMA_VALUES: Record<string, string[]> = {
  heatSource: ['basking', 'ambient', 'none'],
  humidity: ['high', 'moderate', 'low'],
  lighting: ['uvb-forest', 'uvb-desert', 'none'],
  substrate: [
    'bioactive',
    'soil',
    'paper',
    'foam',
    'sand',
    'sand-aquatic',
    'substrate-bare-bottom',
    'substrate-slate-tile',
    'substrate-fine-sand-aquatic',
  ],
  diet: [
    'insectivore',
    'omnivore',
    'herbivore',
    'carnivore-rodents',
    'carnivore-aquatic',
    'frugivore',
  ],
  waterFeature: ['shallow-dish', 'large-bowl', 'pool', 'none', 'fully-aquatic'],
  decor: ['branches', 'ledges', 'hides', 'plants', 'background'],
  climbing: ['vertical', 'ground', 'both', 'none', 'aquatic'],
  activity: ['arboreal', 'terrestrial', 'semi-arboreal', 'aquatic'],
  climate: ['tropical', 'semi-arid', 'arid', 'temperate'],
  animalType: ['reptile', 'amphibian'],
  bioactiveSubstrate: ['tropical', 'arid'],
};

const FIELD_DESCRIPTIONS: Record<string, string> = {
  heatSource: 'Primary heat strategy needed to reach target temperatures.',
  humidity: 'Overall humidity range required by the species.',
  lighting: 'UVB or lighting type required by the species.',
  substrate: 'Safe substrate options for the enclosure.',
  diet: 'Primary diet category for feeding supplies.',
  waterFeature: 'Primary water access needed in the enclosure.',
  decor: 'Core decor elements needed for security and enrichment.',
  climbing: 'Climbing structure emphasis based on behavior.',
  activity: 'Primary activity pattern for equipment matching.',
  climate: 'Native climate profile for environmental matching.',
  animalType: 'Taxonomic classification for compatibility checks.',
  bioactiveSubstrate: 'Bioactive substrate type if applicable.',
};

const VALUE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  heatSource: {
    basking: 'Focused basking heat source (spot heat).',
    ambient: 'Enclosure-wide ambient heat source.',
    none: 'No external heat source needed.',
  },
  humidity: {
    high: 'High humidity (70-90%+).',
    moderate: 'Moderate humidity (50-70%).',
    low: 'Low humidity (30-50%).',
  },
  lighting: {
    'uvb-forest': 'Lower UVB output for forest species (5.0/6%).',
    'uvb-desert': 'High UVB output for desert species (10.0/12%).',
    none: 'No UVB lighting required.',
  },
  substrate: {
    bioactive: 'Bioactive substrate with cleanup crew.',
    soil: 'Soil-based or loose substrate.',
    paper: 'Paper towel or newspaper.',
    foam: 'Foam mat substrate.',
    sand: 'Dry sand substrate.',
    'sand-aquatic': 'Fine aquatic sand (deep bed).',
    'substrate-bare-bottom': 'Bare-bottom enclosure.',
    'substrate-slate-tile': 'Slate tile or solid surface.',
    'substrate-fine-sand-aquatic': 'Fine aquatic sand (deep bed).',
  },
  diet: {
    insectivore: 'Primarily insects.',
    omnivore: 'Insects and plant matter.',
    herbivore: 'Plants and vegetables.',
    'carnivore-rodents': 'Frozen/thawed rodents.',
    'carnivore-aquatic': 'Aquatic proteins (worms, pellets).',
    frugivore: 'Fruit-based diets.',
  },
  waterFeature: {
    'shallow-dish': 'Shallow water dish for drinking/soaking.',
    'large-bowl': 'Large water bowl for bigger species.',
    pool: 'Partial pool for semi-aquatic species.',
    none: 'No water feature required.',
    'fully-aquatic': 'Fully aquatic setup required.',
  },
  decor: {
    branches: 'Branches or climbing decor.',
    ledges: 'Ledges or platforms.',
    hides: 'Hides or shelters.',
    plants: 'Plants (live or artificial).',
    background: 'Background panels.',
  },
  climbing: {
    vertical: 'Vertical climbing focus.',
    ground: 'Ground-level enrichment.',
    both: 'Both vertical and ground climbing.',
    none: 'No climbing structures needed.',
    aquatic: 'Aquatic climbing surfaces.',
  },
  activity: {
    arboreal: 'Primarily arboreal.',
    terrestrial: 'Primarily terrestrial.',
    'semi-arboreal': 'Mix of ground and climbing.',
    aquatic: 'Fully aquatic.',
  },
  climate: {
    tropical: 'Tropical rainforest climate.',
    'semi-arid': 'Semi-arid climate.',
    arid: 'Arid desert climate.',
    temperate: 'Temperate climate.',
  },
  animalType: {
    reptile: 'Reptile species.',
    amphibian: 'Amphibian species.',
  },
  bioactiveSubstrate: {
    tropical: 'Tropical bioactive mix.',
    arid: 'Arid bioactive mix.',
  },
};

const buildTagsByField = () => {
  const allowedFields = new Set(Object.keys(SCHEMA_VALUES));
  const fieldMap = new Map<string, Set<string>>();

  Object.entries(SCHEMA_VALUES).forEach(([field, values]) => {
    fieldMap.set(field, new Set(values));
  });

  EQUIPMENT_SOURCES.forEach((source) => {
    Object.values(source).forEach((item) => {
      item.needsTags?.forEach((tag) => {
        const [field, value] = tag.split(':');
        if (!field || !value || !allowedFields.has(field)) {
          return;
        }
        if (!fieldMap.has(field)) {
          fieldMap.set(field, new Set());
        }
        fieldMap.get(field)?.add(value);
      });
    });
  });

  return FIELD_ORDER.map((field) => ({
    field,
    tags: Array.from(fieldMap.get(field) ?? []).sort((a, b) => a.localeCompare(b)),
  }));
};

const createMockProfile = (selectedTags: Set<string>): AnimalProfile => {
  const equipmentNeeds: EquipmentNeeds = {};
  const arrayFields = new Set(['substrate', 'diet', 'decor']);
  const singleFields = new Set([
    'climbing',
    'humidity',
    'heatSource',
    'waterFeature',
    'lighting',
    'animalType',
    'climate',
    'activity',
    'bioactiveSubstrate',
  ]);

  selectedTags.forEach(tag => {
    const [field, value] = tag.split(':');
    if (!field || !value) return;

    if (arrayFields.has(field)) {
      if (!equipmentNeeds[field as keyof EquipmentNeeds]) {
        (equipmentNeeds as any)[field] = [];
      }
      ((equipmentNeeds as any)[field] as string[]).push(value);
    } else if (singleFields.has(field)) {
      (equipmentNeeds as any)[field] = value;
    }
  });

  return {
    id: 'mock-preview',
    commonName: 'Preview Animal',
    scientificName: 'Preview spp.',
    careLevel: 'beginner',
    minEnclosureSize: { width: 48, depth: 24, height: 24, units: 'in' },
    equipmentNeeds,
    careTargets: {
      temperature: {
        min: 75,
        max: 85,
        unit: 'F',
        thermalGradient: false,
      },
      humidity: {
        day: { min: 50, max: 70 },
        night: { min: 55, max: 75 },
        shedding: { min: 60, max: 80 },
        unit: '%',
      },
      lighting: {
        uvbRequired: equipmentNeeds.lighting?.includes('uvb'),
        coveragePercent: 50,
        photoperiod: '12h day / 12h night',
      },
      gradient: 'Preview gradient',
    },
    layoutRules: {
      preferVertical: false,
      verticalSpacePercent: 30,
      thermalGradient: 'horizontal',
      requiredZones: ['basking', 'hide'],
      optionalZones: [],
    },
    warnings: [],
    bioactiveCompatible: true,
    notes: [],
  };
};

const createMockInput = (): EnclosureInput => ({
  width: 48,
  depth: 24,
  height: 24,
  units: 'in',
  type: 'glass',
  animal: 'mock-preview',
  quantity: 1,
  bioactive: false,
  ambientTemp: 72,
  ambientHumidity: 50,
  humidityControl: 'manual',
  substratePreference: 'soil-based',
  plantPreference: 'artificial',
  backgroundType: 'none',
  numberOfHides: 2,
  numberOfLedges: 2,
  numberOfClimbingAreas: 1,
  hideStylePreference: 'both',
  doorOrientation: 'front',
  automatedLighting: false,
});

export default function EquipmentTagsBuilder() {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const tagsByField = buildTagsByField();

  // Generate preview shopping list based on selected tags
  const previewSupplies = useMemo(() => {
    if (selectedTags.size === 0) return [];
    
    const mockProfile = createMockProfile(selectedTags);
    const mockInput = createMockInput();
    const dims = { width: 48, depth: 24, height: 24 };
    
    try {
      return generateShoppingList(dims, mockProfile, mockInput);
    } catch (error) {
      console.error('Error generating preview shopping list:', error);
      return [];
    }
  }, [selectedTags]);

  // Group supplies by category
  const suppliesByCategory = useMemo(() => {
    const grouped = new Map<string, ShoppingItem[]>();
    previewSupplies.forEach(item => {
      if (!grouped.has(item.category)) {
        grouped.set(item.category, []);
      }
      grouped.get(item.category)?.push(item);
    });
    return grouped;
  }, [previewSupplies]);

  // Only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              Development Tool Only
            </h1>
            <p className="text-red-600 dark:text-red-300">
              This tool is only available in development mode (localhost).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const generateJSON = () => {
    const result: Record<string, string | string[]> = {};
    const arrayFields = new Set(['substrate', 'diet', 'decor']);
    const singleFields = new Set([
      'climbing',
      'humidity',
      'heatSource',
      'waterFeature',
      'lighting',
      'animalType',
      'climate',
      'activity',
      'bioactiveSubstrate',
    ]);
    
    selectedTags.forEach(tag => {
      const [field, value] = tag.split(':');
      if (!field || !value) {
        return;
      }

      if (arrayFields.has(field)) {
        if (!result[field]) {
          result[field] = [];
        }
        (result[field] as string[]).push(value);
        return;
      }

      if (singleFields.has(field)) {
        result[field] = value;
      }
    });

    return JSON.stringify(result, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSON());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mb-2">
            🔧 Equipment Tags Builder (Dev Only)
          </h1>
          <p className="text-yellow-800 dark:text-yellow-300">
            Select tags to generate the equipmentNeeds object for animal JSON files.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Tag Selection */}
          <div className="xl:col-span-2 space-y-6">
            {tagsByField.map((group) => (
              <div key={group.field} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 border-b-2 border-green-500 pb-2">
                  {group.field}
                </h2>
                {FIELD_DESCRIPTIONS[group.field] && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {FIELD_DESCRIPTIONS[group.field]}
                  </p>
                )}
                {group.tags.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tags available.</p>
                ) : (
                  <div className="space-y-3">
                    {group.tags.map((value) => {
                      const tag = `${group.field}:${value}`;
                      return (
                        <label
                          key={tag}
                          className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={() => toggleTag(tag)}
                            className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <div>
                            <div className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                              {tag}
                            </div>
                            {VALUE_DESCRIPTIONS[group.field]?.[value] && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {VALUE_DESCRIPTIONS[group.field][value]}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Generated Output & Preview */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  Selected Tags
                </h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {selectedTags.size}
                </p>
              </div>

              {/* Generated JSON */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Generated JSON
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200 max-h-[300px] overflow-y-auto">
                  {selectedTags.size > 0 ? generateJSON() : '// Select tags to generate JSON'}
                </pre>
              </div>

              {/* Supplies Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 border-b-2 border-purple-500 pb-2">
                  📦 Complete Shopping List Preview
                </h3>
                {previewSupplies.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Select tags to preview supplies
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded p-2 mb-3">
                      <strong>Note:</strong> Shows complete setup including baseline items (enclosure, substrate, monitoring, etc.) plus equipment matching your selected tags.
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <strong>{previewSupplies.length}</strong> total items for 48×24×24" glass enclosure
                    </div>
                    {Array.from(suppliesByCategory.entries()).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                          {category} ({items.length})
                        </h4>
                        <div className="space-y-1.5">
                          {items.map((item, idx) => (
                            <div 
                              key={item.uid || `${item.id}-${idx}`}
                              className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2"
                            >
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {item.name}
                              </div>
                              {item.quantity && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  Qty: {item.quantity}
                                </div>
                              )}
                              {item.importance && (() => {
                                let colorClass = 'text-gray-500 dark:text-gray-400';
                                if (item.importance === 'required') {
                                  colorClass = 'text-red-600 dark:text-red-400';
                                } else if (item.importance === 'recommended') {
                                  colorClass = 'text-blue-600 dark:text-blue-400';
                                }
                                return (
                                  <div className={`text-xs ${colorClass}`}>
                                    {item.importance}
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                  📋 How to Use
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Select relevant tags for your animal</li>
                  <li>Review supplies preview</li>
                  <li>Click "Copy" to copy JSON</li>
                  <li>Paste into animal JSON file</li>
                </ol>
              </div>

              {/* Clear Button */}
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
