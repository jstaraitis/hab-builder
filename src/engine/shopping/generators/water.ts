import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';

/**
 * Adds water and maintenance supplies
 */
export function addWaterSupplies(items: ShoppingItem[], profile: AnimalProfile, input: EnclosureInput): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
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

  // Spray bottle - only add when manual humidity control is selected AND humidity control is needed
  const needsHumidityControl = input.ambientHumidity < (profile.careTargets.humidity.day?.min ?? profile.careTargets.humidity.min ?? 60);
  if (input.humidityControl === 'manual' && needsHumidityControl) {
    const sprayBottleConfig = catalogDict['spray-bottle'];
    if (sprayBottleConfig) {
      items.push({
        id: 'spray-bottle',
        category: sprayBottleConfig.category,
        name: sprayBottleConfig.name,
        quantity: 1,
        sizing: 'For manual misting',
        importance: 'required',
        setupTierOptions: sprayBottleConfig.tiers,
        notes: sprayBottleConfig.notes,
        incompatibleAnimals: sprayBottleConfig.incompatibleAnimals,
      });
    }
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
