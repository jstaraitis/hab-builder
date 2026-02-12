import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { autoAddItemsByCategory } from '../autoAdd';

/**
 * Adds feeding supplies and supplements using the auto-add system.
 * All nutrition items are automatically included based on their needsTags matching the animal's equipmentNeeds.
 * No custom sizing logic needed - quantity/sizing come from catalog's defaultQuantity/defaultSizing fields.
 */
export function addFeedingSupplies(items: ShoppingItem[], input: EnclosureInput, profile: AnimalProfile): void {
  // Auto-add all nutrition category items that match animal needs
  autoAddItemsByCategory(items, 'nutrition', profile, input);
}
