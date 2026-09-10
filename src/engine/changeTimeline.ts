/**
 * "What changed?" — incident retrospective
 *
 * The defining problem of this hobby is that feedback loops run months. A
 * keeper swaps substrate in March and finds out in November, via a stuck shed,
 * that the new brand holds half the moisture. By the time the symptom appears,
 * nobody remembers the cause — and the animal's own history is the only place
 * the answer was ever written down.
 *
 * This engine takes a symptom and a date, and reconstructs what changed in the
 * window before it. It does not diagnose. It reads the record back in the order
 * things happened, so the keeper (or their vet) can see the candidates and use
 * judgement.
 *
 * THE CENTRAL DISCIPLINE: this is correlation, and it says so. Every change in
 * the window is surfaced, including ones that are almost certainly irrelevant,
 * because a filter that decided what "counts" would be making exactly the causal
 * claim we cannot support. Relevance is ranked, never used to hide.
 *
 * Two things are deliberately NOT done:
 *   - No "likely cause" verdict. With one animal and one timeline there is no
 *     way to distinguish cause from coincidence, and a confident wrong answer
 *     is worse than an honest list.
 *   - No silent windowing. If nothing was recorded in the window, that is
 *     reported as "nothing was logged", not as "nothing changed".
 */

export type IncidentKind =
  | 'feeding-refusal'
  | 'weight-loss'
  | 'stuck-shed'
  | 'abnormal-stool'
  | 'lethargy'
  | 'custom';

export type ChangeCategory =
  | 'environment'
  | 'enclosure'
  | 'diet'
  | 'lighting'
  | 'health'
  | 'husbandry';

/** How plausibly this kind of change relates to this kind of symptom. */
export type Relevance = 'high' | 'medium' | 'low';

export interface TimelineChange {
  id: string;
  date: Date;
  /** Days before the incident. Negative values never occur. */
  daysBefore: number;
  category: ChangeCategory;
  title: string;
  detail?: string;
  relevance: Relevance;
  /** Why this was ranked as it was — shown so the ranking is auditable. */
  relevanceReason?: string;
}

export interface EnvironmentSeries {
  date: Date;
  /** Fahrenheit. */
  tempF?: number;
  humidityPercent?: number;
}

export interface TimelineEnclosureEvent {
  id: string;
  date: Date;
  eventType: string;
  severity?: string;
  notes?: string;
}

export interface TimelineFeeding {
  date: Date;
  feederType?: string;
  supplementUsed?: string;
}

export interface TimelineVetVisit {
  date: Date;
  visitType: string;
  diagnosis?: string;
}

export interface ChangeTimelineInput {
  incidentKind: IncidentKind;
  incidentDate: Date;
  /** How far back to look. Defaults to 60 days. */
  windowDays?: number;
  enclosureEvents?: TimelineEnclosureEvent[];
  environment?: EnvironmentSeries[];
  feedings?: TimelineFeeding[];
  vetVisits?: TimelineVetVisit[];
  /** Brumation periods overlapping the window. */
  brumationStarts?: Date[];
}

export interface EnvironmentDrift {
  metric: 'temperature' | 'humidity';
  /** Median across the first half of the window. */
  baseline: number;
  /** Median across the second half, closest to the incident. */
  recent: number;
  delta: number;
  readingCount: number;
}

