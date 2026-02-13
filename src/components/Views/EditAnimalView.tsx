import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { uploadAnimalPhoto, deleteAnimalPhoto } from '../../services/animalPhotoService';
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
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>(''); // Track original photo URL

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
    acquisitionNotes: '',
    photoUrl: ''
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
        setOriginalPhotoUrl(animalData.photoUrl || ''); // Store original photo URL
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
          acquisitionNotes: animalData.acquisitionNotes || '',
          photoUrl: animalData.photoUrl || ''
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
      setUploadStatus('');

      let photoUrl: string | null | undefined = formData.photoUrl || null;

      // If uploading a new photo and there's an old one, delete the old one from storage
      if (photoFile && originalPhotoUrl) {
        setUploadStatus('Removing old photo...');
        await deleteAnimalPhoto(originalPhotoUrl);
        setUploadStatus('Compressing photo...');
        photoUrl = await uploadAnimalPhoto(user.id, photoFile);
        setUploadStatus('Saving...');
      } else if (photoFile) {
        // Just uploading a new photo (no old photo to replace)
        setUploadStatus('Compressing photo...');
        photoUrl = await uploadAnimalPhoto(user.id, photoFile);
        setUploadStatus('Saving...');
      } else if (!formData.photoUrl && originalPhotoUrl) {
        // Photo was removed (formData.photoUrl is empty but we had an original), delete from storage
        setUploadStatus('Removing photo...');
        await deleteAnimalPhoto(originalPhotoUrl);
        photoUrl = null; // Explicitly set to null to clear the database field
        setUploadStatus('Saving...');
      }

      const updatedData: Partial<EnclosureAnimal> = {
        enclosureId: formData.enclosureId || undefined,
        userId: user.id,
        name: formData.name || undefined,
        animalNumber: formData.animalNumber ? parseInt(formData.animalNumber) : undefined,
        gender: formData.gender || undefined,
        morph: formData.morph || undefined,
        birthday: formData.birthday ? new Date(formData.birthday) : undefined,
        notes: formData.notes || undefined,
        photoUrl,
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
      setUploadStatus('');
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Section */}
          <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Photo 
            </label>
            <div className="flex items-start gap-4">
              <div className="h-32 w-32 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                {photoPreview || formData.photoUrl ? (
                  <img src={photoPreview || formData.photoUrl} alt="Animal preview" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <input
                    type="file"
                    id="photo-upload-edit"
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
                    htmlFor="photo-upload-edit"
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
                
                
                {(photoPreview || formData.photoUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (photoPreview) {
                        URL.revokeObjectURL(photoPreview);
                      }
                      setPhotoPreview('');
                      setPhotoFile(null);
                      setFormData(prev => ({ ...prev, photoUrl: '' }));
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline self-start"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Enclosure 
                </label>
                <select
                  value={formData.enclosureId}
                  onChange={(e) => setFormData(prev => ({ ...prev, enclosureId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                >
                  <option value="">No enclosure</option>
                  {enclosures.map(enc => (
                    <option key={enc.id} value={enc.id}>
                      {enc.name} - {enc.animalName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name 
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Kermit"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Animal Number 
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.animalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, animalNumber: e.target.value }))}
                  placeholder="e.g., 1"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Gender 
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'male' | 'female' | 'unknown' }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select gender...</option>
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Birthday/Hatch Date 
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Morph 
                </label>
                <input
                  type="text"
                  value={formData.morph}
                  onChange={(e) => setFormData(prev => ({ ...prev, morph: e.target.value }))}
                  placeholder="e.g., Albino, Leucistic"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes 
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Special traits, health notes, etc."
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Acquisition Information Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Acquisition Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Source 
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as any }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Source Details 
                </label>
                <input
                  type="text"
                  value={formData.sourceDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceDetails: e.target.value }))}
                  placeholder="Breeder/store name"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Acquisition Date 
                </label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Acquisition Price 
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.acquisitionPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Acquisition Notes 
              </label>
              <textarea
                value={formData.acquisitionNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, acquisitionNotes: e.target.value }))}
                rows={2}
                placeholder="Source info, story, breeder contact, etc."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 font-medium flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{uploadStatus || 'Saving...'}</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
