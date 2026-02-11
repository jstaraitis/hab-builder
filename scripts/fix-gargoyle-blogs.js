import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, '../src/data/blog/gargoyle-gecko');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.json'));

const tagMap = {
  'enrichment-welfare-guide': ['gargoyle-gecko', 'enrichment', 'welfare', 'beginner'],
  'enclosure-setup': ['gargoyle-gecko', 'enclosure', 'setup', 'equipment'],
  'substrate-guide': ['gargoyle-gecko', 'substrate', 'bioactive', 'tropical-mix'],
  'heating-lighting-guide': ['gargoyle-gecko', 'heating', 'lighting', 'uvb', 'temperature'],
  'feeding-guide': ['gargoyle-gecko', 'feeding', 'diet', 'cgd', 'insects'],
  'hydration-guide': ['gargoyle-gecko', 'hydration', 'misting', 'humidity']
};

files.forEach(file => {
  const filePath = path.join(blogDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Remove the malformed characters first
    let cleaned = content
      .replace(/,`n\s+/g, ',\n  ')  // Fix escaped newlines
      .replace(/`n/g, '\n')  // Fix any remaining escaped newlines
      .replace(/"description":\s*""excerpt":\s*"([^"]+)""/g, '"description": "$1"'); // Fix double-wrapped description
    
    const data = JSON.parse(cleaned);
    
    // Get tags based on file name
    const fileKey = file.replace('gargoyle-gecko-', '').replace('.json', '');
    const tags = tagMap[fileKey] || ['gargoyle-gecko'];
    
    // Create clean metadata
    const fixed = {
      id: data.id,
      title: data.title,
      author: data.author || 'Habitat Builder Team',
      date: data.date || data.publishedDate || '2026-02-11',
      category: 'Care Guides',
      excerpt: data.excerpt || data.summary || data.description || '',
      description: data.description || data.excerpt || data.summary || '',
      tags: tags,
      status: 'community-reviewed',
      content: data.content
    };
    
    fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2));
    console.log(`Fixed ${file}`);
  } catch (err) {
    console.error(`Error fixing ${file}:`, err.message);
  }
});
