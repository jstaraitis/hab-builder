import { describe, it, expect } from 'vitest';
import { buildChangeTimeline, type ChangeTimelineInput, type EnvironmentSeries } from './changeTimeline';

const INCIDENT = new Date(2026, 5, 1, 12, 0, 0);

function daysAgo(days: number): Date {
  return new Date(INCIDENT.getTime() - days * 24 * 60 * 60 * 1000);
}

function build(overrides: Partial<ChangeTimelineInput> = {}) {
  return buildChangeTimeline({
    incidentKind: 'feeding-refusal',
    incidentDate: INCIDENT,
    ...overrides,
  });
}

function titles(result: ReturnType<typeof build>): string[] {
  return result.changes.map((c) => c.title);
}

/** Evenly spaced readings, oldest first. */
function series(
  count: number,
  valueAt: (index: number) => Partial<EnvironmentSeries>
): EnvironmentSeries[] {
  return Array.from({ length: count }, (_, i) => ({
    date: daysAgo(59 - i * (59 / (count - 1))),
    ...valueAt(i),
  }));
}

describe('buildChangeTimeline — windowing', () => {
  it('defaults to a 60-day window', () => {
    const result = build();
    expect(result.windowDays).toBe(60);
    expect(result.windowStart.getTime()).toBe(daysAgo(60).getTime());
  });

  it('honours a custom window', () => {
    expect(build({ windowDays: 14 }).windowDays).toBe(14);
  });

  it('excludes events older than the window', () => {
    const result = build({
      enclosureEvents: [
        { id: 'old', date: daysAgo(90), eventType: 'substrate_full_change' },
        { id: 'new', date: daysAgo(10), eventType: 'substrate_full_change' },
      ],
    });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].id).toBe('event-new');
  });

  it('excludes events after the incident', () => {
    const result = build({
      enclosureEvents: [
        { id: 'after', date: new Date(INCIDENT.getTime() + 86400000), eventType: 'plant_added' },
      ],
    });
    expect(result.changes).toHaveLength(0);
  });

  it('reports days before the incident, never negative', () => {
    const result = build({
      enclosureEvents: [{ id: 'e', date: daysAgo(12), eventType: 'uvb_bulb_replaced' }],
    });
    expect(result.changes[0].daysBefore).toBe(12);
  });
});

describe('buildChangeTimeline — enclosure events', () => {
  it('labels known event types readably', () => {
    const result = build({
      enclosureEvents: [
        { id: 'a', date: daysAgo(5), eventType: 'uvb_bulb_replaced' },
        { id: 'b', date: daysAgo(9), eventType: 'substrate_full_change' },
        { id: 'c', date: daysAgo(20), eventType: 'equipment_probe_moved' },
      ],
    });
    expect(titles(result)).toEqual([
      'UVB bulb replaced',
      'Substrate fully changed',
      'Thermostat probe moved',
    ]);
  });

  it('falls back to a readable form for an unknown event type', () => {
    const result = build({
      enclosureEvents: [{ id: 'x', date: daysAgo(3), eventType: 'weird_new_thing' }],
    });
    expect(result.changes[0].title).toBe('weird new thing');
  });

  it('carries keeper notes through as detail', () => {
    const result = build({
      enclosureEvents: [
        { id: 'a', date: daysAgo(4), eventType: 'substrate_full_change', notes: 'Switched brands' },
      ],
    });
    expect(result.changes[0].detail).toBe('Switched brands');
  });

  it('categorises a probe move as environment, not enclosure', () => {
    const result = build({
      enclosureEvents: [{ id: 'a', date: daysAgo(4), eventType: 'equipment_probe_moved' }],
    });
    expect(result.changes[0].category).toBe('environment');
  });
});

describe('buildChangeTimeline — diet changes', () => {
  it('flags a feeder appearing for the first time inside the window', () => {
    const result = build({
      feedings: [
        { date: daysAgo(70), feederType: 'Crickets' },
        { date: daysAgo(40), feederType: 'Crickets' },
        { date: daysAgo(10), feederType: 'Waxworms' },
      ],
    });
    expect(titles(result)).toContain('New feeder introduced: Waxworms');
  });

  it('does not flag a feeder that was already established before the window', () => {
    // Crickets predate the window, so their appearance inside it is not a change.
    const result = build({
      feedings: [
        { date: daysAgo(80), feederType: 'Crickets' },
        { date: daysAgo(10), feederType: 'Crickets' },
      ],
    });
    expect(result.changes).toHaveLength(0);
  });

  it('flags a supplement change', () => {
    const result = build({
      feedings: [
        { date: daysAgo(70), supplementUsed: 'Calcium (no D3)' },
        { date: daysAgo(15), supplementUsed: 'Calcium + D3' },
      ],
    });
    expect(titles(result)).toContain('Supplement changed to Calcium + D3');
  });

  it('treats "None" as no supplement rather than a change', () => {
    const result = build({
      feedings: [
        { date: daysAgo(70), supplementUsed: 'Calcium + D3' },
        { date: daysAgo(15), supplementUsed: 'None' },
      ],
    });
    expect(result.changes).toHaveLength(0);
  });

  it('reports a feeder only once, on its first appearance', () => {
    const result = build({
      feedings: [
        { date: daysAgo(20), feederType: 'Hornworms' },
        { date: daysAgo(12), feederType: 'Hornworms' },
        { date: daysAgo(4), feederType: 'Hornworms' },
      ],
    });
    expect(result.changes.filter((c) => c.title.includes('Hornworms'))).toHaveLength(1);
  });
});

