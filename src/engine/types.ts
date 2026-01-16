import type { HusbandryCareChecklist } from './husbandryCare';

// Core type definitions for Habitat Builder

export type Units = 'in' | 'cm';
export type EnclosureType = 'glass' | 'pvc' | 'screen';
export type BudgetTier = 'low' | 'mid' | 'premium';

export interface EnclosureInput {
  width: number;
  depth: number;
  height: number;
  units: Units;
  type?: EnclosureType;
  animal: string; // animal ID
  bioactive: boolean;
  budget: BudgetTier;
  beginnerMode: boolean;
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
  budgetTierOptions?: {
    low?: string;
    mid?: string;
    premium?: string;
  };
  notes?: string;
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

export interface AnimalProfile {
  id: string;
  commonName: string;
  scientificName: string;
  careLevel: 'beginner' | 'intermediate' | 'advanced';
  minEnclosureSize: {
    width: number;
    depth: number;
    height: number;
    units: Units;
  };
  careTargets: CareTargets;
  layoutRules: LayoutRule;
  equipmentRules?: EquipmentRule[]; // Optional: not required in JSON
  warnings: Omit<Warning, 'id'>[];
  bioactiveCompatible: boolean;
  notes: string[];
  lifespan?: string; // Optional: e.g., "12-16 years"
}
