import { describe, it, expect } from 'vitest';
import {
  buildCostBreakdown,
  monthlyElectricityCost,
  monthlyKwh,
  type CostInput,
} from './costOfKeeping';

function build(overrides: CostInput = {}) {
  return buildCostBreakdown(overrides);
}

describe('monthlyElectricityCost', () => {
  it('computes from wattage, hours and rate', () => {
    // 100W × 12h × 100% duty = 1.2 kWh/day × 30.44 days × $0.30 ≈ $10.96
    const cost = monthlyElectricityCost(
      { label: 'Basking lamp', watts: 100, hoursPerDay: 12, dutyCycle: 1 },
      0.3
    );
    expect(cost).toBeCloseTo(10.96, 1);
  });

  it('applies a conservative duty cycle by default', () => {
    // A thermostatted lamp is off much of the time. Assuming continuous draw
    // would roughly double the estimate.
    const assumed = monthlyElectricityCost({ label: 'x', watts: 100, hoursPerDay: 12 }, 0.3);
    const full = monthlyElectricityCost(
      { label: 'x', watts: 100, hoursPerDay: 12, dutyCycle: 1 },
      0.3
    );
    expect(assumed).toBeLessThan(full);
    expect(assumed).toBeCloseTo(full * 0.6, 1);
  });

  it('scales with wattage and hours', () => {
    const small = monthlyElectricityCost({ label: 'x', watts: 50, hoursPerDay: 12 }, 0.3);
    const big = monthlyElectricityCost({ label: 'x', watts: 100, hoursPerDay: 12 }, 0.3);
    expect(big).toBeCloseTo(small * 2, 2);
  });
});

describe('monthlyKwh', () => {
  it('reports energy without needing a tariff', () => {
    // 100W x 12h x 100% duty = 1.2 kWh/day x 30.44 days.
    expect(monthlyKwh({ label: 'Basking lamp', watts: 100, hoursPerDay: 12, dutyCycle: 1 })).toBeCloseTo(
      36.53,
      1
    );
  });

  it('stays in step with the cost it is derived from', () => {
    // The inventory form shows kWh while the breakdown shows money. If these
    // ever diverge, a keeper sees one number in the form and a contradictory
    // one on the cost screen.
    const device = { label: 'UVB', watts: 39, hoursPerDay: 10 };
    expect(monthlyElectricityCost(device, 0.27)).toBeCloseTo(monthlyKwh(device) * 0.27, 6);
  });
});

describe('buildCostBreakdown — separating one-off from recurring', () => {
  it('never adds a one-off purchase into the monthly figure', () => {
    // A £300 enclosure and £4 of crickets are not the same kind of number.
    const result = build({
      oneOff: [{ category: 'enclosure', amount: 300 }],
      recurring: [{ category: 'consumables', amount: 12, everyMonths: 3 }],
    });
    expect(result.oneOffTotal).toBe(300);
    expect(result.monthlyTotal).toBe(4);
  });

  it('amortises recurring equipment across its replacement interval', () => {
    // A $40 bulb replaced yearly is $3.33/month, not $40 in one month.
    const result = build({
      recurring: [{ category: 'equipment', amount: 40, everyMonths: 12 }],
    });
    expect(result.monthlyTotal).toBeCloseTo(3.33, 2);
  });

  it('ignores a zero or negative interval rather than dividing by it', () => {
    const result = build({
      recurring: [{ category: 'equipment', amount: 40, everyMonths: 0 }],
    });
    expect(result.monthlyTotal).toBe(0);
  });

  it('projects the year from the recurring figure only', () => {
    const result = build({
      oneOff: [{ category: 'acquisition', amount: 200 }],
      recurring: [{ category: 'consumables', amount: 10, everyMonths: 1 }],
    });
    expect(result.annualProjection).toBe(120);
  });
});

