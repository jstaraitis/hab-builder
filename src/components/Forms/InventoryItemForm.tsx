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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-between border-b border-divider">
        <h1 className="text-lg font-bold text-white">
          {mode === 'add' ? 'Add Inventory Reminder' : 'Edit Inventory Reminder'}
        </h1>
        <button onClick={onCancel} className="text-sm font-semibold text-accent">Back</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="space-y-3 px-4 py-4">
          <div className="bg-card border border-divider rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="inventory-title" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Item name <span className="text-red-400">*</span></label>
                  <input
                    id="inventory-title"
                    value={form.title}
                    onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Arcadia T5 UVB bulb"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-category" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Category <span className="text-red-400">*</span></label>
                  <select
                    id="inventory-category"
                    value={form.category}
                    onChange={(event) => setForm(prev => ({ ...prev, category: event.target.value as InventoryCategory }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inventory-brand" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Brand</label>
                  <input
                    id="inventory-brand"
                    value={form.brand}
                    onChange={(event) => setForm(prev => ({ ...prev, brand: event.target.value }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Arcadia"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-last-replaced" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Last replaced</label>
                  <input
                    id="inventory-last-replaced"
                    type="date"
                    value={form.lastReplacedAt}
                    onChange={(event) => setForm(prev => ({ ...prev, lastReplacedAt: event.target.value }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-frequency" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Reminder frequency <span className="text-red-400">*</span></label>
                  <select
                    id="inventory-frequency"
                    value={form.reminderFrequency}
                    onChange={(event) => setForm(prev => ({ ...prev, reminderFrequency: event.target.value as InventoryFrequency }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {FREQUENCY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {form.reminderFrequency === 'custom' && (
                  <div>
                    <label htmlFor="inventory-custom-days" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Every (days) <span className="text-red-400">*</span></label>
                    <input
                      id="inventory-custom-days"
                      type="number"
                      min={1}
                      value={form.customFrequencyDays}
                      onChange={(event) => setForm(prev => ({ ...prev, customFrequencyDays: event.target.value }))}
                      className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="inventory-reminder-time" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Reminder time</label>
                  <input
                    id="inventory-reminder-time"
                    type="time"
                    value={form.reminderTime}
                    onChange={(event) => setForm(prev => ({ ...prev, reminderTime: event.target.value }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-amazon-link" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Amazon link</label>
                  <input
                    id="inventory-amazon-link"
                    value={form.buyAgainUrl}
                    onChange={(event) => setForm(prev => ({ ...prev, buyAgainUrl: event.target.value }))}
                    className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="https://www.amazon.com/dp/..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inventory-notes" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Notes</label>
                <textarea
                  id="inventory-notes"
                  value={form.notes}
                  onChange={(event) => setForm(prev => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg p-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-lg border border-divider text-white hover:bg-card-elevated transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-dim disabled:opacity-60 transition-colors text-sm"
                >
                  {saving ? 'Saving...' : mode === 'add' ? 'Create Reminder' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
