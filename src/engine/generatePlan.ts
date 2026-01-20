import type {
  EnclosureInput,
  BuildPlan,
  Layout,
  Zone,
  VerticalLayer,
  ShoppingItem,
  BuildStep,
  Warning,
  AnimalProfile,
  CareTargets,
} from './types';
import { generateHusbandryCareChecklist } from './husbandryCare';
import { animalProfiles } from '../data/animals';
import equipmentCatalog from '../data/equipment-catalog.json';
import careGuidanceData from '../data/care-guidance.json';
import buildStepsData from '../data/build-steps.json';
import layoutNotesData from '../data/layout-notes.json';

/**
 * Main rule engine - generates a complete build plan from user inputs
 * This is deterministic, not AI-generated
 */
export function generatePlan(input: EnclosureInput): BuildPlan {
  const profile = animalProfiles[input.animal as keyof typeof animalProfiles] as AnimalProfile;
  
  if (!profile) {
    throw new Error(`Unknown animal: ${input.animal}`);
  }

  // Convert dimensions to inches for calculations
  const dimensions = input.units === 'cm' 
    ? { 
        width: input.width / 2.54, 
        depth: input.depth / 2.54, 
        height: input.height / 2.54 
      }
    : { width: input.width, depth: input.depth, height: input.height };

  // Generate all plan components
  const layout = generateLayout(dimensions, profile, input);
  const shoppingList = generateShoppingList(dimensions, profile, input);
  const steps = generateBuildSteps(input);
  const warnings = generateWarnings(profile, input, dimensions);
  const careGuidance = generateCareGuidance(profile, input);
  const husbandryChecklist = generateHusbandryCareChecklist(input, profile);

  return {
    enclosure: input,
    careTargets: profile.careTargets as CareTargets,
    layout,
    shoppingList,
    steps,
    warnings,
    careGuidance,
    husbandryChecklist,
    species: {
      commonName: profile.commonName,
      scientificName: profile.scientificName,
      careLevel: profile.careLevel as 'beginner' | 'intermediate' | 'advanced',
      bioactiveCompatible: profile.bioactiveCompatible,
      notes: profile.notes,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      animalSpecies: profile.commonName,
    },
  };
}

function generateCareGuidance(_profile: any, input: EnclosureInput) {
  const guidance = careGuidanceData[input.animal as keyof typeof careGuidanceData] || careGuidanceData._default;
  
  return {
    feedingNotes: guidance.feedingNotes,
    waterNotes: guidance.waterNotes,
    mistingNotes: guidance.mistingNotes,
  };
}

function generateLayout(
  _dims: { width: number; depth: number; height: number },
  profile: any,
  _input: EnclosureInput
): Layout {
  const zones: Zone[] = [];
  const layers: VerticalLayer[] = [];

  // Basking zone - top third, warm side (if horizontal gradient)
  if (profile.layoutRules.requiredZones.includes('basking')) {
    zones.push({
      id: 'basking',
      name: 'Basking Zone',
      x: profile.layoutRules.thermalGradient === 'horizontal' ? 60 : 40,
      y: 10,
      width: 35,
      height: 25,
      type: 'basking',
    });
  }

  // Hide zone - mid level, cool side
  zones.push({
    id: 'hide-primary',
    name: 'Primary Hide',
    x: 10,
    y: 40,
    width: 30,
    height: 25,
    type: 'hide',
  });

  // Climbing zones - for arboreal species
  if (profile.layoutRules.preferVertical) {
    zones.push({
      id: 'climbing-1',
      name: 'Climbing Area (Branches)',
      x: 45,
      y: 30,
      width: 40,
      height: 50,
      type: 'climbing',
    });
  }

  // Water zone - bottom level
  if (profile.layoutRules.requiredZones.includes('water')) {
    zones.push({
      id: 'water',
      name: 'Water Dish',
      x: 15,
      y: 75,
      width: 20,
      height: 15,
      type: 'water',
    });
  }

  // Vertical layers for side view (arboreal species)
  if (profile.layoutRules.preferVertical) {
    layers.push(
      {
        id: 'ground',
        name: 'Ground Layer',
        heightPercent: 0,
        thickness: 25,
        description: 'Substrate, water dish, ground cover plants',
      },
      {
        id: 'mid',
        name: 'Mid-Level Climbing',
        heightPercent: 25,
        thickness: 35,
        description: 'Horizontal branches, large leaves for perching',
      },
      {
        id: 'canopy',
        name: 'Canopy / Basking',
        heightPercent: 60,
        thickness: 40,
        description: 'Upper branches, basking spot, dense foliage for security',
      }
    );
  }

  const notes = [
    ...layoutNotesData.common,
    ...(profile.layoutRules.preferVertical ? layoutNotesData.arboreal : layoutNotesData.terrestrial),
  ];

  return {
    topDown: zones,
    sideView: layers,
    notes,
  };
}

