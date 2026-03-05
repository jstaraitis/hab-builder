import { useState } from 'react';
import type { Enclosure } from '../../types/careCalendar';

export interface AnimalFormData {
  enclosureId: string;
  name: string;
  animalNumber: string;
  gender: '' | 'male' | 'female' | 'unknown';
  morph: string;
  birthday: string;
  notes: string;
  // Edit-only: acquisition fields
  source: '' | 'breeder' | 'pet-store' | 'rescue' | 'wild-caught' | 'bred-by-me' | 'adopted' | 'other';
  sourceDetails: string;
  acquisitionDate: string;
  acquisitionPrice: string;
  acquisitionNotes: string;
  photoUrl: string;
}

export const EMPTY_ANIMAL_FORM: AnimalFormData = {
  enclosureId: '',
  name: '',
  animalNumber: '',
  gender: '',
  morph: '',
  birthday: '',
  notes: '',
  source: '',
  sourceDetails: '',
  acquisitionDate: '',
  acquisitionPrice: '',
  acquisitionNotes: '',
  photoUrl: ''
};

interface AnimalFormProps {
  readonly mode: 'add' | 'edit';
  readonly initialData?: Partial<AnimalFormData>;
  readonly enclosures: Enclosure[];
  readonly speciesName?: string;
  readonly entityLabel?: string; // e.g., "Kermit" or "Animal #2" for edit header
  readonly onSave: (formData: AnimalFormData, photoFile: File | null) => Promise<void>;
  readonly onCancel: () => void;
}

export function AnimalForm({ mode, initialData, enclosures, speciesName, entityLabel, onSave, onCancel }: AnimalFormProps) {
  const [formData, setFormData] = useState<AnimalFormData>({ ...EMPTY_ANIMAL_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setUploadStatus(photoFile ? 'Compressing photo...' : '');
      await onSave(formData, photoFile);
    } catch (err: any) {
      setError(err.message || 'Failed to save animal.');
    } finally {
      setSaving(false);
      setUploadStatus('');
    }
  };

  const photoUploadId = mode === 'edit' ? 'photo-upload-edit' : 'photo-upload';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'add' ? 'Add Animal' : 'Edit Animal'}
        </h1>
        {(speciesName || entityLabel) && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {entityLabel || speciesName}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Photo Section */}
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Photo
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-32 w-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
              {(photoPreview || formData.photoUrl) ? (
                <img src={photoPreview || formData.photoUrl} alt="Animal preview" className="h-full w-full object-cover" />
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
                  id={photoUploadId}
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
                  htmlFor={photoUploadId}
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
              {mode === 'edit' && (photoPreview || formData.photoUrl) && (
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Images will be compressed to under 300KB
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enclosure</label>
            <select
              value={formData.enclosureId}
              onChange={(e) => setFormData(prev => ({ ...prev, enclosureId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">No enclosure (optional)</option>
              {enclosures.map(enc => (
                <option key={enc.id} value={enc.id}>
                  {enc.name} - {enc.animalName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Kermit (optional)"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number</label>
              <input
                type="number"
                min="1"
                value={formData.animalNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, animalNumber: e.target.value }))}
                placeholder="e.g., 1 (optional)"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'male' | 'female' | 'unknown' }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">Select (optional)</option>
                <option value="male">♂ Male</option>
                <option value="female">♀ Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birthday</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Birth/hatch date (optional)</p>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Morph/Color</label>
            <input
              type="text"
              value={formData.morph}
              onChange={(e) => setFormData(prev => ({ ...prev, morph: e.target.value }))}
              placeholder="e.g., Snowflake, Albino (optional)"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Special traits, health notes, personality, etc. (optional)"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Acquisition Section (edit only) */}
        {mode === 'edit' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Acquisition Information</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as AnimalFormData['source'] }))}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source Details</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Acquisition Date</label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Acquisition Price</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Acquisition Notes</label>
              <textarea
                value={formData.acquisitionNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, acquisitionNotes: e.target.value }))}
                rows={2}
                placeholder="Source info, story, breeder contact, etc."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>
        )}

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
            onClick={onCancel}
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
              mode === 'add' ? 'Add Animal' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
