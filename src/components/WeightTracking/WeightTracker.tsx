import { useState } from 'react';
import { Scale, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WeightLogForm } from './WeightLogForm';
import { WeightChart } from './WeightChart';
import { WeightHistory } from './WeightHistory';
import { WeightStats } from './WeightStats';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface WeightTrackerProps {
  animal: EnclosureAnimal;
}

export function WeightTracker({ animal }: WeightTrackerProps) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogCreated = () => {
    setShowAddForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of stats/chart/history
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 text-center">
          <Scale className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sign In to Track Weight
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create a free account to start tracking your animal's weight over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
            <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Weight Tracker
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              {animal.name || `Animal #${animal.animalNumber || '?'}`}
            </p>
          </div>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 
                     bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg 
                     transition-colors text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Log Weight</span>
            <span className="xs:hidden">Log</span>
          </button>
        )}
      </div>

      {/* Add Weight Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <WeightLogForm
            animal={animal}
            onSuccess={handleLogCreated}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Stats Overview */}
      <WeightStats 
        enclosureAnimalId={animal.id} 
        refreshKey={refreshKey}
      />

      {/* Weight Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Weight History Chart
        </h2>
        <WeightChart 
          enclosureAnimalId={animal.id} 
          refreshKey={refreshKey}
        />
      </div>

      {/* Weight History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          All Entries
        </h2>
        <WeightHistory 
          enclosureAnimalId={animal.id} 
          refreshKey={refreshKey}
          onUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </div>
  );
}
