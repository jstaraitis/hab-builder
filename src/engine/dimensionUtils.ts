import type { EnclosureInput, AnimalProfile, Units } from './types';

export interface NormalizedDimensions {
  width: number;
  depth: number;
  height: number;
  units: 'in'; // Always normalized to inches
}

/**
 * Converts dimensions from any unit to inches for standardized calculations
 */
export function normalizeToInches(
  width: number,
  depth: number,
  height: number,
  units: Units
): NormalizedDimensions {
  if (units === 'cm') {
    return {
      width: width / 2.54,
      depth: depth / 2.54,
      height: height / 2.54,
      units: 'in',
    };
  }
  return { width, depth, height, units: 'in' };
}

/**
 * Normalizes enclosure input dimensions to inches
 */
export function normalizeEnclosureInput(input: EnclosureInput): NormalizedDimensions {
  return normalizeToInches(input.width, input.depth, input.height, input.units);
}

/**
 * Normalizes animal profile minimum enclosure size to inches
 */
export function normalizeMinimumSize(profile: AnimalProfile): NormalizedDimensions {
  const { width, depth, height, units } = profile.minEnclosureSize;
  return normalizeToInches(width, depth, height, units);
}

/**
 * Calculates enclosure volume in gallons (US gallons: 231 cubic inches)
 * Accepts either NormalizedDimensions or plain dimensions object
 */
export function calculateGallons(dims: { width: number; depth: number; height: number }): number {
  const volumeInches = dims.width * dims.depth * dims.height;
  return volumeInches / 231;
}

/**
 * Calculates enclosure volume in cubic feet
 * Accepts either NormalizedDimensions or plain dimensions object
 */
export function calculateCubicFeet(dims: { width: number; depth: number; height: number }): number {
  return (dims.width * dims.depth * dims.height) / 1728;
}
