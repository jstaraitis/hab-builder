import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronRight, Droplets, Home, Pencil, Save, Sun, Thermometer, Trash2, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { tempLogService, type TempLog } from '../../services/tempLogService';
import { humidityLogService, type HumidityLog } from '../../services/humidityLogService';
import { uvbLogService, type UvbLog } from '../../services/uvbLogService';
import type { Enclosure, EnclosureAnimal } from '../../types/careCalendar';

function formatLoggedAt(value: string): string {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  const [historyRange, setHistoryRange] = useState<'24H' | '7D' | '30D' | '90D'>('24H');

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

    setTempLogs(tempRows);
    setHumidityLogs(humidityRows);
    setUvbLogs(uvbRows);

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

      const work: Promise<unknown>[] = [];

      const parsedTemp = Number.parseFloat(tempValue);
      if (!Number.isNaN(parsedTemp)) {
        work.push(
          tempLogService.createLog(user.id, {
            enclosureId: selectedEnclosureId,
            enclosureAnimalId: targetAnimalId,
            temperatureValue: parsedTemp,
            unit: tempUnit,
            zone: tempZone,
          }),
        );
      }

      const parsedHumidity = Number.parseInt(humidityValue, 10);
      if (!Number.isNaN(parsedHumidity)) {
        work.push(
          humidityLogService.createLog(user.id, {
            enclosureId: selectedEnclosureId,
            enclosureAnimalId: targetAnimalId,
            humidityPercent: parsedHumidity,
            zone: humidityZone,
          }),
        );
      }

      const parsedBaskingTemp = Number.parseFloat(baskingTemp);
      if (!Number.isNaN(parsedBaskingTemp)) {
        work.push(
          tempLogService.createLog(user.id, {
            enclosureId: selectedEnclosureId,
            enclosureAnimalId: targetAnimalId,
            temperatureValue: parsedBaskingTemp,
            unit: tempUnit,
            zone: 'basking',
          }),
        );
      }

      const parsedCoolTemp = Number.parseFloat(coolTemp);
      if (!Number.isNaN(parsedCoolTemp)) {
        work.push(
          tempLogService.createLog(user.id, {
            enclosureId: selectedEnclosureId,
            enclosureAnimalId: targetAnimalId,
            temperatureValue: parsedCoolTemp,
            unit: tempUnit,
            zone: 'cool',
          }),
        );
      }

      const parsedUvi = Number.parseFloat(uvIndex);
      if (!Number.isNaN(parsedUvi)) {
        work.push(
          uvbLogService.createLog(user.id, {
            enclosureId: selectedEnclosureId,
            enclosureAnimalId: targetAnimalId,
            uvIndex: parsedUvi,
            zone: uvbZone,
          }),
        );
      }

      await Promise.all(work);
      await refreshLogs();
      setNotes('');
    } catch (err) {
      console.error('Failed to save environment logs:', err);
      setError('Could not save environment readings.');
    } finally {
      setSaving(false);
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

      <div className="px-4 pt-3 space-y-3">
        <EnclosureHeroCard enclosure={selectedEnclosure} animalCount={animalsInEnclosure.length} />

        <div className="grid grid-cols-3 gap-2">
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

        <div className="rounded-2xl border border-divider bg-card p-4 space-y-4">
          {/* Header with entry mode tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">Set New Readings</h2>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent/15 text-accent border border-accent/30">Manual Entry</span>
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

        <div className="rounded-2xl border border-divider bg-card p-4 space-y-3">
          {/* Header + time range tabs */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">Environment History</h2>
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

          {/* Legend */}
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

          {/* Combined chart */}
          {mergedChartData.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No environment history yet. Save your first reading above.</p>
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

          {/* View Full History button */}
          <button
            type="button"
            onClick={() => setManageReadingsExpanded(true)}
            className="w-full flex items-center justify-between pt-2 border-t border-divider text-sm text-muted hover:text-white transition-colors"
          >
            <span>View Full History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-4">
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
      </div>
    </div>
  );
}
