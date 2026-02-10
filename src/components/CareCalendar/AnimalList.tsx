/**
 * AnimalList Component
 * 
 * Displays and manages individual animals within an enclosure
 */

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Scale } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { EnclosureAnimal } from '../../types/careCalendar';

interface AnimalListProps {
  enclosureId: string;
  enclosureName: string;
  speciesName: string;
  onAnimalsChanged?: () => void;
}

// Helper function to calculate age in months
function calculateAgeInMonths(birthday: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 
                 + (now.getMonth() - birthday.getMonth());
  return Math.max(0, months);
}

export function AnimalList({ enclosureId, enclosureName, speciesName, onAnimalsChanged }: AnimalListProps) {
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Load animals
  useEffect(() => {
    if (enclosureId) {
      loadAnimals();
    }
  }, [enclosureId, location.key]);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const data = await enclosureAnimalService.getAnimalsByEnclosure(enclosureId);
      setAnimals(data);
    } catch (err) {
      console.error('Error loading animals:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (animal: EnclosureAnimal) => {
    if (!confirm(`Remove ${animal.name || `Animal #${animal.animalNumber || '?'}`} from ${enclosureName}?`)) {
      return;
    }

    try {
      await enclosureAnimalService.deleteAnimal(animal.id);
      await loadAnimals();
      onAnimalsChanged?.();
    } catch (err) {
      console.error('Error deleting animal:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Animals ({animals.length})
        </h3>
        <button
          onClick={() => navigate(`/my-animals/add?enclosureId=${encodeURIComponent(enclosureId)}&speciesName=${encodeURIComponent(speciesName)}&returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Animal
        </button>
      </div>

      {/* Animals List */}
      {animals.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No animals added yet. Click "Add Animal" to track individuals.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {animals.map(animal => (
            <div
              key={animal.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5"
            >
              {/* Header: Name + Action Buttons */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {animal.name || `Animal #${animal.animalNumber || '?'}`}
                </h4>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => navigate(`/weight-tracker/${animal.id}`)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Track weight"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/my-animals/edit/${animal.id}`)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Edit animal"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(animal)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove animal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges: Age, Gender, Morph */}
              <div className="flex flex-wrap items-center gap-1 mb-1">
                {animal.birthday && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded inline-flex items-center gap-0.5">
                    {(() => {
                      const ageMonths = calculateAgeInMonths(animal.birthday);
                      if (ageMonths < 12) {
                        return `${ageMonths} ${ageMonths === 1 ? 'mo' : 'mos'}`;
                      } else {
                        const years = Math.floor(ageMonths / 12);
                        const months = ageMonths % 12;
                        return months > 0 
                          ? `${years}y ${months}m`
                          : `${years}y`;
                      }
                    })()}
                  </span>
                )}
                {animal.gender && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                    {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'} {animal.gender}
                  </span>
                )}
                {animal.morph && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                    {animal.morph}
                  </span>
                )}
              </div>

              {/* Birthday Date */}
              {animal.birthday && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mb-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{animal.birthday.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}

              {/* Notes */}
              {animal.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                  {animal.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
