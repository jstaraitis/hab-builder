import { enclosureAnimalService } from './enclosureAnimalService';
import { weightTrackingService } from './weightTrackingService';
import type { ImportedAnimal } from '../engine/csvImport';

/**
 * Writes an imported collection into the app.
 *
 * Two rules shape this:
 *
 *   1. PARTIAL FAILURE IS REPORTED, NOT SWALLOWED. Animals are created one at a
 *      time and each failure is recorded with the animal's name. A bulk insert
 *      would be faster but would turn "37 of 40 imported, here are the 3 that
 *      did not" into "something went wrong", which is useless to someone who
 *      has just moved their whole collection across.
 *   2. RE-RUNNING AN IMPORT MUST NOT DUPLICATE. Accidentally importing the same
 *      file twice is the most likely mistake, and a keeper who ends up with two
 *      of every animal has to delete them by hand. Existing names are skipped
 *      by default.
 */

export interface ImportOutcome {
  created: string[];
  /** Names already present, skipped rather than duplicated. */
  skippedExisting: string[];
  /** Animals that failed to write, with the reason. */
  failed: Array<{ name: string; reason: string }>;
  /** Initial weight logs written alongside their animal. */
  weightsRecorded: number;
}

export interface ImportOptions {
  userId: string;
  /** Optional enclosure to place every imported animal into. */
  enclosureId?: string;
  /** Skip animals whose name already exists. Defaults to true. */
  skipExisting?: boolean;
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

class ImportService {
  async importAnimals(
    animals: ImportedAnimal[],
    options: ImportOptions
  ): Promise<ImportOutcome> {
    const { userId, enclosureId, skipExisting = true } = options;

    const outcome: ImportOutcome = {
      created: [],
      skippedExisting: [],
      failed: [],
      weightsRecorded: 0,
    };

    // Fetched once up front rather than per row — a 200-animal import should
    // not be 200 extra reads.
    const existingNames = new Set<string>();
    if (skipExisting) {
      try {
        const existing = await enclosureAnimalService.getAllUserAnimals(userId);
        for (const animal of existing) {
          if (animal.name) existingNames.add(normaliseName(animal.name));
        }
      } catch (error) {
        // Failing to read the existing collection must not block the import;
        // it only means duplicate protection is unavailable this run.
        console.error('[import] could not load existing animals, duplicate check skipped:', error);
      }
    }

    // Guards against duplicates WITHIN the file as well as against the
    // collection — exports sometimes repeat a row.
    const seenInFile = new Set<string>();

    for (const animal of animals) {
      const key = normaliseName(animal.name);

      if (existingNames.has(key) || seenInFile.has(key)) {
        outcome.skippedExisting.push(animal.name);
        continue;
      }
      seenInFile.add(key);

      try {
        const created = await enclosureAnimalService.createAnimal({
          userId,
          enclosureId,
          name: animal.name,
          speciesName: animal.species,
          morph: animal.morph,
          gender: animal.sex,
          birthday: animal.birthDate,
          acquisitionDate: animal.acquisitionDate,
          notes: animal.notes,
          isActive: true,
        });

        outcome.created.push(animal.name);

        // A starting weight is worth keeping — it seeds the growth chart and,
        // where a hatch date came across too, the cohort benchmark. Logged
        // against the acquisition or hatch date when known, so the point lands
        // at the right age rather than today.
        if (animal.weightGrams !== undefined) {
          try {
            await weightTrackingService.createWeightLog(userId, {
              enclosureAnimalId: created.id,
              weightGrams: animal.weightGrams,
              measurementDate: animal.acquisitionDate ?? animal.birthDate ?? new Date(),
              notes: 'Imported',
            });
            outcome.weightsRecorded += 1;
          } catch (weightError) {
            // The animal is already saved; a failed weight log is a footnote,
            // not a reason to report the import as failed.
            console.error(`[import] weight log failed for ${animal.name}:`, weightError);
          }
        }
      } catch (error) {
        outcome.failed.push({
          name: animal.name,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return outcome;
  }
}

export const importService = new ImportService();
