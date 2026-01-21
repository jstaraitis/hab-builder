# Example Enclosure Images

This directory contains example enclosure setup images for each animal species.

## Directory Structure

Each animal should have its own folder with three example images:

```
examples/
├── whites-tree-frog/
│   ├── minimalist-setup.jpg
│   ├── naturalistic-setup.jpg
│   └── display-setup.jpg
├── eastern-gray-tree-frog/
│   ├── minimalist-setup.jpg
│   ├── naturalistic-setup.jpg
│   └── display-setup.jpg
└── crested-gecko/
    ├── minimalist-setup.jpg
    ├── naturalistic-setup.jpg
    └── display-setup.jpg
```

## Animal IDs (folder names)

Use these exact folder names to match the animal profiles:
- `whites-tree-frog`
- `eastern-gray-tree-frog`
- `crested-gecko`
- (Add more as animals are added to the app)

## Image Requirements

### Minimalist Setup
- Clean, simple enclosure with essential equipment only
- Shows basic lighting, water dish, one hide, minimal decor
- Good for beginners or those on a budget

### Naturalistic Bioactive
- Lush planted setup with live plants
- Shows drainage layer, substrate, cleanup crew habitat
- Natural branches and foliage
- Looks like a natural habitat

### Display/Show Tank
- Visually stunning, artistic setup
- Premium lighting showing off the enclosure
- Artistic hardscape arrangement
- Featured plants and viewing angles
- "Instagram-worthy" aesthetic

## Image Specifications

- **Format:** JPG or PNG
- **Aspect Ratio:** 16:9 (landscape)
- **Recommended Size:** 1920x1080px or 1280x720px
- **Max File Size:** Keep under 500KB for web performance
- **Quality:** High quality, well-lit photos
- **Content:** Show the entire enclosure, not just closeups
- **Animal:** Can include the animal but not required

## Fallback Behavior

If an image doesn't exist, the component will show a placeholder with:
- 🦎 emoji icon
- Setup name
- Gray gradient background

This ensures the app still works even if images haven't been added yet.

