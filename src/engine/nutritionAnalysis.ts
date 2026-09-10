/**
 * Nutrition and supplementation analysis
 *
 * The app already counts feeder types and supplement selections. Counting is
 * not the useful part — a keeper can see they used crickets nine times. What
 * they cannot see is that nine cricket feedings with no calcium dusting, in an
 * enclosure whose UVB bulb expired in March, is the exact recipe for metabolic
 * bone disease.
 *
 * This engine reads the two datasets together. That cross-reference is the
 * whole point: D3 supplementation and UVB provision are two routes to the same
 * requirement, so neither number means anything on its own. An animal with
 * strong UVB needs little dietary D3; one with no UVB at all depends on it
 * entirely.
 *
 * Two guardrails on the domain reasoning:
 *
 *   - Diet type gates the rules. A snake eating nothing but mice has a
 *     perfect diet; applying "vary your feeders" or "dust every feeding" to it
 *     would be actively wrong advice. Insectivore rules run only on insect
 *     diets.
 *   - Nothing here is prescriptive about dose or schedule. Correct D3 and
 *     vitamin A frequency is species-specific and genuinely contested, so the
 *     engine reports observed cadence and flags the two ends nobody disputes:
 *     no supplementation at all, and D3 on essentially every feeding.
 */

export type FeederCategory =
  | 'staple-insect'
  | 'occasional-insect'
  | 'treat-insect'
  | 'plant'
  | 'vertebrate'
  | 'unknown';

/**
 * Categories reflect how widely each feeder is recommended as a dietary base.
 * The insect groupings turn on two well-established properties: calcium to
 * phosphorus ratio, and fat content.
 */
export const FEEDER_CATEGORIES: Record<string, FeederCategory> = {
  // Favourable Ca:P or widely recommended as a dietary base.
  'Crickets': 'staple-insect',
  'Dubia Roaches': 'staple-insect',
  'Black Soldier Fly Larvae': 'staple-insect',
  'Silkworms': 'staple-insect',

  // Usable but inverted Ca:P and/or heavy chitin — fine as part of a mix.
  'Mealworms': 'occasional-insect',
  'Superworms': 'occasional-insect',
  'Hornworms': 'occasional-insect',

  // High fat. Widely described as a treat rather than a staple.
  'Waxworms': 'treat-insect',

  'Fruit Mix': 'plant',
  'Vegetable Mix': 'plant',
  'Frozen/Thawed Mouse': 'vertebrate',
};

export type SupplementKind = 'none' | 'calcium' | 'calcium-d3' | 'multivitamin' | 'calcium-multivitamin';

const SUPPLEMENT_KINDS: Record<string, SupplementKind> = {
  'None': 'none',
  'Calcium (no D3)': 'calcium',
  'Calcium + D3': 'calcium-d3',
  'Multivitamin': 'multivitamin',
  'Calcium + Multivitamin': 'calcium-multivitamin',
};

export interface NutritionFeeding {
  date: Date;
  feederType?: string;
  supplementUsed?: string;
  quantityOffered?: number;
  quantityEaten?: number;
  refusalNoted?: boolean;
}

export interface NutritionInput {
  feedings: NutritionFeeding[];
  /** True when the enclosure has a UVB bulb still inside its rated life. */
  hasEffectiveUvb?: boolean;
  /** Set when a bulb exists but is past its rated life — a distinct case. */
  uvbExpired?: boolean;
  generatedAt?: Date;
  /** Feedings older than this are ignored. */
  windowDays?: number;
}

export interface FeederBreakdown {
  name: string;
  category: FeederCategory;
  offerings: number;
  /** Share of all offerings in the window, 0–100. */
  sharePercent: number;
  /** Null when no offering recorded an outcome either way. */
  acceptanceRatePercent: number | null;
}

export interface SupplementBreakdown {
  kind: SupplementKind;
  label: string;
  count: number;
  sharePercent: number;
}

export type NutritionFindingSeverity = 'urgent' | 'watch' | 'note';

export interface NutritionFinding {
  id: string;
  severity: NutritionFindingSeverity;
  title: string;
  detail: string;
}

