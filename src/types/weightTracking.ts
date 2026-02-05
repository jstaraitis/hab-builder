/**
 * Weight Tracking Types
 * 
 * Defines data structures for tracking animal weight over time
 */

export type WeightUnit = 'g' | 'kg' | 'oz' | 'lbs';

export interface WeightLog {
  id: string;
  userId: string;
  enclosureAnimalId: string; // References enclosure_animals table
  weightGrams: number; // Always stored in grams for consistency
  measurementDate: Date;
  notes?: string;
  photoUrl?: string; // Optional: Supabase Storage path (premium feature)
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightLogInput {
  enclosureAnimalId: string;
  weightGrams: number;
  measurementDate?: Date; // Defaults to now if not provided
  notes?: string;
  photoUrl?: string;
}

export interface WeightStats {
  currentWeight: number; // grams
  previousWeight?: number; // grams
  weightChange?: number; // grams (positive = gain, negative = loss)
  weightChangePercent?: number; // percentage
  daysSinceLastWeigh?: number;
  averageWeight?: number; // grams (last 30 days)
  trend?: 'gaining' | 'stable' | 'losing'; // Based on last 3 measurements
  growthRate?: number; // grams per month (calculated from trend)
}

export interface WeightChartData {
  date: Date;
  weightGrams: number;
  formattedDate: string; // For chart display
  formattedWeight: string; // For chart display with unit
}

export interface WeightAnalytics {
  totalEntries: number;
  firstWeighDate?: Date;
  lastWeighDate?: Date;
  minWeight?: number; // grams
  maxWeight?: number; // grams
  averageWeight?: number; // grams (all time)
  stats: WeightStats;
  chartData: WeightChartData[];
}

/**
 * Weight conversion utilities
 */
export const WEIGHT_CONVERSIONS = {
  // To grams
  toGrams: {
    g: (value: number) => value,
    kg: (value: number) => value * 1000,
    oz: (value: number) => value * 28.3495,
    lbs: (value: number) => value * 453.592,
  },
  // From grams
  fromGrams: {
    g: (value: number) => value,
    kg: (value: number) => value / 1000,
    oz: (value: number) => value / 28.3495,
    lbs: (value: number) => value / 453.592,
  },
};

/**
 * Weight unit display info
 */
export const WEIGHT_UNIT_INFO: Record<WeightUnit, { label: string; decimals: number; typical: string }> = {
  g: {
    label: 'grams',
    decimals: 0,
    typical: 'Small animals (frogs, geckos under 100g)',
  },
  kg: {
    label: 'kilograms',
    decimals: 2,
    typical: 'Large reptiles (iguanas, monitors, large snakes)',
  },
  oz: {
    label: 'ounces',
    decimals: 1,
    typical: 'Medium reptiles (ball pythons, bearded dragons)',
  },
  lbs: {
    label: 'pounds',
    decimals: 2,
    typical: 'Very large reptiles (adult boas, turtles)',
  },
};
