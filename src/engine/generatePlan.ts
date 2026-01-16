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

function generateCareGuidance(_profile: any, _input: EnclosureInput) {
  const feedingNotes = [
    'Adults: 2–3 appropriately sized insects every 2–3 days; juveniles: smaller meals daily',
    'Avoid waxworms as staples; use varied feeders (crickets, dubia, BSFL) to prevent obesity',
    'Gut-load feeders and dust with calcium/D3 2–3× per week',
  ];
  
  const waterNotes = [
    'Use dechlorinated water only; change dish water 2–3× weekly',
    'Shallow dish with easy exit; clean and disinfect regularly',
  ];

  const mistingNotes = [
    'Light misting morning and evening; increase slightly during shed',
    'Avoid waterlogging substrate; ensure ventilation to prevent stagnant air',
  ];

  return { feedingNotes, waterNotes, mistingNotes };
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

  return {
    topDown: zones,
    sideView: layers,
    notes: [
      'Zones are approximate - adjust based on decor placement',
      profile.layoutRules.preferVertical 
        ? 'Maximize vertical climbing space with branches and plants'
        : 'Focus on horizontal floor space with varied terrain',
      'Ensure basking area has unobstructed path to UVB lighting',
      'Provide multiple horizontal perches at mid/upper levels; White’s Tree Frogs prefer resting on horizontal branches',
      'Use solid-sided (glass/PVC) enclosures with top ventilation to retain humidity; avoid full-screen walls',
    ],
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
    items.push({
      id: 'uvb-fixture',
      category: 'equipment',
      name: `UVB ${profile.careTargets.lighting.uvbStrength} Linear Fixture`,
      quantity: 1,
      sizing: `${fixtureLength}" fixture (${profile.careTargets.lighting.coveragePercent}% of ${Math.round(dims.width)}" width)`,
      budgetTierOptions: {
        low: 'Zoo Med ReptiSun',
        mid: 'Arcadia D3 Forest',
        premium: 'Arcadia ProT5',
      },
    });
  }

  // Heat lamp (if basking temp specified)
  if (profile.careTargets.temperature.basking) {
    const wattage = Math.max(25, Math.min(100, Math.round((volume / 1728) * 40))); // rough estimate
    items.push({
      id: 'heat-lamp',
      category: 'equipment',
      name: 'Heat Lamp & Bulb',
      quantity: `1 (${wattage}W estimate)`,
      sizing: `Based on ${Math.round(volume / 1728)} cubic feet volume. Adjust wattage based on ambient temp.`,
      budgetTierOptions: {
        low: 'Ceramic dome + incandescent bulb',
        mid: 'Zoo Med Mini Deep Dome + halogen',
        premium: 'Arcadia Halogen Flood + dimming thermostat',
      },
      notes: 'Use thermostat to prevent overheating',
    });
  }

  // Substrate
  const substrateDepth = input.bioactive ? 4 : 2; // inches
  const substrateVolume = (dims.width * dims.depth * substrateDepth) / 1728; // cubic feet
  const quarts = Math.ceil(substrateVolume * 25.7); // ~25.7 quarts per cubic foot
  
  items.push({
    id: 'substrate',
    category: 'substrate',
    name: input.bioactive ? 'Bioactive Substrate Mix' : 'Substrate',
    quantity: `${quarts} quarts (${substrateDepth}" depth)`,
    sizing: `${Math.round(dims.width)}" × ${Math.round(dims.depth)}" floor at ${substrateDepth}" depth`,
    budgetTierOptions: input.bioactive ? {
      low: 'DIY coco coir + topsoil mix',
      mid: 'Josh\'s Frogs ABG mix',
      premium: 'Biodude Terra Firma',
    } : {
      low: 'Paper towel',
      mid: 'Eco Earth coconut fiber',
      premium: 'Sphagnum moss',
    },
  });

  // Drainage layer (bioactive only)
  if (input.bioactive) {
    const drainageDepth = dims.height < 24 ? 1.5 : 2.5;
    const drainageVolume = (dims.width * dims.depth * drainageDepth) / 1728;
    const drainageQuarts = Math.ceil(drainageVolume * 25.7);

    items.push({
      id: 'drainage',
      category: 'substrate',
      name: 'Drainage Layer (LECA or clay balls)',
      quantity: `${drainageQuarts} quarts`,
      sizing: `${drainageDepth}" layer for ${Math.round(dims.height)}" tall enclosure`,
    });

    items.push({
      id: 'barrier',
      category: 'substrate',
      name: 'Drainage Barrier (mesh screen)',
      quantity: '1 sheet',
      sizing: `Cut to ${Math.round(dims.width)}" × ${Math.round(dims.depth)}"`,
      notes: 'Prevents substrate from mixing with drainage',
    });
  }

  // Cleanup crew (bioactive only)
  if (input.bioactive) {
    items.push({
      id: 'springtails',
      category: 'cleanup_crew',
      name: 'Springtail Culture',
      quantity: '1 culture',
      sizing: 'Standard for enclosures up to 36" × 18"',
    });

    items.push({
      id: 'isopods',
      category: 'cleanup_crew',
      name: 'Isopod Culture (Dwarf White or similar)',
      quantity: '1 culture (10-20 individuals)',
      sizing: 'Tropical species suitable for high humidity',
    });
  }

  // Decor items
  items.push({
    id: 'branches',
    category: 'decor',
    name: 'Climbing Branches',
    quantity: profile.layoutRules.preferVertical ? '3-5 pieces' : '2-3 pieces',
    sizing: 'Various diameters, reaching from substrate to top third',
    notes: 'Cork bark, manzanita, or bamboo recommended',
  });

  items.push({
    id: 'plants',
    category: profile.layoutRules.preferVertical ? 'live_plants' : 'decor',
    name: 'Plants (live or artificial)',
    quantity: '3-5 plants',
    sizing: 'Mix of ground cover, mid-level, and upper canopy',
    notes: input.beginnerMode 
      ? 'Beginners: artificial plants are easier to maintain' 
      : 'Pothos, ferns, bromeliads are good starter species',
  });

  // Thermometer/hygrometer
  items.push({
    id: 'monitoring',
    category: 'equipment',
    name: 'Digital Thermometer & Hygrometer',
    quantity: 1,
    sizing: 'Monitor both warm and cool zones',
    budgetTierOptions: {
      low: 'Basic digital combo unit',
      mid: 'Zoo Med dual gauge',
      premium: 'Govee WiFi monitor with app',
    },
  });

  return items;
}

