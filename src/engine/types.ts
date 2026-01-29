import type { HusbandryCareChecklist } from './husbandryCare';

// Core type definitions for Habitat Builder

export type Units = 'in' | 'cm';
export type EnclosureType = 'glass' | 'pvc' | 'screen';
export type SetupTier = 'minimum' | 'recommended' | 'ideal';
export type HumidityControl = 'none' | 'manual' | 'misting-system' | 'humidifier' | 'fogger';
export type SubstrateType = 'bioactive' | 'soil-based' | 'paper-based' | 'foam';
export type BackgroundType = 'none' | 'prebuilt' | 'custom';
export type AnimalType = 'reptile' | 'amphibian'; // Taxonomic classification for equipment/enclosure compatibility

export interface EnclosureInput {
  width: number;
  depth: number;
  height: number;
  units: Units;
  type: EnclosureType; // glass, pvc, or screen
  animal: string; // animal ID
  quantity: number; // number of animals
  bioactive: boolean;
  setupTier?: SetupTier; // Optional - system determines setup quality level
  // New fields
  ambientTemp: number; // °F
  ambientHumidity: number; // % (0-100)
  humidityControl: HumidityControl;
  substratePreference: SubstrateType;
  plantPreference: 'live' | 'artificial';
  backgroundType: BackgroundType;
  careLevelPreference?: 'beginner' | 'intermediate' | 'advanced' | 'any'; // Optional: filter animals by care difficulty
  numberOfHides: number; // 2-4 typical
  numberOfLedges: number; // 0-6 typical (for arboreal/vertical species)
  numberOfClimbingAreas: number; // 0-4 typical (for terrestrial/horizontal species)
}

export interface TemperatureRange {
  min: number;
  max: number;
  basking?: number | { min: number; max: number } | null;
  nighttime?: {
    min: number;
    max: number;
  };
  unit: 'F' | 'C';
}

