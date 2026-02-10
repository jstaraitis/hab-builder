import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, BookOpen, Calendar, MoreHorizontal, X, Info, MessageCircle, Package, ChevronUp, ChevronDown, SlidersHorizontal, User, Turtle, Ruler, ZoomIn, ZoomOut, Gem, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUnits } from '../../contexts/UnitsContext';
import { profileService } from '../../services/profileService';

interface MobileNavProps {
  hasAnimal: boolean;
  hasPlan: boolean;
  onOpenFeedback?: () => void;
}

type NavRequirement = 'animal' | 'plan';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requires?: NavRequirement;
  showWhen?: 'guest' | 'auth';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'animal', path: '/animal', icon: Worm, label: 'Animal' },
  { id: 'design', path: '/design', icon: Pencil, label: 'Design', requires: 'animal' },
  { id: 'supplies', path: '/supplies', icon: ShoppingCart, label: 'Shop', requires: 'plan' },
  { id: 'plan', path: '/plan', icon: ClipboardList, label: 'Plan', requires: 'plan' },
  { id: 'premium', path: '/premium', icon: Gem, label: 'Premium', description: 'Premium overview', showWhen: 'guest' },
  { id: 'care-calendar', path: '/care-calendar', icon: Calendar, label: 'Care Tasks', description: 'Track pet care tasks' },
  { id: 'my-animals', path: '/my-animals', icon: Turtle, label: 'My Animals', description: 'View all your animals' },
  { id: 'inventory', path: '/inventory', icon: Package, label: 'Inventory', description: 'Consumables & buy again' },
  { id: 'blog', path: '/blog', icon: BookOpen, label: 'Guides', description: 'Care guides & tips' },
  { id: 'about', path: '/about', icon: Info, label: 'About', description: 'About Habitat Builder' },
  { id: 'profile', path: '/profile', icon: User, label: 'Profile', description: 'Name & subscription' },
];

const DEFAULT_ORDER = NAV_ITEMS.map((item) => item.id);

