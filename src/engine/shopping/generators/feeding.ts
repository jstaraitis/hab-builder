import type { ShoppingItem, AnimalProfile, EnclosureInput, EquipmentConfig } from '../../types';
import { catalog } from '../utils';
import { matchesAnimalNeeds } from '../matching';

/**
 * Adds feeding supplies and supplements
 */
export function addFeedingSupplies(items: ShoppingItem[], input: EnclosureInput, profile: AnimalProfile): void {
  const catalogDict = catalog as Record<string, EquipmentConfig>;
  
  // Feeder insects (only add if compatible with selected animal)
  const insectsConfig = catalogDict['feeder-insects'];
  if (insectsConfig && matchesAnimalNeeds(insectsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'feeder-insects',
      category: insectsConfig.category,
      name: insectsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Size appropriate for animal',
      importance: insectsConfig.importance,
      setupTierOptions: insectsConfig.tiers,
      notes: insectsConfig.notes,
      incompatibleAnimals: insectsConfig.incompatibleAnimals,
      ...(insectsConfig.isRecurring && { isRecurring: insectsConfig.isRecurring }),
      ...(insectsConfig.recurringInterval && { recurringInterval: insectsConfig.recurringInterval }),
    });
  }

  // Calcium supplement (only add if compatible with selected animal)
  const calciumConfig = catalogDict['calcium'];
  if (calciumConfig && matchesAnimalNeeds(calciumConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'calcium',
      category: calciumConfig.category,
      name: calciumConfig.name,
      quantity: '1 container',
      sizing: 'Dust following product instructions',
      importance: calciumConfig.importance,
      setupTierOptions: calciumConfig.tiers,
      notes: calciumConfig.notes,
      incompatibleAnimals: calciumConfig.incompatibleAnimals,
      ...(calciumConfig.isRecurring && { isRecurring: calciumConfig.isRecurring }),
      ...(calciumConfig.recurringInterval && { recurringInterval: calciumConfig.recurringInterval }),
    });
  }

  // Multivitamin (only add if compatible with selected animal)
  const multivitaminConfig = catalogDict['multivitamin'];
  if (multivitaminConfig && matchesAnimalNeeds(multivitaminConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'multivitamin',
      category: multivitaminConfig.category,
      name: multivitaminConfig.name,
      quantity: '1 container',
      sizing: 'Dust following product instructions',
      importance: multivitaminConfig.importance,
      setupTierOptions: multivitaminConfig.tiers,
      ...(multivitaminConfig.isRecurring && { isRecurring: multivitaminConfig.isRecurring }),
      ...(multivitaminConfig.recurringInterval && { recurringInterval: multivitaminConfig.recurringInterval }),
      notes: multivitaminConfig.notes,
      incompatibleAnimals: multivitaminConfig.incompatibleAnimals,
    });
  }

  // Fresh vegetables & fruits (only add if compatible with selected animal - omnivores)
  const vegetablesConfig = catalogDict['fresh-vegetables-fruits'];
  if (vegetablesConfig && matchesAnimalNeeds(vegetablesConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'fresh-vegetables-fruits',
      category: vegetablesConfig.category,
      name: vegetablesConfig.name,
      quantity: 'Daily supply',
      sizing: 'Fresh vegetables daily, fruits as treats',
      importance: vegetablesConfig.importance,
      setupTierOptions: vegetablesConfig.tiers,
      ...(vegetablesConfig.isRecurring && { isRecurring: vegetablesConfig.isRecurring }),
      ...(vegetablesConfig.recurringInterval && { recurringInterval: vegetablesConfig.recurringInterval }),
      notes: vegetablesConfig.notes,
      incompatibleAnimals: vegetablesConfig.incompatibleAnimals,
    });
  }

  // Feeding tongs (universal)
  const tongsConfig = catalogDict['feeding-tongs'];
  if (tongsConfig) {
    items.push({
      id: 'feeding-tongs',
      category: tongsConfig.category,
      name: tongsConfig.name,
      quantity: '1 pair',
      sizing: 'For safe feeding',
      importance: tongsConfig.importance,
      setupTierOptions: tongsConfig.tiers,
      notes: tongsConfig.notes,
      incompatibleAnimals: tongsConfig.incompatibleAnimals,
    });
  }

  // Frozen rodents (only for carnivores)
  const rodentsConfig = catalogDict['frozen-rodents'];
  if (rodentsConfig && matchesAnimalNeeds(rodentsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'frozen-rodents',
      category: rodentsConfig.category,
      name: rodentsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Size appropriate for snake',
      importance: rodentsConfig.importance,
      setupTierOptions: rodentsConfig.tiers,
      notes: rodentsConfig.notes,
      incompatibleAnimals: rodentsConfig.incompatibleAnimals,
      ...(rodentsConfig.isRecurring && { isRecurring: rodentsConfig.isRecurring }),
      ...(rodentsConfig.recurringInterval && { recurringInterval: rodentsConfig.recurringInterval }),
    });
  }

  // Long feeding tongs (only for carnivores - snakes)
  const longTongsConfig = catalogDict['feeding-tongs-long'];
  if (longTongsConfig && matchesAnimalNeeds(longTongsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'feeding-tongs-long',
      category: longTongsConfig.category,
      name: longTongsConfig.name,
      quantity: '1 pair',
      sizing: '12-16" for safe distance',
      importance: longTongsConfig.importance,
      setupTierOptions: longTongsConfig.tiers,
      notes: longTongsConfig.notes,
      incompatibleAnimals: longTongsConfig.incompatibleAnimals,
    });
  }

  // Kitchen scale (only for carnivores - track snake weight)
  const scaleConfig = catalogDict['kitchen-scale'];
  if (scaleConfig && matchesAnimalNeeds(scaleConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'kitchen-scale',
      category: scaleConfig.category,
      name: scaleConfig.name,
      quantity: '1',
      sizing: 'For tracking weight',
      importance: scaleConfig.importance,
      setupTierOptions: scaleConfig.tiers,
      notes: scaleConfig.notes,
      incompatibleAnimals: scaleConfig.incompatibleAnimals,
    });
  }

  // Nitrile gloves (only for amphibians)
  const glovesConfig = catalogDict['nitrile-gloves'];
  if (glovesConfig && matchesAnimalNeeds(glovesConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'nitrile-gloves',
      category: glovesConfig.category,
      name: glovesConfig.name,
      quantity: '1 box',
      sizing: 'Powder-free for animal safety',
      importance: glovesConfig.importance,
      setupTierOptions: glovesConfig.tiers,
      notes: glovesConfig.notes,
      incompatibleAnimals: glovesConfig.incompatibleAnimals,
    });
  }

  // Gecko fruit diet (only for frugivorous/omnivorous geckos)
  const geckoFruitConfig = catalogDict['gecko-fruit-diet'];
  if (geckoFruitConfig && matchesAnimalNeeds(geckoFruitConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'gecko-fruit-diet',
      category: geckoFruitConfig.category,
      name: geckoFruitConfig.name,
      quantity: '1 container',
      sizing: 'Mix with water per instructions',
      importance: geckoFruitConfig.importance,
      setupTierOptions: geckoFruitConfig.tiers,
      notes: geckoFruitConfig.notes,
      incompatibleAnimals: geckoFruitConfig.incompatibleAnimals,
      ...(geckoFruitConfig.isRecurring && { isRecurring: geckoFruitConfig.isRecurring }),
      ...(geckoFruitConfig.recurringInterval && { recurringInterval: geckoFruitConfig.recurringInterval }),
    });
  }

  // Appropriately-sized insects for geckos
  const geckoInsectsConfig = catalogDict['insects-for-geckos'];
  if (geckoInsectsConfig && matchesAnimalNeeds(geckoInsectsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'insects-for-geckos',
      category: geckoInsectsConfig.category,
      name: geckoInsectsConfig.name,
      quantity: 'Ongoing supply',
      sizing: '1/3 to 1/2 gecko head width',
      importance: geckoInsectsConfig.importance,
      setupTierOptions: geckoInsectsConfig.tiers,
      notes: geckoInsectsConfig.notes,
      incompatibleAnimals: geckoInsectsConfig.incompatibleAnimals,
      ...(geckoInsectsConfig.isRecurring && { isRecurring: geckoInsectsConfig.isRecurring }),
      ...(geckoInsectsConfig.recurringInterval && { recurringInterval: geckoInsectsConfig.recurringInterval }),
    });
  }

  // Axolotl pellets (only for aquatic carnivores)
  const axolotlPelletsConfig = catalogDict['axolotl-pellets'];
  if (axolotlPelletsConfig && matchesAnimalNeeds(axolotlPelletsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'axolotl-pellets',
      category: axolotlPelletsConfig.category,
      name: axolotlPelletsConfig.name,
      quantity: '1 container',
      sizing: 'Daily staple food',
      importance: axolotlPelletsConfig.importance,
      setupTierOptions: axolotlPelletsConfig.tiers,
      notes: axolotlPelletsConfig.notes,
      incompatibleAnimals: axolotlPelletsConfig.incompatibleAnimals,
      ...(axolotlPelletsConfig.isRecurring && { isRecurring: axolotlPelletsConfig.isRecurring }),
      ...(axolotlPelletsConfig.recurringInterval && { recurringInterval: axolotlPelletsConfig.recurringInterval }),
    });
  }

  // Earthworms (only for aquatic carnivores)
  const earthwormsConfig = catalogDict['earthworms'];
  if (earthwormsConfig && matchesAnimalNeeds(earthwormsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'earthworms',
      category: earthwormsConfig.category,
      name: earthwormsConfig.name,
      quantity: 'Ongoing supply',
      sizing: 'Cut into bite-sized pieces for juveniles',
      importance: earthwormsConfig.importance,
      setupTierOptions: earthwormsConfig.tiers,
      notes: earthwormsConfig.notes,
      incompatibleAnimals: earthwormsConfig.incompatibleAnimals,
      ...(earthwormsConfig.isRecurring && { isRecurring: earthwormsConfig.isRecurring }),
      ...(earthwormsConfig.recurringInterval && { recurringInterval: earthwormsConfig.recurringInterval }),
    });
  }

  // Frozen bloodworms (only for aquatic carnivores)
  const bloodwormsConfig = catalogDict['frozen-bloodworms'];
  if (bloodwormsConfig && matchesAnimalNeeds(bloodwormsConfig, profile.equipmentNeeds, input)) {
    items.push({
      id: 'frozen-bloodworms',
      category: bloodwormsConfig.category,
      name: bloodwormsConfig.name,
      quantity: 'Weekly supply',
      sizing: '2-3 times per week as treats',
      importance: bloodwormsConfig.importance,
      setupTierOptions: bloodwormsConfig.tiers,
      notes: bloodwormsConfig.notes,
      incompatibleAnimals: bloodwormsConfig.incompatibleAnimals,
      ...(bloodwormsConfig.isRecurring && { isRecurring: bloodwormsConfig.isRecurring }),
      ...(bloodwormsConfig.recurringInterval && { recurringInterval: bloodwormsConfig.recurringInterval }),
    });
  }
}
