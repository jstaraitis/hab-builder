import type { HusbandryCareChecklist } from './husbandryCare';

// Core type definitions for Habitat Builder

export type Units = 'in' | 'cm';
export type EnclosureType = 'glass' | 'pvc' | 'screen';
export type BudgetTier = 'low' | 'mid' | 'premium';
export type HumidityControl = 'none' | 'manual' | 'misting-system' | 'humidifier' | 'fogger';
export type SubstrateType = 'bioactive' | 'soil-based' | 'paper-based' | 'foam';

export interface EnclosureInput {
  width: number;
  depth: number;
  height: number;
  units: Units;
  type: EnclosureType; // glass, pvc, or screen
  animal: string; // animal ID
  quantity: number; // number of animals
  bioactive: boolean;
  budget?: BudgetTier; // Optional - no longer selected in form
  // New fields
  ambientTemp: number; // °F
  ambientHumidity: number; // % (0-100)
  humidityControl: HumidityControl;
  substratePreference: SubstrateType;
  plantPreference: 'live' | 'artificial' | 'mix';
}

export interface TemperatureRange {
  min: number;
  max: number;
  basking?: number;
  unit: 'F' | 'C';
}

export interface HumidityRange {
  min: number;
  max: number;
  unit: '%';
}

export interface LightingRequirements {
  uvbRequired: boolean;
  uvbStrength?: string; // e.g., "5.0", "10.0"
  coveragePercent: number; // % of enclosure length
  photoperiod: string; // e.g., "12h day / 12h night"
}

export interface CareTargets {
  temperature: TemperatureRange;
  humidity: HumidityRange;
  lighting: LightingRequirements;
  gradient: string; // description of thermal gradient setup
}

export interface Zone {
  id: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage
  height: number; // percentage
  type: 'basking' | 'hide' | 'climbing' | 'water' | 'feeding';
}

export interface VerticalLayer {
  id: string;
  name: string;
  heightPercent: number; // height from bottom as percentage
  thickness: number; // percentage of total height
  description: string;
}

export interface Layout {
  topDown: Zone[];
  sideView: VerticalLayer[];
  notes: string[];
}

export interface ShoppingItem {
  id: string;
  category: 'equipment' | 'substrate' | 'decor' | 'live_plants' | 'cleanup_crew';
  name: string;
  quantity: number | string; // can be "2" or "1 bag (8 quarts)"
  sizing: string; // explanation of how quantity was calculated
  compatibleAnimals?: string[]; // animal IDs this is applicable to (empty = all animals)
  budgetTierOptions?: {
    low?: string;
    mid?: string;
    premium?: string;
  };
  notes?: string;
  infoLinks?: Record<string, string>; // e.g., { "Setup Guide": "url" }
  purchaseLinks?: Record<string, string>; // e.g., { "low": "url", "mid": "url" }
}

export interface BuildStep {
  id: number;
  title: string;
  description: string;
  order: number;
  important?: boolean;
}

export interface Warning {
  id: string;
  severity: 'critical' | 'important' | 'tip';
  message: string;
  category: 'safety' | 'common_mistake' | 'beginner_note';
  link?: {
    text: string;
    url: string;
  };
}

export interface BuildPlan {
  enclosure: EnclosureInput;
  careTargets: CareTargets;
  layout: Layout;
  shoppingList: ShoppingItem[];
  steps: BuildStep[];
  warnings: Warning[];
  species: {
    commonName: string;
    scientificName: string;
    careLevel: 'beginner' | 'intermediate' | 'advanced';
    bioactiveCompatible: boolean;
    notes: string[];
  };
  careGuidance: {
    feedingNotes: string[];
    waterNotes: string[];
    mistingNotes: string[];
  };
  husbandryChecklist: HusbandryCareChecklist;
  metadata: {
    generatedAt: string;
    animalSpecies: string;
    estimatedCost?: {
      low: number;
      mid: number;
      premium: number;
    };
  };
}

// Animal Profile Types (for JSON files)

export interface LayoutRule {
  preferVertical: boolean; // true for arboreal species
  verticalSpacePercent: number; // min % of height that should be climbing space
  thermalGradient: 'horizontal' | 'vertical' | 'both';
  requiredZones: Array<'basking' | 'hide' | 'climbing' | 'water'>;
  optionalZones: Array<'feeding' | 'secondary_hide'>;
}

export interface EquipmentRule {
  type: 'uvb' | 'heat_lamp' | 'substrate' | 'drainage';
  formula: string; // human-readable formula description
  calculate: (input: EnclosureInput) => number | string;
}

export interface QuantityRules {
  baseGallons: number; // gallons for single animal
  additionalGallons: number; // gallons per additional animal
  maxRecommended: number; // max animals per enclosure
  description: string; // human-readable description
}

export interface CareGuidance {
  feedingNotes: string[];
  waterNotes: string[];
  mistingNotes: string[];
}

export interface AnimalProfile {
  id: string;
  commonName: string;
  scientificName: string;
  careLevel: 'beginner' | 'intermediate' | 'advanced';
  emoji?: string; // Optional: emoji icon for animal picker (e.g., "🐸")
  completionStatus?: 'complete' | 'in-progress' | 'draft'; // Optional: profile completion status
  minEnclosureSize: {
    width: number;
    depth: number;
    height: number;
    units: Units;
  };
  quantityRules?: QuantityRules; // Optional: for species with specific quantity-based sizing
  careTargets: CareTargets;
  layoutRules: LayoutRule;
  equipmentRules?: EquipmentRule[]; // Optional: not required in JSON
  warnings: Omit<Warning, 'id'>[];
  bioactiveCompatible: boolean;
  notes: string[];
  lifespan?: string; // Optional: e.g., "12-16 years"
  relatedBlogs?: string[]; // Optional: array of blog post IDs
  careGuidance?: CareGuidance; // Optional: species-specific care guidance
  imageUrl?: string; // Optional: main profile image URL
  gallery?: Array<{ url: string; caption?: string }>; // Optional: image gallery with captions
}