export interface ChangeTimeline {
  incidentKind: IncidentKind;
  incidentDate: Date;
  windowDays: number;
  windowStart: Date;
  /** Ordered most recent first — closest in time reads first. */
  changes: TimelineChange[];
  drift: EnvironmentDrift[];
  /** True when no records of any kind exist in the window. */
  nothingRecorded: boolean;
  /** Streams that had no data, so absence is never read as "no change". */
  emptyStreams: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 60;

/** Below this, a shift is measurement noise rather than drift. */
const TEMP_DRIFT_THRESHOLD_F = 3;
const HUMIDITY_DRIFT_THRESHOLD_PERCENT = 8;

/** Drift needs enough readings on both sides to mean anything. */
const MIN_READINGS_PER_HALF = 3;

/**
 * Which categories plausibly bear on which symptom.
 *
 * Used for RANKING ONLY — nothing is ever dropped for scoring low. A keeper
 * who moved a probe the week before a refusal deserves to see it even if the
 * engine rates it unlikely, because the engine does not know their setup.
 */
const RELEVANCE_BY_INCIDENT: Record<IncidentKind, Partial<Record<ChangeCategory, Relevance>>> = {
  'feeding-refusal': { environment: 'high', diet: 'high', enclosure: 'medium', lighting: 'medium', health: 'medium', husbandry: 'low' },
  'weight-loss': { diet: 'high', health: 'high', environment: 'medium', enclosure: 'low', lighting: 'low', husbandry: 'low' },
  'stuck-shed': { environment: 'high', enclosure: 'medium', husbandry: 'medium', diet: 'low', lighting: 'low', health: 'low' },
  'abnormal-stool': { diet: 'high', health: 'high', environment: 'medium', enclosure: 'medium', lighting: 'low', husbandry: 'low' },
  'lethargy': { environment: 'high', lighting: 'high', health: 'high', diet: 'medium', enclosure: 'low', husbandry: 'low' },
  'custom': { environment: 'medium', enclosure: 'medium', diet: 'medium', lighting: 'medium', health: 'medium', husbandry: 'medium' },
};

const RELEVANCE_RANK: Record<Relevance, number> = { high: 3, medium: 2, low: 1 };

/** Enclosure event types mapped to a category and a readable label. */
const EVENT_META: Record<string, { category: ChangeCategory; label: string }> = {
  substrate_installed: { category: 'enclosure', label: 'Substrate installed' },
  substrate_top_off: { category: 'enclosure', label: 'Substrate topped off' },
  substrate_partial_change: { category: 'enclosure', label: 'Substrate partially changed' },
  substrate_full_change: { category: 'enclosure', label: 'Substrate fully changed' },
  mold_bloom_started: { category: 'enclosure', label: 'Mould bloom started' },
  mold_bloom_resolved: { category: 'enclosure', label: 'Mould bloom resolved' },
  cleanup_crew_added: { category: 'enclosure', label: 'Cleanup crew added' },
  cleanup_crew_restocked: { category: 'enclosure', label: 'Cleanup crew restocked' },
  plant_added: { category: 'enclosure', label: 'Plant added' },
  plant_pruned: { category: 'enclosure', label: 'Plants pruned' },
  plant_replaced: { category: 'enclosure', label: 'Plant replaced' },
  equipment_probe_moved: { category: 'environment', label: 'Thermostat probe moved' },
  uvb_bulb_replaced: { category: 'lighting', label: 'UVB bulb replaced' },
  mister_nozzle_cleaned: { category: 'husbandry', label: 'Mister nozzle cleaned' },
  humidity_crash_incident: { category: 'environment', label: 'Humidity crash' },
  pest_detected: { category: 'health', label: 'Pests detected' },
  pest_resolved: { category: 'health', label: 'Pests resolved' },
  custom: { category: 'husbandry', label: 'Keeper-logged event' },
};

function daysBetween(later: Date, earlier: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / DAY_MS));
}

/**
 * Median, not mean.
 *
 * Keepers log a handful of readings per window, and a single bad one — probe
 * knocked loose, reading taken right after a misting — moves a six-value mean
 * by enough to clear the drift threshold on its own. The median ignores it
 * entirely, which is what "sustained shift" actually requires.
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function rateRelevance(kind: IncidentKind, category: ChangeCategory): Relevance {
  return RELEVANCE_BY_INCIDENT[kind][category] ?? 'low';
}

/**
 * Compares the half of the window nearest the incident against the half
 * furthest from it, using medians so one bad reading cannot manufacture drift.
 * Drift is a sustained shift, not a spike.
 */
function detectDrift(
  readings: EnvironmentSeries[],
  windowStart: Date,
  incidentDate: Date
): EnvironmentDrift[] {
  const midpoint = new Date((windowStart.getTime() + incidentDate.getTime()) / 2);
  const drift: EnvironmentDrift[] = [];

  const analyse = (
    metric: 'temperature' | 'humidity',
    pick: (r: EnvironmentSeries) => number | undefined,
    threshold: number
  ) => {
    const early: number[] = [];
    const late: number[] = [];

    for (const reading of readings) {
      const value = pick(reading);
      if (value === undefined) continue;
      if (reading.date < windowStart || reading.date > incidentDate) continue;
      (reading.date < midpoint ? early : late).push(value);
    }

    if (early.length < MIN_READINGS_PER_HALF || late.length < MIN_READINGS_PER_HALF) return;

    const baseline = median(early);
    const recent = median(late);
    const delta = recent - baseline;
    if (Math.abs(delta) < threshold) return;

    drift.push({
      metric,
      baseline: Number(baseline.toFixed(1)),
      recent: Number(recent.toFixed(1)),
      delta: Number(delta.toFixed(1)),
      readingCount: early.length + late.length,
    });
  };

  analyse('temperature', (r) => r.tempF, TEMP_DRIFT_THRESHOLD_F);
  analyse('humidity', (r) => r.humidityPercent, HUMIDITY_DRIFT_THRESHOLD_PERCENT);

  return drift;
}

