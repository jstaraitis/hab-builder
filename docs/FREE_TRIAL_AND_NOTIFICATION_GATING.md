# Free Trial + Push Reminder Gating

Two changes that go together: push reminders became the premium hook, and a
7-day free trial became the way people get to feel them.

## What changed and why

**Push reminders are now premium-only.** `send-task-notifications` previously
filtered on `notification_enabled` alone, so every free user received the exact
feature the upgrade page was selling. Free users still see every task in the
in-app care calendar — they just aren't pushed about it.

**Every new user gets 7 days free.** Checkout previously charged immediately,
which asks someone to pay for a habit tool before they've formed the habit. The
`profiles` table already had `trial_end` and a `trialing` status from
`SUBSCRIPTION_FIELDS_MIGRATION.sql`; it was scaffolded but never wired up.

## Deploy order

Order matters — the migration must land before the functions, or checkout will
error on a missing column.

### 1. Run the migration

Paste `docs/FREE_TRIAL_MIGRATION.sql` into the Supabase SQL Editor.

It adds `profiles.has_used_trial` and backfills it to `TRUE` for anyone who has
already subscribed. **This is what protects the existing 16 members** — without
it they'd be offered a trial they'd have to cancel into.

Verify:

```sql
SELECT has_used_trial, COUNT(*) FROM profiles GROUP BY has_used_trial;
```

Existing premium members must all show `has_used_trial = true`.

### 2. Deploy the edge functions

```bash
supabase functions deploy create-checkout-session ##-- DONE
supabase functions deploy stripe_webhook ## done
supabase functions deploy send-task-notifications
supabase functions deploy sync-revenuecat
```

### 3. Enable the new Stripe webhook event

In the Stripe Dashboard → Developers → Webhooks → your endpoint, add:

- `customer.subscription.trial_will_end`

This fires ~3 days before a trial converts. Stripe emails the customer on its
own; the handler keeps `trial_end` fresh so the app can show a heads-up too.

### 4. Configure the App Store introductory offer (iOS)

The trial length for iOS is **not** set in code — Apple owns it.

In App Store Connect → your app → Subscriptions → open the subscription group,
then for **each** product (monthly *and* annual):

1. **Introductory Offers** → ＋
2. Territories: all. Start date: today. End date: empty (runs indefinitely).
3. Type: **Free Trial**. Duration: **1 week** — Apple's fixed durations don't
   include "7 days", and 1 week is the one that matches the Stripe trial.

Add it to both products. Miss the annual one and annual subscribers are charged
immediately while monthly ones aren't. Introductory offers are a metadata
change — they go live without a new build or app review.

Then confirm RevenueCat reports `period_type: "trial"` on the entitlement after
a sandbox purchase; `sync-revenuecat` maps that to
`subscription_status = 'trialing'`.

**Sandbox testing:** create a tester under Users and Access → Sandbox, sign in
via Settings → App Store → Sandbox Account. Durations are compressed — a 1-week
trial lasts about 3 minutes, so the whole trial→conversion cycle is observable
in a few minutes. Each tester burns its intro-offer eligibility once, so make
several.

The app reads eligibility from Apple at runtime, so until the offer exists the
iOS paywall simply shows normal pricing — it will not promise a trial that
Apple won't honour. The offer can therefore be turned on before or after the
iOS build ships.

### 5. Deploy the web app

```bash
npm run build
```

## How trial eligibility is decided

**Different authorities per platform**, because different systems do the
charging:

| Platform | Authority | Mechanism |
|---|---|---|
| Web (Stripe) | Our database | `has_used_trial = false` and no `stripe_customer_id`, checked in `create-checkout-session` |
| iOS (App Store) | **Apple** | `checkTrialOrIntroductoryPriceEligibility` via RevenueCat, per product |

On iOS, `has_used_trial` is the *wrong* source of truth. Apple tracks intro
offer eligibility per subscription group per Apple ID, and enforces it itself —
a user who previously subscribed on iOS is ineligible no matter what our
database says. Promising them a trial would mean showing the word "free" to
someone Apple charges immediately: a refund complaint, and a plausible App
Review rejection under guideline 3.1.2.

So `usePremium()` exposes:

- `isTrialEligibleFor(cycle)` — per billing cycle. Apple's answer on native,
  ours on web. Use this anywhere a specific cycle is being sold.
- `isTrialEligible` — true if either cycle qualifies. For teasers like
  `PremiumPaywall` that don't select a cycle.

Both are display-only; Stripe and the App Store still decide what they charge.
Every unknown resolves to *not* eligible — under-promising costs a conversion,
over-promising costs a refund and a review flag.

The trial is consumed when it actually starts (in the webhook), not when
checkout is created — so an abandoned checkout doesn't burn it. Cancelling
never resets `has_used_trial`.

## Verifying the notification gate

The function logs eligibility every run:

```
Notification eligibility: 3 premium, 12 free (skipped)
```

and returns `freeUsersSkipped` in its JSON response. The premium lookup **fails
closed** — if the profiles query errors, the cycle throws rather than sending to
everyone, since sending to everyone is the bug this change exists to fix.

## Rollback

The notification gate is the only user-visible removal. To revert it alone,
drop the premium filter block in `send-task-notifications/index.ts` and
redeploy; nothing else depends on it. The trial changes are additive and safe
to leave in place.
