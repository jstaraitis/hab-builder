import { useMemo, useState } from 'react';
import type { EnclosureInput, BuildPlan, AnimalProfile } from './engine/types';
import { generatePlan } from './engine/generatePlan';
import { EnclosureForm } from './components/EnclosureForm/EnclosureForm';
import { AnimalPicker } from './components/AnimalPicker/AnimalPicker';
import { PlanPreview } from './components/PlanPreview/PlanPreview';
import { animalProfiles } from './data/animals';

function App() {
  const [input, setInput] = useState<EnclosureInput>({
    width: 18,
    depth: 18,
    height: 24,
    units: 'in',
    animal: 'whites-tree-frog',
    bioactive: false,
    budget: 'mid',
    beginnerMode: true,
  });

  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string>('');

  const selectedProfile = useMemo(() => {
    const profile = animalProfiles[input.animal as keyof typeof animalProfiles];
    return profile as AnimalProfile | undefined;
  }, [input.animal]);

  const handleGenerate = () => {
    try {
      setError('');
      const generatedPlan = generatePlan(input);
      setPlan(generatedPlan);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate plan:', error);
      setError(`Failed to generate plan: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-green-700">
            🦎 Habitat Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Generate custom enclosure plans for your reptiles & amphibians
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <AnimalPicker
            selected={input.animal}
            onSelect={(animalId) => setInput({ ...input, animal: animalId })}
          />

          {selectedProfile && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <p className="font-semibold text-gray-900">{selectedProfile.commonName}</p>
                <p className="text-gray-600 italic">{selectedProfile.scientificName}</p>
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  Care: {selectedProfile.careLevel}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
                </span>
              </div>
              {selectedProfile.notes?.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {selectedProfile.notes.map((note: string, idx: number) => (
                    <li key={`note-${idx}-${note.substring(0, 10)}`}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <EnclosureForm value={input} onChange={setInput} animalProfile={selectedProfile} />

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Generate Build Plan
            </button>
          </div>

          {/* Plan Preview */}
          {plan && (
            <div className="mt-8">
              <PlanPreview plan={plan} enclosureInput={input} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            Habitat Builder MVP • Always research multiple sources for animal care
          </p>
          <p className="mt-1">
            Plans are guidelines - adjust based on your specific animal's needs
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
