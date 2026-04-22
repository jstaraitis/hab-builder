/**
 * HealthHubView — aggregated health & wellness hub.
 * Tabs: Weight | Sheds | Vet | Length — animal selector at top.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turtle, Plus, Scale, Scissors, Stethoscope, Ruler } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { WeightTracker } from '../WeightTracking/WeightTracker';
import { ShedLogList } from '../HealthTracking/ShedLogList';
import { ShedLogForm } from '../HealthTracking/ShedLogForm';
import { VetRecordList } from '../HealthTracking/VetRecordList';
import { VetRecordForm } from '../HealthTracking/VetRecordForm';
import { LengthHistory } from '../LengthTracking/LengthHistory';
import { LengthLogForm } from '../LengthTracking/LengthLogForm';
import { LengthStats } from '../LengthTracking/LengthStats';
import type { EnclosureAnimal } from '../../types/careCalendar';

type TabId = 'weight' | 'sheds' | 'vet' | 'length';

const TABS: Array<{ id: TabId; label: string; icon: typeof Scale }> = [
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'sheds', label: 'Sheds', icon: Scissors },
  { id: 'vet', label: 'Vet', icon: Stethoscope },
  { id: 'length', label: 'Length', icon: Ruler },
];

// ─── Animal selector pills ───────────────────────────────────────────
function AnimalPills({
  animals,
  selectedId,
  onSelect,
}: {
  animals: EnclosureAnimal[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (animals.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-4">
      {animals.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            a.id === selectedId
              ? 'bg-accent text-on-accent'
              : 'bg-card text-muted border border-divider'
          }`}
        >
          {a.name || `Animal #${a.animalNumber ?? 1}`}
        </button>
      ))}
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4">
      <div className="h-8 w-48 bg-card rounded-full" />
      <div className="h-48 bg-card rounded-2xl" />
      <div className="h-64 bg-card rounded-2xl" />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
        <Turtle className="w-10 h-10 text-accent" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">No animals yet</h2>
        <p className="text-muted text-sm max-w-xs">
          Add your first animal to start tracking weight, sheds, vet visits, and more.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-accent text-on-accent font-semibold px-6 py-3 rounded-full active:scale-95 transition-transform"
      >
        <Plus className="w-4 h-4" />
        Add Animal
      </button>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────
export function HealthHubView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('weight');

  // Per-tab state: add form visibility + refresh keys
  const [showShedForm, setShowShedForm] = useState(false);
  const [showVetForm, setShowVetForm] = useState(false);
  const [showLengthForm, setShowLengthForm] = useState(false);
  const [shedRefresh, setShedRefresh] = useState(0);
  const [vetRefresh, setVetRefresh] = useState(0);
  const [lengthRefresh, setLengthRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    enclosureAnimalService
      .getAllUserAnimals(user.id)
      .then((data) => {
        const active = data.filter((a) => a.isActive !== false);
        setAnimals(active);
        if (active.length > 0) setSelectedId(active[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Reset add-forms when animal or tab changes
  useEffect(() => {
    setShowShedForm(false);
    setShowVetForm(false);
    setShowLengthForm(false);
  }, [selectedId, activeTab]);

  const selectedAnimal = animals.find((a) => a.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-28 pt-4 space-y-4">
        <div className="px-4">
          <h1 className="text-xl font-bold text-white">Health Hub</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="min-h-screen bg-surface pb-28">
        <div className="px-4 pt-4 pb-2 sticky top-0 bg-surface z-10 border-b border-divider">
          <h1 className="text-xl font-bold text-white">Health Hub</h1>
        </div>
        <EmptyState onAdd={() => navigate('/care-calendar/enclosures/add')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-xl z-20 border-b border-divider">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-4xl font-bold text-white">Health Hub</h1>
          {selectedAnimal && (
            <button
              onClick={() => navigate(`/my-animals/${selectedAnimal.id}`)}
              className="text-xs text-accent font-semibold"
            >
              Full Profile →
            </button>
          )}
        </div>

        {/* Animal pills */}
        <AnimalPills
          animals={animals}
          selectedId={selectedId ?? ''}
          onSelect={(id) => {
            setSelectedId(id);
            navigate(`/my-animals/${id}`);
          }}
        />

        {/* Tab bar */}
        <div className="flex mt-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 border-b-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {selectedAnimal && (
        <div className="pt-3">
          {/* ── Weight ── */}
          {activeTab === 'weight' && (
            <WeightTracker animal={selectedAnimal} />
          )}

          {/* ── Sheds ── */}
          {activeTab === 'sheds' && (
            <div className="px-4 space-y-4 pt-2">
              {!showShedForm ? (
                <button
                  onClick={() => setShowShedForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-on-accent font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Log Shed
                </button>
              ) : (
                <ShedLogForm
                  animal={selectedAnimal}
                  onSuccess={() => {
                    setShowShedForm(false);
                    setShedRefresh((k) => k + 1);
                  }}
                  onCancel={() => setShowShedForm(false)}
                />
              )}
              <ShedLogList
                animal={selectedAnimal}
                refreshKey={shedRefresh}
                onUpdate={() => setShedRefresh((k) => k + 1)}
              />
            </div>
          )}

          {/* ── Vet ── */}
          {activeTab === 'vet' && (
            <div className="px-4 space-y-4 pt-2">
              {!showVetForm ? (
                <button
                  onClick={() => setShowVetForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-on-accent font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Log Vet Visit
                </button>
              ) : (
                <VetRecordForm
                  animal={selectedAnimal}
                  onSuccess={() => {
                    setShowVetForm(false);
                    setVetRefresh((k) => k + 1);
                  }}
                  onCancel={() => setShowVetForm(false)}
                />
              )}
              <VetRecordList
                animal={selectedAnimal}
                refreshKey={vetRefresh}
                onUpdate={() => setVetRefresh((k) => k + 1)}
              />
            </div>
          )}

          {/* ── Length ── */}
          {activeTab === 'length' && (
            <div className="px-4 space-y-4 pt-2">
              <LengthStats enclosureAnimalId={selectedAnimal.id} refreshKey={lengthRefresh} />
              {!showLengthForm ? (
                <button
                  onClick={() => setShowLengthForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-on-accent font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Log Length
                </button>
              ) : (
                <LengthLogForm
                  animal={selectedAnimal}
                  onSuccess={() => {
                    setShowLengthForm(false);
                    setLengthRefresh((k) => k + 1);
                  }}
                  onCancel={() => setShowLengthForm(false)}
                />
              )}
              <LengthHistory
                enclosureAnimalId={selectedAnimal.id}
                refreshKey={lengthRefresh}
                onUpdate={() => setLengthRefresh((k) => k + 1)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
