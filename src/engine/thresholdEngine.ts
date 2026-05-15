import type { ThresholdAlert, ThresholdInput } from '../types/thresholds';
import type { FeedingLog } from '../services/feedingLogService';
import type { HumidityLog } from '../services/humidityLogService';
import type { TempLog } from '../services/tempLogService';
import type { WeightLog } from '../types/weightTracking';
import type { HumidityRange, TemperatureRange } from './types';

const SEVERITY_ORDER: Record<ThresholdAlert['severity'], number> = {
  urgent: 3,
  warning: 2,
  info: 1,
};

function daysSince(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function getRefusalContext(speciesId: string): string {
  if (speciesId.includes('python') || speciesId.includes('boa') || speciesId.includes('snake')) {
    return 'Snakes commonly refuse during a shed cycle, seasonal cool-down, or after stressful handling.';
  }
  if (speciesId.includes('gecko') || speciesId.includes('dragon') || speciesId.includes('skink') || speciesId.includes('lizard')) {
    return 'Check that temperatures are correct — lizards often refuse when the warm side is too cool.';
  }
  if (speciesId.includes('frog') || speciesId.includes('toad') || speciesId.includes('axolotl')) {
    return 'Check water quality and ambient temperature. Amphibians often refuse when conditions are off.';
  }
  return 'Common causes include an upcoming shed, stress from a recent change, or an environmental issue.';
}

export function checkFeedingRefusalStreak(
  logs: FeedingLog[],
  animalName: string,
  speciesId: string,
): ThresholdAlert | null {
  if (logs.length < 3) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  let streak = 0;
  for (const log of sorted) {
    if (log.refusalNoted) {
      streak++;
    } else {
      break;
    }
  }

  if (streak < 3) return null;

  const name = animalName || 'Your animal';
  return {
    id: 'feeding-refusal-streak',
    severity: streak >= 5 ? 'urgent' : 'warning',
    title: `${streak} consecutive feeding refusals`,
    body: `${name} has refused ${streak} feedings in a row. ${getRefusalContext(speciesId)}`,
    actionLabel: 'View Feeding Log',
    actionPath: '/my-animals',
  };
}

function getFeedingWindowDays(speciesId: string): { warning: number; urgent: number } {
  if (speciesId.includes('python') || speciesId.includes('boa') || speciesId.includes('snake')) {
    return { warning: 21, urgent: 35 };
  }
  if (speciesId.includes('dragon')) {
    return { warning: 5, urgent: 10 };
  }
  if (speciesId.includes('gecko') || speciesId.includes('skink') || speciesId.includes('lizard')) {
    return { warning: 7, urgent: 14 };
  }
  if (speciesId.includes('frog') || speciesId.includes('toad') || speciesId.includes('axolotl')) {
    return { warning: 7, urgent: 14 };
  }
  return { warning: 14, urgent: 21 };
}

export function checkFeedingOverdue(
  logs: FeedingLog[],
  animalName: string,
  speciesId: string,
): ThresholdAlert | null {
  if (logs.length === 0) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const days = daysSince(sorted[0].completedAt);
  const window = getFeedingWindowDays(speciesId);

  if (days < window.warning) return null;

  const name = animalName || 'Your animal';

  return {
    id: 'feeding-overdue',
    severity: days >= window.urgent ? 'urgent' : 'warning',
    title: `No feeding logged in ${days} days`,
    body: `${name}'s last recorded feeding was ${days} days ago. If a feeding was missed, check in on enclosure conditions and schedule a feeding soon.`,
    actionLabel: 'View Feeding Log',
    actionPath: '/my-animals',
  };
}

export function checkWeightDrop(logs: WeightLog[], animalName: string): ThresholdAlert | null {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime(),
  );

  const recent = sorted[0];
  const baseline = sorted.find((log) => {
    const days = daysSince(log.measurementDate);
    return days >= 14;
  });

  if (!baseline) return null;

  const changePct = ((recent.weightGrams - baseline.weightGrams) / baseline.weightGrams) * 100;

  if (changePct >= -8) return null;

  const name = animalName || 'Your animal';
  const absPct = Math.abs(changePct).toFixed(1);
  const dayCount = daysSince(baseline.measurementDate);

  return {
    id: 'weight-drop',
    severity: changePct <= -15 ? 'urgent' : 'warning',
    title: `${absPct}% weight loss over ${dayCount} days`,
    body: `${name} has lost ${absPct}% of body weight since ${new Date(baseline.measurementDate).toLocaleDateString()}. Consider reviewing feeding frequency and enclosure conditions.`,
    actionLabel: 'View Weight Tracker',
    actionPath: '/my-animals',
  };
}

