# Dynamic Care Task Generation - Implementation Summary

## What We Built

We replaced static care task templates (JSON files) with **intelligent, dynamic task generation** that reads animal profiles and generates species-specific care tasks automatically.

## Key Benefits

### 1. **Single Source of Truth**
- Animal care data lives in `animals/*.json` profiles
- No duplicate maintenance between profiles and task templates
- Changes to animal care guidance automatically update task generation

### 2. **Bioactive-Aware**
- **Non-bioactive setups**: Include "Deep Clean Enclosure" monthly task
- **Bioactive setups**: Skip deep cleaning (cleanup crew handles it!)

### 3. **Species-Specific Intelligence**

#### White's Tree Frog Example:
- ❌ **NO daily misting** - Semi-arid species, detects humidity warnings
- ✅ **Feeding schedule** - Parses adult feeding schedule from `careGuidance.feedingSchedule`
- ✅ **Obesity checks** - Includes obesity monitoring in health checks (critical warning)
- ✅ **Water type guidance** - Adds "Use tap water + reptisafe OR spring water" from `careGuidance.waterNotes`

#### Bearded Dragon Example (hypothetical):
- ✅ **Daily fresh vegetables** - Herbivore/omnivore diet detection
- ✅ **Basking temperature** - Emphasizes 95-105°F basking zone
- ❌ **NO misting** - Arid climate, low humidity needs

#### Crested Gecko Example (hypothetical):
- ✅ **Twice-daily misting** - High humidity requirements (70-80%)
- ✅ **Evening feeding** - Nocturnal species timing
- ✅ **Fruit-based diet** - Specialized feeding instructions

## How It Works

### Architecture

```
User Creates Enclosure
    ↓
TaskCreationModal loads all animals (animalList)
    ↓
User selects animal + bioactive option
    ↓
getTemplateForAnimal(animalId, { isBioactive })
    ↓
generateCareTasks(profile, options)
    ↓
Returns dynamic task list
```

### Task Generation Logic

#### Feeding Tasks
- Detects `dietType`: Insectivore, Herbivore, Omnivore
- Parses `careGuidance.feedingSchedule` for frequency (daily, every-other-day, weekly)
- Extracts night feeding notes if present
- Example: "Adults (1 year+): 3-5 large feeders every two to three days"

#### Water Tasks
- Checks `equipmentNeeds.waterFeature` for dish/bowl presence
- Adds specific water treatment notes from `careGuidance.waterNotes`
- Skips for fully aquatic species

#### Misting/Humidity Tasks
- Analyzes `careTargets.humidity.day` min/max
- Checks `warnings` for "DO NOT use misters" or "semi-arid" keywords
- **Low humidity (< 50%)**: No misting or "as-needed" only
- **Moderate (50-70%)**: Daily misting
- **High (70%+)**: Twice-daily misting

#### Health Check Tasks
- Always included twice-weekly
- Scans `warnings` for species-specific concerns:
  - Obesity → "Check for signs of obesity or weight issues"
  - Respiratory issues → "Watch for respiratory issues"
  - UVB required → "Check for signs of MBD"

#### Supplement Tasks
- Only for insectivores
- Uses calcium/D3 guidance from `careGuidance.feedingRequirements`
- Weekly frequency default

#### Deep Clean Tasks
- **Non-bioactive only**: Monthly substrate replacement
- **Bioactive**: Skipped entirely (cleanup crew maintains substrate)

## Files Created/Modified

### New Files
- ✅ `src/services/careTaskGenerator.ts` - Core generation logic (330 lines)
- ✅ `src/test-task-generation.ts` - Test utility to preview tasks

### Modified Files
- ✅ `src/data/care-templates/index.ts` - Now calls `generateCareTasks()` instead of static import
- ✅ `src/data/animals/index.ts` - Added `getAnimalById()` helper function
- ✅ `src/components/CareCalendar/TaskCreationModal.tsx`:
  - Imports `animalList` to show all available animals
  - Passes `isBioactive` option from enclosure data
  - Logs generation with bioactive status

### Deprecated (can be deleted)
- ⚠️ `src/data/care-templates/whites-tree-frog.json` - No longer used!

## Testing

### Manual Test (in browser)
1. Start dev server: `npm run dev`
2. Create an enclosure (bioactive or non-bioactive)
3. Click "Add Task" → Choose animal → Select "Use Template"
4. Review generated tasks
5. Compare bioactive vs non-bioactive - should see different tasks!

### Console Test
Run `src/test-task-generation.ts` to see output:
```
=== NON-BIOACTIVE SETUP ===
Feed Insects (every-other-day)
  Adults (1 year+): 3-5 large feeders every two to three days
Change Water Dish (daily)
  Replace water in dish... Use tap water treated with reptile safe declorinator...
Spot Clean (daily)
  Remove any feces, uneaten food, or dead feeders...
Health Check (twice-weekly)
  Observe behavior... Check for signs of obesity...
Multivitamin Supplement (weekly)
  Dust feeders with calcium/D3 supplement 2-3x weekly
Deep Clean Enclosure (monthly)  ← Only for non-bioactive!
  Remove White's Tree Frog to temporary container...

=== BIOACTIVE SETUP ===
[Same tasks but NO deep clean!]
```

## Future Enhancements

### Phase 2 Ideas
1. **Age-based task generation**: Juvenile frogs get "Feed 10-15 small feeders nightly"
2. **Enclosure size adjustments**: Larger enclosures → more frequent spot cleaning
3. **Multi-animal scaling**: 3 frogs → "Check all individuals during health check"
4. **Seasonal tasks**: "Breeding season vocalization monitoring (Nov-Feb)"
5. **Equipment-driven tasks**: Misting system → "Check misting system timer weekly"
6. **Smart scheduling**: Morning people vs night owls → adjust task times
7. **Custom overrides**: Users can edit generated tasks and save as custom templates

## Migration Notes

- All **existing users with White's Tree Frog tasks** are unaffected (tasks already created)
- New users will get **dynamically generated tasks** going forward
- Old `whites-tree-frog.json` template can be safely deleted
- To add new animals: Just create `animals/{species}.json` with proper structure - tasks generate automatically!

## Developer Notes

### Adding New Animals
1. Create `src/data/animals/{species-name}.json`
2. Fill in `careGuidance.feedingSchedule`, `careGuidance.waterNotes`, etc.
3. Add relevant `warnings` with severity levels
4. Test task generation using test file
5. No code changes needed - tasks generate automatically!

### Customizing Task Logic
Edit `src/services/careTaskGenerator.ts`:
- Modify frequency parsing in `generateFeedingTask()`
- Adjust humidity thresholds in `generateMistingTask()`
- Add new task types (e.g., "UVB bulb replacement reminder")

### Type Safety
All tasks use `GeneratedTask` interface:
```typescript
interface GeneratedTask {
  type: string;
  title: string;
  description: string;
  frequency: string;
  scheduledTime: string;
}
```

## Success Criteria ✅

- [x] Dynamic generation from animal profiles
- [x] Bioactive-aware task filtering
- [x] Species-specific care guidance integration
- [x] All 18 animals supported automatically
- [x] Backward compatible with existing modal UI
- [x] No TypeScript errors
- [x] Zero breaking changes for existing users

---

**This is a massive improvement over static templates!** 🎉 Every animal now gets intelligent, personalized care tasks without maintaining duplicate data.
