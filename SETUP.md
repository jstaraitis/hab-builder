# Habitat Builder - Setup Instructions

## Prerequisites
- Node.js (LTS recommended)

## Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Environment Setup
Create `.env.local` at the project root (never commit it):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

## Core Flows to Test
- Plan generation: choose animal -> enter dimensions -> generate plan
- Supplies view: verify tier selection updates shopping list
- Plan view: warnings + care targets present
- Designer: drag equipment from shopping list into layout

## Premium Flows (Requires Supabase + Stripe)
- Care Calendar with task completion logging
- My Animals and Animal Detail views
- Weight Tracking and Inventory
- Premium upgrade/paywall

## Useful Docs
- AI architecture guide: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Supabase care calendar setup: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- Push notifications: [docs/PUSH_NOTIFICATIONS_SETUP.md](docs/PUSH_NOTIFICATIONS_SETUP.md)
- Payments setup: [docs/PAYMENT_SETUP.md](docs/PAYMENT_SETUP.md)

## Troubleshooting
- If env vars change, restart the dev server
- If Supabase errors appear, confirm `.env.local` values and table migrations
- Premium routes require a signed-in user with `is_premium` set in profiles
