import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../types';
import { addEnclosure } from './generators/enclosure';
import { addUVBLighting, addPlantLighting } from './generators/lighting';
import { addHeatLamp } from './generators/heating';
import { addSubstrate, addBioactiveItems } from './generators/substrate';
import { addHumidityControl } from './generators/environmental';
import { addDecor, addStructuralDecor } from './generators/decor';
import { addMonitoring } from './generators/monitoring';
import { addWaterSupplies } from './generators/water';
import { addFeedingSupplies } from './generators/feeding';
import { addDirectEquipment } from './generators/specialized';

/**
 * Main shopping list generator - orchestrates all item additions
 */
export function generateShoppingList(
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): ShoppingItem[] {
  const items: ShoppingItem[] = [];

  // Add items in order of importance/building sequence
  addEnclosure(items, input);
  addDirectEquipment(items, profile, input); // Add aquatic/specialized equipment first
  addUVBLighting(items, dims, profile, input);
  addHeatLamp(items, dims, profile, input);
  addSubstrate(items, dims, input, profile);
  
  if (input.bioactive) {
    addBioactiveItems(items, dims);
  }
  
  addHumidityControl(items, dims, profile, input);
  addDecor(items, profile, input);
  addPlantLighting(items, input);
  addStructuralDecor(items, input, profile);
  addMonitoring(items, profile, input);
  addWaterSupplies(items, profile, input);
  addFeedingSupplies(items, input, profile);

  return items;
}
