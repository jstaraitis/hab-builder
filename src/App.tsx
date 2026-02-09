import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, Gem, BookOpen, Info, MessageSquare, Home as HomeIcon, ShieldAlert, CheckCircle, Instagram, Calendar, LogOut, User, Package, Turtle, Ruler, ChevronDown, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import type { EnclosureInput, BuildPlan } from './engine/types';
import { generatePlan } from './engine/generatePlan';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';

// Lazy load route components for better performance
const AnimalSelectView = lazy(() => import('./components/Views/AnimalSelectView').then(m => ({ default: m.AnimalSelectView })));
const DesignView = lazy(() => import('./components/Views/DesignView').then(m => ({ default: m.DesignView })));
const PlanView = lazy(() => import('./components/Views/PlanView').then(m => ({ default: m.PlanView })));
const SuppliesView = lazy(() => import('./components/Views/SuppliesView').then(m => ({ default: m.SuppliesView })));
const FindYourAnimalView = lazy(() => import('./components/Views/FindYourAnimalView').then(m => ({ default: m.FindYourAnimalView })));
const FindYourAnimalResultsView = lazy(() => import('./components/Views/FindYourAnimalResultsView').then(m => ({ default: m.FindYourAnimalResultsView })));
const CareCalendarView = lazy(() => import('./components/Views/CareCalendarView').then(m => ({ default: m.CareCalendarView })));
const MyAnimalsView = lazy(() => import('./components/Views/MyAnimalsView').then(m => ({ default: m.MyAnimalsView })));
const InventoryView = lazy(() => import('./components/Views/InventoryView').then(m => ({ default: m.InventoryView })));
const ProfileView = lazy(() => import('./components/Views/ProfileView').then(m => ({ default: m.ProfileView })));
const CanvasDesigner = lazy(() => import('./components/EnclosureDesigner/CanvasDesigner'));
const BlogList = lazy(() => import('./components/Blog/BlogList').then(m => ({ default: m.BlogList })));
const BlogPost = lazy(() => import('./components/Blog/BlogPost').then(m => ({ default: m.BlogPost })));
const AnimalProfilePreview = lazy(() => import('./components/AnimalProfilePreview/AnimalProfilePreview').then(m => ({ default: m.AnimalProfilePreview })));
const About = lazy(() => import('./components/About/About').then(m => ({ default: m.About })));
const Roadmap = lazy(() => import('./components/Roadmap/Roadmap').then(m => ({ default: m.Roadmap })));
const Home = lazy(() => import('./components/Home/Home').then(m => ({ default: m.Home })));
const EquipmentTagsBuilder = lazy(() => import('./components/Admin/EquipmentTagsBuilder'));
const UpgradePage = lazy(() => import('./components/Upgrade/UpgradePage').then(m => ({ default: m.UpgradePage })));
import { Auth } from './components/Auth';
import { PremiumPaywall } from './components/Upgrade/PremiumPaywall';
import { animalProfiles } from './data/animals';
import { profileService } from './services/profileService';
import { useTheme } from './hooks/useTheme';
import { useUnits } from './contexts/UnitsContext';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { MobileNav } from './components/Navigation/MobileNav';
import { ProgressIndicator } from './components/Navigation/ProgressIndicator';

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-3">
      <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  useTheme(); // Apply dark mode
  const { toggleUnits, isMetric } = useUnits(); // Unit system toggle
  usePWAUpdate(); // Check for PWA updates
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Zoom level management (stored in localStorage)
  const [zoom, setZoom] = useState<number>(() => {
    const savedZoom = localStorage.getItem('zoom-level');
    return savedZoom ? parseFloat(savedZoom) : 100;
  });

  // Persist zoom to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('zoom-level', zoom.toString());
    window.dispatchEvent(new CustomEvent('zoom-change', { detail: zoom }));
  }, [zoom]);

  // Listen for zoom changes from other components (e.g., MobileNav)
  useEffect(() => {
    const handleZoomChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setZoom(customEvent.detail);
    };
    window.addEventListener('zoom-change', handleZoomChange);
    return () => window.removeEventListener('zoom-change', handleZoomChange);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150)); // Max 150%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 75)); // Min 75%
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  // Load user profile to check premium status
  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setProfileLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await profileService.getProfile(user.id);
        setIsPremium(profile?.isPremium ?? false);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setIsPremium(false);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Header visibility control based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show header at top of page
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      }
      // Show header when scrolling up
      else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      // Hide header when scrolling down (but only after scrolling past 100px)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    // Show header when changing routes
    setIsHeaderVisible(true);
    setLastScrollY(0);
    // Close dropdowns when route changes
    setOpenDropdown(null);
    
    // Delayed scroll to catch any late-rendering content
    const timeoutId = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown menus
      if (!target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

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
    hideStylePreference: 'both',
    doorOrientation: 'front',
    automatedLighting: true,
  });

  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string>('');

  const selectedProfile = useMemo(() => {
    const profile = animalProfiles[input.animal as keyof typeof animalProfiles];
    return profile;
  }, [input.animal]);

  const profileCareTargets = selectedProfile?.careTargets;

  const handleAnimalSelect = (animalId: string) => {
    const profile = animalProfiles[animalId as keyof typeof animalProfiles];
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
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 py-2 lg:py-6">
          {/* Mobile: Simple header with logo and theme toggle */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <Link to="/" className="block">
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Custom enclosure plans for reptiles & amphibians</p>
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
            {/* Main Workflow */}
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

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                className={`px-4 py-2 rounded-lg border whitespace-nowrap flex items-center ${location.pathname.startsWith('/blog') ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-amber-400'}`}
              >
                <BookOpen className="w-4 h-4 inline mr-1.5" /> Resources
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {openDropdown === 'resources' && (
                <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                  <Link
                    to="/blog"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" /> Care Guides
                  </Link>
                </div>
              )}
            </div>

            {/* My Care Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'collection' ? null : 'collection')}
                className={`px-4 py-2 rounded-lg border whitespace-nowrap flex items-center ${['/my-animals', '/inventory', '/care-calendar'].includes(location.pathname) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-emerald-400'}`}
              >
                <Turtle className="w-4 h-4 inline mr-1.5" /> My Care
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {openDropdown === 'collection' && (
                <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                  <Link
                    to="/my-animals"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Turtle className="w-4 h-4 inline mr-2" /> My Animals
                  </Link>
                  <Link
                    to="/care-calendar"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4 inline mr-2" /> Care Tasks
                  </Link>
                  <Link
                    to="/inventory"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Package className="w-4 h-4 inline mr-2" /> Inventory
                  </Link>
                </div>
              )}
            </div>

            {/* Settings/Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'settings' ? null : 'settings')}
                className={`px-4 py-2 rounded-lg border whitespace-nowrap flex items-center ${['/profile', '/about'].includes(location.pathname) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400'}`}
              >
                <User className="w-4 h-4 inline mr-1.5" /> Account
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {openDropdown === 'settings' && (
                <div className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                  {user && (
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.email}</p>
                    </div>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4 inline mr-2" /> Profile
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Info className="w-4 h-4 inline mr-2" /> About
                  </Link>
                  <button
                    onClick={() => {
                      setIsFeedbackOpen(true);
                      setOpenDropdown(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" /> Feedback
                  </button>
                  <button
                    onClick={toggleUnits}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Ruler className="w-4 h-4 inline mr-2" /> {isMetric ? 'Metric' : 'Imperial'} Units
                  </button>
                  
                  {/* Zoom controls */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <div className="px-4 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Zoom: {zoom}%</div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 75}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ZoomOut className="w-3 h-3 inline mr-1" /> -
                      </button>
                      <button
                        onClick={handleResetZoom}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 150}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ZoomIn className="w-3 h-3 inline mr-1" /> +
                      </button>
                    </div>
                  </div>
                  
                  {user && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => {
                          signOut();
                          setOpenDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" /> Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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

      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
        <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/care-calendar" element={
            !user ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full">
                  <Auth />
                </div>
              </div>
            ) : profileLoading ? (
              <LoadingFallback />
            ) : !isPremium ? (
              <PremiumPaywall />
            ) : (
              <CareCalendarView />
            )
          } />
          <Route path="/my-animals" element={
            !user ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full">
                  <Auth />
                </div>
              </div>
            ) : profileLoading ? (
              <LoadingFallback />
            ) : !isPremium ? (
              <PremiumPaywall />
            ) : (
              <MyAnimalsView />
            )
          } />
          <Route path="/inventory" element={
            !user ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full">
                  <Auth />
                </div>
              </div>
            ) : profileLoading ? (
              <LoadingFallback />
            ) : !isPremium ? (
              <PremiumPaywall />
            ) : (
              <InventoryView />
            )
          } />
          <Route path="/about" element={<About onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/roadmap" element={<Roadmap onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
          <Route path="/blog" element={<BlogList selectedAnimal={input.animal} />} />
          <Route path="/blog/:postId" element={<BlogPost />} />
          <Route path="/dev/animals" element={<AnimalProfilePreview />} />
          <Route path="/dev/equipment-tags" element={<EquipmentTagsBuilder />} />
        </Routes>
        </Suspense>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav hasAnimal={!!input.animal} hasPlan={!!plan} onOpenFeedback={() => setIsFeedbackOpen(true)} />

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
                href="https://www.instagram.com/joshs_frog"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400 transition-colors"
                title="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
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
