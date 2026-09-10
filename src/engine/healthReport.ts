/**
 * Vet-ready health report
 *
 * An exotics vet gets maybe fifteen minutes with an animal it has never seen,
 * belonging to a species it may treat twice a year. The history the keeper
 * carries in their head is the most valuable thing in the room, and it is
 * almost always delivered as "he's been off his food for a bit, I think".
 *
 * This engine turns the logs the app already holds into the shape a clinician
 * actually reads: who the animal is, how it is being kept, what has changed
 * recently, and what the keeper should be asked about. It deliberately
 * separates three things that a raw data dump conflates:
 *
 *   - concerns   — patterns worth raising, ranked by how much they matter
 *   - history    — the underlying records, so the vet can check our work
 *   - data gaps  — questions we cannot answer, stated plainly
 *
 * The gaps matter as much as the findings. A report that silently omits weight
 * reads as "weight is fine"; one that says "no weight ever recorded" tells the
 * vet to put the animal on a scale. We never let absence look like normal.
 *
 * Nothing here is a diagnosis. Every concern is phrased as an observation with
 * its evidence attached, because the engine knows what was logged and the vet
 * knows what it means.
 */

import { getUvbLifecycleStatus, type UvbBulbType } from './uvbLifecycle';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ReportAnimal {
  name?: string;
  animalNumber?: number;
  speciesName?: string;
  morph?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: Date;
  acquisitionDate?: Date;
  source?: string;
  notes?: string;
}

export interface ReportEnclosure {
  name?: string;
  substrateType?: string;
  substrateDepthInches?: number;
  widthInches?: number;
  depthInches?: number;
  heightInches?: number;
  baselineDayTempTarget?: number;
  baselineNightTempTarget?: number;
  baselineHumidityMinTarget?: number;
  baselineHumidityMaxTarget?: number;
  uvbBulbType?: UvbBulbType;
  uvbBulbInstalledOn?: Date;
  lightingScheduleHours?: number;
}

export interface ReportWeight {
  date: Date;
  grams: number;
}

export interface ReportLength {
  date: Date;
  length: number;
  unit: string;
  measurementType?: string;
}

export interface ReportFeeding {
  date: Date;
  feederType?: string;
  quantityOffered?: number;
  quantityEaten?: number;
  refusalNoted?: boolean;
  supplementUsed?: string;
  notes?: string;
}

export interface ReportShed {
  date: Date;
  quality?: 'complete' | 'incomplete' | 'stuck-shed' | 'assisted';
  problemAreas?: string[];
  notes?: string;
}

export interface ReportPoop {
  date: Date;
  consistency?: string;
  color?: string;
  amount?: string;
  uratePresent?: boolean;
  parasitesSeen?: boolean;
  notes?: string;
}

