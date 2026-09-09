/**
 * Billing constants shared between the paywall UI and checkout.
 *
 * Kept dependency-free on purpose: the paywall renders inside several lazy
 * route chunks, and importing this from stripeService would pull the Stripe
 * SDK into every one of them.
 */

/**
 * Length of the introductory free trial, in days.
 *
 * Display only — the server decides who actually receives a trial, in
 * supabase/functions/create-checkout-session/index.ts (TRIAL_PERIOD_DAYS).
 * Keep both in sync, along with the App Store introductory offer.
 */
export const TRIAL_DAYS = 7;
