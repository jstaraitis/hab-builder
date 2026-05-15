import { supabase } from '../lib/supabase';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'outage' | 'maintenance' | 'info' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  showOnLogin: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

class SystemNotificationService {
  /**
   * Fetch all active system notifications
   */
  async getActiveNotifications(): Promise<SystemNotification[]> {
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active notifications:', error);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      severity: n.severity,
      isActive: n.is_active,
      showOnLogin: n.show_on_login,
      startsAt: n.starts_at,
      endsAt: n.ends_at,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
  }

  /**
   * Get login-page notifications (shown during auth)
   */
  async getLoginNotifications(): Promise<SystemNotification[]> {
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_login', true)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching login notifications:', error);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      severity: n.severity,
      isActive: n.is_active,
      showOnLogin: n.show_on_login,
      startsAt: n.starts_at,
      endsAt: n.ends_at,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
  }

  /**
   * Create a new system notification (admin only)
   */
  async createNotification(notification: Omit<SystemNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<SystemNotification | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be authenticated');

    const { data, error } = await supabase
      .from('system_notifications')
      .insert({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        severity: notification.severity,
        is_active: notification.isActive,
        show_on_login: notification.showOnLogin,
        starts_at: notification.startsAt,
        ends_at: notification.endsAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data ? {
      id: data.id,
      title: data.title,
      message: data.message,
      type: data.type,
      severity: data.severity,
      isActive: data.is_active,
      showOnLogin: data.show_on_login,
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } : null;
  }

  /**
   * Update a notification (admin only)
   */
  async updateNotification(id: string, updates: Partial<Omit<SystemNotification, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.message !== undefined) payload.message = updates.message;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.severity !== undefined) payload.severity = updates.severity;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.showOnLogin !== undefined) payload.show_on_login = updates.showOnLogin;
    if (updates.startsAt !== undefined) payload.starts_at = updates.startsAt;
    if (updates.endsAt !== undefined) payload.ends_at = updates.endsAt;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('system_notifications')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Deactivate a notification
   */
  async deactivateNotification(id: string): Promise<void> {
    await this.updateNotification(id, { isActive: false });
  }

  /**
   * Delete a notification (admin only)
   */
  async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Check if user has opted out of email notifications
   */
  async hasOptedOut(userId: string, emailType: 'marketing' | 'outage' | 'all'): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_opt_out')
      .select('id')
      .eq('user_id', userId)
      .in('email_type', [emailType, 'all'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking opt-out status:', error);
    }

    return !!data;
  }

  /**
   * Opt out from email notifications
   */
  async optOutFromEmails(userId: string, emailType: 'marketing' | 'outage' | 'all'): Promise<void> {
    const { error } = await supabase
      .from('email_opt_out')
      .upsert({
        user_id: userId,
        email_type: emailType,
      }, { onConflict: 'user_id,email_type' });

    if (error) {
      console.error('Error opting out from emails:', error);
      throw error;
    }
  }

  /**
   * Opt back in to email notifications
   */
  async optInToEmails(userId: string, emailType: 'marketing' | 'outage' | 'all'): Promise<void> {
    const { error } = await supabase
      .from('email_opt_out')
      .delete()
      .eq('user_id', userId)
      .eq('email_type', emailType);

    if (error) {
      console.error('Error opting in to emails:', error);
      throw error;
    }
  }
}

export const systemNotificationService = new SystemNotificationService();
