import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../types';
import { catalog } from './utils';
import { matchesAnimalNeeds } from './matching';

/**
 * Automatically adds items from the catalog that match the animal's needs.
 * This is the "auto-add" system that eliminates manual item-by-item coding.
 * 
 * Items are added if:
 * 1. They belong to the specified category
 * 2. They're not in the exclude list (reserved for custom logic items)
 * 3. They match the animal's needs via needsTags
 * 
 * @param items - Shopping list to append to
 * @param category - Equipment category to filter by (e.g., 'nutrition', 'lighting')
 * @param profile - Animal profile with equipmentNeeds
 * @param input - User input (enclosure, bioactive, etc.)
 * @param excludeIds - Item IDs to skip (for items with custom sizing logic)
 */
export function autoAddItemsByCategory(
  items: ShoppingItem[],
  category: string,
  profile: AnimalProfile,
  input: EnclosureInput,
  excludeIds: string[] = []
): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;

  for (const [itemId, config] of Object.entries(catalogDict)) {
    // Skip if wrong category, already excluded, or doesn't match needs
    if (
      config.category !== category ||
      excludeIds.includes(itemId) ||
      !matchesAnimalNeeds(config, profile.equipmentNeeds, input)
    ) {
      continue;
    }

    // Auto-add item with default quantity/sizing from catalog
    items.push({
      id: itemId,
      category: config.category,
      name: config.name,
      quantity: config.defaultQuantity || '1',
      sizing: config.defaultSizing || '',
      importance: config.importance || 'recommended',
      setupTierOptions: config.tiers,
      notes: config.notes,
      incompatibleAnimals: config.incompatibleAnimals,
      ...(config.isRecurring && { isRecurring: config.isRecurring }),
      ...(config.recurringInterval && { recurringInterval: config.recurringInterval }),
    });
  }
}
