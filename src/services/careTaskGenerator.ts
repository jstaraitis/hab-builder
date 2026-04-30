import type { AnimalProfile } from '../engine/types';

export interface GeneratedTask {
  type: string;
  title: string;
  description: string;
  frequency: string;
  scheduledTime: string;
}

export interface TaskGenerationOptions {
  isBioactive: boolean;
  hasUVB?: boolean; // Override: enclosure has a UVB bulb installed regardless of profile
  enclosureSize?: 'small' | 'medium' | 'large';
  animalCount?: number;
}

/**
 * Dynamically generates care tasks from animal profile data
 * This replaces static care-templates/*.json files with intelligent task generation
 */
export function generateCareTasks(
  profile: AnimalProfile,
  options: TaskGenerationOptions = { isBioactive: false }
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  // === FEEDING TASKS ===
  const feedingTask = generateFeedingTask(profile);
  if (feedingTask) tasks.push(feedingTask);

  // === WATER TASKS ===
  const waterTask = generateWaterTask(profile);
  if (waterTask) tasks.push(waterTask);

  // === HUMIDITY/MISTING TASKS ===
  const mistingTask = generateMistingTask(profile);
  if (mistingTask) tasks.push(mistingTask);

  // === SPOT CLEANING ===
  tasks.push({
    type: 'spot-clean',
    title: 'Spot Clean',
    description: 'Remove any feces, uneaten food, or dead feeders. Check for mold on decor.',
    frequency: 'daily',
    scheduledTime: '09:00'
  });

  // === HEALTH CHECK ===
  const healthCheck = generateHealthCheckTask(profile);
  if (healthCheck) tasks.push(healthCheck);

  // === SUPPLEMENTS ===
  const supplementTask = generateSupplementTask(profile);
  if (supplementTask) tasks.push(supplementTask);

  // === DEEP CLEAN (non-bioactive only) ===
  if (!options.isBioactive) {
    tasks.push({
      type: 'deep-clean',
      title: 'Deep Clean Enclosure',
      description: `Remove ${profile.commonName} to temporary container. Clean all glass, decor, and plants. Replace substrate. Sanitize with reptile-safe cleaner.`,
      frequency: 'monthly',
      scheduledTime: '10:00'
    });
  }

  // === ENVIRONMENT MONITORING ===
  tasks.push(generateTemperatureCheckTask(profile));

  const humidityCheck = generateHumidityCheckTask(profile);
  if (humidityCheck) tasks.push(humidityCheck);

  const uvbCheck = generateUvbCheckTask(profile, options.hasUVB);
  if (uvbCheck) tasks.push(uvbCheck);

  // === BIOACTIVE-SPECIFIC TASKS ===
  if (options.isBioactive) {
    tasks.push(
      generateSubstrateCheckTask(),
      generateMoldCheckTask(),
      generateCleanupCrewCheckTask(),
      generatePlantCareTask(),
      generatePestCheckTask()
    );
  }

  // === GUT-LOADING (insectivore feeders) ===
  const gutLoadTask = generateGutLoadTask(profile);
  if (gutLoadTask) tasks.push(gutLoadTask);

  return tasks;
}

// === TASK GENERATORS ===

function generateFeedingTask(profile: AnimalProfile): GeneratedTask | null {
  const { dietType, careGuidance } = profile;

  if (!dietType) return null;

  // Determine feeding frequency from animal type and guidance
  let frequency = 'every-other-day';
  let description = '';
  
  if (dietType === 'Insectivore') {
    // Check for specific feeding schedule
    if (careGuidance?.feedingSchedule && careGuidance.feedingSchedule.length > 0) {
      // Use adult schedule as default
      const adultSchedule = careGuidance.feedingSchedule.find(s => 
        s.toLowerCase().includes('adult')
      ) || careGuidance.feedingSchedule[careGuidance.feedingSchedule.length - 1];
      
      description = adultSchedule;
      
      // Parse frequency from schedule
      if (adultSchedule.toLowerCase().includes('nightly') || adultSchedule.toLowerCase().includes('every night')) {
        frequency = 'daily';
      } else if (adultSchedule.toLowerCase().includes('every other day')) {
        frequency = 'every-other-day';
      } else if (adultSchedule.toLowerCase().includes('every two to three days') || adultSchedule.toLowerCase().includes('2-3 days')) {
        frequency = 'every-other-day'; // Default to every-other-day for 2-3 day ranges
      } else if (adultSchedule.toLowerCase().includes('weekly') || adultSchedule.toLowerCase().includes('once a week')) {
        frequency = 'weekly';
      }
    } else {
      description = 'Offer appropriately-sized insects. Dust with calcium powder.';
    }

    // Add specific guidance if available
    if (careGuidance?.feedingRequirements && careGuidance.feedingRequirements.length > 0) {
      const nightFeedingNote = careGuidance.feedingRequirements.find(r => 
        r.toLowerCase().includes('night') || r.toLowerCase().includes('darkness')
      );
      if (nightFeedingNote) {
        description += ' ' + nightFeedingNote;
      }
    }

    return {
      type: 'feeding',
      title: 'Feed Insects',
      description: description || 'Offer appropriately-sized insects. Dust with calcium powder.',
      frequency,
      scheduledTime: '20:00' // Evening feeding for most insectivores
    };
  }

  if (dietType === 'Herbivore') {
    return {
      type: 'feeding',
      title: 'Feed Fresh Vegetables',
      description: 'Offer fresh greens and vegetables. Remove uneaten food after 12 hours.',
      frequency: 'daily',
      scheduledTime: '09:00'
    };
  }

  if (dietType === 'Omnivore') {
    return {
      type: 'feeding',
      title: 'Feed Balanced Diet',
      description: 'Offer appropriate mix of protein and vegetation based on species needs.',
      frequency: 'daily',
      scheduledTime: '09:00'
    };
  }

  return null;
}

