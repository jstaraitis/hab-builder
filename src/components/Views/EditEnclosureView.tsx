import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { animalList } from '../../data/animals';
import type { Enclosure } from '../../types/careCalendar';

export function EditEnclosureView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enclosure, setEnclosure] = useState<Enclosure | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    animalId: '',
    customSpeciesName: '',
    description: '',
    substrateType: '' as '' | 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other'
  });

  useEffect(() => {
    let isMounted = true;

    const loadEnclosure = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await enclosureService.getEnclosureById(id);
        if (!isMounted) return;
        if (!data) {
          setError('Enclosure not found.');
          setEnclosure(null);
          return;
        }

        setEnclosure(data);
        const isCustom = data.animalId === 'custom';
        setFormData({
          name: data.name,
          animalId: data.animalId,
          customSpeciesName: isCustom ? data.animalName : '',
          description: data.description || '',
          substrateType: data.substrateType || ''
        });
      } catch (err) {
        if (isMounted) {
          setError('Failed to load enclosure.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEnclosure();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !id) return;

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

      await enclosureService.updateEnclosure(id, {
        name: formData.name,
        animalId: animalId,
        animalName: animalName,
        description: formData.description || undefined,
        substrateType: formData.substrateType || undefined
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

  const handleDelete = async () => {
    if (!id || !enclosure) return;
    if (!confirm(`Delete "${enclosure.name}"? All associated care tasks will also be permanently deleted.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await enclosureService.deleteEnclosure(id);

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/care-calendar');
      }
    } catch (err) {
      console.error('Failed to delete enclosure:', err);
      setError('Failed to delete enclosure');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading enclosure...
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

  if (!enclosure) {
    return null;
  }

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
            Edit Enclosure
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {enclosure.name}
          </span>
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full px-4 py-2 border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete Enclosure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
