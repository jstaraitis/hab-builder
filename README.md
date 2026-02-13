# Habitat Builder

Habitat Builder is a React web app that generates custom enclosure build plans for reptile and amphibian keepers. Users input dimensions and species; the app outputs a complete plan with layout visualizations, shopping lists, care parameters, and build steps. Think "habitat designer" not "care sheet aggregator."

## Key Features
- Deterministic rule engine that generates build plans from enclosure inputs
- Species-aware care targets, warnings, and layout guidance
- Shopping list with setup tiers (minimum, recommended, ideal)
- Premium care tools: Care Calendar, My Animals, Weight Tracking, Inventory
- Blog system with structured JSON content blocks
- Canvas-based designer for drag-and-drop layouts

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth + database) for premium features
- PWA service worker for offline and notifications

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables
Create `.env.local` (never commit it). Common keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

## Project Structure (High Level)
```
src/
  components/          # UI components by feature
  data/                # animals, equipment, blog JSON
  engine/              # deterministic plan generation
  services/            # Supabase CRUD
  types/               # shared TypeScript types
  hooks/               # app hooks (theme, PWA)
```

## Helpful Docs
- Setup: [SETUP.md](SETUP.md)
- AI guidance: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Monetization plan: [docs/MONETIZATION_STRATEGY.md](docs/MONETIZATION_STRATEGY.md)
- Premium payments: [docs/PAYMENT_SETUP.md](docs/PAYMENT_SETUP.md)

## Scripts
```bash
npm run dev      # Start dev server
npm run build    # Type check + production build
npm run lint     # ESLint
npm run preview  # Preview build
```
