# Equipment Tags Builder - Developer Tool

## Overview
A development-only tool for generating `equipmentNeeds` objects for animal JSON profiles. This UI makes it easy to select the right equipment tags without manually looking them up.

## Access
**URL:** `http://localhost:5173/dev/equipment-tags`

**Important:** This tool is only available in development mode (localhost). It will not be accessible in production builds.

## How to Use

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the tool:**
   Open `http://localhost:5173/dev/equipment-tags` in your browser

3. **Select tags:**
   - Browse tags organized by category (Heating, Humidity, Lighting, etc.)
   - Each tag shows:
     - Tag name (e.g., `lighting:uvb-forest`)
     - Description of what it does
     - Example species that use it
   - Click checkboxes to select relevant tags for your animal

4. **Copy the generated JSON:**
   - The right sidebar shows the generated `equipmentNeeds` object
   - Click "Copy" to copy to clipboard
   - Paste directly into your animal JSON file

5. **Adjust field names:**
   - The tool groups tags by their prefix (e.g., `substrate:bioactive` → `substrate: ["bioactive"]`)
   - You may need to adjust field names to match the animal profile structure

## Example Workflow

### Creating Amazon Milk Frog Equipment Needs:

1. Visit `/dev/equipment-tags`
2. Select these tags:
   - ✅ `climbing:vertical` (Activity)
   - ✅ `substrate:bioactive` (Substrate)
   - ✅ `humidity:high` (Humidity)
   - ✅ `lighting:uvb-forest` (Lighting)
   - ✅ `diet:insectivore` (Diet)
   - ✅ `animalType:amphibian` (Activity)
   - ✅ `waterFeature:shallow-dish` (Aquatic)
3. Click "Copy"
4. Paste into `amazon-milk-frog.json`

Generated output:
```json
{
  "climbing": "vertical",
  "substrate": "bioactive",
  "humidity": "high",
  "lighting": "uvb-forest",
  "diet": "insectivore",
  "animalType": "amphibian",
  "waterFeature": "shallow-dish"
}
```

## Tag Categories

The tool includes 70+ tags organized into:
- **Heating** (4 tags) - Heat sources and temperature control
- **Humidity** (4 tags) - Humidity levels and equipment
- **Lighting** (2 tags) - UVB requirements
- **Substrate** (10 tags) - Substrate types and options
- **Diet** (6 tags) - Food types and feeding equipment
- **Aquatic** (11 tags) - Filtration, water quality, maintenance
- **Decor** (12 tags) - Hides, plants, climbing structures
- **Activity** (3 tags) - Behavior and animal type

## Reference
See `EQUIPMENT_TAGS_REFERENCE.txt` in the project root for complete tag documentation.

## Development Notes

### File Location
- Component: `src/components/Admin/EquipmentTagsBuilder.tsx`
- Route: `/dev/equipment-tags` in `App.tsx`

### Production Safety
The component checks `import.meta.env.PROD` and displays an error message if accessed in production. This prevents accidental exposure of dev tools.

### Updating Tags
To add new tags, edit the `ALL_TAGS` array in `EquipmentTagsBuilder.tsx`:
```tsx
{ 
  tag: 'newTag:value', 
  category: 'Category Name', 
  description: 'What this tag does', 
  example: 'Species that use it' 
}
```

## Tips

- **Start broad, then refine:** Select all potentially relevant tags, then review the generated JSON
- **Multiple substrate options:** Animals often support multiple substrate types - select all that are safe
- **Compare with existing profiles:** Look at similar animals to see what tags they use
- **Test the generated plan:** After pasting, generate a plan to verify the equipment list is correct

## Troubleshooting

**Problem:** Tool shows "Development Tool Only" error
- **Solution:** Make sure you're running `npm run dev` and accessing via localhost (not production URL)

**Problem:** Generated JSON doesn't match animal profile structure
- **Solution:** Manually adjust field names. Some fields need specific formatting (e.g., arrays vs strings)

**Problem:** Missing tags in the list
- **Solution:** Check `EQUIPMENT_TAGS_REFERENCE.txt` for all available tags. Add missing tags to the component if needed.

## Related Tools
- **Animal Profile Preview:** `/dev/animals` - View all animal profiles with status
- **Equipment Catalog:** `data/equipment/*.json` - Raw equipment definitions
- **Tag Reference:** `EQUIPMENT_TAGS_REFERENCE.txt` - Complete tag documentation
