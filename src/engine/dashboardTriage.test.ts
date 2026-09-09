import { describe, it, expect } from 'vitest';
import { buildDashboardTriage, buildAnimalSummary } from './dashboardTriage';
import type { ThresholdAlert } from '../types/thresholds';

function alert(id: string, severity: ThresholdAlert['severity'] = 'warning'): ThresholdAlert {
  return { id, severity, title: `${id} title`, body: `${id} body` };
}

const animals = [
  { id: 'a1', name: 'Kiwi', enclosureId: 'e1' },
  { id: 'a2', name: 'Peach', enclosureId: 'e1' },
  { id: 'a3', name: 'Fig', enclosureId: 'e2' },
];

const enclosureNameById = { e1: 'Frogs', e2: 'Gecko Tank' };

describe('buildDashboardTriage — clear state', () => {
  it('reports everything steady when no animal has alerts', () => {
    const result = buildDashboardTriage({ animals, alertsByAnimalId: {} });
    expect(result.verdict.level).toBe('clear');
    expect(result.verdict.headline).toBe('All 3 are on track');
    expect(result.items).toHaveLength(0);
    expect(result.steadyCount).toBe(3);
  });

  it('uses singular phrasing for a one-animal keeper', () => {
    const result = buildDashboardTriage({
      animals: [{ id: 'a1', name: 'Kiwi' }],
      alertsByAnimalId: {},
    });
    expect(result.verdict.headline).toBe("Everything's on track");
  });
});

describe('buildDashboardTriage — ranking', () => {
  it('puts the most severe item first regardless of animal order', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: {
        a1: [alert('humidity-low', 'info')],
        a2: [alert('feeding-refusal-streak', 'urgent')],
        a3: [alert('weight-drop', 'warning')],
      },
    });
    expect(result.items[0].subjectName).toBe('Peach');
    expect(result.items[0].severity).toBe('urgent');
    expect(result.items[2].severity).toBe('info');
  });

  it('escalates the verdict to match the worst item', () => {
    const urgent = buildDashboardTriage({
      animals,
      alertsByAnimalId: { a1: [alert('weight-drop', 'urgent')] },
    });
    expect(urgent.verdict.level).toBe('urgent');

    const watch = buildDashboardTriage({
      animals,
      alertsByAnimalId: { a1: [alert('weight-drop', 'info')] },
    });
    expect(watch.verdict.level).toBe('watch');
  });
});

describe('buildDashboardTriage — enclosure alerts', () => {
  it('collapses an enclosure alert shared by several animals into one item', () => {
    // Both Kiwi and Peach live in e1, so the same bulb surfaces on both.
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: {
        a1: [alert('uvb-bulb-age')],
        a2: [alert('uvb-bulb-age')],
      },
      enclosureNameById,
    });

    const uvbItems = result.items.filter((i) => i.category === 'UVB');
    expect(uvbItems).toHaveLength(1);
    expect(uvbItems[0].subjectKind).toBe('enclosure');
    expect(uvbItems[0].subjectName).toBe('Frogs');
  });

  it('keeps separate enclosures separate', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: {
        a1: [alert('uvb-bulb-age')],
        a3: [alert('uvb-bulb-age')],
      },
      enclosureNameById,
    });
    expect(result.items.filter((i) => i.category === 'UVB')).toHaveLength(2);
  });

  it('does not count an enclosure alert against the animals steady count', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: { a1: [alert('uvb-bulb-age')], a2: [alert('uvb-bulb-age')] },
      enclosureNameById,
    });
    // No animal has a problem — only the habitat does.
    expect(result.steadyCount).toBe(3);
  });

  it('drops an enclosure alert from an animal with no enclosure', () => {
    const result = buildDashboardTriage({
      animals: [{ id: 'a1', name: 'Kiwi' }],
      alertsByAnimalId: { a1: [alert('uvb-bulb-age')] },
    });
    expect(result.items).toHaveLength(0);
  });
});