export function checkHumidityLow(
  logs: HumidityLog[],
  humidity: HumidityRange | undefined,
  animalName: string,
): ThresholdAlert | null {
  if (!humidity || logs.length < 3) return null;

  const target = humidity.day.min;
  const recent = [...logs]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 3);

  const allLow = recent.every((log) => log.humidityPercent < target);
  if (!allLow) return null;

  const avg = Math.round(recent.reduce((sum, l) => sum + l.humidityPercent, 0) / recent.length);
  const name = animalName || 'Your animal';

  return {
    id: 'humidity-low',
    severity: 'warning',
    title: 'Humidity consistently below target',
    body: `${name}'s last 3 readings averaged ${avg}% — below the ${target}% minimum. Low humidity can cause dehydration and shed problems.`,
    actionLabel: 'Log Reading',
    actionPath: '/care-calendar',
  };
}

export function checkHumidityHigh(
  logs: HumidityLog[],
  humidity: HumidityRange | undefined,
  animalName: string,
): ThresholdAlert | null {
  if (!humidity || logs.length < 3) return null;

  const target = humidity.day.max;
  const recent = [...logs]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 3);

  const allHigh = recent.every((log) => log.humidityPercent > target);
  if (!allHigh) return null;

  const avg = Math.round(recent.reduce((sum, l) => sum + l.humidityPercent, 0) / recent.length);
  const name = animalName || 'Your animal';

  return {
    id: 'humidity-high',
    severity: 'warning',
    title: 'Humidity consistently above target',
    body: `${name}'s last 3 readings averaged ${avg}% — above the ${target}% maximum. Persistently high humidity can cause respiratory infections and mold growth.`,
    actionLabel: 'Log Reading',
    actionPath: '/care-calendar',
  };
}

export function checkTemperatureOutOfRange(
  logs: TempLog[],
  temperature: TemperatureRange | undefined,
  animalName: string,
): ThresholdAlert | null {
  if (!temperature || logs.length < 3) return null;

  const ambientLogs = [...logs]
    .filter((l) => !l.zone || l.zone === 'ambient' || l.zone === 'cool')
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 3);

  if (ambientLogs.length < 2) return null;

  const toF = (val: number, unit: 'f' | 'c') =>
    unit === 'c' ? (val * 9) / 5 + 32 : val;

  const targetMin = temperature.coolSide?.min ?? temperature.min;
  const targetMax = temperature.warmSide?.max ?? temperature.max;

  const outOfRange = ambientLogs.filter((log) => {
    const f = toF(log.temperatureValue, log.unit);
    return f < targetMin || f > targetMax;
  });

  if (outOfRange.length < 2) return null;

  const latest = ambientLogs[0];
  const latestF = toF(latest.temperatureValue, latest.unit);
  const isTooLow = latestF < targetMin;
  const name = animalName || 'Your animal';

  return {
    id: 'temperature-out-of-range',
    severity: outOfRange.length === ambientLogs.length ? 'urgent' : 'warning',
    title: `Temperature readings ${isTooLow ? 'too low' : 'too high'}`,
    body: `${name}'s enclosure has logged ${outOfRange.length} of the last ${ambientLogs.length} temperature readings outside the ${targetMin}–${targetMax}°${temperature.unit} target range.`,
    actionLabel: 'Log Reading',
    actionPath: '/care-calendar',
  };
}

export function checkUvbBulbAge(
  installedOn: Date | null | undefined,
  animalName: string,
): ThresholdAlert | null {
  if (!installedOn) return null;

  const days = daysSince(installedOn);

  if (days < 150) return null;

  const name = animalName || 'Your animal';
  const months = Math.floor(days / 30);

  if (days >= 180) {
    return {
      id: 'uvb-bulb-age',
      severity: 'warning',
      title: `UVB bulb is ${months} months old`,
      body: `${name}'s UVB bulb was installed ${days} days ago. UV output degrades before the bulb stops glowing — replacement is recommended every 6 months.`,
      actionLabel: 'View Enclosure',
      actionPath: '/care-calendar',
    };
  }

  return {
    id: 'uvb-bulb-age',
    severity: 'info',
    title: `UVB bulb approaching replacement`,
    body: `${name}'s UVB bulb is ${months} months old. Consider replacing it soon — UV output begins degrading around 6 months.`,
    actionLabel: 'View Enclosure',
    actionPath: '/care-calendar',
  };
}

export function runThresholdEngine(input: ThresholdInput): ThresholdAlert[] {
  const { animalName, speciesId, feedingLogs, weightLogs, humidityLogs, tempLogs, uvbBulbInstalledOn, careTargets } = input;

  const results: (ThresholdAlert | null)[] = [
    checkFeedingRefusalStreak(feedingLogs, animalName, speciesId),
    checkFeedingOverdue(feedingLogs, animalName, speciesId),
    checkWeightDrop(weightLogs, animalName),
    checkHumidityLow(humidityLogs, careTargets?.humidity, animalName),
    checkHumidityHigh(humidityLogs, careTargets?.humidity, animalName),
    checkTemperatureOutOfRange(tempLogs, careTargets?.temperature, animalName),
    checkUvbBulbAge(uvbBulbInstalledOn, animalName),
  ];

  return results
    .filter((a): a is ThresholdAlert => a !== null)
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}
