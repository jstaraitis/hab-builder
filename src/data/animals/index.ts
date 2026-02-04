// Animal profile exports - automatically discovers all JSON files
import type { AnimalProfile } from '../../engine/types';

// Dynamically import all animal JSON files
const animalModules = import.meta.glob<{ default: AnimalProfile }>('./*.json', { 
  eager: true
});

// Convert to a keyed object by animal ID
export const animalProfiles = Object.fromEntries(
  Object.entries(animalModules)
    .map(([_, module]) => [module.default.id, module.default])
);

// Generate animal list for picker component
export const animalList = Object.values(animalProfiles).map(profile => ({
  id: profile.id,
  name: profile.commonName,
  image: profile.emoji || '🦎', // Use emoji from profile, fallback to generic lizard
  imageUrl: profile.imageUrl, // URL to real photo
  careLevel: profile.careLevel,
  completionStatus: profile.completionStatus || 'complete', // Default to complete if not specified
  // Expose search-related fields so the UI can perform broader matching (e.g., "snake" → pythons)
  searchQuery: profile.searchQuery || [],
  scientificName: profile.scientificName || ''
}));

// Helper to get animal by ID
export function getAnimalById(id: string): AnimalProfile | null {
  return animalProfiles[id] || null;
}
