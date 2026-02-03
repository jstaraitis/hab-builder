import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, BookOpen, Calendar, MoreHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileNavProps {
  hasAnimal: boolean;
  hasPlan: boolean;
}

export function MobileNav({ hasAnimal, hasPlan }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [animatingPath, setAnimatingPath] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isActive = (path: string) => location.pathname === path;

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
  }, [location.pathname]);

  const navItems = [
    { path: '/animal', icon: Worm, label: 'Animal', enabled: true },
    { path: '/design', icon: Pencil, label: 'Design', enabled: hasAnimal },
    { path: '/supplies', icon: ShoppingCart, label: 'Shop', enabled: hasPlan },
    { path: '/plan', icon: ClipboardList, label: 'Plan', enabled: hasPlan },
  ];

  const moreItems = [
    { path: '/care-calendar', icon: Calendar, label: 'Care Tasks', description: 'Track pet care tasks' },
    { path: '/blog', icon: BookOpen, label: 'Guides', description: 'Care guides & tips' },
  ];

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* Bottom Sheet Menu */}
      {showMoreMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl border-t-2 border-gray-200 dark:border-gray-700 pb-20">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">More</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path) || (item.path === '/blog' && location.pathname.startsWith('/blog'));
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                    }`}
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
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-gray-50/90 dark:from-gray-800/95 dark:to-gray-900/90 backdrop-blur-md border-t-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const enabled = item.enabled;
            const isAnimating = animatingPath === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={enabled ? item.path : '#'}
                className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 -translate-y-1'
                    : enabled
                    ? 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-90 hover:-translate-y-0.5'
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40'
                }`}
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
              showMoreMenu || ['/care-calendar', '/blog'].some(path => location.pathname.startsWith(path))
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 -translate-y-1'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-90 hover:-translate-y-0.5'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${showMoreMenu ? 'stroke-[2.5]' : 'stroke-2'} transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-active:rotate-6`} />
            <span className={`text-[10px] font-bold tracking-tight leading-none mt-0.5 ${showMoreMenu || ['/care-calendar', '/blog'].some(path => location.pathname.startsWith(path)) ? 'text-white' : ''}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
