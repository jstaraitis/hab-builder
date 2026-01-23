# Habitat Builder - AI Coding Instructions

## Project Purpose
React web app that generates custom enclosure build plans for reptile/amphibian keepers. Users input dimensions and animal selection; app outputs a complete plan with layout visualizations, shopping lists, care parameters, and build steps. Think "habitat designer" not "care sheet aggregator."

## Architecture Overview

### Multi-View Application Flow (React Router)
The app uses client-side routing with 4 main views + supplemental pages:
1. **Animal Select** (`/animal`, AnimalSelectView) → Pick species, see care preview
2. **Design** (`/design`, DesignView) → Input dimensions, toggles (bioactive, setup quality)
3. **Supplies** (`/supplies`, SuppliesView) → Shopping list with setup tier options
4. **Plan** (`/plan`, PlanView) → Complete plan (steps, warnings, care targets)
5. **Designer** (`/designer`, CanvasDesigner) → Premium drag-drop layout tool (Konva)
6. **Blog** (`/blog/*`) → Educational guides rendered from JSON

Navigation is progressive: each view unlocks the next after required data is collected (`input.animal` → enable Design, `plan` → enable Supplies/Plan/Designer).

### Core Data Flow
1. **Input Layer** → User state in `App.tsx` (`EnclosureInput`)
2. **Rule Engine** → `generatePlan(input)` produces `BuildPlan`
3. **Output Layers** → Views consume `BuildPlan` to render results

### Critical Data Files
- **Animal Profiles** (`data/animals/*.json`): Species configs with care requirements, layout rules, warnings
  - Fields: `careTargets` (temp/humidity/lighting), `layoutRules` (vertical/horizontal emphasis), `quantityRules`, `bioactiveCompatible`, `notes`
- **Equipment Catalog** (`data/equipment-catalog.json`): Reusable equipment specs with setup quality tiers, compatibility, purchase links
  - Structure: `{ "item-id": { name, category, compatibleAnimals[], setupTiers{}, infoLinks{}, purchaseLinks{} } }`
  - Setup tiers: `minimum` (bare essentials), `recommended` (balanced quality), `ideal` (premium equipment)
  - Used by `shoppingList.ts` to generate shopping items with sizing calculations
- **Blog Posts** (`data/blog/*.json`): Educational guides as structured JSON with ContentBlocks
  - Types: `intro`, `section`, `text`, `list`, `warning`, `highlight`, `table`
  - Rendered by `BlogPost.tsx` with type-specific formatting

### Rule Engine Logic (Deterministic, NOT AI)
`engine/generatePlan.ts` is a pure calculator:
- **Input**: `EnclosureInput` + `AnimalProfile` → **Output**: `BuildPlan`
- Applies sizing formulas: UVB coverage (profile.uvbStrength × enclosure.width), substrate depth (bioactive = 3-4", non-bioactive = 1-2")
- Setup tiers offer three quality levels for each equipment item (minimum/recommended/ideal)
- Bioactive toggle adds drainage layer, cleanup crew, increases substrate depth
- Returns: `{ careTargets, layout, shoppingList, steps, warnings, husbandryChecklist, species, metadata }`

## Key Conventions

### Component Responsibilities
- **AnimalSelectView**: Animal picker + care preview + related blog links. Shows warnings filtered by severity (`important`/`tip` only)
- **DesignView**: Enclosure dimension inputs, type/bioactive toggles, ambient temp/humidity controls. Calls `generatePlan()` on submit
- **SuppliesView**: Shopping list with category grouping, setup tier options (minimum/recommended/ideal), purchase links
- **PlanView**: Complete build plan (steps, warnings, care targets, husbandry checklist)
- **CanvasDesigner**: Interactive drag-drop editor using Konva. Equipment from shopping list → draggable shapes. Features: grid toggle, zone overlays, undo/redo, export
- **BlogPost**: Renders JSON content blocks with type-specific components (lists, tables, warnings)

### View Component Patterns
- All views receive `input`, `plan`, `selectedProfile` props from `App.tsx`
- Views are stateless - state lives in `App.tsx` and flows down
- Navigation uses `react-router-dom` with conditional enabling (e.g., Design disabled until animal selected)

### Equipment Catalog System
Equipment is **NOT** defined in animal profiles - instead:
1. `equipment-catalog.json` defines all equipment globally
2. `shoppingList.ts` filters by `compatibleAnimals` array (empty = all animals)
3. Shopping items include `setupTierOptions` with `minimum`/`recommended`/`ideal` variants:
   - **Minimum**: Bare essentials, functional but basic
   - **Recommended**: Balanced quality-to-cost ratio, suitable for most keepers
   - **Ideal**: Premium equipment, best quality and features
