import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { uploadAnimalPhoto } from '../../services/animalPhotoService';
import { enclosureService } from '../../services/enclosureService';
import type { Enclosure, EnclosureAnimal } from '../../types/careCalendar';
import { AnimalForm, type AnimalFormData } from '../Forms/AnimalForm';
import { PremiumPaywall } from '../Upgrade/PremiumPaywall';

import { animalList } from '../../data/animals';

export function AddAnimalView() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [atAnimalLimit, setAtAnimalLimit] = useState(false);

  const speciesName = searchParams.get('speciesName') || '';
  const returnTo = searchParams.get('returnTo') || '';
  const initialEnclosureId = searchParams.get('enclosureId') || '';

  useEffect(() => {
    let isMounted = true;

    const loadEnclosures = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [data, existingAnimals] = await Promise.all([
          enclosureService.getEnclosures(user.id),
          enclosureAnimalService.getAllUserAnimals(user.id),
        ]);
        if (isMounted) {
          setEnclosures(data);
          if (!isPremium && existingAnimals.length >= 1) {
            setAtAnimalLimit(true);
          }
        }
      } catch {
        // enclosures are optional, silently fail
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEnclosures();
    return () => { isMounted = false; };
  }, [user]);

  const handleCancel = () => {
    if (returnTo) { navigate(returnTo); } else { navigate(-1); }
  };

  const handleSave = async (formData: AnimalFormData, photoFile: File | null) => {
    if (!user) throw new Error('User not authenticated');

    let photoUrl: string | undefined;
    if (photoFile) {
      photoUrl = await uploadAnimalPhoto(user.id, photoFile);
    }

    const animalData: Partial<EnclosureAnimal> = {
      enclosureId: formData.enclosureId,
      userId: user.id,
      speciesId: formData.speciesId === 'custom' ? 'custom' : (formData.speciesId || undefined),
      speciesName: formData.speciesId === 'custom'
        ? (formData.customSpeciesName.trim() || undefined)
        : (formData.speciesId ? (animalList.find(a => a.id === formData.speciesId)?.name || undefined) : undefined),
      name: formData.name || undefined,
      animalNumber: formData.animalNumber ? parseInt(formData.animalNumber) : undefined,
      gender: formData.gender || undefined,
      morph: formData.morph || undefined,
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      notes: formData.notes || undefined,
      photoUrl,
      isActive: true
    };

    await enclosureAnimalService.createAnimal(animalData);
    navigate(returnTo || '/my-animals');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading form...
        </div>
      </div>
    );
  }

  if (atAnimalLimit) {
    return <PremiumPaywall />;
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
      <AnimalForm
        mode="add"
        initialData={{ enclosureId: initialEnclosureId, speciesId: enclosures.find(e => e.id === initialEnclosureId)?.animalId || '' }}
        enclosures={enclosures}
        speciesName={speciesName}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
