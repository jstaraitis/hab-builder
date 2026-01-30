#!/usr/bin/env node

/**
 * Fix encoding issues in blog JSON files
 * Replaces � characters with proper × (multiplication sign)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, '../src/data/blog');

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all � characters with ×
    const fixed = content.replace(/�/g, '×');
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✓ Fixed: ${path.relative(blogDir, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir) {
  let fixedCount = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.json')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

console.log('Fixing encoding issues in blog files...\n');
const fixedCount = walkDir(blogDir);
console.log(`\n✓ Fixed ${fixedCount} file(s)`);
