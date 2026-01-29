import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';
import { matchesAnimalNeeds } from '../matching';

/**
 * Adds decor items (branches, plants)
 */
export function addDecor(
  items: ShoppingItem[],
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;

  // Branches
  const branchesConfig = catalogDict.branches;
  items.push({
    id: 'branches',
    category: 'decor',
    name: branchesConfig.name,
    quantity: profile.layoutRules.preferVertical ? '3-5 pieces' : '2-3 pieces',
    sizing: 'Various diameters, reaching from substrate to top third',
    importance: branchesConfig.importance,
    setupTierOptions: branchesConfig.tiers,
    notes: branchesConfig.notes,
    incompatibleAnimals: branchesConfig.incompatibleAnimals,
  });

  // Live plants if preferred
  if (input.plantPreference !== 'artificial') {
    const plantsConfig = catalogDict['plants-live'];
    if (plantsConfig) {
      items.push({
        id: 'plants',
        category: plantsConfig.category,
        name: plantsConfig.name,
        quantity: '4-6 plants',
        sizing: 'Mix of ground cover, mid-level, and upper-level for arboreal species',
        importance: plantsConfig.importance,
        setupTierOptions: plantsConfig.tiers,
        notes: plantsConfig.notes,
        incompatibleAnimals: plantsConfig.incompatibleAnimals,
      });
    }
  }

  // Artificial plants if preferred
  if (input.plantPreference !== 'live') {
    const artificialConfig = catalogDict['plants-artificial'];
    if (artificialConfig) {
      items.push({
        id: 'plants-artificial',
        category: artificialConfig.category,
        name: artificialConfig.name,
        quantity: '4-6 pieces',
        sizing: 'Realistic artificial plants for minimalist aesthetics',
        importance: 'required', // Required when artificial plants selected
        setupTierOptions: artificialConfig.tiers,
        notes: artificialConfig.notes,
        incompatibleAnimals: artificialConfig.incompatibleAnimals,
      });
    }
  }
}

/**
 * Adds structural decor (backgrounds, ledges, hides)
 */
export function addStructuralDecor(items: ShoppingItem[], input: EnclosureInput, profile: AnimalProfile): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
  // Hides (required) - use user's specified quantity
  const hidesConfig = catalogDict['hides'];
  if (hidesConfig) {
    items.push({
      id: 'hides',
      category: hidesConfig.category,
      name: hidesConfig.name,
      quantity: input.numberOfHides,
      sizing: 'Ground and elevated placements as appropriate',
      importance: hidesConfig.importance,
      setupTierOptions: hidesConfig.tiers,
      notes: hidesConfig.notes,
      incompatibleAnimals: hidesConfig.incompatibleAnimals,
    });
  }

  // Wall ledges - use user's specified quantity (for arboreal/vertical species)
  if (input.numberOfLedges > 0) {
    const ledgesConfig = catalogDict['ledges'];
    if (ledgesConfig && matchesAnimalNeeds(ledgesConfig, profile.equipmentNeeds, input)) {
      items.push({
        id: 'ledges',
        category: ledgesConfig.category,
        name: ledgesConfig.name,
        quantity: input.numberOfLedges,
        sizing: 'Various heights for climbing',
        importance: ledgesConfig.importance,
        setupTierOptions: ledgesConfig.tiers,
        notes: ledgesConfig.notes,
        incompatibleAnimals: ledgesConfig.incompatibleAnimals,
      });
    }
  }

  // Climbing areas - branches/rocks for terrestrial/horizontal species
  if (input.numberOfClimbingAreas > 0) {
    const climbingConfig = catalogDict['climbing-areas'];
    if (climbingConfig && matchesAnimalNeeds(climbingConfig, profile.equipmentNeeds, input)) {
      items.push({
        id: 'climbing-areas',
        category: climbingConfig.category,
        name: climbingConfig.name,
        quantity: input.numberOfClimbingAreas,
        sizing: 'Various sizes for basking and enrichment',
        importance: climbingConfig.importance,
        setupTierOptions: climbingConfig.tiers,
        notes: climbingConfig.notes,
        incompatibleAnimals: climbingConfig.incompatibleAnimals,
      });
    }
  }

  // Background - only if user selected one
  if (input.backgroundType !== 'none') {
    const backgroundConfig = catalogDict['background'];
    if (backgroundConfig) {
      const bgType = input.backgroundType === 'prebuilt' ? 'Prebuilt background panel' : 'Custom background (DIY)';
      items.push({
        id: 'background',
        category: backgroundConfig.category,
        name: backgroundConfig.name,
        quantity: '1 panel',
        sizing: `${bgType} for back wall`,
        importance: backgroundConfig.importance,
        setupTierOptions: backgroundConfig.tiers,
        notes: backgroundConfig.notes,
        incompatibleAnimals: backgroundConfig.incompatibleAnimals,
      });
    }
  }
}