describe('buildDashboardTriage — categories', () => {
  it('maps alert ids to short chips', () => {
    const result = buildDashboardTriage({
      animals: [{ id: 'a1', name: 'Kiwi', enclosureId: 'e1' }],
      alertsByAnimalId: {
        a1: [
          alert('weight-drop'),
          alert('feeding-overdue'),
          alert('humidity-high'),
          alert('temperature-out-of-range'),
          alert('brumation-weight-concern'),
          alert('something-unmapped'),
        ],
      },
      enclosureNameById,
    });
    const categories = result.items.map((i) => i.category);
    expect(categories).toContain('Weight');
    expect(categories).toContain('Feeding');
    expect(categories).toContain('Humidity');
    expect(categories).toContain('Temperature');
    expect(categories).toContain('Brumation');
    expect(categories).toContain('Care');
  });
});

describe('buildDashboardTriage — verdict copy', () => {
  it('names the single subject when only one needs attention', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: { a1: [alert('weight-drop')] },
    });
    expect(result.verdict.headline).toBe('Kiwi needs a look');
    expect(result.verdict.subline).toBe('The other 2 are on track.');
  });

  it('counts subjects, not alerts, in the headline', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: {
        // Three alerts, but only two animals.
        a1: [alert('weight-drop'), alert('feeding-overdue')],
        a2: [alert('humidity-low')],
      },
    });
    expect(result.verdict.headline).toBe('2 things need you');
    expect(result.items).toHaveLength(3);
  });

  it('falls back to a name for an unnamed animal', () => {
    const result = buildDashboardTriage({
      animals: [{ id: 'a1' }],
      alertsByAnimalId: { a1: [alert('weight-drop')] },
    });
    expect(result.items[0].subjectName).toBe('Unnamed animal');
  });

  it('gives an item a stable id built from subject and alert', () => {
    const result = buildDashboardTriage({
      animals,
      alertsByAnimalId: { a1: [alert('weight-drop')] },
    });
    expect(result.items[0].id).toBe('a1:weight-drop');
  });
});

// ─── buildAnimalSummary ──────────────────────────────────────────────────────

describe('buildAnimalSummary', () => {
  const NOW = new Date('2026-09-09T12:00:00Z');
  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

  it('combines last feeding and current weight', () => {
    expect(
      buildAnimalSummary({ latestFeedingAt: daysAgo(2), latestWeightGrams: 61, now: NOW })
    ).toBe('Fed 2 days ago · 61 g');
  });

  it('uses natural language for today and yesterday', () => {
    expect(buildAnimalSummary({ latestFeedingAt: daysAgo(0), now: NOW })).toBe('Fed today');
    expect(buildAnimalSummary({ latestFeedingAt: daysAgo(1), now: NOW })).toBe('Fed yesterday');
  });

  it('rolls up to weeks and months rather than large day counts', () => {
    expect(buildAnimalSummary({ latestFeedingAt: daysAgo(28), now: NOW })).toBe('Fed 4 weeks ago');
    expect(buildAnimalSummary({ latestFeedingAt: daysAgo(90), now: NOW })).toBe('Fed 3 months ago');
  });

  it('falls back to the weigh-in date when no weight value is available', () => {
    expect(
      buildAnimalSummary({ latestFeedingAt: daysAgo(1), latestWeightAt: daysAgo(6), now: NOW })
    ).toBe('Fed yesterday · weighed 6 days ago');
  });

  it('shows weight alone when nothing has been fed', () => {
    expect(buildAnimalSummary({ latestWeightGrams: 61, now: NOW })).toBe('61 g');
  });

  it('switches to kilograms for large animals', () => {
    expect(buildAnimalSummary({ latestWeightGrams: 2400, now: NOW })).toBe('2.40 kg');
  });

  it('says so plainly when there is genuinely no data', () => {
    expect(buildAnimalSummary({ now: NOW })).toBe('Nothing logged yet');
    expect(buildAnimalSummary({ latestFeedingAt: null, latestWeightGrams: null, now: NOW }))
      .toBe('Nothing logged yet');
  });

  it('ignores a non-finite weight rather than rendering NaN', () => {
    expect(buildAnimalSummary({ latestWeightGrams: Number.NaN, now: NOW })).toBe('Nothing logged yet');
  });
});
