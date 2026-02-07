# Image Compression Guide

This guide explains how to compress images in the `public/animals` folder to reduce file sizes and improve website performance.

## Quick Start

### 1. Install Sharp Library

```bash
npm install --save-dev sharp
```

### 2. Run Compression Script

```bash
npm run compress-images
```

This will:
- ✅ Create a backup at `public/animals-backup/`
- ✅ Compress all JPG/PNG images in `public/animals/`
- ✅ Resize images larger than 1200×1200px
- ✅ Show before/after file sizes
- ✅ Display total savings

## Configuration

Edit `scripts/compress-images.js` to adjust settings:

```javascript
const CONFIG = {
  maxWidth: 1200,        // Max width in pixels
  maxHeight: 1200,       // Max height in pixels
  jpegQuality: 85,       // JPEG quality (1-100)
  pngQuality: 85,        // PNG quality
  webpQuality: 85,       // WebP quality
  convertToWebP: false,  // Convert all images to WebP format
};
```

### Quality Guidelines
- **90-100**: Near-lossless, large files
- **85**: Excellent quality, good compression (recommended)
- **75**: Good quality, better compression
- **60-70**: Visible quality loss, maximum compression

## Advanced Usage

### Skip Backup
If you already have a backup or want to skip it:
```bash
npm run compress-images -- --no-backup
```

### Force Re-compression
If backup directory exists and you want to proceed anyway:
```bash
npm run compress-images -- --force
```

### Convert to WebP
WebP format offers ~30% better compression than JPEG. Edit `compress-images.js`:
```javascript
convertToWebP: true
```

**Note**: WebP has excellent browser support (95%+) but older browsers may need fallbacks.

## Restore Original Images

If you need to restore the original images:

```bash
# Windows PowerShell
Remove-Item -Recurse -Force public/animals
Rename-Item public/animals-backup public/animals
```

```bash
# Linux/Mac
rm -rf public/animals
mv public/animals-backup public/animals
```

## Expected Results

Typical compression savings:
- **Phone photos (2-5 MB)**: 80-90% reduction → 200-500 KB
- **Already optimized images**: 10-30% reduction
- **Screenshots**: 50-70% reduction

### Example Output
```
🖼️  Image Compression Script
================================

📦 Creating backup...
✅ Backup created at: D:\hab-builder\public\animals-backup

🔍 Finding images...
Found 42 images

🗜️  Compressing images...

✅ whites-tree-frog-1.jpg: 3.2 MB → 420 KB (86.9% smaller)
✅ axolotl-1.jpg: 1.8 MB → 310 KB (82.8% smaller)
✅ bearded-dragon-1.jpg: 4.1 MB → 520 KB (87.3% smaller)
...

================================
📊 Compression Summary
================================
Total files: 42
Processed: 42
Errors: 0

Original size: 89.4 MB
Compressed size: 14.2 MB

💾 Total savings: 75.2 MB (84.1%)

📦 Backup saved at: D:\hab-builder\public\animals-backup
```

## Troubleshooting

### "Sharp library not found"
Run: `npm install --save-dev sharp`

### "Backup directory already exists"
- Use `--force` flag to proceed without new backup
- Or delete existing backup: `Remove-Item -Recurse public/animals-backup`

### Images look blurry
- Increase `jpegQuality` to 90-95 in config
- Check if images are being resized too much
- Ensure original images are high resolution

### Large file after compression
- Some images may already be optimized
- Try converting to WebP format (`convertToWebP: true`)
- Lower quality setting to 75-80

## Best Practices

1. **Always create backup** before first run
2. **Test on a few images first** by moving others temporarily
3. **Compare before/after** - check image quality in browser
4. **Use 85 quality** as starting point (good balance)
5. **Consider WebP** for production builds (better compression)

## Integration with Build Process

To automatically compress images during build:

Edit `package.json`:
```json
"scripts": {
  "prebuild": "npm run compress-images -- --no-backup --force",
  "build": "tsc && vite build"
}
```

This will compress images every time you run `npm run build`.

## Additional Resources

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Browser Support](https://caniuse.com/webp)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
