import type { TaskFrequency } from '../types/careCalendar';

/**
 * Given a task frequency and a scheduled time string (HH:MM), returns the
 * next appropriate due date.
 *
 * For high-frequency tasks (daily, every-other-day, twice-weekly) the due date
 * is today at the scheduled time if that time hasn't passed yet, otherwise
 * tomorrow.  For lower-frequency tasks (weekly and above) the due date is
 * always today + the appropriate offset so they don't crowd the calendar on
 * setup day.
 */
export function computeNextDueAt(
  frequency: TaskFrequency,
  scheduledTime: string,
  fromDate: Date = new Date()
): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);

  const at = (base: Date): Date => {
    const d = new Date(base);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const todayAt = at(fromDate);
  const timeHasPassed = fromDate >= todayAt;

  const daysFromNow = (n: number): Date => {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + n);
    return at(d);
  };

  switch (frequency) {
    case 'daily':
      return timeHasPassed ? daysFromNow(1) : todayAt;

    case 'every-other-day':
      return daysFromNow(1);

    case 'twice-weekly':
      // Next occurrence is in ~3 days (Mon/Thu pattern)
      return daysFromNow(2);

    case 'weekly':
      return daysFromNow(3);

    case 'bi-weekly':
      return daysFromNow(7);

    case 'monthly':
      return daysFromNow(14);

    case 'as-needed':
      // No fixed schedule — set a far-future date so it doesn't appear overdue
      return daysFromNow(30);

    case 'custom':
      // Fall back to tomorrow — caller should override nextDueAt for custom tasks
      return daysFromNow(1);

    default:
      return daysFromNow(1);
  }
}

/**
 * Returns a human-readable label for a task frequency value.
 */
export function frequencyLabel(frequency: TaskFrequency): string {
  const labels: Record<TaskFrequency, string> = {
    'daily': 'Daily',
    'every-other-day': 'Every other day',
    'twice-weekly': 'Twice a week',
    'weekly': 'Weekly',
    'bi-weekly': 'Every 2 weeks',
    'monthly': 'Monthly',
    'as-needed': 'As needed',
    'custom': 'Custom',
  };
  return labels[frequency] ?? frequency;
}
