import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  mobileNavOrder?: string[];
}

export interface IProfileService {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateMobileNavOrder(userId: string, order: string[]): Promise<void>;
}

export class SupabaseProfileService implements IProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, mobile_nav_order')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      mobileNavOrder: data.mobile_nav_order ?? undefined,
    };
  }

  async updateMobileNavOrder(userId: string, order: string[]): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, mobile_nav_order: order }, { onConflict: 'id' });

    if (error) throw error;
  }
}

export const profileService = new SupabaseProfileService();
