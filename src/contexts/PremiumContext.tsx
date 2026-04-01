import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';

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
      const profile = await profileService.getProfile(user.id);
      setIsPremium(profile?.isPremium ?? false);
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