export interface ReportVetVisit {
  date: Date;
  visitType: string;
  vetName?: string;
  clinicName?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string[];
  followUpNeeded?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

export interface ReportEnvironment {
  /** Most recent recorded readings, whatever their age. */
  baskingTempF?: number;
  coolTempF?: number;
  ambientTempF?: number;
  humidityPercent?: number;
  recordedAt?: Date;
}

export interface HealthReportInput {
  animal: ReportAnimal;
  enclosure?: ReportEnclosure;
  environment?: ReportEnvironment;
  weights?: ReportWeight[];
  lengths?: ReportLength[];
  feedings?: ReportFeeding[];
  sheds?: ReportShed[];
  poops?: ReportPoop[];
  vetVisits?: ReportVetVisit[];
  /** Defaults to now. Injected so tests and print output are deterministic. */
  generatedAt?: Date;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type ConcernSeverity = 'urgent' | 'watch' | 'note';

export interface HealthConcern {
  id: string;
  severity: ConcernSeverity;
  /** Short clinical phrasing, e.g. "Weight down 12% in 90 days". */
  title: string;
  /** One sentence of context a vet can act on. */
  detail: string;
  /** The specific records behind the claim, so the finding is checkable. */
  evidence: string[];
}

export interface WeightSummary {
  currentGrams: number;
  currentDate: Date;
  firstDate: Date;
  entries: number;
  /** Null when there is no earlier reading inside the window to compare with. */
  change30dPercent: number | null;
  change90dPercent: number | null;
  peak90dGrams: number | null;
  trend: 'gaining' | 'stable' | 'losing' | 'insufficient-data';
}

export interface FeedingSummary {
  entries: number;
  lastFedDate: Date | null;
  daysSinceLastFed: number | null;
  /** Refusals counted back from the most recent record until an accepted meal. */
  consecutiveRefusals: number;
  refusalsIn90Days: number;
  acceptedIn90Days: number;
  /** Mean gap between accepted meals; null with fewer than two. */
  averageDaysBetweenMeals: number | null;
}

export interface ShedSummary {
  entries: number;
  lastShedDate: Date | null;
  daysSinceLastShed: number | null;
  problemShedsIn180Days: number;
  averageDaysBetweenSheds: number | null;
}

export interface DefecationSummary {
  entries: number;
  lastDate: Date | null;
  daysSinceLast: number | null;
  abnormalIn90Days: number;
  parasitesEverSeen: boolean;
}

export interface HealthReport {
  generatedAt: Date;
  animalLabel: string;
  ageDescription: string | null;
  /** Ranked most severe first; empty when nothing stood out. */
  concerns: HealthConcern[];
  weight: WeightSummary | null;
  feeding: FeedingSummary | null;
  shed: ShedSummary | null;
  defecation: DefecationSummary | null;
  vetVisits: ReportVetVisit[];
  /** Plain statements of what could not be assessed and why it matters. */
  dataGaps: string[];
  /** True when so little is recorded that the report cannot stand alone. */
  insufficientData: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/**
 * Weight loss percentages. Reptiles lose condition slowly, so a drop that would
 * be unremarkable in a mammal over a week is significant here over a quarter.
 * 10% is the figure most exotics references treat as clinically meaningful.
 */
const WEIGHT_LOSS_URGENT_PERCENT = 10;
const WEIGHT_LOSS_WATCH_PERCENT = 5;

/** Below this, a weight change is noise from scale drift or gut contents. */
const WEIGHT_STABLE_BAND_PERCENT = 3;

const REFUSALS_URGENT = 5;
const REFUSALS_WATCH = 3;

/** Abnormal stools within 90 days before it reads as a pattern, not an event. */
const ABNORMAL_STOOL_WATCH_COUNT = 3;

const ABNORMAL_CONSISTENCIES = new Set(['runny', 'watery', 'mucus', 'bloody', 'soft']);
/** These are worth raising on a single occurrence. */
const CRITICAL_CONSISTENCIES = new Set(['bloody', 'mucus']);

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function byDateDesc<T extends { date: Date }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function within<T extends { date: Date }>(entries: T[], now: Date, days: number): T[] {
  const cutoff = now.getTime() - days * DAY_MS;
  return entries.filter((entry) => entry.date.getTime() >= cutoff);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${Math.round(grams)} g`;
}

function describeAge(birthday: Date | undefined, now: Date): string | null {
  if (!birthday) return null;
  const days = daysBetween(now, birthday);
  if (days < 0) return null;
  if (days < 60) return `${days} days old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} months old`;
  const years = Math.floor(days / 365.25);
  const remainderMonths = Math.floor((days - years * 365.25) / 30.44);
  return remainderMonths > 0 ? `${years}y ${remainderMonths}m old` : `${years} years old`;
}

function buildAnimalLabel(animal: ReportAnimal): string {
  if (animal.name) return animal.name;
  if (animal.animalNumber) return `Animal #${animal.animalNumber}`;
  return animal.speciesName ?? 'Unnamed animal';
}

// ---------------------------------------------------------------------------
// Section summaries
// ---------------------------------------------------------------------------

function summarizeWeight(weights: ReportWeight[], now: Date): WeightSummary | null {
  if (weights.length === 0) return null;

  const sorted = byDateDesc(weights);
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  // Compared against the heaviest recent reading rather than the oldest one.
  // An animal that gained then lost has a flat first-to-last delta while
  // actually being in decline, and the decline is the part that matters.
  const peakIn = (days: number): number | null => {
    const window = within(sorted, now, days).filter((entry) => entry !== latest);
    if (window.length === 0) return null;
    return Math.max(...window.map((entry) => entry.grams));
  };

  const percentFromPeak = (peak: number | null): number | null => {
    if (peak === null || peak === 0) return null;
    return Number((((latest.grams - peak) / peak) * 100).toFixed(1));
  };

  const peak30 = peakIn(30);
  const peak90 = peakIn(90);
  const change90 = percentFromPeak(peak90);

  // Direction is judged against the *earliest* reading in the window, not the
  // peak. An animal gaining steadily is always at its own peak, so a
  // peak-based comparison can never register a gain — it would report every
  // healthy grower as "stable". The peak comparison stays where it belongs, in
  // the loss concern, which is the case it was chosen to catch.
  // A meaningful drop from the peak still reads as losing even when the animal
  // ends the window where it started — gain-then-loss is a decline, not a wash.
  const windowStart = within(sorted, now, 90).filter((entry) => entry !== latest).pop() ?? null;
  let trend: WeightSummary['trend'];
  if (sorted.length < 2 || windowStart === null || windowStart.grams === 0) {
    trend = 'insufficient-data';
  } else if (change90 !== null && change90 <= -WEIGHT_LOSS_WATCH_PERCENT) {
    trend = 'losing';
  } else {
    const directionPercent = ((latest.grams - windowStart.grams) / windowStart.grams) * 100;
    if (directionPercent <= -WEIGHT_STABLE_BAND_PERCENT) {
      trend = 'losing';
    } else if (directionPercent >= WEIGHT_STABLE_BAND_PERCENT) {
      trend = 'gaining';
    } else {
      trend = 'stable';
    }
  }

  return {
    currentGrams: latest.grams,
    currentDate: latest.date,
    firstDate: oldest.date,
    entries: sorted.length,
    change30dPercent: percentFromPeak(peak30),
    change90dPercent: change90,
    peak90dGrams: peak90,
    trend,
  };
}

function summarizeFeeding(feedings: ReportFeeding[], now: Date): FeedingSummary | null {
  if (feedings.length === 0) return null;

  const sorted = byDateDesc(feedings);
  const wasRefused = (entry: ReportFeeding): boolean =>
    entry.refusalNoted === true || entry.quantityEaten === 0;

  let consecutiveRefusals = 0;
  for (const entry of sorted) {
    if (!wasRefused(entry)) break;
    consecutiveRefusals += 1;
  }

  const recent = within(sorted, now, 90);
  const accepted = sorted.filter((entry) => !wasRefused(entry));
  const lastFed = accepted[0] ?? null;

  // Gaps are measured between accepted meals only. Counting refusals would
  // shorten the apparent interval precisely when the animal has stopped eating.
  let averageGap: number | null = null;
  if (accepted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < accepted.length - 1; i += 1) {
      gaps.push(daysBetween(accepted[i].date, accepted[i + 1].date));
    }
    averageGap = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
  }