function generateShoppingList(
  dims: { width: number; depth: number; height: number },
  profile: any,
  input: EnclosureInput
): ShoppingItem[] {
  const items: ShoppingItem[] = [];
  const volume = dims.width * dims.depth * dims.height;

  // Enclosure - add as first item
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
  });

  // UVB Lighting (if required)
  if (profile.careTargets.lighting.uvbRequired) {
    const fixtureLength = Math.round(dims.width * (profile.careTargets.lighting.coveragePercent / 100));
    const uvbConfig = equipmentCatalog['uvb-fixture'];
    items.push({
      id: 'uvb-fixture',
      category: uvbConfig.category as any,
      name: `UVB ${profile.careTargets.lighting.uvbStrength} ${uvbConfig.name}`,
      quantity: 1,
      sizing: `${fixtureLength}" fixture (${profile.careTargets.lighting.coveragePercent}% of ${Math.round(dims.width)}" width)`,
      budgetTierOptions: uvbConfig.budgetTiers as any,
      infoLinks: uvbConfig.infoLinks as any,
      purchaseLinks: uvbConfig.purchaseLinks as any,
    });
  }

  // Heat lamp (if basking temp specified)
  if (profile.careTargets.temperature.basking) {
    // Calculate wattage based on temperature difference and enclosure volume
    const tempDifference = profile.careTargets.temperature.basking - input.ambientTemp;
    const baseWattage = (volume / 1728) * 20; // 20W per cubic foot as baseline
    const wattage = Math.max(25, Math.min(150, Math.round(baseWattage * (tempDifference / 20)))); // scale by temp diff
    
    const heatConfig = equipmentCatalog['heat-lamp'];
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
    });
  }

  // Substrate - Select based on user preference
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
  
  // Enclosure type affects equipment recommendations
  // Screen enclosures are more porous - need better humidity management
  const isScreenEnclosure = input.type === 'screen';
  
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
  });

  // Drainage layer (bioactive only)
  if (input.bioactive) {
    const drainageDepth = dims.height < 24 ? 1.5 : 2.5;
    const drainageVolume = (dims.width * dims.depth * drainageDepth) / 1728;
    const drainageQuarts = Math.ceil(drainageVolume * 25.7);
    const drainageConfig = equipmentCatalog.drainage;

    items.push({
      id: 'drainage',
      category: drainageConfig.category as any,
      name: drainageConfig.name,
      quantity: `${drainageQuarts} quarts`,
      sizing: `${drainageDepth}" layer for ${Math.round(dims.height)}" tall enclosure`,
      notes: drainageConfig.notes,
      infoLinks: drainageConfig.infoLinks as any,
      purchaseLinks: drainageConfig.purchaseLinks as any,
    });

    const barrierConfig = equipmentCatalog['drainage-barrier'];
    items.push({
      id: 'barrier',
      category: barrierConfig.category as any,
      name: barrierConfig.name,
      quantity: '1 sheet',
      sizing: `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`,
      notes: barrierConfig.notes,
      infoLinks: barrierConfig.infoLinks as any,
      purchaseLinks: barrierConfig.purchaseLinks as any,
    });
  }

  // Cleanup crew (bioactive only)
  if (input.bioactive) {
    const springtailsConfig = equipmentCatalog.springtails;
    items.push({
      id: 'springtails',
      category: springtailsConfig.category as any,
      name: springtailsConfig.name,
      quantity: '1 culture',
      sizing: springtailsConfig.sizing,
      infoLinks: springtailsConfig.infoLinks as any,
      purchaseLinks: springtailsConfig.purchaseLinks as any,
    });

    const isopodsConfig = equipmentCatalog.isopods;
    items.push({
      id: 'isopods',
      category: isopodsConfig.category as any,
      name: isopodsConfig.name,
      quantity: '1 culture (10-20 individuals)',
      sizing: isopodsConfig.sizing,
      infoLinks: isopodsConfig.infoLinks as any,
      purchaseLinks: isopodsConfig.purchaseLinks as any,
    });
  }

  // Humidity control equipment - only add if ambient humidity is below animal's minimum
  const catalogDict = equipmentCatalog as Record<string, any>;
  const needsHumidityControl = input.ambientHumidity < profile.careTargets.humidity.min;
  const humidityWarning = isScreenEnclosure && needsHumidityControl ? ' (screen loses humidity - may need larger unit)' : '';
  
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

  // Decor items
  const branchesConfig = equipmentCatalog.branches;
  items.push({
    id: 'branches',
    category: branchesConfig.category as any,
    name: branchesConfig.name,
    quantity: profile.layoutRules.preferVertical ? '3-5 pieces' : '2-3 pieces',
    sizing: 'Various diameters, reaching from substrate to top third',
    notes: branchesConfig.notes,
    infoLinks: branchesConfig.infoLinks as any,
    purchaseLinks: branchesConfig.purchaseLinks as any,
  });

  // Plants based on user preference
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
      });
    }
  }

  // Thermometer/hygrometer
  const monitoringConfig = equipmentCatalog.monitoring;
  items.push({
    id: 'monitoring',
    category: monitoringConfig.category as any,
    name: monitoringConfig.name,
    quantity: 1,
    sizing: monitoringConfig.sizing,
    budgetTierOptions: monitoringConfig.budgetTiers as any,
    infoLinks: monitoringConfig.infoLinks as any,
    purchaseLinks: monitoringConfig.purchaseLinks as any,
  });

  return items;
}

