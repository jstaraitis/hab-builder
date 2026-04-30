import { enclosureSnapshotService } from './enclosureSnapshotService';
import { humidityLogService, type HumidityLog } from './humidityLogService';
import { tempLogService, type TempLog } from './tempLogService';
import { uvbLogService, type UvbLog } from './uvbLogService';

interface SaveEnvironmentReadingsInput {
  userId: string;
  enclosureId: string;
  enclosureAnimalId?: string;
  requireAnimal?: boolean;
  ambientTemp?: number;
  ambientTempZone?: TempLog['zone'];
  baskingTemp?: number;
  coolTemp?: number;
  tempUnit?: 'f' | 'c';
  humidityPercent?: number;
  humidityZone?: HumidityLog['zone'];
  uvIndex?: number;
  uvbZone?: UvbLog['zone'];
  notes?: string;
}

/**
 * Shared write path for environment readings.
 * Used by both the enclosure environment page and care task completion flow.
 */
export async function saveEnvironmentReadings(input: SaveEnvironmentReadingsInput): Promise<void> {
  const {
    userId,
    enclosureId,
    enclosureAnimalId,
    requireAnimal = true,
    ambientTemp,
    ambientTempZone,
    baskingTemp,
    coolTemp,
    tempUnit,
    humidityPercent,
    humidityZone,
    uvIndex,
    uvbZone,
    notes,
  } = input;

  if (requireAnimal && !enclosureAnimalId) {
    throw new Error('Add at least one animal to this enclosure before logging environment values.');
  }

  const work: Promise<unknown>[] = [];
  const canWriteAnimalLogs = Boolean(enclosureAnimalId);

  if (canWriteAnimalLogs && ambientTemp !== undefined && !Number.isNaN(ambientTemp)) {
    work.push(
      tempLogService.createLog(userId, {
        enclosureId,
        enclosureAnimalId,
        temperatureValue: ambientTemp,
        unit: tempUnit || 'f',
        zone: ambientTempZone || 'ambient',
        notes: notes || undefined,
      })
    );
  }

  if (canWriteAnimalLogs && baskingTemp !== undefined && !Number.isNaN(baskingTemp)) {
    work.push(
      tempLogService.createLog(userId, {
        enclosureId,
        enclosureAnimalId,
        temperatureValue: baskingTemp,
        unit: tempUnit || 'f',
        zone: 'basking',
        notes: notes || undefined,
      })
    );
  }

  if (canWriteAnimalLogs && coolTemp !== undefined && !Number.isNaN(coolTemp)) {
    work.push(
      tempLogService.createLog(userId, {
        enclosureId,
        enclosureAnimalId,
        temperatureValue: coolTemp,
        unit: tempUnit || 'f',
        zone: 'cool',
        notes: notes || undefined,
      })
    );
  }

  if (canWriteAnimalLogs && humidityPercent !== undefined && !Number.isNaN(humidityPercent)) {
    work.push(
      humidityLogService.createLog(userId, {
        enclosureId,
        enclosureAnimalId,
        humidityPercent,
        zone: humidityZone || 'ambient',
        notes: notes || undefined,
      })
    );
  }

  if (canWriteAnimalLogs && uvIndex !== undefined && !Number.isNaN(uvIndex)) {
    work.push(
      uvbLogService.createLog(userId, {
        enclosureId,
        enclosureAnimalId,
        uvIndex,
        zone: uvbZone || 'basking',
        notes: notes || undefined,
      })
    );
  }

  await Promise.all(work);

  await enclosureSnapshotService
    .createSnapshot(userId, {
      enclosureId,
      dayWarmTemp: baskingTemp === undefined || Number.isNaN(baskingTemp) ? undefined : baskingTemp,
      dayCoolTemp: coolTemp === undefined || Number.isNaN(coolTemp) ? undefined : coolTemp,
      humidityMin: humidityPercent === undefined || Number.isNaN(humidityPercent) ? undefined : humidityPercent,
      humidityMax: humidityPercent === undefined || Number.isNaN(humidityPercent) ? undefined : humidityPercent,
      notes: notes || undefined,
    })
    .catch(() => {
      // Best effort so reading logs can still succeed when snapshot schema differs.
    });
}
