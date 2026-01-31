import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, Gem, BookOpen, Info, MessageSquare, Home as HomeIcon, ShieldAlert, CheckCircle, Twitter } from 'lucide-react';
import type { EnclosureInput, BuildPlan, AnimalProfile } from './engine/types';
import { generatePlan } from './engine/generatePlan';
import { AnimalSelectView } from './components/Views/AnimalSelectView';
import { DesignView } from './components/Views/DesignView';
import { PlanView } from './components/Views/PlanView';
import { SuppliesView } from './components/Views/SuppliesView';
import { FindYourAnimalView } from './components/Views/FindYourAnimalView';
import { FindYourAnimalResultsView } from './components/Views/FindYourAnimalResultsView';
import CanvasDesigner from './components/EnclosureDesigner/CanvasDesigner';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
import { BlogList } from './components/Blog/BlogList';
import { BlogPost } from './components/Blog/BlogPost';
import { AnimalProfilePreview } from './components/AnimalProfilePreview/AnimalProfilePreview';
import { About } from './components/About/About';
import { Roadmap } from './components/Roadmap/Roadmap';
import { Home } from './components/Home/Home';
import { animalProfiles } from './data/animals';
import { useTheme } from './hooks/useTheme';
import { MobileNav } from './components/Navigation/MobileNav';
import { ProgressIndicator } from './components/Navigation/ProgressIndicator';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  useTheme(); // Apply dark mode
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    // Multiple scroll methods to ensure it works on all devices/browsers
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // For iOS Safari
      window.pageYOffset = 0;
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Delayed scroll to catch any late-rendering content
    const timeoutId = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeoutId);
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
    plantPreference: 'live',
    backgroundType: 'none',
    numberOfHides: 3,
    numberOfLedges: 3,
    numberOfClimbingAreas: 2,
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
    const profile = animalProfiles[animalId as keyof typeof animalProfiles] as AnimalProfile | undefined;
    const minSize = profile?.minEnclosureSize;
    const isAquatic = profile?.equipmentNeeds?.waterFeature === 'fully-aquatic';
    
    setInput({ 
      ...input, 
      animal: animalId,
      // Auto-populate dimensions from animal's minimum enclosure size
      ...(minSize && {
        width: minSize.width,
        depth: minSize.depth,
        height: minSize.height,
        units: minSize.units,
      }),
      // Reset bioactive and substrate preference for aquatic animals
      ...(isAquatic && {
        bioactive: false,
        substratePreference: undefined,
      })
    });
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

  // Determine current step for progress indicator
  const getCurrentStep = () => {
    if (location.pathname === '/animal') return 1;
    if (location.pathname === '/design') return 2;
    if (location.pathname === '/supplies') return 3;
    if (location.pathname === '/plan') return 4;
    return 1;
  };

  const progressSteps = [
    { label: 'Choose Animal', icon: Worm },
    { label: 'Design Enclosure', icon: Pencil },
    { label: 'Get Supplies', icon: ShoppingCart },
    { label: 'Build Plan', icon: ClipboardList },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 pb-20 lg:pb-0">
      {/* Mobile-optimized header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
          {/* Mobile: Simple header with logo and theme toggle */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <Link to="/" className="block">
              <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate custom enclosure plans for your reptiles & amphibians</p>
            </Link>
          </div>

          {/* Desktop: Full header with navigation */}
          <div className="hidden lg:block">
            <div className="text-center mb-4">
              <Link to="/">
                <h1 className="text-4xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Generate custom enclosure plans for your reptiles & amphibians</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Built with love - for better care and fewer setup mistakes</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-2 text-sm font-medium">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/') ? 'bg-gray-600 text-white border-gray-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-400'}`}
            >
             <HomeIcon className="w-4 h-4 inline mr-1.5" /> Home
            </Link>
            <Link
              to="/animal"
              className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/animal') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-emerald-400'}`}
            >
             <Worm className="w-4 h-4 inline mr-1.5" /> Animal
            </Link>
            {input.animal && (
              <Link
                to="/design"
                className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/design') ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}
                title="Design your enclosure"
              >
               <Pencil className="w-4 h-4 inline mr-1.5" /> Design
              </Link>
            )}

            {plan && (
              <>
                <Link
                  to="/supplies"
                  className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/supplies') ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-400'}`}
                  title="View supplies and steps"
                >
                 <ShoppingCart className="w-4 h-4 inline mr-1.5" /> Supplies
                </Link>
                <Link
                  to="/plan"
                  className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/plan') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-400'}`}
                  title="View your generated plan"
                >
                 <ClipboardList className="w-4 h-4 inline mr-1.5" /> Plan
                </Link>
                <Link
                  to="/designer"
                  className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/designer') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400'}`}
                  title="Interactive Designer (Premium)"
                >
                  <Gem className="w-4 h-4 inline mr-1.5" /> Designer
                </Link>
              </>
            )}
            <Link
              to="/blog"
              className={`px-4 py-2 rounded-lg border whitespace-nowrap ${location.pathname.startsWith('/blog') ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-amber-400'}`}
            >
              <BookOpen className="w-4 h-4 inline mr-1.5" /> Guides
            </Link>
            <Link
              to="/about"
              className={`px-4 py-2 rounded-lg border whitespace-nowrap ${isActive('/about') ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-teal-400'}`}
            >
              <Info className="w-4 h-4 inline mr-1.5" /> About
            </Link>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden sm:flex px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap items-center"
              title="Send feedback or report issues"
            >
              <MessageSquare className="w-4 h-4 inline mr-1.5" /> Feedback
            </button>
          </nav>
          </div>
        </div>
      </header>

      {/* Mobile progress indicator - shown only on main flow pages */}
      {['/animal', '/design', '/supplies', '/plan'].includes(location.pathname) && (
        <ProgressIndicator 
          currentStep={getCurrentStep()} 
          totalSteps={4}
          steps={progressSteps}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
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
            path="/find-animal"
            element={
              <FindYourAnimalView
                onAnimalSelected={handleAnimalSelect}
              />
            }
          />
          <Route
            path="/find-animal/results"
            element={
              <FindYourAnimalResultsView
                onAnimalSelected={handleAnimalSelect}
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
          <Route path="/plan" element={<PlanView plan={plan} input={input} onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
          <Route
            path="/designer"
            element={
              plan ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">💎 In Development - Interactive Designer</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Drag, rotate, and resize equipment to design your perfect enclosure</p>
                    </div>
                    <Link to="/plan" className="hidden lg:inline text-blue-700 dark:text-blue-400 font-medium underline">Back to Plan</Link>
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
          <Route path="/blog" element={<BlogList selectedAnimal={input.animal} />} />
          <Route path="/blog/:postId" element={<BlogPost />} />
          <Route path="/dev/animals" element={<AnimalProfilePreview />} />
        </Routes>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav hasAnimal={!!input.animal} hasPlan={!!plan} />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <span className="text-xl md:text-2xl">🦎</span>
            <span className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">Habitat Builder</span>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
            <p className="flex items-start justify-center gap-2">
              <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-left"><strong className="text-gray-700 dark:text-gray-300">Always research multiple sources</strong> for animal care</span>
            </p>
            <p className="flex items-start justify-center gap-2">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-left">Plans are <strong className="text-gray-700 dark:text-gray-300">guidelines</strong> - adjust based on your animal's needs</span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 mb-3 md:mb-4">
              <a
                href="https://x.com/habitat_builder"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                title="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Not a substitute for veterinary advice
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
