import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import type { EnclosureInput, BuildPlan, AnimalProfile } from './engine/types';
import { generatePlan } from './engine/generatePlan';
import { AnimalSelectView } from './components/Views/AnimalSelectView';
import { DesignView } from './components/Views/DesignView';
import { PlanView } from './components/Views/PlanView';
import { SuppliesView } from './components/Views/SuppliesView';
import CanvasDesigner from './components/EnclosureDesigner/CanvasDesigner';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
import { BlogList } from './components/Blog/BlogList';
import { BlogPost } from './components/Blog/BlogPost';
import { AnimalProfilePreview } from './components/AnimalProfilePreview/AnimalProfilePreview';
import { About } from './components/About/About';
import { Roadmap } from './components/Roadmap/Roadmap';
import { animalProfiles } from './data/animals';
import { useTheme } from './hooks/useTheme';

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
    ambientTemp: 72,
    ambientHumidity: 50,
    humidityControl: 'manual',
    substratePreference: 'soil-based',
    plantPreference: 'mix',
    backgroundType: 'none',
    numberOfHides: 3,
    numberOfLedges: 3,
    setupTier: 'recommended',
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
            <Link
              to="/about"
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border whitespace-nowrap ${isActive('/about') ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-teal-400'}`}
            >
              ℹ️ About
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
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">💎 Interactive Designer - IN PROGRESS - Works best on PC or Tablet</h2>
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
          <Route path="/supplies" element={<SuppliesView plan={plan} input={input} />} />
          <Route path="/about" element={<About onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
          <Route path="/roadmap" element={<Roadmap onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:postId" element={<BlogPost />} />
          <Route path="/dev/animals" element={<AnimalProfilePreview />} />
        </Routes>
      </main>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Habitat Builder• 🐸 • Always research multiple sources for animal care</p>
          <p className="mt-1">Plans are guidelines - adjust based on your specific animal's needs</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
