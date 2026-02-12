import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog, shouldInclude } from '../utils';
import { matchesAnimalNeeds } from '../matching';

const catalogDict = catalog as Record<string, EquipmentConfig>;

/**
 * Helper to add an item from config without duplication
 */
function addItem(
  items: ShoppingItem[],
  id: string,
  config: EquipmentConfig,
  overrides: Partial<ShoppingItem> & { quantity: string | number }
): void {
  items.push({
    id,
    category: config.category,
    name: config.name,
    importance: config.importance,
    setupTierOptions: config.tiers,
    notes: config.notes,
    incompatibleAnimals: config.incompatibleAnimals,
    isRecurring: config.isRecurring,
    recurringInterval: config.recurringInterval,
    quantity: overrides.quantity,
    ...overrides,
  } as ShoppingItem);
}

/**
 * Adds decor items (branches, plants, leaf litter) using autoIncludeFor rules
 */
export function addDecor(
  items: ShoppingItem[],
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  // Branches - auto-include based on activity pattern
  const branchesConfig = catalogDict.branches;
  if (branchesConfig && shouldInclude(branchesConfig.autoIncludeFor, profile, input)) {
    addItem(items, 'branches', branchesConfig, {
      quantity: profile.layoutRules.preferVertical ? '3-5 pieces' : '2-3 pieces',
      sizing: 'Various diameters, reaching from substrate to top third',
    });
  }

  // Plants - handle live/artificial preference
  if (input.plantPreference === 'live') {
    const plantsConfig = catalogDict['plants-live'];
    if (plantsConfig) {
      addItem(items, 'plants-live', plantsConfig, {
        quantity: '4-6 plants',
        sizing: 'Mix of ground cover, mid-level, and upper-level for arboreal species',
      });
    }
  } else if (input.plantPreference === 'artificial') {
    const artificialConfig = catalogDict['plants-artificial'];
    if (artificialConfig) {
      addItem(items, 'plants-artificial', artificialConfig, {
        quantity: '4-6 pieces',
        sizing: 'Realistic artificial plants for minimalist aesthetics',
        importance: 'required',
      });
    }
  }

  // Leaf litter - bioactive only
  const leafLitterConfig = catalogDict['leaf-litter'];
  if (leafLitterConfig && input.bioactive) {
    const shouldAdd = leafLitterConfig.needsTags?.length
      ? matchesAnimalNeeds(leafLitterConfig, profile.equipmentNeeds, input)
      : shouldInclude(leafLitterConfig.autoIncludeFor, profile, input);
    
    if (shouldAdd) {
      addItem(items, 'leaf-litter', leafLitterConfig, {
        quantity: '1 bag',
        sizing: 'Thick layer over substrate for skin protection and natural foraging',
      });
    }
  }

  // Species-specific required equipment
  profile.equipmentNeeds?.requiredEquipment?.forEach(equipmentId => {
    const config = catalogDict[equipmentId];
    if (config && !items.some(item => item.id === equipmentId)) {
      addItem(items, equipmentId, config, {
        quantity: '1',
        sizing: 'Species-specific requirement',
        importance: 'required',
      });
    }
  });
}

/**
 * Adds structural decor (backgrounds, ledges, hides)
 */
export function addStructuralDecor(items: ShoppingItem[], input: EnclosureInput, profile: AnimalProfile): void {
  // Hides - with style preference
  const hidesConfig = catalogDict['hides'];
  if (hidesConfig && shouldInclude(hidesConfig.autoIncludeFor, profile, input)) {
    const styleNotes: Record<string, string> = {
      natural: ' (Natural materials: cork bark, wood logs, natural caves)',
      commercial: ' (Commercial products: plastic caves, resin hides)',
      mixed: ' (Mix of natural cork/wood and commercial plastic hides)',
    };
    
    const styleNote = styleNotes[input.hideStylePreference] || '';
    addItem(items, 'hides', hidesConfig, {
      quantity: input.numberOfHides,
      sizing: 'Ground and elevated placements as appropriate' + styleNote,
    });
  }

  // Wall ledges - for vertical species
  if (input.numberOfLedges > 0) {
    const ledgesConfig = catalogDict['ledges'];
    if (ledgesConfig && matchesAnimalNeeds(ledgesConfig, profile.equipmentNeeds, input)) {
      addItem(items, 'ledges', ledgesConfig, {
        quantity: input.numberOfLedges,
        sizing: 'Various heights for climbing',
      });
    }
  }

  // Climbing areas - for terrestrial species
  if (input.numberOfClimbingAreas > 0) {
    const climbingConfig = catalogDict['climbing-areas'];
    if (climbingConfig && matchesAnimalNeeds(climbingConfig, profile.equipmentNeeds, input)) {
      addItem(items, 'climbing-areas', climbingConfig, {
        quantity: input.numberOfClimbingAreas,
        sizing: 'Various sizes for basking and enrichment',
      });
    }
  }

  // Background
  if (input.backgroundType !== 'none') {
    const backgroundConfig = catalogDict['background'];
    if (backgroundConfig) {
      addItem(items, 'background', backgroundConfig, {
        quantity: '1 panel',
        sizing: `${input.backgroundType === 'prebuilt' ? 'Prebuilt background panel' : 'Custom background (DIY)'} for back wall`,
      });
    }
  }
}
