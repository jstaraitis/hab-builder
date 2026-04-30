import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Droplets, Home, Pencil, Save, Sun, Thermometer, Trash2, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { tempLogService, type TempLog } from '../../services/tempLogService';
import { humidityLogService, type HumidityLog } from '../../services/humidityLogService';
import { uvbLogService, type UvbLog } from '../../services/uvbLogService';
import { enclosureEventService } from '../../services/enclosureEventService';
import { enclosureSnapshotService } from '../../services/enclosureSnapshotService';
import { saveEnvironmentReadings } from '../../services/environmentReadingsService';
import type {
  Enclosure,
  EnclosureAnimal,
  EnclosureEvent,
  EnclosureEventSeverity,
  EnclosureEventType,
  EnclosureHealthScore,
  EnclosureSnapshot,
  MoldSeverity,
} from '../../types/careCalendar';

function formatLoggedAt(value: string): string {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string): Date | undefined {
  if (!value) return undefined;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  // Use midday local time to avoid timezone-related date shifting.
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

const EVENT_TYPE_OPTIONS: Array<{ value: EnclosureEventType; label: string }> = [
  { value: 'substrate_top_off', label: 'Substrate Top-Off' },
  { value: 'substrate_partial_change', label: 'Substrate Partial Change' },
  { value: 'substrate_full_change', label: 'Substrate Full Change' },
  { value: 'mold_bloom_started', label: 'Mold Bloom Started' },
  { value: 'mold_bloom_resolved', label: 'Mold Bloom Resolved' },
  { value: 'cleanup_crew_restocked', label: 'Cleanup Crew Restocked' },
  { value: 'plant_added', label: 'Plant Added' },
  { value: 'plant_pruned', label: 'Plant Pruned' },
  { value: 'plant_replaced', label: 'Plant Replaced' },
  { value: 'pest_detected', label: 'Pest Detected' },
  { value: 'pest_resolved', label: 'Pest Resolved' },
  { value: 'custom', label: 'Custom Event' },
];

function formatEventType(value: EnclosureEventType): string {
  const found = EVENT_TYPE_OPTIONS.find((option) => option.value === value);
  if (found) return found.label;

  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

interface EnclosureHeroCardProps {
  readonly enclosure: Enclosure;
  readonly animalCount: number;
}

function EnclosureHeroCard({ enclosure, animalCount }: EnclosureHeroCardProps) {
  return (
    <div className="rounded-2xl border border-divider bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-4 pt-4 pb-3">
        <div className="w-24 h-24 rounded-2xl bg-card-elevated border border-divider overflow-hidden flex-shrink-0 flex items-center justify-center">
          {enclosure.photoUrl ? (
            <img src={enclosure.photoUrl} alt={enclosure.name} className="w-full h-full object-cover" />
          ) : (
            <Home className="w-10 h-10 text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{enclosure.name}</p>
          <p className="text-xs text-muted mb-2 truncate">{enclosure.animalName || 'Species not set'}</p>
          <span className="inline-flex text-xs font-semibold text-accent bg-accent/15 px-2.5 py-0.5 rounded-full">
            {animalCount} animal{animalCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-divider border-t border-divider">
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-muted leading-tight">Species</p>
          <p className="text-xs font-bold text-white leading-tight truncate">{enclosure.animalName || 'Not set'}</p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-muted leading-tight">Substrate</p>
          <p className="text-xs font-bold text-white leading-tight truncate capitalize">{enclosure.substrateType || 'Not set'}</p>
        </div>
      </div>

      <div className="border-t border-divider px-3 py-2.5">
        <p className="text-[10px] text-muted leading-tight">Description</p>
        <p className="text-xs text-white/90 leading-snug mt-1 line-clamp-2">{enclosure.description || 'No description yet.'}</p>
      </div>
    </div>
  );
}

export function EnclosureEnvironmentView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [selectedEnclosureId, setSelectedEnclosureId] = useState<string | null>(null);

  const [tempLogs, setTempLogs] = useState<TempLog[]>([]);
  const [humidityLogs, setHumidityLogs] = useState<HumidityLog[]>([]);
  const [uvbLogs, setUvbLogs] = useState<UvbLog[]>([]);
  const [ecoEvents, setEcoEvents] = useState<EnclosureEvent[]>([]);
  const [ecoSnapshots, setEcoSnapshots] = useState<EnclosureSnapshot[]>([]);

  const [tempValue, setTempValue] = useState('');
  const [tempUnit, setTempUnit] = useState<'f' | 'c'>('f');
  const [tempZone, setTempZone] = useState<TempLog['zone']>('ambient');

  const [humidityValue, setHumidityValue] = useState('');
  const [humidityZone, setHumidityZone] = useState<HumidityLog['zone']>('ambient');

  const [uvIndex, setUvIndex] = useState('');
  const [uvbZone, setUvbZone] = useState<UvbLog['zone']>('basking');

  const [manageReadingsExpanded, setManageReadingsExpanded] = useState(false);
  const [baskingTemp, setBaskingTemp] = useState('');
  const [coolTemp, setCoolTemp] = useState('');
  const [notes, setNotes] = useState('');
  const [eventType, setEventType] = useState<EnclosureEventType>('substrate_top_off');
  const [eventSeverity, setEventSeverity] = useState<EnclosureEventSeverity>('info');
  const [eventNotes, setEventNotes] = useState('');
  const [eventDate, setEventDate] = useState<string>(() => toDateInputValue(new Date()));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventType, setEditEventType] = useState<EnclosureEventType>('substrate_top_off');
  const [editEventSeverity, setEditEventSeverity] = useState<EnclosureEventSeverity>('info');
  const [editEventNotes, setEditEventNotes] = useState('');
  const [editEventDate, setEditEventDate] = useState<string>(() => toDateInputValue(new Date()));
  const [historyRange, setHistoryRange] = useState<'24H' | '7D' | '30D' | '90D'>('24H');
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [activeTab, setActiveTab] = useState<'environment' | 'bioactive'>('environment');

  const [weeklyPlantHealth, setWeeklyPlantHealth] = useState<EnclosureHealthScore>(3);
  const [weeklyCleanupCrew, setWeeklyCleanupCrew] = useState<EnclosureHealthScore>(3);
  const [weeklySubstrateMoisture, setWeeklySubstrateMoisture] = useState<EnclosureHealthScore>(3);
  const [weeklySubstrateCompaction, setWeeklySubstrateCompaction] = useState<EnclosureHealthScore>(3);
  const [weeklyMoldSeverity, setWeeklyMoldSeverity] = useState<MoldSeverity>('none');
  const [weeklySnapshotNotes, setWeeklySnapshotNotes] = useState('');

  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const [editTempValue, setEditTempValue] = useState('');
  const [editTempUnit, setEditTempUnit] = useState<'f' | 'c'>('f');
  const [editTempZone, setEditTempZone] = useState<TempLog['zone']>('ambient');

  const [editingHumidityId, setEditingHumidityId] = useState<string | null>(null);
  const [editHumidityValue, setEditHumidityValue] = useState('');
  const [editHumidityZone, setEditHumidityZone] = useState<HumidityLog['zone']>('ambient');

  const [editingUvbId, setEditingUvbId] = useState<string | null>(null);
  const [editUvbValue, setEditUvbValue] = useState('');
  const [editUvbZone, setEditUvbZone] = useState<UvbLog['zone']>('basking');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    Promise.all([
      enclosureService.getEnclosures(user.id),
      enclosureAnimalService.getAllUserAnimals(user.id),
    ])
      .then(([enclosureRows, animalRows]) => {
        const activeEnclosures = enclosureRows.filter((e) => e.isActive);
        const activeAnimals = animalRows.filter((a) => a.isActive);

        setEnclosures(activeEnclosures);
        setAnimals(activeAnimals);

        if (id && activeEnclosures.some((e) => e.id === id)) {
          setSelectedEnclosureId(id);
        } else if (activeEnclosures.length > 0) {
          setSelectedEnclosureId(activeEnclosures[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load enclosure environment context:', err);
        setError('Failed to load enclosures');
      })
      .finally(() => setLoading(false));
  }, [user, id]);

  const animalsInEnclosure = useMemo(
    () => animals.filter((a) => a.enclosureId === selectedEnclosureId),
    [animals, selectedEnclosureId],
  );

  const selectedEnclosure = useMemo(
    () => enclosures.find((e) => e.id === selectedEnclosureId) ?? null,
    [enclosures, selectedEnclosureId],
  );
  const selectedEnclosureEnvironmentPath = selectedEnclosure
    ? `/care-calendar/enclosures/${selectedEnclosure.id}/environment`
    : '/care-calendar/enclosures';

  const targetAnimalId = animalsInEnclosure[0]?.id;

  const refreshLogs = async () => {
    if (!selectedEnclosureId) return;

    const [tempRows, humidityRows, uvbRows] = await Promise.all([
      tempLogService.getRecentLogsForEnclosure(selectedEnclosureId, 50).catch(() => []),
      humidityLogService.getRecentLogsForEnclosure(selectedEnclosureId, 50).catch(() => []),
      uvbLogService.getRecentLogsForEnclosure(selectedEnclosureId, 50).catch(() => []),
    ]);

    const eventRows = await enclosureEventService
      .getRecentEventsForEnclosure(selectedEnclosureId, 20)
      .catch(() => []);

    const snapshotRows = await enclosureSnapshotService
      .getRecentSnapshotsForEnclosure(selectedEnclosureId, 12)
      .catch(() => []);

    setTempLogs(tempRows);
    setHumidityLogs(humidityRows);
    setUvbLogs(uvbRows);
    setEcoEvents(eventRows);
    setEcoSnapshots(snapshotRows);

    if (tempRows[0]) {
      setTempValue(String(tempRows[0].temperatureValue));
      setTempUnit(tempRows[0].unit);
      setTempZone(tempRows[0].zone || 'ambient');
    }
    if (humidityRows[0]) {
      setHumidityValue(String(humidityRows[0].humidityPercent));
      setHumidityZone(humidityRows[0].zone || 'ambient');
    }
    if (uvbRows[0]) {
      const uvbValue = uvbRows[0].uvIndex;
      setUvIndex(uvbValue === undefined || uvbValue === null ? '' : String(uvbValue));
      setUvbZone(uvbRows[0].zone || 'basking');
    }
  };

  useEffect(() => {
    refreshLogs().catch(console.error);
  }, [selectedEnclosureId]);

  const saveEnvironment = async () => {
    if (!user || !selectedEnclosureId) return;
    if (!targetAnimalId) {
      setError('Add at least one animal to this enclosure before logging environment values.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const parsedTemp = Number.parseFloat(tempValue);
      const parsedHumidity = Number.parseInt(humidityValue, 10);
      const parsedBaskingTemp = Number.parseFloat(baskingTemp);
      const parsedCoolTemp = Number.parseFloat(coolTemp);
      const parsedUvi = Number.parseFloat(uvIndex);

      await saveEnvironmentReadings({
        userId: user.id,
        enclosureId: selectedEnclosureId,
        enclosureAnimalId: targetAnimalId,
        requireAnimal: true,
        ambientTemp: Number.isNaN(parsedTemp) ? undefined : parsedTemp,
        ambientTempZone: tempZone,
        baskingTemp: Number.isNaN(parsedBaskingTemp) ? undefined : parsedBaskingTemp,
        coolTemp: Number.isNaN(parsedCoolTemp) ? undefined : parsedCoolTemp,
        tempUnit,
        humidityPercent: Number.isNaN(parsedHumidity) ? undefined : parsedHumidity,
        humidityZone,
        uvIndex: Number.isNaN(parsedUvi) ? undefined : parsedUvi,
        uvbZone,
        notes,
      });

      await refreshLogs();
      setNotes('');
    } catch (err) {
      console.error('Failed to save environment logs:', err);
      setError('Could not save environment readings.');
    } finally {
      setSaving(false);
    }
  };

  const saveEcoEvent = async () => {
    if (!user || !selectedEnclosureId) return;

    try {
      setSavingEvent(true);
      setError(null);

      await enclosureEventService.createEvent(user.id, {
        enclosureId: selectedEnclosureId,
        eventDate: fromDateInputValue(eventDate),
        eventType,
        severity: eventSeverity,
        notes: eventNotes || undefined,
      });

      setEventNotes('');
      await refreshLogs();
    } catch (err) {
      console.error('Failed to save enclosure event:', err);
      setError('Could not save ecosystem event. Run the enclosure experience migration if needed.');
    } finally {
      setSavingEvent(false);
    }
  };

  const startEventEdit = (event: EnclosureEvent) => {
    setEditingEventId(event.id);
    setEditEventType(event.eventType);
    setEditEventSeverity(event.severity || 'info');
    setEditEventNotes(event.notes || '');
    setEditEventDate(toDateInputValue(event.eventDate));
  };

  const saveEventEdit = async (eventId: string) => {
    try {
      setError(null);
      await enclosureEventService.updateEvent(eventId, {
        eventDate: fromDateInputValue(editEventDate),
        eventType: editEventType,
        severity: editEventSeverity,
        notes: editEventNotes || undefined,
      });
      setEditingEventId(null);
      await refreshLogs();
    } catch (err) {
      console.error('Failed to update enclosure event:', err);
      setError('Could not update ecosystem event.');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this ecosystem event?')) return;

    try {
      setError(null);
      await enclosureEventService.deleteEvent(eventId);
      if (editingEventId === eventId) setEditingEventId(null);
      await refreshLogs();
    } catch (err) {
      console.error('Failed to delete enclosure event:', err);
      setError('Could not delete ecosystem event.');
    }
  };

  const saveWeeklySnapshot = async () => {
    if (!user || !selectedEnclosureId) return;

    try {
      setSavingSnapshot(true);
      setError(null);

      await enclosureSnapshotService.createSnapshot(user.id, {
        enclosureId: selectedEnclosureId,
        substrateMoistureScore: weeklySubstrateMoisture,
        substrateCompactionScore: weeklySubstrateCompaction,
        moldSeverity: weeklyMoldSeverity,
        cleanupCrewActivityScore: weeklyCleanupCrew,
        plantHealthScore: weeklyPlantHealth,
        notes: weeklySnapshotNotes || undefined,
      });

      setWeeklySnapshotNotes('');
      await refreshLogs();
    } catch (err) {
      console.error('Failed to save weekly snapshot:', err);
      setError('Could not save weekly ecosystem snapshot. Run the migration if needed.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const startTempEdit = (log: TempLog) => {
    setEditingTempId(log.id);
    setEditTempValue(String(log.temperatureValue));
    setEditTempUnit(log.unit);
    setEditTempZone(log.zone || 'ambient');
  };

  const saveTempEdit = async (logId: string) => {
    const parsed = Number.parseFloat(editTempValue);
    if (Number.isNaN(parsed)) {
      setError('Enter a valid temperature value.');
      return;
    }

    try {
      setError(null);
      await tempLogService.updateLog(logId, {
        temperatureValue: parsed,
        unit: editTempUnit,
        zone: editTempZone,
      });
      await refreshLogs();
      setEditingTempId(null);
    } catch (err) {
      console.error('Failed to update temperature log:', err);
      setError('Could not update temperature reading.');
    }
  };

  const deleteTempLog = async (logId: string) => {
    if (!confirm('Delete this temperature reading?')) return;

    try {
      setError(null);
      await tempLogService.deleteLog(logId);
      await refreshLogs();
      if (editingTempId === logId) setEditingTempId(null);
    } catch (err) {
      console.error('Failed to delete temperature log:', err);
      setError('Could not delete temperature reading.');
    }
  };

  const startHumidityEdit = (log: HumidityLog) => {
    setEditingHumidityId(log.id);
    setEditHumidityValue(String(log.humidityPercent));
    setEditHumidityZone(log.zone || 'ambient');
  };

  const saveHumidityEdit = async (logId: string) => {
    const parsed = Number.parseInt(editHumidityValue, 10);
    if (Number.isNaN(parsed)) {
      setError('Enter a valid humidity value.');
      return;
    }

    try {
      setError(null);
      await humidityLogService.updateLog(logId, {
        humidityPercent: parsed,
        zone: editHumidityZone,
      });
      await refreshLogs();
      setEditingHumidityId(null);
    } catch (err) {
      console.error('Failed to update humidity log:', err);
      setError('Could not update humidity reading.');
    }
  };

  const deleteHumidityLog = async (logId: string) => {
    if (!confirm('Delete this humidity reading?')) return;

    try {
      setError(null);
      await humidityLogService.deleteLog(logId);
      await refreshLogs();
      if (editingHumidityId === logId) setEditingHumidityId(null);
    } catch (err) {
      console.error('Failed to delete humidity log:', err);
      setError('Could not delete humidity reading.');
    }
  };

  const startUvbEdit = (log: UvbLog) => {
    setEditingUvbId(log.id);
    setEditUvbValue(log.uvIndex === undefined || log.uvIndex === null ? '' : String(log.uvIndex));
    setEditUvbZone(log.zone || 'basking');
  };

  const saveUvbEdit = async (logId: string) => {
    const parsed = Number.parseFloat(editUvbValue);
    if (Number.isNaN(parsed)) {
      setError('Enter a valid UV index value.');
      return;
    }

    try {
      setError(null);
      await uvbLogService.updateLog(logId, {
        uvIndex: parsed,
        zone: editUvbZone,
      });
      await refreshLogs();
      setEditingUvbId(null);
    } catch (err) {
      console.error('Failed to update UVB log:', err);
      setError('Could not update UVB reading.');
    }
  };

  const deleteUvbLog = async (logId: string) => {
    if (!confirm('Delete this UVB reading?')) return;

    try {
      setError(null);
      await uvbLogService.deleteLog(logId);
      await refreshLogs();
      if (editingUvbId === logId) setEditingUvbId(null);
    } catch (err) {
      console.error('Failed to delete UVB log:', err);
      setError('Could not delete UVB reading.');
    }
  };

  const latestTemp = tempLogs[0];
  const latestHumidity = humidityLogs[0];
  const latestUvb = uvbLogs[0];
  const latestUvbDisplay =
    latestUvb?.uvIndex === undefined || latestUvb?.uvIndex === null
      ? '—'
      : latestUvb.uvIndex.toFixed(1);

  const cutoffMs = (() => {
    const now = Date.now();
    if (historyRange === '24H') return now - 24 * 3600 * 1000;
    if (historyRange === '7D') return now - 7 * 24 * 3600 * 1000;
    if (historyRange === '30D') return now - 30 * 24 * 3600 * 1000;
    return now - 90 * 24 * 3600 * 1000;
  })();

  const mergedChartData = (() => {
    const timeMap = new Map<string, { time: string; temp?: number; humidity?: number; uvb?: number }>();
    for (const log of tempLogs) {
      if (new Date(log.recordedAt).getTime() < cutoffMs) continue;
      const entry = timeMap.get(log.recordedAt) ?? { time: log.recordedAt };
      entry.temp = log.temperatureValue;
      timeMap.set(log.recordedAt, entry);
    }
    for (const log of humidityLogs) {
      if (new Date(log.recordedAt).getTime() < cutoffMs) continue;
      const entry = timeMap.get(log.recordedAt) ?? { time: log.recordedAt };
      entry.humidity = log.humidityPercent;
      timeMap.set(log.recordedAt, entry);
    }
    for (const log of uvbLogs) {
      if (log.uvIndex == null || new Date(log.recordedAt).getTime() < cutoffMs) continue;
      const entry = timeMap.get(log.recordedAt) ?? { time: log.recordedAt };
      entry.uvb = log.uvIndex;
      timeMap.set(log.recordedAt, entry);
    }
    return Array.from(timeMap.values()).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  })();

  const analytics = useMemo(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 3600 * 1000;

    const substrateEventTypes: EnclosureEventType[] = ['substrate_top_off', 'substrate_partial_change', 'substrate_full_change'];
    const substrateEvents = ecoEvents
      .filter((event) => substrateEventTypes.includes(event.eventType))
      .slice()
      .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

    const substrateEventsAsc = substrateEvents.slice().sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < substrateEventsAsc.length; i += 1) {
      const prev = substrateEventsAsc[i - 1];
      const current = substrateEventsAsc[i];
      intervals.push((current.eventDate.getTime() - prev.eventDate.getTime()) / (24 * 3600 * 1000));
    }

    const avgIntervalDays = intervals.length > 0
      ? Math.round(intervals.reduce((sum, val) => sum + val, 0) / intervals.length)
      : selectedEnclosure?.substrateType === 'bioactive'
        ? 60
        : 30;

    const lastSubstrateEvent = substrateEvents[0];
    const nextForecastDate = lastSubstrateEvent
      ? new Date(lastSubstrateEvent.eventDate.getTime() + avgIntervalDays * 24 * 3600 * 1000)
      : null;

    const latestSnapshot = ecoSnapshots[0];
    const moldEventsLast30Days = ecoEvents.filter(
      (event) => event.eventType === 'mold_bloom_started' && (now - event.eventDate.getTime()) <= thirtyDaysMs,
    ).length;

    let stage: 'not-bioactive' | 'new' | 'cycling' | 'stabilizing' | 'stable' = 'not-bioactive';
    if (selectedEnclosure?.substrateType === 'bioactive') {
      const startDate = selectedEnclosure.bioactiveStartedOn;
      if (!startDate) {
        stage = 'new';
      } else {
        const daysSinceStart = Math.floor((now - startDate.getTime()) / (24 * 3600 * 1000));
        if (daysSinceStart < 30) {
          stage = 'new';
        } else if (daysSinceStart < 90 || moldEventsLast30Days > 0) {
          stage = 'cycling';
        } else if ((latestSnapshot?.cleanupCrewActivityScore || 0) < 3 || (latestSnapshot?.plantHealthScore || 0) < 3) {
          stage = 'stabilizing';
        } else {
          stage = 'stable';
        }
      }
    }

    return {
      stage,
      avgIntervalDays,
      lastSubstrateEvent,
      nextForecastDate,
      latestSnapshot,
      moldEventsLast30Days,
    };
  }, [ecoEvents, ecoSnapshots, selectedEnclosure]);

  const stageBadgeClass =
    analytics.stage === 'stable'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : analytics.stage === 'stabilizing'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        : analytics.stage === 'cycling'
          ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
          : analytics.stage === 'new'
            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
            : 'bg-slate-500/15 text-slate-300 border-slate-500/40';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface px-4 pt-6">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-44 bg-card rounded-lg" />
          <div className="h-24 bg-card rounded-2xl" />
          <div className="h-72 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!selectedEnclosure) {
    return (
      <div className="min-h-screen bg-surface px-4 pt-6">
        <button onClick={() => navigate(-1)} className="text-sm text-accent mb-3 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="rounded-2xl border border-divider bg-card p-4 text-sm text-muted">
          No enclosure found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <div className="px-4 pt-4 pb-2 sticky top-0 bg-surface/95 backdrop-blur-sm z-20 border-b border-divider">
        <button onClick={() => navigate(-1)} className="text-xs text-accent mb-2 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Enclosure Environment</h1>
        <p className="text-sm text-muted mt-0.5">{selectedEnclosure.name} • {selectedEnclosure.animalName}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/care-calendar/enclosures/edit/${selectedEnclosure.id}?returnTo=${encodeURIComponent(selectedEnclosureEnvironmentPath)}`)}
            className="inline-flex items-center gap-1.5 rounded-md border border-divider px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Enclosure
          </button>
        </div>
      </div>

      {enclosures.length > 1 && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {enclosures.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEnclosureId(e.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${e.id === selectedEnclosureId ? 'bg-accent text-on-accent' : 'bg-card border border-divider text-muted'}`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 flex flex-col gap-3">
        <div className="order-1">
          <EnclosureHeroCard enclosure={selectedEnclosure} animalCount={animalsInEnclosure.length} />
        </div>

        <div className="rounded-2xl border border-divider bg-card p-1 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('environment')}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'environment' ? 'bg-accent text-on-accent' : 'text-muted hover:text-white'}`}
          >
            Environment Readings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bioactive')}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'bioactive' ? 'bg-emerald-600 text-white' : 'text-muted hover:text-white'}`}
          >
            Bioactive Maintenance
          </button>
        </div>

        {activeTab === 'environment' && (
          <div className="order-2 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-divider bg-card p-3 text-center">
            <Thermometer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-xs text-muted">Temp</p>
            <p className="text-sm font-semibold text-white">{latestTemp ? `${latestTemp.temperatureValue}°${latestTemp.unit.toUpperCase()}` : '—'}</p>
          </div>
          <div className="rounded-xl border border-divider bg-card p-3 text-center">
            <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-muted">Humidity</p>
            <p className="text-sm font-semibold text-white">{latestHumidity ? `${latestHumidity.humidityPercent}%` : '—'}</p>
          </div>
          <div className="rounded-xl border border-divider bg-card p-3 text-center">
            <Sun className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-muted">UVB</p>
            <p className="text-sm font-semibold text-white">{latestUvbDisplay}</p>
          </div>
          </div>
        )}

        {activeTab === 'environment' && (
        <div className="order-3 rounded-2xl border border-divider bg-card p-4">
          <h2 className="text-base font-bold text-white">Trend Insights</h2>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-lg border border-divider overflow-hidden text-xs font-semibold">
                {(['24H', '7D', '30D', '90D'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setHistoryRange(range)}
                    className={`px-2.5 py-1.5 transition-colors ${historyRange === range ? 'bg-accent text-on-accent' : 'text-muted hover:text-white'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-muted">Temp</span>
                <span className="font-semibold text-white">{latestTemp ? `${latestTemp.temperatureValue}°${latestTemp.unit.toUpperCase()}` : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-muted">Humidity</span>
                <span className="font-semibold text-white">{latestHumidity ? `${latestHumidity.humidityPercent}%` : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-muted">UVB Index</span>
                <span className="font-semibold text-white">{latestUvbDisplay}</span>
              </div>
            </div>

            {mergedChartData.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No environment history yet. Save your first reading below.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="time"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        if (historyRange === '24H') return date.toLocaleTimeString([], { hour: 'numeric' });
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }}
                      tick={{ fill: '#8B909A', fontSize: 10 }}
                      axisLine={{ stroke: '#2A2D35' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis yAxisId="temp" tick={{ fill: '#8B909A', fontSize: 10 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}°`} />
                    <YAxis yAxisId="pct" orientation="right" tick={{ fill: '#8B909A', fontSize: 10 }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      labelFormatter={(label) => formatLoggedAt(String(label))}
                      formatter={(value: number, name: string) => {
                        if (name === 'temp') return [`${value}°${tempUnit.toUpperCase()}`, 'Temp'];
                        if (name === 'humidity') return [`${value}%`, 'Humidity'];
                        return [(value as number).toFixed(1), 'UVB'];
                      }}
                      contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid #2A2D35', borderRadius: '0.5rem', fontSize: '12px' }}
                      labelStyle={{ color: '#FFFFFF' }}
                    />
                    <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#fb923c" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="uvb" stroke="#facc15" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'environment' && (
        <div className="order-4 rounded-2xl border border-divider bg-card p-4 space-y-4">
          {/* Header with entry mode tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">Set New Readings</h2>
          </div>

          {/* Temperature + Temp Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Temperature</label>
              <div className="flex gap-2">
                <input type="number" step="0.1" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="79.2" />
                <select value={tempUnit} onChange={(e) => setTempUnit(e.target.value as 'f' | 'c')} className="rounded-lg border border-divider bg-card-elevated px-2 py-2.5 text-sm text-white">
                  <option value="f">°F</option>
                  <option value="c">°C</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Temp Zone</label>
              <select value={tempZone || 'ambient'} onChange={(e) => setTempZone(e.target.value as TempLog['zone'])} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white">
                <option value="ambient">Ambient</option>
                <option value="basking">Basking</option>
                <option value="cool">Cool</option>
                <option value="water">Water</option>
                <option value="substrate">Substrate</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Basking + Cool side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Basking Temp</label>
              <div className="flex gap-2">
                <input type="number" step="0.1" value={baskingTemp} onChange={(e) => setBaskingTemp(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="85.1" />
                <span className="flex items-center rounded-lg border border-divider bg-card-elevated px-2.5 text-sm text-muted">{tempUnit === 'f' ? '°F' : '°C'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Cool Side Temp</label>
              <div className="flex gap-2">
                <input type="number" step="0.1" value={coolTemp} onChange={(e) => setCoolTemp(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="72.3" />
                <span className="flex items-center rounded-lg border border-divider bg-card-elevated px-2.5 text-sm text-muted">{tempUnit === 'f' ? '°F' : '°C'}</span>
              </div>
            </div>
          </div>

          {/* Humidity + Humidity Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Humidity</label>
              <div className="flex gap-2">
                <input type="number" min="0" max="100" value={humidityValue} onChange={(e) => setHumidityValue(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="72" />
                <span className="flex items-center rounded-lg border border-divider bg-card-elevated px-2.5 text-sm text-muted">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Humidity Zone</label>
              <select value={humidityZone || 'ambient'} onChange={(e) => setHumidityZone(e.target.value as HumidityLog['zone'])} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white">
                <option value="ambient">Ambient</option>
                <option value="hide">Hide</option>
                <option value="substrate">Substrate</option>
                <option value="water">Water</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* UVB Index + UVB Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">UVB Index</label>
              <input type="number" step="0.1" value={uvIndex} onChange={(e) => setUvIndex(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="2.4" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">UVB Zone</label>
              <select value={uvbZone || 'basking'} onChange={(e) => setUvbZone(e.target.value as UvbLog['zone'])} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white">
                <option value="basking">Basking</option>
                <option value="ambient">Ambient</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-muted mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted" placeholder="e.g. Added new plants, changed light position..." />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
          )}

          <button
            type="button"
            onClick={() => saveEnvironment().catch(console.error)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-on-accent disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Readings'}
          </button>
        </div>
        )}

        {activeTab === 'bioactive' && (
        <div className="order-4 rounded-2xl border border-divider bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Alerts and Forecasts</h2>
              <p className="text-xs text-muted mt-1">Bioactive phase, mold activity, and substrate forecast based on your logs.</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${stageBadgeClass}`}>
              {analytics.stage.replace('-', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-divider bg-card-elevated p-2.5">
              <p className="text-[11px] text-muted">Mold Events (30d)</p>
              <p className="text-lg font-bold text-white mt-0.5">{analytics.moldEventsLast30Days}</p>
            </div>
            <div className="rounded-lg border border-divider bg-card-elevated p-2.5">
              <p className="text-[11px] text-muted">Avg Substrate Interval</p>
              <p className="text-lg font-bold text-white mt-0.5">{analytics.avgIntervalDays}d</p>
            </div>
            <div className="rounded-lg border border-divider bg-card-elevated p-2.5">
              <p className="text-[11px] text-muted">Next Substrate Forecast</p>
              <p className="text-sm font-bold text-white mt-1">
                {analytics.nextForecastDate
                  ? analytics.nextForecastDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : 'No data yet'}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted">
            Last substrate event: {analytics.lastSubstrateEvent
              ? `${formatEventType(analytics.lastSubstrateEvent.eventType)} on ${analytics.lastSubstrateEvent.eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
              : 'none logged yet'}
          </p>
        </div>
        )}

        {activeTab === 'bioactive' && (
        <div className="order-3 rounded-2xl border border-divider bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">Weekly Ecosystem Snapshot</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-muted mb-1">Plant Health</label>
              <select value={weeklyPlantHealth} onChange={(e) => setWeeklyPlantHealth(Number(e.target.value) as EnclosureHealthScore)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Cleanup Crew</label>
              <select value={weeklyCleanupCrew} onChange={(e) => setWeeklyCleanupCrew(Number(e.target.value) as EnclosureHealthScore)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Substrate Moisture</label>
              <select value={weeklySubstrateMoisture} onChange={(e) => setWeeklySubstrateMoisture(Number(e.target.value) as EnclosureHealthScore)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Compaction</label>
              <select value={weeklySubstrateCompaction} onChange={(e) => setWeeklySubstrateCompaction(Number(e.target.value) as EnclosureHealthScore)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted mb-1">Mold Severity</label>
              <select value={weeklyMoldSeverity} onChange={(e) => setWeeklyMoldSeverity(e.target.value as MoldSeverity)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white">
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Snapshot Notes</label>
              <input
                type="text"
                value={weeklySnapshotNotes}
                onChange={(e) => setWeeklySnapshotNotes(e.target.value)}
                className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveWeeklySnapshot().catch(console.error)}
            disabled={savingSnapshot}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingSnapshot ? 'Saving Snapshot…' : 'Save Weekly Snapshot'}
          </button>
        </div>
        )}

        {activeTab === 'bioactive' && (
        <div className="order-5 rounded-2xl border border-divider bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">Bioactive and Plant Timeline</h2>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Quick Log</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EnclosureEventType)}
                className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white"
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Severity</label>
              <select
                value={eventSeverity}
                onChange={(e) => setEventSeverity(e.target.value as EnclosureEventSeverity)}
                className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white"
              >
                <option value="info">Info</option>
                <option value="watch">Watch</option>
                <option value="caution">Caution</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Event Notes (optional)</label>
            <input
              type="text"
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted"
              placeholder="Example: white mold appeared in rear drainage corner"
            />
          </div>

          <button
            type="button"
            onClick={() => saveEcoEvent().catch(console.error)}
            disabled={savingEvent}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingEvent ? 'Saving Event…' : 'Save Ecosystem Event'}
          </button>

          <div className="pt-2 border-t border-divider">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Recent Events</h3>
            <div className="space-y-2">
              {ecoEvents.length === 0 ? (
                <p className="text-xs text-muted">No ecosystem events yet.</p>
              ) : (
                ecoEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="rounded-lg border border-divider p-2.5">
                    {editingEventId === event.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select value={editEventType} onChange={(e) => setEditEventType(e.target.value as EnclosureEventType)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                            {EVENT_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <select value={editEventSeverity} onChange={(e) => setEditEventSeverity(e.target.value as EnclosureEventSeverity)} className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                            <option value="info">Info</option>
                            <option value="watch">Watch</option>
                            <option value="caution">Caution</option>
                            <option value="critical">Critical</option>
                          </select>
                          <input
                            type="date"
                            value={editEventDate}
                            onChange={(e) => setEditEventDate(e.target.value)}
                            className="w-full rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white"
                          />
                        </div>
                        <input type="text" value={editEventNotes} onChange={(e) => setEditEventNotes(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2 text-sm text-white" placeholder="Event notes" />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingEventId(null)} className="inline-flex items-center gap-1 rounded-md border border-divider px-2 py-1 text-xs text-muted"><X className="h-3.5 w-3.5" />Cancel</button>
                          <button type="button" onClick={() => saveEventEdit(event.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-on-accent"><Check className="h-3.5 w-3.5" />Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{formatEventType(event.eventType)}</p>
                          <span className="text-[10px] uppercase tracking-wide rounded px-2 py-0.5 border border-divider text-muted">
                            {event.severity || 'info'}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1">{event.notes || 'No notes'}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted">{event.eventDate.toLocaleString()}</p>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => startEventEdit(event)} className="rounded-md border border-divider px-2 py-1 text-xs text-muted hover:text-white">Edit</button>
                            <button type="button" onClick={() => deleteEvent(event.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {activeTab === 'environment' && (
        <div className="order-8 rounded-2xl border border-divider bg-card p-4">
          <button
            type="button"
            onClick={() => setManageReadingsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-white">Manage Previous Readings</h2>
            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${manageReadingsExpanded ? 'rotate-180' : ''}`} />
          </button>

          {manageReadingsExpanded && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Temperature</h3>
                <div className="space-y-2">
                  {tempLogs.length === 0 ? (
                    <p className="text-xs text-muted">No temperature readings yet.</p>
                  ) : (
                    tempLogs.map((log) => (
                      <div key={log.id} className="rounded-lg border border-divider p-3">
                        {editingTempId === log.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input type="number" step="0.1" value={editTempValue} onChange={(e) => setEditTempValue(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2 text-sm text-white" />
                              <select value={editTempUnit} onChange={(e) => setEditTempUnit(e.target.value as 'f' | 'c')} className="rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                                <option value="f">F</option>
                                <option value="c">C</option>
                              </select>
                              <select value={editTempZone || 'ambient'} onChange={(e) => setEditTempZone(e.target.value as TempLog['zone'])} className="rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                                <option value="ambient">Ambient</option>
                                <option value="basking">Basking</option>
                                <option value="cool">Cool</option>
                                <option value="water">Water</option>
                                <option value="substrate">Substrate</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setEditingTempId(null)} className="inline-flex items-center gap-1 rounded-md border border-divider px-2 py-1 text-xs text-muted"><X className="h-3.5 w-3.5" />Cancel</button>
                              <button type="button" onClick={() => saveTempEdit(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-on-accent"><Check className="h-3.5 w-3.5" />Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{log.temperatureValue}°{log.unit.toUpperCase()} • {log.zone || 'ambient'}</p>
                              <p className="text-xs text-muted">{formatLoggedAt(log.recordedAt)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => startTempEdit(log)} className="rounded-md border border-divider px-2 py-1 text-xs text-muted hover:text-white">Edit</button>
                              <button type="button" onClick={() => deleteTempLog(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Humidity</h3>
                <div className="space-y-2">
                  {humidityLogs.length === 0 ? (
                    <p className="text-xs text-muted">No humidity readings yet.</p>
                  ) : (
                    humidityLogs.map((log) => (
                      <div key={log.id} className="rounded-lg border border-divider p-3">
                        {editingHumidityId === log.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input type="number" min="0" max="100" value={editHumidityValue} onChange={(e) => setEditHumidityValue(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2 text-sm text-white" />
                              <select value={editHumidityZone || 'ambient'} onChange={(e) => setEditHumidityZone(e.target.value as HumidityLog['zone'])} className="rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                                <option value="ambient">Ambient</option>
                                <option value="hide">Hide</option>
                                <option value="substrate">Substrate</option>
                                <option value="water">Water</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setEditingHumidityId(null)} className="inline-flex items-center gap-1 rounded-md border border-divider px-2 py-1 text-xs text-muted"><X className="h-3.5 w-3.5" />Cancel</button>
                              <button type="button" onClick={() => saveHumidityEdit(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-on-accent"><Check className="h-3.5 w-3.5" />Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{log.humidityPercent}% • {log.zone || 'ambient'}</p>
                              <p className="text-xs text-muted">{formatLoggedAt(log.recordedAt)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => startHumidityEdit(log)} className="rounded-md border border-divider px-2 py-1 text-xs text-muted hover:text-white">Edit</button>
                              <button type="button" onClick={() => deleteHumidityLog(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">UVB</h3>
                <div className="space-y-2">
                  {uvbLogs.length === 0 ? (
                    <p className="text-xs text-muted">No UVB readings yet.</p>
                  ) : (
                    uvbLogs.map((log) => (
                      <div key={log.id} className="rounded-lg border border-divider p-3">
                        {editingUvbId === log.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input type="number" step="0.1" value={editUvbValue} onChange={(e) => setEditUvbValue(e.target.value)} className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2 text-sm text-white" />
                              <select value={editUvbZone || 'basking'} onChange={(e) => setEditUvbZone(e.target.value as UvbLog['zone'])} className="rounded-lg border border-divider bg-card-elevated px-2 py-2 text-sm text-white">
                                <option value="basking">Basking</option>
                                <option value="ambient">Ambient</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setEditingUvbId(null)} className="inline-flex items-center gap-1 rounded-md border border-divider px-2 py-1 text-xs text-muted"><X className="h-3.5 w-3.5" />Cancel</button>
                              <button type="button" onClick={() => saveUvbEdit(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-on-accent"><Check className="h-3.5 w-3.5" />Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{log.uvIndex === undefined || log.uvIndex === null ? 'No UVI value' : `UVI ${log.uvIndex.toFixed(1)}`} • {log.zone || 'basking'}</p>
                              <p className="text-xs text-muted">{formatLoggedAt(log.recordedAt)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => startUvbEdit(log)} className="rounded-md border border-divider px-2 py-1 text-xs text-muted hover:text-white">Edit</button>
                              <button type="button" onClick={() => deleteUvbLog(log.id).catch(console.error)} className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
