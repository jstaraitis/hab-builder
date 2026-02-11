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
  // Add the main item
  items.push(createShoppingItem(itemId, config, quantity, sizing, overrides));

  // Add required dependencies
  if (config.requiredWith && Array.isArray(config.requiredWith)) {
    for (const depId of config.requiredWith) {
      const depConfig = getEquipment(depId);
      if (depConfig && matchesAnimalNeeds(depConfig, profile.equipmentNeeds, input)) {
        // Check if not already added
        if (!items.some(item => item.id === depId)) {
          items.push(createShoppingItem(depId, depConfig, 1, ''));
        }
      }
    }
  }
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
  // Skip if not ambient heat source or if basking heat exists (handled by addHeatLamp)
  if (profile.equipmentNeeds?.heatSource !== 'ambient' || profile.careTargets.temperature.basking) {
    return;
  }

  const ambientTemp = input.ambientTemp || 72;
  const requiredMinTemp = profile.careTargets.temperature.warmSide?.min || 
                          profile.careTargets.temperature.coolSide?.min || 
                          70;

  // Only add heating if room temp is below required temperature
  if (ambientTemp >= requiredMinTemp) {
    return;
  }

  const config = getEquipment('heat-lamp');
  if (!config) return;

  const tempDifference = requiredMinTemp - ambientTemp;
  const volume = calculateVolume(dims);
  
  // CHE wattage calculation (gentle heating for ambient supplementation)
  const baseWattage = volume * 8; // 8W per cubic foot for CHE
  const wattage = Math.max(60, Math.min(150, Math.round(baseWattage * (tempDifference / 15))));
  
  const sizing = `Room temperature (${ambientTemp}°F) is below required minimum (${requiredMinTemp}°F). Ceramic heat emitter (~${wattage}W) provides gentle supplemental heating without light.`;
  
  // Add CHE with automatic dependencies (ceramic dome fixture, thermostat)
  addItemWithDependencies(items, 'heat-lamp', config, `1 (${wattage}W estimate)`, sizing, profile, input, {
    importance: 'required',
    notes: `Required when room temperature drops below ${requiredMinTemp}°F. Use with thermostat to maintain proper temperature range. CHE produces heat without light, ideal for nocturnal species and nighttime heating.`
  });
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

  // Calculate wattage based on temperature difference and enclosure volume
  const volume = calculateVolume(dims);
  
  // Handle basking temp as either number or object with min/max
  const baskingTemp = typeof profile.careTargets.temperature.basking === 'number' 
    ? profile.careTargets.temperature.basking 
    : profile.careTargets.temperature.basking.max || profile.careTargets.temperature.basking.min || 90;
  
  const ambientTemp = input.ambientTemp || 72; // Default to 72°F if not specified
  const tempDifference = baskingTemp - ambientTemp;
  const baseWattage = volume * 20; // 20W per cubic foot as baseline
  const wattage = Math.max(25, Math.min(150, Math.round(baseWattage * (tempDifference / 20))));
  
  const sizing = `Based on ${Math.round(volume)} cubic feet and ${tempDifference}°F temperature difference from ambient (${ambientTemp}°F)`;
  
  // Add CHE with automatic dependencies (dome-fixture, thermostat)
  addItemWithDependencies(items, 'heat-lamp', config, `1 (${wattage}W estimate)`, sizing, profile, input);
}