export interface NutritionAnalysis {
  windowDays: number;
  totalFeedings: number;
  /** What the animal is predominantly eating; drives which rules apply. */
  dietProfile: 'insect' | 'vertebrate' | 'plant' | 'mixed' | 'unknown';
  feeders: FeederBreakdown[];
  supplements: SupplementBreakdown[];
  distinctFeeders: number;
  /** Share of feedings carrying any supplement, 0–100. Null with no data. */
  supplementationRatePercent: number | null;
  /** Share of feedings carrying D3 specifically. Null with no data. */
  d3RatePercent: number | null;
  findings: NutritionFinding[];
  /** True when too little is recorded to say anything responsible. */
  insufficientData: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Below this many feedings, rates are noise and no rule fires. */
const MIN_FEEDINGS_FOR_ANALYSIS = 6;

/** Treat feeders above this share of the diet stop being treats. */
const TREAT_SHARE_WATCH_PERCENT = 25;

/** Supplementation at or below this reads as "essentially never". */
const SUPPLEMENTATION_LOW_PERCENT = 20;

/** D3 at or above this reads as "essentially every feeding". */
const D3_SATURATION_PERCENT = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 90;

const SUPPLEMENT_LABELS: Record<SupplementKind, string> = {
  'none': 'No supplement',
  'calcium': 'Calcium (no D3)',
  'calcium-d3': 'Calcium + D3',
  'multivitamin': 'Multivitamin',
  'calcium-multivitamin': 'Calcium + Multivitamin',
};

const KINDS_WITH_D3 = new Set<SupplementKind>(['calcium-d3']);
const KINDS_WITH_SUPPLEMENT = new Set<SupplementKind>([
  'calcium',
  'calcium-d3',
  'multivitamin',
  'calcium-multivitamin',
]);
const KINDS_WITH_VITAMINS = new Set<SupplementKind>(['multivitamin', 'calcium-multivitamin']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function categorizeFeeder(feederType: string | undefined): FeederCategory {
  if (!feederType) return 'unknown';
  return FEEDER_CATEGORIES[feederType] ?? 'unknown';
}

function classifySupplement(value: string | undefined): SupplementKind {
  if (!value) return 'none';
  return SUPPLEMENT_KINDS[value] ?? 'none';
}

function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

/**
 * Which rules apply. A diet is only "insect" when insects genuinely dominate —
 * otherwise insectivore-specific advice would be misapplied to a snake or a
 * tortoise, where it ranges from irrelevant to harmful.
 */
function resolveDietProfile(feeders: FeederBreakdown[]): NutritionAnalysis['dietProfile'] {
  if (feeders.length === 0) return 'unknown';

  const shareOf = (categories: FeederCategory[]): number =>
    feeders
      .filter((feeder) => categories.includes(feeder.category))
      .reduce((sum, feeder) => sum + feeder.sharePercent, 0);

  const insectShare = shareOf(['staple-insect', 'occasional-insect', 'treat-insect']);
  const vertebrateShare = shareOf(['vertebrate']);
  const plantShare = shareOf(['plant']);

  if (vertebrateShare >= 60) return 'vertebrate';
  if (insectShare >= 60) return 'insect';
  if (plantShare >= 60) return 'plant';
  if (insectShare + vertebrateShare + plantShare >= 60) return 'mixed';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function analyzeNutrition(input: NutritionInput): NutritionAnalysis {
  const now = input.generatedAt ?? new Date();
  const windowDays = input.windowDays ?? DEFAULT_WINDOW_DAYS;
  const cutoff = now.getTime() - windowDays * DAY_MS;

  const feedings = input.feedings.filter((feeding) => feeding.date.getTime() >= cutoff);
  const total = feedings.length;

  // --- Feeder breakdown ---------------------------------------------------
  const feederStats = new Map<string, { offerings: number; accepted: number; outcomeKnown: number }>();

  for (const feeding of feedings) {
    if (!feeding.feederType) continue;
    const entry = feederStats.get(feeding.feederType) ?? { offerings: 0, accepted: 0, outcomeKnown: 0 };
    entry.offerings += 1;

    // An outcome is only known when the keeper recorded one. Treating a blank
    // as "eaten" would inflate every acceptance rate toward 100%.
    const refused = feeding.refusalNoted === true || feeding.quantityEaten === 0;
    const accepted = feeding.quantityEaten !== undefined && feeding.quantityEaten > 0;
    if (refused || accepted) {
      entry.outcomeKnown += 1;
      if (accepted) entry.accepted += 1;
    }

    feederStats.set(feeding.feederType, entry);
  }

  const offeringsTotal = Array.from(feederStats.values()).reduce((sum, entry) => sum + entry.offerings, 0);

  const feeders: FeederBreakdown[] = Array.from(feederStats.entries())
    .map(([name, entry]) => ({
      name,
      category: categorizeFeeder(name),
      offerings: entry.offerings,
      sharePercent: percent(entry.offerings, offeringsTotal),
      acceptanceRatePercent: entry.outcomeKnown > 0 ? percent(entry.accepted, entry.outcomeKnown) : null,
    }))
    .sort((a, b) => b.offerings - a.offerings);

  // --- Supplement breakdown ----------------------------------------------
  const supplementCounts = new Map<SupplementKind, number>();
  for (const feeding of feedings) {
    const kind = classifySupplement(feeding.supplementUsed);
    supplementCounts.set(kind, (supplementCounts.get(kind) ?? 0) + 1);
  }

  const supplements: SupplementBreakdown[] = Array.from(supplementCounts.entries())
    .map(([kind, count]) => ({
      kind,
      label: SUPPLEMENT_LABELS[kind],
      count,
      sharePercent: percent(count, total),
    }))
    .sort((a, b) => b.count - a.count);

  const supplementedCount = feedings.filter((feeding) =>
    KINDS_WITH_SUPPLEMENT.has(classifySupplement(feeding.supplementUsed))
  ).length;
  const d3Count = feedings.filter((feeding) => KINDS_WITH_D3.has(classifySupplement(feeding.supplementUsed))).length;
  const vitaminCount = feedings.filter((feeding) =>
    KINDS_WITH_VITAMINS.has(classifySupplement(feeding.supplementUsed))
  ).length;

  const supplementationRatePercent = total > 0 ? percent(supplementedCount, total) : null;
  const d3RatePercent = total > 0 ? percent(d3Count, total) : null;

  const dietProfile = resolveDietProfile(feeders);
  const insufficientData = total < MIN_FEEDINGS_FOR_ANALYSIS;

  const findings = insufficientData
    ? []
    : buildFindings({
        input,
        feeders,
        dietProfile,
        total,
        supplementationRatePercent,
        d3RatePercent,
        vitaminCount,
      });

  return {
    windowDays,
    totalFeedings: total,
    dietProfile,
    feeders,
    supplements,
    distinctFeeders: feeders.length,
    supplementationRatePercent,
    d3RatePercent,
    findings,
    insufficientData,
  };
}

const SEVERITY_RANK: Record<NutritionFindingSeverity, number> = { urgent: 3, watch: 2, note: 1 };

function buildFindings(context: {
  input: NutritionInput;
  feeders: FeederBreakdown[];
  dietProfile: NutritionAnalysis['dietProfile'];
  total: number;
  supplementationRatePercent: number | null;
  d3RatePercent: number | null;
  vitaminCount: number;
}): NutritionFinding[] {
  const { input, feeders, dietProfile, total, supplementationRatePercent, d3RatePercent, vitaminCount } =
    context;
  const findings: NutritionFinding[] = [];

  // Insect and plant diets are the ones that depend on dusting. A rodent-fed
  // animal gets a whole prey item, and dusting it is neither expected nor
  // useful — so none of the rules below should reach it.
  const dependsOnDusting = dietProfile === 'insect' || dietProfile === 'plant' || dietProfile === 'mixed';

  if (dependsOnDusting && supplementationRatePercent !== null) {
    if (supplementationRatePercent <= SUPPLEMENTATION_LOW_PERCENT) {
      // The severity turns on whether any D3 route exists at all. With no
      // supplementation *and* no working UVB, neither pathway is available.
      const noUvbRoute = input.hasEffectiveUvb === false;
      findings.push({
        id: 'supplementation-low',
        severity: noUvbRoute ? 'urgent' : 'watch',
        title:
          supplementationRatePercent === 0
            ? 'No supplementation recorded on any feeding'
            : `Only ${supplementationRatePercent}% of feedings were supplemented`,
        detail: noUvbRoute
          ? 'There is also no UVB bulb in service for this enclosure, so neither dietary D3 nor UV exposure is providing a route to calcium metabolism. This combination is the common path to metabolic bone disease.'
          : 'Feeder insects are naturally low in calcium relative to phosphorus, which is why dusting is the usual correction. Check whether supplementation is happening but going unlogged.',
      });
    }

    // The opposite failure. Only raised when UVB is genuinely working, because
    // without UVB a high D3 cadence may be entirely appropriate.
    if (
      d3RatePercent !== null &&
      d3RatePercent >= D3_SATURATION_PERCENT &&
      input.hasEffectiveUvb === true
    ) {
      findings.push({
        id: 'd3-saturation',
        severity: 'note',
        title: `D3 given on ${d3RatePercent}% of feedings alongside working UVB`,
        detail:
          'D3 is fat-soluble and accumulates, and this enclosure already provides a UV route to it. Worth confirming the combined level against guidance for this species — appropriate frequency varies widely.',
      });
    }

    if (vitaminCount === 0 && total >= MIN_FEEDINGS_FOR_ANALYSIS) {
      findings.push({
        id: 'no-multivitamin',
        severity: 'note',
        title: 'No multivitamin recorded in this window',
        detail:
          'Calcium dusting alone does not cover vitamin A and the other micronutrients a multivitamin carries. Most schedules include one periodically alongside calcium.',
      });
    }
  }

  // Variety rules apply to invertebrate diets only. A snake on a single prey
  // species is correctly fed; flagging it would be nonsense.
  if (dietProfile === 'insect') {
    const treatShare = feeders
      .filter((feeder) => feeder.category === 'treat-insect')
      .reduce((sum, feeder) => sum + feeder.sharePercent, 0);

    if (treatShare > TREAT_SHARE_WATCH_PERCENT) {
      const names = feeders
        .filter((feeder) => feeder.category === 'treat-insect')
        .map((feeder) => feeder.name)
        .join(', ');
      findings.push({
        id: 'treat-heavy',
        severity: 'watch',
        title: `${treatShare}% of feedings were high-fat treat feeders`,
        detail: `${names} carry high fat and a poor calcium-to-phosphorus ratio. They are widely recommended as an occasional item rather than a dietary base.`,
      });
    }

    if (feeders.length === 1) {
      findings.push({
        id: 'single-feeder',
        severity: 'watch',
        title: `Every feeding used the same feeder (${feeders[0].name})`,
        detail:
          'A single-species insect diet narrows the nutrient profile no matter how good that species is. Rotating two or three feeders is the usual recommendation.',
      });
    }

    const stapleShare = feeders
      .filter((feeder) => feeder.category === 'staple-insect')
      .reduce((sum, feeder) => sum + feeder.sharePercent, 0);

    if (feeders.length > 1 && stapleShare === 0) {
      findings.push({
        id: 'no-staple',
        severity: 'watch',
        title: 'No staple feeder in the rotation',
        detail:
          'The feeders in use are all occasional or treat items. Crickets, dubia roaches, black soldier fly larvae and silkworms are the usual dietary bases.',
      });
    }
  }

  // Refusal patterns per feeder — genuinely specific to this animal, and not
  // something a care sheet can tell anyone.
  const rejected = feeders.filter(
    (feeder) =>
      feeder.acceptanceRatePercent !== null && feeder.acceptanceRatePercent <= 25 && feeder.offerings >= 3
  );
  for (const feeder of rejected) {
    findings.push({
      id: `refused-${feeder.name.toLowerCase().replace(/\s+/g, '-')}`,
      severity: 'note',
      title: `${feeder.name} accepted only ${feeder.acceptanceRatePercent}% of the time`,
      detail: `Offered ${feeder.offerings} times in this window and refused most of them. Worth substituting rather than persisting with it.`,
    });
  }

  return findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}
