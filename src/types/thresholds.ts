import type { HumidityRange, TemperatureRange } from '../engine/types';
import type { FeedingLog } from '../services/feedingLogService';
import type { HumidityLog } from '../services/humidityLogService';
import type { TempLog } from '../services/tempLogService';
import type { WeightLog } from './weightTracking';

export type AlertSeverity = 'info' | 'warning' | 'urgent';

export interface ThresholdAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface ThresholdInput {
  animalName: string;
  speciesId: string;
  feedingLogs: FeedingLog[];
  weightLogs: WeightLog[];
  humidityLogs: HumidityLog[];
  tempLogs: TempLog[];
  uvbBulbInstalledOn?: Date | null;
  careTargets?: {
    humidity?: HumidityRange;
    temperature?: TemperatureRange;
  };
}
