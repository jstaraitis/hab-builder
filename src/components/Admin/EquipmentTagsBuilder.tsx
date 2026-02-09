import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TagInfo {
  tag: string;
  category: string;
  description: string;
  example: string;
}

const ALL_TAGS: TagInfo[] = [
  // HEATING & TEMPERATURE
  { tag: 'heatSource:basking', category: 'Heating', description: 'For basking species that need a focused hot spot', example: 'Bearded dragons, leopard geckos' },
  { tag: 'heatSource:ambient', category: 'Heating', description: 'For general enclosure heating (not focused spot)', example: 'Species needing overall warmth' },
  { tag: 'heating:aquatic', category: 'Heating', description: 'For aquarium heaters (submerged)', example: 'Turtles, aquatic frogs' },
  { tag: 'temperature:cold-water', category: 'Heating', description: 'For cold-water aquatic species (60-68°F)', example: 'Axolotls (CRITICAL)' },
  
  // HUMIDITY
  { tag: 'humidity:high', category: 'Humidity', description: 'For species needing 70-90%+ humidity', example: 'Tropical frogs, many geckos' },
  { tag: 'humidity:moderate', category: 'Humidity', description: 'For species needing 50-70% humidity', example: 'Many temperate reptiles' },
  { tag: 'humidity:low', category: 'Humidity', description: 'For arid/desert species (30-50% humidity)', example: 'Bearded dragons, leopard geckos' },
  { tag: 'humidity:moss', category: 'Humidity', description: 'For moss boxes or humid hides', example: 'Shedding reptiles' },
  
  // LIGHTING
  { tag: 'lighting:uvb-forest', category: 'Lighting', description: 'For tropical/forest species (5.0/6% UVB)', example: 'Crested geckos, tree frogs' },
  { tag: 'lighting:uvb-desert', category: 'Lighting', description: 'For desert species (10.0/12% UVB)', example: 'Bearded dragons, uromastyx' },
  
  // SUBSTRATE
  { tag: 'substrate:bioactive', category: 'Substrate', description: 'For living substrate with cleanup crew', example: 'Naturalistic setups' },
  { tag: 'substrate:soil', category: 'Substrate', description: 'For soil-based substrates (non-bioactive)', example: 'Burrowing species' },
  { tag: 'substrate:paper', category: 'Substrate', description: 'For paper towel/newspaper substrates', example: 'Quarantine, easy cleanup' },
  { tag: 'substrate:foam', category: 'Substrate', description: 'For foam mat substrates', example: 'Easy-clean setups' },
  { tag: 'substrate:sand', category: 'Substrate', description: 'For sand substrates (terrestrial)', example: 'Some desert species' },
  { tag: 'substrate:sand-aquatic', category: 'Substrate', description: 'For fine aquarium sand (6+ inches)', example: 'Axolotls' },
  { tag: 'substrate:carpet', category: 'Substrate', description: 'For reptile carpet', example: 'Easy-clean setups' },
  { tag: 'substrate:bare', category: 'Substrate', description: 'For bare-bottom (no substrate)', example: 'Axolotls (safest)' },
  { tag: 'substrate:slate', category: 'Substrate', description: 'For slate tile substrate', example: 'Aquatic/terrestrial easy-clean' },
  { tag: 'substrate:moss', category: 'Substrate', description: 'For sphagnum moss substrate/accents', example: 'Humid hides' },
  
  // DIET
  { tag: 'diet:insectivore', category: 'Diet', description: 'Eats primarily insects', example: 'Geckos, many lizards' },
  { tag: 'diet:omnivore', category: 'Diet', description: 'Eats both insects and plants', example: 'Bearded dragons' },
  { tag: 'diet:herbivore', category: 'Diet', description: 'Eats primarily plants/vegetables', example: 'Uromastyx, tortoises' },
  { tag: 'diet:carnivore-rodents', category: 'Diet', description: 'Eats rodents (frozen/thawed)', example: 'Ball pythons, corn snakes' },
  { tag: 'diet:carnivore-aquatic', category: 'Diet', description: 'Eats aquatic proteins (pellets, worms)', example: 'Axolotls, aquatic frogs' },
  { tag: 'diet:frugivore', category: 'Diet', description: 'Eats fruit-based diets', example: 'Crested geckos' },
  
  // AQUATIC & WATER
  { tag: 'aquatic', category: 'Aquatic', description: 'Fully aquatic species', example: 'Axolotls, aquatic frogs' },
  { tag: 'filtration:high-flow', category: 'Aquatic', description: 'For messy aquatic animals', example: 'Turtles' },
  { tag: 'filtration:low-flow', category: 'Aquatic', description: 'For delicate aquatics (gentle filtration)', example: 'Axolotls' },
  { tag: 'filtration:biological', category: 'Aquatic', description: 'For biological filtration media', example: 'All aquatic setups' },
  { tag: 'filtration:chemical', category: 'Aquatic', description: 'For chemical filtration', example: 'Water polishing' },
  { tag: 'water-quality:testing', category: 'Aquatic', description: 'For water parameter testing', example: 'All aquatic setups' },
  { tag: 'water-treatment', category: 'Aquatic', description: 'For water conditioners', example: 'All aquatic setups' },
  { tag: 'waterFeature:shallow-dish', category: 'Aquatic', description: 'For shallow water dishes', example: 'Terrestrial species' },
  { tag: 'water:dish', category: 'Aquatic', description: 'For water dishes/bowls', example: 'All terrestrial species' },
  { tag: 'basking:aquatic', category: 'Aquatic', description: 'For aquatic basking platforms', example: 'Turtles' },
  { tag: 'maintenance:water-change', category: 'Aquatic', description: 'For water change equipment', example: 'All aquatic setups' },
  
  // DECOR & ENRICHMENT
  { tag: 'decor:branches', category: 'Decor', description: 'For climbing branches', example: 'Arboreal species' },
  { tag: 'decor:plants', category: 'Decor', description: 'For plants (live or artificial)', example: 'All naturalistic setups' },
  { tag: 'plants:live', category: 'Decor', description: 'Specifically live plants', example: 'Bioactive setups' },
  { tag: 'plants:artificial', category: 'Decor', description: 'Specifically fake plants', example: 'Beginner setups' },
  { tag: 'plants:mixed', category: 'Decor', description: 'Combination of live and artificial', example: 'Balanced setups' },
  { tag: 'decor:background', category: 'Decor', description: 'For background panels', example: 'Visual appeal, climbing' },
  { tag: 'decor:ledges', category: 'Decor', description: 'For ledges/platforms', example: 'Arboreal species' },
  { tag: 'decor:hides', category: 'Decor', description: 'For terrestrial hides', example: 'All terrestrial species' },
  { tag: 'decor:hides-aquatic', category: 'Decor', description: 'For aquatic hides', example: 'Axolotls, aquatic frogs' },
  { tag: 'decor:humid-hide', category: 'Decor', description: 'For humid hide boxes', example: 'Shedding reptiles' },
  { tag: 'decor:natural', category: 'Decor', description: 'For natural decorations', example: 'Bioactive setups' },
  { tag: 'feeding:dish', category: 'Decor', description: 'For feeding dishes', example: 'Omnivores, herbivores' },
  
  // ACTIVITY & BEHAVIOR
  { tag: 'climbing:vertical', category: 'Activity', description: 'For vertical climbers', example: 'Tree frogs, crested geckos' },
  { tag: 'climbing:ground', category: 'Activity', description: 'For ground-level enrichment', example: 'Leopard geckos, bearded dragons' },
  { tag: 'animalType:amphibian', category: 'Activity', description: 'Specifically for amphibians', example: 'All frogs, salamanders' },
];

