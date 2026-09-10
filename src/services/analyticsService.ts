import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

/**
 * Product analytics, stored in our own Supabase project.
 *
 * Two rules govern everything here:
 *
 *  1. Tracking must never break, block, or slow the thing it measures. Every
 *     failure is swallowed; nothing is awaited by a user-facing path.
 *  2. Only record what answers a question we actually have. A funnel we can
 *     read beats an event stream nobody queries.
 */

/** The funnel, plus the feature-usage events worth knowing about. */
export type AnalyticsEvent =
  // Acquisition → activation
  | 'plan_generated'
  | 'signup_completed'
  // Monetisation
  | 'paywall_viewed'
  | 'checkout_started'
  | 'trial_started'
  | 'subscription_activated'
  // Feature usage — is the premium work being opened at all?
  | 'feature_opened';

const ANON_ID_KEY = 'hb_anon_id';

/**
 * Stable per-browser id so a plan generated before signup can be joined to the
 * account it eventually produces. Not a fingerprint — it's a random value the
 * user can clear at any time.
 */
function getAnonymousId(): string | null {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    // Private mode, or storage blocked. Anonymous events simply lose their
    // thread; that's better than throwing inside a tracking call.
    return null;
  }
}

function getPlatform(): string {
  try {
    return Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
  } catch {
    return 'web';
  }
}

/**
 * Records an event. Fire-and-forget by design — callers must not await this,
 * and it never throws.
 */
export function track(
  event: AnalyticsEvent,
  properties: Record<string, unknown> = {}
): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id ?? null;

      await supabase.from('analytics_events').insert({
        user_id: userId,
        anonymous_id: getAnonymousId(),
        event,
        properties,
        platform: getPlatform(),
      });
    } catch (error) {
      // Never surface analytics failures to the user or the console in a way
      // that looks like an app error.
      if (import.meta.env.DEV) {
        console.debug('[analytics] dropped event', event, error);
      }
    }
  })();
}
