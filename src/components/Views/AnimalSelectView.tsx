import { useRef, useEffect } from 'react';
import type { EnclosureInput, BuildPlan, AnimalProfile } from '../../engine/types';
import { AnimalPicker } from '../AnimalPicker/AnimalPicker';
import { RelatedBlogs } from '../AnimalPicker/RelatedBlogs';
import { ImageGallery } from '../ImageGallery/ImageGallery';
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

export function AnimalSelectView({ input, selectedProfile, profileCareTargets, onSelect, onContinue }: AnimalSelectViewProps) {
  const animalDataRef = useRef<HTMLDivElement>(null);

  // Scroll to animal data when an animal is selected
  useEffect(() => {
    if (input.animal && animalDataRef.current) {
      animalDataRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [input.animal]);
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
        <div ref={animalDataRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Care Guide</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Species requirements</span>
          </div>
          
          <div className="grid md:grid-cols-3 md:grid-rows-2 gap-4">
            <CareTargets 
              targets={profileCareTargets} 
              showHeader={false} 
              infoWarnings={infoWarnings}
              mistingNotes={selectedProfile?.careGuidance?.mistingNotes}
            />
            
            {selectedProfile?.careGuidance && (
              <>
                {/* Feeding Requirements Card */}
                {selectedProfile.careGuidance.feedingRequirements && selectedProfile.careGuidance.feedingRequirements.length > 0 && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-3">
                        <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                    </div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-3">Feeding Requirements</h5>
                    <div className="space-y-2">
                      {selectedProfile.careGuidance.feedingRequirements.map((note, idx) => (
                        <p key={`feeding-req-${idx}`} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{note}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feeding Schedule Card */}
                {selectedProfile.careGuidance.feedingSchedule && selectedProfile.careGuidance.feedingSchedule.length > 0 && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-orange-100 dark:bg-orange-900/40 rounded-full p-3">
                        <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-3">Feeding Schedule</h5>
                    <div className="space-y-2">
                      {selectedProfile.careGuidance.feedingSchedule.map((note, idx) => (
                        <p key={`feeding-sched-${idx}`} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{note}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Water Card */}
                {selectedProfile.careGuidance.waterNotes && selectedProfile.careGuidance.waterNotes.length > 0 && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-3">
                        <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                      </div>
                    </div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-3">Water Requirements</h5>
                    <div className="space-y-2">
                      {selectedProfile.careGuidance.waterNotes.map((note, idx) => (
                        <p key={`water-${idx}`} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{note}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {selectedProfile?.gallery && selectedProfile.gallery.length > 0 && (
        <ImageGallery images={selectedProfile.gallery} title={`${selectedProfile.commonName} Gallery`} />
      )}

      {input.animal && selectedProfile?.relatedBlogs && selectedProfile.relatedBlogs.length > 0 && (
        <RelatedBlogs blogIds={selectedProfile.relatedBlogs} />
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
