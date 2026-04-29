import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { uploadAnimalPhoto, deleteAnimalPhoto } from '../../services/animalPhotoService';
import { enclosureService } from '../../services/enclosureService';
import type { EnclosureAnimal, Enclosure } from '../../types/careCalendar';
import { AnimalForm, type AnimalFormData } from '../Forms/AnimalForm';
import { animalList } from '../../data/animals';

export function EditAnimalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/my-animals';
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<AnimalFormData> | null>(null);
  const [entityLabel, setEntityLabel] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');

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
          setEnclosures(enclosuresData);
          return;
        }

        setEnclosures(enclosuresData);
        setOriginalPhotoUrl(animalData.photoUrl || '');
        setEntityLabel(animalData.name || `Animal #${animalData.animalNumber || '?'}`);
        setInitialData({
          enclosureId: animalData.enclosureId || '',
          speciesId: animalData.speciesId || '',
          customSpeciesName: animalData.speciesId === 'custom' ? (animalData.speciesName || '') : '',
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
      } catch {
        if (isMounted) setError('Failed to load animal.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id, user]);

  const handleSave = async (formData: AnimalFormData, photoFile: File | null) => {
    if (!user || !id) return;

    let photoUrl: string | null | undefined = formData.photoUrl || null;

    if (photoFile && originalPhotoUrl) {
      await deleteAnimalPhoto(originalPhotoUrl);
      photoUrl = await uploadAnimalPhoto(user.id, photoFile);
    } else if (photoFile) {
      photoUrl = await uploadAnimalPhoto(user.id, photoFile);
    } else if (!formData.photoUrl && originalPhotoUrl) {
      await deleteAnimalPhoto(originalPhotoUrl);
      photoUrl = null;
    }

    const updatedData: Partial<EnclosureAnimal> = {
      enclosureId: formData.enclosureId,
      userId: user.id,
      speciesId: formData.speciesId === 'custom' ? 'custom' : (formData.speciesId || undefined),
      speciesName: formData.speciesId === 'custom'
        ? (formData.customSpeciesName.trim() || undefined)
        : (formData.speciesId ? (animalList.find(a => a.id === formData.speciesId)?.name || undefined) : undefined),
      name: formData.name || undefined,
      animalNumber: formData.animalNumber ? Number.parseInt(formData.animalNumber, 10) : undefined,
      gender: formData.gender || undefined,
      morph: formData.morph || undefined,
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      notes: formData.notes || undefined,
      photoUrl,
      source: formData.source || undefined,
      sourceDetails: formData.sourceDetails || undefined,
      acquisitionDate: formData.acquisitionDate ? new Date(formData.acquisitionDate) : undefined,
      acquisitionPrice: formData.acquisitionPrice ? Number.parseFloat(formData.acquisitionPrice) : undefined,
      acquisitionNotes: formData.acquisitionNotes || undefined,
      isActive: true
    };

    await enclosureAnimalService.updateAnimal(id, updatedData);
    navigate(returnTo);
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!confirm(`Delete ${entityLabel || 'this animal'}? This cannot be undone.`)) {
      return;
    }

    if (originalPhotoUrl) {
      try {
        await deleteAnimalPhoto(originalPhotoUrl);
      } catch {
        // Ignore storage cleanup failure and continue deleting the animal record
      }
    }

    await enclosureAnimalService.deleteAnimal(id);
    navigate(returnTo);
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

  if (error || !initialData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-200">
          {error || 'Animal not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium"
        >
          Back
        </button>
      </div>
      <AnimalForm
        mode="edit"
        initialData={initialData}
        enclosures={enclosures}
        entityLabel={entityLabel}
        onSave={handleSave}
        onCancel={() => navigate(returnTo)}
        onDelete={handleDelete}
      />
    </div>
  );
}
