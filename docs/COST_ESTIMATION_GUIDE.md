# Cost Estimation System - Implementation Guide

## Overview
The cost estimation system provides users with realistic price ranges for their enclosure builds based on market research from major retailers (Amazon, Chewy, Josh's Frogs, etc.). It supports three quality tiers (minimum/recommended/ideal) and tracks both one-time setup costs and recurring expenses.

## System Architecture

### 1. Type System (`src/engine/types.ts`)

#### New Types Added:
```typescript
// Price range with min/max values
export interface PriceRange {
  min: number;
  max: number;
  currency?: string; // default 'USD'
}

// Shopping item now includes pricing
export interface ShoppingItem {
  // ... existing fields
  setupTierOptions?: {
    minimum?: { description: string; searchQuery?: string; priceRange?: PriceRange };
    recommended?: { description: string; searchQuery?: string; priceRange?: PriceRange };
    ideal?: { description: string; searchQuery?: string; priceRange?: PriceRange };
  };
  estimatedPrice?: PriceRange; // calculated based on selected tier
  isRecurring?: boolean; // true for items needing regular replacement
  recurringInterval?: string; // e.g., "monthly", "6 months", "yearly"
}

// Cost breakdown by category
export interface CostBreakdown {
  category: string;
  min: number;
  max: number;
  itemCount: number;
}

// Complete cost estimate
export interface CostEstimate {
  total: PriceRange; // Total for selected tier
  byTier: {
    minimum: PriceRange;
    recommended: PriceRange;
    ideal: PriceRange;
  };
  byCategory: CostBreakdown[]; // Breakdown by equipment/substrate/decor/etc
  recurringCosts?: {
    monthly: PriceRange;
    yearly: PriceRange;
    items: Array<{ name: string; interval: string; estimatedPrice: PriceRange }>;
  };
  itemCount: number;
  currency: string;
}

// BuildPlan now includes cost estimate
export interface BuildPlan {
  // ... existing fields
  costEstimate?: CostEstimate; // Optional: calculated cost breakdown
}
```

### 2. Calculation Logic (`src/engine/shopping/calculateCosts.ts`)

#### Main Functions:

**`calculateCostEstimate(shoppingList, selectedTier)`**
- Main entry point for cost calculations
- Returns complete CostEstimate with all breakdowns
- Called automatically by `generatePlan()`

**`calculateTierTotal(shoppingList, tier)`**
- Calculates total cost for a specific tier
- Handles quantity multipliers (e.g., "2 fixtures" → multiply price by 2)
- Returns PriceRange with min/max totals

**`calculateByCategory(shoppingList, tier)`**
- Groups items by category (equipment, substrate, decor, etc.)
- Calculates totals per category
- Returns array sorted by cost (highest first)

**`calculateRecurringCosts(shoppingList, tier)`**
- Identifies items marked as recurring (feeders, bulbs, substrate)
- Converts intervals to monthly/yearly estimates
- Returns breakdown of ongoing expenses

**Helper Functions:**
- `formatPriceRange(range)` - Formats price for display: "$50-100"
- `getPriceDifference(price1, price2)` - Calculates % difference between tiers
- `parseQuantity(quantity)` - Extracts numeric multiplier from strings

### 3. Integration with generatePlan (`src/engine/generatePlan.ts`)

The cost estimate is automatically calculated when a plan is generated:

```typescript
// In generatePlan()
const shoppingList = generateShoppingList(dimensions, profile, input);

// Calculate cost estimate based on selected tier
const costEstimate = calculateCostEstimate(shoppingList, input.setupTier || 'recommended');

return {
  // ... other fields
  shoppingList,
  costEstimate, // Added to BuildPlan
};
```

### 4. UI Component (`src/components/CostSummary/CostSummary.tsx`)

#### Features:
- **Selected Tier Total**: Large display of estimated cost for chosen tier
- **Tier Comparison**: Compare minimum/recommended/ideal side-by-side
- **Category Breakdown**: Visual bars showing cost distribution
- **Recurring Costs**: Monthly/yearly estimates for ongoing expenses
- **Price Disclaimer**: Notes about price variability

#### Props:
```typescript
interface CostSummaryProps {
  costEstimate: CostEstimate;
  selectedTier: SetupTier;
  onTierChange?: (tier: SetupTier) => void; // Optional: enable tier switching
  compact?: boolean; // Compact mode for smaller displays
}
```

#### Usage in SuppliesView:
```tsx
{plan.costEstimate && (
  <CostSummary
    costEstimate={plan.costEstimate}
    selectedTier={input.setupTier || 'recommended'}
  />
)}
```

## Data Structure - Equipment JSON Files

All equipment JSON files now include `priceRange` in each tier:

```json
{
  "uvb-fixture-forest": {
    "name": "UVB Fixture (Forest UVB)",
    "category": "equipment",
    "tiers": {
      "minimum": {
        "description": "Basic T8 UVB fixture",
        "searchQuery": "reptile uvb light fixture t8 forest 5.0",
        "priceRange": { "min": 35, "max": 55 }
      },
      "recommended": {
        "description": "Arcadia 6% T5 HO fixture",
        "searchQuery": "Arcadia ProT5 UVB Kit Forest 6%",
        "priceRange": { "min": 65, "max": 90 }
      },
      "ideal": {
        "description": "Arcadia ProT5 Kit with reflector",
        "searchQuery": "Arcadia ProT5 UVB Kit Forest 6% reflector",
        "priceRange": { "min": 120, "max": 160 }
      }
    }
  }
}
```

## Price Research Methodology

Prices reflect realistic market values as of 2024-2026:
- **Sources**: Amazon, Chewy, Josh's Frogs, LLLReptile, reptile specialty stores
- **Ranges**: Account for sales, retailer variations, size differences
- **Tiers**:
  - **Minimum**: Budget options, functional but basic
  - **Recommended**: Quality mid-tier, best value for most keepers
  - **Ideal**: Premium brands (Arcadia, Herpstat, MistKing, Bio Dude)

## Recurring Cost Items

Items marked with `isRecurring: true` in equipment configs:
- **Feeders**: Insects, vegetables, frozen rodents (weekly/monthly)
- **Bulbs**: UVB bulbs, heat bulbs (6-12 months replacement)
- **Substrate**: Replacement substrate for deep cleans (yearly)
- **Water conditioner**: Monthly/quarterly restocking
- **Supplements**: Calcium, vitamins (quarterly/yearly)

## Future Enhancements (Phase 5+)

### Real-Time Pricing Integration
- Amazon Product Advertising API for live prices
- Cache prices with TTL (refresh every 24 hours)
- Fallback to static price ranges if API unavailable

### User-Submitted Pricing
- Community price reporting feature
- Regional price adjustments (US/UK/EU/AUS markets)
- Historical price tracking and trend analysis

### Advanced Features
- Bulk discount calculations for multiple enclosures
- Price alerts when items go on sale
- Shopping cart export to major retailers
- PDF export with price totals

## Testing Recommendations

### Manual Testing Checklist:
1. Generate plans for all 12 species at different enclosure sizes
2. Verify cost totals increase: minimum < recommended < ideal
3. Check category breakdowns sum to total
4. Verify recurring cost calculations (monthly × 12 = yearly)
5. Test with bioactive vs non-bioactive (different substrate costs)
6. Test with different setup tiers selected

### Unit Tests (Future - Vitest):
```typescript
describe('calculateCostEstimate', () => {
  it('calculates tier totals correctly', () => {
    const estimate = calculateCostEstimate(mockShoppingList, 'recommended');
    expect(estimate.byTier.minimum.min).toBeLessThan(estimate.byTier.recommended.min);
    expect(estimate.byTier.recommended.min).toBeLessThan(estimate.byTier.ideal.min);
  });

  it('handles quantity multipliers', () => {
    const item = { quantity: "2 fixtures", setupTierOptions: { ... } };
    const total = calculateTierTotal([item], 'recommended');
    expect(total.min).toBe(item.price.min * 2);
  });

  it('identifies recurring costs', () => {
    const estimate = calculateCostEstimate(mockListWithRecurring, 'recommended');
    expect(estimate.recurringCosts).toBeDefined();
    expect(estimate.recurringCosts.monthly.min).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Cost Estimate Not Showing:
1. Check that `plan.costEstimate` exists in BuildPlan
2. Verify `generatePlan()` calls `calculateCostEstimate()`
3. Ensure equipment JSON files have `priceRange` fields

### Prices Seem Inaccurate:
1. Review equipment JSON files for outdated prices
2. Compare with current market prices on Amazon/Chewy
3. Update price ranges in JSON files
4. Rebuild project: `npm run build`

### Recurring Costs Missing:
1. Check that items have `isRecurring: true` in equipment configs
2. Verify `recurringInterval` is set (e.g., "monthly", "6 months")
3. Items without interval default to yearly (0.083 monthly multiplier)

## Example Output

For a White's Tree Frog in an 18×18×24 enclosure (recommended tier):

```
Total: $450-750
By Tier:
  Minimum: $280-450
  Recommended: $450-750
  Ideal: $650-1,100

By Category:
  Equipment: $180-320 (7 items)
  Substrate: $45-75 (4 items)
  Decor: $120-200 (8 items)
  Live Plants: $50-100 (1 item)
  Cleanup Crew: $25-50 (2 items)

Recurring Costs:
  Monthly: $15-30
  Yearly: $180-360
  Items: Feeder insects (monthly), UVB bulb (12 months)
```

## Contributing

To add pricing to new equipment:
1. Research current market prices from 3+ retailers
2. Add `priceRange: { min, max }` to each tier in equipment JSON
3. Set `isRecurring: true` and `recurringInterval` if applicable
4. Test cost calculations with `npm run build`
5. Submit PR with pricing rationale

---

**Last Updated**: January 2026
**Related Files**:
- `src/engine/types.ts` - Type definitions
- `src/engine/shopping/calculateCosts.ts` - Calculation logic
- `src/components/CostSummary/CostSummary.tsx` - UI component
- `src/data/equipment/*.json` - Equipment pricing data
