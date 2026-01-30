# Shopping List Migration: Budget Tiers → Setup Quality Tiers

## Summary
Successfully migrated shopping list from budget-focused tiers (low/mid/premium) to setup quality tiers (minimum/recommended/ideal). This reframes the equipment selection from cost-based to quality-based decision making.

## Changes Made

### 1. Type Definitions (`src/engine/types.ts`)
- **Changed**: `BudgetTier` → `SetupTier`
- **Values**: `'low' | 'mid' | 'premium'` → `'minimum' | 'recommended' | 'ideal'`
- **Interface updates**:
  - `EnclosureInput.budget` → `EnclosureInput.setupTier`
  - `ShoppingItem.budgetTierOptions` → `ShoppingItem.setupTierOptions`

### 2. UI Components (`src/components/ShoppingList/ShoppingList.tsx`)
- Updated tier display labels:
  - `💰 Budget` → ` Minimum`
  - `💵 Mid-Range` → `⭐ Recommended`
  - `💎 Premium` → `💎 Ideal`
- Changed info banner text to emphasize quality levels instead of budget ranges
- Updated tier iteration from `budgetTiers` to `setupTiers`

### 3. Shopping List Generator (`src/engine/shoppingList.ts`)
- All equipment item pushes now use `setupTierOptions` instead of `budgetTierOptions`
- Updated references in:
  - `addEnclosure()` function
  - `addUVBLighting()` function
  - `addHeatLamp()` function
  - `addSubstrate()` function
  - `addMonitoring()` function

### 4. Equipment Catalog (`src/data/equipment-catalog.json`)
- Migrated all 21 items using `scripts/migrate-budget-to-setup-tiers.js`
- Changed `budgetTiers` object to `setupTiers`
- Updated `purchaseLinks` keys: `low/mid/premium` → `minimum/recommended/ideal`

### 5. Plan Generation (`src/engine/generatePlan.ts`)
- Updated warning for low-tier setup:
  - Changed from "budget-warning" to "minimum-setup-warning"
  - Updated messaging to focus on setup quality rather than cost
- Changed condition from `input.budget === 'low'` to `input.setupTier === 'minimum'`

### 6. Husbandry Care (`src/engine/husbandryCare.ts`)
- Updated heat lamp task description
- Changed from `input.budget` to `input.setupTier` with fallback to 'recommended'

### 7. CSV Scripts
- **Export** (`scripts/export-catalog-to-csv.js`):
  - CSV headers: `budget_low/mid/premium` → `setup_minimum/recommended/ideal`
  - Updated data extraction to use `setupTiers` object
  - Updated purchaseLink columns to match new tier names

- **Import** (`scripts/import-catalog-from-csv.js`):
  - Updated CSV parsing to read new column names
  - Creates `setupTiers` object instead of `budgetTiers`
  - Maps purchase links to new tier keys

### 8. Documentation (`.github/copilot-instructions.md`)
- Updated architecture overview
- Documented setup tier meanings:
  - **Minimum**: Bare essentials, functional but basic
  - **Recommended**: Balanced quality-to-cost ratio
  - **Ideal**: Premium equipment with best features
- Updated all references throughout the file

### 9. New Migration Script
- Created `scripts/migrate-budget-to-setup-tiers.js`
- Automated conversion of existing equipment catalog
- Can be referenced for future similar migrations

## Semantic Shift

### Before (Budget-Focused)
- Emphasized cost/price as primary differentiator
- Labels: "Budget", "Mid-Range", "Premium"
- User mental model: "How much can I spend?"

### After (Quality-Focused)
- Emphasizes setup completeness and quality
- Labels: "Minimum", "Recommended", "Ideal"
- User mental model: "What level of setup quality do I need?"
- Aligns better with animal welfare messaging

## Testing Recommendations

1. **Visual Testing**: Verify shopping list displays correctly with new tier labels
2. **Data Flow**: Confirm equipment catalog correctly populates `setupTierOptions`
3. **CSV Export/Import**: Test round-trip conversion maintains data integrity
4. **Type Safety**: All TypeScript compilation passes (verified)
5. **Tier Selection**: If user input for tier selection is added, update to use new values

## Future Considerations

1. **User Input**: Currently `setupTier` is optional - may want to add user selection UI
2. **Recommendations**: Could auto-select "recommended" tier based on user profile (beginner → minimum, experienced → ideal)
3. **Cost Display**: Consider adding cost estimates per tier while keeping quality focus
4. **Analytics**: Track which tier users choose most to inform future defaults

## Files Modified
- `src/engine/types.ts`
- `src/components/ShoppingList/ShoppingList.tsx`
- `src/engine/shoppingList.ts`
- `src/engine/generatePlan.ts`
- `src/engine/husbandryCare.ts`
- `src/data/equipment-catalog.json`
- `scripts/export-catalog-to-csv.js`
- `scripts/import-catalog-from-csv.js`
- `.github/copilot-instructions.md`

## New Files Created
- `scripts/migrate-budget-to-setup-tiers.js`
- `MIGRATION_BUDGET_TO_SETUP.md` (this file)

---

**Migration completed**: January 23, 2026
**Items migrated**: 21 equipment catalog entries
**TypeScript errors fixed**: 1 (husbandryCare.ts reference)
