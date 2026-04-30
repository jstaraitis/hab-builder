import type { CareTask, TaskFrequency, TaskType } from '../types/careCalendar';
import type { Enclosure } from '../types/careCalendar';
import type { AnimalProfile } from '../engine/types';
import { generateCareTasks } from './careTaskGenerator';
import { computeNextDueAt } from '../utils/taskScheduling';

export interface BuiltTask extends Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'> {
  /** Used in the review UI so user can toggle tasks on/off before saving */
  suggestedKey: string;
}

/**
 * Derives care task suggestions from an enclosure record + animal profile.
 *
 * Returns fully-shaped task objects ready to be passed to
 * `careTaskService.createTask()` — minus the DB-assigned fields.
 *
 * The caller is responsible for filtering the list before saving (e.g. the
 * user may deselect some tasks in the review UI).
 */
export function buildTasksFromEnclosure(
  enclosure: Enclosure,
  profile: AnimalProfile,
  userId: string
): BuiltTask[] {
  const isBioactive = enclosure.substrateType === 'bioactive';
  const hasUVB = enclosure.uvbBulbInstalledOn != null;

  const generated = generateCareTasks(profile, {
    isBioactive,
    hasUVB,
  });

  return generated.map((task) => {
    const frequency = task.frequency as TaskFrequency;
    const scheduledTime = task.scheduledTime ?? '09:00';

    return {
      suggestedKey: task.type,
      userId,
      enclosureId: enclosure.id,
      animalId: profile.id,
      title: task.title,
      description: task.description,
      type: task.type as TaskType,
      frequency,
      scheduledTime,
      nextDueAt: computeNextDueAt(frequency, scheduledTime),
      isActive: true,
      notificationEnabled: false,
      notificationMinutesBefore: 15,
    };
  });
}

/**
 * Convenience: creates tasks for an enclosure using only the enclosure's
 * stored animalId to look up the profile.
 *
 * Returns null if no matching profile is found (e.g. custom / unknown species),
 * so the caller can fall back to the basic-care template.
 */
export async function buildTasksFromEnclosureById(
  enclosure: Enclosure,
  userId: string
): Promise<BuiltTask[] | null> {
  const { getAnimalById } = await import('../data/animals');
  const { enclosureAnimalService } = await import('./enclosureAnimalService');
  const profile = getAnimalById(enclosure.animalId);
  if (!profile) return null;

  const tasks = buildTasksFromEnclosure(enclosure, profile, userId);

  // Prefer linking generated tasks to a real enclosure animal record when present.
  const animals = await enclosureAnimalService
    .getAnimalsByEnclosure(enclosure.id)
    .catch(() => []);
  const primaryAnimalId = animals[0]?.id;

  if (!primaryAnimalId) return tasks;

  return tasks.map((task) => ({
    ...task,
    enclosureAnimalId: primaryAnimalId,
  }));
}
