import { useState, useMemo } from 'react';
import type { EnclosureInput, Units, AnimalProfile, HumidityControl, SubstrateType, EnclosureType, BackgroundType } from '../../engine/types';
import { CheckCircle, Star, Award, AlertTriangle, Thermometer, Droplet } from 'lucide-react';
import { validateEnclosureSize, validateEnclosureType, validateBioactive } from '../../engine/validateEnclosure';
import { SizeFeedback } from '../Validation/SizeFeedback';
import { useUnits } from '../../contexts/UnitsContext';
import { inchesToCm, cmToInches, getLengthUnit, fahrenheitToCelsius, getTempUnit } from '../../utils/unitConversion';

interface EnclosureFormProps {
  value: EnclosureInput;
  onChange: (input: EnclosureInput) => void;
  animalProfile?: AnimalProfile; // Optional: for validation feedback
}

const commonSizes = [
  { name: '12×12×12"', width: 12, depth: 12, height: 12, units: 'in' as Units },
  { name: '12×12×18"', width: 12, depth: 12, height: 18, units: 'in' as Units },
  { name: '18×12×12"', width: 18, depth: 12, height: 12, units: 'in' as Units },
  { name: '20×10×10"', width: 20, depth: 10, height: 10, units: 'in' as Units },
  { name: '20×10×20"', width: 20, depth: 10, height: 20, units: 'in' as Units },
  { name: '18×18×18"', width: 18, depth: 18, height: 18, units: 'in' as Units },
  { name: '18×18×24"', width: 18, depth: 18, height: 24, units: 'in' as Units },
  { name: '24×18×18"', width: 24, depth: 18, height: 18, units: 'in' as Units },
  { name: '18×18×36"', width: 18, depth: 18, height: 36, units: 'in' as Units },
  { name: '24×18×24"', width: 24, depth: 18, height: 24, units: 'in' as Units },
  { name: '24×18×36"', width: 24, depth: 18, height: 36, units: 'in' as Units },
  { name: '36×18×18"', width: 36, depth: 18, height: 18, units: 'in' as Units },
  { name: '36×18×36"', width: 36, depth: 18, height: 36, units: 'in' as Units },
  { name: '40×20×20"', width: 40, depth: 20, height: 20, units: 'in' as Units },
  { name: '48×18×18" (4×1.5×1.5)', width: 48, depth: 18, height: 18, units: 'in' as Units },
  { name: '48×24×18"', width: 48, depth: 24, height: 18, units: 'in' as Units },
  { name: '48×24×24" (4×2×2)', width: 48, depth: 24, height: 24, units: 'in' as Units },
  { name: '48×24×48" (4×2×4)', width: 48, depth: 24, height: 48, units: 'in' as Units },
  { name: '60×24×24" (5×2×2)', width: 60, depth: 24, height: 24, units: 'in' as Units },
  { name: '72×24×24" (6×2×2)', width: 72, depth: 24, height: 24, units: 'in' as Units },
  { name: '72×30×24" (6×2.5×2)', width: 72, depth: 30, height: 24, units: 'in' as Units },
  { name: '96×24×24" (8×2×2)', width: 96, depth: 24, height: 24, units: 'in' as Units },
  { name: 'Custom', width: 0, depth: 0, height: 0, units: 'in' as Units },
];

const aquariumSizes = [
  { name: '10 gallon', width: 20, depth: 10, height: 12, units: 'in' as Units },
  { name: '15 gallon', width: 24, depth: 12, height: 12, units: 'in' as Units },
  { name: '20 gallon Long', width: 30, depth: 12, height: 12, units: 'in' as Units },
  { name: '20 gallon High', width: 24, depth: 12, height: 16, units: 'in' as Units },
  { name: '29 gallon', width: 30, depth: 12, height: 18, units: 'in' as Units },
  { name: '40 gallon Breeder', width: 36, depth: 18, height: 16, units: 'in' as Units },
  { name: '40 gallon Long', width: 48, depth: 12, height: 16, units: 'in' as Units },
  { name: '55 gallon', width: 48, depth: 13, height: 21, units: 'in' as Units },
  { name: '75 gallon', width: 48, depth: 18, height: 21, units: 'in' as Units },
  { name: '90 gallon', width: 48, depth: 18, height: 24, units: 'in' as Units },
  { name: '125 gallon', width: 72, depth: 18, height: 23, units: 'in' as Units },
  { name: '150 gallon', width: 72, depth: 18, height: 28, units: 'in' as Units },
  { name: '180 gallon', width: 72, depth: 24, height: 25, units: 'in' as Units },
  { name: 'Custom', width: 0, depth: 0, height: 0, units: 'in' as Units },
];

