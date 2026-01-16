# Habitat Builder - AI Coding Instructions

## Project Purpose
React web app that generates custom enclosure build plans for reptile/amphibian keepers. Users input dimensions and animal selection; app outputs a complete plan with layout visualizations, shopping lists, care parameters, and build steps. Think "habitat designer" not "care sheet aggregator."

## Architecture Overview

### Core Flow
1. **Input Layer** (`EnclosureForm`, `AnimalPicker`) → collects dimensions, animal, toggles
2. **Rule Engine** (`engine/generatePlan.ts`) → processes inputs against animal profiles
3. **Output Layer** → renders plan (layouts, shopping list, steps, warnings)

### Data Model
- **Animal Profiles** (`data/animals/*.json`): JSON configs with care requirements, equipment needs, spatial rules
- Each profile defines:
  - `careTargets`: temp/humidity ranges, lighting specs
  - `layoutRules`: vertical vs horizontal emphasis, zone requirements (basking, hide, climbing)
  - `equipmentRules`: sizing formulas (e.g., "UVB length = 0.6 × enclosure width")
  - `warnings`: common mistakes, beginner safety notes

### Rule Engine Logic
The engine (`engine/generatePlan.ts`) is **NOT** AI-generated suggestions - it's a deterministic calculator:
- Takes `EnclosureInput` + `AnimalProfile` → produces `BuildPlan`
- Applies sizing rules: drainage layer depth, substrate depth, lighting coverage
- Budget toggle affects equipment tier (e.g., budget: Zoo Med vs premium: Arcadia)
- Bioactive toggle adds cleanup crew, drainage layer, more substrate depth
- Beginner Safe Mode filters out advanced techniques/species variations

## Key Conventions

### Component Responsibilities
- `EnclosureForm`: Just inputs - no logic. Emits onChange with full state
- `AnimalPicker`: Visual card grid, highlights incompatible animals based on size
- `PlanPreview`: Orchestrates all output components, receives `BuildPlan` object
- `Layout/*`: Pure visual components - receive calculated zone placements, no layout logic
- `ShoppingList`: Groups by category (equipment, substrate, decor), shows quantity calculations
- `Steps`: Sequential build instructions - order matters (drainage → barrier → substrate → decor → animals)

### Layout Generation
- **TopDownLayout**: Shows zones (basking, water feature, hide spots) as positioned rectangles
- **SideViewLayout**: For arboreal species - shows vertical layers (ground → mid → canopy)
- Positions are calculated in `engine/generatePlan.ts` based on:
  - Animal's `preferredZones` (e.g., tree frogs need 60% vertical space)
  - Thermal gradient requirements (warm side vs cool side)
  - Viewing angles (decor shouldn't block front glass)

### TypeScript Types (`engine/types.ts`)
```typescript
EnclosureInput = { width, depth, height, units, type?, animal, bioactive, budget, beginnerMode }
BuildPlan = { careTargets, layout, shoppingList, steps, warnings }
AnimalProfile = { species, careTargets, layoutRules, equipmentRules, warnings }
```

## Development Workflows

### Adding a New Animal
1. Create `data/animals/{species-name}.json` following existing schema
2. Add profile to `data/animals/index.ts` export
3. Update `AnimalPicker` options array
4. Test with min/max enclosure sizes to validate equipment rules

### Modifying Rule Engine
- All calculations in `engine/generatePlan.ts` must be **unit-tested**
- Edge cases: micro enclosures (< 12"³), oversized (> 6'³), extreme ratios (tall/narrow)
- Rules should gracefully degrade (e.g., if enclosure too small, warn but still generate plan)

### Styling
- Tailwind utility-first - no custom CSS unless absolutely necessary
- Layout components use canvas or SVG for zone diagrams (not CSS positioning)
- Mobile-first responsive design (forms stack, layouts switch to vertical orientation)

## Domain-Specific Knowledge

### Arboreal Species Focus (MVP)
- Eastern Gray Tree Frog, White's Tree Frog, Crested Gecko
- These need **vertical space** - height > width in enclosure dimensions
- Layout emphasis: climbing surfaces (80%+ of wall area), elevated hides, top-third basking zone

### Common Beginner Mistakes to Warn Against
- Glass enclosures for screen-needing species (excessive humidity retention)
- Insufficient UVB coverage (must span basking zone + 20%)
- Substrate depth too shallow for bioactive (need 3-4" minimum for CUC)
- Heat sources directly above water features (humidity interference)

### Equipment Sizing Rules (Examples)
- **UVB linear fixture**: 50-70% of enclosure length, positioned over basking zone
- **Heat lamp wattage**: `(enclosure_volume_ft³ × 2)` as starting point, adjust for ambient temp
- **Drainage layer**: bioactive only, 1-2" for enclosures < 18" tall, 2-3" for taller

## MVP Scope Boundaries
- **In scope**: 3 arboreal species, glass/PVC/screen types, basic rule engine, visual layouts
- **Out of scope for v1**: Saved builds, user accounts, PDF export, terrestrial species, custom plant libraries
- **Phase 2**: Shareable URLs, Supabase integration, Stripe for premium exports

## File Organization Notes
- Keep `data/animals/*.json` flat - no nested profiles or inheritance (simplicity for MVP)
- `engine/rules.ts` can extract shared calculations (temp gradient, humidity zones) but keep tied to `generatePlan.ts`
- Component folders follow feature slices - `ShoppingList/` contains `ShoppingList.tsx`, `ShoppingListItem.tsx`, `types.ts`

## Testing Strategy
- Unit tests for rule engine (Jest) - high coverage required
- Visual regression tests for layouts (Storybook + Chromatic later)
- Manual testing: generate plans for all 3 animals at 3 enclosure sizes (small/med/large)