function generateBuildSteps(input: EnclosureInput): BuildStep[] {
  const steps: BuildStep[] = [];
  let stepCounter = 1;

  // Common starting steps
  buildStepsData.common.forEach((step) => {
    steps.push({
      id: stepCounter++,
      title: step.title,
      description: step.description,
      order: steps.length + 1,
      important: step.important,
    });
  });

  // Bioactive-specific steps
  if (input.bioactive) {
    buildStepsData.bioactive.forEach((step) => {
      steps.push({
        id: stepCounter++,
        title: step.title,
        description: step.description,
        order: steps.length + 1,
        important: step.important,
      });
    });
  }

  // Substrate step (bioactive or simple)
  const substrateStep = input.bioactive 
    ? buildStepsData.substrate.bioactive 
    : buildStepsData.substrate.simple;
  steps.push({
    id: stepCounter++,
    title: substrateStep.title,
    description: substrateStep.description,
    order: steps.length + 1,
    important: substrateStep.important,
  });

  // Shared steps (background, hardscape, plants)
  buildStepsData.shared.forEach((step) => {
    steps.push({
      id: stepCounter++,
      title: step.title,
      description: step.description,
      order: steps.length + 1,
      important: step.important,
    });
  });

  // Cleanup crew (bioactive only)
  if (input.bioactive) {
    const cleanupStep = buildStepsData.bioactiveCleanupCrew;
    steps.push({
      id: stepCounter++,
      title: cleanupStep.title,
      description: cleanupStep.description,
      order: steps.length + 1,
      important: cleanupStep.important,
    });
  }

  // Final steps (lighting, monitoring, testing, intro)
  buildStepsData.final.forEach((step) => {
    steps.push({
      id: stepCounter++,
      title: step.title,
      description: step.description,
      order: steps.length + 1,
      important: step.important,
    });
  });

  return steps;
}

