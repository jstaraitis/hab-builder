import { memo, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Home,
  Plus,
  Search,
  SlidersHorizontal,
  Turtle,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import type { Enclosure, EnclosureAnimal } from '../../types/careCalendar';

type AnimalFilter = 'all' | 'assigned' | 'unassigned' | 'male' | 'female' | 'unknown';

const EnclosureCard = memo(({
  enclosure,
  onNavigate,
}: {
  enclosure: Enclosure;
  onNavigate: (path: string) => void;
}) => {
  return (
    <div
      onClick={() => onNavigate(`/care-calendar/enclosures/${enclosure.id}/environment`)}
      className="cursor-pointer rounded-2xl border border-divider bg-card p-2 transition-colors hover:border-emerald-500/50"
      style={{ contain: 'layout style paint' }}
    >
      <div className="aspect-square overflow-hidden rounded-xl border border-divider bg-surface/60 text-muted">
        <div className="flex h-full w-full items-center justify-center">
          {enclosure.photoUrl ? (
            <img
              src={enclosure.photoUrl}
              alt={enclosure.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 50vw, 240px"
            />
          ) : (
            <Home className="h-8 w-8" />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <h3 className="truncate text-sm font-semibold text-white">{enclosure.name}</h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </div>
    </div>
  );
});

EnclosureCard.displayName = 'EnclosureCard';

const AnimalCard = memo(({
  animal,
  onNavigate,
}: {
  animal: EnclosureAnimal;
  onNavigate: (path: string) => void;
}) => {
  return (
    <div
      onClick={() => onNavigate(`/my-animals/${animal.id}`)}
      className="cursor-pointer rounded-2xl border border-divider bg-card p-2 transition-colors hover:border-emerald-500/50"
      style={{ contain: 'layout style paint' }}
    >
      <div className="aspect-square overflow-hidden rounded-xl border border-divider bg-surface/60 text-muted">
        <div className="flex h-full w-full items-center justify-center">
          {animal.photoUrl ? (
            <img
              src={animal.photoUrl}
              alt={animal.name || 'Pet'}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 50vw, 240px"
            />
          ) : (
            <Turtle className="h-8 w-8" />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <h3 className="truncate text-sm font-semibold text-white">
          {animal.name || `Pet #${animal.animalNumber || '?'}`}
        </h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </div>
    </div>
  );
});

AnimalCard.displayName = 'AnimalCard';

export function MyAnimals() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AnimalFilter>('all');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [animalsData, enclosuresData] = await Promise.all([
        enclosureAnimalService.getAllUserAnimals(user.id),
        enclosureService.getEnclosures(user.id),
      ]);

      setAnimals(animalsData);
      setEnclosures(enclosuresData);
    } catch (err) {
      console.error('Failed to load pets data:', err);
      setError('Failed to load pets data');
    } finally {
      setLoading(false);
    }
  };

  const getEnclosureById = (id?: string) => {
    if (!id) return undefined;
    return enclosures.find((enclosure) => enclosure.id === id);
  };

  const filteredAnimals = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return animals
      .filter((animal) => {
        if (!normalized) return true;

        const enclosure = getEnclosureById(animal.enclosureId);
        const haystack = [
          animal.name,
          animal.morph,
          animal.gender,
          enclosure?.name,
          enclosure?.animalName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalized);
      })
      .filter((animal) => {
        if (filter === 'all') return true;
        if (filter === 'assigned') return Boolean(animal.enclosureId);
        if (filter === 'unassigned') return !animal.enclosureId;
        if (filter === 'male') return animal.gender === 'male';
        if (filter === 'female') return animal.gender === 'female';
        if (filter === 'unknown') return animal.gender === 'unknown' || !animal.gender;
        return true;
      })
      .sort((a, b) => {
        const left = (a.name || `pet ${a.animalNumber || 0}`).toLowerCase();
        const right = (b.name || `pet ${b.animalNumber || 0}`).toLowerCase();
        return left.localeCompare(right);
      });
  }, [animals, filter, search, enclosures]);

  if (!user && !loading) {
    return (
      <div className="rounded-2xl border border-divider bg-card p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface text-muted">
          <UserRound className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-white">Sign in required</h3>
        <p className="mt-2 text-sm text-muted">Please sign in to track your pets and enclosures.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="py-10 text-center text-muted">Loading pets...</div>;
  }

  if (error && animals.length === 0 && enclosures.length === 0) {
    return <div className="py-10 text-center text-red-300">{error}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-7">
      <div className="mb-6">
        <div className="mb-4 text-center sm:text-left">
          <h1 className="mt-1 text-4xl font-bold leading-none tracking-tight text-white sm:text-3xl">My Pets</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-xl border border-divider bg-card p-3 text-center">
            <div className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-300">
              <Turtle className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted">Pets</p>
            <p className="mt-1 text-2xl font-bold text-white">{animals.length}</p>
          </div>
          <div className="rounded-xl border border-divider bg-card p-3 text-center">
            <div className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-indigo-300">
              <Home className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted">Enclosures</p>
            <p className="mt-1 text-2xl font-bold text-white">{enclosures.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pets..."
            className="w-full rounded-xl border border-divider bg-card py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-muted focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <div className="relative sm:w-48">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as AnimalFilter)}
            className="w-full appearance-none rounded-xl border border-divider bg-card py-2.5 pl-10 pr-8 text-sm text-white focus:border-emerald-500 focus:outline-none"
            aria-label="Filter pets"
          >
            <option value="all">All pets</option>
            <option value="assigned">With enclosure</option>
            <option value="unassigned">Unassigned</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white">
            <Home className="h-4 w-4 text-emerald-300" />
            My Enclosures
          </h2>
          <button
            onClick={() => navigate(`/care-calendar/enclosures/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
            title={!isPremium && enclosures.length >= 1 ? 'Upgrade to add more enclosures' : 'Add enclosure'}
          >
            <Plus className="h-4 w-4" />
            Add Enclosure
          </button>
        </div>

        {enclosures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-divider bg-card p-6 text-center text-sm text-muted">
            No enclosures yet. Add one to organize your pets.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {enclosures
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((enclosure) => (
                <EnclosureCard
                  key={enclosure.id}
                  enclosure={enclosure}
                  onNavigate={(path) =>
                    navigate(
                      `${path}?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
                    )
                  }
                />
              ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white">
            <Turtle className="h-4 w-4 text-emerald-300" />
            My Pets
          </h2>
          <button
            onClick={() => navigate(`/my-animals/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
            title={!isPremium && animals.length >= 1 ? 'Upgrade to add more animals' : 'Add pet'}
          >
            <Plus className="h-4 w-4" />
            Add Pet
          </button>
        </div>

        {animals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-divider bg-card p-6 text-center text-sm text-muted">
            No pets added yet.
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-divider bg-card p-6 text-center text-sm text-muted">
            No pets match your search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAnimals.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                onNavigate={navigate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
