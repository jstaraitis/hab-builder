import { useState } from 'react';
import type { EnclosureInput, Units, AnimalProfile, HumidityControl, SubstrateType, EnclosureType, BackgroundType } from '../../engine/types';
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
  { name: '36×18×18"', width: 36, depth: 18, height: 18, units: 'in' as Units },
  { name: '40×20×20"', width: 40, depth: 20, height: 20, units: 'in' as Units },
  { name: '48×24×24" (4×2×2)', width: 48, depth: 24, height: 24, units: 'in' as Units },
  { name: '48×24×48" (4×2×4)', width: 48, depth: 24, height: 48, units: 'in' as Units },
  { name: '72×24×24" (6×2×2)', width: 72, depth: 24, height: 24, units: 'in' as Units },
  { name: '72×36×36" (6×3×3)', width: 72, depth: 36, height: 36, units: 'in' as Units },
  { name: '84×24×24" (7×2×2)', width: 84, depth: 24, height: 24, units: 'in' as Units },
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Enclosure Setup</h2>

      {/* Setup Quality Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Setup Quality & Budget
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onChange({ ...value, setupTier: 'minimum' })}
            className={`relative overflow-hidden rounded-xl px-4 py-4 text-sm font-medium transition-all hover:shadow-lg ${
              value.setupTier === 'minimum'
                ? 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 border-2 border-gray-400 dark:border-gray-500 shadow-md'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-2 border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">✓</div>
            <div className="font-bold text-gray-900 dark:text-white whitespace-nowrap">Minimum</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-nowrap">Bare essentials</div>
          </button>
          <button
            onClick={() => onChange({ ...value, setupTier: 'recommended' })}
            className={`relative overflow-hidden rounded-xl px-4 py-4 text-sm font-medium transition-all hover:shadow-lg ${
              value.setupTier === 'recommended'
                ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-600 shadow-md'
                : 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-bold text-gray-900 dark:text-white whitespace-nowrap">Recommended</div>
            <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 whitespace-nowrap">Best value</div>
          </button>
          <button
            onClick={() => onChange({ ...value, setupTier: 'ideal' })}
            className={`relative overflow-hidden rounded-xl px-4 py-4 text-sm font-medium transition-all hover:shadow-lg ${
              value.setupTier === 'ideal'
                ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 border-2 border-emerald-400 dark:border-emerald-600 shadow-md'
                : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <div className="text-2xl mb-2">💎</div>
            <div className="font-bold text-gray-900 dark:text-white whitespace-nowrap">Ideal</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 whitespace-nowrap">Premium quality</div>
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          This determines which equipment options appear in your shopping list
        </p>
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

      {/* Preset Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Enclosure Size
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
              title={enclosureType === 'glass' ? 'Best for visibility' : enclosureType === 'pvc' ? 'Good all-around option' : 'Excellent airflow, lose humidity quickly'}
            >
              {enclosureType.charAt(0).toUpperCase() + enclosureType.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {value.type === 'glass' && '✓ Best for visibility'}
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

      {/* Bioactive Setup */}
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

      {/* Ambient Room Temperature */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4" />
              </svg>
            </div>
            Ambient Room Temperature
          </label>
          <span 
            className="text-2xl font-bold transition-colors"
            style={{
              color: `rgb(${Math.round(59 + (239 - 59) * ((value.ambientTemp - 60) / 20))}, ${Math.round(130 - 62 * ((value.ambientTemp - 60) / 20))}, ${Math.round(246 - 178 * ((value.ambientTemp - 60) / 20))})`
            }}
          >
            {value.ambientTemp}°F
          </span>
        </div>
        <input
          type="range"
          min="60"
          max="80"
          value={value.ambientTemp}
          onChange={(e) => onChange({ ...value, ambientTemp: parseInt(e.target.value) })}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(239, 68, 68))'
          }}
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Affects heating power needed</p>
      </div>

      {/* Ambient Room Humidity */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            Ambient Room Humidity
          </label>
          <span 
            className="text-2xl font-bold transition-colors"
            style={{
              color: `rgb(${Math.round(245 - 239 * (value.ambientHumidity / 100))}, ${Math.round(158 + 24 * (value.ambientHumidity / 100))}, ${Math.round(11 + 201 * (value.ambientHumidity / 100))})`
            }}
          >
            {value.ambientHumidity}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value.ambientHumidity}
          onChange={(e) => onChange({ ...value, ambientHumidity: parseInt(e.target.value) })}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, rgb(245, 158, 11), rgb(6, 182, 212))'
          }}
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Your room's natural humidity level</p>
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

      {/* Background Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Background
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'cork-bark', 'foam'] as BackgroundType[]).map((bg) => (
            <button
              key={bg}
              onClick={() => onChange({ ...value, backgroundType: bg })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.backgroundType === bg
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {bg === 'none' ? 'None' : bg === 'cork-bark' ? 'Cork Bark' : 'Custom Foam'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Adds depth and climbing surfaces (optional)
        </p>
      </div>

      {/* Number of Hides */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Number of Hides
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...value, numberOfHides: Math.max(2, value.numberOfHides - 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Decrease hides"
          >
            −
          </button>
          <input
            type="number"
            value={value.numberOfHides}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 2;
              onChange({ ...value, numberOfHides: Math.max(2, Math.min(5, num)) });
            }}
            min="2"
            max="5"
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => onChange({ ...value, numberOfHides: Math.min(5, value.numberOfHides + 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Increase hides"
          >
            +
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Provide security and enrichment (2-5 recommended)
          </span>
        </div>
      </div>

      {/* Number of Ledges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Number of Wall Ledges
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...value, numberOfLedges: Math.max(0, value.numberOfLedges - 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Decrease ledges"
          >
            −
          </button>
          <input
            type="number"
            value={value.numberOfLedges}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 0;
              onChange({ ...value, numberOfLedges: Math.max(0, Math.min(6, num)) });
            }}
            min="0"
            max="6"
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => onChange({ ...value, numberOfLedges: Math.min(6, value.numberOfLedges + 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Increase ledges"
          >
            +
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Platforms for arboreal species (0-6)
          </span>
        </div>
      </div>
    </div>
  );
}
