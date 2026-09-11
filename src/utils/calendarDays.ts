/**
 * Calendar-day arithmetic for user-facing "today / yesterday / 3 days ago"
 * labels.
 *
 * The distinction this exists to enforce: people mean calendar days, not
 * elapsed 24-hour periods. An animal fed at 8pm last night and checked at 10am
 * today is 14 hours in the past — which floors to zero elapsed days, so a
 * dashboard doing the obvious division reported it as fed *today* while the
 * animal's own profile, which compared calendar dates, correctly said
 * yesterday. Same data, two answers, and the reassuring one was wrong.
 */

/** Midnight at the start of the given date, in the viewer's own timezone. */
function startOfLocalDay(value: Date | string): number {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Whole calendar days from `from` to `to`. Negative if `from` is later.
 *
 * Rounds rather than floors: across a daylight-saving transition a local day
 * is 23 or 25 hours long, and flooring 23/24 yields 0 — a day that quietly
 * vanishes twice a year. Both endpoints are local midnights, so the gap is
 * always a whole number of days give or take an hour, and rounding lands on it.
 */
export function calendarDaysBetween(from: Date | string, to: Date | string): number {
  return Math.round((startOfLocalDay(to) - startOfLocalDay(from)) / 86_400_000);
}

/**
 * Calendar days ago, never negative. A future date reads as 0 rather than a
 * negative count, so clock skew or a task logged slightly ahead shows as
 * "today" instead of "-1 days ago".
 */
export function calendarDaysAgo(value: Date | string, now: Date = new Date()): number {
  return Math.max(0, calendarDaysBetween(value, now));
}
