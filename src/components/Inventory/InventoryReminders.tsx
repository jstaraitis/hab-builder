import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Check, Pencil, Trash2, Link as LinkIcon, CalendarClock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const AMAZON_AFFILIATE_TAG = 'habitatbuil08-20';

export function InventoryReminders() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, location.key]);

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
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Package className="w-8 h-8 text-emerald-600" />
              Inventory Reminders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track consumables, replacement schedules, and buy-again links.
            </p>
          </div>
          <button
            onClick={() => navigate(`/inventory/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center"
            title="Add Item"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
          {error}
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
              No inventory reminders yet. Add your first item to get started.
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
                    onClick={() => navigate(`/inventory/edit/${item.id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
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
    </div>
  );
}
