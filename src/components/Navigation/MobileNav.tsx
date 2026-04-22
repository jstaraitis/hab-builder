import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  CalendarCheck,
  Plus,
  Turtle,
  MoreHorizontal,
  X,
  BookOpen,
  Info,
  MessageCircle,
  Package,
  User,
  Worm,
  Sparkles,
  Download,
  Gem,
  Scale,
  Leaf,
  BarChart2,
  type LucideIcon,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isOwner } from '../../utils/ownerAccess';

interface MobileNavProps {
  onOpenFeedback?: () => void;
  isNative?: boolean;
  isIOS?: boolean;
}

/* ────────────────────────────────────────────────────────────────────
   Quick-action FAB sheet items
──────────────────────────────────────────────────────────────────── */
interface FabAction {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

const FAB_ACTIONS: FabAction[] = [
  {
    label: 'Log Feeding',
    description: 'Record what your animal ate',
    icon: Scale,
    color: 'bg-amber-500/20 text-amber-400',
    path: '/care-calendar',
  },
  {
    label: 'Log Weight',
    description: 'Track growth over time',
    icon: Scale,
    color: 'bg-blue-500/20 text-blue-400',
    path: '/my-animals',
  },
  {
    label: 'Log Shed',
    description: 'Record a shedding event',
    icon: Leaf,
    color: 'bg-purple-500/20 text-purple-400',
    path: '/my-animals',
  },
  {
    label: 'Start a New Plan',
    description: 'Build an enclosure plan',
    icon: Worm,
    color: 'bg-accent/20 text-accent',
    path: '/animal',
  },
];

/* ────────────────────────────────────────────────────────────────────
   More drawer items
──────────────────────────────────────────────────────────────────── */
interface MoreItem {
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
  showWhen?: 'guest' | 'auth' | 'owner';
}

const MORE_ITEMS: MoreItem[] = [
  { label: 'Enclosure Planner', description: 'Build a new enclosure plan', icon: Worm, path: '/animal' },
  { label: 'Inventory', description: 'Consumables & reorder tracking', icon: Package, path: '/inventory', showWhen: 'auth' },
  { label: 'Care Guides', description: 'Species care library', icon: BookOpen, path: '/blog' },
  { label: "What''s New", description: 'Latest updates', icon: Sparkles, path: '/whats-new' },
  { label: 'Install App', description: 'iOS & Android', icon: Download, path: '/install' },
  { label: 'Premium', description: 'Unlock all features', icon: Gem, path: '/premium', showWhen: 'guest' },
  { label: 'Profile', description: 'Account & subscription', icon: User, path: '/profile' },
  { label: 'About', description: 'About Habitat Builder', icon: Info, path: '/about' },
  { label: 'Owner Dashboard', description: 'App metrics & admin', icon: BarChart2, path: '/owner-dashboard', showWhen: 'owner' },
];

/* ────────────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────────── */
export function MobileNav({ onOpenFeedback, isNative = false, isIOS = false }: Readonly<MobileNavProps>) {
  const { user } = useAuth();
  const ownerUser = isOwner(user);
  const location = useLocation();
  const navigate = useNavigate();

  const [showMore, setShowMore] = useState(false);
  const [showFab, setShowFab] = useState(false);

  const dragStartY = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const visibleMoreItems = MORE_ITEMS.filter((item) => {
    if (item.showWhen === 'guest') return !user;
    if (item.showWhen === 'auth') return Boolean(user);
    if (item.showWhen === 'owner') return ownerUser;
    return true;
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      setShowMore(false);
      setShowFab(false);
    }
    setDragY(0);
    setDragging(false);
  };

  const sheetStyle = {
    transform: `translateY(${dragY}px)`,
    transition: dragging ? 'none' : 'transform 0.3s ease-out',
  };

  return (
    <>
      {(showMore || showFab) && (
        <button
          type="button"
          aria-label="Close menu"
          className={`fixed inset-0 bg-black/60 z-40 ${isNative ? 'block' : 'lg:hidden'}`}
          onClick={() => { setShowMore(false); setShowFab(false); }}
        />
      )}

      {showMore && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} animate-sheet-up`}>
          <div
            className="bg-card rounded-t-3xl border-t border-divider shadow-2xl pb-24"
            style={sheetStyle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-divider rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
              <span className="text-base font-bold text-white">More</span>
              <button onClick={() => setShowMore(false)} className="p-2 hover:bg-card-elevated rounded-full transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="p-3 space-y-1 max-h-[65vh] overflow-y-auto">
              {visibleMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setShowMore(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors text-left ${
                      active ? 'bg-accent/10 border border-accent/30' : 'hover:bg-card-elevated'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      active ? 'bg-accent text-white' : 'bg-card-elevated text-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${active ? 'text-accent' : 'text-white'}`}>{item.label}</div>
                      <div className="text-xs text-muted">{item.description}</div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => { onOpenFeedback?.(); setShowMore(false); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-card-elevated transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-card-elevated flex items-center justify-center text-muted">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Send Feedback</div>
                  <div className="text-xs text-muted">Help us improve</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showFab && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} animate-sheet-up`}>
          <div
            className="bg-card rounded-t-3xl border-t border-divider shadow-2xl pb-24"
            style={sheetStyle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-divider rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
              <span className="text-base font-bold text-white">Quick Add</span>
              <button onClick={() => setShowFab(false)} className="p-2 hover:bg-card-elevated rounded-full transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {FAB_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => { navigate(action.path); setShowFab(false); }}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-card-elevated hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{action.label}</div>
                      <div className="text-xs text-muted leading-tight">{action.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} ${isIOS ? 'pb-safe' : 'safe-area-inset-bottom'}`}>
        <div className="bg-card/95 backdrop-blur-xl border-t border-divider">
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-2">

            {[
              { label: 'Dashboard', icon: House, path: '/' },
              { label: 'Tasks', icon: CalendarCheck, path: '/care-calendar' },
              null,
              { label: 'Pets', icon: Turtle, path: '/my-animals' },
              { label: 'More', icon: MoreHorizontal, path: null },
            ].map((tab) => {
              if (tab === null) {
                return (
                  <div key="fab" className="flex items-center justify-center pb-1">
                    <button
                      onClick={() => { setShowFab(true); setShowMore(false); }}
                      className="w-14 h-14 -translate-y-3 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Plus className="w-7 h-7 text-white stroke-[2.5]" />
                    </button>
                  </div>
                );
              }

              if (tab.path === null) {
                const active = showMore;
                return (
                  <button
                    key="more"
                    onClick={() => { setShowMore(true); setShowFab(false); }}
                    className="flex flex-col items-center justify-center gap-1 py-1 transition-colors"
                  >
                    <MoreHorizontal className={`w-6 h-6 ${active ? 'text-accent' : 'text-muted'}`} />
                    <span className={`text-[10px] font-semibold ${active ? 'text-accent' : 'text-muted'}`}>More</span>
                  </button>
                );
              }

              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center justify-center gap-1 py-1 transition-colors"
                  onClick={() => { setShowMore(false); setShowFab(false); }}
                >
                  <Icon className={`w-6 h-6 transition-colors ${active ? 'text-accent' : 'text-muted'}`} />
                  <span className={`text-[10px] font-semibold ${active ? 'text-accent' : 'text-muted'}`}>{tab.label}</span>
                </Link>
              );
            })}

          </div>
        </div>
      </nav>
    </>
  );
}
