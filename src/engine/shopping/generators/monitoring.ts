import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';
import { matchesAnimalNeeds } from '../matching';

/**
 * Adds monitoring equipment (thermometer/hygrometer, IR thermometer, UV meter, timer)
 */
export function addMonitoring(items: ShoppingItem[], profile: AnimalProfile, input: EnclosureInput): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  const monitoringItems = [
    'monitoring',
    'infrared-thermometer', 
    'uv-meter',
    'timer'
  ];

  for (const itemId of monitoringItems) {
    const config = catalogDict[itemId];
    if (!config) continue;

    // Use needs-based matching for monitoring equipment
    if (!matchesAnimalNeeds(config, profile.equipmentNeeds, input)) {
      continue;
    }

    items.push({
      id: itemId,
      category: config.category,
      name: config.name,
      quantity: 1,
      sizing: itemId === 'monitoring' ? 'Monitor warm and cool zones' : '',
      importance: config.importance || 'recommended',
      setupTierOptions: config.tiers,
      notes: config.notes,
      incompatibleAnimals: config.incompatibleAnimals,
    });
  }
}