function generateWaterTask(profile: AnimalProfile): GeneratedTask | null {
  const { equipmentNeeds, careGuidance } = profile;

  // Determine water feature type
  const hasWaterDish = equipmentNeeds?.waterFeature?.includes('dish') || 
                       equipmentNeeds?.waterFeature?.includes('bowl');

  if (!hasWaterDish) {
    return null; // Aquatic species or species without water dishes
  }

  let description = 'Replace water in dish with dechlorinated water. Clean dish if soiled.';
  
  // Add specific water notes from profile
  if (careGuidance?.waterNotes && careGuidance.waterNotes.length > 0) {
    const waterType = careGuidance.waterNotes.find(n => 
      n.toLowerCase().includes('tap water') || 
      n.toLowerCase().includes('spring water') ||
      n.toLowerCase().includes('distilled')
    );
    if (waterType) {
      description += ' ' + waterType;
    }
  }

  return {
    type: 'water-change',
    title: 'Change Water Dish',
    description,
    frequency: 'daily',
    scheduledTime: '09:00'
  };
}

function generateMistingTask(profile: AnimalProfile): GeneratedTask | null {
  const { careTargets, warnings } = profile;

  // Check if this is a LOW humidity species (like White's Tree Frog)
  const hasLowHumidityWarning = warnings?.some(w => 
    w.message.toLowerCase().includes('do not use misters') ||
    w.message.toLowerCase().includes('semi-arid') ||
    w.message.toLowerCase().includes('no higher')
  );

  if (hasLowHumidityWarning) {
    // Don't generate daily misting for semi-arid species
    return null;
  }

  // Check humidity requirements
  const dayHumidity = careTargets?.humidity?.day;
  if (!dayHumidity) return null;

  const avgHumidity = (dayHumidity.min + dayHumidity.max) / 2;

  if (avgHumidity < 50) {
    // Low humidity - light misting
    return {
      type: 'misting',
      title: 'Light Misting',
      description: 'Lightly mist one corner of enclosure if humidity drops too low. Ensure proper ventilation.',
      frequency: 'as-needed',
      scheduledTime: '09:00'
    };
  } else if (avgHumidity >= 50 && avgHumidity < 70) {
    // Moderate humidity
    return {
      type: 'misting',
      title: 'Daily Misting',
      description: `Mist enclosure to maintain ${dayHumidity.min}-${dayHumidity.max}% humidity. Focus on plants and surfaces.`,
      frequency: 'daily',
      scheduledTime: '09:00'
    };
  } else {
    // High humidity - multiple mistings
    return {
      type: 'misting',
      title: 'Mist Morning & Evening',
      description: `Mist enclosure thoroughly to maintain ${dayHumidity.min}-${dayHumidity.max}% humidity. Create water droplets for drinking.`,
      frequency: 'twice-daily',
      scheduledTime: '09:00'
    };
  }
}

function generateHealthCheckTask(profile: AnimalProfile): GeneratedTask | null {
  const { warnings } = profile;

  let description = 'Observe behavior, skin condition, eating habits, and activity level.';
  
  // Add species-specific health concerns from warnings
  const healthWarnings = warnings?.filter(w => 
    w.severity === 'critical' || w.severity === 'important'
  ).map(w => w.message);

  if (healthWarnings && healthWarnings.length > 0) {
    // Add obesity check if mentioned
    if (healthWarnings.some(w => w.toLowerCase().includes('obesity'))) {
      description += ' Check for signs of obesity or weight issues.';
    }
    
    // Add respiratory check if mentioned
    if (healthWarnings.some(w => w.toLowerCase().includes('respiratory'))) {
      description += ' Watch for respiratory issues or labored breathing.';
    }

    // Add MBD check if UVB required
    if (profile.careTargets?.lighting?.uvbRequired) {
      description += ' Check for signs of MBD, lethargy.';
    }
  }

  return {
    type: 'health-check',
    title: 'Health Check',
    description,
    frequency: 'twice-weekly',
    scheduledTime: '20:00'
  };
}

