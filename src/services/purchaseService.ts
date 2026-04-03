import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { supabase } from '../lib/supabase';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;
const OFFERING_ID = 'habitatbuilder';
const ENTITLEMENT_ID = 'Habitat Builder Premium';

export type PurchaseBillingCycle = 'monthly' | 'annual';

class PurchaseService {
  private configured = false;
  private loggedIn = false;
  // Single shared promise so concurrent callers all wait on the same initialization
  private initPromise: Promise<void> | null = null;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Configures RC anonymously at app startup (no appUserID).
   * Called early — before auth resolves — so RC is ready to receive purchases.
   * Anonymous sessions allow RC to track any in-progress purchases and later
   * merge them when logIn() is called with the real user ID.
   */
  async configureEarly(): Promise<void> {
    if (!this.isNative()) return;
    if (this.configured) return;
    if (!REVENUECAT_API_KEY) return; // silently skip if key not injected yet
    await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE });
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    this.configured = true;
  }

  /**
   * Links the authenticated user ID to the RC session via logIn().
   * RC will merge any anonymous-session purchases onto the logged-in subscriber.
   * Called from PremiumContext once auth resolves.
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative()) return;
    if (this.loggedIn) return;

    // If already in-flight, wait for the same promise instead of running twice
    if (this.initPromise !== null) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      if (!REVENUECAT_API_KEY) {
        throw new Error('[RC] VITE_REVENUECAT_API_KEY is undefined — add it to your Codemagic environment vars');
      }

      // Ensure configured (in case configureEarly wasn't awaited)
      if (!this.configured) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE });
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.configured = true;
      }

      // logIn() triggers RC identity merge: anonymous purchases transfer to this user
      await Purchases.logIn({ appUserID: userId });
      this.loggedIn = true;
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
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  }

  async checkEntitlement(): Promise<boolean> {
    if (!this.isNative()) return false;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  }

  async restorePurchases(): Promise<boolean> {
    const { customerInfo } = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  }

  /** Returns a debug string showing all active entitlements from RC. */
  async debugRestorePurchases(): Promise<string> {
    const { customerInfo } = await Purchases.restorePurchases();
    const activeKeys = Object.keys(customerInfo.entitlements.active);
    const allKeys = Object.keys(customerInfo.entitlements.all);
    return `Active entitlements: [${activeKeys.join(', ') || 'none'}]\nAll entitlements: [${allKeys.join(', ') || 'none'}]\nOriginal app user ID: ${customerInfo.originalAppUserId}`;
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
