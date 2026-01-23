import type {
  EnclosureInput,
  ShoppingItem,
} from './types';
import equipmentCatalog from '../data/equipment-catalog.json';

/**
 * Pure function that checks if equipment is compatible with the current animal
 */
function isCompatibleWithAnimal(
  equipmentConfig: any,
  animal: string
): boolean {
  // If no compatibleAnimals specified or it's empty, it's compatible with all
  if (!equipmentConfig.compatibleAnimals || equipmentConfig.compatibleAnimals.length === 0) {
    return true;
  }
  // Check if current animal is in the compatible list
  return equipmentConfig.compatibleAnimals.includes(animal);
}

/**
 * Generates the enclosure item (first item in shopping list)
 */
function addEnclosure(
  items: ShoppingItem[],
  input: EnclosureInput
): void {
  const enclosureKey = `enclosure-${input.type}`;
  const enclosureConfig = (equipmentCatalog as Record<string, any>)[enclosureKey];
  const dimensionsDisplay = input.units === 'in' 
    ? `${input.width}" × ${input.depth}" × ${input.height}"`
    : `${input.width}cm × ${input.depth}cm × ${input.height}cm`;
  
  items.push({
    id: enclosureKey,
    category: 'enclosure' as any,
    name: enclosureConfig.name,
    quantity: input.quantity,
    sizing: dimensionsDisplay,
    importance: enclosureConfig.importance,
    setupTierOptions: enclosureConfig.tiers,
    notes: enclosureConfig.notes,
    compatibleAnimals: enclosureConfig.compatibleAnimals,
  });
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
  if (profile.careTargets.lighting.uvbRequired) {
    const uvbConfig = equipmentCatalog['uvb-fixture'];
    
    if (isCompatibleWithAnimal(uvbConfig, input.animal)) {
      const fixtureLength = Math.round(dims.width * (profile.careTargets.lighting.coveragePercent / 100));
      items.push({
        id: 'uvb-fixture',
        category: uvbConfig.category as any,
        name: `UVB ${profile.careTargets.lighting.uvbStrength} ${uvbConfig.name}`,
        quantity: 1,
        sizing: `${fixtureLength}" fixture (${profile.careTargets.lighting.coveragePercent}% of ${Math.round(dims.width)}" width)`,
        importance: (uvbConfig as any).importance,
        setupTierOptions: uvbConfig.tiers as any,
        compatibleAnimals: uvbConfig.compatibleAnimals,
      });
    }
  }
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
  if (profile.careTargets.temperature.basking) {
    const heatConfig = equipmentCatalog['heat-lamp'];
    
    if (isCompatibleWithAnimal(heatConfig, input.animal)) {
      // Calculate wattage based on temperature difference and enclosure volume
      const volume = dims.width * dims.depth * dims.height;
      const tempDifference = profile.careTargets.temperature.basking - input.ambientTemp;
      const baseWattage = (volume / 1728) * 20; // 20W per cubic foot as baseline
      const wattage = Math.max(25, Math.min(150, Math.round(baseWattage * (tempDifference / 20)))); // scale by temp diff
      
      items.push({
        id: 'heat-lamp',
        category: heatConfig.category as any,
        name: heatConfig.name,
        quantity: `1 (${wattage}W estimate)`,
        sizing: `Based on ${Math.round(volume / 1728)} cubic feet and ${tempDifference}°F temperature difference from ambient (${input.ambientTemp}°F)`,
        importance: (heatConfig as any).importance,
        setupTierOptions: heatConfig.tiers as any,
        notes: heatConfig.notes,
        compatibleAnimals: heatConfig.compatibleAnimals,
      });
    }
  }
}

/**
 * Adds substrate based on user preference and bioactive setting
 */
