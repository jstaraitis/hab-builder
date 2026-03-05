import type { InventoryCategory, InventoryFrequency } from '../types/inventory';

export const CATEGORY_OPTIONS: { readonly value: InventoryCategory; readonly label: string }[] = [
  { value: 'supplement', label: 'Supplement' },
  { value: 'bulb', label: 'Bulb' },
  { value: 'uvb', label: 'UVB' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'substrate', label: 'Substrate' },
  { value: 'filter-media', label: 'Filter Media' },
  { value: 'water-conditioner', label: 'Water Conditioner' },
  { value: 'food', label: 'Food' },
  { value: 'heater', label: 'Heater' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' }
];

export const FREQUENCY_OPTIONS: { readonly value: InventoryFrequency; readonly label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every other day' },
  { value: 'twice-weekly', label: 'Twice weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' }
];

export interface InventoryFormState {
  title: string;
  category: InventoryCategory;
  brand: string;
  lastReplacedAt: string;
  reminderFrequency: InventoryFrequency;
  customFrequencyDays: string;
  reminderTime: string;
  buyAgainUrl: string;
  notes: string;
}

export const EMPTY_INVENTORY_FORM: InventoryFormState = {
  title: '',
  category: 'supplement',
  brand: '',
  lastReplacedAt: '',
  reminderFrequency: 'monthly',
  customFrequencyDays: '30',
  reminderTime: '09:00',
  buyAgainUrl: '',
  notes: ''
};

export function calculateNextDueDate(
  frequency: InventoryFrequency,
  customDays: number | undefined,
  reminderTime: string | undefined,
  from: Date
): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'every-other-day':
      next.setDate(next.getDate() + 2);
      break;
    case 'twice-weekly':
      next.setDate(next.getDate() + 3);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      next.setDate(next.getDate() + (customDays || 1));
      break;
  }

  if (reminderTime) {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);
  }

  return next;
}
