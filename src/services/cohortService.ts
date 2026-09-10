import { supabase } from '../lib/supabase';
import type { CohortCurve } from '../engine/cohortStats';

/**
 * Contribution and retrieval for species growth benchmarks.
 *
 * Writes are fire-and-forget and never surface an error to the keeper. Someone
 * recording their gecko's weight is doing a small piece of husbandry; if the
 * anonymised copy fails to save, that is our problem, not theirs, and it must
 * not turn a successful weigh-in into a failed one.
 *
 * An observation is only contributed when every condition holds:
 *   - the keeper has not opted out
 *   - the animal's species is known (nothing to compare against otherwise)
 *   - the animal's hatch or acquisition date is known (no age, no percentile)
 *
 * Silently skipping when age or species is missing is deliberate. A cohort built
 * on guessed ages would be worse than no cohort, and would be invisibly wrong.
 */

/** Nothing older than this is a plausible age for the species we cover. */
const MAX_PLAUSIBLE_AGE_DAYS = 365 * 60;

const DAY_MS = 24 * 60 * 60 * 1000;

interface ContributionInput {
  enclosureAnimalId: string;
  weightGrams: number;
  measurementDate: Date;
}

class CohortService {
  /**
   * Records one anonymised observation. Never throws, never awaited by callers.
   */
  contribute(userId: string, input: ContributionInput): void {
    void (async () => {
      try {
        const [{ data: profile }, { data: animal }] = await Promise.all([
          supabase.from('profiles').select('contributes_cohort_data').eq('id', userId).maybeSingle(),
          supabase
            .from('enclosure_animals')
            .select('species_id, birthday, acquisition_date, gender, cohort_key')
            .eq('id', input.enclosureAnimalId)
            .maybeSingle(),
        ]);

        // Fails closed: a profile we cannot read is treated as opted out.
        if (!profile || profile.contributes_cohort_data === false) return;
        if (!animal?.species_id || !animal.cohort_key) return;

        const birth = animal.birthday ?? animal.acquisition_date;
        if (!birth) return;

        const birthDate = new Date(birth as string);
        if (Number.isNaN(birthDate.getTime())) return;

        const ageDays = Math.floor((input.measurementDate.getTime() - birthDate.getTime()) / DAY_MS);
        if (ageDays < 0 || ageDays > MAX_PLAUSIBLE_AGE_DAYS) return;
        if (!Number.isFinite(input.weightGrams) || input.weightGrams <= 0) return;

        await supabase.from('cohort_observations').upsert(
          {
            species_id: animal.species_id,
            sex: animal.gender ?? 'unknown',
            age_days: ageDays,
            weight_grams: input.weightGrams,
            // Date only, never a timestamp — see the migration's privacy notes.
            observed_on: input.measurementDate.toISOString().slice(0, 10),
            animal_key: animal.cohort_key,
          },
          { onConflict: 'animal_key,observed_on', ignoreDuplicates: true }
        );
      } catch (error) {
        if (import.meta.env.DEV) console.debug('[cohort] contribution skipped', error);
      }
    })();
  }

  /**
   * Removes every observation this keeper has contributed.
   *
   * Called when consent is withdrawn. Runs through an edge function because
   * cohort_observations has no client-readable or client-deletable policy —
   * a client that could delete by animal_key could also probe for one.
   */
  async withdrawContributions(): Promise<void> {
    const { error } = await supabase.functions.invoke('cohort-stats', {
      body: { withdraw: true },
    });
    if (error) throw error;
  }

  async setContributionConsent(userId: string, contributes: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ contributes_cohort_data: contributes })
      .eq('id', userId);

    if (error) throw error;

    // Withdrawing consent removes what was already shared, rather than only
    // stopping new contributions. Anything less would make the toggle a lie.
    if (!contributes) {
      await this.withdrawContributions();
    }
  }

  /** Fetches the growth curve for a species. Aggregates only. */
  async getCurve(speciesId: string): Promise<CohortCurve> {
    const { data, error } = await supabase.functions.invoke<{ curve?: CohortCurve; error?: string }>(
      'cohort-stats',
      { body: { speciesId } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.curve) throw new Error('No curve returned');

    return data.curve;
  }
}

export const cohortService = new CohortService();
