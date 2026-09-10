import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import { purchaseService, type PurchaseBillingCycle, type TrialEligibility } from '../services/purchaseService';

interface PremiumContextType {
  isPremium: boolean;
  profileLoading: boolean;
  /** True while the user is inside a Stripe/App Store free trial. */
  isTrialing: boolean;
  /** ISO timestamp the trial ends, when one is running. */
  trialEnd: string | null;
  /** Whole days left in the trial, rounded-xl up. Null when not trialing. */
  trialDaysRemaining: number | null;
  /**
   * Whether an upgrade would start a free trial rather than charge today.
   * True if either billing cycle qualifies — use isTrialEligibleFor() wherever
   * a specific cycle is being offered.
   */
  isTrialEligible: boolean;
  /** Per-cycle eligibility. On iOS this reflects Apple's answer, not ours. */
  isTrialEligibleFor: (cycle: PurchaseBillingCycle) => boolean;
  refreshProfile: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  // null on web, or until the App Store answers on native.
  const [nativeTrialEligibility, setNativeTrialEligibility] = useState<TrialEligibility | null>(null);

  // Configure RC anonymously at mount so it's ready before auth resolves.
  // This ensures any in-progress purchases are tracked and can be merged later.
  useEffect(() => {
    purchaseService.configureEarly();
  }, []);

  // Once a user is authenticated, logIn() to RC to merge any anonymous purchases.
  useEffect(() => {
    if (user) {
      purchaseService.initialize(user.id).catch(console.error);
    }
  }, [user?.id]);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setSubscriptionStatus(null);
      setTrialEnd(null);
      setHasUsedTrial(false);
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      const profile = await profileService.getProfile(user.id);
      setIsPremium(profile?.isPremium ?? false);
      setSubscriptionStatus(profile?.subscriptionStatus ?? null);
      setTrialEnd(profile?.trialEnd ?? null);
      setHasUsedTrial(profile?.hasUsedTrial ?? false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setIsPremium(false);
      setSubscriptionStatus(null);
      setTrialEnd(null);
      // Assume the trial is spent on error so we never promise a trial the
      // server will refuse to honour at checkout.
      setHasUsedTrial(true);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Ask the App Store what it would actually charge. Only meaningful for a
  // signed-in non-premium user on native — everyone else keeps null and falls
  // back to the server-side has_used_trial flag.
  useEffect(() => {
    let cancelled = false;

    if (!user || isPremium || !purchaseService.isNative()) {
      setNativeTrialEligibility(null);
      return;
    }

    purchaseService
      .checkTrialEligibility()
      .then((result) => {
        if (!cancelled) setNativeTrialEligibility(result);
      })
      .catch(() => {
        if (!cancelled) setNativeTrialEligibility(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isPremium]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const isTrialing = subscriptionStatus === 'trialing';

  const trialDaysRemaining = useMemo(() => {
    if (!isTrialing || !trialEnd) return null;
    const msLeft = new Date(trialEnd).getTime() - Date.now();
    if (Number.isNaN(msLeft)) return null;
    return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  }, [isTrialing, trialEnd]);

  const isTrialEligibleFor = useCallback((cycle: PurchaseBillingCycle): boolean => {
    if (isPremium) return false;
    // On native the App Store is the authority — it decides what the user is
    // charged, so it must also decide what we promise them. Only fall back to
    // our own flag when there's no App Store answer (web, or lookup failed).
    if (nativeTrialEligibility) return nativeTrialEligibility[cycle];
    if (purchaseService.isNative()) return false;
    return !hasUsedTrial;
  }, [isPremium, nativeTrialEligibility, hasUsedTrial]);

  const value = useMemo<PremiumContextType>(() => ({
    isPremium,
    profileLoading,
    isTrialing,
    trialEnd,
    trialDaysRemaining,
    // Display only — Stripe and the App Store have the final say at checkout.
    isTrialEligible: isTrialEligibleFor('monthly') || isTrialEligibleFor('annual'),
    isTrialEligibleFor,
    refreshProfile,
  }), [isPremium, profileLoading, isTrialing, trialEnd, trialDaysRemaining, isTrialEligibleFor, refreshProfile]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
