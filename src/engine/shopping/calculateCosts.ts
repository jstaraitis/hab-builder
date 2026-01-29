import type {
  ShoppingItem,
  CostEstimate,
  CostBreakdown,
  PriceRange,
  SetupTier,
} from '../types';

/**
 * Calculate comprehensive cost estimates from shopping list
 */
export function calculateCostEstimate(
  shoppingList: ShoppingItem[],
  selectedTier: SetupTier = 'recommended'
): CostEstimate {
  // Calculate costs for all three tiers
  const tierTotals = {
    minimum: calculateTierTotal(shoppingList, 'minimum'),
    recommended: calculateTierTotal(shoppingList, 'recommended'),
    ideal: calculateTierTotal(shoppingList, 'ideal'),
  };

  // Calculate breakdown by category for selected tier
  const byCategory = calculateByCategory(shoppingList, selectedTier);

  // Calculate recurring costs
  const recurringCosts = calculateRecurringCosts(shoppingList, selectedTier);

  // Get the selected tier total
  const selectedTierTotal = tierTotals[selectedTier];

  return {
    total: selectedTierTotal,
    byTier: tierTotals,
    byCategory,
    recurringCosts: recurringCosts.items.length > 0 ? recurringCosts : undefined,
    itemCount: shoppingList.length,
    currency: 'USD',
  };
}

/**
 * Calculate total cost for a specific tier
 */
export function calculateTierTotal(
  shoppingList: ShoppingItem[],
  tier: SetupTier
): PriceRange {
  let totalMin = 0;
  let totalMax = 0;

  for (const item of shoppingList) {
    const itemPrice = getItemPriceForTier(item, tier);
    if (itemPrice) {
      // getItemPriceForTier already handles quantity multiplication when pricePerUnit is used
      totalMin += itemPrice.min;
      totalMax += itemPrice.max;
    }
  }

  return {
    min: Math.round(totalMin),
    max: Math.round(totalMax),
    currency: 'USD',
  };
}

/**
 * Calculate cost breakdown by category for selected tier
 */
export function calculateByCategory(
  shoppingList: ShoppingItem[],
  tier: SetupTier
): CostBreakdown[] {
  const categoryMap = new Map<string, { min: number; max: number; count: number }>();

  for (const item of shoppingList) {
    const itemPrice = getItemPriceForTier(item, tier);
    if (!itemPrice) continue;

    const category = getCategoryDisplayName(item.category);

    const existing = categoryMap.get(category) || { min: 0, max: 0, count: 0 };
    // getItemPriceForTier already handles quantity multiplication
    existing.min += itemPrice.min;
    existing.max += itemPrice.max;
    existing.count += 1;

    categoryMap.set(category, existing);
  }

  // Convert to array and sort by total cost (descending)
  const breakdown: CostBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      min: Math.round(data.min),
      max: Math.round(data.max),
      itemCount: data.count,
    }))
    .sort((a, b) => b.max - a.max);

  return breakdown;
}

/**
 * Calculate recurring costs (items that need regular replacement)
 */
