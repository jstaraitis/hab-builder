import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { createShoppingItem, getEquipment, calculateVolume } from '../utils';
import { matchesAnimalNeeds } from '../matching';

/**
 * Adds an item and its required dependencies
 */
function addItemWithDependencies(
  items: ShoppingItem[],
  itemId: string,
  config: EquipmentConfig,
  quantity: number | string,
  sizing: string,
  profile: AnimalProfile,
  input: EnclosureInput,
  overrides?: Partial<ShoppingItem>
): void {
  items.push(createShoppingItem(itemId, config, quantity, sizing, overrides));

  // Add required dependencies if not already present
  config.requiredWith?.forEach(depId => {
    const depConfig = getEquipment(depId);
    if (depConfig && matchesAnimalNeeds(depConfig, profile.equipmentNeeds, input) && !items.some(item => item.id === depId)) {
      items.push(createShoppingItem(depId, depConfig, 1, ''));
    }
  });
}

/**
 * Calculate heating wattage based on volume and temperature difference
 */
function calculateWattage(volume: number, tempDiff: number, wattsPerCubicFoot: number, minWattage = 25, maxWattage = 150): number {
  const baseWattage = volume * wattsPerCubicFoot;
  const adjustedWattage = baseWattage * (tempDiff / (wattsPerCubicFoot === 8 ? 15 : 20));
  return Math.max(minWattage, Math.min(maxWattage, Math.round(adjustedWattage)));
}

/**
 * Adds ambient heating if room temperature is insufficient
 */
export function addAmbientHeating(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  // Skip if not ambient heat source or if basking heat exists
  if (profile.equipmentNeeds?.heatSource !== 'ambient' || profile.careTargets.temperature.basking) {
    return;
  }

  const ambientTemp = input.ambientTemp || 72;
  const requiredMinTemp = profile.careTargets.temperature.warmSide?.min || profile.careTargets.temperature.coolSide?.min || 70;

  // Only add heating if room temp is below required temperature
  if (ambientTemp >= requiredMinTemp) return;

  const config = getEquipment('heat-lamp');
  if (!config) return;

  const tempDiff = requiredMinTemp - ambientTemp;
  const wattage = calculateWattage(calculateVolume(dims), tempDiff, 8, 60, 150);
  
  addItemWithDependencies(items, 'heat-lamp', config, `1 (${wattage}W estimate)`,
    `Room temperature (${ambientTemp}°F) is below required minimum (${requiredMinTemp}°F). Ceramic heat emitter (~${wattage}W) provides gentle supplemental heating without light.`,
    profile, input, {
      importance: 'required',
      notes: `Required when room temperature drops below ${requiredMinTemp}°F. Use with thermostat to maintain proper temperature range. CHE produces heat without light, ideal for nocturnal species and nighttime heating.`
    }
  );
}

/**
 * Adds heat lamp if required by animal profile
 */
export function addHeatLamp(
  items: ShoppingItem[],
  dims: { width: number; depth: number; height: number },
  profile: AnimalProfile,
  input: EnclosureInput
): void {
  if (!profile.careTargets.temperature.basking) return;

  const config = getEquipment('heat-lamp');
  if (!config || !matchesAnimalNeeds(config, profile.equipmentNeeds, input)) return;

  const volume = calculateVolume(dims);
  const baskingTemp = typeof profile.careTargets.temperature.basking === 'number' 
    ? profile.careTargets.temperature.basking 
    : profile.careTargets.temperature.basking.max || profile.careTargets.temperature.basking.min || 90;
  
  const ambientTemp = input.ambientTemp || 72;
  const tempDiff = baskingTemp - ambientTemp;
  const wattage = calculateWattage(volume, tempDiff, 20);
  
  addItemWithDependencies(items, 'heat-lamp', config, `1 (${wattage}W estimate)`,
    `Based on ${Math.round(volume)} cubic feet and ${tempDiff}°F temperature difference from ambient (${ambientTemp}°F)`,
    profile, input
  );
}
