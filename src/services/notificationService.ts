import { supabase } from '../lib/supabase';

export interface INotificationService {
  requestPermission(): Promise<NotificationPermission>;
  isSupported(): boolean;
  getPermissionStatus(): NotificationPermission;
  subscribe(): Promise<void>;
  unsubscribe(): Promise<void>;
  isSubscribed(): Promise<boolean>;
  validateAndCleanup(): Promise<void>;
}

class WebNotificationService implements INotificationService {
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    const registration = await navigator.serviceWorker.ready;

    // Clean up any old subscriptions first (e.g., from previous PWA install)
    await this.cleanupOldSubscriptions();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
    });

    await this.saveSubscription(subscription);
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from database
      await this.removeSubscription(subscription);
      
      // Unsubscribe from push manager
      await subscription.unsubscribe();
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
async validateAndCleanup(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) return;

      // Check if we have a valid browser subscription
      const registration = await navigator.serviceWorker.ready;
      const browserSubscription = await registration.pushManager.getSubscription();

      if (!browserSubscription) {
        // No browser subscription, clean up any orphaned database entries
        await this.cleanupOldSubscriptions();
        return;
      }

      // Get all database subscriptions for this user
      const { data: dbSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint')
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
      }

      const browserEndpoint = browserSubscription.toJSON().endpoint;

      // If database has subscriptions but none match the current browser endpoint
      if (dbSubscriptions && dbSubscriptions.length > 0) {
        const hasMatchingEndpoint = dbSubscriptions.some(
          (sub) => sub.endpoint === browserEndpoint
        );

        if (!hasMatchingEndpoint) {
          // Clean up old subscriptions and save the current one
          console.log('Detected subscription mismatch, cleaning up and resubscribing...');
          await this.cleanupOldSubscriptions();
          await this.saveSubscription(browserSubscription);
        }
      } else if (!dbSubscriptions || dbSubscriptions.length === 0) {
        // User has browser subscription but nothing in database
        // This happens after PWA reinstall - save the subscription
        console.log('Detected browser subscription with no database entry, saving...');
        await this.saveSubscription(browserSubscription);
      }
    } catch (error) {
      console.error('Error validating subscriptions:', error);
    }
  }

  private async saveSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const subscriptionData = subscription.toJSON();
    
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userData.user.id,
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh,
        auth: subscriptionData.keys!.auth,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      });

    if (error) throw error;
  }

  private async removeSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const subscriptionData = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscriptionData.endpoint!);

    if (error) throw error;
  }

  private async cleanupOldSubscriptions(): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user?.id) {
        console.warn('Cannot clean up subscriptions: User not authenticated');
        return;
      }

      // Delete all existing subscriptions for this user
      // This handles the case where the PWA was reinstalled and got a new endpoint
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error cleaning up old subscriptions:', error);
        // Don't throw - allow subscription to continue even if cleanup fails
      }
    } catch (error) {
      console.error('Error cleaning up old subscriptions:', error);
      // Don't throw - allow subscription to continue
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new WebNotificationService();
