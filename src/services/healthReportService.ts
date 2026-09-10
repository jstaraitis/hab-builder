import { enclosureAnimalService } from './enclosureAnimalService';
import { enclosureService } from './enclosureService';
import { weightTrackingService } from './weightTrackingService';
import { lengthLogService } from './lengthLogService';
import { shedLogService } from './shedLogService';
import { poopLogService } from './poopLogService';
import { feedingLogService, type FeedingLog } from './feedingLogService';
import { vetRecordService } from './vetRecordService';
import { tempLogService } from './tempLogService';
import { humidityLogService } from './humidityLogService';
import {
  buildHealthReport,
  type HealthReport,
  type HealthReportInput,
  type ReportEnvironment,
} from '../engine/healthReport';
import { getUvbLifecycleStatus } from '../engine/uvbLifecycle';
import { analyzeNutrition, type NutritionAnalysis } from '../engine/nutritionAnalysis';
import type { EnclosureAnimal, Enclosure } from '../types/careCalendar';

/**
 * Assembles everything the health report engine needs for one animal.
 *
 * Every stream is fetched in parallel and every stream is allowed to fail on
 * its own. A missing shed table or a permissions hiccup must not cost the
 * keeper the whole report five minutes before a vet appointment — the engine
 * already treats an empty stream as a stated data gap, which is exactly the
 * right way to render a partial failure.
 */

export interface HealthReportBundle {
  report: HealthReport;
  animal: EnclosureAnimal;
  enclosure: Enclosure | null;
  /** Latest measured readings, distinct from the enclosure’s target settings. */
  environment?: ReportEnvironment;
  /**
   * Diet and supplementation analysis. Computed here rather than in the report
   * engine because it needs the enclosure's UVB state, which only the data
   * layer has — and the UVB cross-reference is the part worth having.
   */
  nutrition: NutritionAnalysis;
  /**
   * True when the feeding history mixes in enclosure-level logs from an
   * enclosure holding several animals, so it describes the group.
   */
  feedingIsGroupLevel: boolean;
  /** How many animals share this animal's enclosure. */
  enclosureAnimalCount: number;
  /** Streams that errored rather than being genuinely empty. */
  failedStreams: string[];
}

/** How far back the report reaches. Beyond this, records stop being relevant. */
const HISTORY_LIMIT = 100;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toFahrenheit(value: number, unit: 'f' | 'c'): number {
  return unit === 'c' ? value * 1.8 + 32 : value;
}

/**
 * Runs a fetch, recording rather than throwing on failure. The caller gets an
 * empty result and the stream's name in `failedStreams`, so the report can say
 * "we could not read this" instead of "there is nothing here".
 */
