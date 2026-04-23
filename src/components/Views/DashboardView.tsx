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
  Scale,
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
  Circle,
  TrendingUp,
  Plus,
  Turtle,
  Heart,
  Flame,
  Thermometer,
  Droplets,
  Sun,
  FileText,
  RefreshCw,
  Home,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import { careTaskService } from '../../services/careTaskService';
import { weightTrackingService } from '../../services/weightTrackingService';
import { shedLogService } from '../../services/shedLogService';
import { poopLogService, type PoopLog } from '../../services/poopLogService';
import { tempLogService, type TempLog } from '../../services/tempLogService';
import { humidityLogService, type HumidityLog } from '../../services/humidityLogService';
import { uvbLogService, type UvbLog } from '../../services/uvbLogService';
import { feedingLogService, type FeedingLog } from '../../services/feedingLogService';
import type { Enclosure, EnclosureAnimal, CareTaskWithLogs } from '../../types/careCalendar';
import type { WeightLog } from '../../types/weightTracking';
import type { ShedLog } from '../../services/shedLogService';
import { getAnimalById } from '../../data/animals';
import type { AnimalProfile } from '../../engine/types';

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

function isRecent(dateValue: Date | string, maxAgeDays: number): boolean {
  const diff = Math.floor((Date.now() - new Date(dateValue).getTime()) / 86_400_000);
  return diff <= maxAgeDays;
}

// sub-components
interface EnvironmentSnapshotProps {
  enclosureName?: string;
  animalProfile: AnimalProfile | null;
  lastWaterChange: string;
  latestTempLog: TempLog | null;
  latestHumidityLog: HumidityLog | null;
  latestUvbLog: UvbLog | null;
}

function EnvironmentSnapshot({
  enclosureName,
  animalProfile,
  lastWaterChange,
  latestTempLog,
  latestHumidityLog,
  latestUvbLog,
}: EnvironmentSnapshotProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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
    <div className="mx-4 bg-card border border-divider rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-orange-100" />
          <h3 className="textmed font-bold text-white">{enclosureName ? `${enclosureName} Environment` : 'Environment Snapshot'}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted">Updated {timeStr}</span>
          <RefreshCw className="w-3 h-3 text-muted" />
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-divider border-t border-divider">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center gap-1 p-3">
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
  );
}

