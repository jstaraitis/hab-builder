import { describe, it, expect } from 'vitest';
import { runSetupCheck, type SetupCheckAnswers, type SetupCheckContext } from './setupCheck';

function run(answers: SetupCheckAnswers, context: SetupCheckContext = {}) {
  return runSetupCheck(answers, context);
}

function ids(answers: SetupCheckAnswers, context: SetupCheckContext = {}): string[] {
  return run(answers, context).findings.map((f) => f.id);
}

describe('setupCheck — UVB distance', () => {
  it('flags a T5 HO mounted too far away as critical', () => {
    const finding = run({ uvbDistanceInches: 26 }, { uvbBulbType: 't5-ho' }).findings[0];
    expect(finding.id).toBe('uvb-too-far');
    expect(finding.severity).toBe('critical');
    expect(finding.detail).toContain('metabolic bone disease');
  });

  it('flags a T5 HO mounted too close, but less severely', () => {
    // Too close is a real risk, but too far is worse: a lit bulb doing nothing
    // looks correct to the keeper.
    const finding = run({ uvbDistanceInches: 4 }, { uvbBulbType: 't5-ho' }).findings[0];
    expect(finding.id).toBe('uvb-too-close');
    expect(finding.severity).toBe('important');
  });

  it('accepts a distance inside the range for the bulb type', () => {
    expect(ids({ uvbDistanceInches: 15 }, { uvbBulbType: 't5-ho' })).not.toContain('uvb-too-far');
    expect(ids({ uvbDistanceInches: 15 }, { uvbBulbType: 't5-ho' })).not.toContain('uvb-too-close');
  });

  it('uses a different range for a compact bulb than a T5 HO', () => {
    // 15" is fine for a T5 HO and much too far for a compact.
    expect(ids({ uvbDistanceInches: 15 }, { uvbBulbType: 'compact' })).toContain('uvb-too-far');
    expect(ids({ uvbDistanceInches: 15 }, { uvbBulbType: 't5-ho' })).not.toContain('uvb-too-far');
  });

  it('requires a shorter distance when the lamp sits over mesh', () => {
    // 17" passes for a T5 HO mounted inside, but not through mesh.
    expect(ids({ uvbDistanceInches: 17, uvbOverMesh: false }, { uvbBulbType: 't5-ho' })).not.toContain(
      'uvb-too-far'
    );
    expect(ids({ uvbDistanceInches: 17, uvbOverMesh: true }, { uvbBulbType: 't5-ho' })).toContain(
      'uvb-too-far'
    );
  });

  it('mentions mesh in the explanation when it applies', () => {
    const finding = run({ uvbDistanceInches: 30, uvbOverMesh: true }, { uvbBulbType: 't5-ho' })
      .findings[0];
    expect(finding.detail).toContain('Mesh');
  });

  it('says nothing about UVB for a species that does not need it', () => {
    expect(ids({ uvbDistanceInches: 40 }, { uvbRequired: false })).toHaveLength(0);
  });

  it('falls back to a conservative range when the bulb type is unknown', () => {
    expect(ids({ uvbDistanceInches: 20 })).toContain('uvb-too-far');
  });

  it('points the keeper at the manufacturer chart rather than claiming precision', () => {
    const finding = run({ uvbDistanceInches: 30 }, { uvbBulbType: 't5-ho' }).findings[0];
    expect(finding.fix).toContain("manufacturer");
  });
});

describe('setupCheck — thermal gradient', () => {
  it('flags an enclosure too short for a gradient', () => {
    expect(ids({ baskingToCoolInches: 16 })).toContain('gradient-too-short');
  });

  it('accepts an enclosure with room for a gradient', () => {
    expect(ids({ baskingToCoolInches: 36 })).not.toContain('gradient-too-short');
  });

  it('falls back to the enclosure length when the distance is not given', () => {
    expect(ids({}, { enclosureLengthInches: 18 })).toContain('gradient-too-short');
  });

  it('softens the advice for a climbing species', () => {
    const arboreal = run({ baskingToCoolInches: 16 }, { prefersVertical: true }).findings[0];
    expect(arboreal.detail).toContain('climbs');
    expect(arboreal.fix).toContain('vertical');
  });

  it('skips the rule entirely for a species that needs no gradient', () => {
    expect(ids({ baskingToCoolInches: 10 }, { requiresThermalGradient: false })).toHaveLength(0);
  });
});

describe('setupCheck — hides', () => {
  it('treats no hides at all as critical', () => {
    const finding = run({ hidesWarmSide: 0, hidesCoolSide: 0 }).findings[0];
    expect(finding.id).toBe('no-hides');
    expect(finding.severity).toBe('critical');
  });

  it('flags cover on only one side, naming the missing side', () => {
    const warmOnly = run({ hidesWarmSide: 2, hidesCoolSide: 0 }).findings[0];
    expect(warmOnly.id).toBe('no-hide-cool');
    expect(warmOnly.detail).toContain('choose between');

    const coolOnly = run({ hidesWarmSide: 0, hidesCoolSide: 1 }).findings[0];
    expect(coolOnly.id).toBe('no-hide-warm');
  });

  it('is satisfied by one hide at each end', () => {
    expect(ids({ hidesWarmSide: 1, hidesCoolSide: 1 })).toHaveLength(0);
  });

  it('does not run when neither hide question was answered', () => {
    expect(run({}).rulesEvaluated).toBe(0);
  });
});