function generateWarnings(
  profile: any,
  input: EnclosureInput,
  dims: { width: number; depth: number; height: number }
): Warning[] {
  const warnings: Warning[] = [];
  
  // Enclosure type warnings
  if (input.type === 'screen' && profile.careTargets.humidity.min > 60) {
    warnings.push({
      id: 'screen-humidity',
      severity: 'important',
      category: 'common_mistake',
      message: `Screen enclosures lose humidity quickly. ${profile.commonName} needs ${profile.careTargets.humidity.min}%+ humidity - you'll need active humidity management (misting system or fogger). Screen material allows excellent airflow but requires careful environmental control.`,
    });
  }
  
  // Species-specific enclosure type restrictions
  if (input.type === 'screen' && input.animal === 'whites-tree-frog') {
    warnings.unshift({
      id: 'screen-incompatible-wtf',
      severity: 'critical',
      category: 'common_mistake',
      message: `CRITICAL: White's Tree Frogs CANNOT be housed in screen enclosures. They require glass or PVC enclosures to maintain the warm, stable ambient temperature they need. Screen enclosures lose too much heat and cannot maintain proper thermal conditions. Use GLASS or PVC only.`,
    });
  }
  
  if (input.type === 'glass' && input.bioactive && profile.careTargets.humidity.min < 50) {
    warnings.push({
      id: 'glass-ventilation',
      severity: 'tip',
      category: 'beginner_note',
      message: `Glass enclosures retain moisture well. For ${profile.commonName}'s lower humidity needs, ensure adequate ventilation (drill air holes or add mesh panels) to prevent excess moisture buildup with bioactive substrate.`,
    });
  }
  
  // Add profile-specific warnings with IDs
  profile.warnings.forEach((w: any, idx: number) => {
    warnings.push({
      id: `profile-${idx}`,
      ...w,
    });
  });

  // Quantity-based validation
  if (profile.quantityRules && input.quantity > 0) {
    const requiredGallons = profile.quantityRules.baseGallons + 
      (input.quantity - 1) * profile.quantityRules.additionalGallons;
    const volumeInches = dims.width * dims.depth * dims.height;
    const currentGallons = volumeInches / 231;

    if (currentGallons < requiredGallons) {
      warnings.unshift({
        id: 'quantity-size-warning',
        severity: 'critical',
        message: `For ${input.quantity} animal${input.quantity > 1 ? 's' : ''}, you need at least ${requiredGallons} gallons (currently ~${Math.round(currentGallons)} gallons). Increase enclosure size or reduce animal count.`,
        category: 'common_mistake',
      });
    }

    if (input.quantity > profile.quantityRules.maxRecommended) {
      warnings.unshift({
        id: 'quantity-overcrowding-warning',
        severity: 'critical',
        message: `${input.quantity} animals exceeds the recommended maximum of ${profile.quantityRules.maxRecommended}. Overcrowding leads to stress, aggression, and health problems.`,
        category: 'common_mistake',
      });
    }

    if (input.quantity > 1) {
      warnings.push({
        id: 'multiple-animals-tip',
        severity: 'tip',
        message: `Housing multiple animals requires extra hides, basking spots, and feeding stations to reduce competition. Monitor for signs of stress or aggression.`,
        category: 'beginner_note',
      });
    }
  }

  // Size validation
  const minSize = profile.minEnclosureSize;
  const minDims = minSize.units === 'cm' 
    ? { width: minSize.width / 2.54, height: minSize.height / 2.54, depth: minSize.depth / 2.54 }
    : minSize;

  if (dims.width < minDims.width || dims.depth < minDims.depth || dims.height < minDims.height) {
    warnings.unshift({
      id: 'size-warning',
      severity: 'critical',
      message: `Enclosure is below minimum recommended size (${minSize.width}×${minSize.depth}×${minSize.height}${minSize.units}). Animal welfare may be compromised.`,
      category: 'common_mistake',
    });
  }

  // Tall enclosures may struggle to hold humidity without coverage
  if (dims.height > 36) {
    warnings.push({
      id: 'height-humidity-warning',
      severity: 'tip',
      message: 'Very tall enclosures can drop humidity quickly—add canopy cover and monitor mid-height humidity.',
      category: 'beginner_note',
    });
  }

  // Bioactive setup guidance
  if (input.bioactive) {
    warnings.push({
      id: 'bioactive-info',
      severity: 'tip',
      message: 'Bioactive setups require more maintenance knowledge. Monitor your cleanup crew population and adjust as needed.',
      category: 'beginner_note',
    });
  }

  // Decoration style guidance
  
  // Budget warnings
  if (input.budget === 'low') {
    warnings.push({
      id: 'budget-warning',
      severity: 'important',
      message: 'Budget equipment can work well, but avoid skimping on UVB bulbs and thermostats - these directly impact animal health.',
      category: 'beginner_note',
    });
  }

  return warnings;
}