  return {
    entries: sorted.length,
    lastFedDate: lastFed?.date ?? null,
    daysSinceLastFed: lastFed ? daysBetween(now, lastFed.date) : null,
    consecutiveRefusals,
    refusalsIn90Days: recent.filter(wasRefused).length,
    acceptedIn90Days: recent.filter((entry) => !wasRefused(entry)).length,
    averageDaysBetweenMeals: averageGap,
  };
}

function summarizeShed(sheds: ReportShed[], now: Date): ShedSummary | null {
  if (sheds.length === 0) return null;

  const sorted = byDateDesc(sheds);
  const isProblem = (entry: ReportShed): boolean =>
    entry.quality === 'incomplete' || entry.quality === 'stuck-shed' || entry.quality === 'assisted';

  let averageGap: number | null = null;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      gaps.push(daysBetween(sorted[i].date, sorted[i + 1].date));
    }
    averageGap = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
  }

  return {
    entries: sorted.length,
    lastShedDate: sorted[0].date,
    daysSinceLastShed: daysBetween(now, sorted[0].date),
    problemShedsIn180Days: within(sorted, now, 180).filter(isProblem).length,
    averageDaysBetweenSheds: averageGap,
  };
}

function summarizeDefecation(poops: ReportPoop[], now: Date): DefecationSummary | null {
  if (poops.length === 0) return null;

  const sorted = byDateDesc(poops);
  const recent = within(sorted, now, 90);

  return {
    entries: sorted.length,
    lastDate: sorted[0].date,
    daysSinceLast: daysBetween(now, sorted[0].date),
    abnormalIn90Days: recent.filter(
      (entry) => entry.consistency && ABNORMAL_CONSISTENCIES.has(entry.consistency)
    ).length,
    parasitesEverSeen: sorted.some((entry) => entry.parasitesSeen === true),
  };
}

