import type { ShoppingItem, EnclosureInput, AnimalProfile } from '../../types';
import { createShoppingItem, getEquipment } from '../utils';
import { animalProfiles } from '../../../data/animals';
import { calculateGallons } from '../../dimensionUtils';

/**
 * Generates the enclosure item (first item in shopping list)
 */
export function addEnclosure(
  items: ShoppingItem[],
  input: EnclosureInput
): void {
  // Determine enclosure type - use aquarium for aquatic species
  const profile = animalProfiles[input.animal as keyof typeof animalProfiles];
  const isAquatic = profile?.equipmentNeeds?.activity === 'aquatic';
  const enclosureType = isAquatic ? 'aquarium' : input.type;
  
  const config = getEquipment(`enclosure-${enclosureType}`);
  if (!config) return;

  // For aquariums, show gallon size; for terrariums, show dimensions
  let dimensionsDisplay: string;
  if (isAquatic) {
    const gallons = Math.round(calculateGallons({ width: input.width, depth: input.depth, height: input.height }));
    const dims = input.units === 'in' 
      ? `${input.width}" × ${input.depth}" × ${input.height}"`
      : `${input.width}cm × ${input.depth}cm × ${input.height}cm`;
    dimensionsDisplay = `${gallons} gallon (${dims})`;
  } else {
    dimensionsDisplay = input.units === 'in' 
      ? `${input.width}" × ${input.depth}" × ${input.height}"`
      : `${input.width}cm × ${input.depth}cm × ${input.height}cm`;
  }
  
  items.push(createShoppingItem(
    `enclosure-${enclosureType}`,
    config,
    input.quantity,
    dimensionsDisplay
  ));
}
