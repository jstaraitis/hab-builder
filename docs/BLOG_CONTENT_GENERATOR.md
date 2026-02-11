# Blog Content Generation Tool

Quick tool to generate structured blog post templates with placeholders.

## Usage

```bash
npm run generate-blog
```

Then follow the prompts:
1. Enter species name (e.g., `bearded-dragon`, `leopard-gecko`)
2. Select guide type (number or name)

## Available Guide Types

1. **enrichment-welfare** - Complete care overview, species info, enrichment
2. **enclosure-setup** - Tank sizing, equipment, setup steps
3. **substrate** - Substrate options, safety, bioactive setup
4. **feeding** - Diet, schedules, supplementation
5. **temperature-humidity** - Thermal gradients, equipment, monitoring
6. **lighting** - UVB requirements, bulbs, schedules
7. **hydration** - Water provision, misting, dehydration signs

## Output

Generates a JSON file in `src/data/blog/{species}/{species}-{guide-type}-guide.json`

The file includes:
- ✅ Proper structure with all required fields
- ✅ Section headers pre-populated
- ✅ Table templates where appropriate
- ✅ Warning/highlight placeholders
- 📝 `[Placeholders]` you need to fill in

## Workflow

1. **Generate template**: `npm run generate-blog`
2. **Fill placeholders**: Replace all `[bracketed text]` with real content
3. **Add tables**: Complete table data (already structured)
4. **Update status**: Change from `draft` → `in-progress` → `complete`
5. **Test**: View in app to check formatting

## Tips for Faster Content Creation

### Use Existing Posts as Reference
- Copy table structures from similar guides
- Reuse warning templates for common issues
- Adapt "Age-Based" sections across species

### Focus on Tables First
Tables provide the most value:
- Size charts
- Temperature/humidity ranges
- Feeding schedules
- Equipment comparisons

### Common Patterns to Reuse

**Temperature sections** (most species):
```json
{
  "headers": ["Zone", "Temperature", "Humidity", "Notes"],
  "rows": [
    ["Basking", "XX-XX°F", "XX-XX%", "Surface temp"],
    ["Warm", "XX-XX°F", "XX-XX%", "Air temp"],
    ["Cool", "XX-XX°F", "XX-XX%", "Air temp"]
  ]
}
```

**Feeding schedules** (most species):
```json
{
  "headers": ["Life Stage", "Frequency", "Portion Size", "Notes"],
  "rows": [...]
}
```

### Safety Warnings Template
```json
{
  "type": "warning",
  "severity": "important",
  "content": "[Species] must not [dangerous thing]. [Consequence]. [Solution]."
}
```

## Time Savings

- **Manual creation**: ~2-3 hours per guide
- **With template**: ~30-45 minutes per guide (60-75% faster)
- **Reusing tables**: ~15-20 minutes per guide

## Example

```bash
$ npm run generate-blog

Species name: crested-gecko
Select guide type: 3 (substrate)

✅ Generated: src/data/blog/crested-gecko/crested-gecko-substrate-guide.json
```

Then fill in the placeholders and you're done!