export function MobileNav({ hasAnimal, hasPlan, onOpenFeedback }: Readonly<MobileNavProps>) {
  const { user } = useAuth();
  const { toggleUnits, isMetric } = useUnits();
  const location = useLocation();
  const navigate = useNavigate();
  const [animatingPath, setAnimatingPath] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [navOrder, setNavOrder] = useState<string[]>(DEFAULT_ORDER);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
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

  // Listen for zoom changes from other components (e.g., App.tsx)
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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const isActive = (path: string) => location.pathname === path;

  const normalizeOrder = (order: string[]) => {
    const validIds = new Set(NAV_ITEMS.map((item) => item.id));
    const filtered = order.filter((id) => validIds.has(id));
    const missing = NAV_ITEMS.map((item) => item.id).filter((id) => !filtered.includes(id));
    return [...filtered, ...missing];
  };

  const orderedItems = useMemo(() => {
    const map = new Map(NAV_ITEMS.map((item) => [item.id, item]));
    return navOrder
      .map((id) => map.get(id))
      .filter((item): item is NavItem => Boolean(item))
      .filter((item) => {
        if (item.showWhen === 'guest') return !user;
        if (item.showWhen === 'auth') return Boolean(user);
        if (item.requires === 'animal') return hasAnimal;
        if (item.requires === 'plan') return hasPlan;
        return true;
      });
  }, [navOrder, user, hasAnimal, hasPlan]);

  const bottomItems = orderedItems.slice(0, 4);
  const moreItems = orderedItems.slice(4);
  const morePaths = moreItems.map((item) => item.path);

  // Trigger animation when route changes
  useEffect(() => {
    // Only animate if it's a new route (not initial load)
    if (animatingPath !== location.pathname) {
      setAnimatingPath(location.pathname);
      const timer = setTimeout(() => setAnimatingPath(null), 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Close more menu when route changes
  useEffect(() => {
    setShowMoreMenu(false);
    setShowCustomizeMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setNavOrder(DEFAULT_ORDER);
      return;
    }

    const loadOrder = async () => {
      try {
        const profile = await profileService.getProfile(user.id);
        if (profile?.mobileNavOrder?.length) {
          setNavOrder(normalizeOrder(profile.mobileNavOrder));
        } else {
          setNavOrder(DEFAULT_ORDER);
        }
      } catch (error) {
        console.error('Failed to load mobile nav order:', error);
        setNavOrder(DEFAULT_ORDER);
      }
    };

    loadOrder();
  }, [user]);

  const getEnabled = (item: NavItem) => {
    if (item.requires === 'animal') return hasAnimal;
    if (item.requires === 'plan') return hasPlan;
    return true;
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    setNavOrder((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleSaveOrder = async () => {
    if (!user) {
      setOrderError('Sign in to save your navigation order.');
      return;
    }

    try {
      setSavingOrder(true);
      setOrderError(null);
      await profileService.updateMobileNavOrder(user.id, navOrder);
      setShowCustomizeMenu(false);
    } catch (error) {
      console.error('Failed to save mobile nav order:', error);
      setOrderError('Failed to save your navigation order.');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleResetOrder = () => {
    setNavOrder(DEFAULT_ORDER);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      // Threshold to close
      setShowMoreMenu(false);
      setShowCustomizeMenu(false);
    }
    setDragY(0);
    setIsDragging(false);
    setStartY(0);
  };

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {showMoreMenu && (
        <button
          type="button"
          aria-label="Close more menu"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {showCustomizeMenu && (
        <button
          type="button"
          aria-label="Close customize menu"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowCustomizeMenu(false)}
        />
      )}

      {/* Bottom Sheet Menu */}
      {showMoreMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-300">
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl border-t-2 border-gray-200 dark:border-gray-700 pb-20 transition-transform"
            style={{ 
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">More</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCustomizeMenu(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Customize
                </button>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path) || (item.path === '/blog' && location.pathname.startsWith('/blog'));
                const enabled = getEnabled(item);
                let itemClass = 'border-2 border-transparent opacity-50 cursor-not-allowed';
                if (active) {
                  itemClass = 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800';
                } else if (enabled) {
                  itemClass = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent';
                }
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${itemClass}`}
                    disabled={!enabled}
                  >
                    <div className={`p-3 rounded-xl ${
                      active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${
                        active ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onOpenFeedback?.();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent"
              >
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Feedback</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Share your thoughts</div>
                </div>
              </button>

              {/* Units Toggle */}
              <button
                onClick={() => {
                  toggleUnits();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent"
              >
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Ruler className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isMetric ? 'Metric Units' : 'Imperial Units'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Currently: {isMetric ? 'cm, °C, L' : 'in, °F, gal'}
                  </div>
                </div>
              </button>

              {/* Zoom Controls */}
              <div className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Zoom Level</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Currently: {zoom}%</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 75}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                  >
                    <ZoomOut className="w-4 h-4 inline mr-1" /> Smaller
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 150}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                  >
                    <ZoomIn className="w-4 h-4 inline mr-1" /> Larger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCustomizeMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-300">
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl border-t-2 border-gray-200 dark:border-gray-700 pb-20 transition-transform"
            style={{ 
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customize Nav</h3>
              <button
                onClick={() => setShowCustomizeMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {orderError && (
                <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-200">
                  {orderError}
                </div>
              )}
              {navOrder.map((id, index) => {
                const item = NAV_ITEMS.find((navItem) => navItem.id === id);
                if (!item) return null;
                const Icon = item.icon;
                const canMoveUp = index > 0;
                const canMoveDown = index < navOrder.length - 1;

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!canMoveUp}
                        onClick={() => moveItem(index, index - 1)}
                        className={`p-2 rounded-lg border ${canMoveUp ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700' : 'border-transparent opacity-40 cursor-not-allowed'}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveDown}
                        onClick={() => moveItem(index, index + 1)}
                        className={`p-2 rounded-lg border ${canMoveDown ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700' : 'border-transparent opacity-40 cursor-not-allowed'}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetOrder}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Reset default
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingOrder ? 'Saving...' : 'Save order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-gray-50/90 dark:from-gray-800/95 dark:to-gray-900/90 backdrop-blur-md border-t-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
          {bottomItems.map((item) => {
            const active = isActive(item.path);
            const enabled = getEnabled(item);
            const isAnimating = animatingPath === item.path;
            const Icon = item.icon;
            let stateClass = 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40';
            if (active) {
              stateClass = 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 -translate-y-1';
            } else if (enabled) {
              stateClass = 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-90 hover:-translate-y-0.5';
            }
            
            return (
              <Link
                key={item.path}
                to={enabled ? item.path : '#'}
                className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${stateClass}`}
                onClick={(e) => !enabled && e.preventDefault()}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'} transition-all duration-300 ${
                  enabled ? 'group-hover:scale-110 group-active:scale-95 group-active:rotate-6' : ''
                } ${isAnimating ? 'scale-125 rotate-12' : ''}`} />
                <span className={`text-[10px] font-bold tracking-tight leading-none mt-0.5 ${active ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
              showMoreMenu || morePaths.some((path) => location.pathname.startsWith(path))
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 -translate-y-1'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-90 hover:-translate-y-0.5'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${showMoreMenu ? 'stroke-[2.5]' : 'stroke-2'} transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-active:rotate-6`} />
            <span className={`text-[10px] font-bold tracking-tight leading-none mt-0.5 ${showMoreMenu || morePaths.some((path) => location.pathname.startsWith(path)) ? 'text-white' : ''}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