function addSubstrate(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  input: EnclosureInput
): void {
  let substrateKey = 'substrate-simple';
  if (input.bioactive) {
    substrateKey = 'substrate-bioactive';
  } else if (input.substratePreference) {
    const preferenceMap: Record<string, string> = {
      'bioactive': 'substrate-bioactive',
      'soil-based': 'substrate-soil',
      'paper-based': 'substrate-paper',
      'foam': 'substrate-foam',
    };
    substrateKey = preferenceMap[input.substratePreference] || 'substrate-simple';
  }

  const substrateDepth = input.bioactive ? 4 : 2; // inches
  const substrateVolume = (dims.width * dims.depth * substrateDepth) / 1728; // cubic feet
  const quarts = Math.ceil(substrateVolume * 25.7); // ~25.7 quarts per cubic foot
  const substrateConfig = (equipmentCatalog as Record<string, any>)[substrateKey];
  
  items.push({
    id: 'substrate',
    category: (substrateConfig as any).category,
    name: (substrateConfig as any).name,
    quantity: `${quarts} quarts (${substrateDepth}\" depth)`,
    sizing: `${Math.round(dims.width)}\" × ${Math.round(dims.depth)}\" floor at ${substrateDepth}\" depth`,    importance: (substrateConfig as any).importance,    setupTierOptions: (substrateConfig as any).tiers,
    ...((substrateConfig as any).notes && { notes: (substrateConfig as any).notes }),
    compatibleAnimals: (substrateConfig as any).compatibleAnimals,
  });
}

/**
 * Adds bioactive-specific items (drainage, barrier, cleanup crew)
 */
function addBioactiveItems(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  _input: EnclosureInput
): void {
  const drainageDepth = dims.height < 24 ? 1.5 : 2.5;
  const drainageVolume = (dims.width * dims.depth * drainageDepth) / 1728;
  const drainageQuarts = Math.ceil(drainageVolume * 25.7);
  const drainageConfig = equipmentCatalog.drainage;

  // Drainage layer
  items.push({
    id: 'drainage',
    category: drainageConfig.category as any,
    name: drainageConfig.name,
    quantity: `${drainageQuarts} quarts`,
    sizing: `${drainageDepth}" layer for ${Math.round(dims.height)}" tall enclosure`,
    importance: 'required', // Required for bioactive setup
    notes: drainageConfig.notes,
    compatibleAnimals: (drainageConfig as any).compatibleAnimals,
  });

  // Drainage barrier
  const barrierConfig = equipmentCatalog['drainage-barrier'];
  items.push({
    id: 'barrier',
    category: barrierConfig.category as any,
    name: barrierConfig.name,
    quantity: '1 sheet',
    sizing: `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`,    importance: 'required', // Required for bioactive setup
    notes: barrierConfig.notes,
    compatibleAnimals: (barrierConfig as any).compatibleAnimals,
  });

  // Springtails
  const springtailsConfig = equipmentCatalog.springtails;
  items.push({
    id: 'springtails',
    category: springtailsConfig.category as any,
    name: springtailsConfig.name,
    quantity: '1 culture',
    sizing: `Springtails for bioactive enclosure`,
    importance: 'required', // Required for bioactive cleanup crew
    compatibleAnimals: (springtailsConfig as any).compatibleAnimals,
  });

  // Isopods
  const isopodsConfig = equipmentCatalog.isopods;
  items.push({
    id: 'isopods',
    category: isopodsConfig.category as any,
    name: isopodsConfig.name,
    quantity: '1 culture (10-20 individuals)',
    sizing: `Dwarf isopods for bioactive cleanup crew`,
    importance: 'required', // Required for bioactive cleanup crew
    compatibleAnimals: (isopodsConfig as any).compatibleAnimals,
  });
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
    compatibleAnimals: branchesConfig.compatibleAnimals,
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
        sizing: 'Mix of ground cover, mid-level, and upper canopy species',
        importance: plantsConfig.importance,
        setupTierOptions: plantsConfig.tiers,
        notes: plantsConfig.notes,
        compatibleAnimals: plantsConfig.compatibleAnimals,
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
        compatibleAnimals: artificialConfig.compatibleAnimals,
      });
    }
  }
}

/**
 * Adds monitoring equipment (thermometer/hygrometer)
 */
function addMonitoring(items: ShoppingItem[]): void {
  const monitoringConfig = equipmentCatalog.monitoring as Record<string, any>;
  items.push({
    id: 'monitoring',
    category: monitoringConfig.category as any,
    name: monitoringConfig.name,
    quantity: 1,
    sizing: 'Monitor warm and cool zones',
    importance: (monitoringConfig as any).importance,
    setupTierOptions: monitoringConfig.tiers as any,
    notes: monitoringConfig.notes,
    compatibleAnimals: monitoringConfig.compatibleAnimals,
  });
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
      compatibleAnimals: waterBowlConfig.compatibleAnimals,
    });
  }

  // Spray bottle - only add when manual humidity control is selected
  const needsHumidityControl = input.ambientHumidity < profile.careTargets.humidity.min;
  if (input.humidityControl === 'manual') {
    const sprayBottleConfig = catalogDict['spray-bottle'];
    if (sprayBottleConfig) {
      items.push({
        id: 'spray-bottle',
        category: sprayBottleConfig.category,
        name: sprayBottleConfig.name,
        quantity: 1,
        sizing: 'For manual misting',
        importance: needsHumidityControl ? 'required' : sprayBottleConfig.importance,
        setupTierOptions: sprayBottleConfig.tiers,
        notes: sprayBottleConfig.notes,
        compatibleAnimals: sprayBottleConfig.compatibleAnimals,
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
      compatibleAnimals: dechlorinatorConfig.compatibleAnimals,
    });
  }
}

