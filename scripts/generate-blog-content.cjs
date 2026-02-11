const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Guide type templates
const guideTypes = {
  'enrichment-welfare': {
    title: 'Enrichment & Welfare Guide',
    sections: [
      'Species Overview',
      'Quick Facts',
      'Critical Care Requirements',
      'Enclosure Enrichment',
      'Behavioral Needs',
      'Common Welfare Issues',
      'Getting Started Checklist'
    ]
  },
  'enclosure-setup': {
    title: 'Enclosure Setup Guide',
    sections: [
      'Tank Size Requirements',
      'Enclosure Type Selection',
      'Essential Equipment List',
      'Setup Steps',
      'Initial Cycling/Preparation',
      'Adding Your Animal',
      'Maintenance Schedule'
    ]
  },
  'substrate': {
    title: 'Substrate Guide',
    sections: [
      'Substrate Safety Overview',
      'Recommended Substrate Options',
      'Substrate Comparison Table',
      'Bioactive Setup',
      'Maintenance Requirements',
      'Substrates to Avoid'
    ]
  },
  'feeding': {
    title: 'Feeding Guide',
    sections: [
      'Age-Based Feeding Schedule',
      'Feeder Options',
      'Dietary Requirements',
      'Supplementation',
      'Gut-Loading',
      'Foods to Avoid',
      'Common Feeding Mistakes'
    ]
  },
  'temperature-humidity': {
    title: 'Temperature & Humidity Guide',
    sections: [
      'Temperature Requirements',
      'Humidity Requirements',
      'Thermal Gradient Setup',
      'Heating Equipment',
      'Humidity Management',
      'Monitoring Equipment',
      'Seasonal Adjustments'
    ]
  },
  'lighting': {
    title: 'Lighting Guide',
    sections: [
      'UVB Requirements',
      'Light Cycle',
      'UVB Equipment Options',
      'Basking Light Setup',
      'Measuring UVB Output',
      'Bulb Replacement Schedule'
    ]
  },
  'hydration': {
    title: 'Hydration Guide',
    sections: [
      'Natural Hydration Behavior',
      'Water Dish Setup',
      'Misting Requirements',
      'Signs of Dehydration',
      'Hydrating Foods',
      'Soaking Guidelines'
    ]
  }
};

// Generate section content based on type and species
function generateSection(sectionName, species, guideType) {
  return {
    type: 'section',
    title: sectionName
  };
}

// Generate intro content
function generateIntro(species, guideType, guideTitle) {
  const speciesCommon = species.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const intros = {
    'enrichment-welfare': `Complete guide to ${speciesCommon} care, covering habitat requirements, behavior, health indicators, and proper husbandry practices for keeping these animals thriving in captivity.`,
    'enclosure-setup': `Step-by-step guide to setting up a proper enclosure for ${speciesCommon}, including tank sizing, equipment selection, and initial preparation.`,
    'substrate': `Comprehensive substrate selection guide for ${speciesCommon}, covering safe options, impaction risks, bioactive setups, and maintenance requirements.`,
    'feeding': `Complete feeding guide for ${speciesCommon} covering diet composition, feeding schedules by age, feeder selection, supplementation, and common nutritional mistakes.`,
    'temperature-humidity': `Essential temperature and humidity requirements for ${speciesCommon}, including gradient setup, equipment recommendations, and monitoring protocols.`,
    'lighting': `Lighting requirements for ${speciesCommon}, covering UVB needs, light cycles, equipment selection, and proper bulb maintenance.`,
    'hydration': `Hydration management for ${speciesCommon}, including water provision methods, misting schedules, and recognizing dehydration signs.`
  };

  return {
    type: 'intro',
    title: `Understanding ${speciesCommon} ${guideTypes[guideType].title.replace(' Guide', '')}`,
    content: intros[guideType] || `Essential guide for ${speciesCommon} care.`
  };
}

// Generate placeholder text block
function generateTextBlock(sectionName, species) {
  return {
    type: 'text',
    content: `[Add detailed information about ${sectionName.toLowerCase()} for ${species.replace(/-/g, ' ')}. Include specific requirements, ranges, and practical implementation advice.]`
  };
}

// Generate table template
function generateTableTemplate(sectionName) {
  const tableSuggestions = {
    'Tank Size Requirements': {
      headers: ['Life Stage', 'Minimum Size', 'Recommended Size', 'Notes'],
      rows: [
        ['Juvenile', '[dimensions]', '[dimensions]', '[specific notes]'],
        ['Adult', '[dimensions]', '[dimensions]', '[specific notes]']
      ]
    },
    'Temperature Requirements': {
      headers: ['Zone', 'Temperature Range', 'Method', 'Notes'],
      rows: [
        ['Basking Spot', '[temp range]', '[heating method]', '[notes]'],
        ['Warm Side', '[temp range]', 'Gradient', '[notes]'],
        ['Cool Side', '[temp range]', 'Ambient', '[notes]']
      ]
    },
    'Feeding Schedule': {
      headers: ['Life Stage', 'Frequency', 'Portion Size', 'Notes'],
      rows: [
        ['Juvenile', '[frequency]', '[amount]', '[details]'],
        ['Adult', '[frequency]', '[amount]', '[details]']
      ]
    }
  };

  return tableSuggestions[sectionName] || {
    headers: ['Column 1', 'Column 2', 'Column 3'],
    rows: [
      ['[data]', '[data]', '[data]'],
      ['[data]', '[data]', '[data]']
    ]
  };
}