async function attempt<T>(
  label: string,
  failed: string[],
  fetcher: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[healthReport] failed to load ${label}:`, error);
    failed.push(label);
    return fallback;
  }
}

class HealthReportService {
  async buildForAnimal(enclosureAnimalId: string, now: Date = new Date()): Promise<HealthReportBundle> {
    const animal = await enclosureAnimalService.getAnimalById(enclosureAnimalId);
    if (!animal) throw new Error('Animal not found');

    const failedStreams: string[] = [];

    const [weights, lengths, sheds, poops, vetRecords] = await Promise.all([
      attempt('weight', failedStreams, () => weightTrackingService.getWeightLogs(enclosureAnimalId), []),
      attempt('length', failedStreams, () => lengthLogService.getLogsForAnimal(enclosureAnimalId), []),
      attempt('shed', failedStreams, () => shedLogService.getLogsForAnimal(enclosureAnimalId), []),
      attempt('stool', failedStreams, () => poopLogService.getRecentLogs(enclosureAnimalId, HISTORY_LIMIT), []),
      attempt('vet records', failedStreams, () => vetRecordService.getRecordsForAnimal(enclosureAnimalId), []),
    ]);

    // Feeding, temperature and humidity are recorded against the enclosure
    // rather than the animal, so they are only fetchable once we know where
    // this animal lives — and in a shared enclosure they describe the group.
    let enclosure: Enclosure | null = null;
    let feedings: FeedingLog[] = [];
    let environment: ReportEnvironment | undefined;
    let feedingIsGroupLevel = false;
    let enclosureAnimalCount = 1;

    if (animal.enclosureId) {
      const enclosureId = animal.enclosureId;

      // How many animals share this enclosure decides whether unattributed
      // feeding logs are ambiguous at all. With one animal there is nothing to
      // disclose; with several, the report must say so.
      const housemates = await attempt(
        'enclosure animals',
        failedStreams,
        () => enclosureAnimalService.getAnimalsByEnclosure(enclosureId),
        []
      );
      enclosureAnimalCount = Math.max(housemates.length, 1);

      const [loadedEnclosure, feedingScope, temps, humidity] = await Promise.all([
        attempt('enclosure', failedStreams, () => enclosureService.getEnclosureById(enclosureId), null),
        attempt(
          'feeding',
          failedStreams,
          () =>
            feedingLogService.getLogsForAnimal(enclosureAnimalId, enclosureId, {
              limit: HISTORY_LIMIT,
              enclosureAnimalCount,
            }),
          { logs: [], includesGroupLevelLogs: false, attributedCount: 0 }
        ),
        attempt('temperature', failedStreams, () => tempLogService.getRecentLogsForEnclosure(enclosureId, 20), []),
        attempt('humidity', failedStreams, () => humidityLogService.getRecentLogsForEnclosure(enclosureId, 5), []),
      ]);

      enclosure = loadedEnclosure;
      feedings = feedingScope.logs;
      feedingIsGroupLevel = feedingScope.includesGroupLevelLogs;

      // The most recent reading per zone, so a basking probe logged last week
      // is not hidden by an ambient reading taken yesterday.
      const latestByZone = (zone: string) =>
        temps.find((log) => log.zone === zone) ?? undefined;

      const basking = latestByZone('basking');
      const cool = latestByZone('cool');
      const ambient = latestByZone('ambient') ?? temps[0];
      const latestHumidity = humidity[0];

      if (basking || cool || ambient || latestHumidity) {
        const mostRecentStamp = [basking, cool, ambient]
          .map((log) => toDate(log?.recordedAt))
          .filter((date): date is Date => date !== null)
          .sort((a, b) => b.getTime() - a.getTime())[0];

        environment = {
          baskingTempF: basking ? toFahrenheit(basking.temperatureValue, basking.unit) : undefined,
          coolTempF: cool ? toFahrenheit(cool.temperatureValue, cool.unit) : undefined,
          ambientTempF: ambient ? toFahrenheit(ambient.temperatureValue, ambient.unit) : undefined,
          humidityPercent: latestHumidity?.humidityPercent,
          recordedAt: mostRecentStamp ?? toDate(latestHumidity?.recordedAt) ?? undefined,
        };
      }
    }

    const input: HealthReportInput = {
      generatedAt: now,
      animal: {
        name: animal.name,
        animalNumber: animal.animalNumber,
        speciesName: animal.speciesName ?? enclosure?.animalName,
        morph: animal.morph,
        gender: animal.gender,
        birthday: toDate(animal.birthday) ?? undefined,
        acquisitionDate: toDate(animal.acquisitionDate) ?? undefined,
        source: animal.source,
        notes: animal.notes,
      },
      enclosure: enclosure
        ? {
            name: enclosure.name,
            substrateType: enclosure.substrateType,
            substrateDepthInches: enclosure.substrateDepthInches,
            widthInches: enclosure.widthInches,
            depthInches: enclosure.depthInches,
            heightInches: enclosure.heightInches,
            baselineDayTempTarget: enclosure.baselineDayTempTarget,
            baselineNightTempTarget: enclosure.baselineNightTempTarget,
            baselineHumidityMinTarget: enclosure.baselineHumidityMinTarget,
            baselineHumidityMaxTarget: enclosure.baselineHumidityMaxTarget,
            uvbBulbType: enclosure.uvbBulbType,
            uvbBulbInstalledOn: toDate(enclosure.uvbBulbInstalledOn) ?? undefined,
            lightingScheduleHours: enclosure.lightingScheduleHours,
          }
        : undefined,
      environment,
      weights: weights
        .map((log) => ({ date: toDate(log.measurementDate), grams: log.weightGrams }))
        .filter((entry): entry is { date: Date; grams: number } => entry.date !== null),
      lengths: lengths
        .map((log) => ({
          date: toDate(log.date),
          length: log.length,
          unit: log.unit,
          measurementType: log.measurementType,
        }))
        .filter((entry) => entry.date !== null) as HealthReportInput['lengths'],
      feedings: feedings
        .map((log) => ({
          date: toDate(log.completedAt),
          feederType: log.feederType,
          quantityOffered: log.quantityOffered,
          quantityEaten: log.quantityEaten,
          refusalNoted: log.refusalNoted,
          supplementUsed: log.supplementUsed,
          notes: log.notes,
        }))
        .filter((entry) => entry.date !== null) as HealthReportInput['feedings'],
      sheds: sheds
        .map((log) => ({
          date: toDate(log.shedDate),
          quality: log.quality,
          problemAreas: log.problemAreas,
          notes: log.notes,
        }))
        .filter((entry) => entry.date !== null) as HealthReportInput['sheds'],
      poops: poops
        .map((log) => ({
          date: toDate(log.loggedAt),
          consistency: log.consistency,
          color: log.color,
          amount: log.amount,
          uratePresent: log.uratePresent,
          parasitesSeen: log.parasitesSeen,
          notes: log.notes,
        }))
        .filter((entry) => entry.date !== null) as HealthReportInput['poops'],
      vetVisits: vetRecords
        .map((record) => ({
          date: toDate(record.visitDate),
          visitType: record.visitType,
          vetName: record.vetName,
          clinicName: record.clinicName,
          chiefComplaint: record.chiefComplaint,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          prescriptions: record.prescriptions,
          followUpNeeded: record.followUpNeeded,
          followUpDate: toDate(record.followUpDate) ?? undefined,
          followUpNotes: record.followUpNotes,
        }))
        .filter((entry) => entry.date !== null) as HealthReportInput['vetVisits'],
    };

    // A bulb inside its rated life is a genuine D3 route; an expired one is
    // not, and neither is no bulb at all. Passing `undefined` when we simply
    // don't know keeps the engine from escalating on an assumption.
    const uvbStatus = enclosure?.uvbBulbInstalledOn
      ? getUvbLifecycleStatus(enclosure.uvbBulbInstalledOn, enclosure.uvbBulbType, now)
      : null;
    const hasEffectiveUvb = uvbStatus
      ? uvbStatus.state !== 'overdue' && uvbStatus.state !== 'critical'
      : undefined;

    const nutrition = analyzeNutrition({
      feedings: (input.feedings ?? []).map((feeding) => ({
        date: feeding.date,
        feederType: feeding.feederType,
        supplementUsed: feeding.supplementUsed,
        quantityOffered: feeding.quantityOffered,
        quantityEaten: feeding.quantityEaten,
        refusalNoted: feeding.refusalNoted,
      })),
      hasEffectiveUvb,
      uvbExpired: uvbStatus ? uvbStatus.state === 'overdue' || uvbStatus.state === 'critical' : undefined,
      generatedAt: now,
    });

    return {
      report: buildHealthReport(input),
      animal,
      enclosure,
      environment,
      nutrition,
      feedingIsGroupLevel,
      enclosureAnimalCount,
      failedStreams,
    };
  }
}

export const healthReportService = new HealthReportService();
