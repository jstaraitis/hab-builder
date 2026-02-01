import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';

/**
 * Adds water and maintenance supplies
 */
export function addWaterSupplies(items: ShoppingItem[], profile: AnimalProfile, input: EnclosureInput): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
  // Skip water supplies for fully aquatic animals (they live in water)
  if (profile.equipmentNeeds?.activity === 'aquatic') {
    return;
  }
  
  // Water bowl
  const waterBowlConfig = catalogDict['water-bowl'];
  if (waterBowlConfig) {
    items.push({
      id: 'water-bowl',
      category: waterBowlConfig.category,
      name: waterBowlConfig.name,
      quantity: 1,
      sizing: 'Large enough for soaking',
      importance: waterBowlConfig.importance,
      setupTierOptions: waterBowlConfig.tiers,
      notes: waterBowlConfig.notes,
      incompatibleAnimals: waterBowlConfig.incompatibleAnimals,
    });
  }

  // Dechlorinator
  const dechlorinatorConfig = catalogDict['dechlorinator'];
  if (dechlorinatorConfig) {
    items.push({
      id: 'dechlorinator',
      category: dechlorinatorConfig.category,
      name: dechlorinatorConfig.name,
      quantity: '1 bottle',
      sizing: 'For water bowl and misting',
      importance: dechlorinatorConfig.importance,
      setupTierOptions: dechlorinatorConfig.tiers,
      notes: dechlorinatorConfig.notes,
      incompatibleAnimals: dechlorinatorConfig.incompatibleAnimals,
    });
  }
}
