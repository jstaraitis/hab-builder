import { Link } from 'react-router-dom';
import type { EnclosureInput, BuildPlan, AnimalProfile } from '../../engine/types';
import { EnclosureForm } from '../EnclosureForm/EnclosureForm';
import { SEO } from '../SEO/SEO';

interface DesignViewProps {
  readonly selectedProfile?: AnimalProfile;
  readonly input: EnclosureInput;
  readonly setInput: (i: EnclosureInput) => void;
  readonly plan: BuildPlan | null;
  readonly error: string;
  readonly onGenerate: () => void;
}

export function DesignView({ selectedProfile, input, setInput, plan, error, onGenerate }: DesignViewProps) {
  return (
    <div className="space-y-6">
      <SEO
        title={`Design ${selectedProfile?.commonName || 'Reptile'} Enclosure`}
        description={`Design a custom ${selectedProfile?.commonName || 'reptile'} enclosure. Set dimensions, choose materials, and preview your habitat layout in real-time.`}
        keywords={['enclosure designer', 'vivarium planner', 'habitat design tool', 'reptile enclosure calculator', `${selectedProfile?.commonName.toLowerCase()} enclosure`]}
      />
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {selectedProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-base text-gray-700 dark:text-gray-300 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{selectedProfile.commonName}</p>
              <p className="text-gray-600 dark:text-gray-400 italic text-base">{selectedProfile.scientificName}</p>
              <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                Care: {selectedProfile.careLevel}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
                {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
              </span>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400">Selected animal details. You can go back to change the species.</p>
          </div>
          <Link to="/animal" className="text-blue-700 dark:text-blue-400 text-base font-medium underline">Change animal</Link>
        </div>
      )}

      <EnclosureForm value={input} onChange={setInput} animalProfile={selectedProfile} />

      {/* Mobile-optimized action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <button
          onClick={onGenerate}
          className="w-full sm:w-auto px-8 py-5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 active:from-green-700 active:to-emerald-700 sm:hover:from-green-700 sm:hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg active:shadow-md sm:hover:shadow-xl transition-all active:scale-[0.98] sm:transform sm:hover:scale-105"
        >
          Generate Build Plan
        </button>
        {plan && (
          <Link
            to="/supplies"
            className="text-center sm:text-left text-sm font-medium text-blue-700 dark:text-blue-400 underline-offset-4 hover:underline py-2"
          >
            Skip to Supplies →
          </Link>
        )}
      </div>
    </div>
  );
}
