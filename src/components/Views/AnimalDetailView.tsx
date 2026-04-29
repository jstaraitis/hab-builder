/**
 * AnimalDetailView Component
 * 
 * Comprehensive view of a single animal showing all related data:
 * - Basic info (name, species, age, morph, gender)
 * - Enclosure details
 * - Weight tracking history with chart
 * - Feeding logs with analytics
 * - Related care tasks
 * - Health notes
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, 
  ClipboardList,
  Calendar, 
  Scale, 
  MapPin, 
  Pencil, 
  UtensilsCrossed, 
  CheckCircle, 
  Clock,
  TrendingUp,
  AlertCircle,
  Activity,
  Heart,
  Ruler,
  Stethoscope,
  Moon,
  Info,
  Plus,
  X,
  Turtle,
  Trash2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import { careTaskService } from '../../services/careTaskService';
import { weightTrackingService } from '../../services/weightTrackingService';
import { lengthLogService, type LengthLog } from '../../services/lengthLogService';
import { vetRecordService, type VetRecord } from '../../services/vetRecordService';
import { poopLogService, type PoopLog } from '../../services/poopLogService';
import { feedingLogService, type FeedingLog } from '../../services/feedingLogService';
import type { EnclosureAnimal, Enclosure, CareTaskWithLogs } from '../../types/careCalendar';
import type { WeightLog } from '../../types/weightTracking';
import { WeightChart } from '../WeightTracking/WeightChart';
import { WeightLogForm } from '../WeightTracking/WeightLogForm';
import { ShedLogForm } from '../HealthTracking/ShedLogForm';
import { ShedLogList } from '../HealthTracking/ShedLogList';
import { BrumationTracker } from '../HealthTracking/BrumationTracker';
import { VetRecordForm } from '../HealthTracking/VetRecordForm';
import { VetRecordList } from '../HealthTracking/VetRecordList';
import { LengthLogForm } from '../LengthTracking/LengthLogForm';
import { TaskEditModal } from '../CareCalendar/TaskEditModal';
import { FeedingLogModal } from '../CareCalendar/FeedingLogModal';
import { AnimalGallery } from '../AnimalGallery/AnimalGallery';
import { formatCareTaskFrequency } from '../../utils/careTaskFrequencyLabel';

// Helper function to calculate age
function calculateAge(birthday: Date): string {
  const now = new Date();
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 
                 + (now.getMonth() - birthday.getMonth());
  
  if (months < 1) return 'Less than 1 month';
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${remainingMonths}m`;
}

function convertLengthToInches(value: number, unit: LengthLog['unit']): number {
  switch (unit) {
    case 'inches':
      return value;
    case 'cm':
      return value / 2.54;
    case 'feet':
      return value * 12;
    case 'meters':
      return value * 39.37;
    default:
      return value;
  }
}

function convertInchesToLength(value: number, unit: LengthLog['unit']): number {
  switch (unit) {
    case 'inches':
      return value;
    case 'cm':
      return value * 2.54;
    case 'feet':
      return value / 12;
    case 'meters':
      return value / 39.37;
    default:
      return value;
  }
}

// Tab types
type TabType = 'overview' | 'tasks' | 'care' | 'growth' | 'health' | 'shedding' | 'brumation' | 'info';

const TABS: Array<{ id: TabType; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
  { id: 'care', label: 'Feeding', icon: UtensilsCrossed },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'health', label: 'Medical', icon: Heart },
  { id: 'shedding', label: 'Shedding', icon: Stethoscope },
  { id: 'brumation', label: 'Brumation', icon: Moon },
  { id: 'info', label: 'Info', icon: Info }
];

export function AnimalDetailView() {
  const { animalId } = useParams<{ animalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Core data state (fast load)
  const [animal, setAnimal] = useState<EnclosureAnimal | null>(null);
  const [enclosure, setEnclosure] = useState<Enclosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core data state
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [lengthLogs, setLengthLogs] = useState<LengthLog[]>([]);
  const [vetRecords, setVetRecords] = useState<VetRecord[]>([]);
  const [poopLogs, setPoopLogs] = useState<PoopLog[]>([]);
  const [directFeedingLogs, setDirectFeedingLogs] = useState<FeedingLog[]>([]);

  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Form visibility state
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showLengthForm, setShowLengthForm] = useState(false);
  const [showVetForm, setShowVetForm] = useState(false);
  const [showShedForm, setShowShedForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Feeding logs filter
  const [showAllFeedingLogs, setShowAllFeedingLogs] = useState(true);
  const [deletingWeightId, setDeletingWeightId] = useState<string | null>(null);
  const [editingWeightLog, setEditingWeightLog] = useState<WeightLog | null>(null);
  const [deletingLengthId, setDeletingLengthId] = useState<string | null>(null);
  const [editingLengthLog, setEditingLengthLog] = useState<LengthLog | null>(null);
  const [weightEntriesExpanded, setWeightEntriesExpanded] = useState(false);
  const [lengthEntriesExpanded, setLengthEntriesExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTaskWithLogs | null>(null);
  const [showPoopForm, setShowPoopForm] = useState(false);
  const [poopConsistency, setPoopConsistency] = useState<PoopLog['consistency']>('normal');
  const [poopNotes, setPoopNotes] = useState('');
  const [savingPoop, setSavingPoop] = useState(false);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showRecentFeedings, setShowRecentFeedings] = useState(false);
  const [quickOpenApplied, setQuickOpenApplied] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // Refresh handler for child components
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadAnimalData();
  };

  // Load all data on mount
  useEffect(() => {
    if (user && animalId) {
      loadAnimalData();
    }
  }, [user, animalId, refreshKey]);

  useEffect(() => {
    if (!animalId) return;
    try {
      localStorage.setItem('hb:lastAnimalId', animalId);
    } catch {
      // Ignore storage errors in constrained browser contexts.
    }
  }, [animalId]);

  useEffect(() => {
    setQuickOpenApplied(false);
  }, [location.search]);

  useEffect(() => {
    if (!animal || quickOpenApplied) return;

    const tabParam = searchParams.get('tab');
    const openParam = searchParams.get('open');

    if (tabParam === 'overview' || tabParam === 'tasks' || tabParam === 'care' || tabParam === 'growth' || tabParam === 'health' || tabParam === 'shedding' || tabParam === 'brumation' || tabParam === 'info') {
      setActiveTab(tabParam);
    }

    if (openParam === 'weight') {
      setActiveTab('growth');
      setShowLengthForm(false);
      setShowPoopForm(false);
      setShowWeightForm(true);
    }

    if (openParam === 'length') {
      setActiveTab('growth');
      setShowWeightForm(false);
      setShowPoopForm(false);
      setShowLengthForm(true);
    }

    if (openParam === 'poop') {
      setActiveTab('care');
      setShowWeightForm(false);
      setShowLengthForm(false);
      setShowPoopForm(true);
    }

    if (openParam === 'shed') {
      setActiveTab('shedding');
      setShowWeightForm(false);
      setShowLengthForm(false);
      setShowPoopForm(false);
      setShowVetForm(false);
      setShowShedForm(true);
    }

    if (openParam === 'medical') {
      setActiveTab('health');
      setShowWeightForm(false);
      setShowLengthForm(false);
      setShowPoopForm(false);
      setShowShedForm(false);
      setShowVetForm(true);
    }

    setQuickOpenApplied(true);
  }, [animal, quickOpenApplied, searchParams]);

  const loadAnimalData = async () => {
    if (!animalId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Load animal data (now includes joined enclosure data)
      const animalData = await enclosureAnimalService.getAnimalById(animalId);
      if (!animalData) {
        setError('Animal not found');
        setLoading(false);
        return;
      }
      setAnimal(animalData);

      // Load related data in parallel
      if (animalData.enclosureId) {
        const [enclosureData, allTasks, weightData, lengthData, vetData, poopData, feedingData] = await Promise.all([
          enclosureService.getEnclosureById(animalData.enclosureId),
          careTaskService.getTasksWithLogs(user.id),
          weightTrackingService.getWeightLogs(animalId),
          lengthLogService.getLogsForAnimal(animalId),
          vetRecordService.getRecordsForAnimal(animalId),
          poopLogService.getRecentLogs(animalId, 10),
          feedingLogService.getRecentLogs(animalData.enclosureId, 10),
        ]);

        setEnclosure(enclosureData);
        const enclosureTasks = allTasks.filter(task => task.enclosureId === animalData.enclosureId);
        setTasks(enclosureTasks);
        setWeightLogs(weightData);
        setLengthLogs(lengthData);
        setVetRecords(vetData);
        setPoopLogs(poopData);
        setDirectFeedingLogs(feedingData);
      } else {
        // Load tasks and weight logs even if no enclosure
        const [allTasks, weightData, lengthData, vetData, poopData, feedingData] = await Promise.all([
          careTaskService.getTasksWithLogs(user.id),
          weightTrackingService.getWeightLogs(animalId),
          lengthLogService.getLogsForAnimal(animalId),
          vetRecordService.getRecordsForAnimal(animalId),
          poopLogService.getRecentLogs(animalId, 10),
          feedingLogService.getRecentLogs(undefined, 10),
        ]);
        
        const animalTasks = allTasks.filter(task => task.enclosureAnimalId === animalData.id);
        setTasks(animalTasks);
        setWeightLogs(weightData);
        setLengthLogs(lengthData);
        setVetRecords(vetData);
        setPoopLogs(poopData);
        setDirectFeedingLogs(feedingData);
      }

    } catch (err) {
      console.error('Failed to load animal data:', err);
      setError('Failed to load animal data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWeight = async (logId: string) => {
    const confirmed = globalThis.confirm('Delete this weight entry? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingWeightId(logId);
      await weightTrackingService.deleteWeightLog(logId);
      handleRefresh();
    } catch (err) {
      console.error('Failed to delete weight log:', err);
      alert('Could not delete this weight entry. Please try again.');
    } finally {
      setDeletingWeightId(null);
    }
  };

  const handleDeleteLength = async (logId: string) => {
    const confirmed = globalThis.confirm('Delete this length entry? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingLengthId(logId);
      await lengthLogService.deleteLog(logId);
      handleRefresh();
    } catch (err) {
      console.error('Failed to delete length log:', err);
      alert('Could not delete this length entry. Please try again.');
    } finally {
      setDeletingLengthId(null);
    }
  };

  // Get recent feeding logs from tasks
  const getFeedingLogs = (animalOnly: boolean = false) => {
    const feedingLogs: any[] = [];
    
    tasks.forEach(task => {
      // Filter by animal-level only if animalOnly is true
      if (animalOnly && task.enclosureAnimalId !== animal?.id) {
        return;
      }
      
      if (task.type === 'feeding' && task.logs) {
        task.logs.forEach(log => {
          if (log.feederType) {
            feedingLogs.push({
              id: log.id,
              completedAt: log.completedAt,
              notes: log.notes,
              taskTitle: task.title,
              isEnclosureLevel: !task.enclosureAnimalId,
              feedingData: {
                feederType: log.feederType,
                quantityOffered: log.quantityOffered,
                quantityEaten: log.quantityEaten,
                supplementUsed: log.supplementUsed
              }
            });
          }
        });
      }
    });

    const sortedLogs = [...feedingLogs].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    return sortedLogs.slice(0, 10);
  };

  const handleSavePoopLog = async () => {
    if (!user || !animalId) return;

    try {
      setSavingPoop(true);
      await poopLogService.createLog(user.id, {
        enclosureAnimalId: animalId,
        consistency: poopConsistency,
        notes: poopNotes || undefined,
      });

      const updated = await poopLogService.getRecentLogs(animalId, 10);
      setPoopLogs(updated);
      setPoopNotes('');
      setPoopConsistency('normal');
      setShowPoopForm(false);
    } catch (err) {
      console.error('Failed to save poop log:', err);
      alert('Could not save poop log. Please try again.');
    } finally {
      setSavingPoop(false);
    }
  };

  const handleSaveFeedingLog = async (logData: any) => {
    if (!user || !animalId || !enclosure) return;

    try {
      await feedingLogService.createLog(user.id, {
        enclosureId: enclosure.id,
        loggedAt: new Date().toISOString(),
        feederType: logData.feederType,
        quantityOffered: logData.quantityOffered?.toString(),
        quantityEaten: logData.quantityEaten?.toString(),
        supplementUsed: logData.supplementUsed,
        refusalNoted: logData.refusalNoted,
        notes: logData.notes,
      });

      const updated = await feedingLogService.getRecentLogs(enclosure.id, 10);
      setDirectFeedingLogs(updated);
      setShowFeedingModal(false);
    } catch (err) {
      console.error('Failed to save feeding log:', err);
      alert('Could not save feeding log. Please try again.');
    }
  };

  const handleDeleteFeedingLog = async (logId: string) => {
    if (!confirm('Delete this feeding log?')) return;

    try {
      setDeletingLogId(logId);
      await feedingLogService.deleteLog(logId);
      
      if (enclosure) {
        const updated = await feedingLogService.getRecentLogs(enclosure.id, 10);
        setDirectFeedingLogs(updated);
      }
    } catch (err) {
      console.error('Failed to delete feeding log:', err);
      alert('Could not delete feeding log. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleDeletePoopLog = async (logId: string) => {
    if (!confirm('Delete this poop log?')) return;

    try {
      setDeletingLogId(logId);
      await poopLogService.deleteLog(logId);
      
      if (animalId) {
        const updated = await poopLogService.getRecentLogs(animalId, 10);
        setPoopLogs(updated);
      }
    } catch (err) {
      console.error('Failed to delete poop log:', err);
      alert('Could not delete poop log. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface px-4 pt-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted">Loading animal data...</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen bg-surface px-4 pt-4">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {error || 'Animal not found'}
          </h3>
          <Link
            to="/my-animals"
            className="text-accent hover:underline"
          >
            ← Back to My Animals
          </Link>
        </div>
      </div>
    );
  }

  const feedingLogs = getFeedingLogs(!showAllFeedingLogs);
  const unfilteredFeedingLogs = getFeedingLogs(false); // Always include all logs for overview
  const latestWeight = weightLogs.length > 0 ? weightLogs[0] : null;
  const previousWeight = weightLogs.length > 1 ? weightLogs[1] : null;
  const latestLength = lengthLogs.length > 0 ? lengthLogs[0] : null;
  const previousLength = lengthLogs.length > 1 ? lengthLogs[1] : null;
  const displaySpecies = animal.speciesName || enclosure?.animalName || 'Pet Profile';
  
  // Combine feeding logs from care tasks and direct logging for the recent feedings section
  // Only include direct logs if they match the current filter (animal-only or all in enclosure)
  const combinedFeedingLogs = [
    ...feedingLogs,
    ...(showAllFeedingLogs 
      ? directFeedingLogs  // Show all direct logs when "All in Enclosure" is selected
      : directFeedingLogs   // For "This Animal", we already filtered in getFeedingLogs, so show all direct logs
    ).map(log => ({
      id: log.id,
      completedAt: log.completedAt,
      notes: log.notes,
      taskTitle: 'Manual Feeding Log',
      isEnclosureLevel: false,
      feedingData: {
        feederType: log.feederType,
        quantityOffered: log.quantityOffered,
        quantityEaten: log.quantityEaten,
        supplementUsed: log.supplementUsed
      }
    }))
  ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  // Combine feeding logs from care tasks and direct logging for overview (unfiltered)
  const allFeedingLogs = [
    ...unfilteredFeedingLogs,
    ...directFeedingLogs.map(log => ({
      id: log.id,
      completedAt: log.completedAt,
      notes: log.notes,
      taskTitle: 'Direct Feeding Log',
      feedingData: {
        feederType: log.feederType,
        quantityOffered: log.quantityOffered,
        quantityEaten: log.quantityEaten,
        supplementUsed: log.supplementUsed
      }
    }))
  ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  const latestFeeding = allFeedingLogs.length > 0 ? allFeedingLogs[0] : null;
  const latestTaskFeedingCompletion = tasks
    .filter((task) => task.type === 'feeding' && task.lastCompleted)
    .map((task) => task.lastCompleted)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
  const latestFeedingCandidates: Array<Date | string> = [];
  if (latestTaskFeedingCompletion) {
    latestFeedingCandidates.push(latestTaskFeedingCompletion);
  }
  if (latestFeeding?.completedAt) {
    latestFeedingCandidates.push(latestFeeding.completedAt);
  }
  const latestFeedingAt = latestFeedingCandidates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
  const latestMedical = vetRecords.length > 0 ? vetRecords[0] : null;
  const ageLabel = animal.birthday ? calculateAge(new Date(animal.birthday)) : null;
  const lastFeedingDays = latestFeedingAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(latestFeedingAt).getTime()) / (1000 * 60 * 60 * 24))
      )
    : null;
  const lastFeedingLabel =
    lastFeedingDays === null
      ? 'No logs'
      : lastFeedingDays === 0
        ? 'Today'
        : lastFeedingDays === 1
          ? '1 day ago'
          : `${lastFeedingDays} days ago`;
  const lastWeightDays = latestWeight
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(latestWeight.measurementDate).getTime()) / (1000 * 60 * 60 * 24))
      )
    : null;
  const weightRatePercent =
    latestWeight && previousWeight && previousWeight.weightGrams > 0
      ? ((latestWeight.weightGrams - previousWeight.weightGrams) / previousWeight.weightGrams) * 100
      : null;
  const latestLengthInches = latestLength ? convertLengthToInches(latestLength.length, latestLength.unit) : null;
  const previousLengthInches = previousLength ? convertLengthToInches(previousLength.length, previousLength.unit) : null;
  const lengthChartUnit: LengthLog['unit'] = latestLength?.unit || 'inches';
  const lengthChartData = [...lengthLogs].reverse().map((log) => {
    const inches = convertLengthToInches(log.length, log.unit);
    const convertedLength = convertInchesToLength(inches, lengthChartUnit);

    return {
      id: log.id,
      formattedDate: new Date(log.date).toLocaleDateString(),
      lengthValue: Math.round(convertedLength * 100) / 100,
      measurementType: log.measurementType,
    };
  });
  const highestLength = lengthChartData.length > 0 ? Math.max(...lengthChartData.map((d) => d.lengthValue)) : 0;
  const lengthYAxisMax = Math.max(1, Math.ceil(highestLength * 2));
  const lengthRatePercent =
    latestLengthInches !== null && previousLengthInches !== null && previousLengthInches > 0
      ? ((latestLengthInches - previousLengthInches) / previousLengthInches) * 100
      : null;

  const reminderSummary = animal.notes || latestFeeding?.notes || 'Add care notes and reminders to keep this profile current.';

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-animals')}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-divider bg-card px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Pets
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-divider bg-card p-4 sm:p-5 mb-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-jade-500/10 via-transparent to-cyan-500/10" />

          <div className="relative flex flex-col gap-4">
            <div className="h-52 w-full overflow-hidden rounded-2xl border border-divider bg-card-elevated flex items-center justify-center text-muted sm:h-56 shrink-0">
              {animal.photoUrl ? (
                <img src={animal.photoUrl} alt="Animal" className="h-full w-full object-cover" />
              ) : (
                <Turtle className="w-14 h-14" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="mt-1 text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                {animal.name || `Animal #${animal.animalNumber || '?'}`}
              </h1>
              <p className="text-muted mt-1">{displaySpecies}</p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {animal.gender && (
                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[11px] font-semibold capitalize">
                    {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'} {animal.gender}
                  </span>
                )}
                {animal.morph && (
                  <span className="px-2.5 py-1 bg-orange-500/20 text-orange-300 rounded-full text-[11px] font-semibold">
                    {animal.morph}
                  </span>
                )}
                {ageLabel && (
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {ageLabel} old
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative mt-4 space-y-2">
            <button
              onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
              className="inline-flex w-auto self-start px-3 py-1.5 bg-card-elevated border border-divider text-white rounded-lg text-sm font-semibold items-center justify-center gap-1.5 hover:border-jade-500/50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 rounded-xl border border-divider bg-card p-1">
          <div className="flex overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
                  ${isActive 
                    ? 'bg-accent/20 text-accent' 
                    : 'text-muted hover:text-white hover:bg-card-elevated'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card border border-divider rounded-xl p-4">
                <p className="text-xs text-muted">Active Tasks</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{tasks.length}</p>
                <p className="text-xs sm:text-sm text-muted mt-1">Across care reminders</p>
              </div>

              <div className="bg-card border border-divider rounded-xl p-4">
                <p className="text-xs text-muted">Last Feeding</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {lastFeedingLabel}
                </p>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  {latestFeedingAt
                    ? lastFeedingDays === 0
                      ? new Date(latestFeedingAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                      : new Date(latestFeedingAt).toLocaleDateString()
                    : 'Log feedings in Care'}
                </p>
              </div>

              <div className="bg-card border border-divider rounded-xl p-4">
                <p className="text-xs text-muted">Weight</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{latestWeight ? `${latestWeight.weightGrams} g` : 'No data'}</p>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  {lastWeightDays !== null ? `Updated ${lastWeightDays} day${lastWeightDays === 1 ? '' : 's'} ago` : 'No entries yet'}
                </p>
              </div>

              <div className="bg-card border border-divider rounded-xl p-4">
                <p className="text-xs text-muted">Length</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {latestLength ? `${latestLength.length} ${latestLength.unit}` : 'No data'}
                </p>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  {latestLength ? `Updated ${new Date(latestLength.date).toLocaleDateString()}` : 'No entries yet'}
                </p>
              </div>

              <div className="bg-card border border-divider rounded-xl p-4">
                <p className="text-xs text-muted">Medical</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {vetRecords.length > 0 ? `${vetRecords.length} record${vetRecords.length === 1 ? '' : 's'}` : 'No records'}
                </p>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  {latestMedical ? `Last visit ${new Date(latestMedical.visitDate).toLocaleDateString()}` : 'No vet visits yet'}
                </p>
              </div>

              <div className="bg-card border border-divider rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-lg font-semibold text-white">Note</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted line-clamp-3">{reminderSummary}</p>
                <p className="text-[11px] sm:text-xs text-muted mt-1">
                  {latestFeedingAt ? `Updated ${new Date(latestFeedingAt).toLocaleDateString()}` : 'Add notes to keep this section updated'}
                </p>
              </div>
            </div>

            <div className="bg-card border border-divider rounded-2xl p-4">
              <AnimalGallery
                animal={animal}
                onUpdate={async (images) => {
                  await enclosureAnimalService.updateAnimal(animal.id, { images });
                  await loadAnimalData();
                }}
              />
            </div>
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === 'growth' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weight Tracking */}
              <div className="bg-card border border-divider rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    Weight Tracking
                  </h2>
                  <button
                    onClick={() => {
                      setEditingWeightLog(null);
                      setShowWeightForm(!showWeightForm);
                    }}
                    className="p-1.5 bg-accent text-on-accent rounded-lg hover:bg-accent-dim dark:bg-accent dark:hover:bg-accent-dim transition-colors"
                    title={showWeightForm ? 'Cancel' : 'Add Weight'}
                  >
                    {showWeightForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-3 rounded-lg border border-divider bg-surface px-2.5 py-2">
                  <p className="text-xs text-muted">Weight % Rate</p>
                  {weightRatePercent === null ? (
                    <p className="text-xs text-muted">Add at least 2 weight entries to calculate rate</p>
                  ) : (
                    <p className={`text-xs font-semibold ${weightRatePercent >= 0 ? 'text-jade-300' : 'text-amber-300'}`}>
                      {weightRatePercent >= 0 ? '+' : ''}{weightRatePercent.toFixed(1)}% vs last entry
                    </p>
                  )}
                </div>

                {showWeightForm && (
                  <WeightLogForm
                    animal={animal}
                    onSuccess={() => {
                      setShowWeightForm(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowWeightForm(false)}
                  />
                )}

                {!showWeightForm && weightLogs.length > 0 && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-divider bg-surface p-2.5">
                      <WeightChart enclosureAnimalId={animal.id} key={refreshKey} />
                    </div>

                    <div className="border border-divider rounded-lg p-2.5">
                      <button
                        type="button"
                        onClick={() => setWeightEntriesExpanded(!weightEntriesExpanded)}
                        className="w-full flex items-center justify-between"
                      >
                        <h3 className="text-xs font-semibold text-white">Recent Entries</h3>
                        {weightEntriesExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted" />
                        )}
                      </button>

                      {weightEntriesExpanded && (
                        <div className="space-y-1.5 mt-2">
                          {weightLogs.slice(0, 5).map((log) => (
                            editingWeightLog?.id === log.id ? (
                              <div key={log.id} className="bg-card border border-divider rounded-lg p-2.5">
                                <WeightLogForm
                                  animal={animal}
                                  initialData={{
                                    id: log.id,
                                    weightGrams: log.weightGrams,
                                    measurementDate: log.measurementDate,
                                    notes: log.notes,
                                  }}
                                  onSuccess={() => {
                                    setEditingWeightLog(null);
                                    handleRefresh();
                                  }}
                                  onCancel={() => setEditingWeightLog(null)}
                                />
                              </div>
                            ) : (
                              <div
                                key={log.id}
                                className="flex items-center justify-between gap-2 bg-surface border border-divider rounded-lg px-2.5 py-1.5"
                              >
                                <div>
                                  <p className="text-xs font-medium text-white">{log.weightGrams} g</p>
                                  <p className="text-xs text-muted">{log.measurementDate.toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setShowWeightForm(false);
                                      setWeightEntriesExpanded(true);
                                      setEditingWeightLog(log);
                                    }}
                                    className="px-2 py-1 rounded-md border border-divider bg-card text-white hover:bg-card-elevated"
                                    title="Edit weight entry"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWeight(log.id)}
                                    disabled={deletingWeightId === log.id}
                                    className="px-2 py-1 rounded-md border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete weight entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!showWeightForm && weightLogs.length === 0 && (
                  <div className="text-center py-6">
                    <Scale className="w-9 h-9 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted">No weight data yet</p>
                  </div>
                )}
              </div>

              {/* Length Tracking */}
              <div className="bg-card border border-divider rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" />
                    Length Tracking
                  </h2>
                  <button
                    onClick={() => setShowLengthForm(!showLengthForm)}
                    className="p-1.5 bg-accent text-on-accent rounded-lg hover:bg-accent-dim dark:bg-accent dark:hover:bg-accent-dim transition-colors"
                    title={showLengthForm ? 'Cancel' : 'Add Length'}
                  >
                    {showLengthForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {showLengthForm ? (
                  <LengthLogForm
                    animal={animal}
                    onSuccess={() => {
                      setShowLengthForm(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowLengthForm(false)}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="mb-3 rounded-lg border border-divider bg-surface px-2.5 py-2">
                      <p className="text-xs text-muted">Length % Rate</p>
                      {lengthRatePercent === null ? (
                        <p className="text-xs text-muted">Add at least 2 length entries to calculate rate</p>
                      ) : (
                        <p className={`text-xs font-semibold ${lengthRatePercent >= 0 ? 'text-jade-300' : 'text-amber-300'}`}>
                          {lengthRatePercent >= 0 ? '+' : ''}{lengthRatePercent.toFixed(1)}% vs last entry
                        </p>
                      )}
                    </div>

                    {lengthChartData.length > 0 && (
                      <div className="rounded-lg border border-divider bg-surface p-2.5">
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={lengthChartData} margin={{ top: 5, right: 20, left: 10, bottom: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" />
                            <XAxis
                              dataKey="formattedDate"
                              className="text-xs fill-muted"
                              tick={{ fontSize: 12 }}
                              tickMargin={8}
                              label={{ value: 'Date', position: 'bottom', offset: 6, style: { fontSize: 11, fill: '#8B909A' } }}
                            />
                            <YAxis
                              className="text-xs fill-muted"
                              tick={{ fontSize: 12 }}
                              domain={[0, lengthYAxisMax]}
                              label={{ value: `Length (${lengthChartUnit})`, angle: -90, position: 'insideLeft', offset: 0, dy: 36, style: { fontSize: 12, fill: '#8B909A', textAnchor: 'middle' } }}
                            />
                            <Tooltip
                              formatter={(value: number) => [`${value} ${lengthChartUnit}`, 'Length']}
                              contentStyle={{
                                backgroundColor: '#1A1D24',
                                border: '1px solid #2A2D35',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#FFFFFF'
                              }}
                              labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="lengthValue"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: '#10b981', r: 4 }}
                              activeDot={{ r: 6 }}
                              name="Length"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="border border-divider rounded-lg p-2.5">
                      <button
                        type="button"
                        onClick={() => setLengthEntriesExpanded(!lengthEntriesExpanded)}
                        className="w-full flex items-center justify-between"
                      >
                        <h3 className="text-xs font-semibold text-white">Recent Entries</h3>
                        {lengthEntriesExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted" />
                        )}
                      </button>

                      {lengthEntriesExpanded && (
                        <div className="space-y-1.5 mt-2">
                          {lengthLogs.slice(0, 5).map((log) => (
                            editingLengthLog?.id === log.id ? (
                              <div key={log.id} className="bg-card border border-divider rounded-lg p-2.5">
                                <LengthLogForm
                                  animal={animal}
                                  initialData={{
                                    id: log.id,
                                    length: log.length,
                                    unit: log.unit,
                                    date: new Date(log.date),
                                    measurementType: log.measurementType,
                                    notes: log.notes,
                                  }}
                                  onSuccess={() => {
                                    setEditingLengthLog(null);
                                    handleRefresh();
                                  }}
                                  onCancel={() => setEditingLengthLog(null)}
                                />
                              </div>
                            ) : (
                              <div
                                key={log.id}
                                className="flex items-center justify-between gap-2 bg-surface border border-divider rounded-lg px-2.5 py-1.5"
                              >
                                <div>
                                  <p className="text-xs font-medium text-white">{log.length} {log.unit}</p>
                                  <p className="text-xs text-muted">{new Date(log.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setShowLengthForm(false);
                                      setLengthEntriesExpanded(true);
                                      setEditingLengthLog(log);
                                    }}
                                    className="px-2 py-1 rounded-md border border-divider bg-card text-white hover:bg-card-elevated"
                                    title="Edit length entry"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLength(log.id)}
                                    disabled={deletingLengthId === log.id}
                                    className="px-2 py-1 rounded-md border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete length entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-card border border-divider rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  Veterinary Records
                </h2>
                <button
                  onClick={() => setShowVetForm(!showVetForm)}
                  className="p-1.5 bg-accent text-on-accent rounded-lg hover:bg-accent-dim dark:bg-accent dark:hover:bg-accent-dim transition-colors"
                  title={showVetForm ? 'Cancel' : 'Add Visit'}
                >
                  {showVetForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {showVetForm && (
                <div className="mb-6">
                  <VetRecordForm
                    animal={animal}
                    onSuccess={() => {
                      setShowVetForm(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowVetForm(false)}
                  />
                </div>
              )}

              <VetRecordList animal={animal} onUpdate={handleRefresh} key={refreshKey} />
            </div>
          </div>
        )}

        {/* Shedding Tab */}
        {activeTab === 'shedding' && (
          <div className="space-y-6">
            <div className="bg-card border border-divider rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  Shedding History
                </h2>
                <button
                  onClick={() => setShowShedForm(!showShedForm)}
                  className="p-1.5 bg-accent text-on-accent rounded-lg hover:bg-accent-dim dark:bg-accent dark:hover:bg-accent-dim transition-colors"
                  title={showShedForm ? 'Cancel' : 'Log Shed'}
                >
                  {showShedForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {showShedForm && (
                <div className="mb-6">
                  <ShedLogForm
                    animal={animal}
                    onSuccess={() => {
                      setShowShedForm(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowShedForm(false)}
                  />
                </div>
              )}

              <ShedLogList animal={animal} onUpdate={handleRefresh} key={refreshKey} />
            </div>
          </div>
        )}

        {/* Brumation Tab */}
        {activeTab === 'brumation' && (
          <div className="space-y-6">
            <div className="bg-card border border-divider rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Brumation / Hibernation
              </h2>

              <BrumationTracker animal={animal} onUpdate={handleRefresh} key={refreshKey} />
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-0">
            <div className="bg-card border border-divider rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-1">
                <Clock className="w-5 h-5" />
                Active Care Tasks
              </h2>

              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => setEditingTask(task)}
                      className="w-full text-left flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-card-elevated transition-colors"
                    >
                      <div>
                        <p className="font-sm text-white">
                          {task.title}
                        </p>
                        <p className="text-sm text-muted">
                          {task.type} • {formatCareTaskFrequency(task)}
                        </p>
                      </div>
                      {task.notificationEnabled && (
                        <span className="textlgs px-2 py-1 bg-accent/15 text-accent rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted mb-4">No care tasks yet</p>
                  <Link
                    to="/care-calendar"
                    className="text-accent hover:underline"
                  >
                    Set up a care task
                  </Link>
                </div>
              )}
            </div>

            <TaskEditModal
              task={editingTask}
              isOpen={editingTask !== null}
              onClose={() => setEditingTask(null)}
              onTaskUpdated={handleRefresh}
            />
          </div>
        )}

        {/* Feeding Tab */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            {/* Add Feeding Entry Form */}
            <div className="bg-card border border-divider rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Log Feeding
                </h2>
                {!showFeedingModal && (
                  <button
                    onClick={() => setShowFeedingModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/25"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </button>
                )}
              </div>

              <FeedingLogModal
                isOpen={showFeedingModal}
                taskTitle={`Feeding for ${animal?.name || 'Animal'}`}
                onClose={() => setShowFeedingModal(false)}
                onSubmit={handleSaveFeedingLog}
              />

              <p className="text-sm text-muted">Click "Add Entry" above to log a feeding session. Your entries will appear in the Recent Feedings section below.</p>
            </div>

            {/* Recent Feeding Logs */}
            <div className="bg-card border border-divider rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowRecentFeedings(!showRecentFeedings)}
                className="w-full flex items-center justify-between p-6 hover:bg-card-elevated transition-colors"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Recent Feedings
                </h2>
                <ChevronDown
                  className={`w-5 h-5 text-muted transition-transform ${showRecentFeedings ? 'rotate-180' : ''}`}
                />
              </button>

              {showRecentFeedings && (
                <div className="border-t border-divider p-6 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-card-elevated rounded-lg p-1">
                      <button
                        onClick={() => setShowAllFeedingLogs(false)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          !showAllFeedingLogs
                            ? 'bg-card text-accent shadow-sm'
                            : 'text-muted hover:text-white'
                        }`}
                      >
                        This Animal
                      </button>
                      <button
                        onClick={() => setShowAllFeedingLogs(true)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          showAllFeedingLogs
                            ? 'bg-card text-accent shadow-sm'
                            : 'text-muted hover:text-white'
                        }`}
                      >
                        All in Enclosure
                      </button>
                    </div>
                  </div>

                  {combinedFeedingLogs.length > 0 ? (
                    <div className="space-y-3">
                  {combinedFeedingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-divider rounded-lg p-4 hover:bg-card-elevated/50 transition-colors"
                    >
                      {/* Header: Title and Date */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <UtensilsCrossed className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="font-medium text-white">
                            {log.taskTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted">
                            {new Date(log.completedAt).toLocaleDateString()}
                          </span>
                          {log.taskTitle === 'Manual Feeding Log' && (
                            <button
                              onClick={() => handleDeleteFeedingLog(log.id)}
                              disabled={deletingLogId === log.id}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Delete feeding log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Feeding Details */}
                      {log.feedingData && (
                        <div className="space-y-2">
                          {/* Food Row */}
                          <div className="flex items-center gap-3 p-2 bg-card-elevated/30 rounded">
                            <span className="text-xs font-medium text-muted uppercase w-16">Food:</span>
                            <span className="text-sm text-white">{log.feedingData.feederType}</span>
                          </div>

                          {/* Amount Row */}
                          <div className="flex items-center gap-3 p-2 bg-card-elevated/30 rounded">
                            <span className="text-xs font-medium text-muted uppercase w-16">Amount:</span>
                            <span className="text-sm text-white">{log.feedingData.quantityEaten || 0} / {log.feedingData.quantityOffered} eaten</span>
                          </div>

                          {/* Supplement Row */}
                          {log.feedingData.supplementUsed && log.feedingData.supplementUsed !== 'None' && (
                            <div className="flex items-center gap-3 p-2 bg-accent/10 rounded border border-accent/20">
                              <span className="text-xs font-sm text-accent uppercase w-16">Supplement:</span>
                              <p></p>
                              <span className="text-sm text-white">{log.feedingData.supplementUsed}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {log.notes && (
                            <div className="mt-3 p-3 bg-card rounded border border-divider">
                              <p className="text-xs text-muted mb-1">Notes:</p>
                              <p className="text-sm text-muted italic">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted mb-4">No feeding records yet</p>
                  {enclosure && (
                    <Link
                      to="/care-calendar"
                      className="text-accent hover:underline"
                    >
                      Go to Care Calendar to log feedings
                    </Link>
                  )}
                </div>
              )}
            </div>
              )}
            </div>

            <div className="bg-card border border-divider rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Poop Logs
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPoopForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-divider bg-card-elevated px-3 py-1.5 text-xs font-semibold text-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Poop
                </button>
              </div>

              {showPoopForm && (
                <div className="mb-4 rounded-xl border border-divider bg-card-elevated p-3 space-y-3">
                  <div>
                    <label htmlFor="animal-poop-consistency" className="block text-xs text-muted mb-1">Consistency</label>
                    <select
                      id="animal-poop-consistency"
                      value={poopConsistency || 'normal'}
                      onChange={(event) => setPoopConsistency(event.target.value as PoopLog['consistency'])}
                      className="w-full rounded-lg border border-divider bg-card px-3 py-2 text-sm text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="soft">Soft</option>
                      <option value="runny">Runny</option>
                      <option value="hard">Hard</option>
                      <option value="dry">Dry</option>
                      <option value="watery">Watery</option>
                      <option value="mucus">Mucus</option>
                      <option value="bloody">Bloody</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="animal-poop-notes" className="block text-xs text-muted mb-1">Notes</label>
                    <textarea
                      id="animal-poop-notes"
                      rows={2}
                      value={poopNotes}
                      onChange={(event) => setPoopNotes(event.target.value)}
                      placeholder="Optional notes"
                      className="w-full rounded-lg border border-divider bg-card px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPoopForm(false);
                        setPoopNotes('');
                        setPoopConsistency('normal');
                      }}
                      className="px-3 py-1.5 text-xs text-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingPoop}
                      onClick={() => handleSavePoopLog().catch(console.error)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-accent text-on-accent disabled:opacity-60"
                    >
                      {savingPoop ? 'Saving...' : 'Save Log'}
                    </button>
                  </div>
                </div>
              )}

              {poopLogs.length > 0 ? (
                <div className="space-y-2">
                  {poopLogs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-divider p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <p className="text-sm font-medium text-white capitalize">{log.consistency || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted">{new Date(log.loggedAt).toLocaleDateString()}</p>
                          <button
                            onClick={() => handleDeletePoopLog(log.id)}
                            disabled={deletingLogId === log.id}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete poop log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="mt-1 text-xs text-muted">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted">No poop logs yet for this animal.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="bg-card border border-divider rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                {enclosure && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Enclosure</span>
                    </div>
                    <p className="text-base text-white ml-6">{enclosure.name}</p>
                    <p className="text-sm text-muted ml-6">{displaySpecies}</p>
                  </div>
                )}
                
                {animal.birthday && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Birthday</span>
                    </div>
                    <p className="text-base text-white ml-6">
                      {new Date(animal.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

              </div>
            </div>

            <div className="bg-card border border-divider rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Acquisition Information
              </h2>

              <div className="space-y-4">
                {animal.source && (
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Source</p>
                    <p className="text-base text-white capitalize">{animal.source}</p>
                    {animal.sourceDetails && (
                      <p className="text-sm text-muted mt-1">{animal.sourceDetails}</p>
                    )}
                  </div>
                )}

                {animal.acquisitionDate && (
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Acquisition Date</p>
                    <p className="text-base text-white">
                      {new Date(animal.acquisitionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {animal.acquisitionPrice && (
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Acquisition Price</p>
                    <p className="text-base text-white">${animal.acquisitionPrice}</p>
                  </div>
                )}

                {animal.acquisitionNotes && (
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Notes</p>
                    <p className="text-base text-white">{animal.acquisitionNotes}</p>
                  </div>
                )}

                {!animal.source && !animal.acquisitionDate && !animal.acquisitionPrice && !animal.acquisitionNotes && (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted mb-4">No acquisition information recorded</p>
                    <button
                      onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
                      className="text-accent hover:underline"
                    >
                      Edit Animal Details
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Notes */}
            <div className="bg-card border border-divider rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Notes
                </h2>
                {!editingNotes && (
                  <button
                    onClick={() => { setNotesValue(animal.notes || ''); setEditingNotes(true); }}
                    className="px-3 py-1.5 bg-card-elevated border border-divider text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {animal.notes ? 'Edit' : 'Add Note'}
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={5}
                    placeholder="Add notes about this animal..."
                    className="w-full bg-surface border border-divider rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="px-4 py-2 text-sm text-muted hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={savingNotes}
                      onClick={async () => {
                        setSavingNotes(true);
                        await enclosureAnimalService.updateAnimal(animal.id, { notes: notesValue });
                        await loadAnimalData();
                        setEditingNotes(false);
                        setSavingNotes(false);
                      }}
                      className="px-4 py-2 bg-accent text-on-accent rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {savingNotes ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : animal.notes ? (
                <p className="text-sm text-white whitespace-pre-wrap">{animal.notes}</p>
              ) : (
                <p className="text-sm text-muted">No notes yet. Tap "Add Note" to record observations, reminders, or anything else about this animal.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






