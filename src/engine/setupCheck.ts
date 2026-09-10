/**
 * Setup Check
 *
 * Replaces the drag-and-drop enclosure designer with the part of it that was
 * actually worth having.
 *
 * The canvas could draw a layout but never judged one. Everything valuable it
 * might have said — "your UVB is too far from the basking spot", "there is no
 * hide on the cool side" — turns out not to need a canvas at all. It needs
 * about eight measurements. So this asks for those instead, which works on a
 * phone, and spends the effort on the rules rather than on gesture handling.
 *
 * These are placement and configuration errors that are invisible day to day
 * and take months to show up as a symptom: MBD from UVB mounted too far away,
 * a thermostat probe on the wrong surface running a basking lamp at full power,
 * an animal forced to choose between feeling safe and being warm.
 *
 * SCOPE OF THE CLAIMS
 * Distances and thresholds here are general husbandry guidance, not
 * manufacturer specifications. Bulb output varies by brand and model, and the
 * definitive number is on the manufacturer's own distance chart. Findings say
 * so where it matters, and every rule that depends on species detail is skipped
 * rather than guessed when that detail is missing.
 */

import type { UvbBulbType } from './uvbLifecycle';

export type SetupSeverity = 'critical' | 'important' | 'advisory';

export interface SetupFinding {
  id: string;
  severity: SetupSeverity;
  title: string;
  /** What is wrong, in one sentence. */
  detail: string;
  /** What to actually do about it. */
  fix: string;
}

export type ProbeLocation =
  | 'basking-surface'
  | 'ambient-warm'
  | 'cool-end'
  | 'none'
  | 'unknown';

export type WaterPosition = 'warm-end' | 'middle' | 'cool-end' | 'none';

export type HeatSource =
  | 'overhead-bulb'
  | 'ceramic-emitter'
  | 'deep-heat-projector'
  | 'heat-mat'
  | 'radiant-panel'
  | 'none';

export interface SetupCheckAnswers {
  /** Inches from the UVB lamp to the surface the animal basks on. */
  uvbDistanceInches?: number;
  /** True when UVB sits on top of a mesh lid rather than inside the enclosure. */
  uvbOverMesh?: boolean;
  /** Inches between the basking spot and the coolest point. */
  baskingToCoolInches?: number;
  hidesWarmSide?: number;
  hidesCoolSide?: number;
  waterPosition?: WaterPosition;
  probeLocation?: ProbeLocation;
  heatSource?: HeatSource;
  /** Whether the heat source is on a thermostat at all. */
  heatOnThermostat?: boolean;
}

export interface SetupCheckContext {
  /** Longest interior horizontal dimension, inches. */
  enclosureLengthInches?: number;
  uvbBulbType?: UvbBulbType;
  /** From the species profile. */
  uvbRequired?: boolean;
  /** e.g. "5.0" or "10.0". */
  uvbStrength?: string;
  requiresThermalGradient?: boolean;
  /** True for arboreal species, where a horizontal gradient matters less. */
  prefersVertical?: boolean;
  speciesName?: string;
}

