import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Check, Pencil, Trash2, Link as LinkIcon, CalendarClock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from '../Auth';
import { inventoryService } from '../../services/inventoryService';
import type { InventoryCategory, InventoryFrequency, InventoryItem } from '../../types/inventory';
import { appendAmazonAffiliateTag, generateAmazonSearchLink } from '../../utils/amazonLinks';

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
  { value: 'other', label: 'Other' },
];

const FREQUENCY_OPTIONS: { value: InventoryFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every other day' },
  { value: 'twice-weekly', label: 'Twice weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
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
  notes: '',
};

const AMAZON_AFFILIATE_TAG = 'habitatbuil08-20';

export function InventoryReminders() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryFormState>(EMPTY_FORM);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.nextDueAt.getTime() - b.nextDueAt.getTime());
  }, [items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getItems(user?.id);
      setItems(data);
    } catch (err) {
      console.error('❌ Failed to load inventory items:', err);
      setError('Failed to load inventory items. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingItem(null);
    setShowForm(false);
  };

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

  const handleSubmit = async () => {
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

    const payload = {
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
      isActive: true,
    };

    try {
      setError(null);
      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, payload);
      } else {
        await inventoryService.createItem(payload);
      }
      await loadItems();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to save inventory item:', err);
      setError('Failed to save inventory item.');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category,
      brand: item.brand || '',
      lastReplacedAt: item.lastReplacedAt ? item.lastReplacedAt.toISOString().slice(0, 10) : '',
      reminderFrequency: item.reminderFrequency,
      customFrequencyDays: item.customFrequencyDays?.toString() || '30',
      reminderTime: item.reminderTime || '09:00',
      buyAgainUrl: item.buyAgainUrl || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this inventory reminder?')) return;

    try {
      await inventoryService.deleteItem(itemId);
      await loadItems();
    } catch (err) {
      console.error('❌ Failed to delete inventory item:', err);
      setError('Failed to delete inventory item.');
    }
  };

  const handleMarkReplaced = async (itemId: string) => {
    try {
      await inventoryService.markReplaced(itemId);
      await loadItems();
    } catch (err) {
      console.error('❌ Failed to mark item replaced:', err);
      setError('Failed to update replacement date.');
    }
  };

  const formatFrequency = (frequency: InventoryFrequency, customDays?: number): string => {
    const map: Record<InventoryFrequency, string> = {
      daily: 'Daily',
      'every-other-day': 'Every other day',
      'twice-weekly': 'Twice weekly',
      weekly: 'Weekly',
      'bi-weekly': 'Every 2 weeks',
      monthly: 'Monthly',
      custom: 'Custom',
    };

    if (frequency === 'custom' && customDays) {
      return `Every ${customDays} day${customDays > 1 ? 's' : ''}`;
    }

    return map[frequency];
  };

  const getBuyAgainUrl = (item: InventoryItem): string | null => {
    if (item.buyAgainUrl) {
      return appendAmazonAffiliateTag(item.buyAgainUrl, AMAZON_AFFILIATE_TAG);
    }

    const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === item.category)?.label || '';
    const brandPart = item.brand ? `${item.brand} ` : '';
    const query = `${brandPart}${item.title} ${categoryLabel}`.trim();
    if (!query) return null;

    return generateAmazonSearchLink(query, AMAZON_AFFILIATE_TAG);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <Auth />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Inventory Reminders
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track consumables, replacement schedules, and buy-again links.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingItem ? 'Edit Inventory Reminder' : 'Add Inventory Reminder'}
            </h3>
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>

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

          <div className="flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
            >
              {editingItem ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedItems.length === 0 && (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
              No inventory reminders yet. Add your first item above.
            </div>
          )}
          {sortedItems.map(item => {
            const isOverdue = item.nextDueAt.getTime() < Date.now();
            const buyAgainUrl = getBuyAgainUrl(item);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 shadow-sm bg-white dark:bg-gray-800 ${
                  isOverdue ? 'border-rose-300 dark:border-rose-700' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {CATEGORY_OPTIONS.find(option => option.value === item.category)?.label}
                      {item.brand ? ` • ${item.brand}` : ''}
                    </p>
                  </div>
                  {isOverdue && (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-emerald-500" />
                    <span>Next due: {item.nextDueAt.toLocaleDateString()}</span>
                  </div>
                  <div>
                    Frequency: {formatFrequency(item.reminderFrequency, item.customFrequencyDays)}
                  </div>
                  <div>
                    Last replaced: {item.lastReplacedAt ? item.lastReplacedAt.toLocaleDateString() : 'Not set'}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleMarkReplaced(item.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark replaced
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-700 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  {buyAgainUrl && (
                    <a
                      href={buyAgainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 text-xs text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Buy again
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
