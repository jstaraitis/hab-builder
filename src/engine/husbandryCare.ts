import type { EnclosureInput, AnimalProfile } from './types';

export interface ChecklistItem {
  id: string;
  task: string;
  category: 'setup' | 'weekly' | 'monthly';
  completed?: boolean;
  notes?: string;
}

export interface HusbandryCareChecklist {
  preBuild: ChecklistItem[];
  weeklyMaintenance: ChecklistItem[];
  monthlyMaintenance: ChecklistItem[];
}

/**
 * Generate pre-build checklist based on enclosure and animal requirements
 */
export function generatePreBuildChecklist(
  input: EnclosureInput,
  profile: AnimalProfile
): ChecklistItem[] {
  const checklist: ChecklistItem[] = [
    {
      id: 'tools-thermometer',
      task: 'Acquire two thermometers (one for ambient, one for basking zone)',
      category: 'setup',
      notes: 'Digital thermometers or temperature probes recommended',
    },
    {
      id: 'tools-hygrometer',
      task: 'Get a hygrometer (humidity meter) for monitoring',
      category: 'setup',
      notes: 'Digital models with min/max memory are helpful',
    },
    {
      id: 'tools-temperature-gun',
      task: 'Optional: Get an infrared temperature gun for precise basking zone measurement',
      category: 'setup',
    },
    {
      id: 'supplies-dechlorinator',
      task: 'Purchase dechlorinator or water filter for tap water',
      category: 'setup',
      notes: `Critical for ${profile.commonName} - chlorine/chloramine damage their skin`,
    },
  ];

  // Add enclosure-specific items
  if (input.type === 'glass') {
    checklist.push({
      id: 'enclosure-ventilation',
      task: 'Plan ventilation: drill/cut air holes or install mesh vents if using glass',
      category: 'setup',
      notes: 'At least 2-3 small vents on sides to prevent stagnant air',
    });
  }

  // UVB lighting requirements
  if (profile.careTargets.lighting.uvbRequired) {
    checklist.push({
      id: 'lighting-uvb',
      task: `Get UVB light fixture (${profile.careTargets.lighting.uvbStrength} strength, linear preferred)`,
      category: 'setup',
      notes: `Should cover ${profile.careTargets.lighting.coveragePercent}% of enclosure length`,
    });
    checklist.push({
      id: 'lighting-ballast',
      task: 'Get appropriate ballast/fixture for UVB bulb',
      category: 'setup',
      notes: 'Standard fluorescent fixtures or specialized reptile fixtures',
    });
  }

  // Heat lamp requirements
  checklist.push({
    id: 'heating-lamp',
    task: `Get heat lamp and thermostat-controlled plug (for ${input.budget} budget level)`,
    category: 'setup',
    notes: `Target basking temperature: ${profile.careTargets.temperature.basking}°F`,
  });

  // Substrate and bedding
  if (input.bioactive) {
    checklist.push({
      id: 'substrate-drainage',
      task: 'Get materials for drainage layer (cork bark, LECA, or mesh)',
      category: 'setup',
      notes: '2-3" layer needed for bioactive enclosures',
    });
    checklist.push({
      id: 'substrate-bioactive',
      task: 'Purchase bioactive substrate mix',
      category: 'setup',
      notes: 'Coconut husk, sphagnum moss, leaf litter blend',
    });
    checklist.push({
      id: 'cleanup-crew',
      task: 'Order cleanup crew (springtails, isopods)',
      category: 'setup',
      notes: 'Allows 1-2 weeks to establish before adding frog',
    });
  } else {
    checklist.push({
      id: 'substrate-standard',
      task: 'Get substrate (coconut husk, sphagnum moss, or cypress mulch)',
      category: 'setup',
      notes: 'Need 2-3" depth for proper burrowing and humidity retention',
    });
  }

  // Decor and enrichment
  checklist.push({
    id: 'decor-perches',
    task: `Get horizontal perches/branches for ${profile.commonName}`,
    category: 'setup',
    notes: 'Cork bark, driftwood, or commercial bamboo perches - position at multiple heights',
  });

  checklist.push({
    id: 'decor-hides',
    task: 'Get hide spots (cork hides, plants, hollow logs)',
    category: 'setup',
    notes: 'At least 2-3 hiding areas for security',
  });

  // Live plants (optional but beneficial)
  checklist.push({
    id: 'plants',
    task: 'Optional: Get live plants for enrichment and humidity',
    category: 'setup',
    notes: 'Pothos, ficus, or other humidity-tolerant plants work well',
  });

  // Water requirements
  checklist.push({
    id: 'water-bowl',
    task: 'Get shallow water dish or misting system',
    category: 'setup',
    notes: 'For tree frogs, misting or drip systems preferred over standing water',
  });

  // Test run
  checklist.push({
    id: 'test-environment',
    task: 'Set up enclosure 1-2 weeks before acquiring animal',
    category: 'setup',
    notes: `Test heating/cooling, humidity levels, and light cycle to ensure stable ${profile.careTargets.temperature.min}-${profile.careTargets.temperature.max}°F and ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}% humidity`,
  });

  return checklist;
}

