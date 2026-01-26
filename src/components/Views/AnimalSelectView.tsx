import { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import type { EnclosureInput, BuildPlan, AnimalProfile } from '../../engine/types';
import { AnimalPicker } from '../AnimalPicker/AnimalPicker';
import { ImageGallery } from '../ImageGallery/ImageGallery';
import { SEO } from '../SEO/SEO';
import { QuickFactsCard } from '../QuickFacts/QuickFactsCard';
import { CareGuideCards } from '../CareGuideCards/CareGuideCards';

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
      // Small delay to ensure DOM is ready and mobile keyboard is dismissed
      setTimeout(() => {
        animalDataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [input.animal]);

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
          <p className="text-blue-800 dark:text-blue-300 font-medium"><ArrowUp className="inline-block w-5 h-5 mr-2"/> Please select an animal to begin</p>
        </div>
      )}

      {selectedProfile && (
        <div ref={animalDataRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-base text-gray-700 dark:text-gray-300">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">Species Overview</h3>
          
          {/* Header with badges */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <p className="font-semibold text-xl text-gray-900 dark:text-white">{selectedProfile.commonName}</p>
            <p className="text-gray-600 dark:text-gray-400 italic text-base">{selectedProfile.scientificName}</p>
            <span className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-base font-medium">
              Care: {selectedProfile.careLevel}
            </span>
            <span className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-base font-medium">
              {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {selectedProfile.adultSize && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Adult Size</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.adultSize}</p>
              </div>
            )}
            {selectedProfile.temperament && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Temperament</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.temperament}</p>
              </div>
            )}
            {selectedProfile.originRegion && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Natural Habitat</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.originRegion}</p>
              </div>
            )}
            {selectedProfile.notes?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Key Information</p>
                <ul className="space-y-2">
                  {selectedProfile.notes.map((note: string) => (
                    <li key={`note-${note.substring(0, 20)}`} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProfile && <QuickFactsCard profile={selectedProfile} />}

      {selectedProfile && <CareGuideCards profile={selectedProfile} />}

      {selectedProfile?.gallery && selectedProfile.gallery.length > 0 && (
        <ImageGallery images={selectedProfile.gallery} title={`${selectedProfile.commonName} Gallery`} />
      )}

      {input.animal && (
        <div className="sticky bottom-20 lg:bottom-0 lg:static z-20">
          <button
            onClick={onContinue}
            className="w-full lg:w-auto lg:float-right px-12 py-6 lg:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 active:scale-95"
          >
            Continue to Design →
          </button>
        </div>
      )}
    </div>
  );
}
