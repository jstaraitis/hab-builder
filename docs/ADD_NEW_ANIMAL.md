# How to Add New Animals

Thanks to the recent improvements, adding new animals is now much simpler! You only need to create a single JSON file.

## Quick Start

1. **Create the animal JSON file**
   - Copy `src/data/animal-template.json` as a starting point
   - Name it: `src/data/animals/{species-id}.json` (e.g., `crested-gecko.json`)
   - The file will be **automatically discovered** - no need to update `index.ts`!

2. **Test your addition**
   ```bash
   npm run dev
   ```
   Your new animal should appear in the AnimalPicker automatically!

## JSON Structure Template

```json
{
  "id": "species-id",
  "commonName": "Common Name",
  "scientificName": "Scientific Name",
  "careLevel": "beginner|intermediate|advanced",
  "minEnclosureSize": {
    "width": 18,
    "depth": 18,
    "height": 24,
    "units": "in"
  },
  "quantityRules": {
    "baseGallons": 30,
    "additionalGallons": 10,
    "maxRecommended": 4,
    "description": "Description of quantity requirements"
  },
  "careTargets": {
    "temperature": {
      "min": 75,
      "max": 88,
      "basking": 88,
      "nighttime": {
        "min": 70,
        "max": 75
      },
      "unit": "F"
    },
    "humidity": {
      "min": 30,
      "max": 40,
      "unit": "%"
    },
    "lighting": {
      "uvbRequired": true,
      "uvbRecommended": true,
      "uvbStrength": "5.0",
      "coveragePercent": 65,
      "photoperiod": "12h day / 12h night"
    },
    "gradient": "Description of thermal gradient setup"
  },
  "layoutRules": {
    "preferVertical": true,
    "verticalSpacePercent": 55,
    "thermalGradient": "horizontal",
    "requiredZones": ["basking", "hide", "climbing", "water"],
    "optionalZones": ["feeding", "secondary_hide"]
  },
  "bioactiveCompatible": true,
  "lifespan": "12-16 years",
  "notes": [
    "Behavior notes",
    "Care tips",
    "Species-specific information"
  ],
  "warnings": [
    {
      "severity": "critical|important|tip",
      "message": "Warning message",
      "category": "safety|common_mistake|beginner_note",
      "link": {
        "text": "Learn More",
        "url": "/blog/guide-name"
      }
    }
  ],
  "relatedBlogs": [
    "feeding-guide",
    "temp-humidity-guide"
  ],
  "careGuidance": {
    "feedingNotes": [
      "Feeding schedule and amounts",
      "Feeder insect recommendations"
    ],
    "waterNotes": [
      "Water quality requirements",
      "Dish cleaning schedule"
    ],
    "mistingNotes": [
      "Misting frequency",
      "Humidity management"
    ]
  }
}
```

## Field Descriptions

### Required Fields
- **id**: Unique kebab-case identifier (e.g., `whites-tree-frog`)
- **commonName**: Display name (e.g., "White's Tree Frog")
- **scientificName**: Latin binomial (e.g., "Litoria caerulea")
- **careLevel**: `beginner`, `intermediate`, or `advanced`
- **minEnclosureSize**: Minimum dimensions in inches or cm
- **careTargets**: Temperature, humidity, lighting requirements
- **layoutRules**: Spatial preferences and zone requirements
- **warnings**: Array of safety warnings and common mistakes
- **bioactiveCompatible**: `true` or `false`
- **notes**: General care notes array

### Optional Fields
- **quantityRules**: Multi-animal housing rules (base + additional gallons)
- **lifespan**: Expected lifespan in captivity
- **relatedBlogs**: Array of blog post IDs for related content
- **careGuidance**: Species-specific feeding/water/misting instructions

## Testing Checklist

Before considering an animal "complete", test the following:

- [ ] Animal appears in the AnimalPicker component
- [ ] Generate plan with **small** enclosure (minimum size)
- [ ] Generate plan with **medium** enclosure (1.5x minimum)
- [ ] Generate plan with **large** enclosure (2x minimum)
- [ ] Test with bioactive enabled/disabled
- [ ] Test with budget tiers (low/mid/premium)
- [ ] Test with multiple animals (if quantityRules specified)
- [ ] Verify all warnings display correctly
- [ ] Check that care guidance is species-specific
- [ ] Ensure layout zones make sense for species behavior
- [ ] Build succeeds: `npm run build`

## Common Pitfalls

❌ **Don't** manually update `src/data/animals/index.ts` - it auto-generates!

❌ **Don't** add species to `care-guidance.json` - use `careGuidance` field in animal JSON

✅ **Do** use descriptive warning messages with actionable guidance

✅ **Do** include `relatedBlogs` array to link educational content

✅ **Do** test with various enclosure sizes to validate equipment calculations

## Architecture Notes

The system now uses **Vite's `import.meta.glob`** to automatically discover all `*.json` files in `src/data/animals/`. This means:

- No manual imports needed
- No registry updates required  
- Just drop in a JSON file and restart dev server
- Template file is located at `src/data/animal-template.json` (outside the animals folder to avoid import issues)

## Need Help?

Reference the existing `whites-tree-frog.json` as a complete example with all fields populated correctly.
