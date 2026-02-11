import type { ShoppingItem, AnimalProfile, EnclosureInput } from '../../types';
import { createShoppingItem, getEquipment, calculateSubstrateQuarts } from '../utils';

type SubstrateType = 'bioactive' | 'soil' | 'paper' | 'foam' | 'sand' | 'sand-aquatic' | 'substrate-bare-bottom' | 'substrate-slate-tile' | 'substrate-fine-sand-aquatic';

/**
 * Check if substrate is compatible with animal
 */
function isSubstrateCompatible(substrateTag: SubstrateType, compatibleList: string[]): boolean {
  if (compatibleList.length === 0) return true; // No restrictions
  return compatibleList.includes(substrateTag);
}

/**
 * Get substrate key from preference mapping
 */
function getSubstrateFromPreference(preference: string, bioactiveType: string): { key: string; compatTag: SubstrateType } | null {
  const preferenceMap: Record<string, { key: string; compatTag: SubstrateType }> = {
    'soil-based': { key: 'substrate-soil', compatTag: 'soil' },
    'paper-based': { key: 'substrate-paper', compatTag: 'paper' },
    'foam': { key: 'substrate-foam', compatTag: 'foam' },
    'sand-based': { key: 'substrate-sand', compatTag: 'sand' },
    'sand-aquatic': { key: 'substrate-sand-aquatic', compatTag: 'sand-aquatic' },
    'bioactive': { key: `substrate-bioactive-${bioactiveType}`, compatTag: 'bioactive' },
  };
  return preferenceMap[preference] || null;
}

/**
 * Get default substrate from animal's compatible list
 */
function getDefaultSubstrate(compatibleList: string[], bioactiveType: string): string {
  if (compatibleList.length === 0) return 'substrate-soil';
  
  const defaultMap: Record<string, string> = {
    'bioactive': `substrate-bioactive-${bioactiveType}`,
    'soil': 'substrate-soil',
    'paper': 'substrate-paper',
    'foam': 'substrate-foam',
    'sand': 'substrate-sand',
    'sand-aquatic': 'substrate-sand-aquatic',
  };
  
  // Return first compatible substrate
  for (const compat of compatibleList) {
    if (defaultMap[compat]) {
      return defaultMap[compat];
    }
  }
  
  return 'substrate-soil';
}

/**
 * Determines which substrate to use based on preferences
 */
function getSubstrateKey(input: EnclosureInput, profile: AnimalProfile): string {
  const bioactiveType = profile.equipmentNeeds?.bioactiveSubstrate || 'tropical';
  const compatibleSubstrates = profile.equipmentNeeds?.substrate || [];
  
  // Special handling for fully aquatic animals
  if (profile.equipmentNeeds?.waterFeature === 'fully-aquatic' && !input.substratePreference) {
    return '';
  }
  
  // Check explicit substrate preference
  if (input.substratePreference) {
    const mapping = getSubstrateFromPreference(input.substratePreference, bioactiveType);
    
    if (mapping) {
      // Validate compatibility
      if (isSubstrateCompatible(mapping.compatTag, compatibleSubstrates)) {
        return mapping.key;
      }
      
      console.warn(
        `Substrate preference "${input.substratePreference}" not compatible with ${profile.commonName}. ` +
        `Compatible: ${compatibleSubstrates.join(', ')}`
      );
    }
  }
  
  // Check bioactive toggle
  if (input.bioactive) {
    if (isSubstrateCompatible('bioactive', compatibleSubstrates)) {
      return `substrate-bioactive-${bioactiveType}`;
    }
    
    console.warn(`Bioactive substrate not compatible with ${profile.commonName}. Using compatible option.`);
  }
  
  // Use default compatible substrate
  return getDefaultSubstrate(compatibleSubstrates, bioactiveType);
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
  
  // Skip substrate if key is empty (for aquatic animals with no preference)
  if (!substrateKey) return;
  
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
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile
): void {
  const bioactiveType = profile.equipmentNeeds?.bioactiveSubstrate || 'tropical';
  
  // Drainage layer and barrier only for tropical bioactive
  if (bioactiveType === 'tropical') {
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
