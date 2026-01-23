import type {
  EnclosureInput,
  BuildPlan,
  Layout,
  Zone,
  VerticalLayer,
  BuildStep,
  Warning,
  AnimalProfile,
  CareTargets,
} from './types';
import { generateHusbandryCareChecklist } from './husbandryCare';
import { generateShoppingList } from './shoppingList';
import { animalProfiles } from '../data/animals';
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

function generateCareGuidance(profile: AnimalProfile, _input: EnclosureInput) {
  // Use profile's careGuidance if available, otherwise fall back to defaults
  if (profile.careGuidance) {
    return profile.careGuidance;
  }
  
  // Fallback to default guidance if not specified in profile
  const defaultGuidance = careGuidanceData._default;
  return {
    feedingNotes: defaultGuidance.feedingNotes,
    waterNotes: defaultGuidance.waterNotes,
    mistingNotes: defaultGuidance.mistingNotes,
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
  
  // Setup tier warnings
  if (input.setupTier === 'minimum') {
    warnings.push({
      id: 'minimum-setup-warning',
      severity: 'important',
      message: 'Minimum setups work well for most keepers, but prioritize quality UVB bulbs and thermostats - these directly impact animal health.',
      category: 'beginner_note',
    });
  }

  return warnings;
}
