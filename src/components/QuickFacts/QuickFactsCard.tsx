import React from 'react';
import { Ruler, Clock, Moon, Droplets, Thermometer, Sun, Bug, Beef, Leaf } from 'lucide-react';
import { AnimalProfile } from '../../engine/types';

interface QuickFactsCardProps {
  profile: AnimalProfile;
}

interface QuickFact {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}

export const QuickFactsCard: React.FC<QuickFactsCardProps> = ({ profile }) => {
  // Calculate gallons from dimensions
  const gallons = Math.round(
    (profile.minEnclosureSize.width * profile.minEnclosureSize.depth * profile.minEnclosureSize.height) / 231
  );

  // Determine activity pattern from notes/context (fallback logic)
  // Determine activity pattern from profile field or fallback to notes
  const getActivityPattern = (): string => {
    // Priority 1: Use explicit activityPattern field if available
    if (profile.activityPattern) {
      return profile.activityPattern;
    }
    
    // Priority 2: Fallback to detecting from notes
    const notesText = profile.notes?.join(' ').toLowerCase() || '';
    if (notesText.includes('nocturnal')) return 'Nocturnal';
    if (notesText.includes('diurnal')) return 'Diurnal';
    if (notesText.includes('crepuscular')) return 'Crepuscular';
    return 'Varied';
  };

  // Get activity icon based on pattern
  const getActivityIcon = (): React.ReactNode => {
    const pattern = getActivityPattern();
    if (pattern === 'Diurnal') {
      return <Sun className="w-6 h-6" />;
    }
    if (pattern === 'Crepuscular') {
      return (
        <div className="flex items-center gap-0.5">
          <Sun className="w-5 h-5" />
          <Moon className="w-5 h-5" />
        </div>
      );
    }
    // Nocturnal or other patterns
    return <Moon className="w-6 h-6" />;
  };

  // Get diet type from profile or fallback to detection
  const getDietType = (): string => {
    // Use explicit dietType if provided
    if (profile.dietType) {
      return profile.dietType;
    }
    
    // Fallback: detect from text (for animals without dietType set)
    const notesText = profile.notes?.join(' ').toLowerCase() || '';
    const feedingText = profile.careGuidance?.feedingRequirements?.join(' ').toLowerCase() || '';
    const allText = `${notesText} ${feedingText}`;
    
    if (allText.includes('insectivore')) return 'Insectivore';
    if (allText.includes('omnivore')) return 'Omnivore';
    if (allText.includes('herbivore')) return 'Herbivore';
    if (allText.includes('carnivore')) return 'Carnivore';
    
    const hasPlantFood = allText.includes('fruit') || allText.includes('vegetable') || 
                         allText.includes('greens') || allText.includes('lettuce');
    const hasInsects = allText.includes('cricket') || allText.includes('dubia') || 
                      allText.includes('roach') || allText.includes('mealworm') ||
                      allText.includes('insect') || allText.includes('feeder');
    
    if (hasPlantFood && hasInsects) return 'Omnivore';
    if (hasInsects) return 'Insectivore';
    if (hasPlantFood) return 'Herbivore';
    
    return 'Carnivore';
  };

  // Get diet icon based on type
  const getDietIcon = (): React.ReactNode => {
    const dietType = getDietType();
    switch (dietType) {
      case 'Carnivore':
        return <Beef className="w-6 h-6" />;
      case 'Insectivore':
        return <Bug className="w-6 h-6" />;
      case 'Omnivore':
        return (
          <div className="flex items-center gap-0.5">
            <Beef className="w-5 h-5" />
            <Leaf className="w-5 h-5" />
          </div>
        );
      case 'Herbivore':
        return <Leaf className="w-6 h-6" />;
      default:
        return <Beef className="w-6 h-6" />;
    }
  };

  // Check if species is fully aquatic (humidity always 100%)
  const isAquatic = profile.careTargets.humidity.day.min === 100 && 
                    profile.careTargets.humidity.day.max === 100;

  // Get temperature info as a single consolidated card
  const getTemperatureCard = (): QuickFact => {
    const parts: string[] = [];
    
    if (profile.careTargets.temperature.thermalGradient) {
      // Show cool and warm sides
      const coolMin = profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min;
      const coolMax = profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max;
      const warmMin = profile.careTargets.temperature.warmSide?.min ?? profile.careTargets.temperature.min;
      const warmMax = profile.careTargets.temperature.warmSide?.max ?? profile.careTargets.temperature.max;
      parts.push(`Cool: ${coolMin}-${coolMax}°F`);
      parts.push(`Warm: ${warmMin}-${warmMax}°F`);
    } else {
      // No gradient - show single temperature
      const coolMin = profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min;
      const coolMax = profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max;
      parts.push(`${coolMin}-${coolMax}°F`);
    }
    
    // Add basking if present
    const basking = profile.careTargets.temperature.basking;
    if (basking !== null && basking !== undefined) {
      const baskingTemp = typeof basking === 'number' 
        ? `${basking}°F` 
        : `${basking.min}-${basking.max}°F`;
      parts.push(`Basking: ${baskingTemp}`);
    }
    
    // For gradient species, show "Gradient" as value and full range as description
    if (profile.careTargets.temperature.thermalGradient) {
      const minTemp = profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min;
      let maxTemp = profile.careTargets.temperature.warmSide?.max ?? profile.careTargets.temperature.max;
      
      // Check if basking temp is higher
      if (basking && typeof basking === 'object' && basking.max > maxTemp) {
        maxTemp = basking.max;
      } else if (basking && typeof basking === 'number' && basking > maxTemp) {
        maxTemp = basking;
      }
      
      return {
        icon: <Thermometer className="w-6 h-6" />,
        label: 'Temperature',
        value: 'Gradient',
        description: `${minTemp}-${maxTemp}°F`
      };
    } else {
      return {
        icon: <Thermometer className="w-6 h-6" />,
        label: 'Temperature',
        value: parts.join(' • '),
        description: undefined
      };
    }
  };

  const temperatureCard = getTemperatureCard();

  // Extract quick facts from profile
  const facts: QuickFact[] = [
    {
      icon: <Ruler className="w-6 h-6" />,
      label: 'Minimum Size',
      value: `${profile.minEnclosureSize.width}×${profile.minEnclosureSize.depth}×${profile.minEnclosureSize.height}"`,
      description: `${gallons} gallons`
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Lifespan',
      value: profile.lifespan || '10-20 years',
      description: undefined
    },
    {
      icon: getActivityIcon(),
      label: 'Activity',
      value: getActivityPattern(),
      description: ''
    },
    temperatureCard,
    {
      icon: <Droplets className="w-6 h-6" />,
      label: 'Humidity',
      value: isAquatic
        ? 'N/A - Aquatic'
        : `${profile.careTargets.humidity.day.min}-${profile.careTargets.humidity.day.max}%`,
      description: isAquatic
        ? 'Fully aquatic species'
        : profile.careTargets.humidity.night.min !== profile.careTargets.humidity.day.min 
          ? `Night: ${profile.careTargets.humidity.night.min}-${profile.careTargets.humidity.night.max}%` 
          : undefined
    },
    {
      icon: <Sun className="w-6 h-6" />,
      label: 'UVB',
      value: profile.careTargets.lighting.uvbRequired 
        ? 'Required' 
        : profile.careTargets.lighting.uvbStrength 
          ? 'Recommended' 
          : 'Optional',
      description: profile.careTargets.lighting.uvbStrength 
        ? `${profile.careTargets.lighting.uvbStrength} bulb` 
        : undefined
    },
    {
      icon: getDietIcon(),
      label: 'Diet',
      value: getDietType(),
      description: undefined
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      label: 'Bioactive',
      value: profile.bioactiveCompatible ? 'Compatible' : 'Challenging',
      description: undefined
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-3 sm:p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <Ruler className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Quick Facts
        </h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="group relative flex flex-col items-center text-center p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="mb-2 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
              {fact.icon}
            </div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {fact.label}
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {fact.value}
            </div>
            {fact.description && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {fact.description}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-yellow-700 dark:text-yellow-400">Pro Tip:</strong> These are baseline requirements. Larger enclosures are always better for your animal's health and happiness!
          </p>
        </div>
      </div>
    </div>
  );
};
