import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { supabase } from '../lib/supabase';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;
const OFFERING_ID = 'habitatbuilder';

export type PurchaseBillingCycle = 'monthly' | 'annual';

class PurchaseService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  async initialize(userId: string): Promise<void> {
    if (!this.isNative()) return;

    // If already initializing, wait for that to finish
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    if (this.initialized) return;

    this.initPromise = (async () => {
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      await Purchases.logIn({ appUserID: userId });
      this.initialized = true;
    })();

    await this.initPromise;
    this.initPromise = null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isNative()) return;
    if (this.initialized) return;

    // initialize was never called with a userId — configure without login as fallback
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.initialized = true;
    })();

    await this.initPromise;
    this.initPromise = null;
  }

  async getOffering() {
    await this.ensureInitialized();
    const offerings = await Purchases.getOfferings();
    return offerings.all[OFFERING_ID] ?? offerings.current;
  }

  async purchase(cycle: PurchaseBillingCycle): Promise<boolean> {
    await this.ensureInitialized();
    const offering = await this.getOffering();
    const pkg = cycle === 'monthly' ? offering?.monthly : offering?.annual;
    if (!pkg) throw new Error(`${cycle} package not available`);

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return !!customerInfo.entitlements.active['premium'];
  }

  async checkEntitlement(): Promise<boolean> {
    if (!this.isNative()) return false;
    await this.ensureInitialized();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['premium'];
  }

  async restorePurchases(): Promise<boolean> {
    await this.ensureInitialized();
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
