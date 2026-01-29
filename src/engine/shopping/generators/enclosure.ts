import type { ShoppingItem, EnclosureInput } from '../../types';
import { createShoppingItem, getEquipment } from '../utils';

/**
 * Generates the enclosure item (first item in shopping list)
 */
export function addEnclosure(
  items: ShoppingItem[],
  input: EnclosureInput
): void {
  const config = getEquipment(`enclosure-${input.type}`);
  if (!config) return;

  const dimensionsDisplay = input.units === 'in' 
    ? `${input.width}" × ${input.depth}" × ${input.height}"`
    : `${input.width}cm × ${input.depth}cm × ${input.height}cm`;
  
  items.push(createShoppingItem(
    `enclosure-${input.type}`,
    config,
    input.quantity,
    dimensionsDisplay
  ));
}
