import type {
  EnclosureInput,
  ShoppingItem,
} from './types';
import equipmentCatalog from '../data/equipment';

// Type-safe catalog access
const catalog = equipmentCatalog as Record<string, any>;

/**
 * Helper to create a shopping item from catalog config
 */
function createShoppingItem(
  id: string,
  config: any,
  quantity: number | string,
  sizing: string,
  overrides?: Partial<ShoppingItem>
): ShoppingItem {
  return {
    id,
    category: config.category,
    name: config.name,
    quantity,
    sizing,
    importance: config.importance,
    setupTierOptions: config.tiers,
    ...(config.notes && { notes: config.notes }),
    ...(config.incompatibleAnimals && { incompatibleAnimals: config.incompatibleAnimals }),
    ...overrides,
  };
}

/**
 * Helper to get equipment from catalog safely
 */
function getEquipment(id: string): any | null {
  return catalog[id] || null;
}

/**
 * Adds an item and its required dependencies
 */
function addItemWithDependencies(
  items: ShoppingItem[],
  itemId: string,
  config: any,
  quantity: number | string,
  sizing: string,
  profile: any,
  input: EnclosureInput,
  overrides?: Partial<ShoppingItem>
): void {
  // Add the main item
  items.push(createShoppingItem(itemId, config, quantity, sizing, overrides));

  // Add required dependencies
  if (config.requiredWith && Array.isArray(config.requiredWith)) {
    for (const depId of config.requiredWith) {
      const depConfig = getEquipment(depId);
      if (depConfig && matchesAnimalNeeds(depConfig, profile.equipmentNeeds, input)) {
        // Check if not already added
        if (!items.some(item => item.id === depId)) {
          items.push(createShoppingItem(depId, depConfig, 1, ''));
        }
      }
    }
  }
}

/**
 * Calculate enclosure volume in cubic feet
 */
function calculateVolume(dims: { width: number; depth: number; height: number }): number {
  return (dims.width * dims.depth * dims.height) / 1728;
}

/**
 * Calculate substrate/drainage quantities
 */
