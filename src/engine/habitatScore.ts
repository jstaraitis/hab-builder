/**
 * Habitat Score
 *
 * The survey's most-cited problem is "unsure if my enclosure setup is
 * correct". The app is uniquely able to answer it, because it holds all three
 * pieces and nothing until now joined them up:
 *
 *   1. what the setup SHOULD be    — the species profile (careTargets, size)
 *   2. what the setup IS           — the enclosure record (UVB, substrate)
 *   3. what is actually HAPPENING  — logged temperature and humidity
 *
 * Each dimension is scored independently and can come back `null` meaning
 * "not enough data to judge". That distinction is the point: an enclosure with
 * no thermometer readings is not a passing enclosure, and it is not a failing
 * one either — it is unmeasured, and saying so is more useful than inventing
 * a number. Unassessable dimensions are excluded from the average and raise a
 * finding of their own.
 *
 * Scores describe husbandry conditions, not veterinary status.
 */

import type { AnimalProfile, HumidityRange, TemperatureRange, Units } from './types';
import type { Enclosure } from '../types/careCalendar';
import type { TempLog } from '../services/tempLogService';
import type { HumidityLog } from '../services/humidityLogService';
import { getUvbLifecycleStatus, isReplacementDue } from './uvbLifecycle';
import { runSetupCheck, type SetupCheckAnswers, type SetupCheckContext } from './setupCheck';
import { parseZone } from './fergusonZones';

export type HabitatGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type FindingSeverity = 'critical' | 'important' | 'minor';
export type HabitatDimensionId =
  | 'temperature'
  | 'humidity'
  | 'uvb'
  | 'size'
  | 'substrate'
  | 'monitoring'
  | 'placement';

export interface HabitatFinding {
  id: string;
  dimension: HabitatDimensionId;
  severity: FindingSeverity;
  /** One line, states the problem. */
  title: string;
  /** Why it matters, in plain language. */
  detail: string;
  /** What to actually do about it. */
  fix: string;
}

export interface DimensionResult {
  id: HabitatDimensionId;
  label: string;
  /** 0-100, or null when there isn't enough data to judge. */
  score: number | null;
  weight: number;
  findings: HabitatFinding[];
}

export interface HabitatScoreResult {
  grade: HabitatGrade;
  /** 0-100, weighted across assessable dimensions only. */
  score: number;
  dimensions: DimensionResult[];
  /** Every finding, worst first. */
  findings: HabitatFinding[];
  /** The single fix worth doing first — revealed free; the rest are premium. */
  topFinding: HabitatFinding | null;
  assessedCount: number;
  totalCount: number;
  /** True when too little is known to publish a grade at all. */
  insufficientData: boolean;
}

// Weights reflect consequence, not how easy the check is. Bad temperatures
// kill in days; a shallow substrate is a slow welfare issue.
const WEIGHTS: Record<HabitatDimensionId, number> = {
  temperature: 25,
  uvb: 20,
  humidity: 20,
  size: 20,
  substrate: 10,
  monitoring: 5,
  // Placement errors are as consequential as the equipment itself: a probe at
  // the cool end drives a basking lamp to full power, and a UVB lamp mounted
  // out of range delivers nothing while looking correct. Weighted alongside
  // UVB and size rather than treated as finishing detail.
  placement: 20,
};

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 3,
  important: 2,
  minor: 1,
};

/** Readings older than this can't describe current conditions. */
const READING_FRESHNESS_DAYS = 30;
const MS_PER_DAY = 86_400_000;

function toFahrenheit(value: number, unit: 'f' | 'c' | 'F' | 'C'): number {
  return unit === 'c' || unit === 'C' ? value * 9 / 5 + 32 : value;
}

function daysSince(iso: string | Date, now: Date): number {
  const then = iso instanceof Date ? iso : new Date(iso);
  return Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY);
}

