import type { ShoppingItem, EquipmentConfig, AnimalProfile, EnclosureInput } from '../types';
import equipmentCatalog from '../../data/equipment';

// Type-safe catalog access
export const catalog = equipmentCatalog as Record<string, EquipmentConfig>;

/**
 * Helper to create a shopping item from catalog config
 */
export function createShoppingItem(
  id: string,
  config: EquipmentConfig,
  quantity: number | string,
  sizing: string,
  overrides?: Partial<ShoppingItem>
): ShoppingItem {
  return {
    id,
    category: config.category,
    name: config.name,
    quantity,
    sizing,
    importance: config.importance,
    setupTierOptions: config.tiers,
    ...(config.notes && { notes: config.notes }),
    ...(config.incompatibleAnimals && { incompatibleAnimals: config.incompatibleAnimals }),
    ...(config.isRecurring && { isRecurring: config.isRecurring }),
    ...(config.recurringInterval && { recurringInterval: config.recurringInterval }),
    ...overrides,
  };
}

/**
 * Helper to get equipment from catalog safely
 */
export function getEquipment(id: string): EquipmentConfig | null {
  return catalog[id] || null;
}

/**
 * Calculate enclosure volume in cubic feet
 */
export function calculateVolume(dims: { width: number; depth: number; height: number }): number {
  return (dims.width * dims.depth * dims.height) / 1728;
}

/**
 * Calculate substrate/drainage quantities
 */
export function calculateSubstrateQuarts(
  dims: { width: number; depth: number },
  depthInches: number
): number {
  const volume = (dims.width * dims.depth * depthInches) / 1728; // cubic feet
  return Math.ceil(volume * 25.7); // ~25.7 quarts per cubic foot
}

/**
 * Evaluates autoIncludeFor rules to determine if equipment should be included
 * Returns true if ALL conditions in the rules match
 */
export function shouldInclude(
  rules: any | undefined,
  profile: AnimalProfile,
  input: EnclosureInput
): boolean {
  if (!rules) return false;

  // Check animalType match
  if (rules.animalType) {
    const types = Array.isArray(rules.animalType) ? rules.animalType : [rules.animalType];
    if (!types.includes(profile.equipmentNeeds?.animalType)) {
      return false;
    }
  }

  // Check substrate match
  if (rules.substrate) {
    const substrates = Array.isArray(rules.substrate) ? rules.substrate : [rules.substrate];
    if (!substrates.includes(input.substratePreference)) {
      return false;
    }
  }

  // Check climate match
  if (rules.climate) {
    const climates = Array.isArray(rules.climate) ? rules.climate : [rules.climate];
    if (!climates.includes(profile.equipmentNeeds?.climate)) {
      return false;
    }
  }

  // Check activity pattern match
  if (rules.activity) {
    const activities = Array.isArray(rules.activity) ? rules.activity : [rules.activity];
    if (!activities.includes(profile.equipmentNeeds?.activity)) {
      return false;
    }
  }

  // Check diet match
  if (rules.diet) {
    const diets = Array.isArray(rules.diet) ? rules.diet : [rules.diet];
    const profileDiets = profile.equipmentNeeds?.diet || [];
    if (!diets.some((d: string) => profileDiets.includes(d))) {
      return false;
    }
  }

  // Check bioactive requirement
  if (rules.bioactive !== undefined) {
    if (rules.bioactive !== input.bioactive) {
      return false;
    }
  }

  // Check water feature match
  if (rules.waterFeature) {
    const features = Array.isArray(rules.waterFeature) ? rules.waterFeature : [rules.waterFeature];
    if (!features.includes(profile.equipmentNeeds?.waterFeature)) {
      return false;
    }
  }

  // All conditions passed
  return true;
}
