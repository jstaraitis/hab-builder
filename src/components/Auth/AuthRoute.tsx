/**
 * AuthRoute Component
 *
 * Wraps routes that require authentication only — no premium check.
 * Used for features available to all signed-in users (free + premium).
 */

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { Auth } from './index';

interface AuthRouteProps {
  readonly children: ReactNode;
}

export function AuthRoute({ children }: AuthRouteProps) {
  const { user } = useAuth();
  const { profileLoading } = usePremium();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full">
          <Auth />
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
