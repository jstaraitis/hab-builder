# Habitat Builder — Full Review & Recommendations

**Date:** March 5, 2026  
**Scope:** Feature ideas (free & premium), code review (modularity, reuse, functionality)

---

## Table of Contents

1. [New Feature Ideas — Free Tier](#1-new-feature-ideas--free-tier)
2. [New Feature Ideas — Premium Tier](#2-new-feature-ideas--premium-tier)
3. [Code Review — Critical Issues](#3-code-review--critical-issues)
4. [Code Review — Medium-Priority Issues](#4-code-review--medium-priority-issues)
5. [Code Review — Low-Priority Issues](#5-code-review--low-priority-issues)
6. [Impact Summary Table](#6-impact-summary-table)
7. [Appendix: Current Feature Inventory](#7-appendix-current-feature-inventory)

---

## 1. New Feature Ideas — Free Tier

### 1.1 Species Comparison Tool

Side-by-side comparison of 2–3 species showing care level, enclosure requirements, cost estimates, temp/humidity ranges, and lifespan.

**Why:** High SEO value, helps undecided beginners, increases time-on-site. Data already exists in animal profiles.

### 1.2 Budget Estimator

Display running cost totals on the Supplies page using the `PriceRange` data already in `ShoppingItem` types — show min/recommended/ideal total costs.

**Why:** You already have `priceRange`/`pricePerUnit` in the equipment catalog. Quick win that answers the #1 beginner question: *"how much will this cost?"*

### 1.3 First-Time Keeper Quiz

A 5-question guided wizard (budget, space, handling preference, experience level, feeding comfort) that recommends the best 3 species and auto-navigates to their profile.

**Why:** Major conversion funnel improvement — many visitors don't know what species they want. The Find Your Animal feature exists but requires users to understand filter categories.

### 1.4 Shareable Plan Links

Encode current `EnclosureInput` state into a URL query string so plans can be shared/bookmarked without an account.

**Why:** Zero backend cost (client-side encoding), viral growth mechanic. Users share on Reddit/Facebook/Discord reptile communities.

### 1.5 Printable Plan Summary

A simple print-optimized CSS view (no PDF library needed) with `@media print` styling for the Plan page — care targets, shopping list, warnings.

**Why:** Users frequently want physical reference sheets. `@media print` is free to implement — no libraries needed.

### 1.6 Community Setup Gallery

Display curated user-submitted enclosure photos organized by species (submitted via feedback/form, manually approved).

**Why:** Social proof, engagement, and content marketing. Already on the roadmap.

### 1.7 Monthly Cost Calculator

Beyond initial setup cost, calculate monthly recurring costs: substrate replacement, bulb replacement, feeder insects, supplements — using the `isRecurring` and `recurringInterval` fields already in `ShoppingItem`.

**Why:** Data already exists in your types; just needs a UI summary card. Helps beginners understand total cost of ownership.

### 1.8 Species Quick-Match Cards

On the home page, show 3–4 "perfect for..." cards like "Best for Beginners", "Best Desktop Pet", "Best Display Animal", "Lowest Maintenance" with auto-filtered results.

**Why:** Faster path-to-engagement from the landing page. Reduces bounce rate by immediately surfacing relevant species.

---

## 2. New Feature Ideas — Premium Tier

### 2.1 Photo Timeline / Growth Journal

Visual timeline of animal photos ordered by date, showing growth progression alongside weight/length data.

**Why:** `animalPhotoService`, `weightTrackingService`, and `lengthLogService` all exist — this just needs a unified timeline UI. High emotional value for keepers who want to see their animal's growth.

### 2.2 Shedding Cycle Analytics

Dashboard showing shed frequency, average days between sheds, shed quality notes, and alerts for abnormal shedding intervals.

**Why:** `shedLogService` exists but has no analytics UI. Shed health is a key husbandry indicator — abnormal shedding often signals environmental or health problems.

### 2.3 Vet Visit Manager

Schedule vet appointments with reminders, log visit notes/costs, track medications and follow-ups.

**Why:** `vetRecordService` is fully built but no UI surfaces it. Premium keepers want organized health records, especially for vet visits where historical data matters.

### 2.4 Brumation Tracker

Log entry/exit dates, weight monitoring during brumation, temperature adjustments, behavior observations.

**Why:** `brumationLogService` exists with no UI. Brumation tracking is critical for species like Uromastyx and Bearded Dragons. Weight loss during brumation is the primary health indicator.

### 2.5 Household / Multi-User Sharing

Invite family members to view and complete care tasks for shared animals.

**Why:** Huge value for households with kids doing chores or partners splitting responsibilities. Natural upsell to a "family plan" tier.

### 2.6 Care Data Export

Export care history, weight logs, feeding records as CSV or formatted PDF report — useful for vet visits or insurance.

**Why:** Premium users generate data they can't currently extract. Export adds professional utility and gives users confidence their data isn't locked in.

### 2.7 Feeding Pattern Intelligence

Analyze feeding acceptance/refusal rates by feeder type, time of day, and temperature — highlight trends like *"your ball python refuses rats on cold days."*

**Why:** Feeding completion data already captures feeder type, quantity offered/eaten, and refusal notes — just needs analytics aggregation. Ball python feeding strikes are the #1 beginner panic moment.

### 2.8 Smart Reorder Reminders

Based on inventory consumption rate and `recurringInterval` data, predict when supplies will run out and send push notification reminders.

**Why:** Combines `inventoryService` + `notificationService` + recurring data — genuinely useful automation that justifies premium.

### 2.9 Enclosure Environment Log

Log daily/weekly temp and humidity readings, visualize trends over time, alert when readings drift outside species-safe ranges.

**Why:** Builds on `careTargets` data. Keepers frequently check parameters manually — a log with alerts turns reactive checking into proactive monitoring.

### 2.10 Seasonal Care Adjustments

Auto-update care task frequencies and tips based on season (summer = more misting for amphibians, winter = check heating equipment).

**Why:** Differentiating feature; no competitor apps do this well. Seasonal changes are a leading cause of husbandry problems.

---

## 3. Code Review — Critical Issues

### 3.1 App.tsx is a 798-line god component

**Files:** `src/App.tsx`

`App.tsx` manages:
- Planner state (`input`, `plan`, `error`)
- Premium/profile state (`isPremium`, `profileLoading`)
- UI state (`isHeaderVisible`, `lastScrollY`, `openDropdown`, `isFeedbackOpen`)
- Zoom level management with localStorage + custom events
- Header scroll behavior (reimplemented inline despite `useHeaderScroll` hook existing)
- Route scroll reset
- Dropdown click-outside handling
- ~200 lines of desktop navigation JSX
- ~100 lines of route definitions
- ~70 lines of footer JSX

**Recommendations:**

1. **Extract `PlannerContext`** — Move `input`, `setInput`, `plan`, `setPlan`, `handleAnimalSelect`, `handleGenerate`, `selectedProfile` into a dedicated context. Eliminates prop drilling to `DesignView`, `SuppliesView`, `PlanView`, `AnimalSelectView`.

2. **Extract `PremiumContext`** (or extend `AuthContext`) — `isPremium` and `profileLoading` are prop-drilled identically into 14 `<PremiumRoute>` instances. A context lets `PremiumRoute` self-serve with zero props.

3. **Extract `useZoom` hook** — Zoom state, localStorage persistence, and custom event handling (lines 83–106) is a self-contained concern.

4. **Extract `<DesktopNav>` and `<AppRoutes>` components** — Navigation JSX alone is ~200 lines. Route definitions are another ~100.

### 3.2 Add/Edit view pairs are ~80% duplicated (3 entity types)

**Files affected:**

| Add View | Edit View | Combined Lines |
|----------|-----------|----------------|
| `src/components/Views/AddAnimalView.tsx` (364 lines) | `src/components/Views/EditAnimalView.tsx` (508 lines) | 872 |
| `src/components/Views/AddEnclosureView.tsx` (314 lines) | `src/components/Views/EditEnclosureView.tsx` (440 lines) | 754 |
| `src/components/Views/AddInventoryItemView.tsx` (316 lines) | `src/components/Views/EditInventoryItemView.tsx` (391 lines) | 707 |

**What's duplicated:**
- **Photo upload UI**: Same photo preview + file chooser + "Choose File" button + "Images will be compressed to under 300KB" message copied across all 4 animal/enclosure views with identical SVG placeholder icons.
- **Form fields**: Name, gender, morph, birthday, notes, enclosure select — identically structured between Add/Edit animal views with duplicate `onChange` handlers and Tailwind classes.
- **Loading/error state renders**: Every edit view has the same loading spinner block and error block with identical markup.
- **Cancel/navigation handler**: `handleCancel` is identical across all Add/Edit views — check `returnTo` param, then `navigate(-1)`.
- **Save button with spinner**: Same inline SVG spinner animation in every form.

**Recommendation:** Create unified form components (`AnimalForm`, `EnclosureForm`, `InventoryForm`) that accept `mode: 'add' | 'edit'` and optional initial data. Extract shared sub-components:
- `PhotoUploadSection` — reusable photo picker with compression notice
- `FormPageLayout` — back button, card wrapper, loading/error states
- `SaveButtonWithSpinner` — save button with loading animation

Estimated savings: **~700 lines**.

### 3.3 `compressImage()` duplicated byte-for-byte between photo services

**Files:** `src/services/animalPhotoService.ts`, `src/services/enclosurePhotoService.ts`

Both files contain identical ~100-line `compressImage()` functions, plus structurally identical upload/delete methods — and both use the same Supabase storage bucket (`animal-photos`).

**Recommendation:** Extract to `src/utils/imageCompression.ts` and create a generic photo service factory:

```typescript
function createPhotoService(bucket: string, pathPrefix: string) {
  return {
    upload(userId: string, file: File) { /* shared logic */ },
    delete(path: string) { /* shared logic */ },
  };
}

export const animalPhotoService = createPhotoService('animal-photos', '');
export const enclosurePhotoService = createPhotoService('animal-photos', 'enclosures/');
```

### 3.4 `calculateNextDueDate` duplicated 3–4 times

**Files:**
- `src/components/Views/AddInventoryItemView.tsx` (inline in component)
- `src/components/Views/EditInventoryItemView.tsx` (inline in component)
- `src/services/inventoryService.ts` (private method)
- `src/services/careTaskService.ts` (similar variant)

**Recommendation:** Extract to `src/utils/dateCalculation.ts` and import in all locations.

---

## 4. Code Review — Medium-Priority Issues

### 4.1 No reusable async data-loading hook (`isMounted` pattern repeated 7+ times)

Every view that loads Supabase data repeats this boilerplate:

```typescript
useEffect(() => {
  let isMounted = true;
  const load = async () => {
    setLoading(true);
    try {
      const result = await someService.getData();
      if (isMounted) setData(result);
    } catch (err) {
      if (isMounted) setError('Failed to load');
    } finally {
      if (isMounted) setLoading(false);
    }
  };
  load();
  return () => { isMounted = false; };
}, []);
```

**Files:** `AddAnimalView`, `EditAnimalView`, `EditEnclosureView`, `EditInventoryItemView`, `TaskEditView`, `WeightTrackerView`, and more.

**Recommendation:** Create a `useAsyncLoad<T>(loadFn, deps)` hook:

```typescript
function useAsyncLoad<T>(loadFn: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... handles isMounted cleanup
  return { data, loading, error, reload };
}
```

Saves ~30–40 lines per component.

### 4.2 `CATEGORY_OPTIONS` and `FREQUENCY_OPTIONS` defined 3 times

**Files:**
- `src/components/Views/AddInventoryItemView.tsx` (lines 8–30)
- `src/components/Views/EditInventoryItemView.tsx` (lines 8–30)
- `src/components/Inventory/InventoryReminders.tsx`

**Recommendation:** Move to `src/constants/inventory.ts` and import from there.

### 4.3 Service layer has copy-paste CRUD boilerplate (7 services)

**Files:** `enclosureService.ts`, `inventoryService.ts`, `weightTrackingService.ts`, `vetRecordService.ts`, `shedLogService.ts`, `brumationLogService.ts`, `lengthLogService.ts`

All follow the same structure:
1. Define interface types and input types
2. Define service interface (`IXxxService`)
3. Implement Supabase class with `getAll`, `getById`, `create`, `update`, `delete`
4. Private `mapFromDb`/`mapToDb` for snake_case ↔ camelCase
5. Export singleton

**Specific duplication:**
- `mapFromDb`/`mapToDb` in each service do the same snake_case-to-camelCase conversion with different field sets
- `update` methods all build `updateData` with `if (updates.X !== undefined) updateData.snake_x = updates.X;` for every field
- Error handling is copy-pasted: `console.error('Error fetching X:', error); throw new Error('Failed to fetch X');`

**Recommendation:** Create a generic base service:

```typescript
class BaseSupabaseService<T, TInput> {
  constructor(
    private table: string,
    private fieldMap: Record<keyof T, string>
  ) {}

  protected mapFromDb(row: any): T { /* auto-convert using fieldMap */ }
  protected mapToDb(obj: Partial<T>): any { /* auto-convert using fieldMap */ }

  async getById(id: string): Promise<T | null> { /* generic */ }
  async getAll(userId: string): Promise<T[]> { /* generic */ }
  async create(item: TInput): Promise<T> { /* generic */ }
  async update(id: string, updates: Partial<TInput>): Promise<T> { /* generic */ }
  async delete(id: string): Promise<void> { /* generic */ }
}
```

Entity-specific services extend it only for custom queries. Estimated long-term savings: **~300+ lines**.

### 4.4 Types defined inline in service files instead of `src/types/`

**Files:**
- `src/services/vetRecordService.ts` — defines `VetRecord`, `VetRecordInput` inline
- `src/services/shedLogService.ts` — defines `ShedLog`, `ShedLogInput` inline
- `src/services/brumationLogService.ts` — defines `BrumationLog`, `BrumationLogInput` inline
- `src/services/lengthLogService.ts` — defines `LengthLog`, `LengthLogInput` inline

These types should live in `src/types/` where `careCalendar.ts`, `inventory.ts`, and `weightTracking.ts` already set the precedent.

**Recommendation:** Move to `src/types/healthTracking.ts` (or per-domain files).

### 4.5 `useHeaderScroll` hook exists but is never used

**Files:** `src/hooks/useHeaderScroll.ts` (unused), `src/App.tsx` lines 132–155 (reimplements the same logic inline)

**Recommendation:** Use the existing hook in App.tsx, or delete the file if the inline implementation is preferred.

### 4.6 `useUnits.ts` hook is dead code

**Files:** `src/hooks/useUnits.ts` (standalone hook), `src/contexts/UnitsContext.tsx` (context version — actually used)

App.tsx imports from `UnitsContext`. The standalone `useUnits.ts` hook is superseded and never imported.

**Recommendation:** Delete `src/hooks/useUnits.ts`.

---

## 5. Code Review — Low-Priority Issues

### 5.1 AuthContext default value guard never triggers

**File:** `src/contexts/AuthContext.tsx`

The context is created with a concrete default:
```typescript
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});
```

The `if (!context)` check in `useAuth()` can never trigger because the default is always truthy. If the provider is accidentally omitted, you get silent stale defaults instead of a useful crash.

**Recommendation:** Use `undefined` as default (matching `UnitsContext` and `ToastContext` patterns):
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### 5.2 Premium status never refreshes after payment

**File:** `src/App.tsx` lines 108–122

Profile is fetched once on mount when `user` changes. After a successful Stripe payment, the user must reload the page to see premium features unlock.

**Recommendation:** Add a `refreshProfile()` callback to the premium context, called after the payment success flow.

### 5.3 Zero test coverage

Vitest is installed and configured but no test files exist. The rule engine (`generatePlan`, shopping list generators, `validateEnclosure`) is pure and deterministic — ideal for unit testing.

**Recommendation:** Start with `src/engine/generatePlan.test.ts`. Priority test cases:
- Micro enclosures (< 12"³) and oversized (> 6'³)
- Extreme width:height ratios (arboreal vs terrestrial)
- Bioactive vs non-bioactive substrate depth calculations
- Multi-animal quantity scaling
- Enclosure type validation for amphibians (screen should warn)
- Aquatic species special handling (no bioactive, substrate restrictions)

### 5.4 `useTheme` hook doesn't match its documentation

**File:** `src/hooks/useTheme.ts`

The copilot-instructions say *"Dark mode via `useTheme()` hook - toggle stored in localStorage"*, but the hook unconditionally sets dark mode with no toggle functionality.

**Recommendation:** Either implement a proper dark/light toggle or update the documentation.

---

## 6. Impact Summary Table

| Priority | Change | Estimated LOC Saved | Complexity |
|----------|--------|---------------------|------------|
| **High** | Merge Add/Edit view pairs into unified form components | ~700 lines | Medium |
| **High** | Extract `PlannerContext` + `PremiumContext` from App.tsx | ~150 lines + cleaner architecture | Medium |
| **Medium** | Extract shared `compressImage` utility | ~100 lines | Low |
| **Medium** | Create `useAsyncLoad` hook | ~200+ lines | Low |
| **Medium** | Shared constants (`CATEGORY_OPTIONS`, `FREQUENCY_OPTIONS`) | ~30 lines | Trivial |
| **Medium** | Extract `calculateNextDueDate` to utils | ~100 lines | Low |
| **Medium** | Base Supabase service class | ~300+ lines long-term | Medium |
| **Medium** | Move types from services to `src/types/` | N/A (consistency) | Trivial |
| **Low** | Delete unused `useHeaderScroll.ts` and `useUnits.ts` | Dead code removal | Trivial |
| **Low** | Fix AuthContext default value guard | N/A (correctness) | Trivial |
| **Low** | Add premium status refresh after payment | N/A (bug fix) | Low |
| **Low** | Add engine unit tests | N/A (test coverage) | Medium |

---

## 7. Appendix: Current Feature Inventory

### Free Features

| Feature | Route | Description |
|---------|-------|-------------|
| Animal Select | `/animal` | Pick from 18 species, see care previews |
| Find Your Animal | `/find-animal` | Filter/search by dimensions, care level, experience |
| Design View | `/design` | Input enclosure dimensions, type, bioactive toggle, setup tier |
| Supplies View | `/supplies` | Auto-generated shopping list with 3 tiers, purchase links |
| Plan View | `/plan` | Complete build plan with steps, warnings, care targets |
| Visual Designer | `/designer` | Konva-based drag-drop canvas with grid, zones, export |
| Blog / Care Guides | `/blog` | 133 posts across 18 species + 7 general guides |
| Species Profiles | `/dev/animals` | Detailed species info pages with care requirements |
| PWA Support | — | Installable, offline page, push notification infrastructure |
| Dark Mode | — | Toggle via localStorage |
| Unit Toggle | — | Imperial ↔ Metric |
| Roadmap | `/roadmap` | Public feature roadmap |
| What's New | `/whats-new` | Changelog |
| Feedback | — | Modal for user suggestions |

### Premium Features ($2.99/mo or $23/yr)

| Feature | Route | Description |
|---------|-------|-------------|
| Care Calendar | `/care-calendar` | Task dashboard, filters, completion flow |
| Task Management | `/care-calendar/tasks/*` | Create/edit care tasks with schedules |
| My Animals | `/my-animals` | Animal hub with enclosure grouping |
| Animal Detail | `/my-animals/:id` | Tabbed health/growth/care/info view |
| Weight Tracking | `/weight-tracker/:id` | Weight logging + analytics |
| Inventory | `/inventory` | Track supplies with low-stock reminders |
| Enclosure Management | `/care-calendar/enclosures/*` | Add/edit enclosure profiles |
| Push Notifications | — | Browser-based care reminders |
| Care Analytics | — | Streaks, heatmaps, completion rates |

### Built But Not Surfaced (Backend Services Without UI)

| Service | File | Status |
|---------|------|--------|
| Vet Records | `src/services/vetRecordService.ts` | Service complete, no UI |
| Shedding Logs | `src/services/shedLogService.ts` | Service complete, no analytics UI |
| Brumation Logs | `src/services/brumationLogService.ts` | Service complete, no UI |
| Length Tracking | `src/services/lengthLogService.ts` | Service + components exist |

### Species Catalog (18 animals)

| Category | Species | Care Level |
|----------|---------|------------|
| Arboreal | White's Tree Frog | Beginner |
| Arboreal | Red-Eyed Tree Frog | Intermediate |
| Arboreal | Amazon Milk Frog | Intermediate |
| Arboreal | Crested Gecko | Beginner |
| Arboreal | Gargoyle Gecko | Beginner |
| Arboreal | Mourning Gecko | Beginner |
| Arboreal | Veiled Chameleon | Advanced |
| Terrestrial | Pacman Frog | Beginner |
| Terrestrial | Tomato Frog | Beginner |
| Terrestrial | Leopard Gecko | Beginner |
| Terrestrial | Bearded Dragon | Intermediate |
| Terrestrial | Blue-Tongue Skink | Intermediate |
| Terrestrial | Uromastyx | Intermediate |
| Snake | Ball Python | Beginner |
| Snake | Corn Snake | Beginner |
| Aquatic | Axolotl | Advanced |
| Aquatic | African Clawed Frog | Intermediate |
| Semi-Aquatic | Red-Eared Slider | Advanced |

### Equipment Catalog

94 items across 11 categories: aquatic (20), nutrition (17), decor (14), substrate (12), heating (10), humidity (5), monitoring (5), enclosures (4), lighting (3), cleanup-crew (2), maintenance (2).