function calculateSubstrateQuarts(
  dims: { width: number; depth: number },
  depthInches: number
): number {
  const volume = (dims.width * dims.depth * depthInches) / 1728; // cubic feet
  return Math.ceil(volume * 25.7); // ~25.7 quarts per cubic foot
}

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
function matchesAnimalNeeds(
  equipmentConfig: any,
  animalNeeds: any,
  userInput?: EnclosureInput
): boolean {
  // If equipment has no needsTags or empty array, it's universal (all animals need it)
  if (!equipmentConfig.needsTags || equipmentConfig.needsTags.length === 0) {
    return true;
  }
  
  // If animal has no equipmentNeeds defined, fallback to old logic (backward compatibility)
  if (!animalNeeds) {
    return !equipmentConfig.incompatibleAnimals || 
           !equipmentConfig.incompatibleAnimals.includes(animalNeeds);
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
        if (animalNeeds.substrate && animalNeeds.substrate.includes(value)) {
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
        if (animalNeeds.decor && animalNeeds.decor.includes(value)) {
          return true;
        }
        break;
      case 'plants':
        // Plant matching based on user's plant preference from input
        if (userInput?.plantPreference) {
          const userPref = userInput.plantPreference;
          // If user wants mixed, match all plant types
          if (userPref === 'mix') {
            return true;
          }
          // Otherwise, match exact preference (live or artificial)
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

/**
 * Generates the enclosure item (first item in shopping list)
 */
function addEnclosure(
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

/**
 * Adds UVB lighting if required by animal profile
 */
function addUVBLighting(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: any,
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
 * Adds heat lamp if required by animal profile
 */
function addHeatLamp(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: any,
  input: EnclosureInput
): void {
  if (!profile.careTargets.temperature.basking) return;

  const config = getEquipment('heat-lamp');
  if (!config || !matchesAnimalNeeds(config, profile.equipmentNeeds, input)) return;

  // Calculate wattage based on temperature difference and enclosure volume
  const volume = calculateVolume(dims);
  const tempDifference = profile.careTargets.temperature.basking - input.ambientTemp;
  const baseWattage = volume * 20; // 20W per cubic foot as baseline
  const wattage = Math.max(25, Math.min(150, Math.round(baseWattage * (tempDifference / 20))));
  
  const sizing = `Based on ${Math.round(volume)} cubic feet and ${tempDifference}°F temperature difference from ambient (${input.ambientTemp}°F)`;
  
  // Add CHE with automatic dependencies (dome-fixture, thermostat)
  addItemWithDependencies(items, 'heat-lamp', config, `1 (${wattage}W estimate)`, sizing, profile, input);
}

/**
 * Determines which substrate to use based on preferences
 */
function getSubstrateKey(input: EnclosureInput, profile: any): string {
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
function addSubstrate(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  input: EnclosureInput,
  profile: any
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
function addBioactiveItems(
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

/**
 * Adds humidity control equipment based on ambient conditions
 */
function addHumidityControl(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: any,
  input: EnclosureInput
): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  const needsHumidityControl = input.ambientHumidity < profile.careTargets.humidity.min;
  const isScreenEnclosure = input.type === 'screen';
  const humidityWarning = isScreenEnclosure && needsHumidityControl ? ' (screen loses humidity - may need larger unit)' : '';
  const volume = dims.width * dims.depth * dims.height;
  
  if (needsHumidityControl && input.humidityControl === 'misting-system') {
    const mistingConfig = catalogDict['misting-system'];
    if (mistingConfig) {
      // Screen enclosures may need more frequent misting
      const mistingFrequency = isScreenEnclosure ? '4-5 times daily' : '2-3 times daily';
      items.push({
        id: 'misting-system',
        category: mistingConfig.category,
        name: mistingConfig.name,
        quantity: '1 system',
        sizing: `Automatic timer for ${mistingFrequency} misting to maintain ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}% humidity${isScreenEnclosure ? ' (high frequency due to screen material)' : ''} (current room: ${input.ambientHumidity}%)`,
        importance: 'required', // Required when humidity control is needed
        notes: mistingConfig.notes,
      });
    }
  } else if (needsHumidityControl && input.humidityControl === 'humidifier') {
    const humidifierConfig = catalogDict.humidifier;
    if (humidifierConfig) {
      // Screen enclosures may need larger humidifier
      const sizeMultiplier = isScreenEnclosure ? 1.5 : 1;
      const cubicFeet = Math.round(volume / 1728);
      items.push({
        id: 'humidifier',
        category: humidifierConfig.category,
        name: humidifierConfig.name,
        quantity: '1 unit',
        sizing: `Sized for ${Math.round(cubicFeet * sizeMultiplier)}+ cubic feet to reach ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}% humidity${humidityWarning} (current room: ${input.ambientHumidity}%)`,
        importance: 'required', // Required when humidity control is needed
        notes: humidifierConfig.notes,
      });
    }
  } else if (needsHumidityControl && input.humidityControl === 'fogger') {
    const foggerConfig = catalogDict.fogger;
    if (foggerConfig) {
      items.push({
        id: 'fogger',
        category: foggerConfig.category,
        name: foggerConfig.name,
        quantity: '1 unit',
        sizing: `Ultrasonic fogger for ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}% humidity${humidityWarning} (current room: ${input.ambientHumidity}%)`,
        importance: 'required', // Required when humidity control is needed
        notes: foggerConfig.notes,
      });
    }
  }
}

/**
 * Adds decor items (branches, plants)
 */
function addDecor(
  items: ShoppingItem[],
  profile: any,
  input: EnclosureInput
): void {
  const catalogDict = equipmentCatalog as Record<string, any>;

  // Branches
  const branchesConfig = equipmentCatalog.branches as Record<string, any>;
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
        quantity: input.plantPreference === 'live' ? '4-6 plants' : '2-3 plants',
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
        quantity: input.plantPreference === 'artificial' ? '4-6 pieces' : '1-2 pieces',
        sizing: 'Realistic artificial plants for mixed or minimalist aesthetics',
        importance: 'required', // Required when artificial or mixed plants selected
        setupTierOptions: artificialConfig.tiers,
        notes: artificialConfig.notes,
        incompatibleAnimals: artificialConfig.incompatibleAnimals,
      });
    }
  }
}

/**
 * Adds monitoring equipment (thermometer/hygrometer, IR thermometer, UV meter, timer)
 */
function addMonitoring(items: ShoppingItem[], profile: any, input: EnclosureInput): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  const monitoringItems = [
    'monitoring',
    'infrared-thermometer', 
    'uv-meter',
    'timer'
  ];

  for (const itemId of monitoringItems) {
    const config = catalogDict[itemId];
    if (!config) continue;

    // Use needs-based matching for monitoring equipment
    if (!matchesAnimalNeeds(config, profile.equipmentNeeds, input)) {
      continue;
    }

    items.push({
      id: itemId,
      category: config.category as any,
      name: config.name,
      quantity: 1,
      sizing: itemId === 'monitoring' ? 'Monitor warm and cool zones' : '',
      importance: config.importance || 'recommended',
      setupTierOptions: config.tiers as any,
      notes: config.notes,
      incompatibleAnimals: config.incompatibleAnimals,
    });
  }
}

/**
 * Adds water and maintenance supplies
 */
function addWaterSupplies(items: ShoppingItem[], input: EnclosureInput, profile: any): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  
  // Water bowl
  const waterBowlConfig = catalogDict['water-bowl'];
  if (waterBowlConfig) {
    items.push({
      id: 'water-bowl',
      category: waterBowlConfig.category,
      name: waterBowlConfig.name,
      quantity: 1,
      sizing: 'Large enough for soaking',
      importance: waterBowlConfig.importance,
      setupTierOptions: waterBowlConfig.tiers,
      notes: waterBowlConfig.notes,
      incompatibleAnimals: waterBowlConfig.incompatibleAnimals,
    });
  }

  // Spray bottle - only add when manual humidity control is selected AND humidity control is needed
  const needsHumidityControl = input.ambientHumidity < profile.careTargets.humidity.min;
  if (input.humidityControl === 'manual' && needsHumidityControl) {
    const sprayBottleConfig = catalogDict['spray-bottle'];
    if (sprayBottleConfig) {
      items.push({
        id: 'spray-bottle',
        category: sprayBottleConfig.category,
        name: sprayBottleConfig.name,
        quantity: 1,
        sizing: 'For manual misting',
        importance: 'required',
        setupTierOptions: sprayBottleConfig.tiers,
        notes: sprayBottleConfig.notes,
        incompatibleAnimals: sprayBottleConfig.incompatibleAnimals,
      });
    }
  }

  // Dechlorinator
  const dechlorinatorConfig = catalogDict['dechlorinator'];
  if (dechlorinatorConfig) {
    items.push({
      id: 'dechlorinator',
      category: dechlorinatorConfig.category,
      name: dechlorinatorConfig.name,
      quantity: '1 bottle',
      sizing: 'For water bowl and misting',
      importance: dechlorinatorConfig.importance,
      setupTierOptions: dechlorinatorConfig.tiers,
      notes: dechlorinatorConfig.notes,
      incompatibleAnimals: dechlorinatorConfig.incompatibleAnimals,
    });
  }
}

/**
 * Adds feeding supplies and supplements
 */
function addFeedingSupplies(items: ShoppingItem[], input: EnclosureInput, profile: any): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  
  // Feeder insects (only add if compatible with selected animal)
  const insectsConfig = catalogDict['feeder-insects'];
  if (insectsConfig && matchesAnimalNeeds(insectsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'feeder-insects',
      category: insectsConfig.category,
      name: insectsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Size appropriate for animal',
      importance: insectsConfig.importance,
      setupTierOptions: insectsConfig.tiers,
      notes: insectsConfig.notes,
      incompatibleAnimals: insectsConfig.incompatibleAnimals,
    });
  }

  // Calcium supplement (only add if compatible with selected animal)
  const calciumConfig = catalogDict['calcium'];
  if (calciumConfig && matchesAnimalNeeds(calciumConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'calcium',
      category: calciumConfig.category,
      name: calciumConfig.name,
      quantity: '1 container',
      sizing: 'Dust following product instructions',
      importance: calciumConfig.importance,
      setupTierOptions: calciumConfig.tiers,
      notes: calciumConfig.notes,
      incompatibleAnimals: calciumConfig.incompatibleAnimals,
    });
  }

  // Multivitamin (only add if compatible with selected animal)
  const multivitaminConfig = catalogDict['multivitamin'];
  if (multivitaminConfig && matchesAnimalNeeds(multivitaminConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'multivitamin',
      category: multivitaminConfig.category,
      name: multivitaminConfig.name,
      quantity: '1 container',
      sizing: 'Dust following product instructions',
      importance: multivitaminConfig.importance,
      setupTierOptions: multivitaminConfig.tiers,
      notes: multivitaminConfig.notes,
      incompatibleAnimals: multivitaminConfig.incompatibleAnimals,
    });
  }

  // Fresh vegetables & fruits (only add if compatible with selected animal - omnivores)
  const vegetablesConfig = catalogDict['fresh-vegetables-fruits'];
  if (vegetablesConfig && matchesAnimalNeeds(vegetablesConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'fresh-vegetables-fruits',
      category: vegetablesConfig.category,
      name: vegetablesConfig.name,
      quantity: 'Daily supply',
      sizing: 'Fresh vegetables daily, fruits as treats',
      importance: vegetablesConfig.importance,
      setupTierOptions: vegetablesConfig.tiers,
      notes: vegetablesConfig.notes,
      incompatibleAnimals: vegetablesConfig.incompatibleAnimals,
    });
  }

  // Feeding tongs (universal)
  const tongsConfig = catalogDict['feeding-tongs'];
  if (tongsConfig) {
    items.push({
      id: 'feeding-tongs',
      category: tongsConfig.category,
      name: tongsConfig.name,
      quantity: '1 pair',
      sizing: 'For safe feeding',
      importance: tongsConfig.importance,
      setupTierOptions: tongsConfig.tiers,
      notes: tongsConfig.notes,
      incompatibleAnimals: tongsConfig.incompatibleAnimals,
    });
  }

  // Frozen rodents (only for carnivores)
  const rodentsConfig = catalogDict['frozen-rodents'];
  if (rodentsConfig && matchesAnimalNeeds(rodentsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'frozen-rodents',
      category: rodentsConfig.category,
      name: rodentsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Size appropriate for snake',
      importance: rodentsConfig.importance,
      setupTierOptions: rodentsConfig.tiers,
      notes: rodentsConfig.notes,
      incompatibleAnimals: rodentsConfig.incompatibleAnimals,
    });
  }

  // Long feeding tongs (only for carnivores - snakes)
  const longTongsConfig = catalogDict['feeding-tongs-long'];
  if (longTongsConfig && matchesAnimalNeeds(longTongsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'feeding-tongs-long',
      category: longTongsConfig.category,
      name: longTongsConfig.name,
      quantity: '1 pair',
      sizing: '12-16" for safe distance',
      importance: longTongsConfig.importance,
      setupTierOptions: longTongsConfig.tiers,
      notes: longTongsConfig.notes,
      incompatibleAnimals: longTongsConfig.incompatibleAnimals,
    });
  }

  // Kitchen scale (only for carnivores - track snake weight)
  const scaleConfig = catalogDict['kitchen-scale'];
  if (scaleConfig && matchesAnimalNeeds(scaleConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'kitchen-scale',
      category: scaleConfig.category,
      name: scaleConfig.name,
      quantity: '1',
      sizing: 'For tracking weight',
      importance: scaleConfig.importance,
      setupTierOptions: scaleConfig.tiers,
      notes: scaleConfig.notes,
      incompatibleAnimals: scaleConfig.incompatibleAnimals,
    });
  }

  // Nitrile gloves (only for amphibians)
  const glovesConfig = catalogDict['nitrile-gloves'];
  if (glovesConfig && matchesAnimalNeeds(glovesConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'nitrile-gloves',
      category: glovesConfig.category,
      name: glovesConfig.name,
      quantity: '1 box',
      sizing: 'Powder-free for animal safety',
      importance: glovesConfig.importance,
      setupTierOptions: glovesConfig.tiers,
      notes: glovesConfig.notes,
      incompatibleAnimals: glovesConfig.incompatibleAnimals,
    });
  }
}

/**
 * Adds optional lighting for live plants
 */
function addPlantLighting(items: ShoppingItem[], input: EnclosureInput): void {
  // Only add if user wants live plants
  if (input.plantPreference === 'live' || input.plantPreference === 'mix') {
    const catalogDict = equipmentCatalog as Record<string, any>;
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

/**
 * Adds structural decor (backgrounds, ledges, hides)
 */
function addStructuralDecor(items: ShoppingItem[], input: EnclosureInput, profile: any): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  
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
      const bgType = input.backgroundType === 'cork-bark' ? 'Cork bark panels' : 'Custom foam background';
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

/**
 * Main shopping list generator - orchestrates all item additions
 */
export function generateShoppingList(
  dims: { width: number; depth: number; height: number },
  profile: any,
  input: EnclosureInput
): ShoppingItem[] {
  const items: ShoppingItem[] = [];

  // Add items in order of importance/building sequence
  addEnclosure(items, input);
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
  addWaterSupplies(items, input, profile);
  addFeedingSupplies(items, input, profile);

  return items;
}
