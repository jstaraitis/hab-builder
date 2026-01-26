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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-6 px-2 py-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const enabled = item.enabled;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={enabled ? item.path : '#'}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-emerald-500 text-white shadow-md scale-105'
                  : enabled
                  ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
              }`}
              onClick={(e) => !enabled && e.preventDefault()}
            >
              <Icon className={`w-8 h-8 mb-2 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-sm font-semibold tracking-tight leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
