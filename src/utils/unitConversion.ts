/**
 * Unit conversion utilities for imperial ↔ metric
 * All data is stored in imperial (inches, Fahrenheit, gallons)
 * This module handles display conversion only
 */

// ============================================================================
// LENGTH CONVERSIONS
// ============================================================================

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Format dimensions with appropriate units
 */
export function formatDimensions(
  width: number,
  depth: number,
  height: number,
  useMetric: boolean
): string {
  if (useMetric) {
    const w = Math.round(inchesToCm(width));
    const d = Math.round(inchesToCm(depth));
    const h = Math.round(inchesToCm(height));
    return `${w}×${d}×${h} cm`;
  }
  return `${width}×${depth}×${height}"`;
}

/**
 * Format a single length measurement
 */
export function formatLength(inches: number, useMetric: boolean): string {
  if (useMetric) {
    return `${Math.round(inchesToCm(inches))} cm`;
  }
  return `${inches}"`;
}

/**
 * Format adult size (handles ranges like "2.5-4 inches")
 */
export function formatAdultSize(sizeString: string, useMetric: boolean): string {
  if (!useMetric) return sizeString;
  
  // Extract numbers from string like "2.5-4 inches"
  const matches = sizeString.match(/(\d+\.?\d*)/g);
  if (!matches) return sizeString;
  
  const converted = matches.map(num => Math.round(inchesToCm(parseFloat(num)) * 10) / 10);
  
  if (converted.length === 1) {
    return `${converted[0]} cm`;
  } else if (converted.length === 2) {
    return `${converted[0]}-${converted[1]} cm`;
  }
  
  return sizeString; // Fallback
}

// ============================================================================
// TEMPERATURE CONVERSIONS
// ============================================================================

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Format temperature with appropriate units
 */
export function formatTemp(fahrenheit: number, useMetric: boolean): string {
  if (useMetric) {
    return `${Math.round(fahrenheitToCelsius(fahrenheit))}°C`;
  }
  return `${fahrenheit}°F`;
}

/**
 * Format temperature range
 */
export function formatTempRange(
  minF: number,
  maxF: number,
  useMetric: boolean
): string {
  if (useMetric) {
    const minC = Math.round(fahrenheitToCelsius(minF));
    const maxC = Math.round(fahrenheitToCelsius(maxF));
    return `${minC}-${maxC}°C`;
  }
  return `${minF}-${maxF}°F`;
}

// ============================================================================
// VOLUME CONVERSIONS
// ============================================================================

/**
 * Convert US gallons to liters
 */
export function gallonsToLiters(gallons: number): number {
  return gallons * 3.78541;
}

/**
 * Convert liters to US gallons
 */
export function litersToGallons(liters: number): number {
  return liters / 3.78541;
}

/**
 * Format volume with appropriate units
 */
export function formatVolume(gallons: number, useMetric: boolean): string {
  if (useMetric) {
    return `${Math.round(gallonsToLiters(gallons))} L`;
  }
  return `${Math.round(gallons)} gal`;
}

/**
 * Calculate volume from dimensions
 */
export function calculateVolume(
  widthInches: number,
  depthInches: number,
  heightInches: number,
  useMetric: boolean
): { value: number; unit: string } {
  if (useMetric) {
    // Convert to cm, calculate volume in liters
    const widthCm = inchesToCm(widthInches);
    const depthCm = inchesToCm(depthInches);
    const heightCm = inchesToCm(heightInches);
    const volumeLiters = (widthCm * depthCm * heightCm) / 1000;
    return { value: Math.round(volumeLiters * 10) / 10, unit: 'L' };
  } else {
    // Calculate volume in gallons
    const volumeGallons = (widthInches * depthInches * heightInches) / 231;
    return { value: Math.round(volumeGallons * 10) / 10, unit: 'gal' };
  }
}

// ============================================================================
// FORM INPUT HELPERS
// ============================================================================

/**
 * Get placeholder text for dimension inputs
 */
export function getDimensionPlaceholder(dimension: 'width' | 'depth' | 'height', useMetric: boolean): string {
  const defaults = {
    width: { imperial: '36', metric: '91' },
    depth: { imperial: '18', metric: '46' },
    height: { imperial: '18', metric: '46' },
  };
  
  const value = useMetric ? defaults[dimension].metric : defaults[dimension].imperial;
  const unit = useMetric ? 'cm' : 'in';
  
  return `${value} ${unit}`;
}

/**
 * Get min/max validation values for dimension inputs
 */
export function getDimensionConstraints(useMetric: boolean): { min: number; max: number } {
  if (useMetric) {
    return { min: 15, max: 305 }; // 6" to 120" in cm
  }
  return { min: 6, max: 120 }; // inches
}

/**
 * Get temperature constraints for form validation
 */
export function getTempConstraints(useMetric: boolean): { min: number; max: number } {
  if (useMetric) {
    return { min: 10, max: 40 }; // ~50°F to 104°F
  }
  return { min: 50, max: 104 };
}

/**
 * Convert user input to inches (for storage)
 */
export function convertInputToInches(value: number, useMetric: boolean): number {
  return useMetric ? cmToInches(value) : value;
}

/**
 * Convert stored inches to display value
 */
export function convertInchesToDisplay(inches: number, useMetric: boolean): number {
  return useMetric ? Math.round(inchesToCm(inches)) : inches;
}

/**
 * Convert user temperature input to Fahrenheit (for storage)
 */
export function convertInputToFahrenheit(value: number, useMetric: boolean): number {
  return useMetric ? celsiusToFahrenheit(value) : value;
}

/**
 * Convert stored Fahrenheit to display value
 */
export function convertFahrenheitToDisplay(fahrenheit: number, useMetric: boolean): number {
  return useMetric ? Math.round(fahrenheitToCelsius(fahrenheit)) : fahrenheit;
}

// ============================================================================
// UNIT LABELS
// ============================================================================

export function getLengthUnit(useMetric: boolean): string {
  return useMetric ? 'cm' : 'in';
}

export function getTempUnit(useMetric: boolean): string {
  return useMetric ? '°C' : '°F';
}

export function getVolumeUnit(useMetric: boolean): string {
  return useMetric ? 'L' : 'gal';
}
