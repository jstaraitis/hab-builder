/**
 * Validate shopping list generation for all animals
 * Tests each animal at 3 enclosure sizes (small, medium, large)
 * Checks for missing items, incorrect quantities, and tier options
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load animal profiles
const animalsDir = path.join(__dirname, '../src/data/animals');
const animalFiles = fs.readdirSync(animalsDir).filter(f => f.endsWith('.json'));

// Test enclosure sizes (all in inches)
const testSizes = {
  small: { width: 18, depth: 18, height: 24 },
  medium: { width: 24, depth: 18, height: 36 },
  large: { width: 36, depth: 18, height: 48 },
  extraLarge: { width: 48, depth: 24, height: 48 }
};

console.log('='.repeat(80));
console.log('SHOPPING LIST VALIDATION FOR ALL ANIMALS');
console.log('='.repeat(80));
console.log();

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Import the generator dynamically (needs to be built first)
// For now, we'll output the test structure and manual validation checklist

animalFiles.forEach(file => {
  if (file === 'index.ts') return;
  
  const animalId = file.replace('.json', '');
  const animalData = JSON.parse(fs.readFileSync(path.join(animalsDir, file), 'utf-8'));
  
  results.total++;
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Animal: ${animalData.species || animalId}`);
  console.log(`Status: ${animalData.completionStatus || 'unknown'}`);
  console.log(`Type: ${animalData.equipmentNeeds?.activity || 'terrestrial'}`);
  console.log(`Bioactive Compatible: ${animalData.bioactiveCompatible ? 'Yes' : 'No'}`);
  console.log(`${'─'.repeat(80)}`);
  
  // Create test cases
  const testCases = [];
  
  // Determine which sizes to test based on min requirements
  const minSize = animalData.minEnclosureSize;
  if (minSize) {
    console.log(`Min Size: ${minSize.width}"W × ${minSize.depth}"D × ${minSize.height}"H (${minSize.gallons || '?'} gal)`);
    
    // Test sizes that meet or exceed minimum
    Object.entries(testSizes).forEach(([sizeName, dims]) => {
      const meetsWidth = dims.width >= minSize.width;
      const meetsDepth = dims.depth >= minSize.depth;
      const meetsHeight = dims.height >= minSize.height;
      
      if (meetsWidth && meetsDepth && meetsHeight) {
        testCases.push({ sizeName, dims });
      }
    });
  } else {
    console.log('⚠️  No minimum size defined');
    testCases.push({ sizeName: 'medium', dims: testSizes.medium });
  }
  
  console.log(`\nTest Cases: ${testCases.length}`);
  testCases.forEach(tc => {
    console.log(`  - ${tc.sizeName}: ${tc.dims.width}×${tc.dims.depth}×${tc.dims.height}"`);
  });
  
  // Expected equipment categories
  const expectedCategories = new Set();
  
  // Universal items
  expectedCategories.add('enclosure');
  expectedCategories.add('monitoring'); // thermometer/hygrometer
  
  // Activity-specific
  const activity = animalData.equipmentNeeds?.activity || 'terrestrial';
  
  if (activity === 'aquatic') {
    expectedCategories.add('aquatic'); // filter, heater, water conditioner
    expectedCategories.add('decor'); // hides, plants
  } else {
    // Terrestrial/arboreal
    expectedCategories.add('substrate');
    expectedCategories.add('decor'); // hides, branches, plants
    
    if (animalData.careTargets?.lighting?.uvbRequired) {
      expectedCategories.add('lighting'); // UVB
    }
    
    if (animalData.careTargets?.temperature?.basking) {
      expectedCategories.add('heating'); // heat lamp or mat
    }
    
    if (animalData.careTargets?.humidity?.range?.[1] > 60) {
      expectedCategories.add('humidity'); // misting system or fogger
    }
  }
  
  // Feeding
  if (activity !== 'aquatic') {
    expectedCategories.add('nutrition'); // feeders, supplements
  }
  
  console.log(`\nExpected Categories: ${Array.from(expectedCategories).join(', ')}`);
  
  // Check for equipment needs
  if (animalData.equipmentNeeds) {
    console.log('\nEquipment Needs Configuration:');
    console.log(`  Activity: ${animalData.equipmentNeeds.activity || 'not set'}`);
    console.log(`  UVB: ${animalData.equipmentNeeds.uvb || 'not set'}`);
    console.log(`  Heating: ${animalData.equipmentNeeds.heating || 'not set'}`);
    console.log(`  Humidity: ${animalData.equipmentNeeds.humidity || 'not set'}`);
    console.log(`  Water Features: ${animalData.equipmentNeeds.waterFeatures || 'not set'}`);
  } else {
    console.log('\n⚠️  No equipmentNeeds configuration found');
  }
  
  // Check for quantity rules
  if (animalData.quantityRules) {
    console.log('\nQuantity Rules:');
    console.log(`  Single: ${animalData.quantityRules.single || 'not set'}`);
    console.log(`  Group: ${animalData.quantityRules.group || 'not set'}`);
    console.log(`  Additional Space: ${animalData.quantityRules.additionalSpacePerAnimal || 'not set'}`);
  }
  
  // Manual validation checklist
  console.log('\n✓ MANUAL VALIDATION CHECKLIST:');
  console.log('  [ ] Enclosure recommendation matches animal size');
  console.log('  [ ] UVB lighting included if required');
  console.log('  [ ] Heating equipment appropriate for temperature needs');
  console.log('  [ ] Substrate depth correct (bioactive vs non-bioactive)');
  console.log('  [ ] Humidity control included if needed');
  console.log('  [ ] Water features included if specified');
  console.log('  [ ] Decor quantity appropriate for enclosure size');
  console.log('  [ ] All setup tiers (minimum/recommended/ideal) have options');
  console.log('  [ ] Prices are reasonable and current');
  console.log('  [ ] Purchase links are valid');
  
  results.details.push({
    animalId,
    species: animalData.species,
    status: animalData.completionStatus,
    testCases: testCases.length,
    expectedCategories: Array.from(expectedCategories),
    hasEquipmentNeeds: !!animalData.equipmentNeeds,
    hasQuantityRules: !!animalData.quantityRules
  });
});

console.log('\n\n' + '='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Animals: ${results.total}`);
console.log(`Animals with Equipment Needs: ${results.details.filter(d => d.hasEquipmentNeeds).length}`);
console.log(`Animals with Quantity Rules: ${results.details.filter(d => d.hasQuantityRules).length}`);
console.log();

// Group by completion status
const byStatus = {
  complete: results.details.filter(d => d.status === 'complete'),
  'in-progress': results.details.filter(d => d.status === 'in-progress'),
  draft: results.details.filter(d => d.status === 'draft'),
  unknown: results.details.filter(d => !d.status)
};

console.log('By Completion Status:');
console.log(`  Complete: ${byStatus.complete.length} - ${byStatus.complete.map(d => d.species).join(', ')}`);
console.log(`  In Progress: ${byStatus['in-progress'].length} - ${byStatus['in-progress'].map(d => d.species).join(', ')}`);
console.log(`  Draft: ${byStatus.draft.length} - ${byStatus.draft.map(d => d.species).join(', ')}`);
if (byStatus.unknown.length > 0) {
  console.log(`  Unknown: ${byStatus.unknown.length} - ${byStatus.unknown.map(d => d.species).join(', ')}`);
}

console.log('\n' + '='.repeat(80));
console.log('NEXT STEPS:');
console.log('='.repeat(80));
console.log('1. Start the dev server: npm run dev');
console.log('2. For each animal, test at multiple enclosure sizes');
console.log('3. Check shopping list for each setup tier (minimum/recommended/ideal)');
console.log('4. Verify equipment matches care requirements in animal profile');
console.log('5. Validate quantities scale appropriately with enclosure size');
console.log('6. Check that bioactive toggle adds drainage + cleanup crew');
console.log('7. Verify purchase links are working and prices are current');
console.log('8. Ensure aquatic animals get filters, heaters, water conditioner');
console.log('9. Confirm arboreal species get vertical climbing structures');
console.log('10. Check that incompatible combinations show validation warnings');
console.log('='.repeat(80));

// Export JSON report
const reportPath = path.join(__dirname, '../shopping-validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);
