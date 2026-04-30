import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Turtle, CalendarCheck, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { careTaskService } from '../../services/careTaskService';
import { uploadEnclosurePhoto } from '../../services/enclosurePhotoService';
import { uploadAnimalPhoto } from '../../services/animalPhotoService';
import { buildTasksFromEnclosureById } from '../../services/enclosureTaskBuilder';
import { animalList } from '../../data/animals';
import { EnclosureFormCRUD, EMPTY_ENCLOSURE_FORM, type EnclosureFormData } from '../Forms/EnclosureFormCRUD';
import { AnimalForm, EMPTY_ANIMAL_FORM, type AnimalFormData } from '../Forms/AnimalForm';
import type { Enclosure } from '../../types/careCalendar';

type Step = 'welcome' | 'enclosure' | 'animal' | 'tasks' | 'done';

const STORAGE_KEY = 'hab:onboarding:v1:complete';

export function markOnboardingComplete() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function hasCompletedOnboarding() {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'enclosure', label: 'Enclosure', icon: Home },
  { id: 'animal', label: 'Animal', icon: Turtle },
  { id: 'tasks', label: 'Tasks', icon: CalendarCheck },
];

function StepIndicator({ current }: { current: Step }) {
  const order: Step[] = ['enclosure', 'animal', 'tasks', 'done'];
  const currentIndex = order.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, i) => {
        const stepIndex = order.indexOf(step.id);
        const isDone = stepIndex < currentIndex;
        const isActive = stepIndex === currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              isDone ? 'bg-accent text-on-accent' :
              isActive ? 'bg-accent/20 text-accent border-2 border-accent' :
              'bg-card border border-divider text-muted'
            }`}>
              {isDone ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-white' : isDone ? 'text-accent' : 'text-muted'}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('welcome');
  const [createdEnclosure, setCreatedEnclosure] = useState<Enclosure | null>(null);
  const [suggestedTaskCount, setSuggestedTaskCount] = useState(0);
  const [settingUpTasks, setSettingUpTasks] = useState(false);
  const [skippedAnimal, setSkippedAnimal] = useState(false);

  // ─── Enclosure save ─────────────────────────────────────────────────────────
  const handleEnclosureSave = async (formData: EnclosureFormData, photoFile: File | null) => {
    if (!user) throw new Error('Not authenticated');

    const isCustom = formData.animalId === 'custom';
    const selected = animalList.find(a => a.id === formData.animalId);
    const animalId = isCustom ? 'custom' : formData.animalId;
    const animalName = isCustom
      ? formData.customSpeciesName.trim()
      : (selected?.name || 'Unknown Species');

    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadEnclosurePhoto(user.id, photoFile);

    const enclosure = await enclosureService.createEnclosure({
      userId: user.id,
      name: formData.name,
      animalId,
      animalName,
      photoUrl,
      description: formData.description || undefined,
      substrateType: formData.substrateType || undefined,
      uvbBulbInstalledOn: formData.hasUVB ? new Date() : undefined,
      isActive: true,
    });

    setCreatedEnclosure(enclosure);
    setStep('animal');
  };

  // ─── Animal save ─────────────────────────────────────────────────────────────
  const handleAnimalSave = async (formData: AnimalFormData, photoFile: File | null) => {
    if (!user || !createdEnclosure) throw new Error('No enclosure');

    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadAnimalPhoto(user.id, photoFile);

    const isCustomSpecies = !formData.speciesId || formData.speciesId === 'custom';
    const selected = animalList.find(a => a.id === formData.speciesId);
    const speciesName = isCustomSpecies
      ? formData.customSpeciesName.trim()
      : (selected?.name || createdEnclosure.animalName);

    await enclosureAnimalService.createAnimal({
      userId: user.id,
      enclosureId: createdEnclosure.id,
      speciesId: formData.speciesId === 'custom' ? 'custom' : (formData.speciesId || undefined),
      name: formData.name.trim() || undefined,
      speciesName,
      gender: formData.gender || undefined,
      morph: formData.morph.trim() || undefined,
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      notes: formData.notes.trim() || undefined,
      photoUrl,
      isActive: true,
    });

    await goToTasks();
  };

  // ─── Task setup ──────────────────────────────────────────────────────────────
  const goToTasks = async () => {
    if (!createdEnclosure || !user) { finishOnboarding(); return; }

    const tasks = await buildTasksFromEnclosureById(createdEnclosure, user.id);
    if (tasks && tasks.length > 0) {
      setSuggestedTaskCount(tasks.length);
      setStep('tasks');
    } else {
      finishOnboarding();
    }
  };

  const handleSetUpTasks = async () => {
    if (!createdEnclosure || !user) { finishOnboarding(); return; }
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
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    markOnboardingComplete();
    setStep('done');
  };

  const handleDone = () => {
    navigate('/care-calendar');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">🦎</div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Habitat Builder</h1>
            <p className="text-muted text-sm leading-relaxed">
              Let's get your first enclosure set up so you can start tracking care tasks, monitoring your animal's health, and never miss a feeding.
            </p>
          </div>

          <div className="bg-card border border-divider rounded-2xl p-4 text-left space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Step {i + 1}: {s.label === 'Enclosure' ? 'Create your enclosure' : s.label === 'Animal' ? 'Add your animal' : 'Generate care tasks'}</p>
                  <p className="text-xs text-muted">
                    {s.label === 'Enclosure' && 'Name it, pick the species, and set up the basics.'}
                    {s.label === 'Animal' && 'Add your pet\'s name, gender, morph, and birthday.'}
                    {s.label === 'Tasks' && 'Get a full care schedule generated automatically.'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('enclosure')}
            className="w-full px-4 py-3 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (step === 'enclosure') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-divider">
          <p className="text-xs text-muted text-center mb-2">Setting up your first habitat</p>
          <StepIndicator current="enclosure" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-4">
          <EnclosureFormCRUD
            mode="add"
            onSave={handleEnclosureSave}
            onCancel={() => setStep('welcome')}
          />
        </div>
      </div>
    );
  }

  if (step === 'animal') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-divider">
          <p className="text-xs text-muted text-center mb-2">Setting up your first habitat</p>
          <StepIndicator current="animal" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          <div className="bg-accent/10 border border-accent/30 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm text-accent font-medium">Enclosure "{createdEnclosure?.name}" created</p>
          </div>
          <AnimalForm
            mode="add"
            enclosures={createdEnclosure ? [createdEnclosure] : []}
            initialData={{
              enclosureId: createdEnclosure?.id ?? '',
              speciesId: createdEnclosure?.animalId === 'custom' ? '' : (createdEnclosure?.animalId ?? ''),
            }}
            onSave={handleAnimalSave}
            onCancel={async () => { setSkippedAnimal(true); await goToTasks(); }}
          />
          {!skippedAnimal && (
            <button
              type="button"
              onClick={async () => { setSkippedAnimal(true); await goToTasks(); }}
              className="w-full text-xs text-muted py-2 hover:text-white transition-colors"
            >
              Skip — add animal later
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'tasks') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-divider">
          <p className="text-xs text-muted text-center mb-2">Setting up your first habitat</p>
          <StepIndicator current="tasks" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
          {!skippedAnimal && (
            <div className="w-full bg-accent/10 border border-accent/30 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <p className="text-sm text-accent font-medium">Animal added to {createdEnclosure?.name}</p>
            </div>
          )}

          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center">
            <CalendarCheck className="w-8 h-8 text-accent" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">Set up your care schedule</h2>
            <p className="text-muted text-sm">
              <span className="text-white font-semibold">{suggestedTaskCount} care tasks</span> have been generated for{' '}
              <span className="text-white font-semibold">{createdEnclosure?.animalName}</span> based on species requirements.
            </p>
            <p className="text-muted text-xs mt-1">Includes feeding, misting, health checks, temperature monitoring, and more. You can edit or remove any task after setup.</p>
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
                `Create ${suggestedTaskCount} Care Tasks`
              )}
            </button>
            <button
              onClick={finishOnboarding}
              disabled={settingUpTasks}
              className="w-full px-4 py-3 border border-divider text-muted hover:text-white text-sm font-medium rounded-2xl transition-colors disabled:opacity-60"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done screen
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-muted text-sm">
            Your enclosure is ready
            {!skippedAnimal ? ', your animal is added,' : ''} and your care calendar
            {suggestedTaskCount > 0 ? ` has ${suggestedTaskCount} tasks waiting` : ' is ready for tasks'}.
          </p>
        </div>

        <div className="bg-card border border-divider rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">What to do next</p>
          <p className="text-sm text-white flex items-start gap-2"><span className="text-accent">→</span> Complete your first task in the Care Calendar</p>
          <p className="text-sm text-white flex items-start gap-2"><span className="text-accent">→</span> Add more animals or enclosures in My Pets</p>
          <p className="text-sm text-white flex items-start gap-2"><span className="text-accent">→</span> Check Environment settings to set baseline targets</p>
        </div>

        <button
          onClick={handleDone}
          className="w-full px-4 py-3 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Go to Care Calendar
        </button>
      </div>
    </div>
  );
}