/**
 * Generate weekly maintenance checklist
 */
export function generateWeeklyMaintenance(
  _input: EnclosureInput,
  profile: AnimalProfile
): ChecklistItem[] {
  return [
    {
      id: 'feeding',
      task: `Feed ${profile.commonName} (2-3 appropriately-sized insects)`,
      category: 'weekly',
      notes: 'Vary insect types (crickets, roaches, moths) - skip fireflies (poisonous)',
    },
    {
      id: 'water-change',
      task: 'Change water bowl/dish daily or after feeding',
      category: 'weekly',
      notes: 'Use only dechlorinated water',
    },
    {
      id: 'misting',
      task: `Mist enclosure 2x daily (morning and evening)`,
      category: 'weekly',
      notes: `Target humidity: ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}%`,
    },
    {
      id: 'temp-check',
      task: 'Check temperature readings on both thermometers',
      category: 'weekly',
      notes: `Ambient: ${profile.careTargets.temperature.min}-${profile.careTargets.temperature.max}°F | Basking: ${profile.careTargets.temperature.basking}°F`,
    },
    {
      id: 'humidity-check',
      task: 'Check humidity level with hygrometer',
      category: 'weekly',
      notes: `Keep between ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}%`,
    },
    {
      id: 'visual-inspection',
      task: 'Visual health check: eyes clear, skin smooth, posture normal',
      category: 'weekly',
      notes: 'Watch for lethargy, unusual bumps, or discoloration',
    },
    {
      id: 'remove-waste',
      task: 'Remove uneaten food and feces',
      category: 'weekly',
      notes: 'Prevents mold and bacterial growth',
    },
  ];
}

/**
 * Generate monthly maintenance checklist
 */
export function generateMonthlyMaintenance(
  input: EnclosureInput,
  profile: AnimalProfile
): ChecklistItem[] {
  const checklist: ChecklistItem[] = [
    {
      id: 'substrate-spot-clean',
      task: 'Spot-clean substrate (remove wet or soiled areas)',
      category: 'monthly',
      notes: 'More frequent cleaning if not bioactive',
    },
    {
      id: 'decor-clean',
      task: 'Clean perches and decorations with water (no soap)',
      category: 'monthly',
      notes: 'Prevents mold and bacteria buildup',
    },
    {
      id: 'bulb-check',
      task: `Check UVB and heat lamp for proper function`,
      category: 'monthly',
      notes: 'UVB effectiveness degrades over 6-12 months - track purchase date',
    },
    {
      id: 'scale-check',
      task: 'Weigh frog if possible (record trend)',
      category: 'monthly',
      notes: `${profile.commonName} are prone to obesity - monitor weight regularly`,
    },
    {
      id: 'calcium-dust',
      task: 'Dust feeders with calcium supplement 2-3x per week',
      category: 'monthly',
      notes: 'Essential for bone health; varies by feeding frequency',
    },
  ];

  // Bioactive-specific maintenance
  if (input.bioactive) {
    checklist.push({
      id: 'bioactive-monitoring',
      task: 'Monitor cleanup crew (springtails, isopods) population',
      category: 'monthly',
      notes: 'Top off CUC if population seems low',
    });
  }

  // Full substrate change
  checklist.push({
    id: 'substrate-full-change',
    task: `Full substrate change (every 2-3 months for non-bioactive)`,
    category: 'monthly',
    notes: input.bioactive ? 'Bioactive enclosures need less frequent changes' : 'More often if humidity issues develop',
  });

  return checklist;
}

/**
 * Generate complete husbandry checklist for an enclosure setup
 */
export function generateHusbandryCareChecklist(
  input: EnclosureInput,
  profile: AnimalProfile
): HusbandryCareChecklist {
  return {
    preBuild: generatePreBuildChecklist(input, profile),
    weeklyMaintenance: generateWeeklyMaintenance(input, profile),
    monthlyMaintenance: generateMonthlyMaintenance(input, profile),
  };
}
