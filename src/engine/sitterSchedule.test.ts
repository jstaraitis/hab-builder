import { describe, it, expect } from 'vitest';
import { buildSitterSchedule, MAX_RANGE_DAYS, type SitterTask, type SitterScheduleInput } from './sitterSchedule';
import type { TaskFrequency } from '../types/careCalendar';

/** A Monday, so weekday assertions are readable. */
const START = new Date(2026, 5, 1, 0, 0, 0);

function day(offset: number): Date {
  const date = new Date(START);
  date.setDate(date.getDate() + offset);
  return date;
}

function task(overrides: Partial<SitterTask> = {}): SitterTask {
  return {
    id: overrides.id ?? 'task-1',
    title: 'Mist enclosure',
    type: 'misting',
    frequency: 'daily' as TaskFrequency,
    nextDueAt: day(0),
    ...overrides,
  };
}

function build(overrides: Partial<SitterScheduleInput> = {}) {
  return buildSitterSchedule({
    tasks: [],
    startDate: day(0),
    endDate: day(6),
    now: day(0),
    ...overrides,
  });
}

/** Flattens to "dayIndex:title" pairs for compact assertions. */
function occurrenceMap(schedule: ReturnType<typeof build>): string[] {
  return schedule.days.flatMap((d, index) => d.occurrences.map((o) => `${index}:${o.title}`));
}

describe('buildSitterSchedule — range', () => {
  it('produces one entry per day across the range, inclusive', () => {
    const schedule = build();
    expect(schedule.days).toHaveLength(7);
    expect(schedule.dayCount).toBe(7);
  });

  it('handles a single-day trip', () => {
    const schedule = build({ endDate: day(0) });
    expect(schedule.days).toHaveLength(1);
  });

  it('trims an absurd range rather than projecting a year of guesses', () => {
    const schedule = build({ endDate: day(400) });
    expect(schedule.rangeTrimmed).toBe(true);
    expect(schedule.days).toHaveLength(MAX_RANGE_DAYS);
  });

  it('does not flag a normal trip as trimmed', () => {
    expect(build({ endDate: day(13) }).rangeTrimmed).toBe(false);
  });
});

describe('buildSitterSchedule — recurrence', () => {
  it('repeats a daily task every day', () => {
    const schedule = build({ tasks: [task({ frequency: 'daily' })] });
    expect(schedule.totalOccurrences).toBe(7);
    expect(schedule.days.every((d) => d.occurrences.length === 1)).toBe(true);
  });

  it('repeats an every-other-day task on alternating days', () => {
    const schedule = build({ tasks: [task({ frequency: 'every-other-day' })] });
    expect(occurrenceMap(schedule)).toEqual([
      '0:Mist enclosure',
      '2:Mist enclosure',
      '4:Mist enclosure',
      '6:Mist enclosure',
    ]);
  });

  it('places a weekly task once in a seven-day window', () => {
    const schedule = build({ tasks: [task({ frequency: 'weekly' })] });
    expect(schedule.totalOccurrences).toBe(1);
  });

  it('places a monthly task once, or not at all when it falls outside', () => {
    const inRange = build({ tasks: [task({ frequency: 'monthly', nextDueAt: day(3) })] });
    expect(inRange.totalOccurrences).toBe(1);

    const outOfRange = build({ tasks: [task({ frequency: 'monthly', nextDueAt: day(20) })] });
    expect(outOfRange.totalOccurrences).toBe(0);
  });

  it('follows selected weekdays for a custom weekday schedule', () => {
    // START is a Monday (day index 1). Selecting Mon/Thu should give day 0 and day 3.
    const schedule = build({
      tasks: [task({ frequency: 'custom', customFrequencyWeekdays: [1, 4], nextDueAt: day(0) })],
    });
    expect(occurrenceMap(schedule)).toEqual(['0:Mist enclosure', '3:Mist enclosure']);
  });

  it('follows a custom interval in days', () => {
    const schedule = build({
      tasks: [task({ frequency: 'custom', customFrequencyDays: 3 })],
    });
    expect(occurrenceMap(schedule)).toEqual(['0:Mist enclosure', '3:Mist enclosure', '6:Mist enclosure']);
  });

  it('does not loop forever on a custom frequency with no interval set', () => {
    const schedule = build({ tasks: [task({ frequency: 'custom' })] });
    expect(schedule.totalOccurrences).toBe(1);
  });

  it('ignores a task whose first due date is after the range', () => {
    const schedule = build({ tasks: [task({ frequency: 'daily', nextDueAt: day(30) })] });
    expect(schedule.totalOccurrences).toBe(0);
  });
});

