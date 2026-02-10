import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { animalList } from '../../data/animals';

export function AddEnclosureView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [formData, setFormData] = useState({
    name: '',
    animalId: '',
    customSpeciesName: '',
    description: '',
    substrateType: '' as '' | 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const isCustomSpecies = formData.animalId === 'custom';
    if (isCustomSpecies && !formData.customSpeciesName.trim()) {
      setError('Please enter a custom species name');
      return;
    }

    const selectedAnimal = animalList.find(a => a.id === formData.animalId);
    if (!selectedAnimal && !isCustomSpecies) {
      setError('Please select a species');
      return;
    }

    const animalId = isCustomSpecies ? 'custom' : formData.animalId;
    const animalName = isCustomSpecies ? formData.customSpeciesName.trim() : selectedAnimal!.name;

    try {
      setSaving(true);
      setError(null);

      await enclosureService.createEnclosure({
        userId: user.id,
        name: formData.name,
        animalId: animalId,
        animalName: animalName,
        description: formData.description || undefined,
        substrateType: formData.substrateType || undefined,
        isActive: true
      });

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/care-calendar');
      }
    } catch (err) {
      console.error('Failed to save enclosure:', err);
      setError('Failed to save enclosure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium"
        >
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Add Enclosure
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enclosure Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Frog Tank, Gecko Enclosure #1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Animal Species *
            </label>
            <select
              value={formData.animalId}
              onChange={(e) => setFormData(prev => ({ ...prev, animalId: e.target.value, customSpeciesName: '' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select species...</option>
              {animalList.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.name}
                </option>
              ))}
              <option value="custom">Other/Custom Species</option>
            </select>
          </div>

          {formData.animalId === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Species Name *
              </label>
              <input
                type="text"
                value={formData.customSpeciesName}
                onChange={(e) => setFormData(prev => ({ ...prev, customSpeciesName: e.target.value }))}
                placeholder="e.g., Ball Python, Red-Eared Slider"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Substrate Type
            </label>
            <select
              value={formData.substrateType}
              onChange={(e) => setFormData(prev => ({ ...prev, substrateType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select...</option>
              <option value="bioactive">Bioactive</option>
              <option value="soil">Soil</option>
              <option value="paper">Paper</option>
              <option value="sand">Sand</option>
              <option value="reptile-carpet">Reptile Carpet</option>
              <option value="tile">Tile</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Notes about this enclosure..."
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
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add Enclosure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
