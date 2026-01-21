/**
 * Export equipment catalog JSON to CSV for easy editing in spreadsheets
 * Run: node scripts/export-catalog-to-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/equipment-catalog.json');
const outputPath = path.join(__dirname, '../equipment-catalog.csv');

// Read the JSON file
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// CSV Header
const headers = [
  'id',
  'name',
  'category',
  'budget_low',
  'budget_mid',
  'budget_premium',
  'notes',
  'sizing',
  'infoLink1_label',
  'infoLink1_url',
  'infoLink2_label',
  'infoLink2_url',
  'infoLink3_label',
  'infoLink3_url',
  'purchaseLink_low',
  'purchaseLink_mid',
  'purchaseLink_premium'
];

// Convert to CSV rows
const rows = [];
rows.push(headers.join(','));

Object.entries(catalog).forEach(([id, item]) => {
  const row = [
    id,
    escapeCSV(item.name || ''),
    item.category || '',
    escapeCSV(item.budgetTiers?.low || ''),
    escapeCSV(item.budgetTiers?.mid || ''),
    escapeCSV(item.budgetTiers?.premium || ''),
    escapeCSV(item.notes || ''),
    escapeCSV(item.sizing || ''),
  ];

  // Handle infoLinks (up to 3)
  const infoLinks = Object.entries(item.infoLinks || {});
  for (let i = 0; i < 3; i++) {
    if (infoLinks[i]) {
      row.push(escapeCSV(infoLinks[i][0])); // label
      row.push(escapeCSV(infoLinks[i][1])); // url
    } else {
      row.push('', ''); // empty slots
    }
  }

  // Handle purchaseLinks
  row.push(
    escapeCSV(item.purchaseLinks?.low || ''),
    escapeCSV(item.purchaseLinks?.mid || ''),
    escapeCSV(item.purchaseLinks?.premium || '')
  );

  rows.push(row.join(','));
});

// Helper function to escape CSV values
function escapeCSV(value) {
  if (typeof value !== 'string') return '';
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Write CSV file
fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
console.log(`✅ Exported ${Object.keys(catalog).length} items to ${outputPath}`);
console.log('📝 Edit the CSV file and run import-catalog-from-csv.js to update the JSON');
