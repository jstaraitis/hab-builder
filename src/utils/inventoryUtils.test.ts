import { describe, it, expect } from 'vitest';
import {
  EMPTY_INVENTORY_FORM,
  POWERED_CATEGORIES,
  parseInventoryCosts,
  type InventoryFormState,
} from './inventoryUtils';

function form(overrides: Partial<InventoryFormState> = {}): InventoryFormState {
  return { ...EMPTY_INVENTORY_FORM, ...overrides };
}

describe('parseInventoryCosts — blank versus zero', () => {
  it('treats an untouched form as nothing recorded, not as zero spend', () => {
    // The cost screen reports unrecorded categories separately from cheap
    // ones. Coercing '' to 0 here would make every keeper look like they
    // spend nothing on consumables.
    const result = parseInventoryCosts(form());

    expect(result.error).toBeNull();
    expect(result.values).toEqual({
      unitCost: null,
      watts: null,
      hoursPerDay: null,
      dutyCycle: null,
    });
  });

  it('keeps a genuine zero cost, which is not the same as leaving it blank', () => {
    const result = parseInventoryCosts(form({ unitCost: '0' }));

    expect(result.error).toBeNull();
    expect(result.values.unitCost).toBe(0);
  });

  it('ignores surrounding whitespace rather than reading it as a number', () => {
    const result = parseInventoryCosts(form({ unitCost: '  ' }));

    expect(result.error).toBeNull();
    expect(result.values.unitCost).toBeNull();
  });
});

describe('parseInventoryCosts — duty cycle', () => {
  it('converts a percentage to the fraction the database stores', () => {
    const result = parseInventoryCosts(form({ dutyCyclePercent: '45' }));

    expect(result.error).toBeNull();
    expect(result.values.dutyCycle).toBeCloseTo(0.45, 6);
  });

  it('rejects zero, which the database constraint refuses outright', () => {
    // duty_cycle > 0 in inventory_power_sane. Letting it through would fail at
    // the database with a message no keeper can act on.
    expect(parseInventoryCosts(form({ dutyCyclePercent: '0' })).error).toBeTruthy();
  });

  it('rejects more than 100 percent', () => {
    expect(parseInventoryCosts(form({ dutyCyclePercent: '120' })).error).toBeTruthy();
  });
});

describe('parseInventoryCosts — bounds mirroring the database constraint', () => {
  it('rejects a wattage above the constraint ceiling', () => {
    expect(parseInventoryCosts(form({ watts: '6000' })).error).toBeTruthy();
  });

  it('accepts a wattage at the ceiling', () => {
    expect(parseInventoryCosts(form({ watts: '5000' })).error).toBeNull();
  });

  it('rejects more than 24 hours in a day', () => {
    expect(parseInventoryCosts(form({ hoursPerDay: '25' })).error).toBeTruthy();
  });

  it('rejects a negative cost', () => {
    expect(parseInventoryCosts(form({ unitCost: '-5' })).error).toBeTruthy();
  });

  it('rejects text that is not a number', () => {
    expect(parseInventoryCosts(form({ watts: 'sixty' })).error).toBeTruthy();
  });

  it('reports nothing recorded when it rejects, so a caller cannot save half of it', () => {
    const result = parseInventoryCosts(form({ unitCost: '12', watts: 'sixty' }));

    expect(result.error).toBeTruthy();
    expect(result.values.unitCost).toBeNull();
  });
});

describe('POWERED_CATEGORIES', () => {
  it('covers the categories that plug into the wall', () => {
    for (const category of ['bulb', 'uvb', 'lighting', 'heater'] as const) {
      expect(POWERED_CATEGORIES.has(category)).toBe(true);
    }
  });

  it('leaves out the ones that do not, so the form stays short', () => {
    for (const category of ['supplement', 'substrate', 'food', 'cleaning'] as const) {
      expect(POWERED_CATEGORIES.has(category)).toBe(false);
    }
  });
});
