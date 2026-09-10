export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '1.0.9',
    date: '2026-09-10',
    title: 'Know your setup is right, not just recorded',
    highlights: [
      'New — Setup Check: eight questions about where things sit in your enclosure, checked against your species’ Ferguson zone. It catches the problems that take months to show up: UVB mounted out of range, the wrong bulb type entirely, a thermostat probe on the wrong surface, or no hide on the cool side.',
      'New — Vet report: a printable summary of weight, feeding, shedding, stool and husbandry for one animal, with the patterns worth raising already picked out. Anything not recorded is stated plainly, so a gap never reads as a clean result.',
      'New — “What changed?”: pick a symptom and a date, and the app reads your records back from the weeks before it — substrate swaps, bulb changes, a new feeder, temperature drift. Husbandry problems usually surface long after their cause.',
      'New — Pet-sitter care sheet: a dated checklist for whoever covers while you travel, built from your own schedule, including the things they should NOT do and your vet’s number.',
      'New — Import your collection from a spreadsheet or another app’s export. You confirm which column is which, so no particular format is needed, and duplicates are skipped.',
      'New — Nutrition insights: supplementation and feeder variety read against your UVB provision, because dietary D3 and UV exposure are two routes to the same requirement and neither number means much alone.',
      'Habitat Score now includes a Placement dimension driven by your Setup Check, so the grade reflects where your equipment is, not just what you own.',
      'UVB guidance now follows Ferguson zones, the standard exotics vets use. Every species profile carries its zone, and a new guide explains what that means for choosing a bulb and setting its height.',
      'Fixed — feeding logs recorded through a care task were being saved twice, which inflated every feeding count and could double an apparent refusal streak. Feeding history is also now tied to a specific animal rather than the whole enclosure.',
      'Fixed — the print button did nothing inside the iOS app. Reports now use the share sheet there, and always tell you what happened.',
      'Fixed — pop-ups opened near the bottom of the page instead of in view.',
      'A visual overhaul throughout: a properly loaded typeface, a single consistent colour system, and flatter, calmer surfaces.',
    ],
  },
  {
    version: '2026.04.16',
    date: '2026-04-16',
    title: 'Free tier limits & nav cleanup',
    highlights: [
      'Free accounts now include 1 enclosure, 1 animal, and unlimited care tasks — upgrade to Premium for unlimited animals and enclosures.',
      'Free tier limits are now clearly shown on the Home page, Premium page, Upgrade page, and paywall.',
    ],
  },
  {
    version: '2026.04.15',
    date: '2026-04-15',
    title: 'Apple iOS app released',
    highlights: [
      'Apple iOS release! Check us out on the app store!',
    ],
  },
  {
    version: '2026.03.11',
    date: '2026-03-11',
    title: 'Beta Program Closing Soon',
    highlights: [
      'The Animal Care Notifications beta period is coming to a close. Beta Premium accounts will be transitioned to the free tier in the near future.',
      'Your existing notifications will be preserved, but continued access will require an active Premium subscription.',
      'For questions or feedback, please reach out at josh.habitat.builder@gmail.com.',
      'A sincere thank you to everyone who participated in the beta — your feedback has been invaluable.',
    ],
  },
    {
    version: '2026.02.26',
    date: '2026-02-26',
    title: 'Task and update UX polish',
    highlights: [
      'Added a What’s New link to the Account dropdown.',
      'Improved custom frequency display in task cards.',
      'Minor UI cleanup across care task flows.',
    ],
  },
  {
    version: '2026.02.25',
    date: '2026-02-25',
    title: 'Care task scheduling improvements',
    highlights: [
      'Custom weekday frequency is now available for care tasks.',
      'You can set combinations like M/W/F or T/Th/Sat when creating and editing tasks.',
      'Task cards now show a short frequency summary label for easier scanning.',
    ],
  },
];

export const latestChangelogEntry: ChangelogEntry = changelogEntries[0];