export type InventoryCategory =
  | 'supplement'
  | 'bulb'
  | 'substrate'
  | 'filter-media'
  | 'water-conditioner'
  | 'food'
  | 'heater'
  | 'uvb'
  | 'lighting'
  | 'cleaning'
  | 'other';

export type InventoryFrequency =
  | 'daily'
  | 'every-other-day'
  | 'twice-weekly'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'custom';

export interface InventoryItem {
  id: string;
  userId?: string;
  enclosureId?: string;
  animalId?: string;

  title: string;
  category: InventoryCategory;
  brand?: string;
  notes?: string;

  reminderFrequency: InventoryFrequency;
  customFrequencyDays?: number;
  reminderTime?: string; // HH:MM
  nextDueAt: Date;
  lastReplacedAt?: Date;

  buyAgainUrl?: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
