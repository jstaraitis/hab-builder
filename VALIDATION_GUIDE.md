# Shopping List Validation Guide

## Setup Complete! ✓

You now have everything you need to systematically validate shopping list generation for all 18 animals.

## Quick Start

### 1. Open the Validation Tool
Open `shopping-validation.html` in your browser (double-click the file in Windows Explorer)

### 2. Dev Server is Running
The app is now running at: http://localhost:5173

### 3. Start Validating
The validation tool will:
- Show all 18 animals with their current status
- Guide you through testing each one
- Track your progress (saved in browser localStorage)
- Generate test links that open directly to the animal/design pages

## Validation Workflow

For each animal:

### Step 1: Select Animal
Click an animal card in the validation tool

### Step 2: Test Multiple Sizes
Click the size buttons (e.g., "18×18×24", "24×18×36") - this will update the app link

### Step 3: Open in App
Click "Open in App →" to open the design page with that animal and size pre-selected

### Step 4: Generate Build Plan
1. In the app, verify the dimensions are correct
2. Toggle between bioactive ON and OFF
3. Try all 3 setup tiers: Minimum, Recommended, Ideal
4. Click "Generate My Build Plan"

### Step 5: Review Shopping List
Navigate to the Supplies view and check:

#### Universal Items (All Animals)
- [ ] **Enclosure** - Correct size recommendation
- [ ] **Thermometer/Hygrometer** - For monitoring

#### For Terrestrial/Arboreal Species
- [ ] **Substrate** - Correct type and depth
  - Non-bioactive: 1-2" recommended
  - Bioactive: 3-4" minimum (for drainage + CUC activity)
- [ ] **Hides** - Quantity scales with enclosure size
- [ ] **Climbing Decor** - For arboreal (branches, vines, cork bark)
- [ ] **UVB Lighting** - If species requires it (check care targets)
- [ ] **Heat Lamp/Mat** - If basking temperature specified
- [ ] **Humidity Control** - If humidity >60% required

#### For Bioactive Setups (Toggle ON)
- [ ] **Drainage Layer** - Hydroballs, LECA, or similar
- [ ] **Mesh Barrier** - Between drainage and substrate
- [ ] **Cleanup Crew** - Isopods and/or springtails
- [ ] **Extra Substrate** - Deeper layer (3-4" vs 1-2")

#### For Aquatic Species
- [ ] **Aquarium Filter** - Sized for tank volume (4-6x GPH)
- [ ] **Aquarium Heater** - UNLESS cold-water species (axolotl)
- [ ] **Water Conditioner** - Seachem Prime or Fritz Complete
- [ ] **Nitrogen Cycle Starter** - Beneficial bacteria
- [ ] **Water Test Kit** - Ammonia, nitrite, nitrate, pH
- [ ] **Aquatic Decor** - Hides, silk plants, caves

#### For Axolotl Specifically
- [ ] **Aquarium Chiller** - CRITICAL (maintains 60-68°F)
- [ ] **Large Tank** - 30+ gallons for single adult
- [ ] **NO Gravel** - Bare-bottom, slate, or fine sand only
- [ ] **Cold-water specific filter** - High flow, gentle intake

#### For All Setup Tiers
- [ ] **Minimum tier** - Has functional equipment at lowest cost
- [ ] **Recommended tier** - Balanced quality/price options
- [ ] **Ideal tier** - Premium equipment, best features

### Step 6: Check Equipment Details
For each item in the shopping list:
- [ ] **Name** is clear and descriptive
- [ ] **Quantity** scales appropriately with enclosure size
- [ ] **Price range** is reasonable and current
- [ ] **Notes** explain why it's needed
- [ ] **All 3 tiers** have different options

### Step 7: Document Issues
In the validation tool:
1. Check off items as you verify them
2. Add notes about any issues found:
   - Missing equipment
   - Wrong quantities
   - Incorrect sizing
   - Unclear descriptions
   - Broken purchase links
   - Price discrepancies

### Step 8: Mark Status
- **✓ Mark as Validated** - Everything looks good
- **⚠ Mark as Has Issues** - Found problems (documented in notes)
- **Skip for Now** - Will come back to this one

## Common Issues to Watch For

### Missing Equipment
- UVB lighting for species that require it
- Heating for species with basking requirements
- Humidity control for high-humidity species (>70%)
- Water features for species that need them

### Incorrect Quantities
- Substrate: Should scale with enclosure floor area
- Hides: Typically 2-3 minimum, more for larger enclosures
- Climbing structures: More for arboreal species

