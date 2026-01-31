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
    
    // Filter by preferred care level if specified
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

  // 2. Space requirements
  if (profile.minEnclosureSize) {
    const tooSmall = 
      input.width < profile.minEnclosureSize.width ||
      input.depth < profile.minEnclosureSize.depth ||
      input.height < profile.minEnclosureSize.height;

    if (tooSmall) {
      score -= 30;
      warnings.push(
        `Space may be tight (minimum recommended: ${profile.minEnclosureSize.width}" × ${profile.minEnclosureSize.depth}" × ${profile.minEnclosureSize.height}")`
      );
    } else {
      reasons.push('Fits minimum space requirements');
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
