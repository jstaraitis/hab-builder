/**
 * Ferguson Zones
 *
 * The professional standard for reptile UVB requirements, from Ferguson et al.
 * (2010). Wild reptiles were observed and grouped by the UV Index they actually
 * expose themselves to, which turns "does this species need UVB" into a
 * measurable target rather than a marketing number on a box.
 *
 * WHY THIS REPLACED THE OLD RULE
 * The Setup Check previously judged UVB on bulb type and distance alone. That
 * catches a lamp mounted absurdly far away, but it cannot catch the more common
 * and more damaging error: the WRONG BULB for the species. A compact 5.0 cannot
 * deliver Zone 4 UVI at any distance, and a mercury vapour lamp over a crested
 * gecko is harmful however high it is hung. Distance-only calculators — several
 * of which are free on the web — miss both cases.
 *
 * ON PRECISION
 * Converting distance to a real UVI depends on the exact lamp, fixture,
 * reflector and mesh, and the only definitive answers are the manufacturer's
 * distance chart and a UV meter. The bands here are deliberately wide and are
 * meant to catch setups that are clearly wrong, not to certify one as correct.
 * Every finding says so.
 */

import type { UvbBulbType } from './uvbLifecycle';

export type FergusonZone = 1 | 2 | 3 | 4;

export interface ZoneSpec {
  zone: FergusonZone;
  label: string;
  /** Average UVI the species exposes itself to over a day, from Ferguson et al. */
  uviAverage: { min: number; max: number };
  /** Peak UVI recorded at voluntary basking, i.e. the basking-spot target. */
  uviBaskingPeak: { min: number; max: number };
  behaviour: string;
  examples: string;
}

export const ZONE_SPECS: Record<FergusonZone, ZoneSpec> = {
  1: {
    zone: 1,
    label: 'Zone 1 — Crepuscular / shade dweller',
    uviAverage: { min: 0, max: 0.7 },
    uviBaskingPeak: { min: 0.6, max: 1.4 },
    behaviour: 'Active at dawn, dusk or night; avoids direct sun.',
    examples: 'Crested gecko, leopard gecko, ball python, corn snake',
  },
  2: {
    zone: 2,
    label: 'Zone 2 — Partial sun / occasional basker',
    uviAverage: { min: 0.7, max: 1.0 },
    uviBaskingPeak: { min: 1.1, max: 3.0 },
    behaviour: 'Baskes occasionally and briefly, often in dappled light.',
    examples: 'Boa constrictor, green anole, box turtle, blue tongue skink',
  },
  3: {
    zone: 3,
    label: 'Zone 3 — Open or partial sun basker',
    uviAverage: { min: 1.0, max: 2.6 },
    uviBaskingPeak: { min: 2.9, max: 7.4 },
    behaviour: 'Baskes in full sun in the morning or early afternoon.',
    examples: 'Bearded dragon, veiled chameleon, leopard tortoise, slider',
  },
  4: {
    zone: 4,
    label: 'Zone 4 — Full sun basker',
    uviAverage: { min: 2.6, max: 3.5 },
    uviBaskingPeak: { min: 4.5, max: 9.5 },
    behaviour: 'Baskes in full midday sun, often for extended periods.',
    examples: 'Uromastyx, chuckwalla, rhinoceros iguana',
  },
};

export type BulbFit = 'good' | 'too-weak' | 'too-strong' | 'unknown';

export interface BulbZoneGuidance {
  fit: BulbFit;
  /** Working distance from lamp to basking surface, inches, no mesh. */
  distance?: { min: number; max: number };
  /** Why this bulb does or does not suit this zone. */
  note: string;
}

/**
 * Bulb suitability and working distance per zone.
 *
 * `too-weak` means the lamp cannot reach the zone's UVI at a safe distance —
 * moving it closer would put the animal against the lamp before the UVI target
 * is met. `too-strong` means the zone's UVI is exceeded even at a sensible
 * mounting height, which is an overexposure risk rather than a wasted purchase.
 */