### Bioactive Issues
- Drainage layer not added when bioactive toggle ON
- Cleanup crew missing
- Substrate not deep enough (should be 3-4")

### Aquatic Issues
- Filter missing or undersized (should be 4-6x tank volume per hour)
- Heater included for cold-water species (BAD for axolotl!)
- Water conditioner with aloe (TOXIC to axolotls)
- No nitrogen cycle starter bacteria

### Tier Problems
- Only one tier has options (should have 3)
- Tiers too similar (no meaningful differences)
- Ideal tier not clearly better than recommended

### Arboreal-Specific
- Not enough vertical climbing surfaces
- Missing elevated hides or platforms
- Decor doesn't utilize height

## Testing Priority

### Phase 1: Validated Animals (Gold Standard)
These should be correct - verify they are:
1. White's Tree Frog ⭐ (User's expert species)
2. Crested Gecko
3. Bearded Dragon
4. Axolotl

### Phase 2: In-Progress Animals
These need the most attention:
5. Red-Eyed Tree Frog
6. Leopard Gecko
7. Pacman Frog
8. Red-Eared Slider
9. Mourning Gecko

### Phase 3: Draft Animals
These may be incomplete:
10. Amazon Milk Frog
11. Gargoyle Gecko
12. Veiled Chameleon
13. Ball Python
14. Corn Snake
15. Blue-Tongue Skink
16. Tomato Frog
17. Uromastyx
18. African Clawed Frog

## Files to Check When Issues Found

### Animal Profile
`src/data/animals/{animal-id}.json`
- **equipmentNeeds** section defines what equipment is needed
- **careTargets** defines temperature, humidity, lighting requirements
- **quantityRules** affects equipment scaling

### Equipment Catalogs
`src/data/equipment/`
- `lighting.json` - UVB, basking lights
- `heating.json` - Heat lamps, mats, CHE
- `substrate.json` - Substrate types and depths
- `decor.json` - Hides, branches, plants
- `aquatic.json` - Filters, heaters, chillers
- `monitoring.json` - Thermometers, hygrometers
- `humidity.json` - Misters, foggers

### Generation Logic
`src/engine/shopping/generators/`
- `lighting.ts` - UVB logic
- `heating.ts` - Heat lamp logic
- `substrate.ts` - Substrate depth calculations
- `decor.ts` - Hide and climbing structure quantity
- `specialized.ts` - Aquatic equipment (uses autoIncludeFor rules)
- `environmental.ts` - Humidity control
- `monitoring.ts` - Thermometer/hygrometer
- `water.ts` - Water bowls
- `feeding.ts` - Food and supplements

## Validation Report

The script generated a JSON report: `shopping-validation-report.json`

This contains:
- Expected categories for each animal
- Number of test cases per animal
- Completion status
- Equipment needs configuration

## Tips for Efficient Validation

1. **Test smallest and largest sizes first** - Edge cases reveal issues
2. **Toggle bioactive on/off** - Make sure it adds drainage + CUC
3. **Compare across tiers** - Ensure meaningful differences
4. **Check animal type consistency** - Arboreal → vertical structures, Aquatic → filtration
5. **Use browser DevTools** - Check console for warnings/errors
6. **Keep notes detailed** - Document specific items missing or incorrect
7. **Take screenshots** - For complex issues that need visual explanation

## Next Steps After Validation

Once you've validated all animals:

1. **Review validation notes** - Prioritize issues by severity
2. **Fix equipment catalog** - Add missing items, update prices
3. **Update generation logic** - Fix quantity calculations
4. **Improve animal profiles** - Update equipmentNeeds configurations
5. **Re-test problem animals** - Verify fixes work correctly
6. **Update completionStatus** - Change from 'draft' to 'in-progress' or 'validated'

## Export Validation Results

Your validation progress is saved in browser localStorage. To export:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `JSON.stringify(localStorage.getItem('habBuilderValidation'), null, 2)`
4. Copy the output to save your notes

## Questions to Answer During Validation

For each animal:
- [ ] Does the shopping list match the care requirements in the animal profile?
- [ ] Are quantities appropriate for the enclosure size?
- [ ] Do all 3 setup tiers have meaningful options?
- [ ] Is critical equipment clearly marked as required?
- [ ] Are prices realistic and competitive?
- [ ] Do bioactive toggles work correctly?
- [ ] Are aquatic species getting proper filtration?
- [ ] Do arboreal species get enough climbing structures?
- [ ] Are there any duplicate items?
- [ ] Are item descriptions clear and helpful?

## Success Criteria

A validated animal should:
✓ Have complete shopping lists at all enclosure sizes
✓ Include all required equipment based on care targets
✓ Scale quantities appropriately with enclosure dimensions
✓ Offer 3 distinct setup tier options for each item
✓ Have no critical equipment missing
✓ Show correct bioactive additions when enabled
✓ Display accurate price ranges
✓ Include helpful notes explaining each item

---

**Happy Validating! 🦎🐸🐍**

Start with White's Tree Frog (your gold standard) to see what "correct" looks like, then work through the others systematically.
