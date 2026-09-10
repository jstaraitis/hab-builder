import { NavLink } from 'react-router-dom';
import { Bell, ClipboardList, LayoutDashboard } from 'lucide-react';

const baseLinkClassName = 'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors';

function linkClassName(isActive: boolean): string {
  if (isActive) {
    return `${baseLinkClassName} border-accent/30 bg-accent/10 text-accent border-accent/30 bg-accent/15 text-accent`;
  }

  return `${baseLinkClassName} border-divider text-secondary hover:bg-card dark:border-divider dark:text-white dark:hover:bg-card-elevated`;
}

export function OwnerSectionNav() {
  return (
    <nav className="rounded-xl border border-divider bg-white p-3 dark:border-divider dark:bg-card">
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
