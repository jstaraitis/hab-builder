import { useState } from 'react';
import type { EnclosureInput, Units, BudgetTier, AnimalProfile } from '../../engine/types';
import { validateEnclosureSize } from '../../engine/validateEnclosure';
import { SizeFeedback } from '../Validation/SizeFeedback';

interface EnclosureFormProps {
  value: EnclosureInput;
  onChange: (input: EnclosureInput) => void;
  animalProfile?: AnimalProfile; // Optional: for validation feedback
}

const commonSizes = [
  { name: '20×10×10"', width: 20, depth: 10, height: 10, units: 'in' as Units },
  { name: '20×10×20"', width: 20, depth: 10, height: 20, units: 'in' as Units },
  { name: '18×18×24"', width: 18, depth: 18, height: 24, units: 'in' as Units },
  { name: '18×18×36"', width: 18, depth: 18, height: 36, units: 'in' as Units },
  { name: '24×18×36"', width: 24, depth: 18, height: 36, units: 'in' as Units },
  { name: '40×20×20"', width: 40, depth: 20, height: 20, units: 'in' as Units },
  { name: 'Custom', width: 0, depth: 0, height: 0, units: 'in' as Units },
];

export function EnclosureForm({ value, onChange, animalProfile }: EnclosureFormProps) {
  const [usePreset, setUsePreset] = useState(true);

  // Calculate size validation if animal profile is provided
  const sizeValidation = animalProfile ? validateEnclosureSize(value, animalProfile) : null;

  const handlePresetChange = (preset: typeof commonSizes[0]) => {
    if (preset.name === 'Custom') {
      setUsePreset(false);
      return;
    }
    onChange({
      ...value,
      width: preset.width,
      depth: preset.depth,
      height: preset.height,
      units: preset.units,
    });
  };

  const handleDimensionChange = (field: 'width' | 'depth' | 'height', val: string) => {
    const num = parseFloat(val) || 0;
    onChange({ ...value, [field]: num });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Enclosure Dimensions</h2>

      {/* Preset Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size Preset
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {commonSizes.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetChange(preset)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                usePreset && 
                value.width === preset.width && 
                value.height === preset.height
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dimensions */}
      {!usePreset && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="number"
                value={value.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depth
              </label>
              <input
                type="number"
                value={value.depth || ''}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="number"
                value={value.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Units:</label>
            <button
              onClick={() => onChange({ ...value, units: 'in' })}
              className={`px-4 py-1 rounded-md text-sm ${
                value.units === 'in'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => onChange({ ...value, units: 'cm' })}
              className={`px-4 py-1 rounded-md text-sm ${
                value.units === 'cm'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.bioactive}
            onChange={(e) => onChange({ ...value, bioactive: e.target.checked })}
            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-gray-800">Bioactive Setup</span>
            <p className="text-sm text-gray-600">
              Includes drainage layer, live plants, and cleanup crew
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.beginnerMode}
            onChange={(e) => onChange({ ...value, beginnerMode: e.target.checked })}
            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-gray-800">Beginner Safe Mode</span>
            <p className="text-sm text-gray-600">
              Simplified recommendations and extra safety warnings
            </p>
          </div>
        </label>
      </div>

      {/* Budget Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'mid', 'premium'] as BudgetTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => onChange({ ...value, budget: tier })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.budget === tier
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Size Feedback */}
      {sizeValidation && animalProfile && (
        <div className="pt-4 border-t">
          <SizeFeedback validation={sizeValidation} animalName={animalProfile.commonName} />
        </div>
      )}
    </div>
  );
}
