/**
 * Export all animal JSON profiles to a single text file
 * Usage: node scripts/export-animals-to-txt.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANIMALS_DIR = path.join(__dirname, '..', 'src', 'data', 'animals');
const OUTPUT_FILE = path.join(__dirname, '..', 'animals-export.txt');

function formatAnimalProfile(animalData, filename) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push(`ANIMAL: ${animalData.commonName || filename}`);
  lines.push('='.repeat(80));
  lines.push('');
  
  // Basic Info
  lines.push('BASIC INFORMATION:');
  lines.push(`  ID: ${animalData.id || 'N/A'}`);
  lines.push(`  Common Name: ${animalData.commonName || 'N/A'}`);
  lines.push(`  Scientific Name: ${animalData.scientificName || 'N/A'}`);
  lines.push(`  Care Level: ${animalData.careLevel || 'N/A'}`);
  lines.push(`  Animal Type: ${animalData.equipmentNeeds?.animalType || 'N/A'}`);
  lines.push('');
  
  // Minimum Enclosure Size
  if (animalData.minEnclosureSize) {
    lines.push('MINIMUM ENCLOSURE SIZE:');
    lines.push(`  Width: ${animalData.minEnclosureSize.width || 'N/A'}`);
    lines.push(`  Depth: ${animalData.minEnclosureSize.depth || 'N/A'}`);
    lines.push(`  Height: ${animalData.minEnclosureSize.height || 'N/A'}`);
    lines.push(`  Units: ${animalData.minEnclosureSize.units || 'inches'}`);
    lines.push('');
  }
  
  // Quantity Rules
  if (animalData.quantityRules) {
    lines.push('QUANTITY RULES:');
    lines.push(`  Single Animal: ${animalData.quantityRules.singleAnimal || 'N/A'}`);
    if (animalData.quantityRules.multipleNotes) {
      lines.push(`  Multiple Notes: ${animalData.quantityRules.multipleNotes}`);
    }
    lines.push('');
  }
  
  // Care Targets
  if (animalData.careTargets) {
    lines.push('CARE TARGETS:');
    if (animalData.careTargets.temperature) {
      lines.push(`  Temperature: ${animalData.careTargets.temperature.min}-${animalData.careTargets.temperature.max}°F`);
      if (animalData.careTargets.temperature.basking) {
        lines.push(`    Basking: ${animalData.careTargets.temperature.basking.min}-${animalData.careTargets.temperature.basking.max}°F`);
      }
    }
    if (animalData.careTargets.humidity) {
      lines.push(`  Humidity: ${animalData.careTargets.humidity.min}-${animalData.careTargets.humidity.max}%`);
    }
    if (animalData.careTargets.lighting) {
      lines.push(`  UVB Required: ${animalData.careTargets.lighting.uvbRequired ? 'Yes' : 'No'}`);
      if (animalData.careTargets.lighting.uvbStrength) {
        lines.push(`  UVB Strength: ${animalData.careTargets.lighting.uvbStrength}`);
      }
    }
    lines.push('');
  }
  
  // Equipment Needs
  if (animalData.equipmentNeeds) {
    lines.push('EQUIPMENT NEEDS:');
    lines.push(`  Enclosure Types: ${animalData.equipmentNeeds.enclosureTypes?.join(', ') || 'N/A'}`);
    lines.push(`  Substrate Required: ${animalData.equipmentNeeds.substrateRequired ? 'Yes' : 'No'}`);
    if (animalData.equipmentNeeds.waterFeature) {
      lines.push(`  Water Feature: ${animalData.equipmentNeeds.waterFeature}`);
    }
    lines.push('');
  }
  
  // Layout Rules
  if (animalData.layoutRules) {
    lines.push('LAYOUT RULES:');
    lines.push(`  Prefer Vertical: ${animalData.layoutRules.preferVertical ? 'Yes' : 'No'}`);
    if (animalData.layoutRules.climbingSurfaces) {
      lines.push(`  Climbing Surfaces: ${animalData.layoutRules.climbingSurfaces}`);
    }
    if (animalData.layoutRules.hideSpots) {
      lines.push(`  Hide Spots: ${animalData.layoutRules.hideSpots}`);
    }
    lines.push('');
  }
  
  // Warnings
  if (animalData.warnings && animalData.warnings.length > 0) {
    lines.push('WARNINGS:');
    animalData.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. [${warning.severity.toUpperCase()}] ${warning.message}`);
      if (warning.context) {
        lines.push(`     Context: ${warning.context}`);
      }
    });
    lines.push('');
  }
  
  // Care Guidance
  if (animalData.careGuidance) {
    lines.push('CARE GUIDANCE:');
    Object.entries(animalData.careGuidance).forEach(([key, value]) => {
      lines.push(`  ${key.charAt(0).toUpperCase() + key.slice(1)}:`);
      if (typeof value === 'string') {
        lines.push(`    ${value}`);
      } else if (Array.isArray(value)) {
        value.forEach(item => lines.push(`    - ${item}`));
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          lines.push(`    ${subKey}: ${subValue}`);
        });
      }
    });
    lines.push('');
  }
  
  // Related Blogs
  if (animalData.relatedBlogs && animalData.relatedBlogs.length > 0) {
    lines.push('RELATED BLOG POSTS:');
    animalData.relatedBlogs.forEach(blog => {
      lines.push(`  - ${blog}`);
    });
    lines.push('');
  }
  
  lines.push('');
  return lines.join('\n');
}

function exportAnimalsToTxt() {
  console.log('Starting animal JSON export...\n');
  
  // Check if animals directory exists
  if (!fs.existsSync(ANIMALS_DIR)) {
    console.error(`Error: Animals directory not found at ${ANIMALS_DIR}`);
    process.exit(1);
  }
  
  // Get all JSON files in animals directory
  const files = fs.readdirSync(ANIMALS_DIR)
    .filter(file => file.endsWith('.json') && file !== 'index.ts' && file !== 'animal-template.json');
  
  if (files.length === 0) {
    console.error('No animal JSON files found!');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} animal profile(s):`);
  files.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  // Build the output content
  let outputContent = '';
  outputContent += 'HABITAT BUILDER - ANIMAL PROFILES EXPORT\n';
  outputContent += `Generated: ${new Date().toLocaleString()}\n`;
  outputContent += `Total Animals: ${files.length}\n`;
  outputContent += '\n\n';
  
  // Process each animal file
  files.forEach(file => {
    const filePath = path.join(ANIMALS_DIR, file);
    console.log(`Processing: ${file}`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const animalData = JSON.parse(fileContent);
      outputContent += formatAnimalProfile(animalData, file);
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
      outputContent += `\n\nERROR PROCESSING ${file}: ${error.message}\n\n`;
    }
  });
  
  // Write to output file
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
  
  console.log('\n✓ Export complete!');
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
}

// Run the export
try {
  exportAnimalsToTxt();
} catch (error) {
  console.error('\n✗ Export failed:', error.message);
  process.exit(1);
}
