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

  /**
   * What one of these costs. The cost breakdown charges it at the reminder
   * frequency, so a supplement replaced monthly counts in full every month
   * while a bulb replaced yearly counts a twelfth of itself.
   *
   * Explicitly nullable: an update that omits the key leaves the stored value
   * alone, so clearing a field has to send null rather than undefined.
   */
  unitCost?: number | null;
  /** Nameplate wattage. Uncostable without a runtime, so both matter. */
  watts?: number | null;
  hoursPerDay?: number | null;
  /**
   * Fraction of those hours the device actually draws power, 0-1. Thermostatted
   * heat cycles; assuming continuous draw roughly doubles the estimate.
   */
  dutyCycle?: number | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
