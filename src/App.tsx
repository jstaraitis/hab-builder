import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, ShieldAlert, CheckCircle, Instagram } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { usePlanner } from './contexts/PlannerContext';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
import { notificationService } from './services/notificationService';
import { useTheme } from './hooks/useTheme';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { useZoom } from './hooks/useZoom';
import { usePlatform } from './hooks/usePlatform';
import { MobileNav } from './components/Navigation/MobileNav';
import { DesktopNav } from './components/Navigation/DesktopNav';
import { ProgressIndicator } from './components/Navigation/ProgressIndicator';
import { AppRoutes } from './components/AppRoutes';

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const { input, plan } = usePlanner();
  useTheme(); // Apply dark mode
  usePWAUpdate(); // Check for PWA updates
  const { zoom } = useZoom();
  const { isIOS, isNative } = usePlatform();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Validate and cleanup push notification subscriptions on login
  useEffect(() => {
    if (!user) return;
    notificationService.validateAndCleanup().catch((error) => {
      console.error('Error validating push subscriptions:', error);
    });
  }, [user]);

  // Header visibility control based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Scroll to top and reset header on route change
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    setIsHeaderVisible(true);
    setLastScrollY(0);
    const timeoutId = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  const isAnimalRoute = location.pathname === '/animal' || location.pathname.startsWith('/animal/');

  const getCurrentStep = () => {
    if (isAnimalRoute) return 1;
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
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 ${isNative ? 'pb-20' : 'pb-20 lg:pb-0'}`}>
      {/* Header */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 py-2 lg:py-6">
          {/* Mobile: Simple header (also shown on native iOS/Android regardless of screen size) */}
          <div className={`flex flex-col items-center text-center ${isNative ? 'block' : 'lg:hidden'}`}>
            <Link to="/" className="block">
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Custom enclosure plans for reptiles & amphibians</p>
            </Link>
          </div>

          {/* Desktop: Full header with navigation (hidden on native apps) */}
          <div className={isNative ? 'hidden' : 'hidden lg:block'}>
            <div className="text-center mb-4">
              <Link to="/">
                <h1 className="text-4xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Generate custom enclosure plans for your reptiles & amphibians</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Built with love - for better care and fewer setup mistakes</p>
            </div>
            <DesktopNav onOpenFeedback={() => setIsFeedbackOpen(true)} />
          </div>
        </div>
      </header>

      {/* Mobile progress indicator */}
      {(isAnimalRoute || ['/design', '/supplies', '/plan'].includes(location.pathname)) && (
        <ProgressIndicator
          currentStep={getCurrentStep()}
          totalSteps={4}
          steps={progressSteps}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
        <AppRoutes onOpenFeedback={() => setIsFeedbackOpen(true)} />
      </main>

      <MobileNav hasAnimal={!!input.animal} hasPlan={!!plan} onOpenFeedback={() => setIsFeedbackOpen(true)} isNative={isNative} isIOS={isIOS} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Footer — hidden on native apps */}
      <footer className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 lg:mt-16 ${isNative ? 'hidden' : 'hidden lg:block'}`}>
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
              <a href="https://www.instagram.com/frog_habitat_builder" target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400 transition-colors" title="Follow us on Instagram">
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="https://www.tiktok.com/@habitat.builder" target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors" title="Follow us on TikTok">
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.59 7.19a5.78 5.78 0 0 1-3.41-3.4A6 6 0 0 1 16.93 2h-3.72v12.34a3.12 3.12 0 1 1-2.65-3.08V7.53a6.84 6.84 0 0 0-1.14-.1 6.84 6.84 0 1 0 6.84 6.84V9.66a9.52 9.52 0 0 0 4.33 1.05V7.19z" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Install this site as an app from your browser menu (Add to Home Screen).</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Not a substitute for veterinary advice</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
