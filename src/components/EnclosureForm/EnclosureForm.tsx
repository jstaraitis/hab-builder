import { useState } from 'react';
import type { EnclosureInput, Units, BudgetTier, AnimalProfile, HumidityControl, SubstrateType, EnclosureType } from '../../engine/types';
import { validateEnclosureSize, validateEnclosureType } from '../../engine/validateEnclosure';
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
  const typeValidation = animalProfile ? validateEnclosureType(value, animalProfile) : null;

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Enclosure Dimensions</h2>

      {/* Preset Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        
        {/* Size Validation Feedback */}
        {sizeValidation && animalProfile && (
          <div className="mt-3">
            <SizeFeedback validation={sizeValidation} animalName={animalProfile.commonName} />
          </div>
        )}
      </div>

      {/* Animal Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Number of Animals
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...value, quantity: Math.max(1, value.quantity - 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            value={value.quantity}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 1;
              onChange({ ...value, quantity: Math.max(1, Math.min(20, num)) });
            }}
            min="1"
            max="20"
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => onChange({ ...value, quantity: Math.min(20, value.quantity + 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Increase quantity"
          >
            +
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value.quantity === 1 ? '1 animal' : `${value.quantity} animals`}
          </span>
        </div>
      </div>

      {/* Custom Dimensions */}
      {!usePreset && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Width
              </label>
              <input
                type="number"
                value={value.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Depth
              </label>
              <input
                type="number"
                value={value.depth || ''}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Height
              </label>
              <input
                type="number"
                value={value.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Units:</label>
            <button
              onClick={() => onChange({ ...value, units: 'in' })}
              className={`px-4 py-1 rounded-md text-sm ${
                value.units === 'in'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => onChange({ ...value, units: 'cm' })}
              className={`px-4 py-1 rounded-md text-sm ${
                value.units === 'cm'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>
      )}

      {/* Enclosure Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Enclosure Material
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['glass', 'pvc', 'screen'] as EnclosureType[]).map((enclosureType) => (
            <button
              key={enclosureType}
              onClick={() => onChange({ ...value, type: enclosureType })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.type === enclosureType
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={enclosureType === 'glass' ? 'Best humidity retention' : enclosureType === 'pvc' ? 'Good all-around option' : 'Excellent airflow, lose humidity quickly'}
            >
              {enclosureType.charAt(0).toUpperCase() + enclosureType.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {value.type === 'glass' && '✓ Best for humidity retention'}
          {value.type === 'pvc' && '✓ Versatile option'}
          {value.type === 'screen' && '✓ Maximum airflow, needs active humidity control'}
        </p>
        
        {/* Enclosure Type Validation Feedback */}
        {typeValidation && !typeValidation.compatible && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-3 rounded-r">
            <div className="flex items-start gap-2">
              <span className="text-red-500 dark:text-red-400 text-lg">⚠️</span>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {typeValidation.warning}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.bioactive}
            onChange={(e) => onChange({ 
              ...value, 
              bioactive: e.target.checked,
              substratePreference: e.target.checked ? 'bioactive' : 'soil-based'
            })}
            className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-gray-800 dark:text-white">Bioactive Setup</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Includes drainage layer, live plants, and cleanup crew
            </p>
          </div>
        </label>
      </div>

      {/* Budget Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Ambient Room Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Ambient Room Temperature: {value.ambientTemp}°F
        </label>
        <input
          type="range"
          min="60"
          max="80"
          value={value.ambientTemp}
          onChange={(e) => onChange({ ...value, ambientTemp: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Affects heating power needed</p>
      </div>

      {/* Ambient Room Humidity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Ambient Room Humidity: {value.ambientHumidity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={value.ambientHumidity}
          onChange={(e) => onChange({ ...value, ambientHumidity: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Your room's natural humidity level</p>
      </div>

      {/* Humidity Control Method - Only show if needed */}
      {animalProfile && value.ambientHumidity < animalProfile.careTargets.humidity.min && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Humidity Control Method
        </label>
        <select
          value={value.humidityControl || 'manual'}
          onChange={(e) => onChange({ ...value, humidityControl: e.target.value as HumidityControl })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500"
        >
          <option value="none">None</option>
          <option value="manual">Manual Misting</option>
          <option value="misting-system">Misting System</option>
          <option value="humidifier">Humidifier</option>
          <option value="fogger">Fogger</option>
        </select>
      </div>
      )}

      {/* Substrate Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Substrate Preference
        </label>
        <select
          value={value.substratePreference || 'soil-based'}
          onChange={(e) => onChange({ ...value, substratePreference: e.target.value as SubstrateType })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500"
        >
          <option value="bioactive">Bioactive Mix</option>
          <option value="soil-based">Soil-Based</option>
          <option value="paper-based">Paper-Based</option>
          <option value="foam">Foam</option>
        </select>
      </div>

      {/* Plant Type Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Plant Preference
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['live', 'artificial', 'mix']).map((plant) => (
            <button
              key={plant}
              onClick={() => onChange({ ...value, plantPreference: plant as 'live' | 'artificial' | 'mix' })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.plantPreference === plant
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {plant === 'live' ? 'Live' : plant === 'artificial' ? 'Artificial' : 'Mixed'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
