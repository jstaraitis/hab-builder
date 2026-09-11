import { describe, it, expect } from 'vitest';
import { calendarDaysAgo, calendarDaysBetween } from './calendarDays';

/** Local-time constructor, so these assertions hold in any timezone. */
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

describe('calendarDaysBetween', () => {
  it('counts the date boundary, not elapsed hours', () => {
    // The bug this exists to prevent: 14 hours apart, but a different day.
    // Dividing elapsed milliseconds floors this to 0 and calls it "today".
    expect(calendarDaysBetween(at(2026, 9, 10, 20), at(2026, 9, 11, 10))).toBe(1);
  });

  it('treats any two times on the same date as zero days apart', () => {
    expect(calendarDaysBetween(at(2026, 9, 11, 0, 1), at(2026, 9, 11, 23, 59))).toBe(0);
  });

  it('counts a bare minute across midnight as a full day', () => {
    expect(calendarDaysBetween(at(2026, 9, 10, 23, 59), at(2026, 9, 11, 0, 1))).toBe(1);
  });

  it('goes negative when the first date is later', () => {
    expect(calendarDaysBetween(at(2026, 9, 12), at(2026, 9, 10))).toBe(-2);
  });

  it('counts across month and year boundaries', () => {
    expect(calendarDaysBetween(at(2026, 1, 30), at(2026, 2, 2))).toBe(3);
    expect(calendarDaysBetween(at(2025, 12, 30), at(2026, 1, 2))).toBe(3);
  });

  it('accepts ISO strings as well as Date objects', () => {
    const from = at(2026, 9, 10, 20);
    const to = at(2026, 9, 11, 10);
    expect(calendarDaysBetween(from.toISOString(), to.toISOString())).toBe(1);
  });
});

describe('calendarDaysAgo', () => {
  it('reports yesterday evening as one day ago this morning', () => {
    expect(calendarDaysAgo(at(2026, 9, 10, 20), at(2026, 9, 11, 10))).toBe(1);
  });

  it('never returns a negative count for a future date', () => {
    // Clock skew, or a task logged slightly ahead. "-1 days ago" is worse
    // than rounding to today.
    expect(calendarDaysAgo(at(2026, 9, 12), at(2026, 9, 11))).toBe(0);
  });
});