function generateBuildSteps(input: EnclosureInput): BuildStep[] {
  const steps: BuildStep[] = [
    {
      id: 1,
      title: 'Clean and Prepare Enclosure',
      description: 'Thoroughly clean enclosure with reptile-safe disinfectant. Rinse well and let dry completely.',
      order: 1,
      important: true,
    },
  ];

  if (input.bioactive) {
    steps.push(
      {
        id: 2,
        title: 'Install Drainage Layer',
        description: 'Add LECA or clay balls to create drainage layer. Level carefully.',
        order: 2,
      },
      {
        id: 3,
        title: 'Add Drainage Barrier',
        description: 'Cut mesh screen to size and place over drainage layer. Ensure complete coverage.',
        order: 3,
        important: true,
      }
    );
  }

  steps.push(
    {
      id: input.bioactive ? 4 : 2,
      title: 'Add Substrate',
      description: input.bioactive 
        ? 'Add bioactive substrate mix. Create slight slope from back to front for drainage. Lightly moisten.'
        : 'Add substrate layer. Ensure even depth across enclosure floor.',
      order: input.bioactive ? 4 : 2,
    },
    {
      id: input.bioactive ? 5 : 3,
      title: 'Install Background (Optional)',
      description: 'If using foam background or cork bark backing, install before adding branches.',
      order: input.bioactive ? 5 : 3,
    },
    {
      id: input.bioactive ? 6 : 4,
      title: 'Add Hardscape and Branches',
      description: 'Install climbing branches at various angles. Ensure stability - test that branches don\'t shift.',
      order: input.bioactive ? 6 : 4,
      important: true,
    },
    {
      id: input.bioactive ? 7 : 5,
      title: 'Add Plants and Decor',
      description: 'Place plants (live or artificial). Create visual barriers and hiding spots. Leave clear paths for animal movement.',
      order: input.bioactive ? 7 : 5,
    }
  );

  if (input.bioactive) {
    steps.push({
      id: 8,
      title: 'Add Cleanup Crew',
      description: 'Introduce springtails and isopods. Let them establish for 2-3 weeks before adding animal.',
      order: 8,
      important: true,
    });
  }

  steps.push(
    {
      id: input.bioactive ? 9 : 6,
      title: 'Install Lighting and Heating',
      description: 'Mount UVB fixture and heat lamp on screen top. Position basking lamp over designated zone.',
      order: input.bioactive ? 9 : 6,
      important: true,
    },
    {
      id: input.bioactive ? 10 : 7,
      title: 'Add Monitoring Equipment',
      description: 'Place thermometer probes in basking and cool zones. Position hygrometer at mid-height.',
      order: input.bioactive ? 10 : 7,
    },
    {
      id: input.bioactive ? 11 : 8,
      title: 'Test and Adjust Parameters',
      description: 'Run enclosure for 48-72 hours without animal. Monitor temps and humidity. Adjust lighting height, wattage, and misting schedule as needed.',
      order: input.bioactive ? 11 : 8,
      important: true,
    },
    {
      id: input.bioactive ? 12 : 9,
      title: 'Final Check',
      description: 'Verify all parameters are stable. Check for any sharp edges or gaps. Ensure all equipment is secure.',
      order: input.bioactive ? 12 : 9,
      important: true,
    },
    {
      id: input.bioactive ? 13 : 10,
      title: 'Introduce Animal',
      description: 'Place animal in enclosure during evening hours. Minimize handling. Do not feed for 24-48 hours to reduce stress.',
      order: input.bioactive ? 13 : 10,
      important: true,
    }
  );

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
