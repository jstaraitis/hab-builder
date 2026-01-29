import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';

/**
 * Adds specialized equipment directly specified in animal profile arrays
 * Only processes arrays unique to specialized setups (aquatic, etc.) to avoid conflicts
 * with existing generic functions (addWaterSupplies, addFeedingSupplies, etc.)
 */
export function addDirectEquipment(
  items: ShoppingItem[],
  profile: AnimalProfile,
  _input: EnclosureInput // prefixed with _ to indicate intentionally unused
): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  // Only process specialized equipment arrays that don't overlap with generic functions
  const specializedArrays = [
    'filtration',      // Aquatic filters, air pumps
    'cooling',         // Aquarium chillers
    'waterTreatment',  // Test kits, conditioners (aquatic-specific)
    'maintenance',     // Python siphons, gravel vacs
    'safety',          // Aquarium lids, heater guards
    'heating'          // Aquarium heaters (aquatic-specific)
  ];

  for (const arrayName of specializedArrays) {
    const equipmentIds = profile.equipmentNeeds?.[arrayName];
    if (!Array.isArray(equipmentIds)) continue;

    for (const itemId of equipmentIds) {
      // Skip if already added
      if (items.some(item => item.id === itemId)) continue;

      const config = catalogDict[itemId];
      if (!config) {
        console.warn(`Equipment not found in catalog: ${itemId}`);
        continue;
      }

      items.push({
        id: itemId,
        category: config.category,
        name: config.name,
        quantity: 1,
        sizing: '',
        importance: config.importance || 'required',
        setupTierOptions: config.tiers,
        notes: config.notes,
        incompatibleAnimals: config.incompatibleAnimals,
      });
    }
  }
}