export function buildChangeTimeline(input: ChangeTimelineInput): ChangeTimeline {
  const windowDays = input.windowDays ?? DEFAULT_WINDOW_DAYS;
  const incidentDate = input.incidentDate;
  const windowStart = new Date(incidentDate.getTime() - windowDays * DAY_MS);

  const inWindow = (date: Date) => date >= windowStart && date <= incidentDate;

  const changes: TimelineChange[] = [];
  const emptyStreams: string[] = [];

  // --- Enclosure events -----------------------------------------------
  const events = (input.enclosureEvents ?? []).filter((event) => inWindow(event.date));
  if ((input.enclosureEvents ?? []).length === 0) emptyStreams.push('enclosure events');

  for (const event of events) {
    const meta = EVENT_META[event.eventType] ?? {
      category: 'husbandry' as ChangeCategory,
      label: event.eventType.replace(/_/g, ' '),
    };
    changes.push({
      id: `event-${event.id}`,
      date: event.date,
      daysBefore: daysBetween(incidentDate, event.date),
      category: meta.category,
      title: meta.label,
      detail: event.notes,
      relevance: rateRelevance(input.incidentKind, meta.category),
      relevanceReason: `${meta.category} changes are ranked for ${input.incidentKind.replace(/-/g, ' ')}`,
    });
  }

  // --- Diet: a feeder or supplement appearing for the first time -------
  const feedings = input.feedings ?? [];
  if (feedings.length === 0) emptyStreams.push('feeding');

  const sortedFeedings = [...feedings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const seenFeeders = new Set<string>();
  const seenSupplements = new Set<string>();

  for (const feeding of sortedFeedings) {
    // Anything before the window establishes what was already normal, so its
    // first appearance inside the window is not a change.
    const isNew = (value: string | undefined, seen: Set<string>): boolean => {
      if (!value || value === 'None') return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return inWindow(feeding.date);
    };

    if (isNew(feeding.feederType, seenFeeders)) {
      changes.push({
        id: `feeder-${feeding.feederType}-${feeding.date.getTime()}`,
        date: feeding.date,
        daysBefore: daysBetween(incidentDate, feeding.date),
        category: 'diet',
        title: `New feeder introduced: ${feeding.feederType}`,
        detail: 'First time this feeder appears in the record.',
        relevance: rateRelevance(input.incidentKind, 'diet'),
      });
    }

    if (isNew(feeding.supplementUsed, seenSupplements)) {
      changes.push({
        id: `supp-${feeding.supplementUsed}-${feeding.date.getTime()}`,
        date: feeding.date,
        daysBefore: daysBetween(incidentDate, feeding.date),
        category: 'diet',
        title: `Supplement changed to ${feeding.supplementUsed}`,
        relevance: rateRelevance(input.incidentKind, 'diet'),
      });
    }
  }

  // --- Health ----------------------------------------------------------
  const vetVisits = (input.vetVisits ?? []).filter((visit) => inWindow(visit.date));
  for (const visit of vetVisits) {
    changes.push({
      id: `vet-${visit.date.getTime()}`,
      date: visit.date,
      daysBefore: daysBetween(incidentDate, visit.date),
      category: 'health',
      title: `Vet visit: ${visit.visitType}`,
      detail: visit.diagnosis,
      relevance: rateRelevance(input.incidentKind, 'health'),
    });
  }

  for (const start of input.brumationStarts ?? []) {
    if (!inWindow(start)) continue;
    changes.push({
      id: `brumation-${start.getTime()}`,
      date: start,
      daysBefore: daysBetween(incidentDate, start),
      category: 'health',
      title: 'Brumation started',
      detail: 'Reduced appetite and activity are expected during brumation.',
      relevance: 'high',
      relevanceReason: 'Brumation independently explains most refusal and weight change',
    });
  }

  // --- Environment drift ------------------------------------------------
  const environment = input.environment ?? [];
  if (environment.length === 0) emptyStreams.push('temperature and humidity');

  const drift = detectDrift(environment, windowStart, incidentDate);
  for (const entry of drift) {
    const direction = entry.delta > 0 ? 'rose' : 'fell';
    const unit = entry.metric === 'temperature' ? '°F' : '%';
    changes.push({
      id: `drift-${entry.metric}`,
      // Attributed to the midpoint: drift is a period, not a moment, and
      // pinning it to a single day would overstate what the data supports.
      date: new Date((windowStart.getTime() + incidentDate.getTime()) / 2),
      daysBefore: Math.floor(windowDays / 2),
      category: 'environment',
      title: `${entry.metric === 'temperature' ? 'Temperature' : 'Humidity'} ${direction} ${Math.abs(
        entry.delta
      )}${unit}`,
      detail: `Typically ${entry.baseline}${unit} early in the window and ${entry.recent}${unit} closer to the incident, across ${entry.readingCount} readings.`,
      relevance: rateRelevance(input.incidentKind, 'environment'),
      relevanceReason: 'Sustained shift, not a single reading',
    });
  }

  // Most recent first: what happened closest to the symptom reads first.
  changes.sort((a, b) => {
    if (b.date.getTime() !== a.date.getTime()) return b.date.getTime() - a.date.getTime();
    return RELEVANCE_RANK[b.relevance] - RELEVANCE_RANK[a.relevance];
  });

  return {
    incidentKind: input.incidentKind,
    incidentDate,
    windowDays,
    windowStart,
    changes,
    drift,
    nothingRecorded: changes.length === 0,
    emptyStreams,
  };
}
