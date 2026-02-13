/**
 * Care Calendar Types
 * 
 * Defines data structures for tracking habitat care tasks and completion logs
 */

export type TaskType = 
  | 'feeding'
  | 'misting'
  | 'water-change'
  | 'spot-clean'
  | 'deep-clean'
  | 'health-check'
  | 'supplement'
  | 'maintenance'
  | 'gut-load'
  | 'custom';

export type TaskFrequency = 
  | 'daily'
  | 'every-other-day'
  | 'twice-weekly'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
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
  streak?: number; // Days in a row completed
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
  description?: string;
  setupDate?: Date;
  animalBirthday?: Date; // Birth date of the animal in the enclosure
  substrateType?: 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other';
  isActive: boolean;
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
