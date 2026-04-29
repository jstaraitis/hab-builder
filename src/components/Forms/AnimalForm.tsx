import { useState } from 'react';
import type { Enclosure } from '../../types/careCalendar';
import { animalList } from '../../data/animals';

export interface AnimalFormData {
  enclosureId: string;
  speciesId: string;
  customSpeciesName: string;
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
  speciesId: '',
  customSpeciesName: '',
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
  readonly onDelete?: () => Promise<void>;
}

export function AnimalForm({ mode, initialData, enclosures, speciesName, entityLabel, onSave, onCancel, onDelete }: AnimalFormProps) {
  const [formData, setFormData] = useState<AnimalFormData>({ ...EMPTY_ANIMAL_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await onDelete();
    } catch (err: any) {
      setError(err.message || 'Failed to delete animal.');
    } finally {
      setDeleting(false);
    }
  };

  const photoUploadId = mode === 'edit' ? 'photo-upload-edit' : 'photo-upload';

  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">
          {mode === 'add' ? 'Add Animal' : 'Edit Animal'}
        </h1>
        {(speciesName || entityLabel) && (
          <span className="text-xs text-muted">
            {entityLabel || speciesName}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Photo Section */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Photo</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-32 w-32 rounded-xl border border-divider bg-card-elevated overflow-hidden flex items-center justify-center shrink-0">
              {(photoPreview || formData.photoUrl) ? (
                <img src={photoPreview || formData.photoUrl} alt="Animal preview" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-12 h-12 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-muted">No photo</span>
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
                  className="inline-block px-3 py-1.5 bg-accent hover:bg-accent-dim text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
              {photoFile && (
                <p className="text-xs text-white break-all">
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
                  className="text-xs text-rose-300 hover:underline self-start"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-muted">
                Images will be compressed to under 300KB
              </p>
            </div>
          </div>
        </div>

        {/* Species */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="species-select" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Species</label>
          <select
            id="species-select"
            value={formData.speciesId}
            onChange={(e) => setFormData(prev => ({ ...prev, speciesId: e.target.value, customSpeciesName: '' }))}
            className="w-full bg-card text-white text-sm focus:outline-none"
          >
            <option value="">Select species (optional)</option>
            {animalList.map(animal => (
              <option key={animal.id} value={animal.id}>{animal.name}</option>
            ))}
            <option value="custom">Other / Custom Species</option>
          </select>
          {formData.speciesId === 'custom' && (
            <input
              type="text"
              value={formData.customSpeciesName}
              onChange={(e) => setFormData(prev => ({ ...prev, customSpeciesName: e.target.value }))}
              placeholder="e.g., Green Tree Python"
              className="mt-2 w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted border-t border-divider pt-2"
              autoFocus
            />
          )}
        </div>

        {/* Enclosure */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="enclosure-select" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Enclosure</label>
          <select
            id="enclosure-select"
            value={formData.enclosureId}
            onChange={(e) => {
              const enclosureId = e.target.value;
              const selectedEnc = enclosures.find(enc => enc.id === enclosureId);
              const previousEnc = enclosures.find(enc => enc.id === formData.enclosureId);
              setFormData(prev => ({
                ...prev,
                enclosureId,
                // If species came from the previous enclosure (or was blank), keep it in sync.
                speciesId: !prev.speciesId || prev.speciesId === previousEnc?.animalId
                  ? (selectedEnc?.animalId || '')
                  : prev.speciesId,
                customSpeciesName: !prev.speciesId || prev.speciesId === previousEnc?.animalId
                  ? ''
                  : prev.customSpeciesName,
              }));
            }}
            className="w-full bg-card text-white text-sm focus:outline-none"
          >
            <option value="">No enclosure (optional)</option>
            {enclosures.map(enc => (
              <option key={enc.id} value={enc.id}>
                {enc.name} - {enc.animalName}
              </option>
            ))}
          </select>
        </div>

        {/* Name & Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card-elevated border border-divider rounded-2xl p-4">
            <label htmlFor="animal-name" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Name</label>
            <input
              id="animal-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Kermit (optional)"
              className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
            />
          </div>
          <div className="bg-card-elevated border border-divider rounded-2xl p-4">
            <label htmlFor="animal-number" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Number</label>
            <input
              id="animal-number"
              type="number"
              min="1"
              value={formData.animalNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, animalNumber: e.target.value }))}
              placeholder="e.g., 1 (optional)"
              className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* Gender & Birthday */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card-elevated border border-divider rounded-2xl p-4">
            <label htmlFor="gender-select" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Gender</label>
            <select
              id="gender-select"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'male' | 'female' | 'unknown' }))}
              className="w-full bg-card text-white text-sm focus:outline-none"
            >
              <option value="">Select (optional)</option>
              <option value="male">♂ Male</option>
              <option value="female">♀ Female</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="bg-card-elevated border border-divider rounded-2xl p-4">
            <label htmlFor="birthday-input" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Birthday</label>
            <input
              id="birthday-input"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-card text-white text-sm focus:outline-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Morph */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="morph-input" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Morph/Color</label>
          <input
            id="morph-input"
            type="text"
            value={formData.morph}
            onChange={(e) => setFormData(prev => ({ ...prev, morph: e.target.value }))}
            placeholder="e.g., Snowflake, Albino (optional)"
            className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
          />
        </div>

        {/* Notes */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="notes-textarea" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Notes</label>
          <textarea
            id="notes-textarea"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Special traits, health notes, personality, etc. (optional)"
            className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted resize-none"
          />
        </div>

        {/* Acquisition Section (edit only) */}
        {mode === 'edit' && (
          <>
            <div className="bg-card-elevated border border-divider rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">Acquisition Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="source-select" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Source</label>
                  <select
                    id="source-select"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as AnimalFormData['source'] }))}
                    className="w-full bg-card text-white text-sm focus:outline-none"
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
                  <label htmlFor="source-details" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Source Details</label>
                  <input
                    id="source-details"
                    type="text"
                    value={formData.sourceDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceDetails: e.target.value }))}
                    placeholder="Breeder/store name"
                    className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="acquisition-date" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Acquisition Date</label>
                  <input
                    id="acquisition-date"
                    type="date"
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                    className="w-full bg-card text-white text-sm focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label htmlFor="acquisition-price" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Acquisition Price</label>
                  <input
                    id="acquisition-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.acquisitionPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, acquisitionPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="acquisition-notes" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Acquisition Notes</label>
                <textarea
                  id="acquisition-notes"
                  value={formData.acquisitionNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionNotes: e.target.value }))}
                  rows={2}
                  placeholder="Source info, story, breeder contact, etc."
                  className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg p-4 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={() => handleDelete().catch(console.error)}
              disabled={saving || deleting}
              className="px-3 py-1.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium text-xs"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 border border-divider hover:bg-card-elevated text-muted hover:text-white text-xs font-medium rounded-lg transition-colors"
            disabled={saving || deleting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="flex-1 px-3 py-1.5 bg-accent hover:bg-accent-dim text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {uploadStatus || 'Saving...'}
              </>
            ) : (
              mode === 'add' ? 'Add Animal' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
