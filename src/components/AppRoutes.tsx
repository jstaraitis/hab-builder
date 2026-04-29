import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useAuth } from '../contexts/AuthContext';
import { PremiumRoute } from './Auth/PremiumRoute';
import { AuthRoute } from './Auth/AuthRoute';
import { OwnerRoute } from './Auth/OwnerRoute';
import { animalProfiles } from '../data/animals';

// Lazy load route components for better performance
const AnimalSelectView = lazy(() => import('./Views/AnimalSelectView').then(m => ({ default: m.AnimalSelectView })));
const DesignView = lazy(() => import('./Views/DesignView').then(m => ({ default: m.DesignView })));
const PlanView = lazy(() => import('./Views/PlanView').then(m => ({ default: m.PlanView })));
const SuppliesView = lazy(() => import('./Views/SuppliesView').then(m => ({ default: m.SuppliesView })));
const FindYourAnimalView = lazy(() => import('./Views/FindYourAnimalView').then(m => ({ default: m.FindYourAnimalView })));
const FindYourAnimalResultsView = lazy(() => import('./Views/FindYourAnimalResultsView').then(m => ({ default: m.FindYourAnimalResultsView })));
const CareCalendarView = lazy(() => import('./Views/CareCalendarView').then(m => ({ default: m.CareCalendarView })));
const TaskCreationView = lazy(() => import('./Views/TaskCreationView').then(m => ({ default: m.TaskCreationView })));
const TaskEditView = lazy(() => import('./Views/TaskEditView').then(m => ({ default: m.TaskEditView })));
const MyAnimalsView = lazy(() => import('./Views/MyAnimalsView').then(m => ({ default: m.MyAnimalsView })));
const AnimalDetailView = lazy(() => import('./Views/AnimalDetailView').then(m => ({ default: m.AnimalDetailView })));
const WeightTrackerView = lazy(() => import('./Views/WeightTrackerView').then(m => ({ default: m.WeightTrackerView })));
const EditAnimalView = lazy(() => import('./Views/EditAnimalView').then(m => ({ default: m.EditAnimalView })));
const AddAnimalView = lazy(() => import('./Views/AddAnimalView').then(m => ({ default: m.AddAnimalView })));
const AddEnclosureView = lazy(() => import('./Views/AddEnclosureView').then(m => ({ default: m.AddEnclosureView })));
const EditEnclosureView = lazy(() => import('./Views/EditEnclosureView').then(m => ({ default: m.EditEnclosureView })));
const EnclosureEnvironmentView = lazy(() => import('./Views/EnclosureEnvironmentView').then(m => ({ default: m.EnclosureEnvironmentView })));
const AddInventoryItemView = lazy(() => import('./Views/AddInventoryItemView').then(m => ({ default: m.AddInventoryItemView })));
const EditInventoryItemView = lazy(() => import('./Views/EditInventoryItemView').then(m => ({ default: m.EditInventoryItemView })));
const InventoryView = lazy(() => import('./Views/InventoryView').then(m => ({ default: m.InventoryView })));
const ProfileView = lazy(() => import('./Views/ProfileView').then(m => ({ default: m.ProfileView })));
const CanvasDesigner = lazy(() => import('./EnclosureDesigner/CanvasDesigner'));
const BlogList = lazy(() => import('./Blog/BlogList').then(m => ({ default: m.BlogList })));
const BlogPost = lazy(() => import('./Blog/BlogPost').then(m => ({ default: m.BlogPost })));
const AnimalProfilePreview = lazy(() => import('./AnimalProfilePreview/AnimalProfilePreview').then(m => ({ default: m.AnimalProfilePreview })));
const About = lazy(() => import('./About/About').then(m => ({ default: m.About })));
const Roadmap = lazy(() => import('./Roadmap/Roadmap').then(m => ({ default: m.Roadmap })));
const Home = lazy(() => import('./Home/Home').then(m => ({ default: m.Home })));
const EquipmentTagsBuilder = lazy(() => import('./Admin/EquipmentTagsBuilder'));
const UpgradePage = lazy(() => import('./Upgrade/UpgradePage').then(m => ({ default: m.UpgradePage })));
const PremiumExplainerPage = lazy(() => import('./Upgrade/PremiumExplainerPage').then(m => ({ default: m.PremiumExplainerPage })));
const InstallAppView = lazy(() => import('./Views/InstallAppView').then(m => ({ default: m.InstallAppView })));
const OwnerDashboardView = lazy(() => import('./Views/OwnerDashboardView').then(m => ({ default: m.OwnerDashboardView })));
const WhatsNewView = lazy(() => import('./Views/WhatsNewView').then(m => ({ default: m.WhatsNewView })));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const DashboardView = lazy(() => import('./Views/DashboardView').then(m => ({ default: m.DashboardView })));
const SmartStatusTuner = lazy(() => import('./Dev/SmartStatusTuner'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-3">
      <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
      <p className="text-sm text-muted">Loading...</p>
    </div>
  </div>
);

interface AppRoutesProps {
  readonly onOpenFeedback: () => void;
}

export function AppRoutes({ onOpenFeedback }: AppRoutesProps) {
  const {
    input,
    setInput,
    plan,
    selectedProfile,
    profileCareTargets,
    error,
    handleAnimalSelect,
    handleAnimalSelectWithUrl,
    handleGenerate,
  } = usePlanner();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<AuthDashboardRedirect />} />
        <Route path="/dashboard" element={<AuthRoute><DashboardView /></AuthRoute>} />
        <Route path="/health" element={<AuthRoute><MyAnimalsView /></AuthRoute>} />
        <Route
          path="/animal/:animalId"
          element={
            <AnimalSelectRoute
              input={input}
              selectedProfile={selectedProfile}
              profileCareTargets={profileCareTargets}
              plan={plan}
              onSelect={handleAnimalSelectWithUrl}
              onSelectFromRoute={handleAnimalSelect}
              onContinue={() => navigate('/design')}
            />
          }
        />
        <Route
          path="/animal"
          element={
            <AnimalSelectView
              input={input}
              selectedProfile={selectedProfile}
              profileCareTargets={profileCareTargets}
              plan={plan}
              onSelect={handleAnimalSelectWithUrl}
              onContinue={() => navigate('/design')}
            />
          }
        />
        <Route
          path="/find-animal"
          element={<FindYourAnimalView onAnimalSelected={handleAnimalSelect} />}
        />
        <Route
          path="/find-animal/results"
          element={<FindYourAnimalResultsView onAnimalSelected={handleAnimalSelect} />}
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
        <Route path="/premium" element={<PremiumExplainerPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/whats-new" element={<WhatsNewView />} />
        <Route path="/install" element={<InstallAppView />} />
        <Route path="/owner-dashboard" element={<OwnerRoute><OwnerDashboardView /></OwnerRoute>} />
        <Route path="/care-calendar" element={<AuthRoute><CareCalendarView /></AuthRoute>} />
        <Route path="/care-calendar/tasks/add" element={<AuthRoute><TaskCreationView /></AuthRoute>} />
        <Route path="/care-calendar/tasks/edit/:id" element={<AuthRoute><TaskEditView /></AuthRoute>} />
        <Route path="/my-animals" element={<AuthRoute><MyAnimalsView /></AuthRoute>} />
        <Route path="/weight-tracker/:id" element={<PremiumRoute><WeightTrackerView /></PremiumRoute>} />
        <Route path="/my-animals/:animalId" element={<AuthRoute><AnimalDetailView /></AuthRoute>} />
        <Route path="/my-animals/edit/:id" element={<AuthRoute><EditAnimalView /></AuthRoute>} />
        <Route path="/my-animals/add" element={<AuthRoute><AddAnimalView /></AuthRoute>} />
        <Route path="/care-calendar/enclosures/add" element={<AuthRoute><AddEnclosureView /></AuthRoute>} />
        <Route path="/care-calendar/enclosures/edit/:id" element={<AuthRoute><EditEnclosureView /></AuthRoute>} />
        <Route path="/care-calendar/enclosures/:id/environment" element={<AuthRoute><EnclosureEnvironmentView /></AuthRoute>} />
        <Route path="/inventory" element={<PremiumRoute><InventoryView /></PremiumRoute>} />
        <Route path="/inventory/add" element={<PremiumRoute><AddInventoryItemView /></PremiumRoute>} />
        <Route path="/inventory/edit/:id" element={<PremiumRoute><EditInventoryItemView /></PremiumRoute>} />
        <Route path="/about" element={<About onOpenFeedback={onOpenFeedback} />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/roadmap" element={<Roadmap onOpenFeedback={onOpenFeedback} />} />
        <Route path="/blog" element={<BlogList selectedAnimal={input.animal} />} />
        <Route path="/blog/:postId" element={<BlogPost />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/dev/animals" element={<AnimalProfilePreview />} />
        <Route path="/dev/equipment-tags" element={<EquipmentTagsBuilder />} />
        <Route path="/dev/smart-status" element={<SmartStatusTuner />} />
      </Routes>
    </Suspense>
  );
}

// Helper route component for /animal/:animalId
interface AnimalSelectRouteProps {
  readonly input: import('../engine/types').EnclosureInput;
  readonly selectedProfile?: import('../engine/types').AnimalProfile;
  readonly profileCareTargets?: import('../engine/types').AnimalProfile['careTargets'];
  readonly plan: import('../engine/types').BuildPlan | null;
  readonly onSelect: (id: string) => void;
  readonly onSelectFromRoute: (id: string) => void;
  readonly onContinue: () => void;
}

function AnimalSelectRoute({ input, selectedProfile, profileCareTargets, plan, onSelect, onSelectFromRoute, onContinue }: AnimalSelectRouteProps) {
  const { animalId } = useParams();

  useEffect(() => {
    if (!animalId) return;
    const normalizedId = animalId.toLowerCase();
    if (normalizedId !== input.animal && animalProfiles[normalizedId as keyof typeof animalProfiles]) {
      onSelectFromRoute(normalizedId);
    }
  }, [animalId, input.animal, onSelectFromRoute]);

  return (
    <AnimalSelectView
      input={input}
      selectedProfile={selectedProfile}
      profileCareTargets={profileCareTargets}
      plan={plan}
      onSelect={onSelect}
      onContinue={onContinue}
    />
  );
}

/** Redirect authenticated users to Dashboard, unauthenticated to Home */
function AuthDashboardRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  // Unauthenticated users see the marketing home
  if (!loading && !user) return <Home />;
  return <LoadingFallback />;
}
