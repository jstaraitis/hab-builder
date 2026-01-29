import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { createShoppingItem, getEquipment, calculateSubstrateQuarts } from '../utils';

/**
 * Determines which substrate to use based on preferences
 */
function getSubstrateKey(input: EnclosureInput, profile: AnimalProfile): string {
  const bioactiveType = profile.equipmentNeeds?.bioactiveSubstrate || 'tropical';
  
  if (input.bioactive) {
    return `substrate-bioactive-${bioactiveType}`;
  }
  
  if (input.substratePreference) {
    const preferenceMap: Record<string, string> = {
      'bioactive': `substrate-bioactive-${bioactiveType}`,
      'soil-based': 'substrate-soil',
      'paper-based': 'substrate-paper',
      'foam': 'substrate-foam',
    };
    return preferenceMap[input.substratePreference] || 'substrate-simple';
  }
  
  return 'substrate-simple';
}

/**
 * Adds substrate based on user preference and bioactive setting
 */
export function addSubstrate(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  input: EnclosureInput,
  profile: AnimalProfile
): void {
  const substrateKey = getSubstrateKey(input, profile);
  const config = getEquipment(substrateKey);
  if (!config) return;

  const substrateDepth = input.bioactive ? 4 : 2;
  const quarts = calculateSubstrateQuarts(dims, substrateDepth);
  const sizing = `${Math.round(dims.width)}" × ${Math.round(dims.depth)}" floor at ${substrateDepth}" depth`;
  
  items.push(createShoppingItem('substrate', config, `${quarts} quarts (${substrateDepth}" depth)`, sizing));
}

/**
 * Adds bioactive-specific items (drainage, barrier, cleanup crew)
 */
export function addBioactiveItems(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number }
): void {
  // Drainage layer
  const drainageDepth = dims.height < 24 ? 1.5 : 2.5;
  const drainageQuarts = calculateSubstrateQuarts(dims, drainageDepth);
  const drainageConfig = getEquipment('drainage');
  
  if (drainageConfig) {
    const sizing = `${drainageDepth}" layer for ${Math.round(dims.height)}" tall enclosure`;
    items.push(createShoppingItem('drainage', drainageConfig, `${drainageQuarts} quarts`, sizing, { importance: 'required' }));
  }

  // Drainage barrier
  const barrierConfig = getEquipment('drainage-barrier');
  if (barrierConfig) {
    const sizing = `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`;
    items.push(createShoppingItem('barrier', barrierConfig, '1 sheet', sizing, { importance: 'required' }));
  }

  // Cleanup crew
  const springtailsConfig = getEquipment('springtails');
  if (springtailsConfig) {
    items.push(createShoppingItem('springtails', springtailsConfig, '1 culture', '', { importance: 'required' }));
  }

  const isopodsConfig = getEquipment('isopods');
  if (isopodsConfig) {
    items.push(createShoppingItem('isopods', isopodsConfig, '1 culture (10-20 individuals)', '', { importance: 'required' }));
  }
}
