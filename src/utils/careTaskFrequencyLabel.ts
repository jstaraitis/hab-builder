import { WEEKDAY_OPTIONS } from './customTaskFrequency';
import type { TaskFrequency } from '../types/careCalendar';

type TaskFrequencyLike = {
  frequency?: TaskFrequency | string | null;
  customFrequencyDays?: number | null;
  customFrequencyWeekdays?: number[] | null;
};

export const formatCareTaskFrequency = (task: TaskFrequencyLike): string => {
  switch (task.frequency) {
    case 'daily':
      return 'Daily';
    case 'every-other-day':
      return 'Every other day';
    case 'twice-weekly':
      return 'Twice weekly';
    case 'weekly':
      return 'Weekly';
    case 'bi-weekly':
      return 'Every 2 weeks';
    case 'monthly':
      return 'Monthly';
    case 'custom': {
      if (task.customFrequencyWeekdays && task.customFrequencyWeekdays.length > 0) {
        const dayLabels = [...task.customFrequencyWeekdays]
          .sort((a, b) => a - b)
          .map(day => WEEKDAY_OPTIONS.find(option => option.value === day)?.label || String(day));
        return `On ${dayLabels.join(', ')}`;
      }

      if (task.customFrequencyDays && task.customFrequencyDays > 0) {
        return `Every ${task.customFrequencyDays} day${task.customFrequencyDays === 1 ? '' : 's'}`;
      }

      return 'Custom schedule';
    }
    default:
      return task.frequency ? String(task.frequency) : 'Custom schedule';
  }
};