describe('setupCheck — thermostat and probe', () => {
  it('treats an unregulated heat source as critical', () => {
    const finding = run({ heatSource: 'overhead-bulb', heatOnThermostat: false }).findings[0];
    expect(finding.id).toBe('no-thermostat');
    expect(finding.severity).toBe('critical');
  });

  it('does not complain when there is no heat source to regulate', () => {
    expect(ids({ heatSource: 'none', heatOnThermostat: false })).not.toContain('no-thermostat');
  });

  it('treats a probe at the cool end as critical', () => {
    const finding = run({ probeLocation: 'cool-end' }).findings[0];
    expect(finding.id).toBe('probe-cool-end');
    expect(finding.severity).toBe('critical');
    expect(finding.detail).toContain('overheating');
  });

  it('accepts a probe at the basking surface', () => {
    expect(ids({ probeLocation: 'basking-surface' })).toHaveLength(0);
  });

  it('flags a heat mat regulated by air temperature', () => {
    expect(ids({ heatSource: 'heat-mat', probeLocation: 'ambient-warm', heatOnThermostat: true })).toContain(
      'probe-mat-ambient'
    );
  });

  it('does not apply the mat rule to an overhead bulb', () => {
    expect(
      ids({ heatSource: 'overhead-bulb', probeLocation: 'ambient-warm', heatOnThermostat: true })
    ).not.toContain('probe-mat-ambient');
  });

  it('skips the probe rule when the keeper does not know where it is', () => {
    expect(ids({ probeLocation: 'unknown' })).toHaveLength(0);
  });
});

describe('setupCheck — water', () => {
  it('treats a missing water dish as critical', () => {
    expect(run({ waterPosition: 'none' }).findings[0].severity).toBe('critical');
  });

  it('raises water at the warm end only as advisory', () => {
    const finding = run({ waterPosition: 'warm-end' }).findings[0];
    expect(finding.id).toBe('water-under-heat');
    expect(finding.severity).toBe('advisory');
  });

  it('accepts water at the cool end', () => {
    expect(ids({ waterPosition: 'cool-end' })).toHaveLength(0);
  });

  it('names the species in the fix when it is known', () => {
    const finding = run({ waterPosition: 'none' }, { speciesName: 'Crested Gecko' }).findings[0];
    expect(finding.fix).toContain('Crested Gecko');
  });
});

describe('setupCheck — honesty about gaps', () => {
  it('lists unanswered questions rather than treating them as passes', () => {
    const result = run({ hidesWarmSide: 1, hidesCoolSide: 1 });
    expect(result.unanswered).toContain('UVB distance to the basking spot');
    expect(result.unanswered).toContain('Where the thermostat probe sits');
  });

  it('flags a nearly empty questionnaire as insufficient', () => {
    expect(run({ hidesWarmSide: 1 }).insufficientAnswers).toBe(true);
  });

  it('clears the insufficient flag once enough is answered', () => {
    const result = run({
      hidesWarmSide: 1,
      hidesCoolSide: 1,
      probeLocation: 'basking-surface',
      waterPosition: 'cool-end',
    });
    expect(result.insufficientAnswers).toBe(false);
  });

  it('counts only the rules it could actually evaluate', () => {
    expect(run({ waterPosition: 'cool-end' }).rulesEvaluated).toBe(1);
    expect(run({ waterPosition: 'cool-end', hidesWarmSide: 1, hidesCoolSide: 1 }).rulesEvaluated).toBe(2);
  });
});

describe('setupCheck — ranking and completeness', () => {
  it('orders findings most severe first', () => {
    const result = run(
      {
        uvbDistanceInches: 30,
        waterPosition: 'warm-end',
        hidesWarmSide: 1,
        hidesCoolSide: 0,
      },
      { uvbBulbType: 't5-ho' }
    );
    const severities = result.findings.map((f) => f.severity);
    expect(severities[0]).toBe('critical');
    expect(severities[severities.length - 1]).toBe('advisory');
  });

  it('gives every finding an actionable fix, not just a complaint', () => {
    const result = run(
      { uvbDistanceInches: 30, probeLocation: 'cool-end', hidesWarmSide: 0, hidesCoolSide: 0 },
      { uvbBulbType: 't5-ho' }
    );
    expect(result.findings.length).toBeGreaterThan(0);
    for (const finding of result.findings) {
      expect(finding.fix.length).toBeGreaterThan(10);
    }
  });

  it('returns nothing for a correctly configured enclosure', () => {
    const result = run(
      {
        uvbDistanceInches: 14,
        uvbOverMesh: false,
        baskingToCoolInches: 36,
        hidesWarmSide: 1,
        hidesCoolSide: 1,
        waterPosition: 'cool-end',
        probeLocation: 'basking-surface',
        heatSource: 'overhead-bulb',
        heatOnThermostat: true,
      },
      { uvbBulbType: 't5-ho', uvbRequired: true, requiresThermalGradient: true }
    );

    expect(result.findings).toHaveLength(0);
    expect(result.unanswered).toHaveLength(0);
    expect(result.insufficientAnswers).toBe(false);
  });
});
