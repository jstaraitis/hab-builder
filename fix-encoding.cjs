const fs = require('fs');
const path = require('path');

// Function to fix encoding in a file
function fixEncodingInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the replacement character � with degree symbol °
    const fixed = content.replace(/\uFFFD/g, '°');
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all JSON files in blog directory
function findBlogFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findBlogFiles(fullPath));
    } else if (item.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const blogDir = path.join(__dirname, 'src', 'data', 'blog');
const blogFiles = findBlogFiles(blogDir);

console.log(`Found ${blogFiles.length} blog JSON files`);

let fixedCount = 0;
for (const file of blogFiles) {
  if (fixEncodingInFile(file)) {
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files with encoding issues`);
