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
    budgetTierOptions: enclosureConfig.budgetTiers,
    notes: enclosureConfig.notes,
    infoLinks: enclosureConfig.infoLinks,
    purchaseLinks: enclosureConfig.purchaseLinks,
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
        budgetTierOptions: uvbConfig.budgetTiers as any,
        infoLinks: uvbConfig.infoLinks as any,
        purchaseLinks: uvbConfig.purchaseLinks as any,
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
        budgetTierOptions: heatConfig.budgetTiers as any,
        notes: heatConfig.notes,
        infoLinks: heatConfig.infoLinks as any,
        purchaseLinks: heatConfig.purchaseLinks as any,
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
    sizing: `${Math.round(dims.width)}\" × ${Math.round(dims.depth)}\" floor at ${substrateDepth}\" depth`,
    budgetTierOptions: (substrateConfig as any).budgetTiers,
    ...((substrateConfig as any).notes && { notes: (substrateConfig as any).notes }),
    infoLinks: (substrateConfig as any).infoLinks,
    purchaseLinks: (substrateConfig as any).purchaseLinks,
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
    notes: drainageConfig.notes,
    infoLinks: drainageConfig.infoLinks as any,
    purchaseLinks: drainageConfig.purchaseLinks as any,
    compatibleAnimals: (drainageConfig as any).compatibleAnimals,
  });

  // Drainage barrier
  const barrierConfig = equipmentCatalog['drainage-barrier'];
  items.push({
    id: 'barrier',
    category: barrierConfig.category as any,
    name: barrierConfig.name,
    quantity: '1 sheet',
    sizing: `Cut to ${Math.round(dims.width)}\" × ${Math.round(dims.depth)}\"`,
    notes: barrierConfig.notes,
    infoLinks: barrierConfig.infoLinks as any,
    purchaseLinks: barrierConfig.purchaseLinks as any,
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
    infoLinks: springtailsConfig.infoLinks as any,
    purchaseLinks: springtailsConfig.purchaseLinks as any,
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
    infoLinks: isopodsConfig.infoLinks as any,
    purchaseLinks: isopodsConfig.purchaseLinks as any,
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
        notes: mistingConfig.notes,
        infoLinks: mistingConfig.infoLinks,
        purchaseLinks: mistingConfig.purchaseLinks,
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
        notes: humidifierConfig.notes,
        infoLinks: humidifierConfig.infoLinks,
        purchaseLinks: humidifierConfig.purchaseLinks,
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
        notes: foggerConfig.notes,
        infoLinks: foggerConfig.infoLinks,
        purchaseLinks: foggerConfig.purchaseLinks,
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
        notes: plantsConfig.notes,
        infoLinks: plantsConfig.infoLinks,
        purchaseLinks: plantsConfig.purchaseLinks,
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
        notes: artificialConfig.notes,
        infoLinks: artificialConfig.infoLinks,
        purchaseLinks: artificialConfig.purchaseLinks,
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
    budgetTierOptions: monitoringConfig.budgetTiers as any,
    notes: monitoringConfig.notes,
    compatibleAnimals: monitoringConfig.compatibleAnimals,
  });
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
  addMonitoring(items);

  return items;
}
