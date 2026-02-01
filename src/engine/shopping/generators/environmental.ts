import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';

/**
 * Adds humidity control equipment based on ambient conditions
 */
export function addHumidityControl(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
  // Skip humidity control for fully aquatic animals (humidity is inherent)
  if (profile.equipmentNeeds?.activity === 'aquatic') {
    return;
  }
  
  // Need humidity control if ambient is below the animal's max humidity requirement
  const needsHumidityControl = input.ambientHumidity < (profile.careTargets.humidity.day?.max ?? 80);
  const isScreenEnclosure = input.type === 'screen';
  const humidityWarning = isScreenEnclosure && needsHumidityControl ? ' (screen loses humidity - may need larger unit)' : '';
  const volume = dims.width * dims.depth * dims.height;
  
  if (needsHumidityControl && input.humidityControl === 'manual') {
    const misterConfig = catalogDict['spray-bottle'];
    if (misterConfig) {
      const mistingFrequency = isScreenEnclosure ? '4-6 times daily' : '2-3 times daily';
      items.push({
        id: 'spray-bottle',
        category: misterConfig.category,
        name: misterConfig.name,
        quantity: '1 bottle',
        sizing: `Manual misting ${mistingFrequency} to maintain ${profile.careTargets.humidity.day?.min ?? 60}-${profile.careTargets.humidity.day?.max ?? 80}% humidity${isScreenEnclosure ? ' (more frequent due to screen material)' : ''} (current room: ${input.ambientHumidity}%)`,
        importance: 'required',
        notes: misterConfig.notes,
      });
    }
  } else if (needsHumidityControl && input.humidityControl === 'misting-system') {
    const mistingConfig = catalogDict['misting-system'];
    if (mistingConfig) {
      // Screen enclosures may need more frequent misting
      const mistingFrequency = isScreenEnclosure ? '4-5 times daily' : '2-3 times daily';
      items.push({
        id: 'misting-system',
        category: mistingConfig.category,
        name: mistingConfig.name,
        quantity: '1 system',
        sizing: `Automatic timer for ${mistingFrequency} misting to maintain ${profile.careTargets.humidity.day?.min ?? 60}-${profile.careTargets.humidity.day?.max ?? 80}% humidity${isScreenEnclosure ? ' (high frequency due to screen material)' : ''} (current room: ${input.ambientHumidity}%)`,
        importance: 'required', // Required when humidity control is needed
        notes: mistingConfig.notes,
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
        importance: 'required', // Required when humidity control is needed
        notes: humidifierConfig.notes,
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
        importance: 'required', // Required when humidity control is needed
        notes: foggerConfig.notes,
      });
    }
  }
}
