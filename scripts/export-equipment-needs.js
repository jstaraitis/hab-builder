/**
 * Export all animal equipment needs for validation
 * Outputs a formatted text file showing all equipmentNeeds arrays for each animal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANIMALS_DIR = path.join(__dirname, '../src/data/animals');
const OUTPUT_FILE = path.join(__dirname, '../equipment-needs-export.txt');

function exportEquipmentNeeds() {
  const files = fs.readdirSync(ANIMALS_DIR).filter(f => f.endsWith('.json') && f !== 'index.ts' && f !== 'animal-template.json');
  
  let output = '═══════════════════════════════════════════════════════════════\n';
  output += '  ANIMAL EQUIPMENT NEEDS - VALIDATION REFERENCE\n';
  output += `  Generated: ${new Date().toLocaleString()}\n`;
  output += '═══════════════════════════════════════════════════════════════\n\n';

  const animals = [];

  // Read all animals
  files.forEach(file => {
    const filePath = path.join(ANIMALS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const animal = JSON.parse(content);
    animals.push(animal);
  });

  // Sort alphabetically
  animals.sort((a, b) => a.commonName.localeCompare(b.commonName));

  // Export each animal's equipment needs
  animals.forEach((animal, index) => {
    output += `\n${'─'.repeat(65)}\n`;
    output += `${index + 1}. ${animal.commonName.toUpperCase()} (${animal.id})\n`;
    output += `${'─'.repeat(65)}\n\n`;

    if (!animal.equipmentNeeds) {
      output += '  ⚠️  NO EQUIPMENT NEEDS DEFINED\n';
      return;
    }

    const needs = animal.equipmentNeeds;

    // Standard fields (single values)
    const standardFields = ['climbing', 'humidity', 'heatSource', 'waterFeature', 'lighting', 'animalType', 'bioactiveSubstrate'];
    output += '  STANDARD FIELDS:\n';
    standardFields.forEach(field => {
      if (needs[field] !== undefined && needs[field] !== null) {
        output += `    • ${field}: ${needs[field]}\n`;
      }
    });

    // Array fields (equipment lists)
    const arrayFields = [
      'substrate',
      'diet', 
      'decor',
      'filtration',
      'cooling',
      'heating',
      'waterTreatment',
      'maintenance',
      'safety',
      'water',
      'feeding',
      'humidity-aids'
    ];

    output += '\n  EQUIPMENT ARRAYS:\n';
    let hasArrays = false;
    arrayFields.forEach(field => {
      if (Array.isArray(needs[field]) && needs[field].length > 0) {
        hasArrays = true;
        output += `    • ${field}:\n`;
        needs[field].forEach(item => {
          output += `        - ${item}\n`;
        });
      }
    });

    if (!hasArrays) {
      output += '    (none defined)\n';
    }

    // Check for specialized arrays
    const specializedArrays = ['filtration', 'cooling', 'waterTreatment', 'maintenance', 'safety', 'heating'];
    const hasSpecialized = specializedArrays.some(field => Array.isArray(needs[field]) && needs[field].length > 0);
    
    if (hasSpecialized) {
      output += '\n  🔧 SPECIALIZED EQUIPMENT (processed by addDirectEquipment):\n';
      specializedArrays.forEach(field => {
        if (Array.isArray(needs[field]) && needs[field].length > 0) {
          output += `     ${field}: ${needs[field].length} item(s)\n`;
        }
      });
    }

    // Summary stats
    const totalArrayItems = arrayFields.reduce((sum, field) => {
      return sum + (Array.isArray(needs[field]) ? needs[field].length : 0);
    }, 0);
    
    output += `\n  📊 TOTAL EQUIPMENT ITEMS: ${totalArrayItems}\n`;
  });

  // Summary table
  output += '\n\n';
  output += '═══════════════════════════════════════════════════════════════\n';
  output += '  SUMMARY TABLE\n';
  output += '═══════════════════════════════════════════════════════════════\n\n';
  output += `${'Animal'.padEnd(25)} ${'Total Items'.padEnd(15)} ${'Specialized'.padEnd(15)}\n`;
  output += `${'-'.repeat(25)} ${'-'.repeat(15)} ${'-'.repeat(15)}\n`;

  animals.forEach(animal => {
    const needs = animal.equipmentNeeds || {};
    const arrayFields = ['substrate', 'diet', 'decor', 'filtration', 'cooling', 'heating', 'waterTreatment', 'maintenance', 'safety', 'water', 'feeding', 'humidity-aids'];
    const totalItems = arrayFields.reduce((sum, field) => sum + (Array.isArray(needs[field]) ? needs[field].length : 0), 0);
    
    const specializedArrays = ['filtration', 'cooling', 'waterTreatment', 'maintenance', 'safety', 'heating'];
    const specializedItems = specializedArrays.reduce((sum, field) => sum + (Array.isArray(needs[field]) ? needs[field].length : 0), 0);
    
    const hasSpecialized = specializedItems > 0 ? '' : '';
    output += `${animal.commonName.padEnd(25)} ${totalItems.toString().padEnd(15)} ${hasSpecialized.padEnd(15)}\n`;
  });

  output += '\n\n';
  output += '═══════════════════════════════════════════════════════════════\n';
  output += '  NOTES\n';
  output += '═══════════════════════════════════════════════════════════════\n\n';
  output += 'Specialized equipment (filtration, cooling, waterTreatment, maintenance,\n';
  output += 'safety, heating) is processed by addDirectEquipment() function.\n\n';
  output += 'Generic equipment (water, feeding, humidity-aids, decor) is processed\n';
  output += 'by dedicated functions (addWaterSupplies, addFeedingSupplies, etc.).\n\n';
  output += 'To validate shopping list generation:\n';
  output += '1. Generate a plan for each animal\n';
  output += '2. Check that all items listed here appear in the shopping list\n';
  output += '3. Verify quantities and sizing calculations are appropriate\n\n';

  // Write output
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`✅ Equipment needs exported to: ${OUTPUT_FILE}`);
  console.log(`📋 Total animals processed: ${animals.length}`);
}

// Run export
exportEquipmentNeeds();