describe('buildChangeTimeline — environment drift', () => {
  it('detects a sustained humidity fall', () => {
    // 70% across the early half, 50% across the late half.
    const readings = series(12, (i) => ({ humidityPercent: i < 6 ? 70 : 50 }));
    const result = build({ environment: readings });

    expect(result.drift).toHaveLength(1);
    expect(result.drift[0].metric).toBe('humidity');
    expect(result.drift[0].delta).toBeCloseTo(-20, 0);
    expect(titles(result)[0]).toContain('Humidity fell 20%');
  });

  it('detects a sustained temperature rise', () => {
    const readings = series(12, (i) => ({ tempF: i < 6 ? 78 : 88 }));
    const result = build({ environment: readings });
    expect(result.drift[0].metric).toBe('temperature');
    expect(result.drift[0].delta).toBeCloseTo(10, 0);
  });

  it('ignores a shift below the noise threshold', () => {
    const readings = series(12, (i) => ({ tempF: i < 6 ? 80 : 82 }));
    expect(build({ environment: readings }).drift).toHaveLength(0);
  });

  it('ignores a single spike rather than calling it drift', () => {
    const readings = series(12, (i) => ({ humidityPercent: i === 11 ? 20 : 70 }));
    expect(build({ environment: readings }).drift).toHaveLength(0);
  });

  it('needs readings on both sides of the window before reporting drift', () => {
    // All readings sit in the recent half; there is no baseline to compare to.
    const readings: EnvironmentSeries[] = [
      { date: daysAgo(5), humidityPercent: 40 },
      { date: daysAgo(4), humidityPercent: 40 },
      { date: daysAgo(3), humidityPercent: 40 },
      { date: daysAgo(2), humidityPercent: 40 },
    ];
    expect(build({ environment: readings }).drift).toHaveLength(0);
  });

  it('reports both metrics when both drift', () => {
    const readings = series(12, (i) => ({
      tempF: i < 6 ? 78 : 88,
      humidityPercent: i < 6 ? 70 : 50,
    }));
    expect(build({ environment: readings }).drift).toHaveLength(2);
  });
});

describe('buildChangeTimeline — health', () => {
  it('includes vet visits inside the window', () => {
    const result = build({
      vetVisits: [{ date: daysAgo(21), visitType: 'illness', diagnosis: 'Mild RI' }],
    });
    expect(titles(result)).toContain('Vet visit: illness');
    expect(result.changes[0].detail).toBe('Mild RI');
  });

  it('always ranks a brumation start as high, whatever the symptom', () => {
    // Brumation independently explains refusal and weight change, so it must
    // never be buried under lower-ranked husbandry noise.
    const result = build({
      incidentKind: 'stuck-shed',
      brumationStarts: [daysAgo(30)],
    });
    const brumation = result.changes.find((c) => c.title === 'Brumation started');
    expect(brumation?.relevance).toBe('high');
  });
});

describe('buildChangeTimeline — ranking and honesty', () => {
  it('ranks diet high for a refusal but low for a stuck shed', () => {
    const feedings = [
      { date: daysAgo(70), feederType: 'Crickets' },
      { date: daysAgo(10), feederType: 'Waxworms' },
    ];
    const refusal = build({ incidentKind: 'feeding-refusal', feedings });
    const shed = build({ incidentKind: 'stuck-shed', feedings });

    expect(refusal.changes[0].relevance).toBe('high');
    expect(shed.changes[0].relevance).toBe('low');
  });

  it('surfaces low-relevance changes rather than hiding them', () => {
    // Filtering these out would be the causal claim the engine refuses to make.
    const result = build({
      incidentKind: 'weight-loss',
      enclosureEvents: [{ id: 'a', date: daysAgo(5), eventType: 'plant_pruned' }],
    });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].relevance).toBe('low');
  });

  it('orders changes most recent first', () => {
    const result = build({
      enclosureEvents: [
        { id: 'old', date: daysAgo(40), eventType: 'plant_added' },
        { id: 'mid', date: daysAgo(20), eventType: 'cleanup_crew_added' },
        { id: 'new', date: daysAgo(2), eventType: 'substrate_top_off' },
      ],
    });
    expect(result.changes.map((c) => c.id)).toEqual(['event-new', 'event-mid', 'event-old']);
  });

  it('distinguishes "nothing changed" from "nothing was logged"', () => {
    const result = build();
    expect(result.nothingRecorded).toBe(true);
    expect(result.emptyStreams).toContain('enclosure events');
    expect(result.emptyStreams).toContain('feeding');
    expect(result.emptyStreams).toContain('temperature and humidity');
  });

  it('does not list a stream as empty when it has data', () => {
    const result = build({
      feedings: [{ date: daysAgo(10), feederType: 'Crickets' }],
    });
    expect(result.emptyStreams).not.toContain('feeding');
  });

  it('never emits a verdict field — the engine ranks, it does not conclude', () => {
    const result = build({
      enclosureEvents: [{ id: 'a', date: daysAgo(3), eventType: 'uvb_bulb_replaced' }],
    });
    expect(result).not.toHaveProperty('likelyCause');
    expect(result).not.toHaveProperty('verdict');
  });

  it('assembles a full picture from every stream at once', () => {
    const result = build({
      incidentKind: 'feeding-refusal',
      enclosureEvents: [{ id: 'a', date: daysAgo(8), eventType: 'substrate_full_change' }],
      feedings: [
        { date: daysAgo(70), feederType: 'Crickets' },
        { date: daysAgo(15), feederType: 'Waxworms' },
      ],
      environment: series(12, (i) => ({ humidityPercent: i < 6 ? 70 : 50 })),
      vetVisits: [{ date: daysAgo(30), visitType: 'checkup' }],
    });

    expect(result.nothingRecorded).toBe(false);
    expect(result.changes.length).toBe(4);
    expect(result.emptyStreams).toHaveLength(0);
  });
});
