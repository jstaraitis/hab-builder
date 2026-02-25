export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const changelogEntries: ChangelogEntry[] = [
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