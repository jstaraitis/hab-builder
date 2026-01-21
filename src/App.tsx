import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import type { EnclosureInput, BuildPlan, AnimalProfile } from './engine/types';
import { generatePlan } from './engine/generatePlan';
import { EnclosureForm } from './components/EnclosureForm/EnclosureForm';
import { AnimalPicker } from './components/AnimalPicker/AnimalPicker';
import { RelatedBlogs } from './components/AnimalPicker/RelatedBlogs';
import { CareTargets } from './components/PlanPreview/CareTargets';
import { ShoppingList } from './components/ShoppingList/ShoppingList';
import { BuildSteps } from './components/BuildSteps/BuildSteps';
import { HusbandryChecklist } from './components/HusbandryChecklist/HusbandryChecklist';
import CanvasDesigner from './components/EnclosureDesigner/CanvasDesigner';
import ExampleSetups from './components/ExampleSetups/ExampleSetups';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
import { BlogList } from './components/Blog/BlogList';
import { BlogPost } from './components/Blog/BlogPost';
import { AnimalProfilePreview } from './components/AnimalProfilePreview/AnimalProfilePreview';
import { SEO } from './components/SEO/SEO';
import { animalProfiles } from './data/animals';
import { useTheme } from './hooks/useTheme';

interface AnimalSelectViewProps {
  readonly input: EnclosureInput;
  readonly selectedProfile?: AnimalProfile;
  readonly profileCareTargets?: AnimalProfile['careTargets'];
  readonly plan: BuildPlan | null;
  readonly onSelect: (id: string) => void;
  readonly onContinue: () => void;
}

