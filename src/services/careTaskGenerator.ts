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
