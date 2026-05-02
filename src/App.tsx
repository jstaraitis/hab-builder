import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Instagram } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { usePlanner } from './contexts/PlannerContext';
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
import { notificationService } from './services/notificationService';
import { useTheme } from './hooks/useTheme';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { useZoom } from './hooks/useZoom';
import { usePlatform } from './hooks/usePlatform';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { MobileNav } from './components/Navigation/MobileNav';
import { DesktopNav } from './components/Navigation/DesktopNav';
import { AppRoutes } from './components/AppRoutes';
import { enclosureService } from './services/enclosureService';

const ONBOARDING_KEY = 'hab:onboarding:v1:complete';

function App() {
  const location = useLocation();
  const { user } = useAuth();
  usePlanner(); // keep context alive for planner routes
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

  // Redirect new users to onboarding wizard
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(ONBOARDING_KEY) === '1') return;
    // Don't interrupt if they're already in onboarding or on the profile page
    if (location.pathname === '/onboarding') return;
    if (location.pathname === '/profile') return;

    enclosureService.getEnclosures(user.id)
      .then((enclosures) => {
        if (enclosures.length === 0) {
          window.location.replace('/onboarding');
        } else {
          localStorage.setItem(ONBOARDING_KEY, '1');
        }
      })
      .catch(() => { /* silently ignore — don't block the app */ });
  // Only re-run when the user or current page changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  // Clear iOS app icon badge when app launches or returns to foreground
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const clearBadge = () => {
      PushNotifications.removeAllDeliveredNotifications().catch(() => {});
    };

    clearBadge();

    let listenerHandle: { remove: () => void } | undefined;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) clearBadge();
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

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

  return (
    <div className={`min-h-screen bg-surface ${isIOS ? 'pb-safe-page' : isNative ? 'pb-20' : 'pb-20 lg:pb-0'}`}>
      {/* Header */}
      <header className={`bg-card border-b border-divider transition-transform duration-300 ${isNative ? 'hidden' : 'sticky top-0 z-30'} ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div
          className="max-w-7xl mx-auto px-4 py-2 lg:py-6"
          style={isIOS ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
        >
          {/* Mobile: Simple header (also shown on native iOS/Android regardless of screen size) */}
          <div className={`hidden flex-col items-center text-center ${isNative ? 'block' : 'lg:hidden'}`}>
            <Link to="/" className="block">
              <h1 className="text-2xl font-bold text-accent hover:text-accent-dim transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              <p className="text-xs text-muted">Custom enclosure plans for reptiles & amphibians</p>
            </Link>
          </div>

          {/* Desktop: Full header with navigation (hidden on native apps) */}
          <div className={isNative ? 'hidden' : 'hidden lg:block'}>
            <div className="text-center mb-4">
              <Link to="/">
                <h1 className="text-4xl font-bold text-accent hover:text-accent-dim transition-colors cursor-pointer">🦎 Habitat Builder</h1>
              </Link>
              <p className="text-sm text-muted mt-1">Generate custom enclosure plans for your reptiles & amphibians</p>
              <p className="text-sm text-muted mt-1">Built with love - for better care and fewer setup mistakes</p>
            </div>
            <DesktopNav onOpenFeedback={() => setIsFeedbackOpen(true)} />
          </div>
        </div>
      </header>

      {/* Mobile progress indicator — hidden now, planner uses its own internal breadcrumb */}

      <main
        className={`max-w-7xl mx-auto px-4 py-4 lg:py-8 ${isNative ? 'pb-mobile-nav' : ''}`}
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          paddingTop: isIOS ? 'calc(env(safe-area-inset-top) + 1rem)' : undefined,
        }}
      >
        <AppRoutes onOpenFeedback={() => setIsFeedbackOpen(true)} />
      </main>

      <MobileNav onOpenFeedback={() => setIsFeedbackOpen(true)} isNative={isNative} isIOS={isIOS} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Footer — hidden on native apps */}
      <footer className={`bg-card border-t border-divider mt-12 lg:mt-16 ${isNative ? 'hidden' : 'hidden lg:block'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <span className="text-xl md:text-2xl">🦎</span>
            <span className="text-base md:text-lg font-semibold text-white">Habitat Builder</span>
          </div>
          <div className="max-w-2xl mx-auto space-y-2 md:space-y-3 text-xs md:text-sm text-muted">
            <p className="flex items-start justify-center gap-2">
              <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-left"><strong className="text-white">Always research multiple sources</strong> for animal care</span>
            </p>
            <p className="flex items-start justify-center gap-2">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-left">Plans are <strong className="text-white">guidelines</strong> - adjust based on your animal's needs</span>
            </p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-divider">
            <div className="flex items-center justify-center gap-4 mb-3 md:mb-4">
              <a href="https://www.instagram.com/frog_habitat_builder" target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 rounded-lg bg-card-elevated text-muted hover:bg-pink-900/30 hover:text-pink-400 transition-colors" title="Follow us on Instagram">
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="https://www.tiktok.com/@habitat.builder" target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 rounded-lg bg-card-elevated text-muted hover:bg-white/10 hover:text-white transition-colors" title="Follow us on TikTok">
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.59 7.19a5.78 5.78 0 0 1-3.41-3.4A6 6 0 0 1 16.93 2h-3.72v12.34a3.12 3.12 0 1 1-2.65-3.08V7.53a6.84 6.84 0 0 0-1.14-.1 6.84 6.84 0 1 0 6.84 6.84V9.66a9.52 9.52 0 0 0 4.33 1.05V7.19z" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-muted">Available on the <a href="https://apps.apple.com/app/habitat-builder/id6761064884" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">iOS App Store</a>. Android users can add to home screen from the browser menu.</p>
            <p className="text-xs text-muted/60">Not a substitute for veterinary advice</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
