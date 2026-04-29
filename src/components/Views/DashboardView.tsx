/**
 * DashboardView — Main home screen for authenticated users.
 * Redesigned to match new app aesthetic: dark card-based layout with
 * animal hero, today's care plan, health snapshot, beginner reminder, care confidence.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brush,
  Calendar,
  Scissors,
  Utensils,
  Waves,
  Sparkles,
  Stethoscope,
  Pill,
  Wrench,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
  Circle,
  Minus,
  TrendingUp,
  TrendingDown,
  Plus,
  Turtle,
  Flame,
  Thermometer,
  Droplets,
  Sun,
  FileText,
  Home,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { profileService } from '../../services/profileService';
import { enclosureService } from '../../services/enclosureService';
import { careTaskService } from '../../services/careTaskService';
import { weightTrackingService } from '../../services/weightTrackingService';
import { shedLogService } from '../../services/shedLogService';
import { poopLogService, type PoopLog } from '../../services/poopLogService';
import { tempLogService, type TempLog } from '../../services/tempLogService';
import { humidityLogService, type HumidityLog } from '../../services/humidityLogService';
import { uvbLogService, type UvbLog } from '../../services/uvbLogService';
import { feedingLogService, type FeedingLog } from '../../services/feedingLogService';
import { computeSmartStatus, type SmartStatusLevel } from '../../services/smartStatusService';
import type { Enclosure, EnclosureAnimal, CareTaskWithLogs } from '../../types/careCalendar';
import type { WeightLog } from '../../types/weightTracking';
import type { ShedLog } from '../../services/shedLogService';
import { getAnimalById } from '../../data/animals';
import type { AnimalProfile } from '../../engine/types';
import { getCustomWeekdayIntervalDays } from '../../utils/customTaskFrequency';

// helpers
function formatAge(birthday?: Date | null): string {
  if (!birthday) return '—';
  const d = new Date(birthday);
  const months = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
  if (months < 1) return '< 1 mo';
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} yr` : `${y}y ${m}m`;
}

function formatWeight(logs: WeightLog[]): string {
  if (!logs.length) return '—';
  const g = logs[0].weightGrams;
  return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`;
}


function formatScheduledTime(t?: string | null): string | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function isTaskDueToday(task: CareTaskWithLogs): boolean {
  const due = new Date(task.nextDueAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return due < tomorrow;
}

function getTaskFrequencyIntervalDays(task: CareTaskWithLogs): number {
  switch (task.frequency) {
    case 'daily':
      return 1;
    case 'every-other-day':
      return 2;
    case 'twice-weekly':
      return 3;
    case 'weekly':
      return 7;
    case 'bi-weekly':
      return 14;
    case 'monthly':
      return 31;
    case 'custom':
      if (task.customFrequencyWeekdays && task.customFrequencyWeekdays.length > 0) {
        return getCustomWeekdayIntervalDays(task.customFrequencyWeekdays);
      }
      return task.customFrequencyDays && task.customFrequencyDays > 0
        ? task.customFrequencyDays
        : 1;
    default:
      return 1;
  }
}

function calculateTaskConsistencyStreak(task: CareTaskWithLogs): number {
  const completedDates = task.logs
    .filter((log) => !log.skipped)
    .map((log) => {
      const date = new Date(log.completedAt);
      date.setHours(0, 0, 0, 0);
      return date;
    })
    .sort((a, b) => b.getTime() - a.getTime())
    .filter((date, index, arr) => index === 0 || date.getTime() !== arr[index - 1].getTime());

  if (completedDates.length === 0) return 0;

  const intervalDays = getTaskFrequencyIntervalDays(task);
  let streak = 1;
  let currentDate = completedDates[0];

  for (let i = 1; i < completedDates.length; i++) {
    const logDate = completedDates[i];
    const dayDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff <= intervalDays) {
      streak++;
      currentDate = logDate;
    } else {
      break;
    }
  }

  return streak;
}

function taskTypeIcon(type: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    feeding: Utensils,
    misting: Droplets,
    'water-change': Waves,
    'spot-clean': Brush,
    'deep-clean': Sparkles,
    'health-check': Stethoscope,
    supplement: Pill,
    maintenance: Wrench,
    'gut-load': Flame,
    custom: FileText,
  };
  return map[type] ?? FileText;
}

function getWeightTrend(logs: WeightLog[]): string {
  if (logs.length < 2) return '—';
  const diff = logs[0].weightGrams - logs[1].weightGrams;
  if (diff > 0) return 'Gaining';
  if (diff < 0) return 'Losing';
  return 'Stable';
}

function getShedStatus(logs: ShedLog[]): string {
  if (!logs.length) return '—';
  const diff = Math.floor((Date.now() - new Date(logs[0].shedDate).getTime()) / 86_400_000);
  if (diff > 90) return 'Overdue';
  if (diff > 60) return 'Due Soon';
  return 'On Track';
}

function getLastFed(tasks: CareTaskWithLogs[], feedingLogs: FeedingLog[]): string {
  // Combine task-based and direct feeding logs
  const allLogs: Array<{ completedAt: Date | string }> = [
    ...tasks
      .filter((t) => t.type === 'feeding' && t.lastCompleted)
      .map(t => ({ completedAt: t.lastCompleted! })),
    ...feedingLogs.map(log => ({ completedAt: log.completedAt }))
  ];
  
  if (!allLogs.length) return '—';
  
  const sorted = [...allLogs].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  const diff = Math.floor((Date.now() - new Date(sorted[0].completedAt).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

function getLastWaterChange(tasks: CareTaskWithLogs[]): string {
  const wcTasks = tasks.filter((t) => t.type === 'water-change' && t.lastCompleted);
  if (!wcTasks.length) return '—';
  const sorted = [...wcTasks].sort((a, b) => new Date(b.lastCompleted!).getTime() - new Date(a.lastCompleted!).getTime());
  const diff = Math.floor((Date.now() - new Date(sorted[0].lastCompleted!).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

function getDaysAgoLabel(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

function formatLastUpdated(dateValue?: Date | null): string {
  if (!dateValue) return 'Last updated recently';
  const diff = Math.floor((Date.now() - new Date(dateValue).getTime()) / 86_400_000);
  if (diff <= 0) return 'Last updated just now';
  if (diff === 1) return 'Last updated 1 day ago';
  return `Last updated ${diff} days ago`;
}

// sub-components
function EnclosureOverviewSection({
  enclosures,
  selectedId,
  onSelect,
  getAnimalCountForEnclosure,
  navigate,
  animalProfile,
  lastWaterChange,
  latestTempLog,
  latestHumidityLog,
  latestUvbLog,
}: {
  enclosures: Enclosure[];
  selectedId: string;
  onSelect: (id: string) => void;
  getAnimalCountForEnclosure: (id: string) => number;
  navigate: (path: string) => void;
  animalProfile: AnimalProfile | null;
  lastWaterChange: string;
  latestTempLog: TempLog | null;
  latestHumidityLog: HumidityLog | null;
  latestUvbLog: UvbLog | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedEnclosure = enclosures.find((enc) => enc.id === selectedId) ?? enclosures[0] ?? null;

  useEffect(() => {
    if (!scrollRef.current) return;
    const selectedCard = scrollRef.current.querySelector('[data-selected="true"]') as HTMLElement;
    if (selectedCard) {
      const container = scrollRef.current;
      const cardLeft = selectedCard.offsetLeft;
      const cardWidth = selectedCard.offsetWidth;
      const containerWidth = container.offsetWidth;
      const centerScroll = cardLeft - (containerWidth - cardWidth) / 2;
      container.scrollLeft = centerScroll;
    }
  }, [selectedId]);

  if (!selectedEnclosure) {
    return null;
  }

  const selectedAnimalCount = getAnimalCountForEnclosure(selectedEnclosure.id);
  const subtitle = `${selectedAnimalCount} animal${selectedAnimalCount === 1 ? '' : 's'} • ${formatLastUpdated(selectedEnclosure.updatedAt)}`;

  const temp = animalProfile?.careTargets?.temperature;
  const humidity = animalProfile?.careTargets?.humidity;
  const lighting = animalProfile?.careTargets?.lighting;

  const tempBasking = latestTempLog
    ? `${latestTempLog.temperatureValue}\u00b0${latestTempLog.unit.toUpperCase()}`
    : temp?.basking && typeof temp.basking === 'number'
    ? `${temp.basking}\u00b0${temp.unit}`
    : temp ? `${temp.min}\u00b0${temp.unit}` : '\u2014';
  const tempRange = latestTempLog
    ? `Logged ${getDaysAgoLabel(latestTempLog.recordedAt)}`
    : temp ? `${temp.min}\u2013${temp.max}\u00b0${temp.unit}` : '\u2014';

  const humidityVal = latestHumidityLog ? `${latestHumidityLog.humidityPercent}%` : humidity ? `${humidity.day.min}%` : '\u2014';
  const humidityRange = latestHumidityLog
    ? `Logged ${getDaysAgoLabel(latestHumidityLog.recordedAt)}`
    : humidity ? `${humidity.day.min}\u2013${humidity.day.max}%` : '\u2014';

  const uvbVal = latestUvbLog?.uvIndex != null
    ? latestUvbLog.uvIndex.toFixed(1)
    : lighting?.uvbStrength ? lighting.uvbStrength : (lighting?.uvbRequired ? 'Yes' : 'None');
  const uvbSub = latestUvbLog
    ? `Logged ${getDaysAgoLabel(latestUvbLog.recordedAt)}`
    : lighting?.uvbRequired ? 'Required' : 'Not needed';

  const tiles: { icon: React.ReactNode; value: string; label: string; sub: string; hasCheck: boolean }[] = [
    { icon: <Thermometer className="w-5 h-5 text-orange-400" />, value: tempBasking, label: 'Temp', sub: tempRange, hasCheck: latestTempLog != null || temp != null },
    { icon: <Droplets className="w-5 h-5 text-blue-400" />, value: humidityVal, label: 'Humidity', sub: humidityRange, hasCheck: latestHumidityLog != null || humidity != null },
    { icon: <Sun className="w-5 h-5 text-yellow-400" />, value: uvbVal, label: 'UVB Index', sub: uvbSub, hasCheck: latestUvbLog != null || lighting != null },
    { icon: <Droplets className="w-5 h-5 text-cyan-400" />, value: lastWaterChange, label: 'Water Change', sub: lastWaterChange !== '\u2014' ? 'On schedule' : 'No data', hasCheck: lastWaterChange !== '\u2014' },
  ];

  return (
    <div className="px-4 space-y-3">
      <div className="bg-card border border-divider rounded-2xl overflow-hidden p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
          <Home className="w-4 h-4 text-accent" />
          <p className="text-sm font-semibold text-white">Enclosure Overview</p>
        </div>

        <div className="flex gap-2.5 sm:gap-3 items-stretch">
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5 sm:gap-3">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight">{selectedEnclosure.name}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted">{subtitle}</p>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-emerald-200/85">{selectedEnclosure.animalName}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => navigate(`/care-calendar/enclosures/${selectedEnclosure.id}/environment`)}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15"
              >
                View Enclosure
              </button>
              <button
                type="button"
                onClick={() => navigate(`/care-calendar/enclosures/edit/${selectedEnclosure.id}`)}
                className="inline-flex items-center gap-1.5 sm:gap-2 justify-center rounded-full border border-divider bg-card-elevated px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:border-accent/40"
              >
                <Pencil className="w-4 h-4 text-accent" />
                Edit Enclosure
              </button>
            </div>
          </div>

          <div className="w-32 sm:w-56 h-20 sm:h-28 rounded-2xl overflow-hidden border border-divider bg-card-elevated flex-shrink-0 self-center flex items-center justify-center">
            {selectedEnclosure.photoUrl ? (
              <img src={selectedEnclosure.photoUrl} alt={selectedEnclosure.name} className="w-full h-full object-cover" />
            ) : (
              <Home className="w-10 h-10 text-muted" />
            )}
          </div>
        </div>

        <div className="mt-3 sm:mt-4 border-t border-divider pt-2.5 sm:pt-3">
          <div className="flex items-center justify-between px-1 pb-1.5 sm:pb-2">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-100" />
              <p className="text-xs sm:text-sm font-semibold text-white">Environment Snapshot</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-divider border border-divider rounded-xl overflow-hidden bg-card-elevated">
            {tiles.map((tile) => (
              <div key={tile.label} className="flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3">
                <div className="mb-0.5">{tile.icon}</div>
                <span className="text-xs font-bold text-white text-center leading-tight">{tile.value}</span>
                <span className="text-[10px] text-muted text-center leading-tight">{tile.label}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[9px] text-muted text-center leading-tight">{tile.sub}</span>
                  {tile.hasCheck && <CheckCircle2 className="w-2.5 h-2.5 text-accent flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {enclosures.length > 1 ? (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {enclosures.map((enc) => {
            const isSelected = enc.id === selectedId;
            const animalCount = getAnimalCountForEnclosure(enc.id);

            return (
              <button
                key={enc.id}
                onClick={() => onSelect(enc.id)}
                data-selected={isSelected ? 'true' : 'false'}
                className={`flex-shrink-0 w-40 rounded-2xl border overflow-hidden transition-all snap-center ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
                    : 'border-divider bg-card hover:border-accent/50'
                }`}
              >
                <div className="p-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{enc.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{enc.animalName}</p>
                    </div>
                    {isSelected ? <Check className="w-4 h-4 text-accent flex-shrink-0" /> : null}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <Turtle className="w-3.5 h-3.5 text-accent" />
                    <span>{animalCount} animal{animalCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 pt-4">
      <div className="h-8 w-48 bg-card rounded-lg" />
      <div className="h-36 bg-card rounded-2xl" />
      <div className="h-52 bg-card rounded-2xl" />
      <div className="h-24 bg-card rounded-2xl" />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
        <Turtle className="w-10 h-10 text-accent" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">No animals yet</h2>
        <p className="text-muted text-sm max-w-xs">Add your first animal to start tracking care tasks, weight, sheds, and more.</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-2 bg-accent text-on-accent font-semibold px-6 py-3 rounded-full active:scale-95 transition-transform">
        <Plus className="w-4 h-4" />
        Add Animal
      </button>
    </div>
  );
}

function AnimalPills({ animals, selectedId, onSelect, statusByAnimalId }: { animals: EnclosureAnimal[]; selectedId: string; onSelect: (id: string) => void; statusByAnimalId: Record<string, SmartStatusLevel> }) {
  if (animals.length === 0) return null;

  const getImageBorderClass = (status?: SmartStatusLevel): string => {
    switch (status) {
      case 'healthy':
        return 'border-accent/90';
      case 'watch':
        return 'border-sky-400/90';
      case 'needs-check':
        return 'border-amber-400/90';
      case 'urgent':
        return 'border-red-400/90';
      default:
        return 'border-divider';
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
      {animals.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`flex-shrink-0 w-[86px] rounded-2xl border p-2 transition-colors ${a.id === selectedId ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-divider bg-card'}`}
        >
          <div className={`mx-auto w-14 h-14 rounded-2xl overflow-hidden border-2 bg-card-elevated flex items-center justify-center ${getImageBorderClass(statusByAnimalId[a.id])}`}>
            {a.photoUrl ? (
              <img src={a.photoUrl} alt={a.name || `Animal #${a.animalNumber ?? 1}`} className="w-full h-full object-cover" />
            ) : (
              <Turtle className="w-5 h-5 text-muted" />
            )}
          </div>
          <p className={`mt-1.5 text-sm font-semibold truncate ${a.id === selectedId ? 'text-emerald-300' : 'text-white'}`}>{a.name || `#${a.animalNumber ?? 1}`}</p>
        </button>
      ))}
    </div>
  );
}

interface ActivePetCardProps {
  animal: EnclosureAnimal;
  age: string;
  weight: string;
  weightTrend: string;
  lastFed: string;
  consistencyStreak: number;
  healthStatus: SmartStatusLevel;
  healthScore: number;
  healthReasons: string[];
  shedLogs: ShedLog[];
  shedStatus: string;
  poopLogs: PoopLog[];
  onTap: () => void;
}

function deriveNextAction(reasons: string[], level: SmartStatusLevel): string | null {
  if (level === 'healthy') return null;
  const r = reasons[0]?.toLowerCase() ?? '';
  if (r.includes('feeding')) return 'Log a feeding to bring things back on track.';
  if (r.includes('weight')) return 'Log a weight check today.';
  if (r.includes('poop')) return 'Log a poop to keep the record current.';
  if (r.includes("hasn't been done") || r.includes('important') || r.includes('overdue')) return 'Complete the overdue task as soon as you can.';
  if (r.includes('skipped')) return 'Try to complete the next task instead of skipping it.';
  if (r.includes('missed')) return 'Complete all due tasks today to get back on track.';
  return 'Open the Care Calendar to see what needs attention.';
}

function deriveConsistencyReasons(consistencyStreak: number): string[] {
  const reasons = [
    'This number shows your best run of on-schedule task completions for this pet.',
    'Only completed tasks count. Skipped tasks do not build your streak.',
    'Each task follows its own schedule, so weekly and custom tasks are counted fairly.',
  ];

  if (consistencyStreak > 0) {
    reasons.unshift(`You have completed ${consistencyStreak} care checks in a row on schedule.`);
  } else {
    reasons.unshift('No streak yet. Complete your next due task to start one.');
  }

  return reasons;
}

function ActivePetCard({ animal, age, weight, weightTrend, lastFed, consistencyStreak, healthStatus, healthScore, healthReasons, shedLogs, shedStatus, poopLogs, onTap }: ActivePetCardProps) {
  const [explanationOpen, setExplanationOpen] = useState(false);

  const displayName = animal.name || `Animal #${animal.animalNumber ?? 1}`;
  const gender = animal.gender?.toLowerCase();
  const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : null;
  const genderColor = gender === 'male' ? 'text-blue-400' : gender === 'female' ? 'text-pink-400' : 'text-muted';

  const statusConfig: Record<SmartStatusLevel, { label: string; textClass: string; bgClass: string; borderClass: string; icon: React.ReactNode }> = {
    healthy: {
      label: 'Healthy',
      textClass: 'text-accent',
      bgClass: 'bg-accent/10',
      borderClass: 'border-accent/30',
      icon: <CheckCircle2 className="w-4 h-4 text-accent" />,
    },
    watch: {
      label: 'Watch',
      textClass: 'text-sky-300',
      bgClass: 'bg-sky-500/10',
      borderClass: 'border-sky-400/30',
      icon: <Circle className="w-4 h-4 text-sky-400" />,
    },
    'needs-check': {
      label: 'Needs Check',
      textClass: 'text-amber-300',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-400/30',
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
    },
    urgent: {
      label: 'Urgent',
      textClass: 'text-red-300',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-400/30',
      icon: <AlertCircle className="w-4 h-4 text-red-400" />,
    },
  };
  const status = statusConfig[healthStatus];
  const nextAction = deriveNextAction(healthReasons, healthStatus);
  const consistencyReasons = deriveConsistencyReasons(consistencyStreak);
  const smartStatusTooltip = 'Smart Status is your overall care check based on completion trends, overdue/skip patterns, and recent health logs.';
  const consistencyTooltip = 'Routine Streak is your best run of on-schedule care completions for this pet.';

  const trendColor = weightTrend === 'Gaining' ? 'text-accent' : weightTrend === 'Losing' ? 'text-red-400' : weightTrend === 'Stable' ? 'text-blue-400' : 'text-muted';
  const weightTrendIcon = weightTrend === 'Gaining'
    ? <TrendingUp className="w-5 h-5 text-accent" />
    : weightTrend === 'Losing'
    ? <TrendingDown className="w-5 h-5 text-red-400" />
    : weightTrend === 'Stable'
    ? <Minus className="w-5 h-5 text-blue-400" />
    : <Circle className="w-5 h-5 text-muted" />;
  const shedColor = shedStatus === 'On Track' ? 'text-accent' : shedStatus === 'Overdue' ? 'text-red-400' : shedStatus === 'Due Soon' ? 'text-amber-400' : 'text-muted';
  const shedDaysAgo = shedLogs.length > 0 ? Math.floor((Date.now() - new Date(shedLogs[0].shedDate).getTime()) / 86_400_000) : null;
  const shedSub = shedDaysAgo !== null ? (shedDaysAgo === 0 ? 'Today' : shedDaysAgo === 1 ? '1 day ago' : `${shedDaysAgo} days ago`) : 'No data';
  const latestPoop = poopLogs.length > 0 ? poopLogs[0] : null;
  const poopValue = latestPoop ? getDaysAgoLabel(latestPoop.loggedAt) : '\u2014';
  const poopSub = latestPoop?.consistency ? latestPoop.consistency : (latestPoop ? 'Logged' : 'Log it');

  const healthTiles: { icon: React.ReactNode; label: string; value: string; sub: string; valueClass: string; subClass: string }[] = [
    { icon: weightTrendIcon, label: 'Weight Trend', value: weight, sub: weightTrend !== '\u2014' ? weightTrend : 'No data', valueClass: weight !== '\u2014' ? 'text-white' : 'text-muted', subClass: trendColor },
    { icon: <Utensils className="w-5 h-5 text-green-400" />, label: 'Appetite', value: lastFed, sub: lastFed !== '\u2014' ? 'Last fed' : 'No data', valueClass: lastFed !== '\u2014' ? 'text-white' : 'text-muted', subClass: 'text-muted' },
    { icon: <Scissors className="w-5 h-5 text-purple-400" />, label: 'Shed Tracker', value: shedStatus !== '\u2014' ? shedStatus : '\u2014', sub: shedSub, valueClass: shedStatus !== '\u2014' ? shedColor : 'text-muted', subClass: 'text-muted' },
    { icon: <FileText className="w-5 h-5 text-amber-400" />, label: 'Poop Log', value: poopValue, sub: poopSub, valueClass: latestPoop ? 'text-white' : 'text-muted', subClass: 'text-muted' },
  ];

  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden mx-4">
      {/* Top: photo + identity */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-3">
        <div className="w-24 h-24 rounded-2xl bg-card-elevated border border-divider overflow-hidden flex-shrink-0 flex items-center justify-center">
          {animal.photoUrl ? (
            <img src={animal.photoUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <Turtle className="w-12 h-12 text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg font-bold text-white">{displayName}</span>
            {genderIcon && <span className={`text-lg font-bold flex-shrink-0 ${genderColor}`}>{genderIcon}</span>}
          </div>
          <p className="text-xs text-muted mb-1">{age}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setExplanationOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors active:opacity-70 ${status.bgClass} ${status.borderClass}`}
              title={smartStatusTooltip}
              aria-label={`Smart Status: ${status.label}. ${smartStatusTooltip}`}
            >
              {status.icon}
              <span className={`text-xs font-semibold ${status.textClass}`}>{status.label}</span>
              <span className={`text-[10px] font-medium ${status.textClass} opacity-70`}>{healthScore}</span>
              <Info className={`w-3 h-3 ${status.textClass} opacity-85`} />
              <ChevronRight className={`w-3 h-3 ${status.textClass} transition-transform ${explanationOpen ? 'rotate-90' : ''}`} />
            </button>
            <button
              onClick={() => setExplanationOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 transition-colors active:opacity-70"
              title={consistencyTooltip}
              aria-label={`Routine Streak: ${consistencyStreak}. ${consistencyTooltip}`}
            >
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-xs font-semibold text-orange-200">Routine Streak</span>
                <span className="text-[10px] font-medium text-orange-200/80">{consistencyStreak}</span>
                <Info className="w-3 h-3 text-orange-200/90" />
                <ChevronRight className={`w-3 h-3 text-orange-200 transition-transform ${explanationOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Explanation panel */}
      {explanationOpen && (
        <div className={`mx-4 mb-3 rounded-xl border ${status.borderClass} ${status.bgClass} px-3 py-2.5 space-y-2`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Why this status?</p>
          <p className="text-[11px] text-white/75">
            Smart Status is your overall care check. It combines task completion, overdue/skip patterns, and recent feeding, weight, and poop logs.
          </p>
          <ul className="space-y-1">
            {healthReasons.map((reason, idx) => (
              <li key={idx} className={`text-xs flex items-start gap-1.5 ${status.textClass}`}>
                <span className="mt-0.5 flex-shrink-0">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {nextAction && (
            <div className="pt-1.5 border-t border-white/10">
              <p className="text-[11px] font-semibold text-white mb-0.5">Suggested action</p>
              <p className="text-xs text-white/80">{nextAction}</p>
            </div>
          )}

          <div className="pt-1.5 border-t border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Why this routine streak?</p>
            <p className="text-[11px] text-orange-100/80">
              Routine Streak shows your best run of on-schedule care completions for this pet.
            </p>
            <ul className="space-y-1 mt-1.5">
              {consistencyReasons.map((reason, idx) => (
                <li key={idx} className="text-xs flex items-start gap-1.5 text-orange-100/90">
                  <span className="mt-0.5 flex-shrink-0">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Health & Wellness tiles */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 border-t border-divider">
      </div>
      <div className="grid grid-cols-4 divide-x divide-divider border-t border-divider">
        {healthTiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center gap-1 p-3">
            <div className="flex items-center justify-center mb-0.5">{tile.icon}</div>
            <span className={`text-xs font-bold leading-tight text-center ${tile.valueClass}`}>{tile.value}</span>
            <span className={`text-[10px] leading-tight text-center ${tile.subClass}`}>{tile.sub}</span>
            <span className="text-[9px] text-muted text-center leading-tight mt-0.5">{tile.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-end px-4 py-2.5 border-t border-divider">
        <button onClick={onTap} className="flex items-center gap-1 text-xs text-accent font-medium active:opacity-70 transition-opacity">
          View Profile <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface TodayCarePlanProps {
  tasks: CareTaskWithLogs[];
  completedIds: Set<string>;
  onComplete: (task: CareTaskWithLogs) => void;
  onOpenTask: (task: CareTaskWithLogs) => void;
}

function TodayCarePlan({ tasks, completedIds, onComplete, onOpenTask }: TodayCarePlanProps) {
  const dueToday = tasks.filter(isTaskDueToday).slice(0, 6);
  const doneCount = dueToday.filter((t) => completedIds.has(t.id)).length;
  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden mx-4">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-green-400" />
            <h3 className="text-med font-bold text-white">Today's Care Plan</h3>
          </div>
        <span className="text-xs font-medium text-accent">{doneCount} of {dueToday.length} completed</span>
      </div>
      {dueToday.length === 0 ? (
        <div className="px-4 pb-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-sm text-muted">All caught up for today!</p>
        </div>
      ) : (
        <ul className="divide-y divide-divider">
          {dueToday.map((task) => {
            const done = completedIds.has(task.id);
            const timeStr = formatScheduledTime(task.scheduledTime);
            const TaskTypeIcon = taskTypeIcon(task.type);
            return (
              <li key={task.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${done ? 'bg-accent/5' : ''}`}>
                <button onClick={() => onComplete(task)} className={`flex-shrink-0 transition-colors ${done ? 'text-accent' : 'text-muted'}`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <TaskTypeIcon className="w-4 h-4 text-muted flex-shrink-0" />
                    <span className={`text-sm font-semibold truncate ${done ? 'line-through text-muted' : 'text-white'}`}>{task.title}</span>
                  </div>
                  {(task.description || task.notes) && (
                    <p className="text-xs text-muted mt-0.5 truncate">{task.description || task.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {timeStr && <span className="text-xs text-muted">{timeStr}</span>}
                  <button
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className="text-muted transition-colors hover:text-white"
                    aria-label={`Open ${task.title}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Main View
export function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [selectedEnclosureId, setSelectedEnclosureId] = useState<string | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [shedLogs, setShedLogs] = useState<ShedLog[]>([]);
  const [poopLogs, setPoopLogs] = useState<PoopLog[]>([]);
  const [tempLogs, setTempLogs] = useState<TempLog[]>([]);
  const [humidityLogs, setHumidityLogs] = useState<HumidityLog[]>([]);
  const [uvbLogs, setUvbLogs] = useState<UvbLog[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [consistencyStreak, setConsistencyStreak] = useState(0);
  const [animalStatusById, setAnimalStatusById] = useState<Record<string, SmartStatusLevel>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    profileService.getProfile(user.id)
      .then((p) => setDisplayName(p?.displayName || ''))
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      enclosureAnimalService.getAllUserAnimals(user.id),
      enclosureService.getEnclosures(user.id),
    ])
      .then(([animalsData, enclosuresData]) => {
        const activeAnimals = animalsData.filter((a) => a.isActive);
        const activeEnclosures = enclosuresData.filter((e) => e.isActive);

        setAnimals(activeAnimals);
        setEnclosures(activeEnclosures);

        if (activeAnimals.length > 0) {
          setSelectedAnimalId(activeAnimals[0].id);
          setSelectedEnclosureId(activeAnimals[0].enclosureId || activeEnclosures[0]?.id || null);
        } else if (activeEnclosures.length > 0) {
          setSelectedEnclosureId(activeEnclosures[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);
    if (selectedAnimal?.enclosureId && selectedAnimal.enclosureId !== selectedEnclosureId) {
      setSelectedEnclosureId(selectedAnimal.enclosureId);
    }
  }, [selectedAnimalId, animals, selectedEnclosureId]);

  useEffect(() => {
    if (!user) return;
    careTaskService.getTasksWithLogs(user.id)
      .then((data) => setTasks(data.filter((t) => t.isActive)))
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);
    
    Promise.all([
      weightTrackingService.getWeightLogs(selectedAnimalId).catch(() => []),
      shedLogService.getLogsForAnimal(selectedAnimalId).catch(() => []),
      poopLogService.getRecentLogs(selectedAnimalId, 10).catch(() => []),
      selectedEnclosureId
        ? tempLogService.getRecentLogsForEnclosure(selectedEnclosureId, 10).catch(() => [])
        : Promise.resolve([]),
      selectedEnclosureId
        ? humidityLogService.getRecentLogsForEnclosure(selectedEnclosureId, 10).catch(() => [])
        : Promise.resolve([]),
      selectedEnclosureId
        ? uvbLogService.getRecentLogsForEnclosure(selectedEnclosureId, 10).catch(() => [])
        : Promise.resolve([]),
      selectedAnimal?.enclosureId
        ? feedingLogService.getRecentLogs(selectedAnimal.enclosureId, 10).catch(() => [])
        : Promise.resolve([]),
    ]).then(async ([weights, sheds, poops, temps, humidity, uvb, feeding]) => {
      let resolvedTemps = temps as TempLog[];
      let resolvedHumidity = humidity as HumidityLog[];
      let resolvedUvb = uvb as UvbLog[];

      if (resolvedTemps.length === 0) {
        resolvedTemps = await tempLogService.getRecentLogs(selectedAnimalId, 10).catch(() => []);
      }
      if (resolvedHumidity.length === 0) {
        resolvedHumidity = await humidityLogService.getRecentLogs(selectedAnimalId, 10).catch(() => []);
      }
      if (resolvedUvb.length === 0) {
        resolvedUvb = await uvbLogService.getRecentLogs(selectedAnimalId, 10).catch(() => []);
      }

      setWeightLogs(weights as WeightLog[]);
      setShedLogs(sheds as ShedLog[]);
      setPoopLogs(poops as PoopLog[]);
      setTempLogs(resolvedTemps);
      setHumidityLogs(resolvedHumidity);
      setUvbLogs(resolvedUvb);
      setFeedingLogs(feeding as FeedingLog[]);
    });
  }, [selectedAnimalId, selectedEnclosureId, animals]);

  // Calculate consistency streak for selected animal
  useEffect(() => {
    if (!selectedAnimalId) {
      setConsistencyStreak(0);
      return;
    }

    const animalTasksForStreak = tasks.filter((t) =>
      t.enclosureAnimalId === selectedAnimalId ||
      (selectedEnclosureId && t.enclosureId === selectedEnclosureId)
    );

    const animalConsistencyStreak = animalTasksForStreak.length > 0
      ? Math.max(...animalTasksForStreak.map((task) => calculateTaskConsistencyStreak(task)), 0)
      : 0;
    setConsistencyStreak(animalConsistencyStreak);
  }, [selectedAnimalId, selectedEnclosureId, tasks]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnimalStatuses() {
      if (animals.length === 0) {
        setAnimalStatusById({});
        return;
      }

      const statusEntries = await Promise.all(
        animals.map(async (animal) => {
          const animalTasks = tasks.filter((t) =>
            t.enclosureAnimalId === animal.id ||
            (animal.enclosureId && t.enclosureId === animal.enclosureId)
          );

          const animalStreak = animalTasks.length > 0
            ? Math.max(...animalTasks.map((task) => calculateTaskConsistencyStreak(task)), 0)
            : 0;

          const [animalWeightLogs, animalPoopLogs, enclosureFeedingLogs] = await Promise.all([
            weightTrackingService.getWeightLogs(animal.id).catch(() => [] as WeightLog[]),
            poopLogService.getRecentLogs(animal.id, 1).catch(() => [] as PoopLog[]),
            animal.enclosureId
              ? feedingLogService.getRecentLogs(animal.enclosureId, 10).catch(() => [] as FeedingLog[])
              : Promise.resolve([] as FeedingLog[]),
          ]);

          const latestTaskFeeding = animalTasks
            .filter((t) => t.type === 'feeding' && t.lastCompleted)
            .map((t) => new Date(t.lastCompleted as Date | string))
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
          const latestDirectFeeding = enclosureFeedingLogs[0]?.completedAt
            ? new Date(enclosureFeedingLogs[0].completedAt)
            : null;
          const latestFeedingAt = latestTaskFeeding && latestDirectFeeding
            ? (latestTaskFeeding > latestDirectFeeding ? latestTaskFeeding : latestDirectFeeding)
            : (latestTaskFeeding ?? latestDirectFeeding);

          const latestWeightAt = animalWeightLogs[0]?.measurementDate
            ? new Date(animalWeightLogs[0].measurementDate)
            : null;
          const latestPoopAt = animalPoopLogs[0]?.loggedAt ?? null;

          const animalStatus = computeSmartStatus({
            tasks: animalTasks,
            latestFeedingAt,
            latestWeightAt,
            latestPoopAt,
            streakDays: animalStreak,
          });

          return [animal.id, animalStatus.level] as const;
        })
      );

      if (cancelled) return;
      setAnimalStatusById(Object.fromEntries(statusEntries));
    }

    loadAnimalStatuses().catch(() => {
      if (!cancelled) setAnimalStatusById({});
    });

    return () => {
      cancelled = true;
    };
  }, [animals, tasks]);

  const handleCompleteTask = useCallback((task: CareTaskWithLogs) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
        careTaskService.completeTask(task.id).catch(console.error);
      }
      return next;
    });
  }, []);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) ?? null;
  const speciesId = (selectedAnimal as any)?.enclosures?.animalId as string | undefined;
  const animalProfile: AnimalProfile | null = speciesId ? (getAnimalById(speciesId) ?? null) : null;
  const age = formatAge(selectedAnimal?.birthday);
  const weight = formatWeight(weightLogs);

  const weightTrend = getWeightTrend(weightLogs);
  const shedStatus = getShedStatus(shedLogs);
  const animalTasks = tasks.filter((t) =>
    t.enclosureAnimalId === selectedAnimalId ||
    (selectedEnclosureId && t.enclosureId === selectedEnclosureId)
  );
  const enclosureTasks = selectedEnclosureId ? tasks.filter((t) => t.enclosureId === selectedEnclosureId) : animalTasks;
  const lastFed = getLastFed(animalTasks, feedingLogs);
  const lastWaterChange = getLastWaterChange(enclosureTasks);
  const latestTempLog = tempLogs.length > 0 ? tempLogs[0] : null;
  const latestHumidityLog = humidityLogs.length > 0 ? humidityLogs[0] : null;
  const latestUvbLog = uvbLogs.length > 0 ? uvbLogs[0] : null;

  const latestFeedingCompletion = animalTasks
    .filter((t) => t.type === 'feeding' && t.lastCompleted)
    .map((t) => t.lastCompleted)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const latestWeightDate = weightLogs[0]?.measurementDate ? new Date(weightLogs[0].measurementDate) : null;
  const latestPoopDate = poopLogs[0]?.loggedAt || null;

  const smartStatus = computeSmartStatus({
    tasks: animalTasks,
    latestFeedingAt: latestFeedingCompletion ? new Date(latestFeedingCompletion) : null,
    latestWeightAt: latestWeightDate,
    latestPoopAt: latestPoopDate,
    streakDays: consistencyStreak,
  });
  const healthStatus = smartStatus.level;
  const healthScore = smartStatus.score;
  const healthReasons = smartStatus.reasons;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-28">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!selectedAnimal) {
    return (
      <div className="min-h-screen bg-surface">
        <EmptyState onAdd={() => navigate('/care-calendar/enclosures/add')} />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greetingName = displayName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-surface pb-28">
      <div className="space-y-4 pt-3">
        <div className="px-4 pt-1 pb-0">
          <h1 className="text-xl font-bold text-white">{greeting}, <span className="text-accent">{greetingName}</span> 👋</h1>
        </div>
        <TodayCarePlan
          tasks={animalTasks}
          completedIds={completedIds}
          onComplete={handleCompleteTask}
          onOpenTask={(task) => navigate(`/care-calendar/tasks/edit/${task.id}?returnTo=${encodeURIComponent('/')}`)}
        />
        <ActivePetCard
          animal={selectedAnimal}
          age={age}
          weight={weight}
          weightTrend={weightTrend}
          lastFed={lastFed}
          consistencyStreak={consistencyStreak}
          healthStatus={healthStatus}
          healthScore={healthScore}
          healthReasons={healthReasons}
          shedLogs={shedLogs}
          shedStatus={shedStatus}
          poopLogs={poopLogs}
          onTap={() => navigate(`/my-animals/${selectedAnimal.id}`)}
        />

        <div>
          <div className="px-4 mb-2 flex items-center justify-between">
            <p className="text-base font-semibold text-white">All Pets</p>
            <p className="text-xs text-muted">Swipe to see more</p>
          </div>
          <AnimalPills animals={animals} selectedId={selectedAnimalId} onSelect={setSelectedAnimalId} statusByAnimalId={animalStatusById} />
        </div>

        {selectedEnclosureId && enclosures.length > 0 ? (
          <EnclosureOverviewSection
            enclosures={enclosures}
            selectedId={selectedEnclosureId}
            onSelect={(enclosureId) => {
              setSelectedEnclosureId(enclosureId);
              const firstAnimal = animals.find((a) => a.enclosureId === enclosureId);
              if (firstAnimal) setSelectedAnimalId(firstAnimal.id);
            }}
            getAnimalCountForEnclosure={(enclosureId) =>
              animals.filter((a) => a.enclosureId === enclosureId).length
            }
            navigate={navigate}
            animalProfile={animalProfile}
            lastWaterChange={lastWaterChange}
            latestTempLog={latestTempLog}
            latestHumidityLog={latestHumidityLog}
            latestUvbLog={latestUvbLog}
          />
        ) : null}
      </div>
    </div>
  );
}
