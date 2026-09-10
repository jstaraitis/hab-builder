import { enclosureAnimalService } from './enclosureAnimalService';
import { enclosureEventService } from './enclosureEventService';
import { feedingLogService } from './feedingLogService';
import { vetRecordService } from './vetRecordService';
import { tempLogService } from './tempLogService';
import { humidityLogService } from './humidityLogService';
import { brumationLogService } from './brumationLogService';
import {
  buildChangeTimeline,
  type ChangeTimeline,
  type EnvironmentSeries,
  type IncidentKind,
} from '../engine/changeTimeline';

/**
 * Gathers everything that could have changed before an incident.
 *
 * Every stream fails independently. A retrospective missing its humidity
 * history is still worth reading; one that refuses to load because a single
 * table hiccuped is not. Streams that error are reported so their absence is
 * never mistaken for "nothing changed here".
 */

export interface ChangeTimelineBundle {
  timeline: ChangeTimeline;
  animalLabel: string;
  failedStreams: string[];
}

/** Readings are pulled generously; the engine does its own windowing. */
const READING_LIMIT = 200;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toFahrenheit(value: number, unit: 'f' | 'c'): number {
  return unit === 'c' ? value * 1.8 + 32 : value;
}

async function attempt<T>(label: string, failed: string[], fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[changeTimeline] failed to load ${label}:`, error);
    failed.push(label);
    return fallback;
  }
}

class ChangeTimelineService {
  async build(options: {
    enclosureAnimalId: string;
    incidentKind: IncidentKind;
    incidentDate: Date;
    windowDays?: number;
  }): Promise<ChangeTimelineBundle> {
    const { enclosureAnimalId, incidentKind, incidentDate, windowDays } = options;

    const animal = await enclosureAnimalService.getAnimalById(enclosureAnimalId);
    if (!animal) throw new Error('Animal not found');

    const failedStreams: string[] = [];
    const enclosureId = animal.enclosureId;

    const [vetRecords, brumations] = await Promise.all([
      attempt('vet records', failedStreams, () => vetRecordService.getRecordsForAnimal(enclosureAnimalId), []),
      attempt('brumation', failedStreams, () => brumationLogService.getLogsForAnimal(enclosureAnimalId), []),
    ]);

    let enclosureEvents: Awaited<ReturnType<typeof enclosureEventService.getRecentEventsForEnclosure>> = [];
    let environment: EnvironmentSeries[] = [];
    let feedings: Awaited<ReturnType<typeof feedingLogService.getRecentLogs>> = [];

    if (enclosureId) {
      const [events, temps, humidity, feedingLogs] = await Promise.all([
        attempt('enclosure events', failedStreams, () =>
          enclosureEventService.getRecentEventsForEnclosure(enclosureId, 100), []),
        attempt('temperature', failedStreams, () =>
          tempLogService.getRecentLogsForEnclosure(enclosureId, READING_LIMIT), []),
        attempt('humidity', failedStreams, () =>
          humidityLogService.getRecentLogsForEnclosure(enclosureId, READING_LIMIT), []),
        attempt('feeding', failedStreams, () =>
          feedingLogService.getRecentLogs(enclosureId, READING_LIMIT), []),
      ]);

      enclosureEvents = events;
      feedings = feedingLogs;

      // Temperature and humidity are logged separately but describe the same
      // moments, so they are merged onto one timeline keyed by day. Keeping
      // them apart would halve the readings available to drift detection.
      const byDay = new Map<string, EnvironmentSeries>();

      for (const log of temps) {
        const date = toDate(log.recordedAt);
        if (!date) continue;
        const key = date.toISOString().slice(0, 10);
        const entry = byDay.get(key) ?? { date };
        entry.tempF = toFahrenheit(log.temperatureValue, log.unit);
        byDay.set(key, entry);
      }

      for (const log of humidity) {
        const date = toDate(log.recordedAt);
        if (!date) continue;
        const key = date.toISOString().slice(0, 10);
        const entry = byDay.get(key) ?? { date };
        entry.humidityPercent = log.humidityPercent;
        byDay.set(key, entry);
      }

      environment = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    const timeline = buildChangeTimeline({
      incidentKind,
      incidentDate,
      windowDays,
      enclosureEvents: enclosureEvents
        .map((event) => ({
          id: event.id,
          date: toDate(event.eventDate),
          eventType: event.eventType,
          severity: event.severity,
          notes: event.notes,
        }))
        .filter((e) => e.date !== null) as Parameters<typeof buildChangeTimeline>[0]['enclosureEvents'],
      environment,
      feedings: feedings
        .map((log) => ({
          date: toDate(log.completedAt),
          feederType: log.feederType,
          supplementUsed: log.supplementUsed,
        }))
        .filter((f) => f.date !== null) as Parameters<typeof buildChangeTimeline>[0]['feedings'],
      vetVisits: vetRecords
        .map((record) => ({
          date: toDate(record.visitDate),
          visitType: record.visitType,
          diagnosis: record.diagnosis,
        }))
        .filter((v) => v.date !== null) as Parameters<typeof buildChangeTimeline>[0]['vetVisits'],
      brumationStarts: brumations
        .map((log) => toDate((log as { startDate?: string | Date }).startDate))
        .filter((d): d is Date => d !== null),
    });

    return {
      timeline,
      animalLabel: animal.name ?? (animal.animalNumber ? `Animal #${animal.animalNumber}` : 'This animal'),
      failedStreams,
    };
  }
}

export const changeTimelineService = new ChangeTimelineService();