export interface HumidityRange {
  min?: number; // Legacy field - kept for backwards compatibility
  max?: number; // Legacy field - kept for backwards compatibility
  day: {
    min: number;
    max: number;
  };
  night: {
    min: number;
    max: number;
  };
  shedding: {
    min: number;
    max: number;
  };
  unit: '%';
  notes?: string;
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

export interface PriceRange {
  min: number;
  max: number;
  currency?: string; // default 'USD'
}

export interface ShoppingItem {
  id: string;
  category: 'equipment' | 'substrate' | 'decor' | 'live_plants' | 'cleanup_crew' | 'nutrition' | 'enclosure';
  name: string;
  quantity: number | string; // can be "2" or "1 bag (8 quarts)"
  sizing: string; // explanation of how quantity was calculated
  incompatibleAnimals?: string[]; // animal IDs this equipment cannot be used with (empty/omitted = all animals)
  importance?: 'required' | 'recommended' | 'conditional'; // equipment importance level
  setupTierOptions?: {
    minimum?: { description: string; searchQuery?: string; priceRange?: PriceRange; pricePerUnit?: PriceRange };
    recommended?: { description: string; searchQuery?: string; priceRange?: PriceRange; pricePerUnit?: PriceRange };
    ideal?: { description: string; searchQuery?: string; priceRange?: PriceRange; pricePerUnit?: PriceRange };
  };
  estimatedPrice?: PriceRange; // calculated based on selected tier
  notes?: string;
  infoLinks?: Record<string, string>; // e.g., { "Setup Guide": "url" }
  purchaseLinks?: Record<string, string>; // e.g., { "low": "url", "mid": "url" }
  isRecurring?: boolean; // true for items that need regular replacement (feeders, bulbs, substrate)
  recurringInterval?: string; // e.g., "monthly", "6 months", "yearly"
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

export interface CostBreakdown {
  category: string;
  min: number;
  max: number;
  itemCount: number;
}

export interface CostEstimate {
  total: PriceRange;
  byTier: {
    minimum: PriceRange;
    recommended: PriceRange;
    ideal: PriceRange;
  };
  byCategory: CostBreakdown[];
  recurringCosts?: {
    monthly: PriceRange;
    yearly: PriceRange;
    items: Array<{
      name: string;
      interval: string;
      estimatedPrice: PriceRange;
    }>;
  };
  itemCount: number;
  currency: string;
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
  costEstimate?: CostEstimate; // Optional: calculated cost breakdown
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
  feedingRequirements?: string[];
  feedingSchedule?: string[];
  waterNotes: string[];
  mistingNotes: string[];
}

export interface EquipmentNeeds {
  climbing?: 'vertical' | 'ground' | 'both' | 'none'; // Type of climbing structures needed
  substrate?: Array<'bioactive' | 'soil' | 'paper' | 'foam'>; // Compatible substrate types
  humidity?: 'high' | 'moderate' | 'low'; // Determines if misting/humidifier needed
  heatSource?: 'basking' | 'ambient' | 'none'; // Type of heat needed
  waterFeature?: 'large-bowl' | 'shallow-dish' | 'pool' | 'none'; // Water needs
  animalType?: AnimalType; // Taxonomic classification for equipment compatibility and enclosure validation
  decor?: Array<'branches' | 'ledges' | 'hides' | 'plants' | 'background'>; // Specific decor needed
  lighting?: string; // Lighting type needed (e.g., 'uvb-forest', 'uvb-desert')
  diet?: string[]; // Diet types for feeding supplies matching
  bioactiveSubstrate?: string; // Type of bioactive substrate (e.g., 'tropical', 'arid')
  // Dynamic properties for specialized equipment arrays (aquatic, etc.)
  [key: string]: any; // Allow additional properties like 'filtration', 'cooling', etc.
}

export interface EquipmentConfig {
  name: string;
  category: ShoppingItem['category'];
  needsTags?: string[]; // Tags for matching equipment to animal needs (e.g., "lighting:uvb-forest")
  requiredWith?: string[]; // Equipment IDs that must be purchased together (e.g., surge protector with lighting)
  incompatibleAnimals?: string[]; // Animal IDs this equipment cannot be used with (empty/omitted = all animals)
  importance?: 'required' | 'recommended' | 'conditional';
  spec?: Record<string, string | number>; // Flexible spec properties (e.g., coverage, type, strength)
  tiers?: Record<SetupTier, { description: string; searchQuery?: string; priceRange?: PriceRange; pricePerUnit?: PriceRange }>;
  notes?: string;
  infoLinks?: Record<string, string>; // e.g., { "Setup Guide": "url" }
  purchaseLinks?: Record<string, string>; // e.g., { "low": "url", "mid": "url" }
  isRecurring?: boolean; // true for items that need regular replacement
  recurringInterval?: string; // e.g., "monthly", "6 months", "yearly"
}

export interface AnimalProfile {
  id: string;
  commonName: string;
  scientificName: string;
  careLevel: 'beginner' | 'intermediate' | 'advanced';
  emoji?: string; // Optional: emoji icon for animal picker (e.g., "🐸")
  completionStatus?: 'complete' | 'in-progress' | 'draft' | 'validated' // Optional: profile completion status
  searchQuery?: string[]; // Optional: keywords for search functionality
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
  equipmentNeeds?: EquipmentNeeds; // Optional: explicit equipment needs for this species
  notes: string[];
  setupTips?: string[]; // Optional: species-specific setup tips for enclosure building
  lifespan?: string; // Optional: e.g., "12-16 years"
  dietType?: 'Insectivore' | 'Carnivore' | 'Omnivore' | 'Herbivore'; // Optional: primary diet type
  adultSize?: string; // Optional: e.g., "7-10 inches", "4-6 feet"
  temperament?: string; // Optional: e.g., "Docile and handleable", "Shy, prefers not to be handled"
  activityPattern?: 'Diurnal' | 'Nocturnal' | 'Crepuscular' | 'Varied'; // Optional: activity time
  originRegion?: string; // Optional: e.g., "Australia", "Southeast Asia", "Eastern United States"
  relatedBlogs?: string[]; // Optional: array of blog post IDs
  careGuidance?: CareGuidance; // Optional: species-specific care guidance
  imageUrl?: string; // Optional: main profile image URL
  gallery?: Array<{ url: string; caption?: string }>; // Optional: image gallery with captions
}
