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
npm run export-animals  # Export all animal JSONs to animals-export.txt for review
```
Use CSV for bulk edits by non-developers (e.g., updating purchase links). JSON is source of truth in repo.

### Adding a New Animal
1. Create `data/animals/{species-name}.json` following `animal-template.json` schema
2. Add to `data/animals/index.ts` export: `import newAnimal from './new-animal.json'`
3. Add to `animalProfiles` object in same file
4. Provide `minEnclosureSize`, `quantityRules`, `careTargets`, `layoutRules`, `warnings`, `careGuidance`
5. Add `relatedBlogs` array with blog post IDs (see blog content section)
6. Test with small/medium/large enclosures to validate equipment sizing
7. Add species images to `public/animals/{species-name}/` (referenced in `imageUrl` and `gallery` fields)

### Adding Blog Content (Standard 6-7 Post Structure)
Each animal should have a complete set of blog posts following this structure:
1. **Enrichment & Welfare Guide** (`{species}-enrichment-welfare-guide.json`) - Complete overview, species info, quick facts, critical care requirements, getting started
2. **Enclosure Setup** (`{species}-enclosure-setup.json`) - Tank/enclosure sizing, cycling (for aquatics), equipment, setup checklist
3. **Substrate Guide** (`{species}-substrate-guide.json`) - Safe substrate options, safety warnings, maintenance
4. **Heating/Lighting OR Temperature/Water Quality** - For terrestrial: heating-lighting guide; For aquatics: temperature-water-quality guide covering nitrogen cycle
5. **Feeding Guide** (`{species}-feeding-guide.json`) - Age-based schedules, staple foods, portion sizes, foods to avoid
6. **Hydration OR Water Care** - For terrestrial: hydration-guide; For aquatics: water-care-guide (water changes, conditioning, acclimation)
7. **Optional**: Temperature-Humidity guide for terrestrial species with complex environmental needs

**Blog Content Rules:**
- Create in `data/blog/{species-name}/` directory
- Import in `data/blog/index.ts` and add to `blogPosts` object
- ContentBlock types: `intro` (hero), `section` (heading), `text`, `list`, `warning`, `highlight`, `table`
- Use `warning` blocks for critical safety info (severity: `critical`, `important`, `tip`, `caution`)
- Use `highlight` for key takeaways
- Cross-link between guides using `/blog/{blog-id}` internal links
- Author standardization: "Habitat Builder" or "Habitat Builder Team"
- **NO external links** - all content should be self-contained to reduce duplicacy and maintain control

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

### Current Animal Roster (12 Species)
**Arboreal Species:**
- White's Tree Frog (user expert - gold standard reference)
- Red-Eyed Tree Frog
- Crested Gecko
- Mourning Gecko

**Terrestrial/Semi-Arboreal:**
- Pacman Frog (ground-dwelling amphibian)
- Leopard Gecko
- Bearded Dragon
- Blue-Tongue Skink

**Snakes:**
- Ball Python
- Corn Snake

**Aquatic:**
- Axolotl (fully aquatic amphibian - cold water, nitrogen cycle critical)
- Red-Eared Slider (semi-aquatic turtle)

### Species-Specific Critical Knowledge

**Arboreal Species:**
- Need **vertical space** - height > width in enclosure dimensions
- Layout emphasis: climbing surfaces (80%+ of wall area), elevated hides, top-third basking zone
- White's Tree Frog: user's expertise animal - validate other species against this standard

**Amphibians (Pacman Frog, Tree Frogs):**
- **Screen enclosures incompatible** - cannot maintain humidity requirements
- Validation logic in `validateEnclosure.ts` checks `animalType === 'amphibian'` first
- High humidity requirements (65-85%+) necessitate glass or PVC enclosures

**Axolotl (Fully Aquatic):**
- **Temperature CRITICAL**: 60-68°F (above 72°F dangerous, above 74°F fatal)
- **Nitrogen cycle mandatory**: 4-6 week cycling before introduction, ammonia/nitrites must be 0 ppm
- **Aloe vera TOXIC**: Only use Seachem Prime or Fritz Complete water conditioners
- **Impaction danger**: NO gravel (2-15mm particles) - use bare-bottom, slate tile, or fine sand (6+ inches only)
- **Cooling equipment required** in most climates: aquarium chiller ($200-500) or dedicated room AC

**Ball Python:**
- Notorious feeding strikes - not illness, natural behavior
- Humidity needs often underestimated by beginners (50-60% minimum, 70%+ during shed)

### Common Beginner Mistakes to Warn Against
- **Glass enclosures for screen-needing species** (excessive humidity retention) - primarily arid reptiles like Bearded Dragons benefit from screen
- **Screen enclosures for amphibians** (cannot maintain humidity) - validation logic catches this in `validateEnclosure.ts`
- **Insufficient UVB coverage** (must span basking zone + 20%)
- **Substrate depth too shallow for bioactive** (need 3-4" minimum for CUC)
- **Heat sources directly above water features** (humidity interference)
- **Gravel substrate for axolotls** (fatal impaction risk) - bare-bottom, slate tile, or fine sand only
- **Warm water for axolotls** (above 72°F causes stress, above 74°F often fatal)
- **Aloe-containing water conditioners for axolotls** (toxic - only Seachem Prime or Fritz Complete)
- **Uncycled tanks for aquatic species** (ammonia poisoning from uncycled tanks)

### Equipment Sizing Rules (Examples)
- **UVB linear fixture**: 50-70% of enclosure length, positioned over basking zone
- **Heat lamp wattage**: `(enclosure_volume_ft³ × 2)` as starting point, adjust for ambient temp
- **Drainage layer**: bioactive only, 1-2" for enclosures < 18" tall, 2-3" for taller

## MVP Scope Boundaries
- **In scope**: 12 species (3 arboreal, 4 terrestrial, 2 snakes, 2 aquatic, 1 turtle), glass/PVC/screen types, deterministic rule engine, visual layouts, comprehensive blog content system (6-7 posts per species), interactive designer
- **Out of scope for v1**: Saved builds, user accounts, PDF export, custom plant libraries, automated testing (vitest installed but unused)
- **Phase 2**: Shareable URLs, Supabase integration, Stripe for premium exports, test coverage, user-submitted setups

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
