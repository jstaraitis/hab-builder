/**
 * AnimalList Component
 * 
 * Displays and manages individual animals within an enclosure
 */

import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Calendar, Scale } from 'lucide-react';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { EnclosureAnimal } from '../../types/careCalendar';
import { useAuth } from '../../contexts/AuthContext';
import { WeightTracker } from '../WeightTracking';

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
  const { user } = useAuth();
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<EnclosureAnimal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingWeightForAnimal, setTrackingWeightForAnimal] = useState<EnclosureAnimal | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    animalNumber: '',
    birthday: '',
    notes: '',
  });

  // Load animals
  useEffect(() => {
    if (enclosureId) {
      loadAnimals();
    }
  }, [enclosureId]);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const data = await enclosureAnimalService.getAnimalsByEnclosure(enclosureId);
      setAnimals(data);
    } catch (err) {
      console.error('Error loading animals:', err);
      setError('Failed to load animals');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (animal?: EnclosureAnimal) => {
    if (animal) {
      setEditingAnimal(animal);
      setFormData({
        name: animal.name || '',
        animalNumber: animal.animalNumber?.toString() || '',
        birthday: animal.birthday ? animal.birthday.toISOString().split('T')[0] : '',
        notes: animal.notes || '',
      });
    } else {
      setEditingAnimal(null);
      setFormData({ name: '', animalNumber: '', birthday: '', notes: '' });
    }
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAnimal(null);
    setFormData({ name: '', animalNumber: '', birthday: '', notes: '' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);

      const animalData = {
        enclosureId,
        userId: user.id,
        name: formData.name || undefined,
        animalNumber: formData.animalNumber ? parseInt(formData.animalNumber) : undefined,
        birthday: formData.birthday ? new Date(formData.birthday) : undefined,
        notes: formData.notes || undefined,
        isActive: true,
      };

      if (editingAnimal) {
        await enclosureAnimalService.updateAnimal(editingAnimal.id, animalData);
      } else {
        await enclosureAnimalService.createAnimal(animalData);
      }

      await loadAnimals();
      onAnimalsChanged?.();
      closeModal();
    } catch (err: any) {
      console.error('Error saving animal:', err);
      setError(err.message || 'Failed to save animal');
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
      setError('Failed to remove animal');
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
          onClick={() => openModal()}
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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {animal.name || `Animal #${animal.animalNumber || '?'}`}
                    </h4>
                    {animal.birthday && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {(() => {
                          const ageMonths = calculateAgeInMonths(animal.birthday);
                          if (ageMonths < 12) {
                            return `${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} old`;
                          } else {
                            const years = Math.floor(ageMonths / 12);
                            const months = ageMonths % 12;
                            return months > 0 
                              ? `${years}y ${months}m old`
                              : `${years} ${years === 1 ? 'year' : 'years'} old`;
                          }
                        })()}
                      </span>
                    )}
                  </div>

                  {animal.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      {animal.notes}
                    </p>
                  )}

                  {animal.birthday && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      Birthday: {animal.birthday.toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setTrackingWeightForAnimal(animal)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Track weight"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal(animal)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Edit animal"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(animal)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove animal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingAnimal ? 'Edit Animal' : 'Add Animal'} - {speciesName}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Kermit"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.animalNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, animalNumber: e.target.value }))}
                    placeholder="e.g., 1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Birthday/Hatch Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Special traits, health notes, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingAnimal ? 'Update' : 'Add'} Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weight Tracker Modal */}
      {trackingWeightForAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                Weight Tracker - {trackingWeightForAnimal.name || `Animal #${trackingWeightForAnimal.animalNumber}`}
              </h3>
              <button 
                onClick={() => setTrackingWeightForAnimal(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4">
              <WeightTracker 
                animal={trackingWeightForAnimal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
