import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';

const catalogDict = catalog as Record<string, EquipmentConfig>;

/**
 * Helper to add humidity control item
 */
function addHumidityItem(
  items: ShoppingItem[],
  id: string,
  config: EquipmentConfig,
  quantity: string,
  sizing: string
): void {
  items.push({
    id,
    category: config.category,
    name: config.name,
    quantity,
    sizing,
    importance: 'required',
    notes: config.notes,
  });
}

/**
 * Adds humidity control equipment based on ambient conditions
 */
export function addHumidityControl(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  // Skip humidity control for fully aquatic animals (humidity is inherent)
  if (profile.equipmentNeeds?.activity === 'aquatic') {
    return;
  }
  
  // Need humidity control if ambient is below the animal's max humidity requirement
  const needsHumidityControl = input.ambientHumidity < (profile.careTargets.humidity.day?.max ?? 80);
  if (!needsHumidityControl) return;
  
  const isScreenEnclosure = input.type === 'screen';
  const humidityRange = `${profile.careTargets.humidity.day?.min ?? 60}-${profile.careTargets.humidity.day?.max ?? 80}%`;
  const ambientNote = ` (current room: ${input.ambientHumidity}%)`;
  const screenWarning = isScreenEnclosure ? ' (screen loses humidity - may need larger unit)' : '';
  
  switch (input.humidityControl) {
    case 'manual': {
      const config = catalogDict['spray-bottle'];
      if (config) {
        const frequency = isScreenEnclosure ? '4-6 times daily' : '2-3 times daily';
        const screenNote = isScreenEnclosure ? ' (more frequent due to screen material)' : '';
        addHumidityItem(
          items,
          'spray-bottle',
          config,
          '1 bottle',
          `Manual misting ${frequency} to maintain ${humidityRange} humidity${screenNote}${ambientNote}`
        );
      }
      break;
    }
    
    case 'misting-system': {
      const config = catalogDict['misting-system'];
      if (config) {
        const frequency = isScreenEnclosure ? '4-5 times daily' : '2-3 times daily';
        const screenNote = isScreenEnclosure ? ' (high frequency due to screen material)' : '';
        addHumidityItem(
          items,
          'misting-system',
          config,
          '1 system',
          `Automatic timer for ${frequency} misting to maintain ${humidityRange} humidity${screenNote}${ambientNote}`
        );
      }
      break;
    }
    
    case 'humidifier': {
      const config = catalogDict.humidifier;
      if (config) {
        const sizeMultiplier = isScreenEnclosure ? 1.5 : 1;
        const cubicFeet = Math.round((dims.width * dims.depth * dims.height) / 1728);
        const targetSize = Math.round(cubicFeet * sizeMultiplier);
        const humidityRangeSimple = `${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}%`;
        addHumidityItem(
          items,
          'humidifier',
          config,
          '1 unit',
          `Sized for ${targetSize}+ cubic feet to reach ${humidityRangeSimple} humidity${screenWarning}${ambientNote}`
        );
      }
      break;
    }
    
    case 'fogger': {
      const config = catalogDict.fogger;
      if (config) {
        const humidityRangeSimple = `${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}%`;
        addHumidityItem(
          items,
          'fogger',
          config,
          '1 unit',
          `Ultrasonic fogger for ${humidityRangeSimple} humidity${screenWarning}${ambientNote}`
        );
      }
      break;
    }
  }
}
