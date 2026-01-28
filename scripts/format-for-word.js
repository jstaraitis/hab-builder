/**
 * Format markdown reports for Word compatibility
 * - Remove HTML tags (Word handles markdown better)
 * - Add proper markdown page breaks
 * - Replace emojis with text labels
 * - Clean up excessive whitespace
 * - Ensure consistent formatting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'ANIMAL_BLOG_DISCREPANCY_REPORT.md',
  'ARCHITECTURE_REVIEW.md',
  'FEATURE_OPPORTUNITIES_ANALYSIS.md'
];

files.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // ============================================
  // REMOVE HTML TAGS (Word doesn't need them)
  // ============================================
  
  // Remove any existing HTML div tags (page breaks, etc.)
  content = content.replace(/<div[^>]*>[\s\S]*?<\/div>/g, '');
  content = content.replace(/<div[^>]*>/g, '');
  content = content.replace(/<\/div>/g, '');
  
  // Remove other HTML tags that might have snuck in
  content = content.replace(/<br\s*\/?>/g, '');
  content = content.replace(/<hr\s*\/?>/g, '---');
  
  // ============================================
  // ADD PROPER PAGE BREAKS FOR WORD
  // ============================================
  
  // Word interprets three dashes as a page break when converting markdown
  // Add page break before major sections (## SECTION)
  content = content.replace(/\n(## [A-Z][A-Z ])/g, '\n\n---\n\n$1');
  
  // ============================================
  // CLEAN UP CODE BLOCKS
  // ============================================
  
  // Remove quadruple backticks (not valid markdown)
  content = content.replace(/````/g, '```');
  
  // ============================================
  // REPLACE EMOJIS WITH TEXT
  // ============================================
  
  // Star ratings
  content = content.replace(/★★★★☆/g, '[4/5 STARS]');
  content = content.replace(/★/g, '[STAR]');
  content = content.replace(/⭐/g, '[STAR]');
  
  // Priority/status emojis in headers
  content = content.replace(/### 💰 \*\*/g, '### [REVENUE] **');
  content = content.replace(/### 📄 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 📏 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🌡️ \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 📊 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🔍 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🎨 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 📅 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🐸 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🌿 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🔬 \*\*/g, '### [ADVANCED] **');
  content = content.replace(/### 🧬 \*\*/g, '### [ADVANCED] **');
  content = content.replace(/### 🩺 \*\*/g, '### [PROFESSIONAL] **');
  content = content.replace(/### 🏗️ \*\*/g, '### [BUILDER] **');
  content = content.replace(/### 🧪 \*\*/g, '### [AQUATIC] **');
  content = content.replace(/### 🎯 \*\*/g, '### [FEATURE] **');
  content = content.replace(/### 🎮 \*\*/g, '### [GAMIFICATION] **');
  content = content.replace(/### 🌍 \*\*/g, '### [INTERNATIONAL] **');
  
  // Status emojis in lists
  content = content.replace(/- ✅ /g, '- [COMPLETE] ');
  content = content.replace(/- ⚠️ /g, '- [WARNING] ');
  content = content.replace(/- ❌ /g, '- [MISSING] ');
  content = content.replace(/- ❓ /g, '- [UNKNOWN] ');
  content = content.replace(/- 🔴 /g, '- [HIGH PRIORITY] ');
  content = content.replace(/- 🟡 /g, '- [MEDIUM PRIORITY] ');
  content = content.replace(/- 🟢 /g, '- [LOW PRIORITY] ');
  content = content.replace(/- ⏳ /g, '- [IN PROGRESS] ');
  content = content.replace(/- 📝 /g, '- [NOTE] ');
  
  // Status indicators in text
  content = content.replace(/✅ COMPLETE/g, '[COMPLETE]');
  content = content.replace(/⚠️ INCOMPLETE/g, '[INCOMPLETE]');
  content = content.replace(/❌ EMPTY/g, '[EMPTY]');
  content = content.replace(/✅ /g, '[YES] ');
  content = content.replace(/⚠️ /g, '[WARNING] ');
  content = content.replace(/❌ /g, '[NO] ');
  content = content.replace(/✓/g, '[YES]');
  content = content.replace(/✗/g, '[NO]');
  
  // Integration/feature emojis
  content = content.replace(/💳 \*\*/g, '**[MONETIZATION] ');
  content = content.replace(/📊 \*\*/g, '**[ANALYTICS] ');
  content = content.replace(/🗂️ \*\*/g, '**[DATABASE] ');
  content = content.replace(/💰 \*\*/g, '**[PAYMENT] ');
  content = content.replace(/🛒 \*\*/g, '**[COMMERCE] ');
  content = content.replace(/🌦️ \*\*/g, '**[API] ');
  content = content.replace(/📧 \*\*/g, '**[EMAIL] ');
  
  // Priority indicators
  content = content.replace(/🔴 \*\*CRITICAL\*\*/g, '[CRITICAL PRIORITY]');
  content = content.replace(/🔴 \*\*HIGH\*\*/g, '[HIGH PRIORITY]');
  content = content.replace(/🟡 \*\*MEDIUM\*\*/g, '[MEDIUM PRIORITY]');
  content = content.replace(/🟢 \*\*LOW\*\*/g, '[LOW PRIORITY]');
  
  // Clean up priority sections
  content = content.replace(/\*\*Priority:\*\* 🔴/g, '**Priority:** [CRITICAL]');
  content = content.replace(/\*\*Priority:\*\* 🟡/g, '**Priority:** [MEDIUM]');
  content = content.replace(/\*\*Priority:\*\* 🟢/g, '**Priority:** [LOW]');
  
  // ============================================
  // FIX SPACING AND FORMATTING
  // ============================================
  // ============================================
  // FIX SPACING AND FORMATTING
  // ============================================
  
  // Add spacing before important sections
  content = content.replace(/\n### Issue #/g, '\n\n### Issue #');
  content = content.replace(/\n\*\*Legend:\*\*/g, '\n\n**Legend:**');
  
  // Ensure consistent heading spacing (blank line before headings)
  content = content.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
  
  // ============================================
  // REMOVE EXCESSIVE WHITESPACE
  // ============================================
  
  // Remove trailing whitespace from lines
  content = content.replace(/[ \t]+$/gm, '');
  
  // Replace multiple consecutive blank lines with maximum of 2 blank lines
  content = content.replace(/\n{4,}/g, '\n\n\n');
  
  // Clean up spaces around section dividers
  content = content.replace(/\n+---\n+/g, '\n\n---\n\n');
  
  // Remove leading/trailing whitespace from file
  content = content.trim();
  
  // Ensure single newline at end of file
  content = content + '\n';
  
  // ============================================
  // SAVE FORMATTED FILE
  // ============================================
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Formatted: ${filename}`);
});

console.log('\n✅ All reports formatted for Word compatibility!');
console.log('\n📋 Changes applied:');
console.log('   • Removed all HTML tags (<div>, <br>, etc.)');
console.log('   • Replaced emojis with text labels [COMPLETE], [WARNING], etc.');
console.log('   • Added page breaks using markdown (---) before major sections');
console.log('   • Cleaned up excessive whitespace');
console.log('   • Fixed heading spacing for better readability');
console.log('\n📄 To print:');
console.log('   1. Open .md file in Microsoft Word');
console.log('   2. Word will convert markdown automatically');
console.log('   3. Page breaks will appear as horizontal lines');
console.log('   4. File → Print or Ctrl+P');

