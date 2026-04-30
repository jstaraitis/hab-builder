/**
 * Care Calendar Types
 * 
 * Defines data structures for tracking habitat care tasks and completion logs
 */

export type TaskType = 
  | 'feeding'
  | 'misting'
  | 'water-change'
  | 'temperature-check'
  | 'humidity-check'
  | 'uvb-check'
  | 'spot-clean'
  | 'deep-clean'
  | 'health-check'
  | 'supplement'
  | 'maintenance'
  | 'substrate-check'
  | 'mold-check'
  | 'cleanup-crew-check'
  | 'plant-care'
  | 'pest-check'
  | 'gut-load'
  | 'custom';

export type TaskFrequency = 
  | 'daily'
  | 'every-other-day'
  | 'twice-weekly'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'as-needed'
  | 'custom';

export interface CareTask {
  id: string;
  userId?: string; // Optional for now, required when auth is added
  enclosureId?: string; // Optional - for multi-enclosure support later
  enclosureAnimalId?: string; // If set, task is for specific animal. If null, task is for whole enclosure
  animalId: string; // Animal profile ID (e.g., 'whites-tree-frog')
  
  // Task details
  title: string;
  description?: string;
  type: TaskType;
  frequency: TaskFrequency;
  customFrequencyDays?: number; // For custom frequency
  customFrequencyWeekdays?: number[]; // JS day indices (0=Sun ... 6=Sat) for custom weekday schedules
  
  // Scheduling
  scheduledTime?: string; // HH:MM format (e.g., "09:00")
  startDate?: Date; // Optional start date for the task (useful for scheduling future tasks like 2 weeks out)
  nextDueAt: Date;
  
  // Optional fields
  notes?: string;
  isActive: boolean;
  
  // Notifications
  notificationEnabled?: boolean;
  notificationMinutesBefore?: number; // How many minutes before due time to send notification (default: 15)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CareLog {
  id: string;
  taskId: string;
  userId?: string;
  
  // Completion details
  completedAt: Date;
  notes?: string;
  
  // Optional tracking
  skipped?: boolean;
  skipReason?: string;
  
  // Feeding-specific fields
  feederType?: string; // e.g., "Crickets", "Dubia Roaches", "Hornworms", "Fruit Mix"
  quantityOffered?: number; // How many feeders offered
  quantityEaten?: number; // How many actually consumed
  refusalNoted?: boolean; // Did the animal refuse food?
  supplementUsed?: string; // e.g., "Calcium + D3", "Multivitamin", "None"
}

export interface CareTaskWithLogs extends CareTask {
  logs: CareLog[];
  lastCompleted?: Date;
  streak?: number; // Consecutive scheduled completions
}

/**
 * Task template for species-specific care recommendations
 */
export interface TaskTemplate {
  type: TaskType;
  title: string;
  description: string;
  frequency: TaskFrequency;
  scheduledTime?: string;
  notes?: string;
}

/**
 * Species profile extension for care tasks
 */
export interface SpeciesCareProfile {
  animalId: string;
  recommendedTasks: TaskTemplate[];
}

/**
 * Enclosure - represents a habitat for a specific species
 */
export interface Enclosure {
  id: string;
  userId: string;
  name: string; // e.g., "Main Frog Tank", "Gecko Enclosure #1"
  animalId: string; // Species ID (e.g., 'whites-tree-frog')
  animalName: string; // Species name (e.g., "White's Tree Frog")
  photoUrl?: string; // Optional enclosure photo URL
  description?: string;
  setupDate?: Date;
  animalBirthday?: Date; // Birth date of the animal in the enclosure
  substrateType?: 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other';

  // Baseline enclosure configuration
  substrateDepthInches?: number;
  drainageLayerDepthInches?: number;
  bioactiveStartedOn?: Date;
  uvbBulbInstalledOn?: Date;
  uvbReplaceDueOn?: Date;
  mistingSystemType?: string;
  lightingScheduleHours?: number;
  baselineDayTempTarget?: number;
  baselineNightTempTarget?: number;
  baselineHumidityMinTarget?: number;
  baselineHumidityMaxTarget?: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type EnclosureHealthScore = 1 | 2 | 3 | 4 | 5;

export type MoldSeverity = 'none' | 'light' | 'moderate' | 'heavy';

export type EnclosureEventSeverity = 'info' | 'watch' | 'caution' | 'critical';

export type EnclosureEventType =
  | 'substrate_installed'
  | 'substrate_top_off'
  | 'substrate_partial_change'
  | 'substrate_full_change'
  | 'mold_bloom_started'
  | 'mold_bloom_resolved'
  | 'cleanup_crew_added'
  | 'cleanup_crew_restocked'
  | 'plant_added'
  | 'plant_pruned'
  | 'plant_replaced'
  | 'equipment_probe_moved'
  | 'uvb_bulb_replaced'
  | 'mister_nozzle_cleaned'
  | 'humidity_crash_incident'
  | 'pest_detected'
  | 'pest_resolved'
  | 'custom';

/**
 * EnclosureSnapshot - periodic enclosure state check
 */
export interface EnclosureSnapshot {
  id: string;
  enclosureId: string;
  userId?: string;

  recordedAt: Date;

  // Environment metrics
  dayWarmTemp?: number;
  dayCoolTemp?: number;
  nightTemp?: number;
  humidityMin?: number;
  humidityMax?: number;

  // Ecosystem health scoring
  substrateMoistureScore?: EnclosureHealthScore;
  substrateCompactionScore?: EnclosureHealthScore;
  moldSeverity?: MoldSeverity;
  cleanupCrewActivityScore?: EnclosureHealthScore;
  plantHealthScore?: EnclosureHealthScore;

  notes?: string;
  photoUrls?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * EnclosureEvent - timeline entry for interventions and lifecycle changes
 */
export interface EnclosureEvent {
  id: string;
  enclosureId: string;
  userId?: string;

  eventDate: Date;
  eventType: EnclosureEventType;
  severity?: EnclosureEventSeverity;
  quantityValue?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  photoUrls?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * EnclosureAnimal - represents an individual animal within an enclosure
 * Supports multiple animals of the same species in one enclosure
 */
export interface EnclosureAnimal {
  id: string;
  enclosureId?: string; // Optional - animals can exist without an enclosure
  userId: string;
  speciesId?: string; // Species ID from animal profiles (e.g., 'whites-tree-frog')
  speciesName?: string; // Species display name (e.g., "White's Tree Frog")
  name?: string; // Optional name (e.g., "Kermit", "Lily")
  animalNumber?: number; // Optional numbering for unnamed animals (#1, #2, etc.)
  gender?: 'male' | 'female' | 'unknown'; // Gender of the animal
  morph?: string; // Color morph/mutation (e.g., "Albino", "Leucistic", "Normal")
  birthday?: Date; // Birthday/acquisition date for age calculation
  notes?: string; // Notes about this specific animal
  photoUrl?: string; // Optional profile photo URL
  images?: string[]; // Array of image URLs (up to 10)
  
  // Acquisition/source tracking
  source?: 'breeder' | 'pet-store' | 'rescue' | 'wild-caught' | 'bred-by-me' | 'adopted' | 'other';
  sourceDetails?: string; // Name of breeder, store, rescue org, etc.
  acquisitionDate?: Date;
  acquisitionPrice?: number;
  acquisitionNotes?: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