// Generate complete blog post structure
function generateBlogPost(species, guideType) {
  const speciesKebab = species.toLowerCase().replace(/\s+/g, '-');
  const guideTypeKebab = guideType.toLowerCase().replace(/\s+/g, '-');
  const id = `${speciesKebab}-${guideTypeKebab}-guide`;
  const speciesCommon = species.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const guideTitle = guideTypes[guideType].title;
  
  const content = [
    generateIntro(species, guideType, guideTitle)
  ];

  // Add sections with placeholders
  guideTypes[guideType].sections.forEach(section => {
    content.push(generateSection(section, species, guideType));
    
    // Add placeholder content blocks
    content.push(generateTextBlock(section, species));
    
    // Add table template for certain sections
    if (['Requirements', 'Schedule', 'Options', 'Comparison'].some(keyword => section.includes(keyword))) {
      content.push({
        type: 'text',
        text: `<span class='text-base font-semibold text-gray-900 dark:text-white block mb-2'>${section} Details:</span>`
      });
      
      const tableData = generateTableTemplate(section);
      content.push({
        type: 'table',
        headers: tableData.headers,
        rows: tableData.rows
      });
    }
    
    // Add warning placeholder for safety-critical sections
    if (['Safety', 'Avoid', 'Critical', 'Requirements'].some(keyword => section.includes(keyword))) {
      content.push({
        type: 'warning',
        severity: 'important',
        content: `[Add important safety information or critical requirements for ${section.toLowerCase()}]`
      });
    }
  });

  // Add final highlight/summary
  content.push({
    type: 'highlight',
    content: `Key Takeaway: [Summarize the most important point for ${speciesCommon} ${guideTitle.toLowerCase()}]`
  });

  return {
    id,
    title: `${speciesCommon} ${guideTitle}: [Add Subtitle]`,
    description: `Complete ${guideTitle.toLowerCase()} for ${speciesCommon} covering [key topics].`,
    excerpt: `Complete ${guideTitle.toLowerCase()} for ${speciesCommon} covering [key topics].`,
    author: 'Habitat Builder',
    publishDate: new Date().toISOString().split('T')[0],
    category: 'Care Guides',
    tags: [speciesKebab, guideTypeKebab, 'care guide'],
    image: `/animals/${speciesKebab}/${speciesKebab}-1.jpg`,
    status: 'draft',
    content
  };
}

// Main CLI
async function main() {
  console.log('\n🦎 Habitat Builder - Blog Content Generator\n');
  console.log('This tool generates all 7 blog post templates for a species.\n');

  // Get species name
  const species = await question('Species name (e.g., bearded-dragon, whites-tree-frog): ');
  
  if (!species || species.trim() === '') {
    console.log('❌ Species name is required');
    rl.close();
    return;
  }

  console.log(`\n✅ Generating all guides for ${species}...\n`);

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'blog', species);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}\n`);
  }

  const generatedFiles = [];
  const blogIds = [];

  // Generate all guide types
  for (const guideType of Object.keys(guideTypes)) {
    const blogPost = generateBlogPost(species, guideType);
    const fileName = `${blogPost.id}.json`;
    const filePath = path.join(outputDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(blogPost, null, 2));
    generatedFiles.push(fileName);
    blogIds.push(blogPost.id);
    
    console.log(`✅ ${guideTypes[guideType].title.padEnd(35)} → ${fileName}`);
  }

  // Update animal profile's relatedBlogs array
  const animalProfilePath = path.join(__dirname, '..', 'src', 'data', 'animals', `${species}.json`);
  if (fs.existsSync(animalProfilePath)) {
    try {
      const animalProfile = JSON.parse(fs.readFileSync(animalProfilePath, 'utf8'));
      animalProfile.relatedBlogs = blogIds;
      fs.writeFileSync(animalProfilePath, JSON.stringify(animalProfile, null, 2));
      console.log(`\n✅ Updated animal profile: ${species}.json (added ${blogIds.length} blog IDs to relatedBlogs)`);
    } catch (error) {
      console.log(`\n⚠️  Could not update animal profile: ${error.message}`);
    }
  } else {
    console.log(`\n⚠️  Animal profile not found: ${animalProfilePath}`);
    console.log(`   Create the animal profile first, then re-run this script to link blogs.`);
  }

  console.log(`\n🎉 Generated ${generatedFiles.length} blog templates!\n`);
  console.log(`📝 Next steps:`);
  console.log(`   1. Open files in: src/data/blog/${species}/`);
  console.log(`   2. Replace [placeholders] with actual content`);
  console.log(`   3. Fill in table data`);
  console.log(`   4. Update status from 'draft' to 'in-progress' or 'complete'`);
  console.log(`   5. Add relatedBlogs arrays to link guides together\n`);
  console.log(`💡 Tip: Copy table structures from similar species to save time!\n`);

  rl.close();
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
