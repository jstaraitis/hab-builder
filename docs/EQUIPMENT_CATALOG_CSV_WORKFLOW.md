# Equipment Catalog CSV Workflow

## 📤 Export to CSV

Convert the JSON catalog to a spreadsheet-friendly CSV format:

```bash
node scripts/export-catalog-to-csv.js
```

This creates `equipment-catalog.csv` in the project root.

## 📝 Edit in Spreadsheet

1. Open `equipment-catalog.csv` in Excel, Google Sheets, or any spreadsheet app
2. Edit the data:
   - Add/update product names
   - Fill in Amazon affiliate links
   - Add Chewy, Josh's Frogs links
   - Update info/guide URLs
   - Modify notes and descriptions

### CSV Column Structure:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique identifier | `uvb-fixture` |
| `name` | Display name | `UVB Linear Fixture` |
| `category` | Item category | `equipment` |
| `budget_low` | Budget brand option | `Zoo Med ReptiSun` |
| `budget_mid` | Mid-tier brand | `Arcadia D3 Forest` |
| `budget_premium` | Premium brand | `Arcadia ProT5` |
| `notes` | Important info | `Replace bulb every 12 months` |
| `sizing` | Default sizing info | `Sized for enclosure width` |
| `infoLink1_label` | First info link label | `UVB Guide` |
| `infoLink1_url` | First info link URL | `https://...` |
| `infoLink2_label` | Second info link label | `Setup Tutorial` |
| `infoLink2_url` | Second info link URL | `https://...` |
| `infoLink3_label` | Third info link label | (optional) |
| `infoLink3_url` | Third info link URL | (optional) |
| `purchaseLink_low` | Budget tier purchase link | `https://amzn.to/...` |
| `purchaseLink_mid` | Mid tier purchase link | `https://chewy.com/...` |
| `purchaseLink_premium` | Premium tier purchase link | `https://joshsfrogs.com/...` |

## 📥 Import from CSV

After editing, convert the CSV back to JSON:

```bash
node scripts/import-catalog-from-csv.js
```

This updates `src/data/equipment-catalog.json` with your changes.

## 💡 Tips

### Affiliate Links
- **Amazon Associates**: Use short links like `https://amzn.to/xxxxx`
- **Chewy**: Get your affiliate link from Chewy Affiliate Program
- **Josh's Frogs**: Contact them for affiliate partnership
- **The Bio Dude**: Has affiliate program for bioactive supplies

### Best Practices
- ✅ Always keep the `id` column unchanged (used for matching)
- ✅ Use consistent brand names across budget tiers
- ✅ Add helpful notes for complex items (wattage calculations, etc.)
- ✅ Include 2-3 info links per item (guides, tutorials, care sheets)
- ✅ Test all purchase links before committing
- ⚠️ Don't use commas in notes/descriptions (they'll be auto-escaped)
- ⚠️ Backup the JSON before importing CSV changes

### Adding New Items
1. Add a new row in the CSV
2. Set a unique `id` (use kebab-case: `new-item-name`)
3. Fill in all required fields (name, category)
4. Add optional fields as needed
5. Import the CSV

### Removing Items
Simply delete the row from the CSV and import.

## 🔄 Workflow Example

```bash
# 1. Export current catalog to CSV
node scripts/export-catalog-to-csv.js

# 2. Open equipment-catalog.csv in Excel/Google Sheets
# 3. Add Amazon affiliate links to all purchaseLink columns
# 4. Add ReptiFiles guide URLs to infoLink columns
# 5. Update brand names with current products
# 6. Save the CSV

# 7. Import updated CSV back to JSON
node scripts/import-catalog-from-csv.js

# 8. Commit changes
git add src/data/equipment-catalog.json
git commit -m "Updated equipment catalog with affiliate links"
```

## 🐛 Troubleshooting

**Error: "Cannot find module"**
- Make sure you're in the project root directory
- Run `npm install` first

**CSV not importing correctly**
- Check for unescaped commas in text fields
- Ensure quotes are properly closed
- Validate the CSV format in a text editor

**Missing fields after import**
- Empty cells in CSV become empty strings (expected)
- Only fields with values are added to JSON
- Check the original JSON structure for required fields