function EnclosureCarousel({
  enclosures,
  selectedId,
  onSelect,
  getAnimalCountForEnclosure,
  navigate,
}: {
  enclosures: Enclosure[];
  selectedId: string;
  onSelect: (id: string) => void;
  getAnimalCountForEnclosure: (id: string) => number;
  navigate: (path: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Center the selected enclosure
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

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Enclosures</h2>
        </div>
        <p className="text-xs text-muted">Swipe to see more</p>
      </div>

      <div>
        {/* Carousel */}
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
                className={`flex-shrink-0 w-44 rounded-2xl border-2 overflow-hidden transition-all snap-center ${
                  isSelected
                    ? 'border-accent shadow-lg shadow-accent/30'
                    : 'border-divider hover:border-accent/50'
                }`}
              >
                {/* Photo */}
                <div className="w-full h-20 bg-card-elevated overflow-hidden relative flex items-center justify-center">
                  {enc.photoUrl ? (
                    <img src={enc.photoUrl} alt={enc.name} className="w-full h-full object-cover" />
                  ) : (
                    <Home className="w-8 h-8 text-muted" />
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-card p-3 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{enc.name}</p>
                      <p className="text-xs text-muted mt-0.5">{enc.animalName}</p>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/care-calendar/enclosures/edit/${enc.id}`);
                      }}
                      className="flex-shrink-0 w-7 h-7 rounded-full hover:bg-accent/20 flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit enclosure"
                    >
                      <Pencil className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <Turtle className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-medium text-muted">{animalCount} animal{animalCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
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

function AnimalPills({ animals, selectedId, onSelect }: { animals: EnclosureAnimal[]; selectedId: string; onSelect: (id: string) => void }) {
  if (animals.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
      {animals.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`flex-shrink-0 w-[86px] rounded-2xl border p-2 transition-colors ${a.id === selectedId ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-divider bg-card'}`}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl overflow-hidden border border-divider bg-card-elevated flex items-center justify-center">
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

interface AnimalHeroCardProps {
  animal: EnclosureAnimal;
  age: string;
  weight: string;
  lastFed: string;
  careStreak: number;
  healthStatus: 'on-track' | 'needs-check';
  healthStatusReason: string;
  onTap: () => void;
}

function AnimalHeroCard({ animal, age, weight, lastFed, careStreak, healthStatus, healthStatusReason, onTap }: AnimalHeroCardProps) {
  const displayName = animal.name || `Animal #${animal.animalNumber ?? 1}`;
  const gender = animal.gender?.toLowerCase();
  const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : null;
  const genderColor = gender === 'male' ? 'text-blue-400' : gender === 'female' ? 'text-pink-400' : 'text-muted';
  const statusIcon = healthStatus === 'on-track' 
    ? <CheckCircle2 className="w-5 h-5 text-accent" />
    : <AlertCircle className="w-5 h-5 text-amber-400" />;

  const stats = [
    { icon: <Calendar className="w-3.5 h-3.5 text-muted" />, label: 'Age', value: age },
    { icon: <Scale className="w-3.5 h-3.5 text-muted" />, label: 'Weight', value: weight },
    { icon: <Utensils className="w-3.5 h-3.5 text-muted" />, label: 'Last Meal', value: lastFed },
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
          <div className="mb-2 min-h-6">
            {statusIcon}
          </div>
          {healthStatus === 'needs-check' ? (
            <p className="text-[11px] text-amber-200/90 truncate" title={healthStatusReason}>{healthStatusReason}</p>
          ) : (
            <p className="text-[11px] text-amber-200/90 truncate invisible">placeholder</p>
          )}
        </div>

        <div className="flex-shrink-0 self-start rounded-xl border border-orange-500/25 px-2.5 py-2 text-center min-w-[74px]">
          <div className="flex items-center justify-center gap-1 text-orange-300">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Streak</span>
          </div>
          <p className="mt-0.5 text-lg font-bold text-white leading-none">{careStreak}</p>
          <p className="text-[10px] text-muted">day{careStreak === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-divider border-t border-divider">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2.5">
            {s.icon}
            <div className="min-w-0">
              <p className="text-[10px] text-muted leading-tight">{s.label}</p>
              <p className="text-xs font-bold text-white leading-tight truncate">{s.value}</p>
            </div>
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

interface HealthWellnessProps {
  weight: string;
  weightTrend: string;
  shedLogs: ShedLog[];
  shedStatus: string;
  lastFed: string;
  poopLogs: PoopLog[];
  onViewAll: () => void;
}

function HealthWellness({ weight, weightTrend, shedLogs, shedStatus, lastFed, poopLogs, onViewAll }: HealthWellnessProps) {
  const trendColor = weightTrend === 'Gaining' ? 'text-accent' : weightTrend === 'Losing' ? 'text-red-400' : weightTrend === 'Stable' ? 'text-blue-400' : 'text-muted';
  const shedColor = shedStatus === 'On Track' ? 'text-accent' : shedStatus === 'Overdue' ? 'text-red-400' : shedStatus === 'Due Soon' ? 'text-amber-400' : 'text-muted';
  const shedDaysAgo = shedLogs.length > 0
    ? Math.floor((Date.now() - new Date(shedLogs[0].shedDate).getTime()) / 86_400_000)
    : null;
  const shedSub = shedDaysAgo !== null
    ? (shedDaysAgo === 0 ? 'Today' : shedDaysAgo === 1 ? '1 day ago' : `${shedDaysAgo} days ago`)
    : 'No data';
  const latestPoop = poopLogs.length > 0 ? poopLogs[0] : null;
  const poopValue = latestPoop ? getDaysAgoLabel(latestPoop.loggedAt) : '\u2014';
  const poopSub = latestPoop?.consistency ? latestPoop.consistency : (latestPoop ? 'Logged' : 'Log it');

  const tiles: { icon: React.ReactNode; label: string; value: string; sub: string; valueClass: string; subClass: string }[] = [
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      label: 'Weight Trend',
      value: weight,
      sub: weightTrend !== '\u2014' ? weightTrend : 'No data',
      valueClass: weight !== '\u2014' ? 'text-white' : 'text-muted',
      subClass: trendColor,
    },
    {
      icon: <Utensils className="w-5 h-5 text-green-400" />,
      label: 'Appetite',
      value: lastFed,
      sub: lastFed !== '\u2014' ? 'Last fed' : 'No data',
      valueClass: lastFed !== '\u2014' ? 'text-white' : 'text-muted',
      subClass: 'text-muted',
    },
    {
      icon: <Scissors className="w-5 h-5 text-purple-400" />,
      label: 'Shed Tracker',
      value: shedStatus !== '\u2014' ? shedStatus : '\u2014',
      sub: shedSub,
      valueClass: shedStatus !== '\u2014' ? shedColor : 'text-muted',
      subClass: 'text-muted',
    },
    {
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      label: 'Poop Log',
      value: poopValue,
      sub: poopSub,
      valueClass: latestPoop ? 'text-white' : 'text-muted',
      subClass: 'text-muted',
    },
  ];

  return (
    <div className="mx-4 bg-card border border-divider rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-red-400" />
          <h3 className="text-med font-bold text-white">Health &amp; Wellness</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onViewAll} className="flex items-center gap-0.5 text-xs text-accent font-medium">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-divider border-t border-divider">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center gap-1 p-3">
            <div className="flex items-center justify-center mb-0.5">{tile.icon}</div>
            <span className={`text-xs font-bold leading-tight text-center ${tile.valueClass}`}>{tile.value}</span>
            <span className={`text-[10px] leading-tight text-center ${tile.subClass}`}>{tile.sub}</span>
            <span className="text-[9px] text-muted text-center leading-tight mt-0.5">{tile.label}</span>
          </div>
        ))}
      </div>
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
  const [careStreak, setCareStreak] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  // Calculate care streak for selected animal
  useEffect(() => {
    if (!selectedAnimalId) {
      setCareStreak(0);
      return;
    }

    const animalTasksForStreak = tasks.filter((t) =>
      t.enclosureAnimalId === selectedAnimalId ||
      (selectedEnclosureId && t.enclosureId === selectedEnclosureId)
    );

    const animalCareStreak = animalTasksForStreak.length > 0
      ? Math.max(...animalTasksForStreak.map(t => {
          const completedDates = t.logs
            .filter(l => !l.skipped)
            .map(l => {
              const date = new Date(l.completedAt);
              date.setHours(0, 0, 0, 0);
              return date;
            })
            .sort((a, b) => b.getTime() - a.getTime())
            .filter((date, index, arr) => index === 0 || date.getTime() !== arr[index - 1].getTime());

          if (completedDates.length === 0) return 0;

          const intervalDays = t.frequency === 'daily' ? 1 : t.frequency === 'every-other-day' ? 2 : 1;
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
        }), 0)
      : 0;
    setCareStreak(animalCareStreak);
  }, [selectedAnimalId, selectedEnclosureId, tasks]);

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
  const selectedEnclosure = enclosures.find((e) => e.id === selectedEnclosureId) ?? null;
  const animalsInSelectedEnclosure = selectedEnclosureId
    ? animals.filter((a) => a.enclosureId === selectedEnclosureId)
    : [];
  const selectorAnimals = animalsInSelectedEnclosure.length > 0 ? animalsInSelectedEnclosure : animals;
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
  const logFreshnessDays = 14;
  const healthCheckReasons: string[] = [];

  if (!latestFeedingCompletion) {
    healthCheckReasons.push('Missing feeding log');
  } else if (!isRecent(latestFeedingCompletion, logFreshnessDays)) {
    healthCheckReasons.push(`Feeding log is older than ${logFreshnessDays} days`);
  }

  if (!latestWeightDate) {
    healthCheckReasons.push('Missing weight log');
  } else if (!isRecent(latestWeightDate, logFreshnessDays)) {
    healthCheckReasons.push(`Weight log is older than ${logFreshnessDays} days`);
  }

  if (!latestPoopDate) {
    healthCheckReasons.push('Missing poop log');
  } else if (!isRecent(latestPoopDate, logFreshnessDays)) {
    healthCheckReasons.push(`Poop log is older than ${logFreshnessDays} days`);
  }

  const healthStatus: 'on-track' | 'needs-check' = healthCheckReasons.length === 0 ? 'on-track' : 'needs-check';
  const healthStatusReason = healthStatus === 'on-track' ? `All core logs are recent (${logFreshnessDays}d)` : healthCheckReasons.join(' • ');

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

  return (
    <div className="min-h-screen bg-surface pb-28">

      <div className="space-y-3 pt-2">
        {selectedEnclosureId && enclosures.length > 0 ? (
          <EnclosureCarousel
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
          />
        ) : null}

        <div>
          <div className="px-4 mb-2 flex items-center justify-between">
            <p className="text-base font-semibold text-white">Pets in this Enclosure</p>
            <p className="text-xs text-muted">Swipe to see more</p>
          </div>
          <AnimalPills animals={selectorAnimals} selectedId={selectedAnimalId} onSelect={setSelectedAnimalId} />
        </div>
      </div>

      <div className="space-y-4 pt-3">
        <AnimalHeroCard animal={selectedAnimal} age={age} weight={weight} lastFed={lastFed} careStreak={careStreak} healthStatus={healthStatus} healthStatusReason={healthStatusReason} onTap={() => navigate(`/my-animals/${selectedAnimal.id}`)} />
        <TodayCarePlan
          tasks={animalTasks}
          completedIds={completedIds}
          onComplete={handleCompleteTask}
          onOpenTask={(task) => navigate(`/care-calendar/tasks/edit/${task.id}?returnTo=${encodeURIComponent('/')}`)}
        />
        <HealthWellness
          weight={weight}
          weightTrend={weightTrend}
          shedLogs={shedLogs}
          shedStatus={shedStatus}
          lastFed={lastFed}
          poopLogs={poopLogs}
          onViewAll={() => navigate(`/my-animals/${selectedAnimal.id}`)}
        />
        <EnvironmentSnapshot
          enclosureName={selectedEnclosure?.name}
          animalProfile={animalProfile}
          lastWaterChange={lastWaterChange}
          latestTempLog={latestTempLog}
          latestHumidityLog={latestHumidityLog}
          latestUvbLog={latestUvbLog}
        />
      </div>

    </div>
  );
}