const BULB_ZONE_MATRIX: Record<UvbBulbType, Record<FergusonZone, BulbZoneGuidance>> = {
  'compact': {
    1: { fit: 'good', distance: { min: 6, max: 12 }, note: 'Compact lamps suit low-UVI species at close range.' },
    2: { fit: 'good', distance: { min: 6, max: 10 }, note: 'Workable for occasional baskers over a small footprint.' },
    3: { fit: 'too-weak', note: 'Compact lamps cannot sustain Zone 3 UVI across a basking area. A T5 HO is the usual choice.' },
    4: { fit: 'too-weak', note: 'Nowhere near Zone 4 output. A T5 HO 10.0 or mercury vapour is required.' },
  },
  't8': {
    1: { fit: 'good', distance: { min: 6, max: 12 }, note: 'T8 tubes suit low-UVI species and give better spread than a compact.' },
    2: { fit: 'good', distance: { min: 6, max: 10 }, note: 'Adequate for occasional baskers at close range.' },
    3: { fit: 'too-weak', note: 'T8 output falls away too quickly for Zone 3. A T5 HO is the usual choice.' },
    4: { fit: 'too-weak', note: 'Cannot reach Zone 4 UVI. A T5 HO 10.0 or mercury vapour is required.' },
  },
  't5-ho': {
    1: { fit: 'good', distance: { min: 14, max: 20 }, note: 'A T5 HO 5.0 mounted high suits shade dwellers. Avoid 10.0 for Zone 1.' },
    2: { fit: 'good', distance: { min: 12, max: 18 }, note: 'T5 HO 5.0 at this height covers Zone 2 well.' },
    3: { fit: 'good', distance: { min: 12, max: 18 }, note: 'T5 HO 10.0 at this height is the standard Zone 3 solution.' },
    4: { fit: 'good', distance: { min: 10, max: 14 }, note: 'T5 HO 10.0 mounted closer, or a mercury vapour lamp.' },
  },
  'mercury-vapor': {
    1: { fit: 'too-strong', note: 'Mercury vapour lamps far exceed Zone 1 UVI and also force heat on a species that avoids sun. Not appropriate.' },
    2: { fit: 'too-strong', note: 'Output overshoots Zone 2. A T5 HO 5.0 is the safer choice.' },
    3: { fit: 'good', distance: { min: 12, max: 18 }, note: 'Suits Zone 3, providing heat and UVB together.' },
    4: { fit: 'good', distance: { min: 12, max: 16 }, note: 'A standard Zone 4 solution alongside T5 HO 10.0.' },
  },
  'metal-halide': {
    1: { fit: 'too-strong', note: 'Far exceeds Zone 1 UVI and adds unwanted heat. Not appropriate.' },
    2: { fit: 'too-strong', note: 'Overshoots Zone 2. A T5 HO 5.0 is the safer choice.' },
    3: { fit: 'good', distance: { min: 12, max: 20 }, note: 'Suits Zone 3 over a tall enclosure.' },
    4: { fit: 'good', distance: { min: 12, max: 18 }, note: 'High output suits full-sun baskers.' },
  },
  'unknown': {
    1: { fit: 'unknown', distance: { min: 8, max: 16 }, note: 'Bulb type not recorded — this is a conservative range only.' },
    2: { fit: 'unknown', distance: { min: 8, max: 14 }, note: 'Bulb type not recorded — this is a conservative range only.' },
    3: { fit: 'unknown', distance: { min: 10, max: 16 }, note: 'Bulb type not recorded — this is a conservative range only.' },
    4: { fit: 'unknown', distance: { min: 10, max: 14 }, note: 'Bulb type not recorded — this is a conservative range only.' },
  },
};

/**
 * Mesh blocks a large share of UVB — commonly cited between a third and a half
 * depending on weave. A lamp resting on a mesh lid must sit proportionally
 * closer to deliver the same UVI.
 */
export const MESH_DISTANCE_FACTOR = 0.7;

export function getBulbGuidance(
  bulbType: UvbBulbType | undefined,
  zone: FergusonZone
): BulbZoneGuidance {
  return BULB_ZONE_MATRIX[bulbType ?? 'unknown'][zone];
}

/** Working distance for a bulb in a zone, adjusted for mesh. Null when unusable. */
export function workingDistance(
  bulbType: UvbBulbType | undefined,
  zone: FergusonZone,
  overMesh: boolean
): { min: number; max: number } | null {
  const guidance = getBulbGuidance(bulbType, zone);
  if (!guidance.distance) return null;
  const factor = overMesh ? MESH_DISTANCE_FACTOR : 1;
  return {
    min: Math.round(guidance.distance.min * factor),
    max: Math.round(guidance.distance.max * factor),
  };
}

/** Human-readable UVI target for the basking spot. */
export function baskingUviTarget(zone: FergusonZone): string {
  const spec = ZONE_SPECS[zone];
  return `UVI ${spec.uviBaskingPeak.min}–${spec.uviBaskingPeak.max} at the basking spot`;
}

/** Parses a zone from species data, rejecting anything outside 1-4. */
export function parseZone(value: unknown): FergusonZone | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : undefined;
}
