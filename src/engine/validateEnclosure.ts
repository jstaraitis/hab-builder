import type { EnclosureInput, AnimalProfile } from './types';

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

  // Convert to common units for comparison if needed
  let userWidth = input.width;
  let userDepth = input.depth;
  let userHeight = input.height;
  let minWidth = profile.minEnclosureSize.width;
  let minDepth = profile.minEnclosureSize.depth;
  let minHeight = profile.minEnclosureSize.height;

  // Normalize to inches for comparison
  if (input.units === 'cm') {
    userWidth = input.width / 2.54;
    userDepth = input.depth / 2.54;
    userHeight = input.height / 2.54;
  }
  if (profile.minEnclosureSize.units === 'cm') {
    minWidth = profile.minEnclosureSize.width / 2.54;
    minDepth = profile.minEnclosureSize.depth / 2.54;
    minHeight = profile.minEnclosureSize.height / 2.54;
  }

  let tooSmall = false;

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

  // Tall enclosure humidity warning
  if (userHeight > 36) {
    warnings.push(
      `Tall enclosure (${input.height}") will lose humidity quickly. Plan extra misting or use a humidifier.`
    );
  }

  // Very small enclosure warning
  const volumeInches = userWidth * userDepth * userHeight;
  if (volumeInches < 5832) {
    // Less than 18x18x18
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
  // Most tree frogs don't do well in screen enclosures
  if (input.type === 'screen' && profile.layoutRules.preferVertical) {
    return {
      compatible: false,
      warning: `Screen enclosures are not recommended for ${profile.commonName}. They lose humidity too quickly and frogs can damage their noses on the screen. Use glass or PVC instead.`,
    };
  }

  return { compatible: true };
}
