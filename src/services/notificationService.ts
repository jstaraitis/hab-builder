import { supabase } from '../lib/supabase';

export interface INotificationService {
  requestPermission(): Promise<NotificationPermission>;
  isSupported(): boolean;
  getPermissionStatus(): NotificationPermission;
  subscribe(): Promise<void>;
  unsubscribe(): Promise<void>;
  isSubscribed(): Promise<boolean>;
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

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
    });

    // Save subscription to database
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

  private async saveSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const subscriptionData = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
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
