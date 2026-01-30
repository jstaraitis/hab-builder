import type { EquipmentConfig, AnimalProfile, EnclosureInput } from '../types';

/**
 * New needs-based matching system:
 * Equipment declares what needs it fulfills via needsTags
 * Animals declare what they need via equipmentNeeds
 * Match when equipment fulfills at least one of the animal's needs
 * 
 * needsTags format examples:
 * - "climbing:vertical" - fulfills vertical climbing needs
 * - "climbing:ground" - fulfills ground enrichment needs
 * - "humidity:high" - for high-humidity species
 * - "substrate:bioactive" - for bioactive setups
 * - "plants:live" / "plants:artificial" / "plants:mixed" - plant type preferences
 * - [] (empty array) - universal item, compatible with all animals
 */
export function matchesAnimalNeeds(
  equipmentConfig: EquipmentConfig,
  animalNeeds: AnimalProfile['equipmentNeeds'],
  userInput?: EnclosureInput
): boolean {
  // If equipment has no needsTags or empty array, it's universal (all animals need it)
  if (!equipmentConfig.needsTags || equipmentConfig.needsTags.length === 0) {
    return true;
  }
  
  // If animal has no equipmentNeeds defined, only check incompatibility list
  if (!animalNeeds) {
    // Equipment is compatible unless animal is explicitly in incompatible list
    if (!equipmentConfig.incompatibleAnimals || equipmentConfig.incompatibleAnimals.length === 0) {
      return true;
    }
    // Check if animal ID is in incompatible list (requires userInput to have animal ID)
    return !userInput?.animal || !equipmentConfig.incompatibleAnimals.includes(userInput.animal);
  }
  
  // Check if equipment fulfills any of the animal's declared needs
  for (const tag of equipmentConfig.needsTags) {
    const [category, value] = tag.split(':');
    
    switch (category) {
      case 'climbing':
        if (animalNeeds.climbing === value || animalNeeds.climbing === 'both') {
          return true;
        }
        break;
      case 'substrate':
        if (animalNeeds.substrate && animalNeeds.substrate.includes(value as 'bioactive' | 'soil' | 'paper' | 'foam' | 'sand' | 'sand-aquatic')) {
          return true;
        }
        break;
      case 'humidity':
        if (animalNeeds.humidity === value) {
          return true;
        }
        break;
      case 'heatSource':
        if (animalNeeds.heatSource === value) {
          return true;
        }
        break;
      case 'waterFeature':
        if (animalNeeds.waterFeature === value) {
          return true;
        }
        break;
      case 'decor':
        if (animalNeeds.decor && animalNeeds.decor.includes(value as 'branches' | 'ledges' | 'hides' | 'plants' | 'background')) {
          return true;
        }
        break;
      case 'plants':
        // Plant matching based on user's plant preference from input
        if (userInput?.plantPreference) {
          const userPref = userInput.plantPreference;
          // Match exact preference (live or artificial)
          return value === userPref;
        }
        // Fallback: if no input provided, allow general "plants" tag
        if (animalNeeds.decor && animalNeeds.decor.includes('plants')) {
          return true;
        }
        break;
      case 'lighting':
        if (animalNeeds.lighting === value) {
          return true;
        }
        break;
      case 'diet':
        if (animalNeeds.diet && animalNeeds.diet.includes(value)) {
          return true;
        }
        break;
      case 'animalType':
        if (animalNeeds.animalType === value) {
          return true;
        }
        break;
    }
  }
  
  return false;
}
