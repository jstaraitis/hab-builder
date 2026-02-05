import type { EnclosureInput } from '../engine/types';

/**
 * Calculate approximate gallons for aquarium searches
 */
function calculateGallons(input: EnclosureInput): number {
  // Convert to inches if needed
  const widthIn = input.units === 'cm' ? input.width / 2.54 : input.width;
  const depthIn = input.units === 'cm' ? input.depth / 2.54 : input.depth;
  const heightIn = input.units === 'cm' ? input.height / 2.54 : input.height;
  
  // Calculate volume in cubic inches, then convert to gallons
  const volumeCubicInches = widthIn * depthIn * heightIn;
  const gallons = volumeCubicInches / 231; // 231 cubic inches per gallon
  
  // Round to nearest common tank size: 10, 20, 29, 40, 55, 75, 90, 125
  const commonSizes = [10, 20, 29, 40, 55, 75, 90, 125, 150, 180, 210];
  return commonSizes.reduce((prev, curr) => 
    Math.abs(curr - gallons) < Math.abs(prev - gallons) ? curr : prev
  );
}

/**
 * Generate dynamic Amazon affiliate search link based on search query template
 * 
 * Replaces placeholders:
 * - {width}, {depth}, {height} - enclosure dimensions
 * - {size} - calculated gallon size for aquariums
 * - {units} - in or cm
 * 
 * @param searchQuery - Template string like "Exo Terra {width}x{depth}x{height} glass terrarium"
 * @param input - User's enclosure configuration
 * @param affiliateTag - Optional Amazon affiliate tag
 * @returns Complete Amazon search URL
 */
export function generateAmazonLink(
  searchQuery: string,
  input: EnclosureInput,
  affiliateTag?: string
): string {
  const gallons = calculateGallons(input);
  
  // Replace placeholders with actual values
  const processedQuery = searchQuery
    .replace(/{width}/g, Math.round(input.width).toString())
    .replace(/{depth}/g, Math.round(input.depth).toString())
    .replace(/{height}/g, Math.round(input.height).toString())
    .replace(/{size}/g, gallons.toString())
    .replace(/{units}/g, input.units);
  
  // Build Amazon search URL
  const baseUrl = 'https://www.amazon.com/s';
  const params = new URLSearchParams({
    k: processedQuery,
    ...(affiliateTag && { tag: affiliateTag })
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a basic Amazon search URL (no enclosure dimensions needed).
 */
export function generateAmazonSearchLink(
  searchQuery: string,
  affiliateTag?: string
): string {
  const baseUrl = 'https://www.amazon.com/s';
  const params = new URLSearchParams({
    k: searchQuery,
    ...(affiliateTag && { tag: affiliateTag })
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Append an Amazon affiliate tag to a product or search URL if not present.
 */
export function appendAmazonAffiliateTag(url: string, affiliateTag?: string): string {
  if (!affiliateTag) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.get('tag')) {
      parsed.searchParams.set('tag', affiliateTag);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
