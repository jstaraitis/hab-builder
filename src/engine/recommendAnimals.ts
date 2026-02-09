import type { AnimalProfile, EnclosureInput } from './types';
import { animalProfiles } from '../data/animals';

export interface AnimalRecommendation {
  animalId: string;
  profile: AnimalProfile;
  compatibilityScore: number; // 0-100
  reasons: string[];
  warnings: string[];
}

/**
 * Recommend animals based on enclosure specifications
 */
export function recommendAnimals(input: EnclosureInput): AnimalRecommendation[] {
  const recommendations: AnimalRecommendation[] = [];

  for (const [animalId, profile] of Object.entries(animalProfiles)) {
    // HARD FILTERS - Skip completely incompatible animals
    
    // Fully aquatic species require glass aquariums
    if (profile.waterFeature === 'fully-aquatic' && input.type !== 'glass') {
      continue; // Skip this animal entirely
    }
    
    // Screen enclosures incompatible with amphibians (cannot maintain humidity)
    if (input.type === 'screen' && profile.equipmentNeeds?.animalType === 'amphibian') {
      continue; // Skip this animal entirely
    }
    
    // Filter by experience level
    if (input.experienceLevel && input.experienceLevel !== 'any') {
      const allowedLevels: Record<string, string[]> = {
        beginner: ['beginner'],
        intermediate: ['beginner', 'intermediate'],
        advanced: ['beginner', 'intermediate', 'advanced'],
      };
      
      const allowed = allowedLevels[input.experienceLevel] || [];
      
      // Skip animals not in the allowed list
      if (!allowed.includes(profile.careLevel)) {
        continue;
      }
    }
    
    // Legacy filter support (careLevelPreference is deprecated in favor of experienceLevel)
    if (input.careLevelPreference && input.careLevelPreference !== 'any') {
      const allowedLevels: Record<string, string[]> = {
        beginner: ['beginner'],
        intermediate: ['beginner', 'intermediate'],
        advanced: ['beginner', 'intermediate', 'advanced'],
      };
      
      const allowed = allowedLevels[input.careLevelPreference] || [];
      
      // Skip animals not in the allowed list
      if (!allowed.includes(profile.careLevel)) {
        continue;
      }
    }

    // Filter by lifespan preference
    if (input.lifespanPreference && input.lifespanPreference !== 'any' && profile.lifestyle?.lifespan) {
      if (input.lifespanPreference !== profile.lifestyle.lifespan) {
        continue;
      }
    }

    // Filter by handling preference
    if (input.handlingPreference && input.handlingPreference !== 'any' && profile.lifestyle?.handling) {
      // User wants frequent handling, but animal needs minimal/none
      if (input.handlingPreference === 'frequent' && (profile.lifestyle.handling === 'minimal' || profile.lifestyle.handling === 'none')) {
        continue;
      }
      // User wants no handling, but animal needs frequent/occasional
      if (input.handlingPreference === 'none' && (profile.lifestyle.handling === 'frequent' || profile.lifestyle.handling === 'occasional')) {
        continue;
      }
      // Exact match or user accepts more handling than animal needs
      const handlingOrder = ['none', 'minimal', 'occasional', 'frequent'];
      const userIdx = handlingOrder.indexOf(input.handlingPreference);
      const animalIdx = handlingOrder.indexOf(profile.lifestyle.handling);
      if (userIdx < animalIdx) {
        continue; // User wants less handling than animal tolerates
      }
    }

    // Filter by activity preference (use existing activityPattern field)
    if (input.activityPreference && input.activityPreference !== 'any' && profile.activityPattern) {
      const normalizedActivity = profile.activityPattern.toLowerCase();
      if (input.activityPreference !== normalizedActivity && profile.activityPattern !== 'Varied') {
        continue;
      }
    }

    // Filter by noise tolerance
    if (input.noiseTolerance && input.noiseTolerance !== 'any' && profile.lifestyle?.noiseLevel) {
      const noiseOrder = ['quiet', 'moderate', 'loud'];
      const userIdx = noiseOrder.indexOf(input.noiseTolerance);
      const animalIdx = noiseOrder.indexOf(profile.lifestyle.noiseLevel);
      if (userIdx < animalIdx) {
        continue; // Animal is too loud for user
      }
    }

    // Filter by food type preference (use existing dietType field)
    if (input.foodTypePreference && input.foodTypePreference !== 'any' && profile.dietType) {
      // Map dietType to food preference
      const dietTypeMap: Record<string, string[]> = {
        'Insectivore': ['insects', 'both'],
        'Herbivore': ['plants', 'both'],
        'Omnivore': ['insects', 'plants', 'both'],
        'Carnivore': ['rodents']
      };
      
      const compatiblePreferences = dietTypeMap[profile.dietType] || [];
      if (!compatiblePreferences.includes(input.foodTypePreference)) {
        continue;
      }
    }

    // Filter by feeding frequency
    if (input.feedingFrequency && input.feedingFrequency !== 'any' && profile.lifestyle?.feedingFrequency) {
      const freqOrder = ['bi-weekly', 'weekly', 'every-few-days', 'daily'];
      const userIdx = freqOrder.indexOf(input.feedingFrequency);
      const animalIdx = freqOrder.indexOf(profile.lifestyle.feedingFrequency);
      if (userIdx < animalIdx) {
        continue; // Animal needs more frequent feeding than user wants
      }
    }

    // Filter by travel frequency
    if (input.travelFrequency && input.travelFrequency !== 'any' && profile.lifestyle?.travelCompatibility) {
      // User travels frequently but animal has low travel compatibility
      if (input.travelFrequency === 'frequently' && profile.lifestyle.travelCompatibility === 'low') {
        continue;
      }
      // User never travels - all animals compatible
      // User occasionally travels - medium and high compatibility OK
      if (input.travelFrequency === 'occasionally' && profile.lifestyle.travelCompatibility === 'low') {
        continue;
      }
    }

    const { score, reasons, warnings } = evaluateCompatibility(
      profile,
      input
    );

    recommendations.push({
      animalId,
      profile,
      compatibilityScore: score,
      reasons,
      warnings,
    });
  }

  // Sort by compatibility score (highest first)
  return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

interface CompatibilityResult {
  score: number;
  reasons: string[];
  warnings: string[];
}

function evaluateCompatibility(
  profile: AnimalProfile,
  input: EnclosureInput
): CompatibilityResult {
  let score = 100;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Enclosure type compatibility
  // Fully aquatic species REQUIRE aquariums (glass with water setup)
  if (profile.waterFeature === 'fully-aquatic' && input.type !== 'glass') {
    score = 0; // Complete incompatibility
    warnings.push(
      `${profile.commonName} is fully aquatic and requires an aquarium (glass tank with water). ${input.type} enclosures are not suitable.`
    );
    return { score, reasons, warnings }; // Exit early - no point evaluating further
  }
  
  // Screen enclosures cannot maintain humidity for amphibians
  if (input.type === 'screen' && profile.equipmentNeeds?.animalType === 'amphibian') {
    score = 0; // Complete incompatibility
    warnings.push(
      `Screen enclosures cannot maintain the high humidity required for ${profile.commonName} (amphibian). Use glass or PVC enclosures instead.`
    );
    return { score, reasons, warnings }; // Exit early
  }
  
  // Screen enclosures lose humidity too quickly for most high-humidity species
  if (input.type === 'screen' && profile.careTargets?.humidity?.day?.min > 60) {
    score -= 50; // Major penalty but not complete elimination
    warnings.push(
      `Screen enclosures lose moisture rapidly and may struggle to maintain ${profile.careTargets.humidity.day.min}%+ humidity for ${profile.commonName}. Glass or PVC recommended.`
    );
  } else {
    reasons.push(`Compatible with ${input.type} enclosures`);
  }

  // 2. Space requirements (HARD FILTER + WEIGHTED PENALTY)
  if (profile.minEnclosureSize) {
    // Calculate volumes to get true size comparison
    const requiredVolume = profile.minEnclosureSize.width * 
                          profile.minEnclosureSize.depth * 
                          profile.minEnclosureSize.height;
    const providedVolume = input.width * input.depth * input.height;
    const volumeRatio = providedVolume / requiredVolume;

    // HARD FILTER: <40% of required volume = completely unsuitable
    if (volumeRatio < 0.4) {
      score = 0;
      warnings.push(
        `Your ${input.width}×${input.depth}×${input.height}" enclosure is only ${Math.round(volumeRatio * 100)}% of the minimum size needed. ` +
        `${profile.commonName} requires at least ${profile.minEnclosureSize.width}×${profile.minEnclosureSize.depth}×${profile.minEnclosureSize.height}" (${Math.round(requiredVolume)} cubic inches).`
      );
      return { score, reasons, warnings }; // Exit early - too small to consider
    }

    // WEIGHTED PENALTY: 40-99% of required space = graduated penalty
    if (volumeRatio < 1.0) {
      // Graduated penalty scale based on volume deficit
      let penalty = 10;
      if (volumeRatio <= 0.40) penalty = 70;      // 40% = -70 points (barely passes hard filter)
      else if (volumeRatio <= 0.60) penalty = 50; // 60% = -50 points (significantly undersized)
      else if (volumeRatio <= 0.75) penalty = 35; // 75% = -35 points (noticeably undersized)
      else if (volumeRatio <= 0.85) penalty = 20; // 85% = -20 points (slightly undersized)
      else if (volumeRatio <= 0.95) penalty = 10; // 95% = -10 points (barely too small)
      
      score -= penalty;
      warnings.push(
        `Enclosure is ${Math.round(volumeRatio * 100)}% of the recommended minimum size. ` +
        `${profile.commonName} thrives best in ${profile.minEnclosureSize.width}×${profile.minEnclosureSize.depth}×${profile.minEnclosureSize.height}" or larger.`
      );
    } else {
      // Meets or exceeds minimum space - give appropriate reason
      if (volumeRatio >= 1.5) {
        reasons.push('Generous space - plenty of room for enrichment');
      } else if (volumeRatio >= 1.2) {
        reasons.push('Great space - exceeds minimum requirements');
      } else {
        reasons.push('Meets minimum space requirements');
      }
    }
  }

  // 3. Humidity requirements
  if (profile.careTargets?.humidity) {
    const humidity = profile.careTargets.humidity;
    const minHumidity = typeof humidity.day === 'object' ? humidity.day.min : humidity.day || 0;

    // Check if user can achieve required humidity
    if ((input.humidityControl === 'none' || input.humidityControl === 'manual') && minHumidity > 60) {
      score -= 20;
      warnings.push(`${profile.commonName} needs ${minHumidity}%+ humidity (you may need automated humidity control)`);
    } else if (input.humidityControl && input.humidityControl !== 'none' && minHumidity > 40) {
      reasons.push(`Your ${input.humidityControl} supports ${profile.commonName}'s humidity needs`);
    }
    // Note: Screen enclosure humidity penalty already handled in section 1
  }

  // 4. Temperature requirements
  if (profile.careTargets?.temperature) {
    const temp = profile.careTargets.temperature;
    // Get the minimum and maximum required temperatures
    const minTemp = temp.coolSide?.min || temp.warmSide?.min || 70;
    const maxTemp = temp.coolSide?.max || temp.warmSide?.max || 80;

    // Cold-water species (like axolotls) - check if ambient is above their max tolerance
    if (input.ambientTemp > maxTemp + 2) {
      score -= 25;
      warnings.push(`${profile.commonName} needs temperatures below ${maxTemp}°F - your ${input.ambientTemp}°F ambient requires cooling equipment (chiller or AC)`);
    } 
    // Warm-loving species - check if ambient is below their minimum
    else if (input.ambientTemp < minTemp - 5) {
      score -= 20;
      warnings.push(`${profile.commonName} needs temps ${minTemp}°F+ - your ${input.ambientTemp}°F ambient requires significant heating`);
    } 
    // Temperature is within acceptable range (with some buffer)
    else {
      reasons.push('Temperature requirements achievable in your environment');
    }
  }

  // 5. Bioactive compatibility
  if (!profile.bioactiveCompatible && input.bioactive) {
    score -= 15;
    warnings.push('Bioactive setups not recommended for this species');
  } else if (profile.bioactiveCompatible && input.bioactive) {
    reasons.push('Excellent bioactive setup candidate');
  }

  // 6. Quantity
  if (profile.quantityRules) {
    if (input.quantity > 1 && profile.quantityRules.maxRecommended && input.quantity > profile.quantityRules.maxRecommended) {
      score -= 30;
      warnings.push(
        `Recommended max ${profile.quantityRules.maxRecommended} animal(s) in this size (you want ${input.quantity})`
      );
    } else if (input.quantity === 1) {
      reasons.push('Appropriate quantity for enclosure size');
    }
  }

  // 7. Beginner-friendly
  if (profile.careLevel === 'beginner') {
    reasons.push('Great for beginners');
  } else if (profile.careLevel === 'advanced') {
    warnings.push('This species requires experience');
  }

  // Care level preference filter
  if (input.careLevelPreference && input.careLevelPreference !== 'any') {
    if (profile.careLevel === input.careLevelPreference) {
      score += 10;
      reasons.push(`Matches your ${input.careLevelPreference} care level preference`);
    } else if (
      input.careLevelPreference === 'beginner' &&
      (profile.careLevel === 'intermediate' || profile.careLevel === 'advanced')
    ) {
      score -= 15;
      warnings.push(`This is a ${profile.careLevel}-level animal (you selected beginner)`);
    }
  } else {
    // Bonus for beginner-friendly animals when no preference specified
    if (profile.careLevel === 'beginner') {
      score += 5;
    } else if (profile.careLevel === 'advanced') {
      score -= 5;
    }
  }

  // Ensure score stays in bounds
  score = Math.max(0, Math.min(100, score));

  return { score, reasons, warnings };
}

/**
 * Categorize recommendations by compatibility
 */
export function categorizeRecommendations(
  recommendations: AnimalRecommendation[]
): {
  perfectMatches: AnimalRecommendation[];
  goodFits: AnimalRecommendation[];
  possible: AnimalRecommendation[];
} {
  return {
    perfectMatches: recommendations.filter((r) => r.compatibilityScore >= 80),
    goodFits: recommendations.filter((r) => r.compatibilityScore >= 60 && r.compatibilityScore < 80),
    possible: recommendations.filter((r) => r.compatibilityScore < 60),
  };
}
