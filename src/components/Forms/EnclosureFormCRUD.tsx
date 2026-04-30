import { useState } from 'react';
import { animalList } from '../../data/animals';

type SubstrateType = '' | 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other';

export interface EnclosureFormData {
  name: string;
  animalId: string;
  customSpeciesName: string;
  photoUrl: string;
  description: string;
  substrateType: SubstrateType;
  hasUVB: boolean;
}

export const EMPTY_ENCLOSURE_FORM: EnclosureFormData = {
  name: '',
  animalId: '',
  customSpeciesName: '',
  photoUrl: '',
  description: '',
  substrateType: '',
  hasUVB: false
};

interface EnclosureFormCRUDProps {
  readonly mode: 'add' | 'edit';
  readonly initialData?: Partial<EnclosureFormData>;
  readonly entityLabel?: string;
  readonly onSave: (formData: EnclosureFormData, photoFile: File | null) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDelete?: () => Promise<void>;
}

export function EnclosureFormCRUD({ mode, initialData, entityLabel, onSave, onCancel, onDelete }: EnclosureFormCRUDProps) {
  const [formData, setFormData] = useState<EnclosureFormData>({ ...EMPTY_ENCLOSURE_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoUrl || '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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

    try {
      setSaving(true);
      setError(null);
      setUploadStatus(photoFile ? 'Compressing photo...' : '');
      await onSave(formData, photoFile);
    } catch (err) {
      console.error('Failed to save enclosure:', err);
      setError('Failed to save enclosure');
    } finally {
      setSaving(false);
      setUploadStatus('');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Delete "${formData.name}"? All associated care tasks will also be permanently deleted.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await onDelete();
    } catch (err) {
      console.error('Failed to delete enclosure:', err);
      setError('Failed to delete enclosure');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card border border-divider rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">
          {mode === 'add' ? 'Add Enclosure' : 'Edit Enclosure'}
        </h1>
        {entityLabel && (
          <span className="text-xs text-muted">{entityLabel}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Photo Section */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Photo</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-32 w-32 rounded-xl border border-divider bg-card-elevated overflow-hidden flex items-center justify-center shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Enclosure preview" className="h-full w-full object-cover" />
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
                  id="photo-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (photoPreview && photoPreview !== formData.photoUrl) {
                      URL.revokeObjectURL(photoPreview);
                    }
                    setPhotoFile(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : (formData.photoUrl || ''));
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-block px-3 py-1.5 bg-accent hover:bg-accent-dim text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
              {photoFile && (
                <p className="text-xs text-white break-all">{photoFile.name}</p>
              )}
              <p className="text-xs text-muted">Images will be compressed to under 300KB</p>
            </div>
          </div>
        </div>

        {/* Enclosure Name */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="enclosure-name" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Enclosure Name <span className="text-rose-400">*</span></label>
          <input
            id="enclosure-name"
            name="enclosureName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Main Frog Tank, Gecko Enclosure #1"
            className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
            required
          />
        </div>

        {/* Animal Species */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="enclosure-animal" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Animal Species <span className="text-rose-400">*</span></label>
          <select
            id="enclosure-animal"
            name="animalSpecies"
            value={formData.animalId}
            onChange={(e) => setFormData(prev => ({ ...prev, animalId: e.target.value, customSpeciesName: '' }))}
            className="w-full bg-card text-white text-sm focus:outline-none"
            required
          >
            <option value="">Select species...</option>
            {animalList.map(animal => (
              <option key={animal.id} value={animal.id}>{animal.name}</option>
            ))}
            <option value="custom">Other/Custom Species</option>
          </select>
        </div>

        {/* Custom Species Name */}
        {formData.animalId === 'custom' && (
          <div className="bg-card-elevated border border-divider rounded-2xl p-4">
            <label htmlFor="enclosure-custom-species" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Custom Species Name <span className="text-rose-400">*</span></label>
            <input
              id="enclosure-custom-species"
              name="customSpeciesName"
              type="text"
              value={formData.customSpeciesName}
              onChange={(e) => setFormData(prev => ({ ...prev, customSpeciesName: e.target.value }))}
              placeholder="e.g., Ball Python, Red-Eared Slider"
              className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted"
              required
            />
          </div>
        )}

        {/* Substrate Type */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="enclosure-substrate" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Substrate Type</label>
          <select
            id="enclosure-substrate"
            name="substrateType"
            value={formData.substrateType}
            onChange={(e) => setFormData(prev => ({ ...prev, substrateType: e.target.value as SubstrateType }))}
            className="w-full bg-card text-white text-sm focus:outline-none"
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

        {/* UVB Lighting */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">UVB Lighting</p>
              <p className="text-xs text-muted mt-0.5">Enables weekly UVB output check reminders</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, hasUVB: !prev.hasUVB }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.hasUVB ? 'bg-accent' : 'bg-divider'
              }`}
              aria-checked={formData.hasUVB}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.hasUVB ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card-elevated border border-divider rounded-2xl p-4">
          <label htmlFor="enclosure-description" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Description (optional)</label>
          <textarea
            id="enclosure-description"
            name="enclosureDescription"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Notes about this enclosure..."
            className="w-full bg-card text-white text-sm focus:outline-none placeholder:text-muted resize-none"
          />
        </div>

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
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 border border-divider hover:bg-card-elevated text-muted hover:text-white text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
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
              mode === 'add' ? 'Add Enclosure' : 'Save Changes'
            )}
          </button>
        </div>

        {/* Delete Button (Edit mode) */}
        {mode === 'edit' && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full px-3 py-1.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-60 font-medium text-xs"
          >
            {deleting ? 'Deleting...' : 'Delete Enclosure'}
          </button>
        )}
      </form>
    </div>
  );
}
