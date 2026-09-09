# UVB Bulb Lifecycle

## Why this exists

A UVB bulb keeps producing visible light long after its UV output has fallen
below a therapeutic level. A keeper doing everything else right can give an
animal metabolic bone disease with a bulb that looks like it's working. The
only reliable signal is elapsed time since installation.

There was already a UVB age alert, but it assumed a **single 6-month lifespan
for every bulb**. That's wrong by 2x in one direction or the other for most
users: a T5 HO or mercury vapor bulb runs 12 months, a compact coil runs 6. The
old check nagged half the userbase early and under-warned the other half.

## What shipped

- **`src/engine/uvbLifecycle.ts`** — bulb catalog with per-type lifespans, plus
  lifecycle state (`fresh` → `good` → `due-soon` → `overdue` → `critical`),
  computed as a *proportion* of the bulb's rated life rather than a fixed day
  count. 14 unit tests.
- **`UvbLifecycleCard`** (premium, on the dashboard) — life-remaining bar,
  plain-language status, "I replaced it", and an affiliate "Buy replacement"
  link pre-filtered to the correct bulb type.
- **Bulb type on the enclosure form** — captured at creation and editable.
- **`checkUvbBulbAge`** is now type-aware and escalates to `urgent` when a bulb
  is more than a third past its life.
- **`enclosureService.replaceUvbBulb()`** — restarts the lifecycle and writes a
  `uvb_bulb_replaced` enclosure event to the timeline.

## Deploy

1. Run `docs/UVB_BULB_TYPE_MIGRATION.sql` in the Supabase SQL editor. It adds
   `enclosures.uvb_bulb_type` and backfills existing bulbs to `'unknown'`.
2. Deploy the web app.

No edge function changes. The migration is additive, but **run it before
deploying the app** — the enclosure select would otherwise fail on the missing
column, the same failure mode as the trial migration.

## Design decisions

**Unknown bulbs assume the shortest lifespan (6 months).** Replacing a bulb
early wastes about $40; replacing it late costs the animal its bone density.
The card prompts once for the real type, since guessing wrong in the safe
direction still nags T5 HO owners at twice the necessary rate.

**Identifying a bulb doesn't restart the clock.** If a keeper tells us an
existing bulb is a T5 HO, we recalculate the due date from the *original*
install date — the bulb has been in there the whole time. Only "I replaced it"
resets to today.

## Revenue note

The "Buy replacement" link uses the existing Amazon associate tag via
`generateAmazonSearchLink`. Every enclosure with UVB generates a replacement
purchase every 6-12 months, indefinitely — so this feature earns from free
users' *eventual* upgrades and from premium users' recurring purchases.

Worth revisiting once direct ASIN links replace search links; a bulb search
page converts far worse than a specific product.
