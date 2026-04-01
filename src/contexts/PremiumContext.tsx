import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import { purchaseService } from '../services/purchaseService';

interface PremiumContextType {
  isPremium: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);

      // Initialize RevenueCat on native iOS and link to this user
      await purchaseService.initialize(user.id);

      const profile = await profileService.getProfile(user.id);
      let premium = profile?.isPremium ?? false;

      // On iOS, also check RevenueCat entitlements as authoritative source
      if (purchaseService.isNative() && !premium) {
        premium = await purchaseService.checkEntitlement();
        if (premium) {
          // Sync the confirmed entitlement back to Supabase
          await purchaseService.syncPremiumToSupabase();
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
    refreshProfile,
  }), [isPremium, profileLoading, refreshProfile]);

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
