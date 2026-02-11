import type {
  EnclosureInput,
  BuildPlan,
  Layout,
  Zone,
  VerticalLayer,
  BuildStep,
  Warning,
  AnimalProfile,
} from './types';
import { normalizeEnclosureInput, normalizeMinimumSize, calculateGallons } from './dimensionUtils';
import { generateHusbandryCareChecklist } from './husbandryCare';
import { generateShoppingList } from './shopping';
import { calculateCostEstimate } from './shopping/calculateCosts';
import { animalProfiles } from '../data/animals';
import buildStepsData from '../data/build-steps.json';
import layoutNotesData from '../data/layout-notes.json';

/**
 * Main rule engine - generates a complete build plan from user inputs
 * This is deterministic, not AI-generated
 */
export function generatePlan(input: EnclosureInput): BuildPlan {
  const profile = animalProfiles[input.animal as keyof typeof animalProfiles];
  
  if (!profile) {
    throw new Error(`Unknown animal: ${input.animal}`);
  }

  // Convert dimensions to inches for calculations
  const dimensions = normalizeEnclosureInput(input);

  // Generate all plan components
  const layout = generateLayout(dimensions, profile, input);
  const shoppingList = generateShoppingList(dimensions, profile, input);
  const steps = generateBuildSteps(input);
  const warnings = generateWarnings(profile, input, dimensions);
  const careGuidance = generateCareGuidance(profile, input);
  const husbandryChecklist = generateHusbandryCareChecklist(input, profile);
  
  // Calculate cost estimate based on selected tier
  const costEstimate = calculateCostEstimate(shoppingList, input.setupTier || 'recommended');

  return {
    enclosure: input,
    careTargets: profile.careTargets,
    layout,
    shoppingList,
    steps,
    warnings,
    careGuidance,
    husbandryChecklist,
    costEstimate,
    species: {
      commonName: profile.commonName,
      scientificName: profile.scientificName,
      careLevel: profile.careLevel,
      bioactiveCompatible: profile.bioactiveCompatible,
      notes: profile.notes,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      animalSpecies: profile.commonName,
    },
  };
}

function generateCareGuidance(profile: AnimalProfile, _input: EnclosureInput): {
  feedingNotes: string[];
  waterNotes: string[];
  mistingNotes: string[];
} {
  // Use profile's careGuidance - all animal profiles should have this defined
  if (profile.careGuidance) {
    // Combine feedingRequirements and feedingSchedule into feedingNotes
    const feedingNotes = [
      ...(profile.careGuidance.feedingRequirements || []),
      ...(profile.careGuidance.feedingSchedule || [])
    ];
    
    return {
      feedingNotes,
      waterNotes: profile.careGuidance.waterNotes || [],
      mistingNotes: profile.careGuidance.mistingNotes || [],
    };
  }
  
  // Fallback if no careGuidance (should not happen in production)
  return {
    feedingNotes: ['Feed appropriate-sized prey items based on species requirements'],
    waterNotes: ['Provide clean, dechlorinated water at all times'],
    mistingNotes: ['Mist as needed to maintain proper humidity levels'],
  };
}

function generateLayout(
  _dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
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

  // Background MUST come before substrate
  if (buildStepsData.background) {
    steps.push({
      id: stepCounter++,
      title: buildStepsData.background.title,
      description: buildStepsData.background.description,
      order: steps.length + 1,
      important: buildStepsData.background.important,
    });
  }

  // Bioactive-specific steps (drainage layer + barrier)
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

  // Shared steps (hardscape, water, hides, plants, feeding)
  buildStepsData.shared.forEach((step) => {
    steps.push({
      id: stepCounter++,
      title: step.title,
      description: step.description,
      order: steps.length + 1,
      important: step.important,
    });
  });

  // Cleanup crew (bioactive only, after plants are in for anchor points)
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

  // Equipment installation (lights, heating, cables, monitoring, misting)
  buildStepsData.equipment.forEach((step) => {
    steps.push({
      id: stepCounter++,
      title: step.title,
      description: step.description,
      order: steps.length + 1,
      important: step.important,
    });
  });

  // Final steps (escape-proof, test 48-72hrs, final check, introduce)
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
  profile: AnimalProfile,
  input: EnclosureInput,
  dims: { width: number; depth: number; height: number }
): Warning[] {
  const warnings: Warning[] = [];
  
  // Enclosure type warnings
  const minHumidity = profile.careTargets.humidity.day?.min ?? profile.careTargets.humidity.min ?? 60;
  if (input.type === 'screen' && input.animal !== 'veiled-chameleon') {
    warnings.push({
      id: 'screen-humidity',
      severity: 'important',
      category: 'common_mistake',
      message: `Screen enclosures lose humidity quickly and bleed heat. ${profile.commonName} needs ${minHumidity}%+ humidity and stable thermal gradients - you'll need active humidity management (misting system or fogger) and stronger heat output. Screen material allows excellent airflow but requires careful environmental control.`,
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
  
  if (input.type === 'glass' && input.bioactive && minHumidity < 50) {
    warnings.push({
      id: 'glass-ventilation',
      severity: 'tip',
      category: 'beginner_note',
      message: `Glass enclosures retain moisture well. For ${profile.commonName}'s lower humidity needs, ensure adequate ventilation (drill air holes or add mesh panels) to prevent excess moisture buildup with bioactive substrate.`,
    });
  }
  
  // Add profile-specific warnings with IDs
  profile.warnings.forEach((w: Omit<Warning, 'id'>, idx: number) => {
    warnings.push({
      id: `profile-${idx}`,
      ...w,
    });
  });

  // Quantity-based validation
  if (profile.quantityRules && input.quantity > 0) {
    const requiredGallons = profile.quantityRules.baseGallons + 
      (input.quantity - 1) * profile.quantityRules.additionalGallons;
    const currentGallons = calculateGallons(dims);

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
  const minDims = normalizeMinimumSize(profile);

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
