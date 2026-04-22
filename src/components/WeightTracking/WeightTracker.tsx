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
      <div className="px-4 py-6">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-center">
          <Scale className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
            Sign In to Track Weight
          </h3>
          <p className="text-sm text-muted">
            Create a free account to start tracking your animal's weight over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-4">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 bg-accent/15 rounded-xl flex-shrink-0">
            <Scale className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-white truncate">
              Weight Tracker
            </h1>
            <p className="text-sm text-white truncate">
              {animal.name || `Animal #${animal.animalNumber || '?'}`}
            </p>
          </div>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-on-accent rounded-xl transition-colors text-sm whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Log Weight</span>
            <span className="xs:hidden">Log</span>
          </button>
        )}
      </div>

      {/* Add Weight Form */}
      {showAddForm && (
        <div className="bg-card rounded-2xl border border-divider p-4">
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
      <div className="bg-card rounded-2xl border border-divider p-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Weight History Chart
        </h2>
        <WeightChart 
          enclosureAnimalId={animal.id} 
          refreshKey={refreshKey}
        />
      </div>

      {/* Weight History Table */}
      <div className="bg-card rounded-2xl border border-divider p-4">
        <h2 className="text-lg font-semibold text-white mb-3">
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




