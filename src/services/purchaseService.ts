import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { supabase } from '../lib/supabase';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;
const OFFERING_ID = 'habitatbuilder';

export type PurchaseBillingCycle = 'monthly' | 'annual';

class PurchaseService {
  private configured = false;
  private loggedIn = false;
  // Single shared promise so concurrent callers all wait on the same initialization
  private initPromise: Promise<void> | null = null;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** No-op kept for call-site compatibility. */
  configureEarly(): void {}

  /**
   * Configures RevenueCat and links the user ID.
   * Called from PremiumContext once auth is resolved.
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative()) return;
    if (this.loggedIn) return;

    // If already in-flight, wait for the same promise instead of running twice
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      // Use VERBOSE in dev so native RC logs are visible in Xcode console
      await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE });

      if (!this.configured) {
        // Pass appUserID in configure so logIn() is implicit — single bridge call
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: userId,
        });
        this.configured = true;
      }

      if (!this.loggedIn) {
        await Purchases.logIn({ appUserID: userId });
        this.loggedIn = true;
      }
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  async getOffering() {
    const offerings = await Purchases.getOfferings();
    return offerings.all[OFFERING_ID] ?? offerings.current;
  }

  async purchase(cycle: PurchaseBillingCycle): Promise<boolean> {
    const offering = await this.getOffering();
    const pkg = cycle === 'monthly' ? offering?.monthly : offering?.annual;
    if (!pkg) throw new Error(`${cycle} package not available`);

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return !!customerInfo.entitlements.active['premium'];
  }

  async checkEntitlement(): Promise<boolean> {
    if (!this.isNative()) return false;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['premium'];
  }

  async restorePurchases(): Promise<boolean> {
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