/**
 * Adds feeding supplies and supplements
 */
function addFeedingSupplies(items: ShoppingItem[]): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  
  // Feeder insects
  const insectsConfig = catalogDict['feeder-insects'];
  if (insectsConfig) {
    items.push({
      id: 'feeder-insects',
      category: insectsConfig.category,
      name: insectsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Size appropriate to frog',
      importance: insectsConfig.importance,
      setupTierOptions: insectsConfig.tiers,
      notes: insectsConfig.notes,
      compatibleAnimals: insectsConfig.compatibleAnimals,
    });
  }

  // Calcium supplement
  const calciumConfig = catalogDict['calcium'];
  if (calciumConfig) {
    items.push({
      id: 'calcium',
      category: calciumConfig.category,
      name: calciumConfig.name,
      quantity: '1 container',
      sizing: 'Dust at every feeding',
      importance: calciumConfig.importance,
      setupTierOptions: calciumConfig.tiers,
      notes: calciumConfig.notes,
      compatibleAnimals: calciumConfig.compatibleAnimals,
    });
  }

  // Multivitamin
  const multivitaminConfig = catalogDict['multivitamin'];
  if (multivitaminConfig) {
    items.push({
      id: 'multivitamin',
      category: multivitaminConfig.category,
      name: multivitaminConfig.name,
      quantity: '1 container',
      sizing: 'Dust once per week',
      importance: multivitaminConfig.importance,
      setupTierOptions: multivitaminConfig.tiers,
      notes: multivitaminConfig.notes,
      compatibleAnimals: multivitaminConfig.compatibleAnimals,
    });
  }

  // Feeding tongs
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
      compatibleAnimals: tongsConfig.compatibleAnimals,
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
        compatibleAnimals: plantLightConfig.compatibleAnimals,
      });
    }
  }
}

/**
 * Adds structural decor (backgrounds, ledges, hides)
 */
function addStructuralDecor(items: ShoppingItem[], input: EnclosureInput): void {
  const catalogDict = equipmentCatalog as Record<string, any>;
  
  // Hides (required) - use user's specified quantity
  const hidesConfig = catalogDict['hides'];
  if (hidesConfig) {
    items.push({
      id: 'hides',
      category: hidesConfig.category,
      name: hidesConfig.name,
      quantity: input.numberOfHides,
      sizing: 'Ground and elevated placement',
      importance: hidesConfig.importance,
      setupTierOptions: hidesConfig.tiers,
      notes: hidesConfig.notes,
      compatibleAnimals: hidesConfig.compatibleAnimals,
    });
  }

  // Wall ledges - use user's specified quantity
  if (input.numberOfLedges > 0) {
    const ledgesConfig = catalogDict['ledges'];
    if (ledgesConfig) {
      items.push({
        id: 'ledges',
        category: ledgesConfig.category,
        name: ledgesConfig.name,
        quantity: input.numberOfLedges,
        sizing: 'Various heights for climbing',
        importance: ledgesConfig.importance,
        setupTierOptions: ledgesConfig.tiers,
        notes: ledgesConfig.notes,
        compatibleAnimals: ledgesConfig.compatibleAnimals,
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
        compatibleAnimals: backgroundConfig.compatibleAnimals,
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
  addSubstrate(items, dims, input);
  
  if (input.bioactive) {
    addBioactiveItems(items, dims, input);
  }
  
  addHumidityControl(items, dims, profile, input);
  addDecor(items, profile, input);
  addPlantLighting(items, input);
  addStructuralDecor(items, input);
  addMonitoring(items);
  addWaterSupplies(items, input, profile);
  addFeedingSupplies(items);

  return items;
}
