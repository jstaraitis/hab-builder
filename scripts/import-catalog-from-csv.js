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
const outputPath = path.join(__dirname, '../src/data/equipment-catalog.json');

// Read CSV file
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = parseCSV(csvContent);

// Remove header
const headers = lines.shift();

// Convert CSV rows back to JSON
const catalog = {};

lines.forEach(row => {
  if (row.length < 2) return; // Skip empty rows

  const [
    id,
    name,
    category,
    budget_low,
    budget_mid,
    budget_premium,
    notes,
    sizing,
    infoLink1_label,
    infoLink1_url,
    infoLink2_label,
    infoLink2_url,
    infoLink3_label,
    infoLink3_url,
    purchaseLink_low,
    purchaseLink_mid,
    purchaseLink_premium
  ] = row;

  if (!id || !name) return; // Skip invalid rows

  const item = {
    name,
    category,
  };

  // Add budgetTiers if any exist
  if (budget_low || budget_mid || budget_premium) {
    item.budgetTiers = {};
    if (budget_low) item.budgetTiers.low = budget_low;
    if (budget_mid) item.budgetTiers.mid = budget_mid;
    if (budget_premium) item.budgetTiers.premium = budget_premium;
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
  if (purchaseLink_low || purchaseLink_mid || purchaseLink_premium) {
    item.purchaseLinks = {};
    if (purchaseLink_low) item.purchaseLinks.low = purchaseLink_low;
    if (purchaseLink_mid) item.purchaseLinks.mid = purchaseLink_mid;
    if (purchaseLink_premium) item.purchaseLinks.premium = purchaseLink_premium;
  }

  catalog[id] = item;
});

// Write JSON file with pretty formatting
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');
console.log(`✅ Imported ${Object.keys(catalog).length} items to ${outputPath}`);
console.log('🎉 Equipment catalog updated successfully!');

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
