import type { EnclosureInput, AnimalProfile } from './types';
import { normalizeEnclosureInput, normalizeMinimumSize, calculateGallons } from './dimensionUtils';

export interface SizeValidation {
  isValid: boolean;
  tooSmall: boolean;
  warnings: string[];
  suggestions: {
    minWidth?: number;
    minDepth?: number;
    minHeight?: number;
    units: 'in' | 'cm';
  };
}

/**
 * Validates enclosure dimensions against animal requirements
 * Returns feedback on whether size is adequate and suggestions for upgrades
 */
export function validateEnclosureSize(
  input: EnclosureInput,
  profile: AnimalProfile
): SizeValidation {
  const warnings: string[] = [];
  const suggestions = {
    minWidth: profile.minEnclosureSize.width,
    minDepth: profile.minEnclosureSize.depth,
    minHeight: profile.minEnclosureSize.height,
    units: profile.minEnclosureSize.units as 'in' | 'cm',
  };

  // Normalize dimensions to inches for comparison
  const userDims = normalizeEnclosureInput(input);
  const minDims = normalizeMinimumSize(profile);
  
  const { width: userWidth, depth: userDepth, height: userHeight } = userDims;
  const { width: minWidth, depth: minDepth, height: minHeight } = minDims;

  let tooSmall = false;

  // Calculate required gallons based on quantity if quantityRules exist
  if (profile.quantityRules && input.quantity > 0) {
    const requiredGallons = profile.quantityRules.baseGallons + 
      (input.quantity - 1) * profile.quantityRules.additionalGallons;
    
    // Calculate current enclosure volume in gallons
    const currentGallons = calculateGallons(userDims);

    if (currentGallons < requiredGallons) {
      warnings.push(
        `For ${input.quantity} animal${input.quantity > 1 ? 's' : ''}, you need at least ${requiredGallons} gallons (currently ~${Math.round(currentGallons)} gallons). ${profile.quantityRules.description}`
      );
      tooSmall = true;
    }

    if (input.quantity > profile.quantityRules.maxRecommended) {
      warnings.push(
        `Warning: ${input.quantity} animals exceeds the recommended maximum of ${profile.quantityRules.maxRecommended} for this species. Overcrowding can lead to stress, competition, and health issues.`
      );
    }
  }

  if (userWidth < minWidth) {
    warnings.push(
      `Width is too small (${input.width}" vs required ${profile.minEnclosureSize.width}"). This limits horizontal movement.`
    );
    tooSmall = true;
  }

  if (userDepth < minDepth) {
    warnings.push(
      `Depth is too small (${input.depth}" vs required ${profile.minEnclosureSize.depth}"). Front-to-back space is critical for frogs.`
    );
    tooSmall = true;
  }

  if (userHeight < minHeight) {
    warnings.push(
      `Height is too small (${input.height}" vs required ${profile.minEnclosureSize.height}"). Vertical climbing space is essential.`
    );
    tooSmall = true;
  }

  // Additional checks for arboreal species
  if (profile.layoutRules.preferVertical && userHeight < userWidth) {
    warnings.push(
      `For ${profile.commonName}, height should exceed width for proper vertical space (currently ${input.height}" H vs ${input.width}" W).`
    );
  }

  // Tall enclosure humidity warning (only for species that need high humidity)
  if (userHeight > 36 && profile.careTargets.humidity.day.min > 60) {
    warnings.push(
      `Tall enclosure (${input.height}") may lose humidity quickly. Plan extra misting or use a humidifier to maintain ${profile.careTargets.humidity.min}%+ humidity.`
    );
  }

  // Very small enclosure warning - only if it's larger than minimum but still quite small
  const volumeInches = userWidth * userDepth * userHeight;
  const minVolumeInches = minWidth * minDepth * minHeight;
  
  // Only warn if enclosure is valid (meets minimum), is larger than the minimum, but smaller than 18x18x18
  if (!tooSmall && volumeInches < 5832 && volumeInches > minVolumeInches * 1.1) {
    // Less than 18x18x18 but more than 10% larger than minimum
    warnings.push(
      `Enclosure is very small. Consider upgrading to provide better environmental stability and enrichment.`
    );
  }

  return {
    isValid: !tooSmall,
    tooSmall,
    warnings,
    suggestions,
  };
}

/**
 * Check compatibility between enclosure type and animal requirements
 */
export function validateEnclosureType(
  input: EnclosureInput,
  profile: AnimalProfile
): { compatible: boolean; warning?: string } {
  // Amphibians require high humidity - screen enclosures are incompatible
  if (input.type === 'screen' && profile.equipmentNeeds?.animalType === 'amphibian') {
    return {
      compatible: false,
      warning: `Screen enclosures are INCOMPATIBLE with ${profile.commonName}. They lose moisture too rapidly to maintain the required ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}% humidity. Use glass or PVC enclosures with partial ventilation.`,
    };
  }
  
  // Most tree frogs don't do well in screen enclosures
  if (input.type === 'screen' && profile.layoutRules.preferVertical) {
    return {
      compatible: false,
      warning: `Screen enclosures are not recommended for ${profile.commonName}. They lose humidity too quickly and frogs can damage their noses on the screen. Use glass or PVC instead.`,
    };
  }

  return { compatible: true };
}

/**
 * Check if bioactive setup is compatible with the selected animal
 */
export function validateBioactive(
  input: EnclosureInput,
  profile: AnimalProfile
): { compatible: boolean; warning?: string } {
  // Check if bioactive is selected but animal doesn't support it
  if (input.bioactive && !profile.bioactiveCompatible) {
    return {
      compatible: false,
      warning: `Bioactive setups are NOT RECOMMENDED for ${profile.commonName}. This species requires different substrate and maintenance approaches than traditional bioactive systems.`,
    };
  }

  return { compatible: true };
}
