import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  displayName?: string;
  isPremium?: boolean;
  mobileNavOrder?: string[];
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
      .select('id, display_name, is_premium, mobile_nav_order')
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
    };
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: updates.displayName,
        is_premium: updates.isPremium,
        mobile_nav_order: updates.mobileNavOrder,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

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
