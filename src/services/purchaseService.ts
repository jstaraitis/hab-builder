import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { supabase } from '../lib/supabase';

const OFFERING_ID = 'habitatbuilder';

export type PurchaseBillingCycle = 'monthly' | 'annual';

class PurchaseService {
  // On native iOS, RevenueCat is configured in AppDelegate.swift before any JS runs.
  // JS only needs to call logIn() once the user ID is known.
  private loggedIn = false;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** No-op — configure() is handled natively in AppDelegate.swift. */
  configureEarly(): void {
    // Intentionally empty. RevenueCat.configure() is called in AppDelegate.swift
    // before any JavaScript executes, so no JS-side configure is needed.
  }

  /**
   * Links the authenticated Supabase user ID to RevenueCat.
   * The SDK is already configured natively; this just calls logIn().
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative() || this.loggedIn) return;
    await Purchases.logIn({ appUserID: userId });
    this.loggedIn = true;
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
