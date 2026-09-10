/**
 * Paywall copy, per source.
 *
 * The wall used to say the same thing however you arrived at it: push
 * reminders, unlimited animals, health tracking. Two problems with that.
 *
 * First, it answers the wrong question. Someone who just tried to build a vet
 * report is not weighing up "unlimited animals" — they have an appointment.
 * Leading with the thing they were actually reaching for is the difference
 * between an upsell and an answer.
 *
 * Second, and more importantly, every feature that generic copy listed —
 * reminders, a care calendar, weight charts, inventory — is given away free by
 * MorphMarket, SnekLog and others. Selling table stakes against free products
 * is not a winnable pitch. What no competitor offers is the judgement layer:
 * whether the setup is actually right, what changed before something went
 * wrong, how the animal compares to others of its species. That is what the
 * copy leads on now.
 */

export interface PaywallCopy {
  /** Replaces the generic headline when the source is known. */
  headline: string;
  /** One sentence answering "why does this cost money". */
  body: string;
}

/**
 * Keyed by PaywallSource. Anything absent falls back to the generic pitch,
 * which is written around validation rather than logging for the same reason.
 */
export const PAYWALL_COPY: Record<string, PaywallCopy> = {
  'health-report': {
    headline: 'Walk into the vet with the whole history',
    body: 'A printable summary of weight, feeding, shedding, stool and husbandry — with the patterns worth raising already picked out. Most keepers arrive with "he has been off his food for a bit". This is the alternative.',
  },
  'setup-check': {
    headline: 'Find out if your setup is actually right',
    body: 'Eight questions, checked against your species\' Ferguson zone and care targets. It catches the errors that take months to show up: UVB mounted out of range, a thermostat probe on the wrong surface, no hide on the cool side.',
  },
  'what-changed': {
    headline: 'Find out what changed before it went wrong',
    body: 'Husbandry problems surface weeks after their cause. This reads your own records back from before the symptom — substrate swaps, bulb changes, temperature drift, a new feeder — so you are not relying on memory.',
  },
  'sitter-sheet': {
    headline: 'Hand someone a care sheet you trust',
    body: 'A dated checklist for whoever covers while you travel, built from your own schedule — plus the things they must NOT do, and your vet\'s number. Written for someone competent who has never kept a reptile.',
  },
  'import': {
    headline: 'Bring your whole collection across',
    body: 'Import from a spreadsheet or any other husbandry app\'s export. You map the columns, nothing is guessed, and duplicates are skipped. Moving years of records should not be the reason you stay put.',
  },
  'weight-tracker': {
    headline: 'See how your animal compares',
    body: 'Weight tracking with growth percentiles built from other keepers\' animals of the same species and age — the reference chart exotics medicine has never had. Plus trend detection that measures against the recent peak, not the oldest reading.',
  },
  'care-analytics': {
    headline: 'Know whether the diet is actually working',
    body: 'Supplementation and feeder analysis read against your UVB provision, because dietary D3 and UV exposure are two routes to the same requirement and neither number means anything alone.',
  },
  'dashboard-alerts': {
    headline: 'Get told before it becomes a problem',
    body: 'Habitat Score grades your enclosure against your species\' targets and your logged readings, then names the single fix worth doing first. Not a log — a verdict.',
  },
  'animal-limit': {
    headline: 'Track your whole collection',
    body: 'Unlimited animals and enclosures, plus the tools that make a collection manageable: setup validation, health reports, growth benchmarks and a sitter sheet.',
  },
  'enclosure-limit': {
    headline: 'Track every enclosure',
    body: 'Unlimited enclosures and animals, each with its own setup check, habitat grade and care schedule.',
  },
  'colonies': {
    headline: 'Stop your feeder colony collapsing',
    body: 'Track what you pull out against what your breeding stock can actually replace. Most colonies fail because nymphs take months to reach feeder size, so harvesting early quietly eats the breeders — and it looks fine right up until it does not.',
  },
  'costs': {
    headline: 'Find out what this actually costs you',
    body: 'Acquisition, vet bills, consumables, feeders and electricity, separated into one-off and ongoing. Heat runs for hours a day and hides inside a household bill — for most keepers it is the largest cost and the one nobody has counted.',
  },
  'inventory': {
    headline: 'Stop running out mid-week',
    body: 'Track supplies, bulb ages and replacement windows, with reminders before something runs out rather than after.',
  },
};

/** The pitch when we do not know how they got here. */
export const DEFAULT_PAYWALL_COPY: PaywallCopy = {
  headline: 'Know your setup is right',
  body: 'Most apps record what you did. Habitat Builder checks it — grading your enclosure against your species\' requirements, catching placement errors, and turning your records into something a vet can read.',
};

export function copyForSource(source: string): PaywallCopy {
  return PAYWALL_COPY[source] ?? DEFAULT_PAYWALL_COPY;
}