const CATEGORIES = ['Heating', 'Humidity', 'Lighting', 'Substrate', 'Diet', 'Aquatic', 'Decor', 'Activity'];

export default function EquipmentTagsBuilder() {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

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
    
    selectedTags.forEach(tag => {
      // Parse tag into field and value
      const [field, value] = tag.includes(':') ? tag.split(':') : [tag, ''];
      
      if (!result[field]) {
        result[field] = value || field;
      } else {
        // Convert to array if multiple values for same field
        if (!Array.isArray(result[field])) {
          result[field] = [result[field] as string];
        }
        (result[field] as string[]).push(value || field);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tag Selection */}
          <div className="lg:col-span-2 space-y-6">
            {CATEGORIES.map(category => {
              const tags = ALL_TAGS.filter(t => t.category === category);
              return (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-green-500 pb-2">
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {tags.map(tagInfo => (
                      <label
                        key={tagInfo.tag}
                        className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.has(tagInfo.tag)}
                          onChange={() => toggleTag(tagInfo.tag)}
                          className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                            {tagInfo.tag}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {tagInfo.description}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Example: {tagInfo.example}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generated Output */}
          <div className="lg:col-span-1">
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
                    Generated equipmentNeeds
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
                <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200 max-h-[600px] overflow-y-auto">
                  {selectedTags.size > 0 ? generateJSON() : '// Select tags to generate JSON'}
                </pre>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                  📋 How to Use
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Select relevant tags for your animal</li>
                  <li>Click "Copy" button</li>
                  <li>Paste into animal JSON file</li>
                  <li>Adjust field names if needed</li>
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
