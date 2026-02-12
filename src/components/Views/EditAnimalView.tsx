import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { enclosureService } from '../../services/enclosureService';
import type { EnclosureAnimal, Enclosure } from '../../types/careCalendar';

export function EditAnimalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<EnclosureAnimal | null>(null);
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    enclosureId: '',
    name: '',
    animalNumber: '',
    gender: '' as '' | 'male' | 'female' | 'unknown',
    morph: '',
    birthday: '',
    notes: '',
    // Acquisition fields
    source: '' as '' | 'breeder' | 'pet-store' | 'rescue' | 'wild-caught' | 'bred-by-me' | 'adopted' | 'other',
    sourceDetails: '',
    acquisitionDate: '',
    acquisitionPrice: '',
    acquisitionNotes: ''
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [animalData, enclosuresData] = await Promise.all([
          enclosureAnimalService.getAnimalById(id),
          enclosureService.getEnclosures(user.id)
        ]);

        if (!isMounted) return;

        if (!animalData) {
          setError('Animal not found.');
          setAnimal(null);
          setEnclosures(enclosuresData);
          return;
        }

        setAnimal(animalData);
        setEnclosures(enclosuresData);
        setFormData({
          enclosureId: animalData.enclosureId || '',
          name: animalData.name || '',
          animalNumber: animalData.animalNumber?.toString() || '',
          gender: animalData.gender || '',
          morph: animalData.morph || '',
          birthday: animalData.birthday ? new Date(animalData.birthday).toISOString().split('T')[0] : '',
          notes: animalData.notes || '',
          source: animalData.source || '',
          sourceDetails: animalData.sourceDetails || '',
          acquisitionDate: animalData.acquisitionDate ? new Date(animalData.acquisitionDate).toISOString().split('T')[0] : '',
          acquisitionPrice: animalData.acquisitionPrice?.toString() || '',
          acquisitionNotes: animalData.acquisitionNotes || ''
        });
      } catch (err) {
        if (isMounted) {
          setError('Failed to load animal.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !id) return;

    try {
      setSaving(true);
      setError(null);

      const updatedData: Partial<EnclosureAnimal> = {
        enclosureId: formData.enclosureId || undefined,
        userId: user.id,
        name: formData.name || undefined,
        animalNumber: formData.animalNumber ? parseInt(formData.animalNumber) : undefined,
        gender: formData.gender || undefined,
        morph: formData.morph || undefined,
        birthday: formData.birthday ? new Date(formData.birthday) : undefined,
        notes: formData.notes || undefined,
        source: formData.source || undefined,
        sourceDetails: formData.sourceDetails || undefined,
        acquisitionDate: formData.acquisitionDate ? new Date(formData.acquisitionDate) : undefined,
        acquisitionPrice: formData.acquisitionPrice ? parseFloat(formData.acquisitionPrice) : undefined,
        acquisitionNotes: formData.acquisitionNotes || undefined,
        isActive: true
      };

      await enclosureAnimalService.updateAnimal(id, updatedData);
      navigate(-1);
    } catch (err: any) {
      setError(err.message || 'Failed to save animal.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading animal...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!animal) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium"
        >
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Edit Animal
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {animal.name || `Animal #${animal.animalNumber || '?'}`}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enclosure (optional)
            </label>
            <select
              value={formData.enclosureId}
              onChange={(e) => setFormData(prev => ({ ...prev, enclosureId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">No enclosure</option>
              {enclosures.map(enc => (
                <option key={enc.id} value={enc.id}>
                  {enc.name} - {enc.animalName}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender (optional)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'male' | 'female' | 'unknown' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Birthday/Hatch Date
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base min-h-[44px] sm:min-h-[42px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Morph (optional)
            </label>
            <input
              type="text"
              value={formData.morph}
              onChange={(e) => setFormData(prev => ({ ...prev, morph: e.target.value }))}
              placeholder="e.g., Albino, Leucistic"
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
              rows={3}
              placeholder="Special traits, health notes, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Acquisition Information Section */}
          <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Acquisition Information
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source (optional)
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select source...</option>
                  <option value="breeder">Breeder</option>
                  <option value="pet-store">Pet Store</option>
                  <option value="rescue">Rescue</option>
                  <option value="wild-caught">Wild-Caught</option>
                  <option value="bred-by-me">Bred by Me</option>
                  <option value="adopted">Adopted</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Details (optional)
                </label>
                <input
                  type="text"
                  value={formData.sourceDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceDetails: e.target.value }))}
                  placeholder="Breeder/store name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acquisition Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acquisition Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.acquisitionPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Acquisition Notes (optional)
              </label>
              <textarea
                value={formData.acquisitionNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, acquisitionNotes: e.target.value }))}
                rows={2}
                placeholder="Source info, story, breeder contact, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
