import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { uploadEnclosurePhoto } from '../../services/enclosurePhotoService';
import { animalList } from '../../data/animals';
import { EnclosureFormCRUD, type EnclosureFormData } from '../Forms/EnclosureFormCRUD';

export function AddEnclosureView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const handleCancel = () => {
    if (returnTo) { navigate(returnTo); } else { navigate(-1); }
  };

  const handleSave = async (formData: EnclosureFormData, photoFile: File | null) => {
    if (!user) throw new Error('User not authenticated');

    const isCustomSpecies = formData.animalId === 'custom';
    const selectedAnimal = animalList.find(a => a.id === formData.animalId);
    const animalId = isCustomSpecies ? 'custom' : formData.animalId;
    const animalName = isCustomSpecies
      ? formData.customSpeciesName.trim()
      : (selectedAnimal?.name || 'Unknown Species');

    let photoUrl: string | undefined;
    if (photoFile) {
      photoUrl = await uploadEnclosurePhoto(user.id, photoFile);
    }

    await enclosureService.createEnclosure({
      userId: user.id,
      name: formData.name,
      animalId,
      animalName,
      photoUrl: photoUrl || undefined,
      description: formData.description || undefined,
      substrateType: formData.substrateType || undefined,
      isActive: true
    });

    navigate(returnTo || '/care-calendar');
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
      <EnclosureFormCRUD mode="add" onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
