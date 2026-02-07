/**
 * Image Compression Script
 * Compresses all images in public/animals folder to reduce file sizes
 * Creates backups in public/animals-backup before compression
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  inputDir: path.join(__dirname, '../public/animals'),
  backupDir: path.join(__dirname, '../public/animals-backup'),
  maxWidth: 1200, // Max width in pixels
  maxHeight: 1200, // Max height in pixels
  jpegQuality: 85, // JPEG quality (1-100, higher = better quality but larger size)
  pngQuality: 85, // PNG quality
  webpQuality: 85, // WebP quality (optional: convert to WebP for even better compression)
  convertToWebP: false, // Set to true to convert all images to WebP format
};

// Track statistics
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  errorFiles: 0,
  totalOriginalSize: 0,
  totalCompressedSize: 0,
};

/**
 * Get all image files recursively from a directory
 */
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create backup of original images
 */
function createBackup() {
  console.log('\n📦 Creating backup...');
  
  if (fs.existsSync(CONFIG.backupDir)) {
    console.log('⚠️  Backup directory already exists. Skipping backup.');
    const proceed = process.argv.includes('--force');
    if (!proceed) {
      console.log('💡 Use --force flag to proceed without creating new backup.');
      process.exit(0);
    }
  } else {
    // Copy entire animals directory to backup
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    copyRecursive(CONFIG.inputDir, CONFIG.backupDir);
    console.log('✅ Backup created at:', CONFIG.backupDir);
  }
}

/**
 * Recursively copy directory
 */
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Compress a single image
 */
async function compressImage(filePath) {
  try {
    const originalSize = fs.statSync(filePath).size;
    stats.totalOriginalSize += originalSize;
    
    const ext = path.extname(filePath).toLowerCase();
    const outputPath = CONFIG.convertToWebP 
      ? filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      : filePath;
    
    // Load image with sharp
    let image = sharp(filePath);
    
    // Get metadata
    const metadata = await image.metadata();
    
    // Resize if too large
    if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
      image = image.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Compress based on format
    if (CONFIG.convertToWebP) {
      await image
        .webp({ quality: CONFIG.webpQuality })
        .toFile(outputPath + '.tmp');
    } else if (ext === '.png') {
      await image
        .png({ 
          quality: CONFIG.pngQuality,
          compressionLevel: 9,
        })
        .toFile(outputPath + '.tmp');
    } else {
      // JPEG
      await image
        .jpeg({ 
          quality: CONFIG.jpegQuality,
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toFile(outputPath + '.tmp');
    }
    
    // Replace original with compressed version
    fs.renameSync(outputPath + '.tmp', outputPath);
    
    // If converting to WebP, delete original
    if (CONFIG.convertToWebP && outputPath !== filePath) {
      fs.unlinkSync(filePath);
    }
    
    const compressedSize = fs.statSync(outputPath).size;
    stats.totalCompressedSize += compressedSize;
    
    const savings = originalSize - compressedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
    
    console.log(
      `✅ ${path.basename(filePath)}: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savingsPercent}% smaller)`
    );
    
    stats.processedFiles++;
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    stats.errorFiles++;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Image Compression Script');
  console.log('================================\n');
  
  // Check if sharp is installed
  try {
    sharp();
  } catch (error) {
    console.error('❌ Sharp library not found. Installing...');
    console.log('Run: npm install --save-dev sharp');
    process.exit(1);
  }
  
  // Create backup
  if (!process.argv.includes('--no-backup')) {
    createBackup();
  } else {
    console.log('⚠️  Skipping backup (--no-backup flag used)');
  }
  
  console.log('\n🔍 Finding images...');
  const imageFiles = getImageFiles(CONFIG.inputDir);
  stats.totalFiles = imageFiles.length;
  
  console.log(`Found ${stats.totalFiles} images\n`);
  
  if (stats.totalFiles === 0) {
    console.log('No images found to compress.');
    process.exit(0);
  }
  
  console.log('🗜️  Compressing images...\n');
  
  // Process all images
  for (const filePath of imageFiles) {
    await compressImage(filePath);
  }
  
  // Print summary
  console.log('\n================================');
  console.log('📊 Compression Summary');
  console.log('================================');
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Processed: ${stats.processedFiles}`);
  console.log(`Errors: ${stats.errorFiles}`);
  console.log(`\nOriginal size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Compressed size: ${formatBytes(stats.totalCompressedSize)}`);
  
  const totalSavings = stats.totalOriginalSize - stats.totalCompressedSize;
  const totalSavingsPercent = ((totalSavings / stats.totalOriginalSize) * 100).toFixed(1);
  
  console.log(`\n💾 Total savings: ${formatBytes(totalSavings)} (${totalSavingsPercent}%)`);
  
  if (!process.argv.includes('--no-backup')) {
    console.log(`\n📦 Backup saved at: ${CONFIG.backupDir}`);
    console.log('💡 To restore originals, delete animals/ and rename animals-backup/ to animals/');
  }
}

// Run the script
main().catch(console.error);