function AnimalSelectView({ input, selectedProfile, profileCareTargets, plan, onSelect, onContinue }: AnimalSelectViewProps) {
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

      {selectedProfile?.relatedBlogs && selectedProfile.relatedBlogs.length > 0 && (
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

interface DesignViewProps {
  readonly selectedProfile?: AnimalProfile;
  readonly input: EnclosureInput;
  readonly setInput: (i: EnclosureInput) => void;
  readonly plan: BuildPlan | null;
  readonly error: string;
  readonly onGenerate: () => void;
}

function DesignView({ selectedProfile, input, setInput, plan, error, onGenerate }: DesignViewProps) {
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

interface PlanViewProps {
  readonly plan: BuildPlan | null;
  readonly input: EnclosureInput;
}

function PlanView({ plan, input }: PlanViewProps) {
  const animalName = plan?.careTargets ? animalProfiles[input.animal]?.commonName || 'Reptile' : 'Reptile';
  
  if (!plan) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
        <SEO title="Build Plan" description="Generate your custom reptile enclosure build plan with step-by-step instructions." />
        <p className="font-semibold">No plan yet.</p>
        <p className="text-sm">Generate a plan in Design first.</p>
        <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Design</Link>
      </div>
    );
  }
  
  return (
    <>
      <SEO
        title={`${animalName} Build Plan & Instructions`}
        description={`Complete ${animalName} enclosure build plan with step-by-step instructions, equipment list, and care parameters. ${input.width}x${input.depth}x${input.height}" ${input.bioactive ? 'bioactive' : 'standard'} setup.`}
        keywords={[`${animalName.toLowerCase()} build guide`, 'enclosure instructions', 'vivarium setup', 'habitat build steps', 'reptile shopping list']}
      />
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Plan</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Layout preview and example setups</p>
        </div>
        <div className="flex gap-3">
          <Link to="/supplies" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Supplies</Link>
          <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Edit Design</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Example Enclosure Setups</h3>
        <ExampleSetups animalType={input.animal} />
      </div>

      {plan.layout.notes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Layout Notes</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
              {plan.layout.notes.map((note) => (
                <li key={`layout-${note.substring(0, 30)}`}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

interface SuppliesViewProps {
  readonly plan: BuildPlan | null;
}

function SuppliesView({ plan }: SuppliesViewProps) {
  if (!plan) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
        <SEO title="Shopping List" description="Get your custom reptile enclosure shopping list with equipment, substrate, and decor." />
        <p className="font-semibold">No plan yet.</p>
        <p className="text-sm">Generate a plan in Design first.</p>
        <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Design</Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Shopping List & Supplies"
        description={`Complete equipment shopping list for your ${input.width}x${input.depth}x${input.height}" enclosure. Includes heating, lighting, substrate, and decor with build instructions.`}
        keywords={['reptile supplies', 'vivarium shopping list', 'enclosure equipment', 'bioactive supplies', 'reptile decor']}
      />
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Supplies & Steps</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Shopping list, build steps, and husbandry checklists</p>
        </div>
        <Link to="/plan" className="text-blue-700 dark:text-blue-400 font-medium underline">View Plan</Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Shopping List</h3>
        <ShoppingList items={plan.shoppingList} budget={plan.enclosure.budget} showHeader={false} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Steps</h3>
        <BuildSteps steps={plan.steps} showHeader={false} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Husbandry Checklists</h3>
        <HusbandryChecklist checklist={plan.husbandryChecklist} />
      </div>

      <div className="flex justify-center mt-6">
        <Link
          to="/plan"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Continue to Plan →
        </Link>
      </div>
    </div>
    </>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [input, setInput] = useState<EnclosureInput>({
    width: 18,
    depth: 18,
    height: 24,
    units: 'in',
    type: 'glass',
    animal: '',
    quantity: 1,
    bioactive: false,
    budget: 'mid',
    ambientTemp: 72,
    ambientHumidity: 50,
    humidityControl: 'manual',
    substratePreference: 'soil-based',
    plantPreference: 'mix',
  });

  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string>('');

  const selectedProfile = useMemo(() => {
    const profile = animalProfiles[input.animal as keyof typeof animalProfiles];
    return profile as AnimalProfile | undefined;
  }, [input.animal]);

  const profileCareTargets = selectedProfile?.careTargets;

  const handleAnimalSelect = (animalId: string) => {
    setInput({ ...input, animal: animalId });
    setPlan(null); // reset plan when animal changes
  };

  const handleGenerate = () => {
    try {
      setError('');
      const generatedPlan = generatePlan(input);
      setPlan(generatedPlan);
      navigate('/supplies');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate plan:', error);
      setError(`Failed to generate plan: ${errorMsg}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      {/* Testing Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b-2 border-yellow-400 dark:border-yellow-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl flex-shrink-0">⚠️</span>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-yellow-900 dark:text-yellow-200">Beta Testing - Data May Be Incorrect</p>
            <p className="text-yellow-800 dark:text-yellow-300 mt-0.5">This app is in testing. Always verify care info with multiple sources before making changes.</p>
          </div>
        </div>
      </div>

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-bold text-green-700 dark:text-green-400">🦎 Habitat Builder</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">Generate custom enclosure plans for your reptiles & amphibians</p>
            </div>
            <nav className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium">
            <Link
              to="/animal"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/animal') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-emerald-400'}`}
            >
             🐸 Animal
            </Link>
            <Link
              to="/design"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/design') ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-green-400'} ${input.animal ? '' : 'opacity-60 pointer-events-none'}`}
              title={input.animal ? 'Design your enclosure' : 'Select an animal first'}
            >
             🎨 Design
            </Link>
            <Link
              to="/supplies"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/supplies') ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-400'} ${plan ? '' : 'opacity-60 pointer-events-none'}`}
              title={plan ? 'View supplies and steps' : 'Generate a plan first'}
            >
             🛒Supplies
            </Link>
            <Link
              to="/plan"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/plan') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-400'} ${plan ? '' : 'opacity-60 pointer-events-none'}`}
              title={plan ? 'View your generated plan' : 'Generate a plan first'}
            >
             📋 Plan
            </Link>
            <Link
              to="/designer"
              className={`hidden sm:inline-block px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/designer') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400'} ${plan ? '' : 'opacity-60 pointer-events-none'}`}
              title={plan ? 'Interactive Designer (Premium)' : 'Generate a plan first'}
            >
              💎 Designer
            </Link>
            <Link
              to="/blog"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${location.pathname.startsWith('/blog') ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-amber-400'}`}
            >
              📚 Guides
            </Link>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap"
              title="Send feedback or report issues"
            >
              📝 Feedback
            </button>
            <button
              onClick={toggleTheme}
              className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-yellow-400 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/animal" replace />} />
          <Route
            path="/animal"
            element={
              <AnimalSelectView
                input={input}
                selectedProfile={selectedProfile}
                profileCareTargets={profileCareTargets}
                plan={plan}
                onSelect={handleAnimalSelect}
                onContinue={() => navigate('/design')}
              />
            }
          />
          <Route
            path="/design"
            element={
              input.animal ? (
                <DesignView
                  selectedProfile={selectedProfile}
                  input={input}
                  setInput={setInput}
                  plan={plan}
                  error={error}
                  onGenerate={handleGenerate}
                />
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold">No animal selected.</p>
                  <p className="text-sm">Please select an animal first to access the design page.</p>
                  <Link to="/animal" className="text-blue-700 dark:text-blue-400 font-medium underline">Select Animal</Link>
                </div>
              )
            }
          />
          <Route path="/plan" element={<PlanView plan={plan} input={input} />} />
          <Route
            path="/designer"
            element={
              plan ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">💎 Interactive Designer</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Drag, rotate, and resize equipment to design your perfect enclosure</p>
                    </div>
                    <Link to="/plan" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Plan</Link>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <CanvasDesigner enclosureInput={input} shoppingList={plan.shoppingList} />
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold">No plan yet.</p>
                  <p className="text-sm">Generate a plan in Design first.</p>
                  <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Design</Link>
                </div>
              )
            }
          />
          <Route path="/supplies" element={<SuppliesView plan={plan} />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:postId" element={<BlogPost />} />
          <Route path="/dev/animals" element={<AnimalProfilePreview />} />
        </Routes>
      </main>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Habitat Builder MVP • Always research multiple sources for animal care</p>
          <p className="mt-1">Plans are guidelines - adjust based on your specific animal's needs</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
