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
  reasons.push(`Compatible with ${input.type} enclosures`);

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
    if (input.humidityControl === 'manual' && minHumidity > 60) {
      score -= 20;
      warnings.push(`${profile.commonName} needs ${minHumidity}%+ humidity (you selected no humidity control)`);
    } else if (input.humidityControl && minHumidity > 40) {
      reasons.push(`Your humidity setup supports ${profile.commonName}'s needs`);
    }

    // Check if enclosure type supports humidity
    if (input.type === 'screen' && minHumidity > 50) {
      score -= 15;
      warnings.push('Screen enclosures struggle to maintain the humidity this species needs');
    }
  }

  // 4. Temperature requirements
  if (profile.careTargets?.temperature) {
    const temp = profile.careTargets.temperature;
    const minTemp = temp.min;

    // Axolotl special case - needs chiller
    if (minTemp < 70 && input.ambientTemp > 75) {
      score -= 25;
      warnings.push(`${profile.commonName} needs cold water (60-68°F) - your ambient is too warm without a chiller`);
    } else if (minTemp >= 75 && input.ambientTemp < 65) {
      score -= 20;
      warnings.push(`${profile.commonName} needs warm temps (${minTemp}°F+) - you may struggle without heat`);
    } else {
      reasons.push('Temperature requirements are achievable');
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
  if (profile.quantityRules && input.quantity > 1) {
    if (profile.quantityRules.maxRecommended && input.quantity > profile.quantityRules.maxRecommended) {
      score -= 30;
      warnings.push(
        `Can only house ${profile.quantityRules.maxRecommended} in this size (you want ${input.quantity})`
      );
    } else if (input.quantity === 1) {
      reasons.push('Single animal - compatible');
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