export function calculateRecurringCosts(
  shoppingList: ShoppingItem[],
  tier: SetupTier
): {
  monthly: PriceRange;
  yearly: PriceRange;
  items: Array<{ name: string; interval: string; estimatedPrice: PriceRange }>;
} {
  const recurringItems = shoppingList.filter((item) => item.isRecurring);

  const items = recurringItems
    .map((item) => {
      const itemPrice = getItemPriceForTier(item, tier);
      if (!itemPrice) return null;

      return {
        name: item.name,
        interval: item.recurringInterval || 'unknown',
        estimatedPrice: {
          min: itemPrice.min,
          max: itemPrice.max,
          currency: 'USD',
        } as PriceRange,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Estimate monthly/yearly totals based on intervals
  let monthlyMin = 0;
  let monthlyMax = 0;

  for (const item of items) {
    const multiplier = getMonthlyMultiplier(item.interval);
    monthlyMin += item.estimatedPrice.min * multiplier;
    monthlyMax += item.estimatedPrice.max * multiplier;
  }

  return {
    monthly: {
      min: Math.round(monthlyMin),
      max: Math.round(monthlyMax),
      currency: 'USD',
    },
    yearly: {
      min: Math.round(monthlyMin * 12),
      max: Math.round(monthlyMax * 12),
      currency: 'USD',
    },
    items,
  };
}

/**
 * Get price range for an item at a specific tier
 * If pricePerUnit is available, multiply by quantity; otherwise use full priceRange
 */
function getItemPriceForTier(item: ShoppingItem, tier: SetupTier): PriceRange | null {
  // First check if item has estimatedPrice already set
  if (item.estimatedPrice) {
    return item.estimatedPrice;
  }

  // Get the tier option
  const tierOption = item.setupTierOptions?.[tier];
  if (!tierOption) return null;

  // If pricePerUnit exists, calculate based on quantity
  if (tierOption.pricePerUnit) {
    const qty = parseQuantity(item.quantity);
    return {
      min: Math.round(tierOption.pricePerUnit.min * qty),
      max: Math.round(tierOption.pricePerUnit.max * qty),
      currency: tierOption.pricePerUnit.currency,
    };
  }

  // Otherwise use full priceRange
  if (tierOption.priceRange) {
    return {
      min: tierOption.priceRange.min,
      max: tierOption.priceRange.max,
      currency: tierOption.priceRange.currency || 'USD',
    };
  }

  return null;
}

/**
 * Parse quantity string into numeric multiplier
 */
function parseQuantity(quantity: number | string): number {
  if (typeof quantity === 'number') {
    return quantity;
  }

  // Extract first number from string (e.g., "2 fixtures" -> 2)
  const match = quantity.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(category: ShoppingItem['category']): string {
  const displayNames: Record<ShoppingItem['category'], string> = {
    equipment: 'Equipment',
    substrate: 'Substrate',
    decor: 'Decor & Furnishings',
    live_plants: 'Live Plants',
    cleanup_crew: 'Cleanup Crew',
    nutrition: 'Nutrition',
    enclosure: 'Enclosure',
  };

  return displayNames[category] || category;
}

/**
 * Convert recurring interval to monthly multiplier
 */
function getMonthlyMultiplier(interval: string): number {
  const intervalMap: Record<string, number> = {
    weekly: 4.33,
    monthly: 1,
    bimonthly: 0.5,
    quarterly: 0.33,
    '6 months': 0.167,
    yearly: 0.083,
    '12 months': 0.083,
    '18 months': 0.056,
  };

  return intervalMap[interval.toLowerCase()] || 0.083; // default to yearly
}

/**
 * Format price range for display
 */
export function formatPriceRange(range: PriceRange): string {
  const currency = range.currency || 'USD';
  const symbol = currency === 'USD' ? '$' : currency;

  if (range.min === range.max) {
    return `${symbol}${range.min.toLocaleString()}`;
  }

  return `${symbol}${range.min.toLocaleString()} - ${symbol}${range.max.toLocaleString()}`;
}

/**
 * Get percentage difference between two price ranges
 */
export function getPriceDifference(
  price1: PriceRange,
  price2: PriceRange
): { min: number; max: number; avgPercent: number } {
  const minDiff = price2.min - price1.min;
  const maxDiff = price2.max - price1.max;
  
  const minPercent = price1.min > 0 ? (minDiff / price1.min) * 100 : 0;
  const maxPercent = price1.max > 0 ? (maxDiff / price1.max) * 100 : 0;
  const avgPercent = (minPercent + maxPercent) / 2;

  return {
    min: Math.round(minDiff),
    max: Math.round(maxDiff),
    avgPercent: Math.round(avgPercent),
  };
}
