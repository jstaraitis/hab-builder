/**
 * PremiumRoute Component
 * 
 * Wraps routes that require authentication + premium subscription.
 * Handles the 3-state guard: unauthenticated → Auth, loading → spinner, non-premium → paywall.
 * 
 * Premium state is sourced from PremiumContext — no props needed.
 */

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { Auth } from './index';
import { PremiumPaywall, type PaywallSource } from '../Upgrade/PremiumPaywall';

interface PremiumRouteProps {
  readonly children: ReactNode;
  /** Which gated feature the user was reaching for, for funnel attribution. */
  readonly paywallSource?: PaywallSource;
}

export function PremiumRoute({ children, paywallSource = 'weight-tracker' }: PremiumRouteProps) {
  const { user } = useAuth();
  const { isPremium, profileLoading } = usePremium();

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
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumPaywall source={paywallSource} />;
  }

  return <>{children}</>;
}
