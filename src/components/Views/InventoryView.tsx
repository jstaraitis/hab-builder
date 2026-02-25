import { InventoryReminders } from '../Inventory/InventoryReminders';
import { PremiumToolOnboarding } from '../Onboarding/PremiumToolOnboarding';

export function InventoryView() {
  return (
    <>
      <PremiumToolOnboarding
        storageKey="habitat-builder:onboarding:inventory"
        title="Manage your inventory reminders"
        subtitle="Stay ahead of supplies and avoid running out."
        steps={[
          'Add consumable items you regularly replace.',
          'Set reminder frequency for each item.',
          'Review alerts and restock before supplies run low.',
        ]}
      />
      <InventoryReminders />
    </>
  );
}
