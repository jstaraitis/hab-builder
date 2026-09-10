import { enclosureService } from './enclosureService';
import { enclosureAnimalService } from './enclosureAnimalService';
import { careTaskService } from './careTaskService';
import { vetRecordService } from './vetRecordService';
import { buildSitterSchedule, type SitterSchedule, type SitterTask } from '../engine/sitterSchedule';
import type { Enclosure, EnclosureAnimal } from '../types/careCalendar';

/**
 * Assembles a care sheet for whoever is covering while the keeper is away.
 *
 * Scoped to the whole collection rather than one animal, because a sitter
 * walks into a room and deals with everything in it. The keeper can narrow it
 * to specific enclosures if someone is only covering part of the collection.
 */

export interface SitterEmergencyContact {
  clinicName?: string;
  clinicPhone?: string;
  vetName?: string;
  /** When this clinic was last visited — context for whether it is current. */
  lastVisit: Date;
}

export interface SitterEnclosureSummary {
  enclosure: Enclosure;
  animals: EnclosureAnimal[];
  /** Target ranges the sitter should keep the enclosure inside. */
  dayTempTarget?: number;
  nightTempTarget?: number;
  humidityMin?: number;
  humidityMax?: number;
}

export interface SitterSheetBundle {
  schedule: SitterSchedule;
  enclosures: SitterEnclosureSummary[];
  emergencyContact: SitterEmergencyContact | null;
  startDate: Date;
  endDate: Date;
  /** Streams that errored rather than being genuinely empty. */
  failedStreams: string[];
}

async function attempt<T>(label: string, failed: string[], fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[sitterSheet] failed to load ${label}:`, error);
    failed.push(label);
    return fallback;
  }
}

class SitterSheetService {
  async build(options: {
    userId: string;
    startDate: Date;
    endDate: Date;
    /** When set, only these enclosures are included. */
    enclosureIds?: string[];
    now?: Date;
  }): Promise<SitterSheetBundle> {
    const { userId, startDate, endDate, enclosureIds, now } = options;
    const failedStreams: string[] = [];

    const [allEnclosures, allAnimals, allTasks, vetRecords] = await Promise.all([
      attempt('enclosures', failedStreams, () => enclosureService.getEnclosures(userId), []),
      attempt('animals', failedStreams, () => enclosureAnimalService.getAllUserAnimals(userId), []),
      attempt('care tasks', failedStreams, () => careTaskService.getTasks(userId), []),
      attempt('vet records', failedStreams, () => vetRecordService.getRecordsByUser(userId), []),
    ]);

    const includeAll = !enclosureIds || enclosureIds.length === 0;
    const selected = new Set(enclosureIds ?? []);

    const enclosures = allEnclosures
      .filter((enclosure) => enclosure.isActive !== false)
      .filter((enclosure) => includeAll || selected.has(enclosure.id))
      .map((enclosure) => ({
        enclosure,
        animals: allAnimals.filter(
          (animal) => animal.enclosureId === enclosure.id && animal.isActive !== false
        ),
        dayTempTarget: enclosure.baselineDayTempTarget,
        nightTempTarget: enclosure.baselineNightTempTarget,
        humidityMin: enclosure.baselineHumidityMinTarget,
        humidityMax: enclosure.baselineHumidityMaxTarget,
      }));

    const includedEnclosureIds = new Set(enclosures.map((entry) => entry.enclosure.id));

    // Tasks with no enclosure are kept only when the sheet covers everything.
    // Handing a partial sitter a task they cannot place would be worse than
    // omitting it.
    const tasks: SitterTask[] = allTasks
      .filter((task) => task.isActive !== false)
      .filter((task) =>
        task.enclosureId ? includedEnclosureIds.has(task.enclosureId) : includeAll
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        frequency: task.frequency,
        scheduledTime: task.scheduledTime,
        nextDueAt: task.nextDueAt instanceof Date ? task.nextDueAt : new Date(task.nextDueAt),
        customFrequencyDays: task.customFrequencyDays,
        customFrequencyWeekdays: task.customFrequencyWeekdays,
        notes: task.notes,
        supplementType: task.supplementType,
        enclosureId: task.enclosureId,
        enclosureAnimalId: task.enclosureAnimalId,
      }));

    // The most recent visit that actually recorded a contactable clinic. A
    // record with a diagnosis but no phone number is useless in an emergency.
    const contactable = vetRecords
      .filter((record) => record.clinicPhone || record.clinicName)
      .map((record) => ({ record, visitDate: new Date(record.visitDate) }))
      .filter((entry) => !Number.isNaN(entry.visitDate.getTime()))
      .sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime())[0];

    const emergencyContact: SitterEmergencyContact | null = contactable
      ? {
          clinicName: contactable.record.clinicName,
          clinicPhone: contactable.record.clinicPhone,
          vetName: contactable.record.vetName,
          lastVisit: contactable.visitDate,
        }
      : null;

    return {
      schedule: buildSitterSchedule({ tasks, startDate, endDate, now }),
      enclosures,
      emergencyContact,
      startDate,
      endDate,
      failedStreams,
    };
  }
}

export const sitterSheetService = new SitterSheetService();