export interface SetupCheckResult {
  findings: SetupFinding[];
  /** Questions that were left blank, so their rules did not run. */
  unanswered: string[];
  /** How many rules could actually be evaluated. */
  rulesEvaluated: number;
  /** True when too little was answered to say anything useful. */
  insufficientAnswers: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/**
 * Working distance ranges from the lamp to the basking surface, in inches,
 * with no mesh in between.
 *
 * Deliberately wide. Actual safe distance depends on the specific model, and
 * these exist to catch setups that are clearly wrong — a compact bulb 24
 * inches away is doing nothing, a T5 HO four inches away risks overexposure —
 * not to fine-tune a correct one.
 */
const UVB_DISTANCE_RANGES: Record<UvbBulbType, { min: number; max: number }> = {
  'compact': { min: 6, max: 12 },
  't8': { min: 6, max: 12 },
  't5-ho': { min: 12, max: 18 },
  'mercury-vapor': { min: 12, max: 24 },
  'metal-halide': { min: 12, max: 24 },
  'unknown': { min: 8, max: 16 },
};

/**
 * Mesh blocks a large share of UVB — commonly cited around a third to a half,
 * depending on weave. A lamp resting on a mesh lid therefore needs to sit
 * proportionally closer than the same lamp mounted inside.
 */
const MESH_DISTANCE_FACTOR = 0.7;

/** Below this, a horizontal thermal gradient is not physically achievable. */
const MIN_GRADIENT_LENGTH_INCHES = 24;

/** Enough answers to be worth reporting on at all. */
const MIN_ANSWERS = 3;

const QUESTION_LABELS: Record<keyof SetupCheckAnswers, string> = {
  uvbDistanceInches: 'UVB distance to the basking spot',
  uvbOverMesh: 'Whether UVB sits over mesh',
  baskingToCoolInches: 'Distance from basking spot to cool end',
  hidesWarmSide: 'Hides on the warm side',
  hidesCoolSide: 'Hides on the cool side',
  waterPosition: 'Where the water dish sits',
  probeLocation: 'Where the thermostat probe sits',
  heatSource: 'Type of heat source',
  heatOnThermostat: 'Whether heat is on a thermostat',
};

const SEVERITY_RANK: Record<SetupSeverity, number> = {
  critical: 3,
  important: 2,
  advisory: 1,
};

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function checkUvbDistance(
  answers: SetupCheckAnswers,
  context: SetupCheckContext,
  findings: SetupFinding[]
): boolean {
  // Nothing to check for a species that does not need UVB at all.
  if (context.uvbRequired === false) return false;
  if (answers.uvbDistanceInches === undefined) return false;

  const range = UVB_DISTANCE_RANGES[context.uvbBulbType ?? 'unknown'];
  const factor = answers.uvbOverMesh ? MESH_DISTANCE_FACTOR : 1;
  const min = Math.round(range.min * factor);
  const max = Math.round(range.max * factor);
  const distance = answers.uvbDistanceInches;

  const meshNote = answers.uvbOverMesh
    ? ' Mesh blocks a large share of UVB, so the lamp needs to sit closer than it would mounted inside.'
    : '';

  if (distance > max) {
    findings.push({
      id: 'uvb-too-far',
      // Too far is the more dangerous direction: the keeper sees a lit bulb and
      // assumes the requirement is met while the animal receives almost nothing.
      severity: 'critical',
      title: `UVB is ${distance}" from the basking spot`,
      detail: `For this bulb type the usual working range is ${min}–${max}".${meshNote} At this distance the animal is likely receiving very little usable UVB, which is the common path to metabolic bone disease.`,
      fix: `Lower the lamp or raise the basking surface to bring it within ${min}–${max}", then confirm against the manufacturer's distance chart for your exact model.`,
    });
    return true;
  }

  if (distance < min) {
    findings.push({
      id: 'uvb-too-close',
      severity: 'important',
      title: `UVB is only ${distance}" from the basking spot`,
      detail: `Closer than the usual ${min}–${max}" range for this bulb type. Overexposure can cause eye and skin damage, and the animal cannot move out of range if the basking spot is the only warm place.`,
      fix: `Raise the lamp to at least ${min}", and make sure there is shaded basking area the animal can retreat to.`,
    });
    return true;
  }

  return true;
}

function checkThermalGradient(
  answers: SetupCheckAnswers,
  context: SetupCheckContext,
  findings: SetupFinding[]
): boolean {
  if (context.requiresThermalGradient === false) return false;

  const distance = answers.baskingToCoolInches ?? context.enclosureLengthInches;
  if (distance === undefined) return false;

  if (distance < MIN_GRADIENT_LENGTH_INCHES) {
    findings.push({
      id: 'gradient-too-short',
      severity: 'important',
      title: `Only ${distance}" between the warm and cool ends`,
      detail: context.prefersVertical
        ? `A horizontal gradient this short leaves little room to thermoregulate. This species climbs, so height can carry some of the gradient — but the animal still needs somewhere genuinely cooler to go.`
        : `Under about ${MIN_GRADIENT_LENGTH_INCHES}" the whole enclosure tends toward one temperature, so the animal cannot thermoregulate by moving.`,
      fix: context.prefersVertical
        ? 'Check that the cool end is measurably cooler than the basking area, and use vertical distance to extend the gradient.'
        : 'Move the heat source further toward one end, or use a longer enclosure. Measure both ends to confirm there is a real difference.',
    });
  }

  return true;
}

function checkHides(answers: SetupCheckAnswers, findings: SetupFinding[]): boolean {
  const { hidesWarmSide, hidesCoolSide } = answers;
  if (hidesWarmSide === undefined && hidesCoolSide === undefined) return false;

  const warm = hidesWarmSide ?? 0;
  const cool = hidesCoolSide ?? 0;

  if (warm === 0 && cool === 0) {
    findings.push({
      id: 'no-hides',
      severity: 'critical',
      title: 'No hides on either side',
      detail:
        'Without cover an animal has nowhere to feel secure, which is a common cause of chronic stress, refusing food and constant hiding behaviour in the open.',
      fix: 'Add at least one hide at each end — one on the warm side and one on the cool side.',
    });
    return true;
  }

  // The classic and genuinely harmful case: cover exists, but only at one
  // temperature, so security and correct temperature become a trade-off.
  if (warm === 0 || cool === 0) {
    const missing = warm === 0 ? 'warm' : 'cool';
    const present = warm === 0 ? 'cool' : 'warm';
    findings.push({
      id: `no-hide-${missing}`,
      severity: 'important',
      title: `No hide on the ${missing} side`,
      detail: `There is cover on the ${present} side only, so the animal has to choose between feeling secure and being at the right temperature. It will usually pick security, and sit at the wrong temperature to get it.`,
      fix: `Add a hide on the ${missing} side so both ends offer cover.`,
    });
  }

  return true;
}

function checkProbe(answers: SetupCheckAnswers, findings: SetupFinding[]): boolean {
  const { probeLocation, heatOnThermostat, heatSource } = answers;

  if (heatOnThermostat === false && heatSource && heatSource !== 'none') {
    findings.push({
      id: 'no-thermostat',
      severity: 'critical',
      title: 'Heat source is not on a thermostat',
      detail:
        'An unregulated heat source tracks room temperature, so it runs hotter on warm days — exactly when it is least needed. Contact sources like mats can cause burns.',
      fix: 'Put the heat source on a thermostat sized for it, and check the reading over a full day before trusting it.',
    });
    return true;
  }

  if (probeLocation === undefined || probeLocation === 'unknown') return false;

  if (probeLocation === 'cool-end') {
    findings.push({
      id: 'probe-cool-end',
      severity: 'critical',
      title: 'Thermostat probe is at the cool end',
      detail:
        'The thermostat is regulating the coolest point in the enclosure, so it will keep calling for heat until the cool end reaches target — driving the basking area far above it. This is one of the most common causes of accidental overheating.',
      fix: 'Move the probe to the surface or area the thermostat is meant to control, usually at or just beside the basking spot, and verify the basking temperature with a separate thermometer.',
    });
    return true;
  }

  if (probeLocation === 'none') {
    findings.push({
      id: 'probe-missing',
      severity: 'important',
      title: 'No thermostat probe placement recorded',
      detail: 'A thermostat only controls the point its probe is measuring.',
      fix: 'Place the probe where the temperature actually matters and note where it is, so a knocked probe is noticeable.',
    });
    return true;
  }

  // A mat regulated by air temperature will not control the surface the animal
  // is actually lying on, which is the surface that burns.
  if (heatSource === 'heat-mat' && probeLocation === 'ambient-warm') {
    findings.push({
      id: 'probe-mat-ambient',
      severity: 'important',
      title: 'Heat mat is regulated by air temperature',
      detail:
        'The probe is measuring the air, but the mat heats the surface the animal lies on. Surface temperature can be far higher than the air above it.',
      fix: 'Move the probe to sit against the substrate surface directly above the mat.',
    });
  }

  return true;
}

function checkWater(
  answers: SetupCheckAnswers,
  context: SetupCheckContext,
  findings: SetupFinding[]
): boolean {
  if (answers.waterPosition === undefined) return false;

  if (answers.waterPosition === 'none') {
    findings.push({
      id: 'no-water',
      severity: 'critical',
      title: 'No water dish',
      detail:
        'Even species that take most of their water from misting or food are generally offered standing water.',
      fix: `Add a dish the animal can reach and drink from${
        context.speciesName ? `, appropriate for ${context.speciesName}` : ''
      }.`,
    });
    return true;
  }

  if (answers.waterPosition === 'warm-end') {
    findings.push({
      id: 'water-under-heat',
      severity: 'advisory',
      title: 'Water dish is at the warm end',
      detail:
        'Water under a heat source evaporates quickly, which raises humidity in setups that may want it dry and means the dish empties faster than expected.',
      fix: 'Unless this species soaks in warmth, move the dish toward the cool end. If it stays, check the level daily.',
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function runSetupCheck(
  answers: SetupCheckAnswers,
  context: SetupCheckContext = {}
): SetupCheckResult {
  const findings: SetupFinding[] = [];
  let rulesEvaluated = 0;

  if (checkUvbDistance(answers, context, findings)) rulesEvaluated += 1;
  if (checkThermalGradient(answers, context, findings)) rulesEvaluated += 1;
  if (checkHides(answers, findings)) rulesEvaluated += 1;
  if (checkProbe(answers, findings)) rulesEvaluated += 1;
  if (checkWater(answers, context, findings)) rulesEvaluated += 1;

  // Named explicitly so a blank answer never reads as a passed check.
  const unanswered = (Object.keys(QUESTION_LABELS) as Array<keyof SetupCheckAnswers>)
    .filter((key) => answers[key] === undefined)
    .map((key) => QUESTION_LABELS[key]);

  const answered = Object.keys(QUESTION_LABELS).length - unanswered.length;

  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  return {
    findings,
    unanswered,
    rulesEvaluated,
    insufficientAnswers: answered < MIN_ANSWERS,
  };
}
