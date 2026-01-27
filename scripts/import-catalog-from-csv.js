/**
 * Import CSV back to equipment catalog JSON
 * Run: node scripts/import-catalog-from-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../equipment-catalog.csv');
const equipmentDir = path.join(__dirname, '../src/data/equipment');

// Category mapping - determines which file each item belongs to
const categoryMap = {
  'enclosure': 'enclosures.json',
  'substrate': 'substrate.json',
  'cleanup_crew': 'cleanup-crew.json',
  'equipment': null, // Will be determined by item ID
  'decor': 'decor.json'
};

// Special handling for equipment category (split into multiple files)
const equipmentFileMap = {
  'uvb-fixture-forest': 'lighting.json',
  'uvb-fixture-desert': 'lighting.json',
  'plant-light': 'lighting.json',
  'heat-lamp': 'heating.json',
  'misting-system': 'humidity.json',
  'humidifier': 'humidity.json',
  'fogger': 'humidity.json',
  'spray-bottle': 'humidity.json',
  'monitoring': 'monitoring.json',
  'water-bowl': 'monitoring.json',
  'dechlorinator': 'monitoring.json',
  'calcium': 'nutrition.json',
  'multivitamin': 'nutrition.json',
  'feeding-tongs': 'nutrition.json',
  'feeder-insects': 'nutrition.json'
};

// Read CSV file
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = parseCSV(csvContent);

// Remove header
const headers = lines.shift();

// Convert CSV rows back to JSON, organized by category file
const catalogsByFile = {};

lines.forEach(row => {
  if (row.length < 2) return; // Skip empty rows

  const [
    id,
    name,
    category,
    setup_minimum,
    setup_recommended,
    setup_ideal,
    notes,
    sizing,
    infoLink1_label,
    infoLink1_url,
    infoLink2_label,
    infoLink2_url,
    infoLink3_label,
    infoLink3_url,
    purchaseLink_minimum,
    purchaseLink_recommended,
    purchaseLink_ideal
  ] = row;

  if (!id || !name) return; // Skip invalid rows

  const item = {
    name,
    category,
  };

  // Add setupTiers if any exist
  if (setup_minimum || setup_recommended || setup_ideal) {
    item.setupTiers = {};
    if (setup_minimum) item.setupTiers.minimum = setup_minimum;
    if (setup_recommended) item.setupTiers.recommended = setup_recommended;
    if (setup_ideal) item.setupTiers.ideal = setup_ideal;
  }

  // Add notes if exists
  if (notes) item.notes = notes;

  // Add sizing if exists
  if (sizing) item.sizing = sizing;

  // Add infoLinks if any exist
  const infoLinks = {};
  if (infoLink1_label && infoLink1_url) infoLinks[infoLink1_label] = infoLink1_url;
  if (infoLink2_label && infoLink2_url) infoLinks[infoLink2_label] = infoLink2_url;
  if (infoLink3_label && infoLink3_url) infoLinks[infoLink3_label] = infoLink3_url;
  if (Object.keys(infoLinks).length > 0) item.infoLinks = infoLinks;

  // Add purchaseLinks if any exist
  if (purchaseLink_minimum || purchaseLink_recommended || purchaseLink_ideal) {
    item.purchaseLinks = {};
    if (purchaseLink_minimum) item.purchaseLinks.minimum = purchaseLink_minimum;
    if (purchaseLink_recommended) item.purchaseLinks.recommended = purchaseLink_recommended;
    if (purchaseLink_ideal) item.purchaseLinks.ideal = purchaseLink_ideal;
  }

  // Determine which file this item belongs to
  let targetFile;
  if (category === 'equipment') {
    targetFile = equipmentFileMap[id];
    if (!targetFile) {
      console.warn(`⚠️  Unknown equipment item: ${id}, defaulting to monitoring.json`);
      targetFile = 'monitoring.json';
    }
  } else {
    targetFile = categoryMap[category] || 'decor.json';
  }

  // Initialize file if needed
  if (!catalogsByFile[targetFile]) {
    catalogsByFile[targetFile] = {};
  }

  catalogsByFile[targetFile][id] = item;
});

// Write each category file
let totalItems = 0;
Object.entries(catalogsByFile).forEach(([filename, catalog]) => {
  const filePath = path.join(equipmentDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2), 'utf-8');
  const itemCount = Object.keys(catalog).length;
  totalItems += itemCount;
  console.log(`✅ Wrote ${itemCount} items to ${filename}`);
});

console.log(`🎉 Successfully imported ${totalItems} total items across ${Object.keys(catalogsByFile).length} category files!`);

// Helper function to parse CSV (handles quoted fields with commas)
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      // End of row
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      // Skip \r if present
      if (nextChar === '\r') i++;
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      // Windows line ending
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i++; // Skip \n
    } else {
      currentField += char;
    }
  }

  // Push last field and row if not empty
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}
