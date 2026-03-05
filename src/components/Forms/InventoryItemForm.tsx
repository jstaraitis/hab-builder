import { useState } from 'react';
import type { InventoryCategory, InventoryFrequency} from '../../types/inventory';
import {
  CATEGORY_OPTIONS,
  FREQUENCY_OPTIONS,
  EMPTY_INVENTORY_FORM,
  type InventoryFormState,
} from '../../utils/inventoryUtils';

interface InventoryItemFormProps {
  readonly mode: 'add' | 'edit';
  readonly initialData?: InventoryFormState;
  readonly onSave: (form: InventoryFormState) => Promise<void>;
  readonly onCancel: () => void;
}

export function InventoryItemForm({ mode, initialData, onSave, onCancel }: InventoryItemFormProps) {
  const [form, setForm] = useState<InventoryFormState>(initialData ?? EMPTY_INVENTORY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter an item name.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(form);
    } catch (err) {
      console.error('❌ Failed to save inventory item:', err);
      setError('Failed to save inventory item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-4">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
        {mode === 'add' ? 'Add Inventory Reminder' : 'Edit Inventory Reminder'}
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
              className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm sm:text-base min-h-[44px] sm:min-h-[42px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              style={{ colorScheme: 'light' }}
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
              className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm sm:text-base min-h-[44px] sm:min-h-[42px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              style={{ colorScheme: 'light' }}
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
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : mode === 'add' ? 'Create Reminder' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