describe('buildSitterSchedule — as-needed tasks', () => {
  it('never assigns an as-needed task to a date', () => {
    const schedule = build({
      tasks: [task({ frequency: 'as-needed', title: 'Spot clean if soiled' })],
    });
    expect(schedule.totalOccurrences).toBe(0);
    expect(schedule.asNeeded).toHaveLength(1);
    expect(schedule.asNeeded[0].title).toBe('Spot clean if soiled');
  });

  it('keeps scheduled and as-needed tasks separate', () => {
    const schedule = build({
      tasks: [
        task({ id: 'a', frequency: 'daily', title: 'Mist' }),
        task({ id: 'b', frequency: 'as-needed', title: 'Spot clean' }),
      ],
    });
    expect(schedule.totalOccurrences).toBe(7);
    expect(schedule.asNeeded.map((t) => t.title)).toEqual(['Spot clean']);
  });
});

describe('buildSitterSchedule — overdue handling', () => {
  it('puts an already-overdue task on day one and flags it', () => {
    const schedule = build({
      tasks: [task({ frequency: 'weekly', nextDueAt: day(-3) })],
      now: day(0),
    });
    const first = schedule.days[0].occurrences[0];
    expect(first).toBeDefined();
    expect(first.wasOverdue).toBe(true);
  });

  it('does not duplicate a daily task that was overdue', () => {
    // Overdue puts it on day 0; the catch-up must not add day 0 a second time.
    const schedule = build({
      tasks: [task({ frequency: 'daily', nextDueAt: day(-2) })],
      now: day(0),
    });
    expect(schedule.days[0].occurrences).toHaveLength(1);
    expect(schedule.totalOccurrences).toBe(7);
  });

  it('resumes the correct cadence after catching up an overdue task', () => {
    const schedule = build({
      tasks: [task({ frequency: 'every-other-day', nextDueAt: day(-1) })],
      now: day(0),
    });
    // Day 0 from the overdue catch-up, then the natural cadence continues.
    expect(schedule.days[0].occurrences).toHaveLength(1);
    expect(schedule.totalOccurrences).toBeGreaterThan(1);
  });

  it('does not flag a task as overdue when it is merely earlier in the range', () => {
    const schedule = build({
      tasks: [task({ frequency: 'daily', nextDueAt: day(0) })],
      now: day(0),
    });
    expect(schedule.days.flatMap((d) => d.occurrences).some((o) => o.wasOverdue)).toBe(false);
  });
});

describe('buildSitterSchedule — ordering and detail', () => {
  it('orders a day by scheduled time, untimed last', () => {
    const schedule = build({
      endDate: day(0),
      tasks: [
        task({ id: 'c', title: 'Evening check', scheduledTime: '18:00' }),
        task({ id: 'a', title: 'Untimed task' }),
        task({ id: 'b', title: 'Morning mist', scheduledTime: '07:30' }),
      ],
    });
    expect(schedule.days[0].occurrences.map((o) => o.title)).toEqual([
      'Morning mist',
      'Evening check',
      'Untimed task',
    ]);
  });

  it('sorts untimed tasks alphabetically so the order is stable', () => {
    const schedule = build({
      endDate: day(0),
      tasks: [
        task({ id: 'b', title: 'Zebra task' }),
        task({ id: 'a', title: 'Apple task' }),
      ],
    });
    expect(schedule.days[0].occurrences.map((o) => o.title)).toEqual(['Apple task', 'Zebra task']);
  });

  it('carries the detail a sitter needs onto every occurrence', () => {
    const schedule = build({
      endDate: day(0),
      tasks: [
        task({
          title: 'Feed crickets',
          type: 'feeding',
          notes: 'Two only, dusted',
          supplementType: 'Calcium + D3',
          enclosureId: 'enc-1',
          enclosureAnimalId: 'animal-1',
        }),
      ],
    });
    const occurrence = schedule.days[0].occurrences[0];
    expect(occurrence.notes).toBe('Two only, dusted');
    expect(occurrence.supplementType).toBe('Calcium + D3');
    expect(occurrence.enclosureId).toBe('enc-1');
    expect(occurrence.enclosureAnimalId).toBe('animal-1');
  });

  it('handles several tasks across several enclosures', () => {
    const schedule = build({
      tasks: [
        task({ id: 'a', title: 'Mist gecko', frequency: 'daily', enclosureId: 'enc-1' }),
        task({ id: 'b', title: 'Feed snake', frequency: 'weekly', enclosureId: 'enc-2' }),
        task({ id: 'c', title: 'Check water', frequency: 'every-other-day', enclosureId: 'enc-1' }),
      ],
    });
    expect(schedule.totalOccurrences).toBe(7 + 1 + 4);
  });

  it('returns empty days rather than nothing when there are no tasks', () => {
    const schedule = build({ tasks: [] });
    expect(schedule.days).toHaveLength(7);
    expect(schedule.totalOccurrences).toBe(0);
    expect(schedule.asNeeded).toHaveLength(0);
  });
});
