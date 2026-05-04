# Owner Dashboard (App-wide Stats) Setup

This dashboard reads **global app stats** (profiles/subscriptions) through a Supabase Edge Function.

## 1) Local app env (`.env.local`)

Set owner identity for frontend route access:

```env
VITE_OWNER_USER_IDS=your-supabase-user-id
VITE_OWNER_EMAILS=your@email.com
```

You can provide one or both as comma-separated values.

## 2) Deploy the Edge Function

If `supabase` is not installed globally on your machine, use `npx supabase` instead.

```bash
npx supabase login
npx supabase link --project-ref lfetekraxyzdbabsopxy
npx supabase functions deploy owner-app-stats --no-verify-jwt
```

If you already have the global CLI installed, this also works:

```bash
supabase functions deploy owner-app-stats --no-verify-jwt
```

## 3) Set Edge Function secrets

Set owner identity for server-side verification:

```bash
npx supabase secrets set OWNER_USER_IDS=your-supabase-user-id
npx supabase secrets set OWNER_EMAILS=your@email.com
```

You can provide one or both as comma-separated values.

## 4) Verify

- Sign in as your owner account.
- Open `/owner-dashboard`.
- Click any profile row in `Recent Profiles` to load that user's detail panel.
- Use `Show all` in `Recent Profiles` to load all profiles instead of only the latest 10.
- You should see app-wide metrics like:
  - Total Profiles
  - Premium Users
  - Active/Trialing/Canceled subscriptions
  - Pending Cancellation
  - Stripe Customers
- The selected profile panel includes:
  - Enclosures
  - Animals
  - Tasks

## Notes

- The dashboard now uses service-role reads inside `owner-app-stats`, so counts are global (not limited by RLS).
- Access is protected in two places:
  - Frontend owner route guard
  - Edge Function owner verification
- `--no-verify-jwt` is required so browser preflight (`OPTIONS`) succeeds; the function still enforces auth/owner checks internally.
- If you change the edge function code, redeploy it again with `npx supabase functions deploy owner-app-stats --no-verify-jwt`.

## Push Notification Send Function

The owner notifications page calls `send-broadcast-notification`, which has its own owner auth gate.

Deploy or redeploy the function after updates:

```bash
npx supabase functions deploy send-broadcast-notification --no-verify-jwt
```

Required secrets for owner authorization:

```bash
npx supabase secrets set OWNER_USER_IDS=your-supabase-user-id
npx supabase secrets set OWNER_EMAILS=your@email.com
```

If either secret is missing (or your signed-in account is not listed), send requests will be rejected.
