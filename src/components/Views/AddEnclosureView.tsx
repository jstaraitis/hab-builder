import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { enclosureService } from '../../services/enclosureService';
import { careTaskService } from '../../services/careTaskService';
import { uploadEnclosurePhoto } from '../../services/enclosurePhotoService';
import { buildTasksFromEnclosureById } from '../../services/enclosureTaskBuilder';
import { animalList } from '../../data/animals';
import { EnclosureFormCRUD, type EnclosureFormData } from '../Forms/EnclosureFormCRUD';
import { PremiumPaywall } from '../Upgrade/PremiumPaywall';
import type { Enclosure } from '../../types/careCalendar';

export function AddEnclosureView() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [atEnclosureLimit, setAtEnclosureLimit] = useState(false);
  const [limitChecked, setLimitChecked] = useState(false);

  // Task setup prompt state
  const [createdEnclosure, setCreatedEnclosure] = useState<Enclosure | null>(null);
  const [suggestedTaskCount, setSuggestedTaskCount] = useState(0);
  const [settingUpTasks, setSettingUpTasks] = useState(false);

  useEffect(() => {
    if (!user) return;
    enclosureService.getEnclosures(user.id).then(enclosures => {
      if (!isPremium && enclosures.length >= 1) {
        setAtEnclosureLimit(true);
      }
      setLimitChecked(true);
    }).catch(() => setLimitChecked(true));
  }, [user, isPremium]);

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

    const enclosure = await enclosureService.createEnclosure({
      userId: user.id,
      name: formData.name,
      animalId,
      animalName,
      photoUrl: photoUrl || undefined,
      description: formData.description || undefined,
      substrateType: formData.substrateType || undefined,
      uvbBulbInstalledOn: formData.hasUVB ? new Date() : undefined,
      isActive: true
    });

    // Preview how many tasks would be generated, then prompt
    const tasks = await buildTasksFromEnclosureById(enclosure, user.id);
    if (tasks && tasks.length > 0) {
      setCreatedEnclosure(enclosure);
      setSuggestedTaskCount(tasks.length);
    } else {
      navigate(returnTo || '/care-calendar');
    }
  };

  const handleSetUpTasks = async () => {
    if (!createdEnclosure || !user) return;
    setSettingUpTasks(true);
    try {
      const tasks = await buildTasksFromEnclosureById(createdEnclosure, user.id);
      if (tasks) {
        for (const task of tasks) {
          await careTaskService.createTask(task);
        }
      }
    } catch (err) {
      console.error('Failed to create tasks:', err);
    } finally {
      navigate(returnTo || '/care-calendar');
    }
  };

  const handleSkipTasks = () => {
    navigate(returnTo || '/care-calendar');
  };

  if (!limitChecked) return null;

  if (atEnclosureLimit) {
    return <PremiumPaywall />;
  }

  // Task setup prompt — shown after enclosure is saved
  if (createdEnclosure) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Enclosure Created!</h2>
          <p className="text-muted text-sm">
            Set up <span className="text-white font-semibold">{suggestedTaskCount} recommended care tasks</span> for{' '}
            <span className="text-white font-semibold">{createdEnclosure.name}</span>?
          </p>
          <p className="text-muted text-xs mt-1">Based on {createdEnclosure.animalName} care requirements. You can edit or remove tasks at any time.</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={handleSetUpTasks}
            disabled={settingUpTasks}
            className="w-full px-4 py-3 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {settingUpTasks ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating tasks…
              </>
            ) : (
              `Set Up ${suggestedTaskCount} Care Tasks`
            )}
          </button>
          <button
            onClick={handleSkipTasks}
            disabled={settingUpTasks}
            className="w-full px-4 py-3 border border-divider text-muted hover:text-white text-sm font-medium rounded-2xl transition-colors disabled:opacity-60"
          >
            Skip for now
          </button>
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
      <EnclosureFormCRUD mode="add" onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}