4. CSV scripts (`scripts/export-catalog-to-csv.js`, `import-catalog-from-csv.js`) sync JSON ↔ CSV for non-technical editing

### Layout Generation (Currently Placeholder)
- **TopDownLayout**: Shows zones (basking, water, hide) as positioned rectangles
- **SideViewLayout**: For arboreal species - vertical layers (ground → mid → canopy)
- Zone positions calculated in `generatePlan.ts` based on `layoutRules.preferVertical`, thermal gradient needs
- **Note**: Layout generation is basic - CanvasDesigner is the real visual tool

### TypeScript Types (`engine/types.ts`)
```typescript
EnclosureInput = { width, depth, height, units, type?, animal, bioactive, setupTier?, ... }
BuildPlan = { careTargets, layout, shoppingList, steps, warnings }
AnimalProfile = { species, careTargets, layoutRules, quantityRules, warnings }
SetupTier = 'minimum' | 'recommended' | 'ideal'
```

## Development Workflows

### Daily Development Commands
```bash
npm run dev          # Start Vite dev server (default: localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint with TypeScript rules
npm run preview      # Preview production build locally
npm test             # Run Vitest (NO TESTS EXIST YET - vitest installed but unused)
```

### Equipment Catalog Maintenance
```bash
npm run export-catalog  # equipment-catalog.json → equipment-catalog.csv
npm run import-catalog  # equipment-catalog.csv → equipment-catalog.json
```
Use CSV for bulk edits by non-developers (e.g., updating purchase links). JSON is source of truth in repo.

### Adding a New Animal
1. Create `data/animals/{species-name}.json` following `animal-template.json` schema
2. Add to `data/animals/index.ts` export: `import newAnimal from './new-animal.json'`
3. Add to `animalProfiles` object in same file
4. Provide `minEnclosureSize`, `quantityRules`, `careTargets`, `layoutRules`, `warnings`
5. Test with small/medium/large enclosures to validate equipment sizing
6. Add species images to `public/animals/` (referenced in `imageUrl` and `gallery` fields)

### Adding Blog Content
1. Create `data/blog/{guide-name}.json` with ContentBlock array
2. Import in `data/blog/index.ts` and add to `blogPosts` object
3. ContentBlock types: `intro` (hero), `section` (heading), `text`, `list`, `warning`, `highlight`, `table`
4. Use `warning` blocks for critical safety info, `highlight` for key takeaways

### Modifying Rule Engine
- All calculations in `engine/generatePlan.ts` should be deterministic (no randomness)
- Extract reusable logic to separate functions within engine/ (e.g., `calculateUVBCoverage()`)
- **NO TESTS EXIST YET** but vitest is configured - tests should cover edge cases:
  - Micro enclosures (< 12"³), oversized (> 6'³), extreme ratios (1:5 width:height)
  - Bioactive vs non-bioactive substrate depth calculations
  - Multi-animal quantity scaling (e.g., 2 frogs = +10 gallons)

### Styling
- Tailwind utility-first - no custom CSS files (all styles in className props)
- Color palette: Green primary (emerald-600), view-specific accents (purple=supplies, blue=plan, indigo=designer)
- Dark mode via `useTheme()` hook - toggle stored in localStorage, applies `dark:` classes
- Mobile-first responsive: `sm:` prefix for tablet+, forms stack vertically on mobile
- Layout diagrams use HTML canvas (Konva) or SVG - never CSS absolute positioning for zone rendering

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
- **In scope**: 3 arboreal species, glass/PVC/screen types, deterministic rule engine, visual layouts, blog content system, interactive designer
- **Out of scope for v1**: Saved builds, user accounts, PDF export, terrestrial species, custom plant libraries, automated testing
- **Phase 2**: Shareable URLs, Supabase integration, Stripe for premium exports, test coverage

## File Organization Notes
- Keep `data/animals/*.json` flat - no nested profiles or inheritance (simplicity for MVP)
- `engine/rules.ts` can extract shared calculations (temp gradient, humidity zones) but keep tied to `generatePlan.ts`
- Component folders follow feature slices: `ShoppingList/` contains `ShoppingList.tsx`, related components, no separate `types.ts` (use `engine/types.ts`)
- Public assets: `/public/animals/` for species photos, `/public/equipment/` for product images, `/public/examples/` for setup photos

## Testing Strategy (Not Yet Implemented)
- Vitest installed but **zero test files exist** - this is intentional for rapid MVP development
- Future unit tests for rule engine calculations (substrate depth, equipment sizing, zone positioning)
- Manual testing workflow: Generate plans for all animals at 3 sizes (18×18×24, 24×18×36, 36×18×48)
- Visual regression tests (Storybook + Chromatic) planned for Phase 2
