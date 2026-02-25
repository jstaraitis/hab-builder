export interface WeekdayOption {
  value: number;
  shortLabel: string;
  label: string;
}

export const WEEKDAY_OPTIONS: WeekdayOption[] = [
  { value: 1, shortLabel: 'M', label: 'Mon' },
  { value: 2, shortLabel: 'T', label: 'Tue' },
  { value: 3, shortLabel: 'W', label: 'Wed' },
  { value: 4, shortLabel: 'Th', label: 'Thu' },
  { value: 5, shortLabel: 'F', label: 'Fri' },
  { value: 6, shortLabel: 'Sat', label: 'Sat' },
  { value: 0, shortLabel: 'Sun', label: 'Sun' },
];

const normalizeWeekdays = (weekdays: number[]): number[] => {
  return [...new Set(weekdays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
};

export const encodeCustomWeekdaysForStorage = (weekdays: number[]): number | undefined => {
  const normalized = normalizeWeekdays(weekdays);
  if (normalized.length === 0) return undefined;

  const mask = normalized.reduce((result, day) => result | (1 << day), 0);
  return mask > 0 ? -mask : undefined;
};

export const decodeCustomWeekdaysFromStorage = (storedValue?: number | null): number[] | undefined => {
  if (storedValue === null || storedValue === undefined || storedValue >= 0) return undefined;

  const mask = Math.abs(storedValue);
  const days: number[] = [];

  for (let day = 0; day <= 6; day++) {
    if ((mask & (1 << day)) !== 0) {
      days.push(day);
    }
  }

  const normalized = normalizeWeekdays(days);
  return normalized.length > 0 ? normalized : undefined;
};

export const getNextDateForCustomWeekdays = (fromDate: Date, weekdays: number[]): Date => {
  const normalized = normalizeWeekdays(weekdays);
  if (normalized.length === 0) {
    const fallback = new Date(fromDate);
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }

  for (let offset = 1; offset <= 7; offset++) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + offset);
    if (normalized.includes(candidate.getDay())) {
      return candidate;
    }
  }

  const fallback = new Date(fromDate);
  fallback.setDate(fallback.getDate() + 1);
  return fallback;
};

export const getCustomWeekdayIntervalDays = (weekdays: number[]): number => {
  const normalized = normalizeWeekdays(weekdays);
  if (normalized.length === 0) return 1;
  if (normalized.length === 1) return 7;

  let maxGap = 1;

  for (let index = 0; index < normalized.length; index++) {
    const current = normalized[index];
    const next = normalized[(index + 1) % normalized.length];
    const gap = ((next - current + 7) % 7) || 7;
    maxGap = Math.max(maxGap, gap);
  }

  return maxGap;
};

export const estimateCustomWeekdayOccurrences = (days: number, weekdays: number[] | undefined): number => {
  const normalized = weekdays ? normalizeWeekdays(weekdays) : [];
  if (normalized.length === 0) return 1;

  return Math.max(1, Math.ceil((days * normalized.length) / 7));
};