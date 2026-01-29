import type { ShoppingItem, EquipmentConfig } from '../types';
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
