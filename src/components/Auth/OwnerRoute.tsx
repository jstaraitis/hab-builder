import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from './index';
import { isOwner, ownerAccessConfigured } from '../../utils/ownerAccess';

interface OwnerRouteProps {
  readonly children: ReactNode;
}

export function OwnerRoute({ children }: OwnerRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full">
          <Auth />
        </div>
      </div>
    );
  }

  if (!ownerAccessConfigured()) {
    return (
      <div className="max-w-2xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
        <p className="font-semibold">Owner access is not configured.</p>
        <p className="text-sm">Set VITE_OWNER_USER_IDS or VITE_OWNER_EMAILS in your .env.local file.</p>
      </div>
    );
  }

  if (!isOwner(user)) {
    return (
      <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-lg p-4 space-y-2">
        <p className="font-semibold">Access denied.</p>
        <p className="text-sm">This page is restricted to the site owner account.</p>
      </div>
    );
  }

  return <>{children}</>;
}