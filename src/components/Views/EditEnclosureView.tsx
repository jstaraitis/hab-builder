import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { uploadEnclosurePhoto, deleteEnclosurePhoto } from '../../services/enclosurePhotoService';
import { animalList } from '../../data/animals';
import { EnclosureFormCRUD, type EnclosureFormData } from '../Forms/EnclosureFormCRUD';

export function EditEnclosureView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<EnclosureFormData> | null>(null);
  const [entityLabel, setEntityLabel] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');

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
          return;
        }

        const isCustom = data.animalId === 'custom';
        setEntityLabel(data.name);
        setOriginalPhotoUrl(data.photoUrl || '');
        setInitialData({
          name: data.name,
          animalId: data.animalId,
          customSpeciesName: isCustom ? data.animalName : '',
          photoUrl: data.photoUrl || '',
          description: data.description || '',
          substrateType: data.substrateType || ''
        });
      } catch {
        if (isMounted) setError('Failed to load enclosure.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEnclosure();
    return () => { isMounted = false; };
  }, [id]);

  const handleCancel = () => {
    if (returnTo) { navigate(returnTo); } else { navigate(-1); }
  };

  const handleSave = async (formData: EnclosureFormData, photoFile: File | null) => {
    if (!user || !id) return;

    const isCustomSpecies = formData.animalId === 'custom';
    const selectedAnimal = animalList.find(a => a.id === formData.animalId);
    const animalId = isCustomSpecies ? 'custom' : formData.animalId;
    const animalName = isCustomSpecies
      ? formData.customSpeciesName.trim()
      : (selectedAnimal?.name || 'Unknown Species');

    let photoUrl: string | undefined = formData.photoUrl;

    if (photoFile) {
      if (originalPhotoUrl) {
        try { await deleteEnclosurePhoto(originalPhotoUrl); } catch { /* ignore */ }
      }
      photoUrl = await uploadEnclosurePhoto(user.id, photoFile);
    }

    await enclosureService.updateEnclosure(id, {
      name: formData.name,
      animalId,
      animalName,
      photoUrl: photoUrl || undefined,
      description: formData.description || undefined,
      substrateType: formData.substrateType || undefined
    });

    navigate(returnTo || '/care-calendar');
  };

  const handleDelete = async () => {
    if (!id) return;
    await enclosureService.deleteEnclosure(id);
    navigate(returnTo || '/care-calendar');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card border border-divider rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading enclosure...
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-200">
          {error || 'Enclosure not found.'}
        </div>
      </div>
    );
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
      <EnclosureFormCRUD
        mode="edit"
        initialData={initialData}
        entityLabel={entityLabel}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </div>
  );
}

