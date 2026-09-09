/**
 * Dashboard triage
 *
 * The dashboard already runs the threshold engine for every animal on every
 * load, then reduces each result to a border colour on a thumbnail. This
 * aggregates those per-animal results into the two things the keeper actually
 * opens the app to learn: does anything need me, and what exactly.
 *
 * Pure data-in/data-out so the ranking is testable without a DOM.
 */

import type { AlertSeverity, ThresholdAlert } from '../types/thresholds';

export type VerdictLevel = 'clear' | 'watch' | 'attention' | 'urgent';

export interface AttentionItem {
  /** Stable across renders: subject + alert id. */
  id: string;
  subjectId: string;
  subjectKind: 'animal' | 'enclosure';
  subjectName: string;
  severity: AlertSeverity;
  /** Short category chip — "Weight", "UVB", "Feeding". */
  category: string;
  headline: string;
  detail: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface DashboardVerdict {
  level: VerdictLevel;
  /** How many subjects (not alerts) need attention. */
  count: number;
  headline: string;
  subline: string;
}

export interface TriageResult {
  verdict: DashboardVerdict;
  items: AttentionItem[];
  steadyCount: number;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  urgent: 3,
  warning: 2,
  info: 1,
};

/**
 * Alert ids are stable engine identifiers, so mapping them to a short chip is
 * safer than parsing the human-facing title.
 */
function categoryFor(alertId: string): string {
  if (alertId.startsWith('weight')) return 'Weight';
  if (alertId.startsWith('feeding')) return 'Feeding';
  if (alertId.startsWith('humidity')) return 'Humidity';
  if (alertId.startsWith('temperature')) return 'Temperature';
  if (alertId.startsWith('uvb')) return 'UVB';
  if (alertId.startsWith('brumation')) return 'Brumation';
  return 'Care';
}

/** UVB is a property of the enclosure, not the animal living in it. */
function subjectKindFor(alertId: string): 'animal' | 'enclosure' {
  return alertId.startsWith('uvb') ? 'enclosure' : 'animal';
}

export interface TriageInput {
  animals: Array<{ id: string; name?: string; enclosureId?: string }>;
  alertsByAnimalId: Record<string, ThresholdAlert[]>;
  /** Display name per enclosure, for alerts that belong to the habitat. */
  enclosureNameById?: Record<string, string>;
}

export function buildDashboardTriage({
  animals,
  alertsByAnimalId,
  enclosureNameById = {},
}: TriageInput): TriageResult {
  const items: AttentionItem[] = [];
  const subjectsNeedingAttention = new Set<string>();

  // Enclosure-level alerts are duplicated across every animal sharing the
  // enclosure. Collapse them so a 5-frog tank reports one bulb, not five.
  const seenEnclosureAlerts = new Set<string>();

  for (const animal of animals) {
    const alerts = alertsByAnimalId[animal.id] ?? [];
    const animalName = animal.name?.trim() || 'Unnamed animal';

    for (const alert of alerts) {
      const kind = subjectKindFor(alert.id);

      if (kind === 'enclosure') {
        const enclosureId = animal.enclosureId;
        if (!enclosureId) continue;

        const dedupeKey = `${enclosureId}:${alert.id}`;
        if (seenEnclosureAlerts.has(dedupeKey)) continue;
        seenEnclosureAlerts.add(dedupeKey);

        const enclosureName = enclosureNameById[enclosureId]?.trim() || 'Enclosure';
        subjectsNeedingAttention.add(enclosureId);
        items.push({
          id: dedupeKey,
          subjectId: enclosureId,
          subjectKind: 'enclosure',
          subjectName: enclosureName,
          severity: alert.severity,
          category: categoryFor(alert.id),
          headline: alert.title,
          detail: alert.body,
          actionLabel: alert.actionLabel,
          actionPath: alert.actionPath,
        });
        continue;
      }

      subjectsNeedingAttention.add(animal.id);
      items.push({
        id: `${animal.id}:${alert.id}`,
        subjectId: animal.id,
        subjectKind: 'animal',
        subjectName: animalName,
        severity: alert.severity,
        category: categoryFor(alert.id),
        headline: alert.title,
        detail: alert.body,
        actionLabel: alert.actionLabel,
        actionPath: alert.actionPath,
      });
    }
  }

  // Most severe first; ties keep the order animals were listed in so the
  // screen doesn't reshuffle between renders.
  items.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const animalsNeedingAttention = new Set(
    items.filter((i) => i.subjectKind === 'animal').map((i) => i.subjectId)
  );
  const steadyCount = Math.max(0, animals.length - animalsNeedingAttention.size);

  return {
    verdict: buildVerdict(items, subjectsNeedingAttention.size, steadyCount, animals.length),
    items,
    steadyCount,
  };
}

/** "today" / "yesterday" / "3 days ago" / "5 weeks ago" */
function relativeDays(date: Date, now: Date): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 21) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;
}

export interface AnimalSummaryInput {
  latestFeedingAt?: Date | null;
  latestWeightGrams?: number | null;
  latestWeightAt?: Date | null;
  now?: Date;
}

/**
 * The one line shown under an animal in the status grid when it has no alert
 * worth showing instead. Real facts only — a generic "check recent activity"
 * repeated across six cards tells the keeper nothing and makes a healthy
 * collection look uniformly suspect.
 */
export function buildAnimalSummary({
  latestFeedingAt,
  latestWeightGrams,
  latestWeightAt,
  now = new Date(),
}: AnimalSummaryInput): string {
  const parts: string[] = [];

  if (latestFeedingAt) {
    parts.push(`Fed ${relativeDays(latestFeedingAt, now)}`);
  }

  if (typeof latestWeightGrams === 'number' && Number.isFinite(latestWeightGrams)) {
    parts.push(formatGrams(latestWeightGrams));
  } else if (latestWeightAt) {
    parts.push(`weighed ${relativeDays(latestWeightAt, now)}`);
  }

  if (parts.length > 0) return parts.join(' · ');

  return 'Nothing logged yet';
}

function buildVerdict(
  items: AttentionItem[],
  subjectCount: number,
  steadyCount: number,
  totalAnimals: number
): DashboardVerdict {
  // Wording tracks the status ladder in AnimalStatusGrid — "on track", not
  // "steady" or "healthy". It describes the care routine, which is what's
  // measured, and stays warm without claiming anything about the animal.
  if (items.length === 0) {
    return {
      level: 'clear',
      count: 0,
      headline:
        totalAnimals === 1 ? "Everything's on track" : `All ${totalAnimals} are on track`,
      subline: 'Nothing needs you right now.',
    };
  }

  const topSeverity = items[0].severity;
  const level: VerdictLevel =
    topSeverity === 'urgent' ? 'urgent' : topSeverity === 'warning' ? 'attention' : 'watch';

  const headline =
    subjectCount === 1
      ? `${items[0].subjectName} needs a look`
      : `${subjectCount} things need you`;

  let subline: string;
  if (steadyCount > 0) {
    subline =
      steadyCount === 1
        ? 'The other one is on track.'
        : `The other ${steadyCount} are on track.`;
  } else {
    subline =
      items.length === 1
        ? 'One thing to take care of.'
        : `${items.length} things to take care of.`;
  }

  return { level, count: subjectCount, headline, subline };
}
