import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { createShoppingItem, getEquipment, calculateSubstrateQuarts } from '../utils';

type SubstrateType = 'bioactive' | 'soil' | 'paper' | 'foam' | 'sand' | 'sand-aquatic' | 'substrate-bare-bottom' | 'substrate-slate-tile' | 'substrate-fine-sand-aquatic';

// Substrate mapping for both user preference and defaults
const SUBSTRATE_MAP: Record<string, { key: string; compatTag: SubstrateType }> = {
  'soil-based': { key: 'substrate-soil', compatTag: 'soil' },
  'paper-based': { key: 'substrate-paper', compatTag: 'paper' },
  'foam': { key: 'substrate-foam', compatTag: 'foam' },
  'sand-based': { key: 'substrate-sand', compatTag: 'sand' },
  'sand-aquatic': { key: 'substrate-sand-aquatic', compatTag: 'sand-aquatic' },
  'bioactive': { key: 'substrate-bioactive-{type}', compatTag: 'bioactive' },
  'soil': { key: 'substrate-soil', compatTag: 'soil' },
  'paper': { key: 'substrate-paper', compatTag: 'paper' },
  'sand': { key: 'substrate-sand', compatTag: 'sand' },
};

/**
 * Helper to add equipment item if config exists
 */
function addEquipmentItem(
  items: ShoppingItem[],
  id: string,
  quantity: string,
  sizing: string,
  overrides?: Partial<ShoppingItem>
): void {
  const config = getEquipment(id);
  if (config) {
    items.push(createShoppingItem(id, config, quantity, sizing, overrides));
  }
}

/**
 * Determines which substrate to use based on preferences
 */
function getSubstrateKey(input: EnclosureInput, profile: AnimalProfile): string {
  const bioactiveType = profile.equipmentNeeds?.bioactiveSubstrate || 'tropical';
  const compatible = profile.equipmentNeeds?.substrate || [];
  
  // Special handling for fully aquatic animals
  if (profile.equipmentNeeds?.waterFeature === 'fully-aquatic' && !input.substratePreference) {
    return '';
  }

  const isCompatible = (tag: SubstrateType) => compatible.length === 0 || compatible.includes(tag);
  const withBioactiveType = (key: string) => key.replace('{type}', bioactiveType);
  
  // Check explicit substrate preference
  if (input.substratePreference) {
    const mapping = SUBSTRATE_MAP[input.substratePreference];
    if (mapping && isCompatible(mapping.compatTag)) {
      return withBioactiveType(mapping.key);
    }
    console.warn(`Substrate "${input.substratePreference}" not compatible with ${profile.commonName}. Compatible: ${compatible.join(', ')}`);
  }
  
  // Check bioactive toggle
  if (input.bioactive && isCompatible('bioactive')) {
    return `substrate-bioactive-${bioactiveType}`;
  }
  if (input.bioactive) {
    console.warn(`Bioactive substrate not compatible with ${profile.commonName}. Using compatible option.`);
  }
  
  // Use first compatible substrate or fallback to soil
  for (const compat of compatible) {
    const mapping = SUBSTRATE_MAP[compat];
    if (mapping) return withBioactiveType(mapping.key);
  }
  
  return 'substrate-soil';
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
  if (!substrateKey) return; // Skip for aquatic animals with no preference
  
  const config = getEquipment(substrateKey);
  if (!config) return;

  const depth = input.bioactive ? 4 : 2;
  const quarts = calculateSubstrateQuarts(dims, depth);
  const sizing = `${Math.round(dims.width)}" × ${Math.round(dims.depth)}" floor at ${depth}" depth`;
  
  items.push(createShoppingItem('substrate', config, `${quarts} quarts (${depth}" depth)`, sizing));
}

/**
 * Adds bioactive-specific items (drainage, barrier, cleanup crew)
 */
export function addBioactiveItems(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile
): void {
  const bioactiveType = profile.equipmentNeeds?.bioactiveSubstrate || 'tropical';
  
  // Drainage layer and barrier only for tropical bioactive
  if (bioactiveType === 'tropical') {
    const drainageDepth = dims.height < 24 ? 1.5 : 2.5;
    const drainageQuarts = calculateSubstrateQuarts(dims, drainageDepth);
    
    addEquipmentItem(
      items, 
      'drainage', 
      `${drainageQuarts} quarts`, 
      `${drainageDepth}" layer for ${Math.round(dims.height)}" tall enclosure`,
      { importance: 'required' }
    );
    
    addEquipmentItem(
      items, 
      'drainage-barrier', 
      '1 sheet', 
      `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`,
      { importance: 'required' }
    );
  }

  // Cleanup crew
  addEquipmentItem(items, 'springtails', '1 culture', '', { importance: 'required' });
  addEquipmentItem(items, 'isopods', '1 culture (10-20 individuals)', '', { importance: 'required' });
}
