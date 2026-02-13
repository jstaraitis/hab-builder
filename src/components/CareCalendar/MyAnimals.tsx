/**
 * MyAnimals Component
 * 
 * Displays and manages all animals across all enclosures for the current user
 */

import { useEffect, useState } from 'react';
import { Calendar, Scale, MapPin, Plus, Pencil, Trash2, Turtle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import type { EnclosureAnimal, Enclosure } from '../../types/careCalendar';

// Helper function to calculate age display string
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

// Animal Card Component - Extracted and memoized to prevent remounting on scroll
const AnimalCard = ({ 
  animal, 
  enclosure, 
  onNavigate,
  onDelete 
}: { 
  animal: EnclosureAnimal; 
  enclosure?: Enclosure;
  onNavigate: (path: string) => void;
  onDelete: (animal: EnclosureAnimal) => void;
}) => (
  <div
    onClick={() => onNavigate(`/my-animals/${animal.id}`)}
    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer"
    style={{ contain: 'layout style paint' }}
  >
    <div className="flex items-start gap-3">
      <div className="h-20 w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0">
        {animal.photoUrl ? (
          <img 
            src={animal.photoUrl} 
            alt={animal.name || 'Animal'} 
            className="h-full w-full object-cover" 
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 80px, 80px"
          />
        ) : (
          <Turtle className="w-8 h-8" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header: Name + Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {animal.name || `Animal #${animal.animalNumber || '?'}`}
            </h4>
            {enclosure && (
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {enclosure.animalName}
              </p>
            )}
          </div>
          {/* Action Buttons - Inline on mobile */}
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onNavigate(`/my-animals/edit/${animal.id}`)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(animal)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges: Gender, Morph, Age - Compact row */}
        <div className="flex flex-wrap items-center gap-1 mb-1.5">
          {animal.gender && (
            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs capitalize inline-flex items-center gap-0.5">
              {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'} {animal.gender}
            </span>
          )}
          {animal.birthday && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs inline-flex items-center gap-0.5">
              <Calendar className="w-3 h-3 shrink-0" />
              {calculateAge(new Date(animal.birthday))}
            </span>
          )}
          {animal.morph && (
            <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
              {animal.morph}
            </span>
          )}
        </div>

        {/* Enclosure Location + Birthday - Bottom row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          {enclosure ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{enclosure.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 min-w-0 text-amber-600 dark:text-amber-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="italic">No enclosure</span>
            </div>
          )}
          {animal.birthday && (
            <div className="flex items-center gap-1 shrink-0 text-gray-400 dark:text-gray-600">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{new Date(animal.birthday).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Notes Preview - Show if exists */}
        {animal.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
            {animal.notes}
          </p>
        )}
      </div>
    </div>
  </div>
);

export function MyAnimals() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      // If no user, stop loading
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load animals and enclosures in parallel
      const [animalsData, enclosuresData] = await Promise.all([
        enclosureAnimalService.getAllUserAnimals(user!.id),
        enclosureService.getEnclosures(user!.id),
      ]);

      setAnimals(animalsData);
      setEnclosures(enclosuresData);
    } catch (err) {
      console.error('Failed to load animals:', err);
      setError('Failed to load animals');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (animal: EnclosureAnimal) => {
    if (!confirm(`Delete ${animal.name || `Animal #${animal.animalNumber || '?'}`}?`)) {
      return;
    }

    try {
      await enclosureAnimalService.deleteAnimal(animal.id);
      await loadData();
    } catch (err) {
      console.error('Error deleting animal:', err);
      setError('Failed to delete animal');
    }
  };

  const getEnclosureById = (id: string) => enclosures.find(e => e.id === id);

  // Show auth prompt if not logged in
  if (!user && !loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Scale className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sign In Required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to track your animals
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Loading animals...
      </div>
    );
  }

  if (error && animals.length === 0) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  // Show empty state with prompt to create enclosure first if no enclosures exist
  // Removed - animals can now exist without enclosures

  const getAnimalSortName = (animal: EnclosureAnimal) => {
    if (animal.name && animal.name.trim().length > 0) return animal.name.trim().toLowerCase();
    const number = animal.animalNumber ?? 0;
    return `animal ${number}`;
  };

  const sortAnimalsByName = (list: EnclosureAnimal[]) =>
    [...list].sort((a, b) => getAnimalSortName(a).localeCompare(getAnimalSortName(b)));

  // Separate assigned and unassigned animals
  const assignedAnimals = sortAnimalsByName(animals.filter(a => a.enclosureId));
  const unassignedAnimals = sortAnimalsByName(animals.filter(a => !a.enclosureId));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Animals
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {animals.length} {animals.length === 1 ? 'animal' : 'animals'} total
            </p>
          </div>
          <button
            onClick={() => navigate(`/my-animals/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center"
            title="Add Animal"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Animals Grid */}
      {animals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No animals added yet. Click "Add Animal" to start tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unassigned Animals Section */}
          {unassignedAnimals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Unassigned Animals ({unassignedAnimals.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unassignedAnimals.map(animal => (
                  <AnimalCard 
                    key={animal.id} 
                    animal={animal} 
                    enclosure={undefined} 
                    onNavigate={navigate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assigned Animals Section */}
          {assignedAnimals.length > 0 && (
            <div>
              {unassignedAnimals.length > 0 && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  In Enclosures ({assignedAnimals.length})
                </h2>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assignedAnimals.map(animal => {
                  const enclosure = getEnclosureById(animal.enclosureId!);
                  return (
                    <AnimalCard 
                      key={animal.id} 
                      animal={animal} 
                      enclosure={enclosure}
                      onNavigate={navigate}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
