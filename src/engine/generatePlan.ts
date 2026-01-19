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
    });
  }

  // Heat lamp (if basking temp specified)
  if (profile.careTargets.temperature.basking) {
    const wattage = Math.max(25, Math.min(100, Math.round((volume / 1728) * 40))); // rough estimate
    const heatConfig = equipmentCatalog['heat-lamp'];
    items.push({
      id: 'heat-lamp',
      category: heatConfig.category as any,
      name: heatConfig.name,
      quantity: `1 (${wattage}W estimate)`,
      sizing: `Based on ${Math.round(volume / 1728)} cubic feet volume. Adjust wattage based on ambient temp.`,
      budgetTierOptions: heatConfig.budgetTiers as any,
      notes: heatConfig.notes,
    });
  }

  // Substrate
  const substrateDepth = input.bioactive ? 4 : 2; // inches
  const substrateVolume = (dims.width * dims.depth * substrateDepth) / 1728; // cubic feet
  const quarts = Math.ceil(substrateVolume * 25.7); // ~25.7 quarts per cubic foot
  const substrateConfig = equipmentCatalog[input.bioactive ? 'substrate-bioactive' : 'substrate-simple'];
  
  items.push({
    id: 'substrate',
    category: substrateConfig.category as any,
    name: substrateConfig.name,
    quantity: `${quarts} quarts (${substrateDepth}" depth)`,
    sizing: `${Math.round(dims.width)}" × ${Math.round(dims.depth)}" floor at ${substrateDepth}" depth`,
    budgetTierOptions: substrateConfig.budgetTiers as any,
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
    });

    const barrierConfig = equipmentCatalog['drainage-barrier'];
    items.push({
      id: 'barrier',
      category: barrierConfig.category as any,
      name: barrierConfig.name,
      quantity: '1 sheet',
      sizing: `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`,
      notes: barrierConfig.notes,
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
    });

    const isopodsConfig = equipmentCatalog.isopods;
    items.push({
      id: 'isopods',
      category: isopodsConfig.category as any,
      name: isopodsConfig.name,
      quantity: '1 culture (10-20 individuals)',
      sizing: isopodsConfig.sizing,
    });
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
  });

  const plantsConfig = equipmentCatalog.plants;
  items.push({
    id: 'plants',
    category: (profile.layoutRules.preferVertical ? 'live_plants' : 'decor') as any,
    name: plantsConfig.name,
    quantity: '3-5 plants',
    sizing: 'Mix of ground cover, mid-level, and upper canopy',
    notes: input.beginnerMode 
      ? plantsConfig.notesBeginnerMode
      : plantsConfig.notesAdvanced,
  });

  // Thermometer/hygrometer
  const monitoringConfig = equipmentCatalog.monitoring;
  items.push({
    id: 'monitoring',
    category: monitoringConfig.category as any,
    name: monitoringConfig.name,
    quantity: 1,
    sizing: monitoringConfig.sizing,
    budgetTierOptions: monitoringConfig.budgetTiers as any,
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
  
  // Add profile-specific warnings with IDs
  profile.warnings.forEach((w: any, idx: number) => {
    warnings.push({
      id: `profile-${idx}`,
      ...w,
    });
  });

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

  // Bioactive specific
  if (input.bioactive && input.beginnerMode) {
    warnings.push({
      id: 'bioactive-beginner',
      severity: 'tip',
      message: 'Bioactive setups require more maintenance knowledge. Consider starting with simple substrate and adding bioactive later.',
      category: 'beginner_note',
    });
  }

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
