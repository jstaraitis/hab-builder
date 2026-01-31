import { useRef, useEffect, useState } from 'react';
import { X, Sparkles, Rocket, MessageCircle, Lightbulb } from 'lucide-react';
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
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showTestingNotice, setShowTestingNotice] = useState(() => {
    // Check localStorage to see if user has already dismissed the notice
    const dismissed = localStorage.getItem('testingNoticeDismissed');
    return dismissed !== 'true';
  });

  const handleDismissNotice = () => {
    localStorage.setItem('testingNoticeDismissed', 'true');
    setShowTestingNotice(false);
  };

  // Scroll to animal data when an animal is selected
  useEffect(() => {
    if (input.animal && animalDataRef.current) {
      // Small delay to ensure DOM is ready and mobile keyboard is dismissed
      setTimeout(() => {
        animalDataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [input.animal]);

  // Detect when user scrolls near bottom of page
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // Show button when user is within 200px of bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowContinueButton(isNearBottom);
    };

    // Check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      
      {/* Testing Notice Modal */}
      {showTestingNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={handleDismissNotice}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close notice"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Welcome!
              </h2>
            </div>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
              <p className="font-medium">
                Thanks for checking out Habitat Builder! We're excited to help you design the perfect home for your pet.
              </p>
              <p className="text-sm">
                Just a heads up — this app is still growing and improving:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>We're adding new features regularly</li>
                <li>Equipment recommendations are being fine-tuned</li>
                <li>Animal information is being peer reviewed by trusted sources!</li>
              </ul>
              <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p>Got feedback or spotted an issue? Use the feedback button to let us know — we'd love to hear from you!</p>
              </div>
            </div>
            
            <button
              onClick={handleDismissNotice}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Let's get started!
              <Rocket className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <AnimalPicker selected={input.animal} onSelect={onSelect} />

      {selectedProfile && (
        <div ref={animalDataRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 text-base text-gray-700 dark:text-gray-300">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">Species Overview</h3>
          
          {/* Header with badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white">{selectedProfile.commonName}</p>
            <p className="text-gray-600 dark:text-gray-400 italic text-sm sm:text-base">{selectedProfile.scientificName}</p>
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              Care: {selectedProfile.careLevel}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {selectedProfile.bioactiveCompatible ? 'Bioactive compatible' : 'Bioactive: caution'}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {selectedProfile.adultSize && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Adult Size</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.adultSize}</p>
              </div>
            )}
            {selectedProfile.temperament && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Temperament</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.temperament}</p>
              </div>
            )}
            {selectedProfile.originRegion && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Natural Habitat</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedProfile.originRegion}</p>
              </div>
            )}
            {selectedProfile.notes?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Fun Facts</p>
                
                {/* Desktop: List View */}
                <ul className="hidden md:block space-y-1.5">
                  {selectedProfile.notes.map((note: string) => (
                    <li key={`note-${note.substring(0, 20)}`} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>

                {/* Mobile: Swipeable Cards */}
                <div className="md:hidden">
                  <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
                    {selectedProfile.notes.map((note: string, idx: number) => (
                      <div
                        key={`note-card-${note.substring(0, 20)}`}
                        className="snap-center flex-shrink-0 w-[85vw] bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 shadow-sm first:ml-4"
                      >
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-2">
                              Fact {idx + 1} of {selectedProfile.notes.length}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: note }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {selectedProfile.notes.map((_, idx: number) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    ))}
                  </div>
                </div>
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

      {input.animal && showContinueButton && (
        <div className="sticky bottom-20 lg:bottom-0 lg:static z-20 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={onContinue}
            className="group w-full lg:w-auto lg:float-right px-12 py-5 lg:py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg lg:text-xl rounded-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 active:rotate-1 border-2 border-emerald-400/20"
          >
            <span className="inline-block transition-transform duration-200 group-active:translate-x-1">Continue to Design →</span>
          </button>
        </div>
      )}
    </div>
  );
}
