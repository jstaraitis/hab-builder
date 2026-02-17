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
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  Turtle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import { careTaskService } from '../../services/careTaskService';
import { weightTrackingService } from '../../services/weightTrackingService';
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
import { LengthHistory } from '../LengthTracking/LengthHistory';
import { LengthStats } from '../LengthTracking/LengthStats';
import { AnimalGallery } from '../AnimalGallery/AnimalGallery';

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

// Tab types
type TabType = 'overview' | 'growth' | 'health' | 'shedding' | 'brumation' | 'care' | 'info';

const TABS: Array<{ id: TabType; label: string; icon: any }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'care', label: 'Care', icon: CheckCircle },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'shedding', label: 'Shedding', icon: Stethoscope },
  { id: 'brumation', label: 'Brumation', icon: Moon },
  { id: 'info', label: 'Info', icon: Info }
];

export function AnimalDetailView() {
  const { animalId } = useParams<{ animalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core data state (fast load)
  const [animal, setAnimal] = useState<EnclosureAnimal | null>(null);
  const [enclosure, setEnclosure] = useState<Enclosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core data state
  const [tasks, setTasks] = useState<CareTaskWithLogs[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Form visibility state
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showLengthForm, setShowLengthForm] = useState(false);
  const [showVetForm, setShowVetForm] = useState(false);
  const [showShedForm, setShowShedForm] = useState(false);
  
  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Feeding logs filter
  const [showAllFeedingLogs, setShowAllFeedingLogs] = useState(true);

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
        const [enclosureData, allTasks, weightData] = await Promise.all([
          enclosureService.getEnclosureById(animalData.enclosureId),
          careTaskService.getTasksWithLogs(user.id),
          weightTrackingService.getWeightLogs(animalId)
        ]);

        setEnclosure(enclosureData);
        const enclosureTasks = allTasks.filter(task => task.enclosureId === animalData.enclosureId);
        setTasks(enclosureTasks);
        setWeightLogs(weightData);
      } else {
        // Load tasks and weight logs even if no enclosure
        const [allTasks, weightData] = await Promise.all([
          careTaskService.getTasksWithLogs(user.id),
          weightTrackingService.getWeightLogs(animalId)
        ]);
        
        const animalTasks = allTasks.filter(task => task.enclosureAnimalId === animalData.id);
        setTasks(animalTasks);
        setWeightLogs(weightData);
      }

    } catch (err) {
      console.error('Failed to load animal data:', err);
      setError('Failed to load animal data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading animal data...</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {error || 'Animal not found'}
          </h3>
          <Link
            to="/my-animals"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            ← Back to My Animals
          </Link>
        </div>
      </div>
    );
  }

  const feedingLogs = getFeedingLogs(!showAllFeedingLogs);
  const latestWeight = weightLogs.length > 0 ? weightLogs[0] : null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/my-animals')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Animals
      </button>

      {/* Header */}
      <div className="mb-8">
        {/* Mobile Layout - Photo centered and large */}
        <div className="sm:hidden flex flex-col items-center gap-4 mb-6">
          <div className="h-48 w-48 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center text-gray-400">
            {animal.photoUrl ? (
              <img src={animal.photoUrl} alt="Animal" className="h-full w-full object-cover" />
            ) : (
              <Turtle className="w-20 h-20" />
            )}
          </div>
          
          <div className="text-center w-full">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {animal.name || `Animal #${animal.animalNumber || '?'}`}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-2 mb-4">
              {animal.gender && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm capitalize">
                  {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'} {animal.gender}
                </span>
              )}
              {animal.morph && (
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                  {animal.morph}
                </span>
              )}
              {animal.birthday && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {calculateAge(new Date(animal.birthday))}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Desktop Layout - Original side-by-side */}
        <div className="hidden sm:flex sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="h-32 w-32 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center text-gray-400">
              {animal.photoUrl ? (
                <img src={animal.photoUrl} alt="Animal" className="h-full w-full object-cover" />
              ) : (
                <Turtle className="w-12 h-12" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {animal.name || `Animal #${animal.animalNumber || '?'}`}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {animal.gender && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm capitalize">
                    {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'} {animal.gender}
                  </span>
                )}
                {animal.morph && (
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                    {animal.morph}
                  </span>
                )}
                {animal.birthday && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {calculateAge(new Date(animal.birthday))}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${isActive 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Quick Actions</h2>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('growth')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 sm:gap-3"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium">Track Growth</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('health')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 sm:gap-3"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium">Health Record</span>
                  </button>

                  {enclosure && (
                    <Link
                      to="/care-calendar"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2 sm:gap-3"
                    >
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">View Care Calendar</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Summary Cards */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-6">
                  <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mb-1 sm:mb-2" />
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Latest Weight</h3>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {latestWeight ? `${latestWeight.weightGrams}g` : 'No data'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 sm:mt-1">
                    {weightLogs.length} total records
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 sm:p-6">
                  <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2" />
                  <h3 className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-1">Feeding Logs</h3>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {feedingLogs.length}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 sm:mt-1">
                    Recent feedings tracked
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-6">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 mb-1 sm:mb-2" />
                  <h3 className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Active Tasks</h3>
                  <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {tasks.length}
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 sm:mt-1">
                    Care reminders set
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 sm:p-6">
                  <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400 mb-1 sm:mb-2" />
                  <h3 className="text-xs sm:text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">Recent Sheds</h3>
                  <p className="text-lg sm:text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {tasks.filter(t => (t.type as string) === 'shedding' && t.logs?.length).reduce((sum, t) => sum + (t.logs?.length || 0), 0)}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5 sm:mt-1">
                    Total shedding events
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === 'growth' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Tracking */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Weight Tracking
                  </h2>
                  <button
                    onClick={() => setShowWeightForm(!showWeightForm)}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                    title={showWeightForm ? 'Cancel' : 'Add Weight'}
                  >
                    {showWeightForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>

                {showWeightForm ? (
                  <WeightLogForm
                    animal={animal}
                    onSuccess={() => {
                      setShowWeightForm(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowWeightForm(false)}
                  />
                ) : weightLogs.length > 0 ? (
                  <WeightChart enclosureAnimalId={animal.id} key={refreshKey} />
                ) : (
                  <div className="text-center py-8">
                    <Scale className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No weight data yet</p>
                  </div>
                )}
              </div>

              {/* Length Tracking */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    Length Tracking
                  </h2>
                  <button
                    onClick={() => setShowLengthForm(!showLengthForm)}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                    title={showLengthForm ? 'Cancel' : 'Add Length'}
                  >
                    {showLengthForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                  <>
                    <LengthStats enclosureAnimalId={animal.id} key={refreshKey} />
                    <div className="mt-4">
                      <LengthHistory enclosureAnimalId={animal.id} onUpdate={handleRefresh} key={refreshKey} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Veterinary Records
                </h2>
                <button
                  onClick={() => setShowVetForm(!showVetForm)}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                  title={showVetForm ? 'Cancel' : 'Add Visit'}
                >
                  {showVetForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Shedding History
                </h2>
                <button
                  onClick={() => setShowShedForm(!showShedForm)}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                  title={showShedForm ? 'Cancel' : 'Log Shed'}
                >
                  {showShedForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Brumation / Hibernation
              </h2>

              <BrumationTracker animal={animal} onUpdate={handleRefresh} key={refreshKey} />
            </div>
          </div>
        )}

        {/* Care Tab */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            {/* Recent Feeding Logs */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Recent Feedings
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setShowAllFeedingLogs(false)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        !showAllFeedingLogs
                          ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      This Animal
                    </button>
                    <button
                      onClick={() => setShowAllFeedingLogs(true)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        showAllFeedingLogs
                          ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      All in Enclosure
                    </button>
                  </div>
                </div>
              </div>

              {feedingLogs.length > 0 ? (
                <div className="space-y-3">
                  {feedingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.taskTitle}
                          </span>
                          {log.isEnclosureLevel && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                              Enclosure-level
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(log.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {log.feedingData && (
                        <div className="ml-6 text-sm space-y-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Food:</span> {log.feedingData.feederType}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Amount:</span> {log.feedingData.quantityEaten || 0} / {log.feedingData.quantityOffered} eaten
                          </p>
                          {log.feedingData.supplementUsed && log.feedingData.supplementUsed !== 'None' && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Supplement:</span> {log.feedingData.supplementUsed}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-gray-600 dark:text-gray-400 italic mt-2">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No feeding records yet</p>
                  {enclosure && (
                    <Link
                      to="/care-calendar"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Go to Care Calendar to log feedings
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Active Care Tasks */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Care Tasks
              </h2>

              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate('/care-calendar')}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {task.type} • {task.frequency}
                        </p>
                      </div>
                      {task.notificationEnabled && (
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                          Notifications On
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No care tasks yet</p>
                  <Link
                    to="/care-calendar"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Set up a care task
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Gallery Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <AnimalGallery
                animal={animal}
                onUpdate={async (images) => {
                  await enclosureAnimalService.updateAnimal(animal.id, { images });
                  await loadAnimalData();
                }}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                {enclosure && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Enclosure</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-white ml-6">{enclosure.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{enclosure.animalName}</p>
                  </div>
                )}
                
                {animal.birthday && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Birthday</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-white ml-6">
                      {new Date(animal.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {latestWeight && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Scale className="w-4 h-4" />
                      <span className="font-medium">Current Weight</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-white ml-6">{latestWeight.weightGrams}g</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">{new Date(latestWeight.measurementDate).toLocaleDateString()}</p>
                  </div>
                )}

                {animal.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-base text-gray-700 dark:text-gray-300">{animal.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Acquisition Information
              </h2>

              <div className="space-y-4">
                {animal.source && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Source</p>
                    <p className="text-base text-gray-900 dark:text-white capitalize">{animal.source}</p>
                    {animal.sourceDetails && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{animal.sourceDetails}</p>
                    )}
                  </div>
                )}

                {animal.acquisitionDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Acquisition Date</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {new Date(animal.acquisitionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {animal.acquisitionPrice && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Acquisition Price</p>
                    <p className="text-base text-gray-900 dark:text-white">${animal.acquisitionPrice}</p>
                  </div>
                )}

                {animal.acquisitionNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-base text-gray-700 dark:text-gray-300">{animal.acquisitionNotes}</p>
                  </div>
                )}

                {!animal.source && !animal.acquisitionDate && !animal.acquisitionPrice && !animal.acquisitionNotes && (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No acquisition information recorded</p>
                    <button
                      onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Edit Animal Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
