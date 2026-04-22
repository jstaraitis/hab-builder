import { MyAnimals } from '../CareCalendar';
import { PremiumToolOnboarding } from '../Onboarding/PremiumToolOnboarding';

export function MyAnimalsView() {
  return (
    <>
      <PremiumToolOnboarding
        storageKey="habitat-builder:onboarding:my-animals"
        title="Set up your animal profiles"
        subtitle="Track each animal’s details, growth, and care history."
        steps={[
          'Add each animal with basic profile details.',
          'Assign animals to enclosures for cleaner task tracking.',
          'Use detail pages to log health, weight, and milestones.',
        ]}
      />
      <MyAnimals />
    </>
  );
}



