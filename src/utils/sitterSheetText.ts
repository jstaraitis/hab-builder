/**
 * Plain-text rendering of a pet-sitter care sheet.
 *
 * The most likely delivery route is a message or an email to the sitter, days
 * before the trip, from a phone. Plain text survives that; a PDF often does
 * not get opened. Same content, same order as the printed page.
 */

import type { SitterSheetBundle } from '../services/sitterSheetService';

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function heading(text: string): string {
  return `\n${text.toUpperCase()}\n${'-'.repeat(text.length)}`;
}

const DO_NOT_LIST = [
  'Do not handle any animal unless a task says to. Handling is stressful and is not needed for basic care.',
  'Do not open or lift a hide to check on an animal. If it is tucked away, it is doing what it should.',
  'Do not offer more food than a feeding task specifies, and do not re-offer food that was refused.',
  'Do not change any thermostat, timer or light schedule, even if a reading looks wrong. Note it and contact the keeper.',
  'Do not remove an animal that looks dull, cloudy-eyed or is shedding. That is normal and it should be left alone.',
];

export function sitterSheetToPlainText(bundle: SitterSheetBundle): string {
  const lines: string[] = [];

  lines.push('CARE INSTRUCTIONS — WHILE I\'M AWAY');
  lines.push(
    `${formatDayLabel(bundle.startDate)} to ${formatDayLabel(bundle.endDate)} · ${
      bundle.enclosures.length
    } enclosure${bundle.enclosures.length === 1 ? '' : 's'}`
  );
  lines.push(
    'Thank you for looking after these animals. Everything you need is below. If anything looks wrong and is not covered here, contact me before acting.'
  );

  if (bundle.failedStreams.length > 0) {
    lines.push(
      `\nINCOMPLETE SHEET: these could not be loaded and are missing below: ${bundle.failedStreams.join(', ')}.`
    );
  }

  lines.push(heading('If something is wrong'));
  if (bundle.emergencyContact) {
    lines.push(`Phone: ${bundle.emergencyContact.clinicPhone ?? 'no number on record'}`);
    lines.push(
      `Clinic: ${
        [bundle.emergencyContact.clinicName, bundle.emergencyContact.vetName].filter(Boolean).join(' · ') ||
        'not recorded'
      }`
    );
    lines.push(
      `Last visit ${bundle.emergencyContact.lastVisit.toLocaleDateString()} — confirm this clinic is still current.`
    );
  } else {
    lines.push(
      'No vet contact is recorded. Write a phone number here before handing this over — a sitter with no number to call has no options.'
    );
  }
  lines.push(
    'Reptiles hide illness well, so anything sudden matters: refusing to move when touched, gaping or open-mouth breathing, visible blood, or a fall. Call rather than wait.'
  );

  lines.push(heading('Please do not'));
  for (const item of DO_NOT_LIST) {
    lines.push(`- ${item}`);
  }

  lines.push(heading('The animals'));
  if (bundle.enclosures.length === 0) {
    lines.push('No active enclosures found.');
  } else {
    for (const entry of bundle.enclosures) {
      lines.push(`${entry.enclosure.name}`);
      const occupants =
        entry.animals.length > 0
          ? entry.animals.map((a) => a.name ?? `Animal #${a.animalNumber ?? '?'}`).join(', ')
          : 'no animals recorded';
      lines.push(`  ${occupants}${entry.enclosure.animalName ? ` (${entry.enclosure.animalName})` : ''}`);
      lines.push(
        `  Temperature: ${
          entry.dayTempTarget !== undefined ? `${entry.dayTempTarget}F by day` : 'not recorded'
        }${entry.nightTempTarget !== undefined ? `, ${entry.nightTempTarget}F at night` : ''}`
      );
      lines.push(
        `  Humidity: ${
          entry.humidityMin !== undefined && entry.humidityMax !== undefined
            ? `${entry.humidityMin}-${entry.humidityMax}%`
            : 'not recorded'
        }`
      );
    }
  }

  lines.push(heading('Daily checklist'));
  const enclosureName = (id: string | undefined): string => {
    if (!id) return '';
    const match = bundle.enclosures.find((entry) => entry.enclosure.id === id);
    return match ? ` [${match.enclosure.name}]` : '';
  };

  for (const day of bundle.schedule.days) {
    lines.push(`\n${formatDayLabel(day.date)}`);
    if (day.occurrences.length === 0) {
      lines.push('  (nothing scheduled — just a quick look over)');
      continue;
    }
    for (const occurrence of day.occurrences) {
      const time = occurrence.scheduledTime ? ` ${occurrence.scheduledTime}` : '';
      const overdue = occurrence.wasOverdue ? ' (was already due)' : '';
      lines.push(`  [ ]${time} ${occurrence.title}${enclosureName(occurrence.enclosureId)}${overdue}`);
      if (occurrence.supplementType) lines.push(`      Dust with ${occurrence.supplementType}`);
      if (occurrence.notes) lines.push(`      ${occurrence.notes}`);
    }
  }

  if (bundle.schedule.asNeeded.length > 0) {
    lines.push(heading('Watch for these'));
    lines.push('No fixed day — do them only if you notice the thing they describe.');
    for (const item of bundle.schedule.asNeeded) {
      lines.push(`- ${item.title}`);
      if (item.notes) lines.push(`    ${item.notes}`);
    }
  }

  lines.push('');
  lines.push(
    `Generated by Habitat Builder on ${new Date().toLocaleString()} from the keeper's own care schedule. Add a phone number for yourself before handing this over.`
  );

  return lines.join('\n');
}
