import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { autoAddItemsByCategory } from '../autoAdd';

/**
 * Adds monitoring equipment using the auto-add system.
 * All monitoring items are automatically included based on their needsTags matching the animal's equipmentNeeds.
 * No custom sizing logic needed - quantity/sizing come from catalog's defaultQuantity/defaultSizing fields.
 */
export function addMonitoring(items: ShoppingItem[], profile: AnimalProfile, input: EnclosureInput): void {
  // Auto-add all monitoring category items that match animal needs
  autoAddItemsByCategory(items, 'monitoring', profile, input);
}