// ---------------------------------------------------------------------------
// Concerns
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<ConcernSeverity, number> = { urgent: 3, watch: 2, note: 1 };

function buildConcerns(input: HealthReportInput, now: Date, summaries: {
  weight: WeightSummary | null;
  feeding: FeedingSummary | null;
  shed: ShedSummary | null;
  defecation: DefecationSummary | null;
}): HealthConcern[] {
  const concerns: HealthConcern[] = [];
  const { weight, feeding, shed, defecation } = summaries;

  // --- Weight -------------------------------------------------------------
  if (weight && weight.change90dPercent !== null && weight.peak90dGrams !== null) {
    const drop = -weight.change90dPercent;
    if (drop >= WEIGHT_LOSS_WATCH_PERCENT) {
      concerns.push({
        id: 'weight-loss',
        severity: drop >= WEIGHT_LOSS_URGENT_PERCENT ? 'urgent' : 'watch',
        title: `Weight down ${drop.toFixed(1)}% from its 90-day peak`,
        detail:
          'Measured against the highest weight recorded in the last 90 days, not the oldest, so a gain followed by a loss still shows as a loss.',
        evidence: [
          `Peak in window: ${formatGrams(weight.peak90dGrams)}`,
          `Most recent: ${formatGrams(weight.currentGrams)} on ${formatDate(weight.currentDate)}`,
          `${weight.entries} weigh-ins on record since ${formatDate(weight.firstDate)}`,
        ],
      });
    }
  }

  // --- Feeding ------------------------------------------------------------
  if (feeding && feeding.consecutiveRefusals >= REFUSALS_WATCH) {
    concerns.push({
      id: 'feeding-refusals',
      severity: feeding.consecutiveRefusals >= REFUSALS_URGENT ? 'urgent' : 'watch',
      title: `${feeding.consecutiveRefusals} feedings refused in a row`,
      detail:
        'Counted back from the most recent offering until the last accepted meal. Seasonal fasting, brumation and pre-shed can all explain this — the keeper should be asked which applies.',
      evidence: [
        feeding.lastFedDate
          ? `Last accepted meal: ${formatDate(feeding.lastFedDate)} (${feeding.daysSinceLastFed} days ago)`
          : 'No accepted meal on record',
        `${feeding.refusalsIn90Days} refusals and ${feeding.acceptedIn90Days} accepted meals in the last 90 days`,
      ],
    });
  }

  // An animal well past its own established feeding rhythm, flagged against its
  // own history rather than a species-wide number we do not have.
  if (
    feeding &&
    feeding.averageDaysBetweenMeals !== null &&
    feeding.averageDaysBetweenMeals > 0 &&
    feeding.daysSinceLastFed !== null &&
    feeding.daysSinceLastFed > feeding.averageDaysBetweenMeals * 3 &&
    feeding.daysSinceLastFed >= 21
  ) {
    concerns.push({
      id: 'feeding-gap',
      severity: 'watch',
      title: `${feeding.daysSinceLastFed} days since the last accepted meal`,
      detail: `This animal normally eats about every ${feeding.averageDaysBetweenMeals} days, so the current gap is roughly ${Math.floor(
        feeding.daysSinceLastFed / feeding.averageDaysBetweenMeals
      )}x its usual interval.`,
      evidence: [
        feeding.lastFedDate ? `Last accepted meal: ${formatDate(feeding.lastFedDate)}` : 'No accepted meal on record',
        `Usual interval: ~${feeding.averageDaysBetweenMeals} days across ${feeding.entries} records`,
      ],
    });
  }

  // --- Defecation ---------------------------------------------------------
  const poops = input.poops ?? [];
  if (defecation) {
    if (defecation.parasitesEverSeen) {
      const sightings = byDateDesc(poops).filter((entry) => entry.parasitesSeen === true);
      concerns.push({
        id: 'parasites-seen',
        severity: 'urgent',
        title: 'Keeper reported visible parasites in stool',
        detail: 'Recorded by the keeper from visual inspection. A faecal float would confirm or rule this out.',
        evidence: sightings.slice(0, 3).map((entry) => `Logged ${formatDate(entry.date)}`),
      });
    }

    const critical = within(byDateDesc(poops), now, 90).filter(
      (entry) => entry.consistency && CRITICAL_CONSISTENCIES.has(entry.consistency)
    );
    if (critical.length > 0) {
      concerns.push({
        id: 'stool-critical',
        severity: 'urgent',
        title: `Blood or mucus noted in stool (${critical.length} in 90 days)`,
        detail: 'Keeper-observed, not verified. Included because a single occurrence is worth mentioning.',
        evidence: critical
          .slice(0, 3)
          .map((entry) => `${formatDate(entry.date)} — ${entry.consistency}${entry.color ? `, ${entry.color}` : ''}`),
      });
    } else if (defecation.abnormalIn90Days >= ABNORMAL_STOOL_WATCH_COUNT) {
      concerns.push({
        id: 'stool-abnormal',
        severity: 'watch',
        title: `${defecation.abnormalIn90Days} abnormal stools logged in 90 days`,
        detail: 'Consistency recorded as soft, runny or watery often enough to read as a pattern rather than a one-off.',
        evidence: [
          defecation.lastDate
            ? `Most recent stool: ${formatDate(defecation.lastDate)} (${defecation.daysSinceLast} days ago)`
            : 'No stool records',
          `${defecation.entries} stool records in total`,
        ],
      });
    }
  }

  // --- Shedding -----------------------------------------------------------
  if (shed && shed.problemShedsIn180Days > 0) {
    const problems = within(byDateDesc(input.sheds ?? []), now, 180).filter(
      (entry) => entry.quality === 'incomplete' || entry.quality === 'stuck-shed' || entry.quality === 'assisted'
    );
    concerns.push({
      id: 'shed-problems',
      severity: shed.problemShedsIn180Days >= 2 ? 'watch' : 'note',
      title: `${shed.problemShedsIn180Days} incomplete or stuck shed${
        shed.problemShedsIn180Days === 1 ? '' : 's'
      } in 180 days`,
      detail:
        'Repeated shedding trouble usually points at enclosure humidity, hydration or an underlying skin issue rather than the shed itself.',
      evidence: problems.slice(0, 3).map((entry) => {
        const areas = entry.problemAreas?.length ? ` — ${entry.problemAreas.join(', ')}` : '';
        return `${formatDate(entry.date)}: ${entry.quality}${areas}`;
      }),
    });
  }

  // --- UVB ----------------------------------------------------------------
  // Reused rather than reimplemented so the report and the dashboard card can
  // never disagree about whether a bulb is expired.
  const enclosure = input.enclosure;
  if (enclosure?.uvbBulbInstalledOn) {
    const uvb = getUvbLifecycleStatus(enclosure.uvbBulbInstalledOn, enclosure.uvbBulbType, now);
    if (uvb && (uvb.state === 'overdue' || uvb.state === 'critical')) {
      const monthsInService = Math.floor(uvb.daysInstalled / 30.44);
      concerns.push({
        id: 'uvb-expired',
        severity: uvb.state === 'critical' ? 'watch' : 'note',
        title: `UVB bulb is ${monthsInService} months old (rated ${uvb.spec.lifespanMonths})`,
        detail:
          'UV output falls off well before the bulb stops emitting visible light. Relevant to any presentation involving bone, growth or lethargy.',
        evidence: [
          `Installed ${formatDate(enclosure.uvbBulbInstalledOn)}`,
          `Type: ${uvb.spec.label}`,
        ],
      });
    }
  }

  // --- Outstanding vet follow-up -----------------------------------------
  const overdueFollowUps = (input.vetVisits ?? []).filter(
    (visit) => visit.followUpNeeded && visit.followUpDate && visit.followUpDate.getTime() < now.getTime()
  );
  if (overdueFollowUps.length > 0) {
    const latest = byDateDesc(overdueFollowUps.map((v) => ({ ...v, date: v.followUpDate })))[0];
    concerns.push({
      id: 'followup-overdue',
      severity: 'watch',
      title: 'A scheduled follow-up has passed',
      detail: latest.followUpNotes ?? 'Marked as needing follow-up at the previous visit.',
      evidence: overdueFollowUps
        .slice(0, 3)
        .map(
          (visit) =>
            `${visit.visitType} on ${formatDate(visit.date)} — follow-up due ${formatDate(visit.followUpDate)}`
        ),
    });
  }

  return concerns.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

// ---------------------------------------------------------------------------
// Data gaps
// ---------------------------------------------------------------------------

function buildDataGaps(input: HealthReportInput, summaries: {
  weight: WeightSummary | null;
  feeding: FeedingSummary | null;
  defecation: DefecationSummary | null;
}): string[] {
  const gaps: string[] = [];
  const { animal, enclosure, environment } = input;

  if (!summaries.weight) {
    gaps.push('No weight has ever been recorded — the single most useful number for assessing condition.');
  } else if (summaries.weight.entries === 1) {
    gaps.push('Only one weigh-in on record, so no trend can be established.');
  }

  if (!summaries.feeding) gaps.push('No feeding history recorded.');
  if (!summaries.defecation) gaps.push('No defecation records — urate and stool history is unavailable.');

  if (!animal.birthday && !animal.acquisitionDate) {
    gaps.push('Neither hatch date nor acquisition date is known, so age is an estimate at best.');
  }

  if (!environment || (environment.baskingTempF === undefined && environment.ambientTempF === undefined)) {
    gaps.push('No measured enclosure temperatures on record — the figures below are target settings, not readings.');
  }
  if (!environment || environment.humidityPercent === undefined) {
    gaps.push('No measured humidity on record.');
  }
  if (!enclosure?.uvbBulbInstalledOn) {
    gaps.push('UVB bulb installation date is unknown, so its remaining output cannot be judged.');
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function buildHealthReport(input: HealthReportInput): HealthReport {
  const now = input.generatedAt ?? new Date();

  const weight = summarizeWeight(input.weights ?? [], now);
  const feeding = summarizeFeeding(input.feedings ?? [], now);
  const shed = summarizeShed(input.sheds ?? [], now);
  const defecation = summarizeDefecation(input.poops ?? [], now);

  const concerns = buildConcerns(input, now, { weight, feeding, shed, defecation });
  const dataGaps = buildDataGaps(input, { weight, feeding, defecation });

  // "Insufficient" means the report cannot stand on its own as a history, not
  // that it is worthless — it still carries identification and husbandry, which
  // is more than most keepers arrive with.
  const recordedStreams = [weight, feeding, shed, defecation].filter(Boolean).length;

  return {
    generatedAt: now,
    animalLabel: buildAnimalLabel(input.animal),
    ageDescription: describeAge(input.animal.birthday ?? input.animal.acquisitionDate, now),
    concerns,
    weight,
    feeding,
    shed,
    defecation,
    vetVisits: byDateDesc(input.vetVisits ?? []),
    dataGaps,
    insufficientData: recordedStreams < 2,
  };
}