describe('buildCostBreakdown — categories', () => {
  it('ranks categories by monthly spend', () => {
    const result = build({
      recurring: [
        { category: 'consumables', amount: 5, everyMonths: 1 },
        { category: 'equipment', amount: 120, everyMonths: 12 },
        { category: 'veterinary', amount: 240, everyMonths: 12 },
      ],
    });
    expect(result.categories[0].category).toBe('veterinary');
    expect(result.largestCategory?.category).toBe('veterinary');
  });

  it('surfaces electricity as the largest cost when it is', () => {
    // Usually a surprise: heat runs continuously and arrives inside a
    // household bill, so keepers rarely attribute it to the animal.
    const result = build({
      recurring: [{ category: 'consumables', amount: 5, everyMonths: 1 }],
      devices: [
        { label: 'Basking lamp', watts: 100, hoursPerDay: 12 },
        { label: 'CHE', watts: 60, hoursPerDay: 24 },
      ],
      electricityRate: 0.3,
    });
    expect(result.largestCategory?.category).toBe('electricity');
  });

  it('gives each category a share of the recurring total', () => {
    const result = build({
      recurring: [
        { category: 'consumables', amount: 30, everyMonths: 1 },
        { category: 'feeders', amount: 10, everyMonths: 1 },
      ],
    });
    const shares = result.categories.map((c) => c.sharePercent);
    expect(shares).toEqual([75, 25]);
  });

  it('combines several items in the same category', () => {
    const result = build({
      recurring: [
        { category: 'equipment', amount: 40, everyMonths: 12 },
        { category: 'equipment', amount: 80, everyMonths: 12 },
      ],
    });
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].monthly).toBeCloseTo(10, 2);
  });
});

describe('buildCostBreakdown — feeders', () => {
  it('multiplies consumption by unit cost', () => {
    // Feeds straight from the colony engine's cost-per-feeder.
    const result = build({ feedersPerMonth: 200, costPerFeeder: 0.05 });
    expect(result.monthlyTotal).toBeCloseTo(10, 2);
  });

  it('needs both numbers before costing feeders', () => {
    expect(build({ feedersPerMonth: 200 }).monthlyTotal).toBe(0);
    expect(build({ costPerFeeder: 0.05 }).monthlyTotal).toBe(0);
  });
});

describe('buildCostBreakdown — per animal', () => {
  it('divides the recurring cost across the collection', () => {
    const result = build({
      recurring: [{ category: 'consumables', amount: 60, everyMonths: 1 }],
      animalCount: 4,
    });
    expect(result.perAnimalMonthly).toBe(15);
  });

  it('returns null rather than dividing by zero animals', () => {
    const result = build({ recurring: [{ category: 'consumables', amount: 60, everyMonths: 1 }] });
    expect(result.perAnimalMonthly).toBeNull();
  });
});

describe('buildCostBreakdown — honesty about gaps', () => {
  it('lists categories with nothing recorded instead of showing them as zero', () => {
    // "You have not recorded vet costs" and "you have spent nothing on vets"
    // are very different statements.
    const result = build({ recurring: [{ category: 'consumables', amount: 10, everyMonths: 1 }] });
    expect(result.missingCategories).toContain('veterinary');
    expect(result.missingCategories).toContain('electricity');
    expect(result.missingCategories).not.toContain('consumables');
  });

  it('counts a one-off as coverage for its category', () => {
    const result = build({ oneOff: [{ category: 'acquisition', amount: 200 }] });
    expect(result.missingCategories).not.toContain('acquisition');
  });

  it('flags a nearly empty record as insufficient', () => {
    expect(build({ oneOff: [{ category: 'acquisition', amount: 200 }] }).insufficientData).toBe(true);
  });

  it('clears the flag once two categories are recorded', () => {
    const result = build({
      oneOff: [{ category: 'acquisition', amount: 200 }],
      recurring: [{ category: 'consumables', amount: 10, everyMonths: 1 }],
    });
    expect(result.insufficientData).toBe(false);
  });

  it('returns a usable empty shape rather than throwing', () => {
    const result = build();
    expect(result.monthlyTotal).toBe(0);
    expect(result.categories).toHaveLength(0);
    expect(result.largestCategory).toBeNull();
    expect(result.insufficientData).toBe(true);
  });

  it('ignores negative and non-finite amounts', () => {
    const result = build({
      oneOff: [{ category: 'enclosure', amount: -50 }],
      recurring: [{ category: 'consumables', amount: Number.NaN, everyMonths: 1 }],
    });
    expect(result.oneOffTotal).toBe(0);
    expect(result.monthlyTotal).toBe(0);
  });
});
