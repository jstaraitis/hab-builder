import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Check, Pencil, Link as LinkIcon, CalendarClock, Search, AlertCircle, Clock } from 'lucide-react';
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

export function InventoryReminders() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, location.key]);

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

  const getDaysUntilDue = (dueDate: Date): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getItemStatus = (item: InventoryItem): 'overdue' | 'due-soon' | 'on-track' => {
    const daysLeft = getDaysUntilDue(item.nextDueAt);
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'due-soon';
    return 'on-track';
  };

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.nextDueAt.getTime() - b.nextDueAt.getTime());
  }, [items, searchQuery]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const dueSoon = items.filter(item => {
      const daysLeft = getDaysUntilDue(item.nextDueAt);
      return daysLeft <= 7 && daysLeft >= 0;
    }).length;
    const overdue = items.filter(item => getDaysUntilDue(item.nextDueAt) < 0).length;

    return { totalItems, dueSoon, overdue };
  }, [items]);

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
      return appendAmazonAffiliateTag(item.buyAgainUrl);
    }
    const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === item.category)?.label || '';
    const brandPart = item.brand ? `${item.brand} ` : '';
    const query = `${brandPart}${item.title} ${categoryLabel}`.trim();
    if (!query) return null;

    return generateAmazonSearchLink(query);
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
    <div className="w-full bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Package className="w-8 h-8 text-accent" />
                Inventory
              </h1>
              <p className="text-muted">
                Track consumables, replacements, and reorder items for your pets.
              </p>
            </div>
            <button
              onClick={() => navigate(`/inventory/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
              className="p-2.5 bg-accent hover:bg-accent-dim text-white rounded-lg transition-colors flex-shrink-0"
              title="Add Item"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card-elevated border border-divider rounded-2xl p-2 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-xs font-medium text-muted">Items</span>
              </div>
              <p className="text-xl font-bold text-white mt-auto">{stats.totalItems}</p>
            </div>

            <div className="bg-card-elevated border border-divider rounded-2xl p-2 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-medium text-muted">Due Soon</span>
              </div>
              <p className="text-xl font-bold text-white mt-auto">{stats.dueSoon}</p>
            </div>

            <div className="bg-card-elevated border border-divider rounded-2xl p-2 flex flex-col">
              <div className="flex items-center gap-2 mb-0">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <span className="text-xs font-medium text-muted">Low Stock</span>
              </div>
              <p className="text-xl font-bold text-white mt-auto">{stats.overdue}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-divider rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted">
            {items.length === 0
              ? 'No inventory items yet. Add your first item to get started.'
              : 'No items match your search.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => {
              const daysLeft = getDaysUntilDue(item.nextDueAt);
              const status = getItemStatus(item);
              const buyAgainUrl = getBuyAgainUrl(item);
              const categoryLabel = CATEGORY_OPTIONS.find(o => o.value === item.category)?.label || item.category;

              return (
                <div
                  key={item.id}
                  className="bg-card border border-divider rounded-2xl overflow-hidden hover:border-accent/50 transition-colors"
                >
                  <div className="p-4 flex flex-col gap-3">
                    {/* Header - Title and Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white flex-1">{item.title}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                        status === 'overdue'
                          ? 'bg-rose-500/20 text-rose-300'
                          : status === 'due-soon'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {status === 'overdue' ? 'Overdue' : status === 'due-soon' ? 'Due Soon' : 'On Track'}
                      </span>
                    </div>

                    {/* Category/Brand */}
                    <p className="text-xs text-bold">{categoryLabel}{item.brand ? ` - ${item.brand}` : ''}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-1 text-xs text-muted">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Next: {item.nextDueAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Frequency: {formatFrequency(item.reminderFrequency, item.customFrequencyDays)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Last: {item.lastReplacedAt ? item.lastReplacedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
                      </div>
                    </div>

                    {/* Progress Bar and Days */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2.5 bg-card-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              status === 'overdue'
                                ? 'bg-rose-500'
                                : status === 'due-soon'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, (Math.max(0, daysLeft) / 30) * 100))}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap" style={{
                          color: status === 'overdue' ? '#f87171' : status === 'due-soon' ? '#facc15' : '#4ade80'
                        }}>
                          {daysLeft > 0 ? `${daysLeft}d` : 'Overdue'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleMarkReplaced(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Replaced
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/edit/${item.id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                          className="px-3 py-1.5 border border-divider hover:bg-card-elevated text-muted hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {buyAgainUrl && (
                            <a
                              href={buyAgainUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 border border-divider hover:bg-card-elevated text-muted hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              Buy
                            </a>
                          )}
                    </div>
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