function isFresh(iso: string | Date, now: Date): boolean {
  return daysSince(iso, now) <= READING_FRESHNESS_DAYS;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Converts "how far outside the acceptable band" into a 0-100 score. Being a
 * little out is a lot better than being wildly out, and the curve reflects it.
 */
function scoreAgainstBand(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 100;
  const distance = value < min ? min - value : value - max;
  const penalty = Math.min(100, (distance / tolerance) * 100);
  return Math.max(0, Math.round(100 - penalty));
}

export interface HabitatScoreInput {
  profile: AnimalProfile;
  enclosure: Enclosure;
  tempLogs: TempLog[];
  humidityLogs: HumidityLog[];
  /** Not stored on the enclosure yet — passed in when known. */
  dimensions?: { width: number; depth: number; height: number; units: Units };
  /** Setup Check answers, when the keeper has completed it. */
  setupAnswers?: SetupCheckAnswers;
  now?: Date;
}

// ─── Temperature ─────────────────────────────────────────────────────────────

function assessTemperature(
  profile: AnimalProfile,
  enclosure: Enclosure,
  logs: TempLog[],
  now: Date
): DimensionResult {
  const findings: HabitatFinding[] = [];
  const target: TemperatureRange | undefined = profile.careTargets?.temperature;
  const fresh = logs.filter((l) => isFresh(l.recordedAt, now));

  if (!target || fresh.length === 0) {
    return { id: 'temperature', label: 'Temperature', score: null, weight: WEIGHTS.temperature, findings };
  }

  // Enclosure baselines override the species preset when the keeper set them.
  const min = enclosure.baselineDayTempTarget ?? target.min;
  const max = enclosure.baselineNightTempTarget ?? target.max;
  const lowBound = Math.min(min, max);
  const highBound = Math.max(min, max);

  const ambient = fresh.filter((l) => !l.zone || l.zone === 'ambient' || l.zone === 'cool');
  const readings = (ambient.length > 0 ? ambient : fresh).map((l) =>
    toFahrenheit(l.temperatureValue, l.unit)
  );
  const mean = Math.round(average(readings));

  // 15°F outside the band is treated as a total miss.
  const score = scoreAgainstBand(mean, lowBound, highBound, 15);

  if (mean < lowBound) {
    const gap = Math.round(lowBound - mean);
    findings.push({
      id: 'temp-low',
      dimension: 'temperature',
      severity: gap >= 8 ? 'critical' : 'important',
      title: `Running ${gap}°F below target`,
      detail: `Recent readings average ${mean}°F against a ${lowBound}–${highBound}°F target. Reptiles digest, move and fight infection at temperature — sustained cold suppresses all three.`,
      fix: `Raise the warm side until ambient sits inside ${lowBound}–${highBound}°F. Check the thermostat probe hasn't drifted off the heat source.`,
    });
  } else if (mean > highBound) {
    const gap = Math.round(mean - highBound);
    findings.push({
      id: 'temp-high',
      dimension: 'temperature',
      severity: gap >= 8 ? 'critical' : 'important',
      title: `Running ${gap}°F above target`,
      detail: `Recent readings average ${mean}°F against a ${lowBound}–${highBound}°F target. Overheating gives an animal nowhere to cool down and kills faster than cold does.`,
      fix: `Lower the heat source or raise it further from the basking surface, and confirm there's a genuine cool end to retreat to.`,
    });
  }

  return { id: 'temperature', label: 'Temperature', score, weight: WEIGHTS.temperature, findings };
}

// ─── Humidity ────────────────────────────────────────────────────────────────

function assessHumidity(
  profile: AnimalProfile,
  enclosure: Enclosure,
  logs: HumidityLog[],
  now: Date
): DimensionResult {
  const findings: HabitatFinding[] = [];
  const target: HumidityRange | undefined = profile.careTargets?.humidity;
  const fresh = logs.filter((l) => isFresh(l.recordedAt, now));

  if (!target?.day || fresh.length === 0) {
    return { id: 'humidity', label: 'Humidity', score: null, weight: WEIGHTS.humidity, findings };
  }

  const min = enclosure.baselineHumidityMinTarget ?? target.day.min;
  const max = enclosure.baselineHumidityMaxTarget ?? target.day.max;
  const mean = Math.round(average(fresh.map((l) => l.humidityPercent)));

  // 25 percentage points outside the band is a total miss.
  const score = scoreAgainstBand(mean, min, max, 25);

  if (mean < min) {
    findings.push({
      id: 'humidity-low',
      dimension: 'humidity',
      severity: min - mean >= 15 ? 'critical' : 'important',
      title: `Humidity averaging ${mean}%, below ${min}%`,
      detail: `Chronic low humidity causes retained shed — which can constrict toes and tail tips — and steady dehydration that's easy to miss.`,
      fix: `Increase misting frequency, add a larger water source, or switch to a substrate that holds moisture. A humid hide helps immediately.`,
    });
  } else if (mean > max) {
    findings.push({
      id: 'humidity-high',
      dimension: 'humidity',
      severity: mean - max >= 15 ? 'critical' : 'important',
      title: `Humidity averaging ${mean}%, above ${max}%`,
      detail: `Persistently wet air with poor airflow drives respiratory infections and lets mould take hold in the substrate.`,
      fix: `Improve cross-ventilation, mist less often, and let the substrate surface dry between mistings.`,
    });
  }

  return { id: 'humidity', label: 'Humidity', score, weight: WEIGHTS.humidity, findings };
}

// ─── UVB ─────────────────────────────────────────────────────────────────────

function assessUvb(profile: AnimalProfile, enclosure: Enclosure): DimensionResult {
  const findings: HabitatFinding[] = [];
  const required = profile.careTargets?.lighting?.uvbRequired;

  // Species that don't need UVB shouldn't be marked down for not having it.
  if (!required) {
    return { id: 'uvb', label: 'UVB', score: null, weight: WEIGHTS.uvb, findings };
  }

  if (!enclosure.uvbBulbInstalledOn) {
    findings.push({
      id: 'uvb-missing',
      dimension: 'uvb',
      severity: 'critical',
      title: 'No UVB bulb recorded',
      detail: `${profile.commonName} needs UVB to process calcium. Without it, metabolic bone disease develops slowly and is largely irreversible by the time it's visible.`,
      fix: `Fit a UVB bulb${profile.careTargets.lighting.uvbStrength ? ` (${profile.careTargets.lighting.uvbStrength} strength)` : ''} and record the install date so replacement can be tracked.`,
    });
    return { id: 'uvb', label: 'UVB', score: 0, weight: WEIGHTS.uvb, findings };
  }

  const status = getUvbLifecycleStatus(enclosure.uvbBulbInstalledOn, enclosure.uvbBulbType);
  if (!status) {
    return { id: 'uvb', label: 'UVB', score: null, weight: WEIGHTS.uvb, findings };
  }

  if (isReplacementDue(status)) {
    const critical = status.state === 'critical' || status.state === 'overdue';
    findings.push({
      id: 'uvb-expiring',
      dimension: 'uvb',
      severity: critical ? 'critical' : 'minor',
      title: status.headline,
      detail: status.detail,
      fix: `Replace the ${status.spec.label} bulb and record the new install date.`,
    });
  }

  const score =
    status.state === 'critical' ? 10
      : status.state === 'overdue' ? 35
        : status.state === 'due-soon' ? 75
          : 100;

  return { id: 'uvb', label: 'UVB', score, weight: WEIGHTS.uvb, findings };
}

// ─── Size ────────────────────────────────────────────────────────────────────

function toInches(value: number, units: Units): number {
  return units === 'cm' ? value / 2.54 : value;
}

function assessSize(profile: AnimalProfile, input: HabitatScoreInput): DimensionResult {
  const findings: HabitatFinding[] = [];
  const dims = input.dimensions;

  if (!dims || !profile.minEnclosureSize) {
    return { id: 'size', label: 'Enclosure size', score: null, weight: WEIGHTS.size, findings };
  }

  const min = profile.minEnclosureSize;
  const actual = {
    width: toInches(dims.width, dims.units),
    depth: toInches(dims.depth, dims.units),
    height: toInches(dims.height, dims.units),
  };
  const required = {
    width: toInches(min.width, min.units),
    depth: toInches(min.depth, min.units),
    height: toInches(min.height, min.units),
  };

  const ratios = [
    actual.width / required.width,
    actual.depth / required.depth,
    actual.height / required.height,
  ];
  const worst = Math.min(...ratios);

  if (worst < 1) {
    const shortfall = Math.round((1 - worst) * 100);
    findings.push({
      id: 'size-undersized',
      dimension: 'size',
      severity: worst < 0.75 ? 'critical' : 'important',
      title: `Enclosure is ${shortfall}% under the minimum`,
      detail: `${profile.commonName} needs at least ${min.width}×${min.depth}×${min.height} ${min.units}. Undersized housing restricts the thermal gradient and drives chronic stress that shows up as poor feeding and hiding.`,
      fix: `Move to an enclosure of at least ${min.width}×${min.depth}×${min.height} ${min.units}. This is the one problem you can't fix with equipment.`,
    });
  }

  const score = Math.max(0, Math.min(100, Math.round(worst * 100)));
  return { id: 'size', label: 'Enclosure size', score, weight: WEIGHTS.size, findings };
}

// ─── Substrate ───────────────────────────────────────────────────────────────

function assessSubstrate(profile: AnimalProfile, enclosure: Enclosure): DimensionResult {
  const findings: HabitatFinding[] = [];

  if (!enclosure.substrateType) {
    return { id: 'substrate', label: 'Substrate', score: null, weight: WEIGHTS.substrate, findings };
  }

  let score = 100;

  // Loose-particle substrates are what hold a humidity gradient; paper and
  // carpet can't, so they're a poor match for a humidity-dependent species.
  const nonHolding = enclosure.substrateType === 'paper' || enclosure.substrateType === 'reptile-carpet';
  const needsHumidity = (profile.careTargets?.humidity?.day?.min ?? 0) >= 60;

  if (nonHolding && needsHumidity) {
    score -= 40;
    findings.push({
      id: 'substrate-mismatch',
      dimension: 'substrate',
      severity: 'important',
      title: 'Substrate can’t hold the humidity this species needs',
      detail: `${profile.commonName} wants ${profile.careTargets.humidity.day.min}%+ humidity, and paper or carpet releases moisture almost immediately.`,
      fix: `Switch to a moisture-retaining substrate such as coco fibre, bioactive soil, or a soil and leaf-litter mix.`,
    });
  }

  if (enclosure.substrateType === 'bioactive' && !profile.bioactiveCompatible) {
    score -= 20;
    findings.push({
      id: 'substrate-bioactive-mismatch',
      dimension: 'substrate',
      severity: 'minor',
      title: 'Bioactive setup for a species not suited to it',
      detail: `${profile.commonName} isn't listed as bioactive-compatible — usually a matter of arid conditions or burrowing habits that break down a cleanup-crew colony.`,
      fix: `This isn't urgent. Watch that the cleanup crew survives and the substrate isn't holding more moisture than the species wants.`,
    });
  }

  return {
    id: 'substrate',
    label: 'Substrate',
    score: Math.max(0, score),
    weight: WEIGHTS.substrate,
    findings,
  };
}

// ─── Placement ───────────────────────────────────────────────────────────────

/** Deductions per finding. Tuned so one critical error cannot still grade well. */
const PLACEMENT_PENALTY: Record<'critical' | 'important' | 'advisory', number> = {
  critical: 45,
  important: 20,
  advisory: 7,
};

/**
 * Scores where things are, as opposed to whether they exist.
 *
 * Delegates entirely to the Setup Check engine rather than restating its rules.
 * Two copies of "how far should a T5 HO sit from the basking spot" would drift
 * apart, and then the wizard and the score would disagree in front of the user.
 *
 * Note the division of labour with the `uvb` dimension: that one asks whether
 * the bulb is still producing usable output (age), this one asks whether it is
 * mounted where the animal can benefit from it (distance). A fresh bulb thirty
 * inches away passes the first and fails the second, which is exactly right.
 */
function assessPlacement(
  profile: AnimalProfile,
  enclosure: Enclosure,
  answers: SetupCheckAnswers | undefined
): DimensionResult {
  const findings: HabitatFinding[] = [];

  // Unassessable, with NO finding — matching every other dimension. A finding
  // asserts something is wrong with the habitat, and not having filled in a
  // questionnaire is not a husbandry problem. It would also hijack topFinding,
  // turning the free tier's single revealed fix into an upsell for every keeper
  // who has not run the check. Prompting for it belongs in the UI.
  if (!answers) {
    return { id: 'placement', label: 'Placement', score: null, weight: WEIGHTS.placement, findings };
  }

  const longest = Math.max(enclosure.widthInches ?? 0, enclosure.depthInches ?? 0) || undefined;

  const context: SetupCheckContext = {
    enclosureLengthInches: longest,
    uvbBulbType: enclosure.uvbBulbType,
    uvbRequired: profile.careTargets?.lighting?.uvbRequired,
    uvbStrength: profile.careTargets?.lighting?.uvbStrength,
    fergusonZone: parseZone(
      (profile.careTargets?.lighting as { fergusonZone?: unknown } | undefined)?.fergusonZone
    ),
    requiresThermalGradient: profile.careTargets?.temperature?.thermalGradient,
    prefersVertical: profile.layoutRules?.preferVertical,
    speciesName: profile.commonName,
  };

  const result = runSetupCheck(answers, context);

  // Too few answers is unassessable, not perfect. Scoring 100 here would let an
  // empty questionnaire lift the overall grade.
  if (result.insufficientAnswers) {
    return { id: 'placement', label: 'Placement', score: null, weight: WEIGHTS.placement, findings };
  }

  const severityMap: Record<'critical' | 'important' | 'advisory', FindingSeverity> = {
    critical: 'critical',
    important: 'important',
    advisory: 'minor',
  };

  let score = 100;
  for (const finding of result.findings) {
    score -= PLACEMENT_PENALTY[finding.severity];
    findings.push({
      id: `placement-${finding.id}`,
      dimension: 'placement',
      severity: severityMap[finding.severity],
      title: finding.title,
      detail: finding.detail,
      fix: finding.fix,
    });
  }

  return {
    id: 'placement',
    label: 'Placement',
    score: Math.max(0, Math.min(100, score)),
    weight: WEIGHTS.placement,
    findings,
  };
}

// ─── Monitoring ──────────────────────────────────────────────────────────────

function assessMonitoring(
  tempLogs: TempLog[],
  humidityLogs: HumidityLog[],
  now: Date
): DimensionResult {
  const findings: HabitatFinding[] = [];
  const freshTemp = tempLogs.filter((l) => isFresh(l.recordedAt, now)).length;
  const freshHumidity = humidityLogs.filter((l) => isFresh(l.recordedAt, now)).length;

  let score = 100;

  if (freshTemp === 0) {
    score -= 50;
    findings.push({
      id: 'monitoring-no-temp',
      dimension: 'monitoring',
      severity: 'important',
      title: 'No temperature readings in the last 30 days',
      detail: `Temperature is the single most consequential thing in an enclosure and the only one you can't judge by eye. Without readings, this score can't assess it at all.`,
      fix: `Log a reading from your thermometer. A digital probe at animal level is worth more than a stick-on dial.`,
    });
  }

  if (freshHumidity === 0) {
    score -= 50;
    findings.push({
      id: 'monitoring-no-humidity',
      dimension: 'monitoring',
      severity: 'minor',
      title: 'No humidity readings in the last 30 days',
      detail: `Humidity problems show up as retained shed and respiratory infections long before they're obvious.`,
      fix: `Log a hygrometer reading so shed and respiratory risk can be assessed.`,
    });
  }

  return {
    id: 'monitoring',
    label: 'Monitoring',
    score: Math.max(0, score),
    weight: WEIGHTS.monitoring,
    findings,
  };
}

// ─── Composition ─────────────────────────────────────────────────────────────

export function gradeFor(score: number): HabitatGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function calculateHabitatScore(input: HabitatScoreInput): HabitatScoreResult {
  const now = input.now ?? new Date();
  const { profile, enclosure, tempLogs, humidityLogs } = input;

  const dimensions: DimensionResult[] = [
    assessTemperature(profile, enclosure, tempLogs, now),
    assessUvb(profile, enclosure),
    assessHumidity(profile, enclosure, humidityLogs, now),
    assessSize(profile, input),
    assessSubstrate(profile, enclosure),
    assessMonitoring(tempLogs, humidityLogs, now),
    assessPlacement(profile, enclosure, input.setupAnswers),
  ];

  const assessed = dimensions.filter(
    (d): d is DimensionResult & { score: number } => d.score !== null
  );

  const findings = dimensions
    .flatMap((d) => d.findings)
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  // Judging an enclosure on substrate and monitoring alone would produce a
  // confident grade from almost no evidence.
  const meaningful = assessed.filter((d) => d.id !== 'monitoring' && d.id !== 'substrate');
  const insufficientData = meaningful.length === 0;

  const totalWeight = assessed.reduce((sum, d) => sum + d.weight, 0);
  const score = totalWeight === 0
    ? 0
    : Math.round(assessed.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight);

  return {
    grade: gradeFor(score),
    score,
    dimensions,
    findings,
    topFinding: findings[0] ?? null,
    assessedCount: assessed.length,
    totalCount: dimensions.length,
    insufficientData,
  };
}
