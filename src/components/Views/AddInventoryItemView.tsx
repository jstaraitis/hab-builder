import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import type { InventoryCategory, InventoryFrequency, InventoryItem } from '../../types/inventory';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORY_OPTIONS: { value: InventoryCategory; label: string }[] = [
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

const FREQUENCY_OPTIONS: { value: InventoryFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every other day' },
  { value: 'twice-weekly', label: 'Twice weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' }
];

interface InventoryFormState {
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

const EMPTY_FORM: InventoryFormState = {
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

export function AddInventoryItemView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [form, setForm] = useState<InventoryFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateNextDueDate = (
    frequency: InventoryFrequency,
    customDays: number | undefined,
    reminderTime: string | undefined,
    from: Date
  ): Date => {
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
  };

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (!form.title.trim()) {
      setError('Please enter an item name.');
      return;
    }

    const baseDate = form.lastReplacedAt ? new Date(form.lastReplacedAt) : new Date();
    const customDays = form.reminderFrequency === 'custom' ? Number(form.customFrequencyDays || 1) : undefined;
    const nextDueAt = calculateNextDueDate(
      form.reminderFrequency,
      customDays,
      form.reminderTime || undefined,
      baseDate
    );

    const payload: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      title: form.title.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      notes: form.notes.trim() || undefined,
      reminderFrequency: form.reminderFrequency,
      customFrequencyDays: customDays,
      reminderTime: form.reminderTime || undefined,
      nextDueAt,
      lastReplacedAt: form.lastReplacedAt ? new Date(form.lastReplacedAt) : undefined,
      buyAgainUrl: form.buyAgainUrl.trim() || undefined,
      isActive: true
    };

    try {
      setSaving(true);
      setError(null);
      await inventoryService.createItem(payload);

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/inventory');
      }
    } catch (err) {
      console.error('❌ Failed to save inventory item:', err);
      setError('Failed to save inventory item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium"
        >
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-4">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Add Inventory Reminder
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item name</label>
              <input
                id="inventory-title"
                value={form.title}
                onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Arcadia T5 UVB bulb"
              />
            </div>
            <div>
              <label htmlFor="inventory-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                id="inventory-category"
                value={form.category}
                onChange={(event) => setForm(prev => ({ ...prev, category: event.target.value as InventoryCategory }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inventory-brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand (optional)</label>
              <input
                id="inventory-brand"
                value={form.brand}
                onChange={(event) => setForm(prev => ({ ...prev, brand: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Arcadia"
              />
            </div>
            <div>
              <label htmlFor="inventory-last-replaced" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last replaced</label>
              <input
                id="inventory-last-replaced"
                type="date"
                value={form.lastReplacedAt}
                onChange={(event) => setForm(prev => ({ ...prev, lastReplacedAt: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="inventory-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder frequency</label>
              <select
                id="inventory-frequency"
                value={form.reminderFrequency}
                onChange={(event) => setForm(prev => ({ ...prev, reminderFrequency: event.target.value as InventoryFrequency }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                {FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {form.reminderFrequency === 'custom' && (
              <div>
                <label htmlFor="inventory-custom-days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Every (days)</label>
                <input
                  id="inventory-custom-days"
                  type="number"
                  min={1}
                  value={form.customFrequencyDays}
                  onChange={(event) => setForm(prev => ({ ...prev, customFrequencyDays: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label htmlFor="inventory-reminder-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder time</label>
              <input
                id="inventory-reminder-time"
                type="time"
                value={form.reminderTime}
                onChange={(event) => setForm(prev => ({ ...prev, reminderTime: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="inventory-amazon-link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amazon link (optional)</label>
              <input
                id="inventory-amazon-link"
                value={form.buyAgainUrl}
                onChange={(event) => setForm(prev => ({ ...prev, buyAgainUrl: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="https://www.amazon.com/dp/..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="inventory-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
            <textarea
              id="inventory-notes"
              value={form.notes}
              onChange={(event) => setForm(prev => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
