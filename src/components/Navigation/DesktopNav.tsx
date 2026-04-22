import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Worm, Pencil, ShoppingCart, ClipboardList, Gem, BookOpen, Info, MessageSquare, HomeIcon, Turtle, ChevronDown, ZoomIn, ZoomOut, Calendar, LogOut, User, Package, Sparkles, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanner } from '../../contexts/PlannerContext';
import { useZoom } from '../../hooks/useZoom';
import { isOwner } from '../../utils/ownerAccess';

interface DesktopNavProps {
  readonly onOpenFeedback: () => void;
}

export function DesktopNav({ onOpenFeedback }: DesktopNavProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { input, plan } = usePlanner();
  const { zoom, handleZoomIn, handleZoomOut, handleResetZoom } = useZoom();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const isOwnerUser = isOwner(user);

  const isActive = (path: string) => {
    if (path === '/animal') {
      return location.pathname === '/animal' || location.pathname.startsWith('/animal/');
    }
    return location.pathname === path;
  };

  // Close dropdowns when route changes
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  return (
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
              <Turtle className="w-4 h-4 inline mr-2" /> Pets
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

      {!user && (
        <Link
          to="/premium"
          className="px-4 py-2 rounded-lg border whitespace-nowrap bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 transition-colors"
        >
          <Gem className="w-4 h-4 inline mr-1.5" /> Premium
        </Link>
      )}

      {/* Settings/Account Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'settings' ? null : 'settings')}
          className={`px-4 py-2 rounded-lg border whitespace-nowrap flex items-center ${['/profile', '/about', '/owner-dashboard'].includes(location.pathname) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400'}`}
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
            <Link
              to="/whats-new"
              onClick={() => setOpenDropdown(null)}
              className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 inline mr-2" /> What&apos;s New
            </Link>
            {isOwnerUser && (
              <Link
                to="/owner-dashboard"
                onClick={() => setOpenDropdown(null)}
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4 inline mr-2" /> Dashboard
              </Link>
            )}
            <button
              onClick={() => {
                onOpenFeedback();
                setOpenDropdown(null);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 inline mr-2" /> Feedback
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
  );
}
