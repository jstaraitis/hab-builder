/**
 * Migration script: Convert budgetTiers to setupTiers
 * Changes: low -> minimum, mid -> recommended, premium -> ideal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/equipment-catalog.json');

console.log('Reading equipment catalog...');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

let itemsUpdated = 0;

// Iterate through all equipment items
for (const [itemId, itemData] of Object.entries(catalog)) {
  if (itemData.budgetTiers) {
    // Rename budgetTiers to setupTiers
    itemData.setupTiers = {
      ...(itemData.budgetTiers.low && { minimum: itemData.budgetTiers.low }),
      ...(itemData.budgetTiers.mid && { recommended: itemData.budgetTiers.mid }),
      ...(itemData.budgetTiers.premium && { ideal: itemData.budgetTiers.premium }),
    };
    
    // Remove old budgetTiers
    delete itemData.budgetTiers;
    
    itemsUpdated++;
  }
  
  // Update purchaseLinks keys if they exist
  if (itemData.purchaseLinks) {
    const newPurchaseLinks = {};
    for (const [key, value] of Object.entries(itemData.purchaseLinks)) {
      if (key === 'low') {
        newPurchaseLinks.minimum = value;
      } else if (key === 'mid') {
        newPurchaseLinks.recommended = value;
      } else if (key === 'premium') {
        newPurchaseLinks.ideal = value;
      } else {
        newPurchaseLinks[key] = value;
      }
    }
    itemData.purchaseLinks = newPurchaseLinks;
  }
}

console.log(`Updated ${itemsUpdated} items`);
console.log('Writing updated catalog...');

// Write back with pretty formatting
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');

console.log('✅ Migration complete! budgetTiers → setupTiers');
console.log('   low → minimum');
console.log('   mid → recommended');
console.log('   premium → ideal');
