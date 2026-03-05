import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import type { InventoryItem } from '../../types/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { appendAmazonAffiliateTag } from '../../utils/amazonLinks';
import { calculateNextDueDate, type InventoryFormState } from '../../utils/inventoryUtils';
import { InventoryItemForm } from '../Forms/InventoryItemForm';

export function EditInventoryItemView() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<InventoryFormState | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await inventoryService.getItemById(id);
        if (!isMounted) return;
        if (!data) {
          setError('Inventory item not found.');
          return;
        }

        setInitialData({
          title: data.title,
          category: data.category,
          brand: data.brand || '',
          lastReplacedAt: data.lastReplacedAt ? data.lastReplacedAt.toISOString().slice(0, 10) : '',
          reminderFrequency: data.reminderFrequency,
          customFrequencyDays: data.customFrequencyDays?.toString() || '30',
          reminderTime: data.reminderTime || '09:00',
          buyAgainUrl: data.buyAgainUrl || '',
          notes: data.notes || ''
        });
      } catch {
        if (isMounted) {
          setError('Failed to load inventory item.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadItem();
    return () => { isMounted = false; };
  }, [id]);

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async (form: InventoryFormState) => {
    if (!user || !id) return;

    const baseDate = form.lastReplacedAt ? new Date(form.lastReplacedAt) : new Date();
    const customDays = form.reminderFrequency === 'custom' ? Number(form.customFrequencyDays || 1) : undefined;
    const nextDueAt = calculateNextDueDate(
      form.reminderFrequency,
      customDays,
      form.reminderTime || undefined,
      baseDate
    );

    const payload: Partial<InventoryItem> = {
      title: form.title.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      notes: form.notes.trim() || undefined,
      reminderFrequency: form.reminderFrequency,
      customFrequencyDays: customDays,
      reminderTime: form.reminderTime || undefined,
      nextDueAt,
      lastReplacedAt: form.lastReplacedAt ? new Date(form.lastReplacedAt) : undefined,
      buyAgainUrl: form.buyAgainUrl.trim()
        ? appendAmazonAffiliateTag(form.buyAgainUrl.trim())
        : undefined,
      isActive: true
    };

    await inventoryService.updateItem(id, payload);
    navigate(returnTo || '/inventory');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading inventory item...
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
          {error || 'Item not found.'}
        </div>
      </div>
    );
  }

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
      <InventoryItemForm mode="edit" initialData={initialData} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
