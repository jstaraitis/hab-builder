/**
 * PremiumRoute Component
 * 
 * Wraps routes that require authentication + premium subscription.
 * Handles the 3-state guard: unauthenticated → Auth, loading → spinner, non-premium → paywall.
 */

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from './index';
import { PremiumPaywall } from '../Upgrade/PremiumPaywall';

interface PremiumRouteProps {
  readonly children: ReactNode;
  readonly isPremium: boolean;
  readonly profileLoading: boolean;
}

export function PremiumRoute({ children, isPremium, profileLoading }: PremiumRouteProps) {
  const { user } = useAuth();

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

  if (!isPremium) {
    return <PremiumPaywall />;
  }

  return <>{children}</>;
}
