import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import { purchaseService } from '../services/purchaseService';

interface PremiumContextType {
  isPremium: boolean;
  profileLoading: boolean;
  rcError: string | null;
  refreshProfile: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [rcError, setRcError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      setRcError(null);

      // Initialize RevenueCat on native iOS and link to this user
      try {
        await purchaseService.initialize(user.id);
      } catch (rcErr: any) {
        const msg = rcErr?.message ?? String(rcErr);
        console.error('[RC] initialize failed:', msg);
        setRcError(msg);
        // Fall through — still load Supabase premium status
      }

      const profile = await profileService.getProfile(user.id);
      let premium = profile?.isPremium ?? false;

      // On iOS, also check RevenueCat entitlements as authoritative source
      if (purchaseService.isNative() && !premium && !rcError) {
        try {
          premium = await purchaseService.checkEntitlement();
          if (premium) {
            await purchaseService.syncPremiumToSupabase();
          }
        } catch (rcErr: any) {
          const msg = rcErr?.message ?? String(rcErr);
          console.error('[RC] checkEntitlement failed:', msg);
          setRcError(msg);
        }
      }

      setIsPremium(premium);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setIsPremium(false);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo<PremiumContextType>(() => ({
    isPremium,
    profileLoading,
    rcError,
    refreshProfile,
  }), [isPremium, profileLoading, rcError, refreshProfile]);

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
