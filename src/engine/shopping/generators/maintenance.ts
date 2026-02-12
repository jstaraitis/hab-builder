import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { autoAddItemsByCategory } from '../autoAdd';

/**
 * Adds maintenance supplies using the auto-add system.
 * All maintenance items are automatically included based on their needsTags matching the animal's equipmentNeeds.
 * No custom sizing logic needed - quantity/sizing come from catalog's defaultQuantity/defaultSizing fields.
 */
export function addMaintenance(items: ShoppingItem[], profile: AnimalProfile, input: EnclosureInput): void {
  // Auto-add all maintenance category items that match animal needs
  autoAddItemsByCategory(items, 'maintenance', profile, input);
}
