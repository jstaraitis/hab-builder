import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { createShoppingItem, getEquipment, catalog } from '../utils';
import { matchesAnimalNeeds } from '../matching';

/**
 * Adds UVB lighting if required by animal profile
 */
export function addUVBLighting(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  if (!profile.careTargets.lighting.uvbRequired) return;

  const uvbStrength = profile.careTargets.lighting.uvbStrength;
  const isDesertUVB = uvbStrength === '10.0' || uvbStrength === '12%';
  const fixtureId = isDesertUVB ? 'uvb-fixture-desert' : 'uvb-fixture-forest';
  const config = getEquipment(fixtureId);
  
  if (!config || !matchesAnimalNeeds(config, profile.equipmentNeeds, input)) return;

  const fixtureLength = Math.round(dims.width * (profile.careTargets.lighting.coveragePercent / 100));
  const sizing = `${fixtureLength}" fixture (${profile.careTargets.lighting.coveragePercent}% of ${Math.round(dims.width)}" width)`;
  
  items.push(createShoppingItem(fixtureId, config, 1, sizing));
}

/**
 * Adds optional lighting for live plants
 */
export function addPlantLighting(items: ShoppingItem[], input: EnclosureInput): void {
  // Only add if user wants live plants
  if (input.plantPreference === 'live') {
    const catalogDict = catalog as Record<string, EquipmentConfig>;
    const plantLightConfig = catalogDict['plant-light'];
    if (plantLightConfig) {
      items.push({
        id: 'plant-light',
        category: plantLightConfig.category,
        name: plantLightConfig.name,
        quantity: 1,
        sizing: 'For live plant growth',
        importance: 'required', // Required when live plants are selected
        setupTierOptions: plantLightConfig.tiers,
        notes: plantLightConfig.notes,
        incompatibleAnimals: plantLightConfig.incompatibleAnimals,
      });
    }
  }
}
