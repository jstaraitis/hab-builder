import { supabase } from '../lib/supabase';
import { enclosureService } from './enclosureService';
import { animalProfiles } from '../data/animals';
import type { SetupCheckAnswers, SetupCheckContext } from '../engine/setupCheck';

/**
 * Loads and saves Setup Check answers against an enclosure.
 *
 * The context half — species UVB requirement, whether a thermal gradient is
 * needed, whether the species is arboreal — is read from the species profile
 * rather than asked. The keeper already told us the species; asking them to
 * restate its care requirements would be both tedious and less reliable than
 * the profile.
 */

export interface LoadedSetupCheck {
  answers: SetupCheckAnswers;
  context: SetupCheckContext;
  completedAt: Date | null;
}

/** Row shape for the Setup Check columns. */
interface SetupCheckRow {
  uvb_distance_inches: number | null;
  uvb_over_mesh: boolean | null;
  basking_to_cool_inches: number | null;
  hides_warm_side: number | null;
  hides_cool_side: number | null;
  water_position: string | null;
  probe_location: string | null;
  heat_source: string | null;
  heat_on_thermostat: boolean | null;
  setup_checked_at: string | null;
}

/** NULL means "not answered" and must stay undefined, never a default. */
function orUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

class SetupCheckService {
  async load(enclosureId: string): Promise<LoadedSetupCheck> {
    const [{ data, error }, enclosure] = await Promise.all([
      supabase
        .from('enclosures')
        .select(
          'uvb_distance_inches, uvb_over_mesh, basking_to_cool_inches, hides_warm_side, hides_cool_side, water_position, probe_location, heat_source, heat_on_thermostat, setup_checked_at'
        )
        .eq('id', enclosureId)
        .maybeSingle<SetupCheckRow>(),
      enclosureService.getEnclosureById(enclosureId),
    ]);

    if (error) throw error;
    if (!enclosure) throw new Error('Enclosure not found');

    const profile = animalProfiles[enclosure.animalId as keyof typeof animalProfiles];
    const targets = profile?.careTargets;

    // Longest horizontal dimension: the gradient runs along the floor, so the
    // relevant span is width or depth, not height.
    const enclosureLengthInches =
      enclosure.widthInches !== undefined || enclosure.depthInches !== undefined
        ? Math.max(enclosure.widthInches ?? 0, enclosure.depthInches ?? 0) || undefined
        : undefined;

    const context: SetupCheckContext = {
      enclosureLengthInches,
      uvbBulbType: enclosure.uvbBulbType,
      uvbRequired: targets?.lighting?.uvbRequired,
      uvbStrength: targets?.lighting?.uvbStrength,
      requiresThermalGradient: targets?.temperature?.thermalGradient,
      prefersVertical: profile?.layoutRules?.preferVertical,
      speciesName: enclosure.animalName ?? profile?.commonName,
    };

    return {
      answers: {
        uvbDistanceInches: orUndefined(data?.uvb_distance_inches ?? null),
        uvbOverMesh: orUndefined(data?.uvb_over_mesh ?? null),
        baskingToCoolInches: orUndefined(data?.basking_to_cool_inches ?? null),
        hidesWarmSide: orUndefined(data?.hides_warm_side ?? null),
        hidesCoolSide: orUndefined(data?.hides_cool_side ?? null),
        waterPosition: orUndefined(data?.water_position ?? null) as SetupCheckAnswers['waterPosition'],
        probeLocation: orUndefined(data?.probe_location ?? null) as SetupCheckAnswers['probeLocation'],
        heatSource: orUndefined(data?.heat_source ?? null) as SetupCheckAnswers['heatSource'],
        heatOnThermostat: orUndefined(data?.heat_on_thermostat ?? null),
      },
      context,
      completedAt: data?.setup_checked_at ? new Date(data.setup_checked_at) : null,
    };
  }

  async save(enclosureId: string, answers: SetupCheckAnswers): Promise<void> {
    // Undefined is written as NULL rather than omitted, so clearing an answer
    // on a re-run actually clears it instead of leaving the old value behind.
    const { error } = await supabase
      .from('enclosures')
      .update({
        uvb_distance_inches: answers.uvbDistanceInches ?? null,
        uvb_over_mesh: answers.uvbOverMesh ?? null,
        basking_to_cool_inches: answers.baskingToCoolInches ?? null,
        hides_warm_side: answers.hidesWarmSide ?? null,
        hides_cool_side: answers.hidesCoolSide ?? null,
        water_position: answers.waterPosition ?? null,
        probe_location: answers.probeLocation ?? null,
        heat_source: answers.heatSource ?? null,
        heat_on_thermostat: answers.heatOnThermostat ?? null,
        setup_checked_at: new Date().toISOString(),
      })
      .eq('id', enclosureId);

    if (error) throw error;
  }
}

export const setupCheckService = new SetupCheckService();
