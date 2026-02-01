import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog, shouldInclude } from '../utils';
import aquaticCatalog from '../../../data/equipment/aquatic.json';

/**
 * Adds specialized aquatic equipment using autoIncludeFor rules
 */
export function addAquaticEquipment(
  items: ShoppingItem[],
  profile: AnimalProfile,
  _input: EnclosureInput
): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
  // Only process for aquatic animals
  if (profile.equipmentNeeds?.activity !== 'aquatic') return;

  // Process all aquatic equipment with autoIncludeFor rules
  for (const [itemId, config] of Object.entries(aquaticCatalog)) {
    // Skip if already added
    if (items.some(item => item.id === itemId)) continue;

    const equipmentConfig = config as EquipmentConfig;
    
    // Check if equipment should be included using autoIncludeFor rules
    if (equipmentConfig.autoIncludeFor && shouldInclude(equipmentConfig.autoIncludeFor, profile, _input)) {
      items.push({
        id: itemId,
        category: equipmentConfig.category,
        name: equipmentConfig.name,
        quantity: 1,
        sizing: '',
        importance: equipmentConfig.importance || 'required',
        setupTierOptions: equipmentConfig.tiers,
        notes: equipmentConfig.notes,
        incompatibleAnimals: equipmentConfig.incompatibleAnimals,
        isRecurring: (equipmentConfig as any).isRecurring,
        recurringInterval: (equipmentConfig as any).recurringInterval,
      });
    }
  }

  // Process requiredEquipment array from animal profile
  const requiredEquipment = profile.equipmentNeeds?.requiredEquipment || [];
  for (const itemId of requiredEquipment) {
    // Skip if already added
    if (items.some(item => item.id === itemId)) continue;

    const config = catalogDict[itemId] || (aquaticCatalog as Record<string, EquipmentConfig>)[itemId];
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
      isRecurring: (config as any).isRecurring,
      recurringInterval: (config as any).recurringInterval,
    });
  }
}
