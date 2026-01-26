import { Link, useLocation } from 'react-router-dom';
import { Bug, Pencil, ShoppingCart, ClipboardList, BookOpen, Info } from 'lucide-react';

interface MobileNavProps {
  hasAnimal: boolean;
  hasPlan: boolean;
}

export function MobileNav({ hasAnimal, hasPlan }: MobileNavProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/animal', icon: Bug, label: 'Animal', enabled: true },
    { path: '/design', icon: Pencil, label: 'Design', enabled: hasAnimal },
    { path: '/supplies', icon: ShoppingCart, label: 'Shop', enabled: hasPlan },
    { path: '/plan', icon: ClipboardList, label: 'Plan', enabled: hasPlan },
    { path: '/blog', icon: BookOpen, label: 'Guides', enabled: true },
    { path: '/about', icon: Info, label: 'About', enabled: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-6 gap-1 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const enabled = item.enabled;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={enabled ? item.path : '#'}
              className={`group relative flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-105 -translate-y-1'
                  : enabled
                  ? 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-95 hover:-translate-y-0.5'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40'
              }`}
              onClick={(e) => !enabled && e.preventDefault()}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'} transition-transform duration-200 ${enabled ? 'group-hover:scale-110' : ''}`} />
              <span className={`text-xs font-bold tracking-tight leading-none mt-1 ${active ? 'text-white' : ''}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
