import { useNavigate, useSearchParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import type { InventoryItem } from '../../types/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { appendAmazonAffiliateTag } from '../../utils/amazonLinks';
import {
  calculateNextDueDate,
  parseInventoryCosts,
  type InventoryFormState,
} from '../../utils/inventoryUtils';
import { InventoryItemForm } from '../Forms/InventoryItemForm';

export function AddInventoryItemView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async (form: InventoryFormState) => {
    if (!user) return;

    const baseDate = form.lastReplacedAt ? new Date(form.lastReplacedAt) : new Date();
    const customDays = form.reminderFrequency === 'custom' ? Number(form.customFrequencyDays || 1) : undefined;
    const nextDueAt = calculateNextDueDate(
      form.reminderFrequency,
      customDays,
      form.reminderTime || undefined,
      baseDate
    );

    // The form blocks bad values before calling us, so this only fires if that
    // check is ever removed. Better a thrown error than a silently dropped cost.
    const costs = parseInventoryCosts(form);
    if (costs.error) throw new Error(costs.error);

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
      buyAgainUrl: form.buyAgainUrl.trim()
        ? appendAmazonAffiliateTag(form.buyAgainUrl.trim())
        : undefined,
      unitCost: costs.values.unitCost,
      watts: costs.values.watts,
      hoursPerDay: costs.values.hoursPerDay,
      dutyCycle: costs.values.dutyCycle,
      isActive: true
    };

    await inventoryService.createItem(payload);
    navigate(returnTo || '/inventory');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-accent hover:text-accent font-medium"
        >
          Back
        </button>
      </div>
      <InventoryItemForm mode="add" onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
