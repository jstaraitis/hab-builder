/**
 * DashboardView — Main home screen for authenticated users.
 * Redesigned to match new app aesthetic: dark card-based layout with
 * animal hero, today's care plan, health snapshot, beginner reminder, care confidence.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Scale,
  Scissors,
  Utensils,
  ChevronRight,
  CheckCircle2,
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
import { careAnalyticsService } from '../../services/careAnalyticsService';
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

function taskTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    feeding: '🍽️',
    misting: '💧',
    'water-change': '🚰',
    'spot-clean': '🧹',
    'deep-clean': '🦽',
    'health-check': '🩺',
    supplement: '💊',
    maintenance: '🔧',
    'gut-load': '🥗',
    custom: '📋',
  };
  return map[type] ?? '📋';
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

function getLastFed(tasks: CareTaskWithLogs[]): string {
  const feedingTasks = tasks.filter((t) => t.type === 'feeding' && t.lastCompleted);
  if (!feedingTasks.length) return '—';
  const sorted = [...feedingTasks].sort((a, b) => new Date(b.lastCompleted!).getTime() - new Date(a.lastCompleted!).getTime());
  const diff = Math.floor((Date.now() - new Date(sorted[0].lastCompleted!).getTime()) / 86_400_000);
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
          <Thermometer className="w-4 h-4 text-muted" />
          <h3 className="text-sm font-semibold text-white">{enclosureName ? `${enclosureName} Environment` : 'Environment Snapshot'}</h3>
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

function EnclosurePills({
  enclosures,
  selectedId,
  onSelect,
}: {
  enclosures: Enclosure[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (enclosures.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-4">
      {enclosures.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${e.id === selectedId ? 'bg-accent text-on-accent' : 'bg-card text-muted border border-divider'}`}
        >
          {e.name}
        </button>
      ))}
    </div>
  );
}

function EnclosureSection({
  enclosure,
  animalCount,
  onOpen,
}: {
  enclosure: Enclosure;
  animalCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-4 w-[calc(100%-2rem)] bg-card border border-divider rounded-2xl overflow-hidden p-4 text-left"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Selected Enclosure</p>
          <p className="text-sm font-semibold text-white">{enclosure.name}</p>
          <p className="text-xs text-muted mt-0.5">{enclosure.animalName} • {animalCount} animal{animalCount === 1 ? '' : 's'}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Turtle className="w-5 h-5 text-accent" />
        </div>
      </div>
    </button>
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
  if (animals.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-4">
      {animals.map((a) => (
        <button key={a.id} onClick={() => onSelect(a.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${a.id === selectedId ? 'bg-accent text-on-accent' : 'bg-card text-muted border border-divider'}`}>
          {a.name || `#${a.animalNumber ?? 1}`}
        </button>
      ))}
    </div>
  );
}

interface AnimalHeroCardProps {
  animal: EnclosureAnimal;
  speciesName?: string;
  age: string;
  weight: string;
  lastFed: string;
  onTap: () => void;
}

function AnimalHeroCard({ animal, speciesName, age, weight, lastFed, onTap }: AnimalHeroCardProps) {
  const displayName = animal.name || `Animal #${animal.animalNumber ?? 1}`;
  const gender = animal.gender?.toLowerCase();
  const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : null;
  const genderColor = gender === 'male' ? 'text-blue-400' : gender === 'female' ? 'text-pink-400' : 'text-muted';

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
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-lg font-bold text-white truncate">{displayName}</span>
            {genderIcon && <span className={`text-sm font-bold flex-shrink-0 ${genderColor}`}>{genderIcon}</span>}
            <Heart className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          </div>
          {speciesName && <p className="text-xs text-muted mb-2 truncate">{speciesName}</p>}
          <span className="inline-block text-xs font-semibold text-accent bg-accent/15 px-2.5 py-0.5 rounded-full">Healthy</span>
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
}

function TodayCarePlan({ tasks, completedIds, onComplete }: TodayCarePlanProps) {
  const dueToday = tasks.filter(isTaskDueToday).slice(0, 6);
  const doneCount = dueToday.filter((t) => completedIds.has(t.id)).length;
  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden mx-4">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-white">Today's Care Plan</h3>
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
            return (
              <li key={task.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${done ? 'bg-accent/5' : ''}`}>
                <button onClick={() => onComplete(task)} className={`flex-shrink-0 transition-colors ${done ? 'text-accent' : 'text-muted'}`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{taskTypeEmoji(task.type)}</span>
                    <span className={`text-sm font-semibold truncate ${done ? 'line-through text-muted' : 'text-white'}`}>{task.title}</span>
                  </div>
                  {(task.description || task.notes) && (
                    <p className="text-xs text-muted mt-0.5 truncate">{task.description || task.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {timeStr && <span className="text-xs text-muted">{timeStr}</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-muted" />
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
          <h3 className="text-sm font-semibold text-white">Health &amp; Wellness</h3>
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

interface CareStreakProps {
  streak: number;
  tasksCompleted: number;
}

function CareStreak({ streak, tasksCompleted }: CareStreakProps) {
  return (
    <div className="mx-4 bg-card border border-divider rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-white">Care Streak</p>
          </div>
          <p className="text-xs text-muted">
            {streak > 0 ? "You're doing great!" : 'Complete a task to start your streak!'}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center ml-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-1">
            <span className="text-xl font-bold text-on-accent">{streak}</span>
          </div>
          <span className="text-[10px] text-muted text-center leading-tight">day streak</span>
          {tasksCompleted > 0 && (
            <span className="text-[10px] text-muted text-center leading-tight">{tasksCompleted} tasks done</span>
          )}
        </div>
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
    careAnalyticsService.getAnalytics(user.id)
      .then((a) => setCareStreak(a.currentStreak))
      .catch(() => setCareStreak(0));
  }, [user]);

  useEffect(() => {
    if (!selectedAnimalId) return;
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
    ]).then(async ([weights, sheds, poops, temps, humidity, uvb]) => {
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
    });
  }, [selectedAnimalId, selectedEnclosureId]);

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
  const speciesName = (selectedAnimal as any)?.enclosures?.animalName as string | undefined;
  const speciesId = (selectedAnimal as any)?.enclosures?.animalId as string | undefined;
  const animalProfile: AnimalProfile | null = speciesId ? (getAnimalById(speciesId) ?? null) : null;
  const age = formatAge(selectedAnimal?.birthday);
  const weight = formatWeight(weightLogs);

  const weightTrend = getWeightTrend(weightLogs);
  const shedStatus = getShedStatus(shedLogs);
  const animalTasks = tasks.filter((t) =>
    t.enclosureAnimalId === selectedAnimalId ||
    (selectedEnclosureId && t.enclosureId === selectedEnclosureId && !t.enclosureAnimalId)
  );
  const enclosureTasks = selectedEnclosureId ? tasks.filter((t) => t.enclosureId === selectedEnclosureId) : animalTasks;
  const lastFed = getLastFed(animalTasks);
  const lastWaterChange = getLastWaterChange(enclosureTasks);
  const latestTempLog = tempLogs.length > 0 ? tempLogs[0] : null;
  const latestHumidityLog = humidityLogs.length > 0 ? humidityLogs[0] : null;
  const latestUvbLog = uvbLogs.length > 0 ? uvbLogs[0] : null;

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
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-end">
        <button className="w-9 h-9 rounded-full bg-card border border-divider flex items-center justify-center active:scale-95 transition-transform">
          <Bell className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="mx-4 rounded-2xl border border-divider bg-card p-3">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Enclosure</p>
            {selectedEnclosureId ? (
              <EnclosurePills
                enclosures={enclosures}
                selectedId={selectedEnclosureId}
                onSelect={(enclosureId) => {
                  setSelectedEnclosureId(enclosureId);
                  const firstAnimal = animals.find((a) => a.enclosureId === enclosureId);
                  if (firstAnimal) setSelectedAnimalId(firstAnimal.id);
                }}
              />
            ) : (
              <p className="text-xs text-muted">No enclosure selected</p>
            )}
            {selectedEnclosureId && enclosures.length < 2 && selectedEnclosure && (
              <div className="inline-flex rounded-full border border-divider bg-card-elevated px-3 py-1.5 text-xs font-medium text-white">
                {selectedEnclosure.name}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {selectedEnclosure ? `Animals in ${selectedEnclosure.name}` : 'Animals'}
            </p>
            <AnimalPills animals={selectorAnimals} selectedId={selectedAnimalId} onSelect={setSelectedAnimalId} />
            {selectorAnimals.length < 2 && selectedAnimal && (
              <div className="inline-flex rounded-full border border-divider bg-card-elevated px-3 py-1.5 text-xs font-medium text-white">
                {selectedAnimal.name || `#${selectedAnimal.animalNumber ?? 1}`}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-3">
        {selectedEnclosure && (
          <EnclosureSection
            enclosure={selectedEnclosure}
            animalCount={animalsInSelectedEnclosure.length}
            onOpen={() => navigate(`/care-calendar/enclosures/${selectedEnclosure.id}/environment`)}
          />
        )}
        <AnimalHeroCard animal={selectedAnimal} speciesName={speciesName} age={age} weight={weight} lastFed={lastFed} onTap={() => navigate(`/my-animals/${selectedAnimal.id}`)} />
        <TodayCarePlan tasks={animalTasks} completedIds={completedIds} onComplete={handleCompleteTask} />
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
        <CareStreak streak={careStreak} tasksCompleted={completedIds.size} />
      </div>

    </div>
  );
}
