import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { uploadEnclosurePhoto } from '../../services/enclosurePhotoService';
import { animalList } from '../../data/animals';

type SubstrateType = '' | 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other';

export function AddEnclosureView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [formData, setFormData] = useState<{
    name: string;
    animalId: string;
    customSpeciesName: string;
    photoUrl: string;
    description: string;
    substrateType: SubstrateType;
  }>({
    name: '',
    animalId: '',
    customSpeciesName: '',
    photoUrl: '',
    description: '',
    substrateType: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

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
    const animalName = isCustomSpecies
      ? formData.customSpeciesName.trim()
      : (selectedAnimal?.name || 'Unknown Species');

    try {
      setSaving(true);
      setError(null);
      setUploadStatus('');

      let photoUrl: string | undefined = formData.photoUrl;

      if (photoFile) {
        setUploadStatus('Compressing photo...');
        photoUrl = await uploadEnclosurePhoto(user.id, photoFile);
        setUploadStatus('Saving...');
      }

      await enclosureService.createEnclosure({
        userId: user.id,
        name: formData.name,
        animalId: animalId,
        animalName: animalName,
        photoUrl: photoUrl || undefined,
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
      setUploadStatus('');
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Section */}
          <fieldset className="pb-6 border-b border-gray-200 dark:border-gray-700">
            <legend className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Photo
            </legend>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-32 w-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Enclosure preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-400 dark:text-gray-500">No photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (photoPreview) {
                        URL.revokeObjectURL(photoPreview);
                      }
                      setPhotoFile(file);
                      setPhotoPreview(file ? URL.createObjectURL(file) : '');
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-block px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                </div>
                {photoFile && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                    {photoFile.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Images will be compressed to under 300KB
                </p>
              </div>
            </div>
          </fieldset>

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            <div>
              <label htmlFor="enclosure-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enclosure Name *
              </label>
              <input
                id="enclosure-name"
                name="enclosureName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Frog Tank, Gecko Enclosure #1"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="enclosure-animal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Animal Species *
              </label>
              <select
                id="enclosure-animal"
                name="animalSpecies"
                value={formData.animalId}
                onChange={(e) => setFormData(prev => ({ ...prev, animalId: e.target.value, customSpeciesName: '' }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                <label htmlFor="enclosure-custom-species" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Species Name *
                </label>
                <input
                  id="enclosure-custom-species"
                  name="customSpeciesName"
                  type="text"
                  value={formData.customSpeciesName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSpeciesName: e.target.value }))}
                  placeholder="e.g., Ball Python, Red-Eared Slider"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="enclosure-substrate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Substrate Type
              </label>
              <select
                id="enclosure-substrate"
                name="substrateType"
                value={formData.substrateType}
                onChange={(e) => setFormData(prev => ({ ...prev, substrateType: e.target.value as SubstrateType }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
              <label htmlFor="enclosure-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="enclosure-description"
                name="enclosureDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Notes about this enclosure..."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {uploadStatus || 'Saving...'}
                </span>
              ) : (
                'Add Enclosure'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
