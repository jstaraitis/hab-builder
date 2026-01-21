import type { EnclosureInput, BuildPlan, AnimalProfile } from '../../engine/types';
import { AnimalPicker } from '../AnimalPicker/AnimalPicker';
import { RelatedBlogs } from '../AnimalPicker/RelatedBlogs';
import { CareTargets } from '../PlanPreview/CareTargets';
import { SEO } from '../SEO/SEO';

interface AnimalSelectViewProps {
  readonly input: EnclosureInput;
  readonly selectedProfile?: AnimalProfile;
  readonly profileCareTargets?: AnimalProfile['careTargets'];
  readonly plan: BuildPlan | null;
  readonly onSelect: (id: string) => void;
  readonly onContinue: () => void;
}

export function AnimalSelectView({ input, selectedProfile, profileCareTargets, plan, onSelect, onContinue }: AnimalSelectViewProps) {
  // Important and tip warnings will be shown in Care Parameters
  const infoWarnings = (selectedProfile?.warnings?.filter(
    (w) => w.severity === 'important' || w.severity === 'tip'
  ) || []).map((w, idx) => ({ ...w, id: `info-${idx}` }));

  // SEO metadata for animal-specific pages
  const animalSEO = selectedProfile ? {
    title: `${selectedProfile.commonName} Enclosure Setup Guide`,
    description: `Complete ${selectedProfile.commonName} (${selectedProfile.scientificName}) care guide. Learn proper enclosure size, temperature (${profileCareTargets?.temperature.min}-${profileCareTargets?.temperature.max}°F), humidity (${profileCareTargets?.humidity.min}-${profileCareTargets?.humidity.max}%), and lighting requirements.`,
    keywords: [
      `${selectedProfile.commonName.toLowerCase()} enclosure`,
      `${selectedProfile.commonName.toLowerCase()} habitat`,
      `${selectedProfile.commonName.toLowerCase()} setup`,
      `${selectedProfile.scientificName.toLowerCase()} care`,
      `${selectedProfile.careLevel} reptile`,
      'bioactive vivarium'
    ]
  } : {
    title: 'Choose Your Reptile or Amphibian',
    description: 'Select from our database of reptiles and amphibians to generate a custom enclosure plan with care parameters, shopping lists, and build instructions.'
  };

  return (
    <div className="space-y-6">
      <SEO {...animalSEO} />
      <AnimalPicker selected={input.animal} onSelect={onSelect} />
      
      {!input.animal && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
          <p className="text-blue-800 dark:text-blue-300 font-medium">👆 Please select an animal to begin</p>
        </div>
      )}

      {selectedProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="font-semibold text-gray-900 dark:text-white">{selectedProfile.commonName}</p>
            <p className="text-gray-600 dark:text-gray-400 italic">{selectedProfile.scientificName}</p>
            <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              Care: {selectedProfile.careLevel}
            </span>
            <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
              {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
            </span>
          </div>
          {selectedProfile.notes?.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {selectedProfile.notes.map((note: string) => (
                <li key={`note-${note.substring(0, 20)}`}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {profileCareTargets && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Care Parameters</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Species defaults</span>
          </div>
          <CareTargets targets={profileCareTargets} showHeader={false} infoWarnings={infoWarnings} />
          
          {selectedProfile?.careGuidance && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white">Daily Care Guidelines</h4>
              
              {/* Feeding Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Feeding Schedule</h5>
                </div>
                <div className="pl-9 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {selectedProfile.careGuidance.feedingNotes.map((note, idx) => (
                    <p key={`feeding-${idx}`} className="leading-relaxed">• {note}</p>
                  ))}
                </div>
              </div>

              {/* Water Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💧</span>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Water Requirements</h5>
                </div>
                <div className="pl-9 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {selectedProfile.careGuidance.waterNotes.map((note, idx) => (
                    <p key={`water-${idx}`} className="leading-relaxed">• {note}</p>
                  ))}
                </div>
              </div>

              {/* Misting Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💦</span>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Humidity & Misting</h5>
                </div>
                <div className="pl-9 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {selectedProfile.careGuidance.mistingNotes.map((note, idx) => (
                    <p key={`misting-${idx}`} className="leading-relaxed">• {note}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {input.animal && selectedProfile?.relatedBlogs && selectedProfile.relatedBlogs.length > 0 && (
        <RelatedBlogs blogIds={selectedProfile.relatedBlogs} />
      )}

      {plan?.careGuidance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Feeding & Water</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded p-3">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Feeding</p>
              <ul className="list-disc list-inside space-y-1">
                {plan.careGuidance.feedingNotes.map((note) => (
                  <li key={`feeding-${note.substring(0, 30)}`}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded p-3">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Water</p>
              <ul className="list-disc list-inside space-y-1">
                {plan.careGuidance.waterNotes.map((note) => (
                  <li key={`water-${note.substring(0, 30)}`}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 rounded p-3">
              <p className="font-semibold text-cyan-800 dark:text-cyan-300 mb-2">Misting</p>
              <ul className="list-disc list-inside space-y-1">
                {plan.careGuidance.mistingNotes.map((note) => (
                  <li key={`misting-${note.substring(0, 30)}`}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!plan && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-lg p-4 text-sm">
          Generate a plan to view additional.
        </div>
      )}

      {input.animal && (
        <div className="flex justify-end">
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all"
          >
            Continue to Designer
          </button>
        </div>
      )}
    </div>
  );
}
