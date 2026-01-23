# Dynamic Amazon Affiliate Links - Implementation Summary

## What Was Implemented

### 1. **Dynamic Link Generation Utility** (`src/utils/amazonLinks.ts`)
- **`generateAmazonLink()`** function that:
  - Takes searchQuery template with placeholders: `{width}`, `{depth}`, `{height}`, `{size}`, `{units}`
  - Replaces placeholders with actual user dimensions from EnclosureInput
  - Calculates gallon size for aquarium searches (rounds to nearest common tank size: 10, 20, 29, 40, etc.)
  - Generates proper Amazon search URL: `https://www.amazon.com/s?k=<query>&tag=<affiliate>`
  - Supports optional affiliate tag parameter for monetization

### 2. **Equipment Catalog Conversion**
- **Removed**: Static `purchaseLink: "https://google.com"` from all 33 items × 3 tiers (99 links)
- **Added**: Dynamic `searchQuery` templates with dimension placeholders
- **Examples**:
  - Glass enclosure (minimum): `"{size} gallon glass aquarium"` → searches for "20 gallon glass aquarium"
  - Glass enclosure (recommended): `"Exo Terra {width}x{depth}x{height} glass terrarium"` → "Exo Terra 18x18x24 glass terrarium"
  - UVB lighting: `"Arcadia T5 UVB bulb"` → generic search (no dimensions needed)
  - Substrate: `"ABG mix bioactive substrate reptile"` → specific product search

### 3. **Component Updates**
- **ShoppingList.tsx**:
  - Now receives `input: EnclosureInput` prop (user's dimensions)
  - Added optional `affiliateTag?: string` prop for future monetization
  - Changed from `tierOption.purchaseLink` to `tierOption.searchQuery`
  - Calls `generateAmazonLink(tierOption.searchQuery, input, affiliateTag)` to create dynamic URLs
  
- **SuppliesView.tsx**:
  - Passes `input` prop to ShoppingList component
  - User dimensions now flow through to link generation

### 4. **Type System Updates**
- Changed `SetupTierOption` interface:
  - **Before**: `purchaseLink?: string`
  - **After**: `searchQuery?: string`
- Maintains backward compatibility (optional field)

## How It Works (User Flow)

1. **User inputs dimensions**: 18" W × 18" D × 24" H (glass terrarium for White's Tree Frog)
2. **User selects tier**: Recommended
3. **Shopping list generates**:
   - Glass Terrarium → `searchQuery: "Exo Terra {width}x{depth}x{height} glass terrarium"`
   - **Buy Now button** → generates Amazon URL: `https://www.amazon.com/s?k=Exo+Terra+18x18x24+glass+terrarium`
4. **User clicks** → searches Amazon with their exact dimensions
5. **Better product matches** → higher conversion rate for affiliate commissions

## Key Features

### ✅ Dimension-Aware Searches
- Enclosures use exact user dimensions: `{width}x{depth}x{height}`
- Equipment like UVB fixtures can use width: `T5 UVB {width} inch`
- Substrate/decor uses generic searches (dimensions not needed)

### ✅ Gallon Size Calculation
- Converts user dimensions to nearest standard tank size
- Supports both inches and centimeters (auto-converts)
- Common sizes: 10, 20, 29, 40, 55, 75, 90, 125+ gallons
- Example: 18×18×24" → **29 gallon** aquarium search

### ✅ Tier-Specific Searches
- **Minimum**: Budget-friendly generic searches (`{size} gallon glass aquarium`)
- **Recommended**: Brand-specific with dimensions (`Exo Terra {width}x{depth}x{height}`)
- **Ideal**: Premium brands with extra keywords (`Zen Habitats {width}x{depth}x{height} glass terrarium`)

### ✅ Affiliate Tag Support
- Pass `affiliateTag="your-20"` prop to ShoppingList
- Automatically appends `&tag=your-20` to all Amazon URLs
- Ready for Amazon Associates monetization

## Script Created

**`scripts/convert-to-searchquery.js`** - One-time conversion script:
- Reads equipment-catalog.json
- Removes all `purchaseLink` fields
- Adds `searchQuery` templates based on item type
- Handles 20+ equipment types with custom queries
- Can be re-run safely (idempotent)

## Testing Checklist

1. ✅ Generate plan for White's Tree Frog with 18×18×24" enclosure
2. ✅ Navigate to Supplies view
3. ✅ Verify "Buy Now" buttons appear on items with searchQuery
4. ✅ Click button → should open Amazon search with dimensions
5. ✅ Test different dimensions (12×12×18, 24×18×36) → URLs should update
6. ✅ Test different tiers (Minimum/Recommended/Ideal) → different search queries
7. ✅ Check gallon calculation (18×18×24 should → 29 gallon)

## Future Enhancements

1. **Affiliate Tag Configuration**:
   - Add `VITE_AMAZON_AFFILIATE_TAG` environment variable
   - Pass from App.tsx to all ShoppingList instances
   - Enable monetization across entire app

2. **Search Query Refinements**:
   - Add more dimension placeholders (e.g., `{length}`, `{diagonal}`)
   - Support size ranges (`{size}-{size+10} gallon`)
   - Add animal-specific keywords (`terrarium for tree frogs`)

3. **Link Analytics**:
   - Track which items users click
   - A/B test different search queries
   - Optimize for conversion rate

4. **Multi-Marketplace Support**:
   - Add `marketplaceUrl` field (defaults to amazon.com)
   - Support amazon.co.uk, amazon.de, etc.
   - Regional affiliate programs

## Code Patterns for New Items

When adding equipment to catalog:

```json
{
  "new-item-id": {
    "name": "Item Name",
    "category": "equipment",
    "importance": "required",
    "compatibleAnimals": ["whites-tree-frog"],
    "tiers": {
      "minimum": {
        "description": "Basic version description",
        "searchQuery": "generic item name terrarium"
      },
      "recommended": {
        "description": "Recommended brand with sizing",
        "searchQuery": "Brand Name {width}x{depth} item name"
      },
      "ideal": {
        "description": "Premium version",
        "searchQuery": "Premium Brand {width}x{depth}x{height} item extra keywords"
      }
    }
  }
}
```

**Guidelines**:
- Use `{width}`, `{depth}`, `{height}` for dimension-dependent items
- Use `{size}` for aquarium gallon size
- Add brand names for better product matching
- Include relevant keywords (terrarium, reptile, vivarium)
- Test search results manually before committing
