import { CareCalendar } from '../CareCalendar';
import { PremiumToolOnboarding } from '../Onboarding/PremiumToolOnboarding';

export function CareCalendarView() {
  return (
    <>
      <PremiumToolOnboarding
        storageKey="habitat-builder:onboarding:care-calendar"
        title="Get started with Care Tasks"
        subtitle="Set up your core routine in under a minute."
        steps={[
          'Create or confirm your enclosure and animal.',
          'Add recurring tasks like feeding, misting, and cleaning.',
          'Enable reminders and complete tasks to build consistency.',
        ]}
      />
      <CareCalendar />
    </>
  );
}