export function EnclosureForm({ value, onChange, animalProfile }: EnclosureFormProps) {
  const [usePreset, setUsePreset] = useState(true);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const { isMetric } = useUnits();

  // Determine which size list to use based on animal type
  const isAquatic = animalProfile?.equipmentNeeds?.activity === 'aquatic';
  const sizeList = isAquatic ? aquariumSizes : commonSizes;

  // Calculate size validation if animal profile is provided
  const sizeValidation = animalProfile ? validateEnclosureSize(value, animalProfile) : null;
  const typeValidation = animalProfile ? validateEnclosureType(value, animalProfile) : null;
  const bioactiveValidation = animalProfile ? validateBioactive(value, animalProfile) : null;

  // Helper function to get validation status for a preset
  const getPresetValidation = (preset: typeof sizeList[0]) => {
    if (!animalProfile || preset.name === 'Custom') return 'neutral';
    
    const testInput: EnclosureInput = {
      ...value,
      width: preset.width,
      depth: preset.depth,
      height: preset.height,
      units: preset.units,
    };
    const validation = validateEnclosureSize(testInput, animalProfile);
    
    if (validation.tooSmall) return 'critical';
    if (validation.warnings.length > 0) return 'warning';
    return 'good';
  };

  // Memoize preset categorization - only recalculates when animal or value changes
  const categorizedPresets = useMemo(() => {
    if (!animalProfile) return null;
    return {
      good: sizeList.filter(p => getPresetValidation(p) === 'good'),
      warning: sizeList.filter(p => getPresetValidation(p) === 'warning'),
      critical: sizeList.filter(p => getPresetValidation(p) === 'critical'),
      custom: sizeList.filter(p => p.name === 'Custom')
    };
  }, [animalProfile, value, sizeList]);

  // Memoize which presets to show
  const presetsToShow = useMemo(() => {
    return categorizedPresets && !showAllSizes
      ? [...categorizedPresets.good, ...categorizedPresets.custom]
      : sizeList;
  }, [categorizedPresets, showAllSizes]);

  const hasHiddenSizes = categorizedPresets && 
    (categorizedPresets.warning.length > 0 || categorizedPresets.critical.length > 0);

  const handlePresetChange = (preset: typeof sizeList[0]) => {
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
    // Convert to inches if user is entering metric values
    const valueInInches = isMetric ? cmToInches(num) : num;
    onChange({ ...value, [field]: valueInInches });
  };

  // Format preset button label to show metric when selected
  const getPresetLabel = (preset: typeof sizeList[0]) => {
    if (preset.name === 'Custom') return preset.name;
    
    // Always show the product name (in inches)
    if (!isMetric) return preset.name;
    
    // When metric is selected, show metric dimensions in a smaller font
    const metricW = Math.round(inchesToCm(preset.width));
    const metricD = Math.round(inchesToCm(preset.depth));
    const metricH = Math.round(inchesToCm(preset.height));
    
    return (
      <div className="flex flex-col">
        <span>{preset.name}</span>
        <span className="text-[10px] opacity-75">({metricW}×{metricD}×{metricH} cm)</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 lg:p-6 space-y-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">Enclosure Setup</h2>

      {/* Setup Quality Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          Setup Quality & Budget
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Minimum Tier */}
          <button
            onClick={() => onChange({ ...value, setupTier: 'minimum' })}
            className={`group relative overflow-hidden rounded-xl px-3 py-4 sm:px-4 sm:py-5 text-sm font-medium transition-all duration-200 ${
              value.setupTier === 'minimum'
                ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border-2 border-slate-400 dark:border-slate-500 shadow-lg scale-[1.02]'
                : 'bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:scale-[1.01]'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <CheckCircle className={`w-8 h-8 mb-2 transition-colors ${
                value.setupTier === 'minimum' 
                  ? 'text-slate-600 dark:text-slate-300' 
                  : 'text-slate-400 dark:text-gray-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'
              }`} />
              <div className="font-bold text-gray-900 dark:text-white text-base mb-0.5">Minimum</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Budget-friendly & functional</div>
            </div>
          </button>

          {/* Recommended Tier - Emphasized */}
          <button
            onClick={() => onChange({ ...value, setupTier: 'recommended' })}
            className={`group relative overflow-hidden rounded-xl px-3 py-5 sm:px-4 sm:py-6 text-sm font-medium transition-all duration-200 ${
              value.setupTier === 'recommended'
                ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-900/50 dark:via-yellow-900/50 dark:to-amber-800/50 border-2 border-amber-400 dark:border-amber-500 shadow-xl shadow-amber-200/50 dark:shadow-amber-900/30 scale-105 sm:scale-110 z-10'
                : 'bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 hover:scale-[1.03] sm:hover:scale-[1.08]'
            }`}
          >
            {/* Popular Badge */}
            <div className={`absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold rounded-bl-lg rounded-tr-lg shadow-md transition-opacity ${
              value.setupTier === 'recommended' ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
            }`}>
              POPULAR
            </div>
            <div className="flex flex-col items-center text-center">
              <Star className={`w-10 h-10 mb-2.5 transition-all ${
                value.setupTier === 'recommended' 
                  ? 'text-amber-500 dark:text-amber-400 drop-shadow-md fill-amber-400 dark:fill-amber-500' 
                  : 'text-amber-400 dark:text-amber-600 group-hover:text-amber-500 dark:group-hover:text-amber-500 group-hover:fill-amber-300 dark:group-hover:fill-amber-600'
              }`} />
              <div className="font-bold text-gray-900 dark:text-white text-lg mb-1">Recommended</div>
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Best quality-to-price ratio</div>
            </div>
          </button>

          {/* Ideal Tier */}
          <button
            onClick={() => onChange({ ...value, setupTier: 'ideal' })}
            className={`group relative overflow-hidden rounded-xl px-3 py-4 sm:px-4 sm:py-5 text-sm font-medium transition-all duration-200 ${
              value.setupTier === 'ideal'
                ? 'bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-900/50 border-2 border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 scale-[1.02]'
                : 'bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 hover:scale-[1.01]'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Award className={`w-8 h-8 mb-2 transition-colors ${
                value.setupTier === 'ideal' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-emerald-400 dark:text-emerald-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-500'
              }`} />
              <div className="font-bold text-gray-900 dark:text-white text-base mb-0.5">Ideal</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Top-tier equipment</div>
            </div>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 text-center sm:text-left">
          This determines which equipment options appear in your shopping list
        </p>
      </div>

      {/* Animal Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          Number of Animals
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...value, quantity: Math.max(1, value.quantity - 1) })}
            className="w-12 h-12 lg:w-10 lg:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xl transition-colors flex items-center justify-center"
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
            className="w-20 px-3 py-3 lg:py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-center font-medium text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => onChange({ ...value, quantity: Math.min(20, value.quantity + 1) })}
            className="w-12 h-12 lg:w-10 lg:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xl transition-colors flex items-center justify-center"
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          Enclosure Size
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {presetsToShow.map((preset) => {
            const validationStatus = getPresetValidation(preset);
            const isSelected = usePreset && 
              value.width === preset.width && 
              value.depth === preset.depth &&
              value.height === preset.height;
            
            // Determine button styling based on validation status
            let buttonStyles = '';
            if (isSelected) {
              buttonStyles = 'bg-primary-600 text-white shadow-md';
            } else if (preset.name === 'Custom') {
              buttonStyles = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600';
            } else if (validationStatus === 'good') {
              buttonStyles = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30';
            } else if (validationStatus === 'warning') {
              buttonStyles = 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
            } else if (validationStatus === 'critical') {
              buttonStyles = 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-not-allowed opacity-60';
            } else {
              buttonStyles = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600';
            }
            
            return (
              <button
                key={preset.name}
                onClick={() => validationStatus !== 'critical' && handlePresetChange(preset)}
                disabled={validationStatus === 'critical'}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-all active:scale-95 ${buttonStyles}`}
                title={
                  validationStatus === 'critical' 
                    ? 'Too small for this species' 
                    : validationStatus === 'warning'
                    ? 'Below recommended minimum'
                    : validationStatus === 'good'
                    ? 'Appropriate size for this species'
                    : ''
                }
              >
                {getPresetLabel(preset)}
              </button>
            );
          })}
        </div>
        
        {/* Show More Sizes Button */}
        {hasHiddenSizes && (
          <button
            onClick={() => setShowAllSizes(!showAllSizes)}
            className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium flex items-center gap-1"
          >
            {showAllSizes ? '− Show fewer sizes' : `+ Show ${(categorizedPresets?.warning.length || 0) + (categorizedPresets?.critical.length || 0)} more sizes`}
          </button>
        )}
        
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
                Width ({getLengthUnit(isMetric)})
              </label>
              <input
                type="number"
                value={isMetric && value.width ? Math.round(inchesToCm(value.width)) : value.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                step={isMetric ? '1' : '0.1'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Depth ({getLengthUnit(isMetric)})
              </label>
              <input
                type="number"
                value={isMetric && value.depth ? Math.round(inchesToCm(value.depth)) : value.depth || ''}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                step={isMetric ? '1' : '0.1'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Height ({getLengthUnit(isMetric)})
              </label>
              <input
                type="number"
                value={isMetric && value.height ? Math.round(inchesToCm(value.height)) : value.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                step={isMetric ? '1' : '0.1'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enclosure Type */}
      {animalProfile?.equipmentNeeds?.activity !== 'aquatic' && (
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
            {value.type === 'glass' && (
              <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Best for visibility</span>
            )}
            {value.type === 'pvc' && (
              <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Versatile option</span>
            )}
            {value.type === 'screen' && (
              <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Maximum airflow, needs active humidity control</span>
            )}
          </p>
          
          {/* Enclosure Type Validation Feedback */}
          {typeValidation && !typeValidation.compatible && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-3 rounded-r">
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400"><AlertTriangle className="w-6 h-6" /></span>
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  {typeValidation.warning}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aquatic Species Enclosure Note */}
      {animalProfile?.equipmentNeeds?.activity === 'aquatic' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-700 p-4 rounded-r">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Glass Aquarium Required</p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                Fully aquatic species require water-tight glass aquariums with proper filtration and water quality management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bioactive Setup - Hidden for fully aquatic animals */}
      {animalProfile?.equipmentNeeds?.waterFeature !== 'fully-aquatic' && (
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.bioactive}
            onChange={(e) => {
              onChange({ 
                ...value, 
                bioactive: e.target.checked,
                // When bioactive is checked, always set substrate to bioactive
                // When unchecked, set to soil-based as default
                substratePreference: e.target.checked ? 'bioactive' : 'soil-based'
              });
            }}
            className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-gray-800 dark:text-white">Bioactive Setup</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Includes drainage layer, live plants, and cleanup crew
            </p>
          </div>
        </label>
        
        {/* Bioactive Validation Feedback */}
        {bioactiveValidation && !bioactiveValidation.compatible && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-3 rounded-r">
            <div className="flex items-start gap-2">
              <span className="text-red-500 dark:text-red-400"><AlertTriangle className="w-6 h-6" /></span>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {bioactiveValidation.warning}
              </p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Care Level Preference (for Find Your Animal feature) */}
      {!animalProfile && (
        <>
          {/* Section Header */}
          <div className="col-span-full">
            <div className="border-t-2 border-emerald-300 dark:border-emerald-600 pt-6 mt-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Your Lifestyle & Preferences</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Help us find animals that match your experience and lifestyle</p>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Your Experience Level
            </label>
            <select
              value={value.experienceLevel || 'any'}
              onChange={(e) => onChange({ ...value, experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Level</option>
              <option value="beginner">Beginner - First exotic pet</option>
              <option value="intermediate">Intermediate - Some experience</option>
              <option value="advanced">Advanced - Experienced keeper</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Filter by care difficulty
            </p>
          </div>

          {/* Lifespan Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Lifespan Preference
            </label>
            <select
              value={value.lifespanPreference || 'any'}
              onChange={(e) => onChange({ ...value, lifespanPreference: e.target.value as 'short' | 'medium' | 'long' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Lifespan</option>
              <option value="short">Short (1-5 years)</option>
              <option value="medium">Medium (5-15 years)</option>
              <option value="long">Long (15+ years)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Consider your long-term commitment
            </p>
          </div>

          {/* Handling Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Handling Preference
            </label>
            <select
              value={value.handlingPreference || 'any'}
              onChange={(e) => onChange({ ...value, handlingPreference: e.target.value as 'frequent' | 'occasional' | 'minimal' | 'none' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any</option>
              <option value="frequent">Frequent - Daily interaction</option>
              <option value="occasional">Occasional - Weekly handling</option>
              <option value="minimal">Minimal - Rare handling</option>
              <option value="none">None - Observation only</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How often you want to interact
            </p>
          </div>

          {/* Activity Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Activity Time Preference
            </label>
            <select
              value={value.activityPreference || 'any'}
              onChange={(e) => onChange({ ...value, activityPreference: e.target.value as 'diurnal' | 'nocturnal' | 'crepuscular' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Activity Pattern</option>
              <option value="diurnal">Diurnal - Active during day</option>
              <option value="nocturnal">Nocturnal - Active at night</option>
              <option value="crepuscular">Crepuscular - Active dawn/dusk</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              When you want to see your pet active
            </p>
          </div>

          {/* Noise Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Noise Tolerance
            </label>
            <select
              value={value.noiseTolerance || 'any'}
              onChange={(e) => onChange({ ...value, noiseTolerance: e.target.value as 'quiet' | 'moderate' | 'loud' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Noise Level</option>
              <option value="quiet">Quiet - Silent/minimal sound</option>
              <option value="moderate">Moderate - Some vocalizations</option>
              <option value="loud">Loud - Frequent vocalizations OK</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tolerance for animal vocalizations
            </p>
          </div>

          {/* Food Type Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Food Type Comfort
            </label>
            <select
              value={value.foodTypePreference || 'any'}
              onChange={(e) => onChange({ ...value, foodTypePreference: e.target.value as 'insects' | 'plants' | 'both' | 'rodents' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Food Type</option>
              <option value="insects">Insects Only</option>
              <option value="plants">Plants/Vegetables Only</option>
              <option value="both">Insects & Plants</option>
              <option value="rodents">Rodents OK</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              What you're comfortable feeding
            </p>
          </div>

          {/* Feeding Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Feeding Frequency Preference
            </label>
            <select
              value={value.feedingFrequency || 'any'}
              onChange={(e) => onChange({ ...value, feedingFrequency: e.target.value as 'daily' | 'every-few-days' | 'weekly' | 'bi-weekly' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any Frequency</option>
              <option value="daily">Daily - Every day</option>
              <option value="every-few-days">Every Few Days</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly or less</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How often you want to feed
            </p>
          </div>

          {/* Travel Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Travel Frequency
            </label>
            <select
              value={value.travelFrequency || 'any'}
              onChange={(e) => onChange({ ...value, travelFrequency: e.target.value as 'never' | 'occasionally' | 'frequently' | 'any' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="any">Any</option>
              <option value="never">Never - Always home</option>
              <option value="occasionally">Occasionally - Few trips/year</option>
              <option value="frequently">Frequently - Regular travel</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              How often you're away from home
            </p>
          </div>
        </>
      )}

      {/* Substrate Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Substrate Preference
        </label>
        <select
          value={value.substratePreference || (animalProfile?.equipmentNeeds?.waterFeature === 'fully-aquatic' ? '' : 'soil-based')}
          onChange={(e) => {
            const newSubstrate = e.target.value as SubstrateType;
            onChange({ 
              ...value, 
              substratePreference: newSubstrate,
              // Auto-check bioactive when bioactive substrate is selected, uncheck for anything else
              bioactive: newSubstrate === 'bioactive'
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500"
        >
          {animalProfile?.equipmentNeeds?.waterFeature === 'fully-aquatic' && (
            <option value="">Select substrate (optional)</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('bioactive')) && (
            <option value="bioactive">Bioactive Mix</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('soil')) && (
            <option value="soil-based">Soil-Based</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('paper')) && (
            <option value="paper-based">Paper-Based</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('foam')) && (
            <option value="foam">Foam</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('sand')) && (
            <option value="sand-based">Sand-Based (Desert)</option>
          )}
          {(!animalProfile?.equipmentNeeds?.substrate || animalProfile.equipmentNeeds.substrate.includes('sand-aquatic')) && (
            <option value="sand-aquatic">Fine Aquarium Sand (Aquatic)</option>
          )}
        </select>
      </div>

      {/* Ambient Room Temperature */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-2">
              <Thermometer className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            Ambient Room Temperature
          </label>
          <span 
            className="text-2xl font-bold transition-colors"
            style={{
              color: `rgb(${Math.round(59 + (239 - 59) * ((value.ambientTemp - 60) / 20))}, ${Math.round(130 - 62 * ((value.ambientTemp - 60) / 20))}, ${Math.round(246 - 178 * ((value.ambientTemp - 60) / 20))})`
            }}
          >
            {isMetric ? Math.round(fahrenheitToCelsius(value.ambientTemp)) : value.ambientTemp}{getTempUnit(isMetric)}
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

      {/* Ambient Room Humidity - Hidden for fully aquatic animals */}
      {animalProfile?.equipmentNeeds?.waterFeature !== 'fully-aquatic' && (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-2">
              <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Your room's average humidity level</p>
      </div>
      )}

      {/* Humidity Control Method - Only show if animal needs humidity control */}
      {animalProfile?.equipmentNeeds?.waterFeature !== 'fully-aquatic' && 
       animalProfile?.careTargets?.humidity && 
       value.ambientHumidity < animalProfile.careTargets.humidity.day.max && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Humidity Control Method
        </label>
        <select
          value={value.humidityControl || 'manual'}
          onChange={(e) => onChange({ ...value, humidityControl: e.target.value as HumidityControl })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500"
        >
          <option value="none">None (Dry Species)</option>
          <option value="manual">Manual Misting</option>
          <option value="misting-system">Automatic Misting System</option>
          <option value="humidifier">Room Humidifier</option>
          <option value="fogger">Fogger</option>
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          How you plan to maintain humidity levels
        </p>
      </div>
      )}

      {/* Plant Type Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Plant Preference
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['live', 'artificial']).map((plant) => (
            <button
              key={plant}
              onClick={() => onChange({ ...value, plantPreference: plant as 'live' | 'artificial' })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.plantPreference === plant
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {plant === 'live' ? 'Live' : 'Artificial'}
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
          {(['none', 'prebuilt', 'custom'] as BackgroundType[]).map((bg) => (
            <button
              key={bg}
              onClick={() => onChange({ ...value, backgroundType: bg })}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                value.backgroundType === bg
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {bg === 'none' ? 'None' : bg === 'prebuilt' ? 'Prebuilt' : 'Custom'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Adds depth and climbing surfaces (optional)
        </p>
      </div>

      {/* Door Orientation - Hidden for fully aquatic species */}
      {animalProfile?.equipmentNeeds?.waterFeature !== 'fully-aquatic' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Enclosure Access
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...value, doorOrientation: 'front' })}
              className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                value.doorOrientation === 'front'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Front Opening
            </button>
            <button
              onClick={() => onChange({ ...value, doorOrientation: 'top' })}
              className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                value.doorOrientation === 'top'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Top Opening
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {value.doorOrientation === 'front' ? 'Easier access, less stress for animal' : 'More secure, better for climbers'}
          </p>
        </div>
      )}

      {/* Automated Lighting */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.automatedLighting}
            onChange={(e) => onChange({ ...value, automatedLighting: e.target.checked })}
            className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-gray-800 dark:text-white">Automated Lighting Schedule</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Include timer for automated day/night cycles (type depends on setup tier)
            </p>
          </div>
        </label>
      </div>

      {/* Number of Hides */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Number of Hides
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...value, numberOfHides: Math.max(1, value.numberOfHides - 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Decrease hides"
          >
            −
          </button>
          <input
            type="number"
            value={value.numberOfHides}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 1;
              onChange({ ...value, numberOfHides: Math.max(1, Math.min(6, num)) });
            }}
            min="1"
            max="6"
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => onChange({ ...value, numberOfHides: Math.min(6, value.numberOfHides + 1) })}
            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-colors flex items-center justify-center"
            aria-label="Increase hides"
          >
            +
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Shelters for security (1-6)
          </span>
        </div>
      </div>

      {/* Hide Style Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Hide Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...value, hideStylePreference: 'natural' })}
            className={`px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              value.hideStylePreference === 'natural'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Natural
          </button>
          <button
            onClick={() => onChange({ ...value, hideStylePreference: 'commercial' })}
            className={`px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              value.hideStylePreference === 'commercial'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Commercial
          </button>
          <button
            onClick={() => onChange({ ...value, hideStylePreference: 'both' })}
            className={`px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              value.hideStylePreference === 'both'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Both
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {value.hideStylePreference === 'natural' && 'Cork bark, wood, natural materials'}
          {value.hideStylePreference === 'commercial' && 'Plastic caves, manufactured hides'}
          {value.hideStylePreference === 'both' && 'Mix of natural and commercial options'}
        </p>
      </div>

      {/* Number of Ledges (for vertical/arboreal species) OR Climbing Areas (for horizontal/terrestrial species) */}
      {animalProfile?.layoutRules.preferVertical ? (
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
      ) : null}
    </div>
  );
}
