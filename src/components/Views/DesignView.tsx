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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="font-semibold text-gray-900 dark:text-white">{selectedProfile.commonName}</p>
              <p className="text-gray-600 dark:text-gray-400 italic">{selectedProfile.scientificName}</p>
              <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                Care: {selectedProfile.careLevel}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
                {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Selected animal details. You can go back to change the species.</p>
          </div>
          <Link to="/animal" className="text-blue-700 dark:text-blue-400 text-sm font-medium underline">Change animal</Link>
        </div>
      )}

      <EnclosureForm value={input} onChange={setInput} animalProfile={selectedProfile} />

      <div className="flex justify-between items-center flex-wrap gap-3">
        <button
          onClick={onGenerate}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Generate Build Plan
        </button>
        <Link
          to="/supplies"
          className={`text-sm font-medium underline-offset-4 ${plan ? 'text-blue-700 dark:text-blue-400 hover:underline' : 'text-gray-400 dark:text-gray-600 pointer-events-none'}`}
          title={plan ? 'View shopping list and build steps' : 'Generate a plan first'}
        >
          View Supplies
        </Link>
      </div>
    </div>
  );
}
