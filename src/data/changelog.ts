export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = [
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