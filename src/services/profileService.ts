import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  displayName?: string;
  isPremium?: boolean;
  mobileNavOrder?: string[];
  subscriptionCancelAt?: string;
  subscriptionPlatform?: string;
  onboardingCompleted?: boolean;
}

export interface IProfileService {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void>;
  updateMobileNavOrder(userId: string, order: string[]): Promise<void>;
}

export class SupabaseProfileService implements IProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, is_premium, mobile_nav_order, subscription_cancel_at, subscription_platform, onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      displayName: data.display_name ?? undefined,
      isPremium: data.is_premium ?? undefined,
      mobileNavOrder: data.mobile_nav_order ?? undefined,
      subscriptionCancelAt: data.subscription_cancel_at ?? undefined,
      subscriptionPlatform: data.subscription_platform ?? undefined,
      onboardingCompleted: data.onboarding_completed ?? undefined,
    };
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const payload: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.isPremium !== undefined) payload.is_premium = updates.isPremium;
    if (updates.mobileNavOrder !== undefined) payload.mobile_nav_order = updates.mobileNavOrder;
    if (updates.onboardingCompleted !== undefined) payload.onboarding_completed = updates.onboardingCompleted;

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
  }

  async updateMobileNavOrder(userId: string, order: string[]): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, mobile_nav_order: order, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) throw error;
  }
}

export const profileService = new SupabaseProfileService();
