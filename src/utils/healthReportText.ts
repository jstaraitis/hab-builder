/**
 * Plain-text rendering of a health report.
 *
 * Printing is the nice path, but it only really works on desktop. On a phone
 * in a clinic car park the thing that actually works is text on a clipboard,
 * pasted into an email or a message to the vet. So the text version is not a
 * degraded fallback — for most keepers it is the primary delivery format, and
 * it carries the same content in the same order as the printed page.
 *
 * Deliberately plain: no markdown, no box drawing. It has to survive being
 * pasted into an email client, an SMS, and a practice management system that
 * was written in 2004.
 */

import type { HealthReportBundle } from '../services/healthReportService';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'not recorded';
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return 'not recorded';
  return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
}

function heading(text: string): string {
  return `\n${text.toUpperCase()}\n${'-'.repeat(text.length)}`;
}

export function reportToPlainText(bundle: HealthReportBundle): string {
  const { report, animal, enclosure, environment } = bundle;
  const lines: string[] = [];

  lines.push(`HEALTH SUMMARY — ${report.animalLabel}`);
  lines.push(
    [animal.speciesName ?? enclosure?.animalName, report.ageDescription].filter(Boolean).join(' · ') ||
      'Species not recorded'
  );
  lines.push(`Prepared ${formatDate(report.generatedAt)} using Habitat Builder`);

  lines.push(heading('Animal'));
  lines.push(`Sex: ${animal.gender ? titleCase(animal.gender) : 'not recorded'}`);
  lines.push(`Morph: ${animal.morph || 'not recorded'}`);
  lines.push(`Hatch/birth: ${formatDate(animal.birthday)}`);
  lines.push(`Acquired: ${formatDate(animal.acquisitionDate)}`);

  if (bundle.failedStreams.length > 0) {
    lines.push(heading('Incomplete report'));
    lines.push(
      `These records could not be loaded and are missing below rather than empty: ${bundle.failedStreams.join(', ')}.`
    );
  }

  lines.push(heading('Points to raise'));
  if (report.concerns.length === 0) {
    lines.push('Nothing in the recorded history stood out.');
    if (report.insufficientData) {
      lines.push('Note: very little has been logged — see "Not recorded" below.');
    }
  } else {
    for (const concern of report.concerns) {
      lines.push(`[${concern.severity.toUpperCase()}] ${concern.title}`);
      lines.push(`  ${concern.detail}`);
      for (const evidence of concern.evidence) {
        lines.push(`  - ${evidence}`);
      }
      lines.push('');
    }
  }

  lines.push(heading('Current husbandry'));
  lines.push(`Enclosure: ${enclosure?.name || 'not recorded'}`);
  lines.push(
    `Dimensions: ${
      enclosure?.widthInches && enclosure?.depthInches && enclosure?.heightInches
        ? `${enclosure.widthInches}W x ${enclosure.depthInches}D x ${enclosure.heightInches}H inches`
        : 'not recorded'
    }`
  );
  lines.push(`Substrate: ${enclosure?.substrateType ? titleCase(enclosure.substrateType) : 'not recorded'}`);
  lines.push(
    `Temp targets: day ${enclosure?.baselineDayTempTarget ?? '—'}F, night ${
      enclosure?.baselineNightTempTarget ?? '—'
    }F`
  );
  lines.push(
    `Humidity target: ${
      enclosure?.baselineHumidityMinTarget !== undefined && enclosure?.baselineHumidityMaxTarget !== undefined
        ? `${enclosure.baselineHumidityMinTarget}-${enclosure.baselineHumidityMaxTarget}%`
        : 'not recorded'
    }`
  );

  // Measured readings are kept visibly separate from targets. Conflating the
  // two would let an aspiration read as a measurement.
  if (environment) {
    lines.push(
      `Measured (${formatDate(environment.recordedAt)}): basking ${
        environment.baskingTempF !== undefined ? `${Math.round(environment.baskingTempF)}F` : '—'
      }, cool ${environment.coolTempF !== undefined ? `${Math.round(environment.coolTempF)}F` : '—'}, humidity ${
        environment.humidityPercent !== undefined ? `${Math.round(environment.humidityPercent)}%` : '—'
      }`
    );
  } else {
    lines.push('Measured readings: none on record (figures above are targets, not measurements)');
  }

  lines.push(
    `UVB: ${enclosure?.uvbBulbType ? titleCase(enclosure.uvbBulbType) : 'not recorded'}, installed ${formatDate(
      enclosure?.uvbBulbInstalledOn
    )}`
  );

  lines.push(heading('Weight'));
  if (report.weight) {
    lines.push(`Current: ${formatGrams(report.weight.currentGrams)} on ${formatDate(report.weight.currentDate)}`);
    lines.push(
      `Change vs 90-day peak: ${
        report.weight.change90dPercent === null ? 'not comparable' : `${report.weight.change90dPercent}%`
      }`
    );
    lines.push(`Trend: ${titleCase(report.weight.trend)}`);
    lines.push(`${report.weight.entries} weigh-ins since ${formatDate(report.weight.firstDate)}`);
  } else {
    lines.push('No weight has ever been recorded.');
  }

  lines.push(heading('Feeding'));
  if (report.feeding) {
    lines.push(
      `Last accepted meal: ${formatDate(report.feeding.lastFedDate)}${
        report.feeding.daysSinceLastFed !== null ? ` (${report.feeding.daysSinceLastFed} days ago)` : ''
      }`
    );
    lines.push(
      `Usual interval: ${
        report.feeding.averageDaysBetweenMeals === null ? 'unknown' : `~${report.feeding.averageDaysBetweenMeals} days`
      }`
    );
    lines.push(`Consecutive refusals: ${report.feeding.consecutiveRefusals}`);
    lines.push(
      `Last 90 days: ${report.feeding.acceptedIn90Days} accepted, ${report.feeding.refusalsIn90Days} refused`
    );
    if (bundle.feedingIsGroupLevel) {
      lines.push(
        `Note: this enclosure houses ${bundle.enclosureAnimalCount} animals and some feedings were logged against the enclosure rather than a specific animal. Those entries describe the group.`
      );
    }
  } else {
    lines.push('No feeding history recorded.');
  }

  lines.push(heading('Diet and supplementation'));
  const nutrition = bundle.nutrition;
  if (nutrition.insufficientData) {
    lines.push(
      nutrition.totalFeedings === 0
        ? `No feedings logged in the last ${nutrition.windowDays} days.`
        : `Only ${nutrition.totalFeedings} feedings logged in the last ${nutrition.windowDays} days — too few to analyse.`
    );
  } else {
    lines.push(`${nutrition.totalFeedings} feedings in the last ${nutrition.windowDays} days`);
    lines.push(
      `Supplemented: ${nutrition.supplementationRatePercent ?? '—'}% of feedings (with D3: ${
        nutrition.d3RatePercent ?? '—'
      }%)`
    );
    lines.push(`Feeder variety: ${nutrition.distinctFeeders} distinct feeders`);
    for (const feeder of nutrition.feeders) {
      lines.push(
        `  ${feeder.name} — ${feeder.sharePercent}% of diet, ${
          feeder.acceptanceRatePercent === null ? 'outcome not recorded' : `${feeder.acceptanceRatePercent}% eaten`
        }`
      );
    }
    if (nutrition.findings.length > 0) {
      lines.push('');
      for (const finding of nutrition.findings) {
        lines.push(`[${finding.severity.toUpperCase()}] ${finding.title}`);
        lines.push(`  ${finding.detail}`);
      }
    }
    if (nutrition.dietProfile === 'vertebrate') {
      lines.push('Note: whole-prey diet — dusting and feeder-variety guidance does not apply.');
    }
  }

  lines.push(heading('Shedding'));
  if (report.shed) {
    lines.push(
      `Last shed: ${formatDate(report.shed.lastShedDate)}${
        report.shed.daysSinceLastShed !== null ? ` (${report.shed.daysSinceLastShed} days ago)` : ''
      }`
    );
    lines.push(
      `Usual interval: ${
        report.shed.averageDaysBetweenSheds === null ? 'unknown' : `~${report.shed.averageDaysBetweenSheds} days`
      }`
    );
    lines.push(`Incomplete or stuck sheds in 180 days: ${report.shed.problemShedsIn180Days}`);
  } else {
    lines.push('No shed records.');
  }

  lines.push(heading('Defecation'));
  if (report.defecation) {
    lines.push(
      `Most recent: ${formatDate(report.defecation.lastDate)}${
        report.defecation.daysSinceLast !== null ? ` (${report.defecation.daysSinceLast} days ago)` : ''
      }`
    );
    lines.push(`Abnormal consistency in 90 days: ${report.defecation.abnormalIn90Days}`);
    lines.push(`Parasites reported by keeper: ${report.defecation.parasitesEverSeen ? 'Yes' : 'No'}`);
  } else {
    lines.push('No stool records.');
  }

  lines.push(heading('Veterinary history'));
  if (report.vetVisits.length === 0) {
    lines.push('No prior visits recorded in this app.');
  } else {
    for (const visit of report.vetVisits) {
      lines.push(`${formatDate(visit.date)} — ${titleCase(visit.visitType)}`);
      const clinic = [visit.vetName, visit.clinicName].filter(Boolean).join(' · ');
      if (clinic) lines.push(`  ${clinic}`);
      if (visit.chiefComplaint) lines.push(`  Presenting: ${visit.chiefComplaint}`);
      if (visit.diagnosis) lines.push(`  Diagnosis: ${visit.diagnosis}`);
      if (visit.treatment) lines.push(`  Treatment: ${visit.treatment}`);
      if (visit.prescriptions?.length) lines.push(`  Prescribed: ${visit.prescriptions.join(', ')}`);
      lines.push('');
    }
  }

  if (report.dataGaps.length > 0) {
    lines.push(heading('Not recorded'));
    for (const gap of report.dataGaps) {
      lines.push(`- ${gap}`);
    }
  }

  lines.push('');
  lines.push(
    'This is a husbandry and observation summary, not a veterinary assessment. Records were entered by the keeper and have not been independently verified.'
  );

  return lines.join('\n');
}
