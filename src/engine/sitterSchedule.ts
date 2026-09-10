/**
 * Pet-sitter schedule
 *
 * A keeper going away hands their animals to someone who, in the best case,
 * likes animals and has never met a reptile. The handover is almost always
 * verbal, delivered in a hurry, and forgotten by day three. What the sitter
 * actually needs is a dated checklist: on Tuesday, do these four things.
 *
 * This engine turns recurring care tasks into that list. It is deliberately
 * conservative in three ways, because the failure modes are asymmetric — a
 * sitter who does something unnecessary is a nuisance, and a sitter who misses
 * a heat check or force-feeds an animal in shed is a problem.
 *
 *   - Nothing is invented. Only tasks the keeper actually created appear.
 *   - `as-needed` tasks are never given a date. They have no clock, and
 *     printing one on Tuesday would imply Tuesday is when it must happen.
 *     They are surfaced separately as things to watch for.
 *   - Overdue tasks land on day one rather than being silently carried.
 *
 * The output is grouped by day, then by enclosure, because that is the order a
 * sitter physically moves through a room.
 */

import type { TaskFrequency } from '../types/careCalendar';

export interface SitterTask {
  id: string;
  title: string;
  description?: string;
  type: string;
  frequency: TaskFrequency;
  /** HH:MM, when the keeper scheduled it. */
  scheduledTime?: string;
  nextDueAt: Date;
  customFrequencyDays?: number;
  customFrequencyWeekdays?: number[];
  notes?: string;
  supplementType?: string;
  enclosureId?: string;
  enclosureAnimalId?: string;
}

export interface SitterOccurrence {
  taskId: string;
  title: string;
  description?: string;
  type: string;
  scheduledTime?: string;
  notes?: string;
  supplementType?: string;
  enclosureId?: string;
  enclosureAnimalId?: string;
  /** True when the task was already overdue when the sitter took over. */
  wasOverdue: boolean;
}

export interface SitterDay {
  date: Date;
  /** Sorted by scheduled time, then title. Untimed tasks come last. */
  occurrences: SitterOccurrence[];
}

export interface SitterScheduleInput {
  tasks: SitterTask[];
  startDate: Date;
  endDate: Date;
  /** Defaults to startDate. Tasks due before this are treated as overdue. */
  now?: Date;
}

export interface SitterSchedule {
  days: SitterDay[];
  /** Tasks with no schedule — surfaced as watch-fors, never dated. */
  asNeeded: SitterTask[];
  totalOccurrences: number;
  /** True when the requested range exceeded the cap and was trimmed. */
  rangeTrimmed: boolean;
  dayCount: number;
}

/**
 * A sitter sheet is for a trip, not a year. Beyond this the projection stops
 * being a schedule and starts being a guess about a keeper who will have
 * changed their routine by then.
 */
export const MAX_RANGE_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight, so day boundaries follow the keeper's calendar not UTC. */
function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * Advances one interval from `from`. Mirrors careTaskService's own stepping so
 * the sheet and the app's due dates cannot drift apart.
 */
function advance(task: SitterTask, from: Date): Date | null {
  const next = new Date(from);

  switch (task.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'every-other-day':
      next.setDate(next.getDate() + 2);
      return next;
    case 'twice-weekly':
      next.setDate(next.getDate() + 3);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'custom': {
      if (task.customFrequencyWeekdays && task.customFrequencyWeekdays.length > 0) {
        // Step forward to the next selected weekday, up to a full week out.
        for (let offset = 1; offset <= 7; offset += 1) {
          const candidate = addDays(next, offset);
          if (task.customFrequencyWeekdays.includes(candidate.getDay())) return candidate;
        }
        return null;
      }
      const days = task.customFrequencyDays;
      if (!days || days <= 0) return null;
      next.setDate(next.getDate() + days);
      return next;
    }
    case 'as-needed':
      return null;
    default:
      return null;
  }
}

function toOccurrence(task: SitterTask, wasOverdue: boolean): SitterOccurrence {
  return {
    taskId: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    scheduledTime: task.scheduledTime,
    notes: task.notes,
    supplementType: task.supplementType,
    enclosureId: task.enclosureId,
    enclosureAnimalId: task.enclosureAnimalId,
    wasOverdue,
  };
}

/** Untimed tasks sort last — a sitter works through timed items first. */
function compareOccurrences(a: SitterOccurrence, b: SitterOccurrence): number {
  if (a.scheduledTime && b.scheduledTime) {
    if (a.scheduledTime !== b.scheduledTime) return a.scheduledTime < b.scheduledTime ? -1 : 1;
  } else if (a.scheduledTime) {
    return -1;
  } else if (b.scheduledTime) {
    return 1;
  }
  return a.title.localeCompare(b.title);
}

export function buildSitterSchedule(input: SitterScheduleInput): SitterSchedule {
  const start = startOfDay(input.startDate);
  const requestedEnd = startOfDay(input.endDate);
  const now = input.now ? startOfDay(input.now) : start;

  const rawDayCount = Math.floor((requestedEnd.getTime() - start.getTime()) / DAY_MS) + 1;
  const rangeTrimmed = rawDayCount > MAX_RANGE_DAYS;
  const dayCount = Math.max(1, Math.min(rawDayCount, MAX_RANGE_DAYS));
  const end = addDays(start, dayCount - 1);

  const days: SitterDay[] = Array.from({ length: dayCount }, (_, index) => ({
    date: addDays(start, index),
    occurrences: [],
  }));

  const asNeeded: SitterTask[] = [];

  for (const task of input.tasks) {
    if (task.frequency === 'as-needed') {
      asNeeded.push(task);
      continue;
    }

    let cursor = startOfDay(task.nextDueAt);

    // Something already overdue when the sitter takes over belongs on day one,
    // not quietly dropped because its due date is in the past.
    if (cursor.getTime() < start.getTime()) {
      const wasOverdue = cursor.getTime() < now.getTime();
      days[0].occurrences.push(toOccurrence(task, wasOverdue));

      // Walk forward to the first occurrence inside the range so a daily task
      // does not print once and then vanish.
      let guard = 0;
      while (cursor.getTime() < start.getTime() && guard < MAX_RANGE_DAYS * 2) {
        const next = advance(task, cursor);
        if (!next) break;
        cursor = startOfDay(next);
        guard += 1;
      }

      // The catch-up landed on day one, which already has this task listed.
      if (cursor.getTime() === start.getTime()) {
        const next = advance(task, cursor);
        if (!next) continue;
        cursor = startOfDay(next);
      }
    }

    let guard = 0;
    while (cursor.getTime() <= end.getTime() && guard < MAX_RANGE_DAYS * 2) {
      const dayIndex = Math.floor((cursor.getTime() - start.getTime()) / DAY_MS);
      if (dayIndex >= 0 && dayIndex < days.length) {
        days[dayIndex].occurrences.push(toOccurrence(task, false));
      }

      const next = advance(task, cursor);
      if (!next) break;
      const advanced = startOfDay(next);
      // A frequency that fails to move forward would spin here.
      if (advanced.getTime() <= cursor.getTime()) break;
      cursor = advanced;
      guard += 1;
    }
  }

  for (const day of days) {
    day.occurrences.sort(compareOccurrences);
  }

  return {
    days,
    asNeeded,
    totalOccurrences: days.reduce((sum, day) => sum + day.occurrences.length, 0),
    rangeTrimmed,
    dayCount,
  };
}

/** Exported for the view's "today" highlighting and for tests. */
export const sitterScheduleInternals = { startOfDay, addDays, sameDay, advance };
