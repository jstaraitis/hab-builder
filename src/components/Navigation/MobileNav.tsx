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
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  ClipboardList,
  BarChart2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isOwner } from '../../utils/ownerAccess';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface MobileNavProps {
  onOpenFeedback?: () => void;
  isNative?: boolean;
  isIOS?: boolean;
}

/* ────────────────────────────────────────────────────────────────────
   Quick-action FAB sheet items
──────────────────────────────────────────────────────────────────── */
interface FabAction {
  id: 'new-task' | 'new-inventory' | 'log-feeding' | 'log-weight' | 'log-length' | 'log-poop' | 'log-shedding' | 'log-medical';
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const FAB_ACTIONS: FabAction[] = [
  {
    id: 'new-task',
    label: 'New Task',
    description: 'Create a care task quickly',
    icon: CalendarCheck,
    color: 'bg-accent/20 text-accent',
  },
  {
    id: 'new-inventory',
    label: 'New Inventory',
    description: 'Add inventory item',
    icon: Package,
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'log-feeding',
    label: 'Log Feeding',
    description: 'Jump to feeding logs',
    icon: UtensilsCrossed,
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'log-weight',
    label: 'Log Weight',
    description: 'Open weight entry form',
    icon: Scale,
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'log-length',
    label: 'Log Length',
    description: 'Open length entry form',
    icon: Ruler,
    color: 'bg-violet-500/20 text-violet-300',
  },
  {
    id: 'log-poop',
    label: 'Log Poop',
    description: 'Open poop log form',
    icon: ClipboardList,
    color: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    id: 'log-shedding',
    label: 'Log Shedding',
    description: 'Open shedding log form',
    icon: Sparkles,
    color: 'bg-indigo-500/20 text-indigo-300',
  },
  {
    id: 'log-medical',
    label: 'Log Medical',
    description: 'Open medical record form',
    icon: Stethoscope,
    color: 'bg-rose-500/20 text-rose-300',
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
  colorBg: string;
  colorText: string;
  colorBgDim: string;
  colorTextDim: string;
  showWhen?: 'guest' | 'auth' | 'owner';
}

const MORE_ITEMS: MoreItem[] = [
  { label: 'Planner', description: 'Build a new enclosure', icon: Worm, path: '/animal', colorBg: 'bg-green-500/20', colorText: 'text-green-300', colorBgDim: 'bg-green-500/10', colorTextDim: 'text-green-300' },
  { label: 'Inventory', description: 'Consumables & reorder tracking', icon: Package, path: '/inventory', showWhen: 'auth', colorBg: 'bg-blue-500/20', colorText: 'text-blue-300', colorBgDim: 'bg-blue-500/10', colorTextDim: 'text-blue-300' },
  { label: 'Care Guides', description: 'Species care library', icon: BookOpen, path: '/blog', colorBg: 'bg-amber-500/20', colorText: 'text-amber-300', colorBgDim: 'bg-amber-500/10', colorTextDim: 'text-amber-300' },
  { label: "What''s New", description: 'Latest updates', icon: Sparkles, path: '/whats-new', colorBg: 'bg-purple-500/20', colorText: 'text-purple-300', colorBgDim: 'bg-purple-500/10', colorTextDim: 'text-purple-300' },
  { label: 'Install App', description: 'iOS & Android', icon: Download, path: '/install', colorBg: 'bg-green-500', colorText: 'text-green-300', colorBgDim: 'bg-green-500/10', colorTextDim: 'text-green-300' },
  { label: 'Premium', description: 'Unlock all features', icon: Gem, path: '/premium', showWhen: 'guest', colorBg: 'bg-rose-500/20', colorText: 'text-rose-300', colorBgDim: 'bg-rose-500/10', colorTextDim: 'text-rose-300' },
  { label: 'Profile', description: 'Account & subscription', icon: User, path: '/profile', colorBg: 'bg-cyan-500/20', colorText: 'text-cyan-300', colorBgDim: 'bg-cyan-500/10', colorTextDim: 'text-cyan-300' },
  { label: 'About', description: 'About Habitat Builder', icon: Info, path: '/about', colorBg: 'bg-sky-500', colorText: 'text-sky-300', colorBgDim: 'bg-sky-500/10', colorTextDim: 'text-sky-300' },
  { label: 'Owner Dashboard', description: 'App metrics & admin', icon: BarChart2, path: '/owner-dashboard', showWhen: 'owner', colorBg: 'bg-indigo-500/20', colorText: 'text-indigo-300', colorBgDim: 'bg-indigo-500/10', colorTextDim: 'text-indigo-300' },
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
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<Exclude<FabAction['id'], 'new-task'> | null>(null);
  const [animals, setAnimals] = useState<EnclosureAnimal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);

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

  useEffect(() => {
    if (!showAnimalPicker || !user) return;

    let mounted = true;
    setAnimalsLoading(true);
    enclosureAnimalService.getAllUserAnimals(user.id)
      .then((data) => {
        if (!mounted) return;
        setAnimals(data);
      })
      .catch(() => {
        if (!mounted) return;
        setAnimals([]);
      })
      .finally(() => {
        if (!mounted) return;
        setAnimalsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showAnimalPicker, user]);

  const getLastAnimalId = (): string | null => {
    try {
      return localStorage.getItem('hb:lastAnimalId');
    } catch {
      return null;
    }
  };

  const getFabPath = (actionId: FabAction['id'], animalId?: string): string => {
    const targetAnimalId = animalId || getLastAnimalId();
    switch (actionId) {
      case 'new-task':
        return '/care-calendar/tasks/add?returnTo=%2Fcare-calendar';
      case 'new-inventory':
        return '/inventory';
      case 'log-feeding':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=care` : '/care-calendar';
      case 'log-weight':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=growth&open=weight` : '/my-animals';
      case 'log-length':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=growth&open=length` : '/my-animals';
      case 'log-poop':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=care&open=poop` : '/my-animals';
      case 'log-shedding':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=shedding&open=shed` : '/my-animals';
      case 'log-medical':
        return targetAnimalId ? `/my-animals/${targetAnimalId}?tab=health&open=medical` : '/my-animals';
      default:
        return '/';
    }
  };

  const handleFabAction = (actionId: FabAction['id']) => {
    if (actionId === 'new-task' || actionId === 'new-inventory') {
      navigate(getFabPath(actionId));
      setShowFab(false);
      return;
    }

    setPickerAction(actionId);
    setShowFab(false);
    setShowAnimalPicker(true);
  };

  const handleAnimalSelect = (animalId: string) => {
    if (!pickerAction) return;
    navigate(getFabPath(pickerAction, animalId));
    setShowAnimalPicker(false);
    setPickerAction(null);
  };

  const pickerTitle = pickerAction === 'log-feeding'
    ? 'Select Animal for Feeding Log'
    : pickerAction === 'log-weight'
      ? 'Select Animal for Weight Log'
      : pickerAction === 'log-length'
        ? 'Select Animal for Length Log'
        : pickerAction === 'log-shedding'
          ? 'Select Animal for Shedding Log'
          : pickerAction === 'log-medical'
            ? 'Select Animal for Medical Log'
            : 'Select Animal for Poop Log';

  return (
    <>
      {(showMore || showFab || showAnimalPicker) && (
        <button
          type="button"
          aria-label="Close menu"
          className={`fixed inset-0 bg-black/60 z-40 ${isNative ? 'block' : 'lg:hidden'}`}
          onClick={() => { setShowMore(false); setShowFab(false); setShowAnimalPicker(false); setPickerAction(null); }}
        />
      )}

      {showAnimalPicker && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} animate-sheet-up`}>
          <div
            className="bg-card rounded-t-3xl border-t border-divider shadow-2xl pb-mobile-sheet"
            style={sheetStyle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-divider rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
              <span className="text-base font-bold text-white">{pickerTitle}</span>
              <button onClick={() => { setShowAnimalPicker(false); setPickerAction(null); }} className="p-2 hover:bg-card-elevated rounded-full transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-3 max-h-[65vh] overflow-y-auto">
              {animalsLoading && (
                <p className="text-sm text-muted px-1 py-3">Loading animals...</p>
              )}

              {!animalsLoading && animals.length === 0 && (
                <div className="rounded-2xl border border-divider bg-card-elevated p-4 text-sm text-muted">
                  No animals found yet. Add an animal first to use quick logging.
                </div>
              )}

              {!animalsLoading && animals.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {animals.map((animal) => (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleAnimalSelect(animal.id)}
                      className="text-left rounded-2xl border border-divider bg-card-elevated hover:bg-white/5 transition-colors overflow-hidden"
                    >
                      <div className="w-full h-28 border-b border-divider bg-card flex items-center justify-center overflow-hidden">
                        {animal.photoUrl ? (
                          <img src={animal.photoUrl} alt={animal.name || `Animal #${animal.animalNumber ?? 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <Turtle className="w-8 h-8 text-muted" />
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="text-sm font-semibold text-white truncate">{animal.name || `#${animal.animalNumber ?? 1}`}</div>
                        <div className="text-xs text-muted mt-0.5 truncate">{animal.morph || (animal.enclosureId ? 'Assigned to enclosure' : 'Animal profile')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMore && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} animate-sheet-up`}>
          <div
            className="bg-card rounded-t-3xl border-t border-divider shadow-2xl pb-mobile-sheet"
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
            <div className="p-3 grid grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
              {visibleMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setShowMore(false); }}
                    className="text-left rounded-xl border border-divider bg-card-elevated hover:bg-white/5 transition-colors overflow-hidden"
                  >
                    <div className={`w-full h-10 border-b border-divider flex items-center justify-center ${active ? item.colorBg : item.colorBgDim}`}>
                      <Icon className={`w-5 h-5 ${active ? item.colorText : item.colorTextDim}`} />
                    </div>
                    <div className="px-2 py-2">
                      <div className={`text-xs font-semibold ${active ? item.colorText : item.colorTextDim}`}>{item.label}</div>
                      <div className="text-[10px] text-muted mt-0.5 leading-tight line-clamp-1">{item.description}</div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => { onOpenFeedback?.(); setShowMore(false); }}
                className="text-left rounded-xl border border-divider bg-card-elevated hover:bg-white/5 transition-colors overflow-hidden"
              >
                <div className="w-full h-10 border-b border-divider bg-orange-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-orange-300" />
                </div>
                <div className="px-2 py-2">
                  <div className="text-xs font-semibold text-orange-300">Feedback</div>
                  <div className="text-[10px] text-muted mt-0.5 leading-tight">Help us</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showFab && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNative ? 'block' : 'lg:hidden'} animate-sheet-up`}>
          <div
            className="bg-card rounded-t-3xl border-t border-divider shadow-2xl pb-mobile-sheet"
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
            <div className="p-4 grid grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto">
              {FAB_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleFabAction(action.id)}
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
        <div className="bg-card border-t border-divider">
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-2">

            {[
              { label: 'Dashboard', icon: House, path: '/dashboard' },
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
                      className="w-12 h-12 -translate-y-0 rounded-full bg-accent shadow-sm shadow-accent/30 flex items-center justify-center active:scale-95 transition-transform"
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

      {/* Visual spacer for iOS safe area */}
      {isIOS && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-card" 
          style={{ height: 'env(safe-area-inset-bottom)' }} 
        />
      )}
    </>
  );
}
