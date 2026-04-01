import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { supabase } from '../lib/supabase';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;
const OFFERING_ID = 'habitatbuilder';

export type PurchaseBillingCycle = 'monthly' | 'annual';

class PurchaseService {
  // Tracks the early configure promise kicked off in main.tsx before React renders
  private earlyConfigurePromise: Promise<void> | null = null;
  private configured = false;
  private loggedIn = false;
  private initPromise: Promise<void> | null = null;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Call this as early as possible (before React renders) so the native SDK
   * singleton is ready long before any user interaction.
   */
  configureEarly(): void {
    if (!this.isNative() || this.earlyConfigurePromise || this.configured) return;

    this.earlyConfigurePromise = (async () => {
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.configured = true;
    })().catch((err) => {
      // Clear so it can be retried if something went wrong
      this.earlyConfigurePromise = null;
      console.error('[RC] Early configure failed:', err);
    }) as Promise<void>;
  }

  /**
   * Called once the authenticated user ID is known. Awaits the early configure
   * then logs in to link the RevenueCat anonymous user to the Supabase user.
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative()) return;

    // Wait for the early configure to finish first
    if (this.earlyConfigurePromise) {
      await this.earlyConfigurePromise;
    } else if (!this.configured) {
      // configureEarly() was never called — do it now as a fallback
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.configured = true;
    }

    if (this.loggedIn) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      await Purchases.logIn({ appUserID: userId });
      this.loggedIn = true;
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async ensureConfigure(): Promise<void> {
    if (!this.isNative()) return;
    if (this.configured) return;
    if (this.earlyConfigurePromise) {
      await this.earlyConfigurePromise;
      return;
    }
    // Last resort — configure now
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    this.configured = true;
  }

  async getOffering() {
    await this.ensureConfigure();
    const offerings = await Purchases.getOfferings();
    return offerings.all[OFFERING_ID] ?? offerings.current;
  }

  async purchase(cycle: PurchaseBillingCycle): Promise<boolean> {
    await this.ensureConfigure();
    const offering = await this.getOffering();
    const pkg = cycle === 'monthly' ? offering?.monthly : offering?.annual;
    if (!pkg) throw new Error(`${cycle} package not available`);

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return !!customerInfo.entitlements.active['premium'];
  }

  async checkEntitlement(): Promise<boolean> {
    if (!this.isNative()) return false;
    await this.ensureConfigure();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['premium'];
  }

  async restorePurchases(): Promise<boolean> {
    await this.ensureConfigure();
    const { customerInfo } = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active['premium'];
  }

  /**
   * Calls the sync-revenuecat edge function to verify entitlements
   * server-side and update the Supabase profile.
   */
  async syncPremiumToSupabase(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const response = await fetch(`${supabaseUrl}/functions/v1/sync-revenuecat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ userToken: session.access_token }),
    });

    if (!response.ok) return false;
    const body = await response.json();
    return body.isPremium === true;
  }
}

export const purchaseService = new PurchaseService();