function generateSupplementTask(profile: AnimalProfile): GeneratedTask | null {
  const { dietType, careGuidance } = profile;

  if (dietType !== 'Insectivore') return null;

  let description = 'Dust feeders with reptile multivitamin powder (Repashy Calcium Plus or similar).';
  
  // Check for specific supplement guidance
  if (careGuidance?.feedingRequirements) {
    const supplementNote = careGuidance.feedingRequirements.find(r => 
      r.toLowerCase().includes('calcium') || 
      r.toLowerCase().includes('supplement') ||
      r.toLowerCase().includes('dust')
    );
    if (supplementNote) {
      description = supplementNote;
    }
  }

  return {
    type: 'supplement',
    title: 'Multivitamin Supplement',
    description,
    frequency: 'weekly',
    scheduledTime: '20:00'
  };
}

function generateTemperatureCheckTask(profile: AnimalProfile): GeneratedTask {
  const careTargets = profile.careTargets?.temperature;
  let description = 'Verify basking spot and cool zone temperatures are within target range.';

  if (careTargets?.basking && typeof careTargets.basking === 'object') {
    const b = careTargets.basking as { min: number; max: number };
    description = `Check basking spot (target ${b.min}–${b.max}°F) and ambient cool side. Adjust heating if needed.`;
  }

  return {
    type: 'temperature-check',
    title: 'Check Temperatures',
    description,
    frequency: 'daily',
    scheduledTime: '09:00'
  };
}

function generateHumidityCheckTask(profile: AnimalProfile): GeneratedTask | null {
  const dayHumidity = profile.careTargets?.humidity?.day;
  if (!dayHumidity) return null;

  return {
    type: 'humidity-check',
    title: 'Check Humidity',
    description: `Verify humidity is within ${dayHumidity.min}–${dayHumidity.max}%. Mist or adjust ventilation as needed.`,
    frequency: 'daily',
    scheduledTime: '09:00'
  };
}

function generateUvbCheckTask(profile: AnimalProfile, hasUVB?: boolean): GeneratedTask | null {
  if (!profile.careTargets?.lighting?.uvbRequired && !hasUVB) return null;

  return {
    type: 'uvb-check',
    title: 'Check UVB Output',
    description: 'Verify UVB bulb is functioning. UVB output degrades before the bulb burns out — replace every 6–12 months even if still lit.',
    frequency: 'weekly',
    scheduledTime: '09:00'
  };
}

function generateSubstrateCheckTask(): GeneratedTask {
  return {
    type: 'substrate-check',
    title: 'Substrate Health Check',
    description: 'Check substrate moisture level and compaction. Lightly aerate if needed. Look for mold pockets or dead spots.',
    frequency: 'weekly',
    scheduledTime: '10:00'
  };
}

function generateMoldCheckTask(): GeneratedTask {
  return {
    type: 'mold-check',
    title: 'Mold Inspection',
    description: 'Inspect substrate surface, decor, and cork for mold growth. White fuzzy mold on substrate is usually harmless — remove visible patches. Green/black mold on decor needs spot cleaning.',
    frequency: 'weekly',
    scheduledTime: '10:00'
  };
}

function generateCleanupCrewCheckTask(): GeneratedTask {
  return {
    type: 'cleanup-crew-check',
    title: 'Cleanup Crew Check',
    description: 'Check springtail and isopod population. Look for activity on the substrate surface. Add a small amount of food (dried mushroom, leaf litter) to support CUC numbers if activity seems low.',
    frequency: 'monthly',
    scheduledTime: '10:00'
  };
}

function generatePlantCareTask(): GeneratedTask {
  return {
    type: 'plant-care',
    title: 'Live Plant Care',
    description: 'Trim dead leaves, check for yellowing or pests. Rotate plants toward light if needed. Remove any dead plant matter promptly to prevent mold.',
    frequency: 'weekly',
    scheduledTime: '10:00'
  };
}

function generatePestCheckTask(): GeneratedTask {
  return {
    type: 'pest-check',
    title: 'Pest Inspection',
    description: 'Inspect enclosure for unwanted pests (mites, fungus gnats, drain flies). Check around drainage layer and under cork/decor. Early detection prevents infestations.',
    frequency: 'weekly',
    scheduledTime: '10:00'
  };
}

function generateGutLoadTask(profile: AnimalProfile): GeneratedTask | null {
  if (profile.dietType !== 'Insectivore') return null;

  return {
    type: 'gut-load',
    title: 'Gut-Load Feeders',
    description: 'Feed feeder insects nutritious gut-load diet (leafy greens, carrots, squash) 24 hours before offering to your animal. Well gut-loaded feeders pass on more nutrients.',
    frequency: 'every-other-day',
    scheduledTime: '09:00'
  };
}
