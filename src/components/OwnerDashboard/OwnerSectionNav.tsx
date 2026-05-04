import { NavLink } from 'react-router-dom';
import { Bell, ClipboardList, LayoutDashboard } from 'lucide-react';

const baseLinkClassName = 'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';

function linkClassName(isActive: boolean): string {
  if (isActive) {
    return `${baseLinkClassName} border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200`;
  }

  return `${baseLinkClassName} border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`;
}

export function OwnerSectionNav() {
  return (
    <nav className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        <NavLink to="/owner-dashboard" end className={({ isActive }) => linkClassName(isActive)}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/owner-dashboard/surveys" className={({ isActive }) => linkClassName(isActive)}>
          <ClipboardList className="h-4 w-4" />
          Survey Analytics
        </NavLink>
        <NavLink to="/owner-dashboard/notifications" className={({ isActive }) => linkClassName(isActive)}>
          <Bell className="h-4 w-4" />
          Notifications
        </NavLink>
      </div>
    </nav>
  );
}
