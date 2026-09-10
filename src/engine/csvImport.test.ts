import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  autoMapColumns,
  buildImportPreview,
  parseImportDate,
  parseImportNumber,
} from './csvImport';

function preview(csv: string) {
  const parsed = parseCsv(csv);
  return buildImportPreview(parsed, autoMapColumns(parsed.headers));
}

describe('parseCsv', () => {
  it('parses a simple comma file', () => {
    const result = parseCsv('Name,Species\nKermit,Crested Gecko');
    expect(result.headers).toEqual(['Name', 'Species']);
    expect(result.rows).toEqual([['Kermit', 'Crested Gecko']]);
    expect(result.delimiter).toBe(',');
  });

  it('detects tab and semicolon delimited files', () => {
    expect(parseCsv('Name\tSpecies\nKermit\tGecko').delimiter).toBe('\t');
    expect(parseCsv('Name;Species\nKermit;Gecko').delimiter).toBe(';');
  });

  it('honours quoted fields containing the delimiter', () => {
    const result = parseCsv('Name,Notes\nKermit,"Bright, alert, feeding well"');
    expect(result.rows[0]).toEqual(['Kermit', 'Bright, alert, feeding well']);
  });

  it('unescapes doubled quotes', () => {
    const result = parseCsv('Name,Notes\nKermit,"He said ""hello"""');
    expect(result.rows[0][1]).toBe('He said "hello"');
  });

  it('strips the BOM Excel writes, which would corrupt the first header', () => {
    const result = parseCsv('﻿Name,Species\nKermit,Gecko');
    expect(result.headers[0]).toBe('Name');
  });

  it('handles CRLF line endings', () => {
    const result = parseCsv('Name,Species\r\nKermit,Gecko\r\n');
    expect(result.rows).toHaveLength(1);
  });

  it('ignores blank lines', () => {
    const result = parseCsv('Name\n\nKermit\n\n\nLily\n');
    expect(result.rows).toEqual([['Kermit'], ['Lily']]);
  });

  it('returns empty structures for an empty file rather than throwing', () => {
    const result = parseCsv('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});

describe('autoMapColumns', () => {
  it('matches obvious headers', () => {
    const mapping = autoMapColumns(['Name', 'Species', 'Sex', 'Weight']);
    expect(mapping.name).toBe(0);
    expect(mapping.species).toBe(1);
    expect(mapping.sex).toBe(2);
    expect(mapping.weightGrams).toBe(3);
  });

  it('ignores case, spaces and punctuation in headers', () => {
    const mapping = autoMapColumns(['Animal Name', 'DATE_OF_BIRTH', 'weight (g)']);
    expect(mapping.name).toBe(0);
    expect(mapping.birthDate).toBe(1);
    expect(mapping.weightGrams).toBe(2);
  });

  it('prefers an exact alias over a partial match', () => {
    // "Weight" must win over "Weight Last Checked" for the weight field.
    const mapping = autoMapColumns(['Name', 'Weight Last Checked', 'Weight']);
    expect(mapping.weightGrams).toBe(2);
  });

  it('never assigns one column to two fields', () => {
    const mapping = autoMapColumns(['Name', 'Notes']);
    const used = Object.values(mapping);
    expect(new Set(used).size).toBe(used.length);
  });

  it('leaves a field unmapped rather than forcing a bad match', () => {
    const mapping = autoMapColumns(['Column A', 'Column B']);
    expect(mapping.species).toBeUndefined();
    expect(mapping.sex).toBeUndefined();
  });

  it('recognises common competitor header spellings', () => {
    const mapping = autoMapColumns(['Nickname', 'Common Name', 'Gender', 'Morphs', 'Hatch Date', 'Grams']);
    expect(mapping.name).toBe(0);
    expect(mapping.species).toBe(1);
    expect(mapping.sex).toBe(2);
    expect(mapping.morph).toBe(3);
    expect(mapping.birthDate).toBe(4);
    expect(mapping.weightGrams).toBe(5);
  });
});

describe('parseImportDate', () => {
  it('accepts unambiguous ISO dates', () => {
    const { date } = parseImportDate('2024-03-04');
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(4);
  });

  it('resolves a slashed date when one part must be the day', () => {
    // 25 cannot be a month, so this is unambiguously 25 March.
    const { date } = parseImportDate('25/03/2024');
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(25);
  });

  it('refuses a genuinely ambiguous slashed date instead of guessing', () => {
    // 03/04/2024 is March 4th in the US and April 3rd elsewhere. Guessing
    // silently corrupts age, and age drives the growth comparisons.
    const result = parseImportDate('03/04/2024');
    expect(result.date).toBeUndefined();
    expect(result.ambiguous).toBe(true);
  });

  it('expands two-digit years', () => {
    const { date } = parseImportDate('25/03/24');
    expect(date?.getFullYear()).toBe(2024);
  });

  it('returns nothing for junk rather than an Invalid Date', () => {
    expect(parseImportDate('not a date').date).toBeUndefined();
    expect(parseImportDate('').date).toBeUndefined();
  });
});

describe('parseImportNumber', () => {
  it('reads plain numbers and strips units', () => {
    expect(parseImportNumber('42')).toBe(42);
    expect(parseImportNumber('42g')).toBe(42);
    expect(parseImportNumber('42.5 grams')).toBe(42.5);
  });

  it('strips thousands separators', () => {
    expect(parseImportNumber('1,250')).toBe(1250);
  });

  it('returns undefined for junk', () => {
    expect(parseImportNumber('')).toBeUndefined();
    expect(parseImportNumber('n/a')).toBeUndefined();
  });
});

describe('buildImportPreview', () => {
  it('imports a well-formed file', () => {
    const result = preview(
      'Name,Species,Sex,Weight,Hatch Date\n' +
        'Kermit,Crested Gecko,M,42,2023-05-01\n' +
        'Lily,Leopard Gecko,F,55,2022-08-15'
    );

    expect(result.animals).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    expect(result.animals[0]).toMatchObject({
      name: 'Kermit',
      species: 'Crested Gecko',
      sex: 'male',
      weightGrams: 42,
    });
    expect(result.animals[1].sex).toBe('female');
  });

  it('skips a row with no name and says which row and why', () => {
    const result = preview('Name,Species\n,Crested Gecko\nLily,Leopard Gecko');
    expect(result.animals).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    // Row 2 of the spreadsheet, counting the header as row 1.
    expect(result.skipped[0].rowNumber).toBe(2);
    expect(result.skipped[0].reason).toContain('No animal name');
  });

  it('reports headers nothing claimed, so no column looks silently lost', () => {
    const result = preview('Name,Rack Position,Feeder Supplier\nKermit,A3,Bugs Ltd');
    expect(result.unmappedHeaders).toContain('Rack Position');
    expect(result.unmappedHeaders).toContain('Feeder Supplier');
  });

  it('warns on an unrecognised sex rather than dropping the animal', () => {
    const result = preview('Name,Sex\nKermit,probably male');
    expect(result.animals).toHaveLength(1);
    expect(result.animals[0].sex).toBe('unknown');
    expect(result.warnings[0].reason).toContain('not recognised');
  });

  it('accepts breeder 1.0 / 0.1 sex notation', () => {
    const result = preview('Name,Sex\nKermit,1.0\nLily,0.1');
    expect(result.animals[0].sex).toBe('male');
    expect(result.animals[1].sex).toBe('female');
  });

  it('leaves an ambiguous date blank and explains how to fix the source', () => {
    const result = preview('Name,Hatch Date\nKermit,03/04/2024');
    expect(result.animals[0].birthDate).toBeUndefined();
    expect(result.warnings[0].reason).toContain('YYYY-MM-DD');
  });

  it('rejects an implausible weight rather than importing it', () => {
    const result = preview('Name,Weight\nKermit,9999999');
    expect(result.animals[0].weightGrams).toBeUndefined();
    expect(result.warnings[0].reason).toContain('not a usable number');
  });

  it('still imports the animal when an optional value is bad', () => {
    // A broken weight must not cost the keeper the whole record.
    const result = preview('Name,Species,Weight\nKermit,Crested Gecko,abc');
    expect(result.animals).toHaveLength(1);
    expect(result.animals[0].species).toBe('Crested Gecko');
  });

  it('handles a file with only a name column', () => {
    const result = preview('Name\nKermit\nLily\nPascal');
    expect(result.animals).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
  });

  it('tolerates rows shorter than the header', () => {
    const result = preview('Name,Species,Weight\nKermit,Crested Gecko\nLily');
    expect(result.animals).toHaveLength(2);
    expect(result.animals[1].name).toBe('Lily');
  });

  it('preserves notes containing delimiters', () => {
    const result = preview('Name,Notes\nKermit,"Ate 2 crickets, refused a third"');
    expect(result.animals[0].notes).toBe('Ate 2 crickets, refused a third');
  });
});
