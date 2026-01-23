/**
 * Migration script: Restructure equipment catalog with detailed tier descriptions
 * Changes:
 * - setupTiers -> tiers (with description objects)
 * - Remove placeholder infoLinks and purchaseLinks
 * - Add importance and spec fields where applicable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/equipment-catalog.json');

console.log('Reading equipment catalog...');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// Equipment specifications and importance mapping
const equipmentSpecs = {
  'uvb-fixture': {
    importance: 'required',
    spec: {
      coverage: '60-80% of enclosure width',
      type: 'T5 HO',
      strength: 'forest'
    }
  },
  'heat-lamp': {
    importance: 'required',
    spec: {
      type: 'Ceramic Heat Emitter (CHE)',
      wattage: '75-150W',
      control: 'thermostat required'
    }
  },
  'monitoring': {
    importance: 'required',
    spec: {
      measures: 'temperature and humidity',
      placement: 'warm and cool zones'
    }
  },
  'substrate-bioactive': {
    importance: 'conditional',
    spec: {
      depth: '3-4 inches',
      type: 'ABG mix or equivalent'
    }
  },
  'drainage': {
    importance: 'conditional',
    spec: {
      depth: '1-3 inches',
      material: 'LECA or clay balls'
    }
  },
  'misting-system': {
    importance: 'optional',
    spec: {
      type: 'automated',
      schedule: 'programmable'
    }
  }
};

let itemsUpdated = 0;

// Restructure each equipment item
for (const [itemId, itemData] of Object.entries(catalog)) {
  const newItem = {
    name: itemData.name,
    category: itemData.category,
    compatibleAnimals: itemData.compatibleAnimals || []
  };

  // Add importance if available
  if (equipmentSpecs[itemId]?.importance) {
    newItem.importance = equipmentSpecs[itemId].importance;
  }

  // Add spec if available
  if (equipmentSpecs[itemId]?.spec) {
    newItem.spec = equipmentSpecs[itemId].spec;
  }

  // Convert setupTiers to new tier structure
  if (itemData.setupTiers) {
    newItem.tiers = {};
    
    for (const [tierName, tierValue] of Object.entries(itemData.setupTiers)) {
      newItem.tiers[tierName] = {
        description: tierValue
      };
    }
  }

  // Keep notes
  if (itemData.notes) {
    newItem.notes = itemData.notes;
  }

  catalog[itemId] = newItem;
  itemsUpdated++;
}

console.log(`Restructured ${itemsUpdated} items`);
console.log('Writing updated catalog...');

// Write back with pretty formatting
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');

console.log('✅ Migration complete!');
console.log('   - Removed infoLinks and purchaseLinks');
console.log('   - setupTiers → tiers with description objects');
console.log('   - Added importance and spec fields where applicable');
