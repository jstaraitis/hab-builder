import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EnclosureInput, BuildPlan, AnimalProfile } from '../engine/types';
import { generatePlan } from '../engine/generatePlan';
import { animalProfiles } from '../data/animals';

interface PlannerContextType {
  input: EnclosureInput;
  setInput: React.Dispatch<React.SetStateAction<EnclosureInput>>;
  plan: BuildPlan | null;
  setPlan: React.Dispatch<React.SetStateAction<BuildPlan | null>>;
  error: string;
  selectedProfile: AnimalProfile | undefined;
  profileCareTargets: AnimalProfile['careTargets'] | undefined;
  handleAnimalSelect: (animalId: string) => void;
  handleAnimalSelectWithUrl: (animalId: string) => void;
  handleGenerate: () => void;
}

const DEFAULT_INPUT: EnclosureInput = {
  width: 18,
  depth: 18,
  height: 24,
  units: 'in',
  type: 'glass',
  animal: '',
  quantity: 1,
  bioactive: false,
  ambientTemp: 72,
  ambientHumidity: 50,
  humidityControl: 'manual',
  substratePreference: 'soil-based',
  plantPreference: 'live',
  backgroundType: 'none',
  numberOfHides: 3,
  numberOfLedges: 3,
  numberOfClimbingAreas: 2,
  setupTier: 'recommended',
  hideStylePreference: 'both',
  doorOrientation: 'front',
  automatedLighting: true,
};

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { readonly children: ReactNode }) {
  const navigate = useNavigate();
  const [input, setInput] = useState<EnclosureInput>(DEFAULT_INPUT);
  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string>('');

  const selectedProfile = useMemo(() => {
    return animalProfiles[input.animal as keyof typeof animalProfiles];
  }, [input.animal]);

  const profileCareTargets = selectedProfile?.careTargets;

  const handleAnimalSelect = useCallback((animalId: string) => {
    const profile = animalProfiles[animalId as keyof typeof animalProfiles];
    const minSize = profile?.minEnclosureSize;
    const isAquatic = profile?.equipmentNeeds?.waterFeature === 'fully-aquatic';

    setInput((prev) => ({
      ...prev,
      animal: animalId,
      ...(minSize && {
        width: minSize.width,
        depth: minSize.depth,
        height: minSize.height,
        units: minSize.units,
      }),
      ...(isAquatic && {
        bioactive: false,
        substratePreference: undefined,
      })
    }));
    setPlan(null);
  }, []);

  const handleAnimalSelectWithUrl = useCallback((animalId: string) => {
    const normalizedId = animalId.toLowerCase();
    handleAnimalSelect(normalizedId);
    navigate(`/animal/${normalizedId}`);
  }, [handleAnimalSelect, navigate]);

  const handleGenerate = useCallback(() => {
    try {
      setError('');
      const generatedPlan = generatePlan(input);
      setPlan(generatedPlan);
      navigate('/supplies');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to generate plan:', err);
      setError(`Failed to generate plan: ${errorMsg}`);
    }
  }, [input, navigate]);

  const value = useMemo<PlannerContextType>(() => ({
    input,
    setInput,
    plan,
    setPlan,
    error,
    selectedProfile,
    profileCareTargets,
    handleAnimalSelect,
    handleAnimalSelectWithUrl,
    handleGenerate,
  }), [input, plan, error, selectedProfile, profileCareTargets, handleAnimalSelect, handleAnimalSelectWithUrl, handleGenerate]);

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextType {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
