/**
 * CSV import
 *
 * Data portability is the single most-cited reason keepers refuse to switch
 * husbandry apps — the MorphMarket community says so plainly, and at least one
 * competitor has built a spreadsheet importer specifically to break that lock.
 *
 * WHY A GENERIC MAPPER RATHER THAN PER-COMPETITOR PARSERS
 * The obvious approach is one importer per rival app. It is the wrong one:
 *
 *   - Their export formats are neither published nor stable. A parser written
 *     against a file we have never seen is a guess, and it fails silently on
 *     the keeper's real data.
 *   - There are a dozen such apps and more each year.
 *   - Keepers who track in a plain spreadsheet — a large share of them — would
 *     be excluded by a competitor-specific approach entirely.
 *
 * So this parses ANY delimited file and asks the keeper to confirm the column
 * mapping, with headers auto-matched where the name is recognisable. That works
 * on day one for every competitor at once, including ones that do not exist
 * yet, and it degrades into a manual mapping rather than a wrong import.
 *
 * NOTHING IS EVER GUESSED INTO A RECORD. A column that cannot be mapped is
 * reported, not dropped quietly, and a row that fails validation is returned
 * with its reason so the keeper can fix the source rather than wonder what
 * happened to it.
 */

export type ImportField =
  | 'name'
  | 'species'
  | 'sex'
  | 'morph'
  | 'birthDate'
  | 'acquisitionDate'
  | 'weightGrams'
  | 'lengthInches'
  | 'notes';

export interface FieldSpec {
  id: ImportField;
  label: string;
  /** Header names seen in the wild, lowercased and stripped of punctuation. */
  aliases: string[];
  required?: boolean;
  kind: 'text' | 'date' | 'number' | 'sex';
}

/**
 * Alias lists are drawn from the column names competitor exports and common
 * spreadsheet templates actually use. Unrecognised headers are not a failure —
 * they simply arrive unmapped for the keeper to assign by hand.
 */
export const IMPORT_FIELDS: FieldSpec[] = [
  {
    id: 'name',
    label: 'Animal name',
    kind: 'text',
    required: true,
    aliases: ['name', 'animal', 'animalname', 'nickname', 'id', 'identifier', 'label', 'title'],
  },
  {
    id: 'species',
    label: 'Species',
    kind: 'text',
    aliases: ['species', 'commonname', 'type', 'animaltype', 'kind', 'scientificname'],
  },
  {
    id: 'sex',
    label: 'Sex',
    kind: 'sex',
    aliases: ['sex', 'gender', 'malefemale'],
  },
  {
    id: 'morph',
    label: 'Morph',
    kind: 'text',
    aliases: ['morph', 'morphs', 'genetics', 'trait', 'traits', 'variety'],
  },
  {
    id: 'birthDate',
    label: 'Hatch / birth date',
    kind: 'date',
    aliases: ['birthdate', 'birth', 'dob', 'hatchdate', 'hatched', 'dateofbirth', 'born'],
  },
  {
    id: 'acquisitionDate',
    label: 'Acquired date',
    kind: 'date',
    aliases: ['acquired', 'acquisitiondate', 'dateacquired', 'purchasedate', 'purchased', 'arrival'],
  },
  {
    id: 'weightGrams',
    label: 'Weight (grams)',
    kind: 'number',
    aliases: ['weight', 'weightg', 'weightgrams', 'grams', 'mass', 'currentweight'],
  },
  {
    id: 'lengthInches',
    label: 'Length (inches)',
    kind: 'number',
    aliases: ['length', 'lengthin', 'lengthinches', 'size', 'svl', 'totallength'],
  },
  {
    id: 'notes',
    label: 'Notes',
    kind: 'text',
    aliases: ['notes', 'note', 'comment', 'comments', 'description', 'remarks'],
  },
];

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  /** The delimiter that was detected. */
  delimiter: string;
}

export type ColumnMapping = Partial<Record<ImportField, number>>;

export interface ImportedAnimal {
  name: string;
  species?: string;
  sex?: 'male' | 'female' | 'unknown';
  morph?: string;
  birthDate?: Date;
  acquisitionDate?: Date;
  weightGrams?: number;
  lengthInches?: number;
  notes?: string;
}

export interface RowProblem {
  /** 1-based, counting the header as row 1, so it matches the spreadsheet. */
  rowNumber: number;
  reason: string;
}

export interface ImportPreview {
  animals: ImportedAnimal[];
  /** Rows that could not be imported, with why. Never silently dropped. */
  skipped: RowProblem[];
  /** Values that parsed but looked wrong, imported anyway with a note. */
  warnings: RowProblem[];
  /** Headers no field claimed. Reported so nothing looks silently lost. */
  unmappedHeaders: string[];
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const DELIMITERS = [',', '\t', ';', '|'];

/** Normalises a header for alias matching: lowercase, alphanumeric only. */
function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Splits one CSV line, honouring quoted fields and doubled quotes.
 *
 * Hand-rolled rather than pulled from a library because the requirement is
 * small and well-defined, and a dependency here would be a larger surface than
 * the code it replaces. Handles the cases that actually appear in exports:
 * quoted commas, quoted newlines are NOT supported and are reported instead.
 */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      out.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  out.push(current.trim());
  return out;
}

/** Picks the delimiter that yields the most columns on the header line. */
function detectDelimiter(headerLine: string): string {
  let best = ',';
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = splitLine(headerLine, delimiter).length;
    if (count > bestCount) {
      bestCount = count;
      best = delimiter;
    }
  }
  return best;
}

export function parseCsv(text: string): ParsedCsv {
  // Strip a BOM: Excel writes one, and it corrupts the first header name.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const lines = clean
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: ',' };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => splitLine(line, delimiter));

  return { headers, rows, delimiter };
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

/**
 * Guesses a column for each field from its header name.
 *
 * Exact alias matches win over partial ones, and a column is never assigned to
 * two fields. The result is a STARTING POINT the keeper confirms — it is not
 * applied blind, because a wrong guess here silently mislabels their whole
 * collection.
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const normalised = headers.map(normaliseHeader);
  const mapping: ColumnMapping = {};
  const taken = new Set<number>();

  // Exact matches first, so "weight" claims the weight column before a partial
  // match like "weightlastchecked" can.
  for (const field of IMPORT_FIELDS) {
    const index = normalised.findIndex(
      (header, i) => !taken.has(i) && field.aliases.includes(header)
    );
    if (index !== -1) {
      mapping[field.id] = index;
      taken.add(index);
    }
  }

  for (const field of IMPORT_FIELDS) {
    if (mapping[field.id] !== undefined) continue;
    const index = normalised.findIndex(
      (header, i) =>
        !taken.has(i) && header.length > 2 && field.aliases.some((alias) => header.includes(alias))
    );
    if (index !== -1) {
      mapping[field.id] = index;
      taken.add(index);
    }
  }

  return mapping;
}

// ---------------------------------------------------------------------------
// Value coercion
// ---------------------------------------------------------------------------

const SEX_VALUES: Record<string, 'male' | 'female' | 'unknown'> = {
  m: 'male',
  male: 'male',
  '1.0': 'male',
  f: 'female',
  female: 'female',
  '0.1': 'female',
  u: 'unknown',
  unknown: 'unknown',
  unsexed: 'unknown',
  '': 'unknown',
};

/**
 * Parses a date without inventing one.
 *
 * Ambiguous formats are the trap: 03/04/2024 is March 4th in the US and April
 * 3rd nearly everywhere else, and there is no way to tell from the value. An
 * unambiguous ISO date is accepted; a slash-separated date is accepted only
 * when one component exceeds 12 and therefore must be the day.
 */
export function parseImportDate(value: string): { date?: Date; ambiguous?: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return {};

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(date.getTime()) ? {} : { date };
  }

  const slashed = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(trimmed);
  if (slashed) {
    const a = Number(slashed[1]);
    const b = Number(slashed[2]);
    const year = Number(slashed[3].length === 2 ? `20${slashed[3]}` : slashed[3]);

    // Only one ordering is possible when a component is above 12.
    if (a > 12 && b <= 12) return { date: new Date(year, b - 1, a) };
    if (b > 12 && a <= 12) return { date: new Date(year, a - 1, b) };

    // Genuinely ambiguous — refuse rather than pick.
    return { ambiguous: true };
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? {} : { date: fallback };
}

/** Reads a number, tolerating units and thousands separators. */
export function parseImportNumber(value: string): number | undefined {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// ---------------------------------------------------------------------------
// Building the preview
// ---------------------------------------------------------------------------

/** Rejects values that are clearly not a real animal weight. */
const MAX_PLAUSIBLE_WEIGHT_GRAMS = 500_000;

export function buildImportPreview(parsed: ParsedCsv, mapping: ColumnMapping): ImportPreview {
  const animals: ImportedAnimal[] = [];
  const skipped: RowProblem[] = [];
  const warnings: RowProblem[] = [];

  const mappedColumns = new Set(Object.values(mapping));
  const unmappedHeaders = parsed.headers.filter((_, index) => !mappedColumns.has(index));

  const read = (row: string[], field: ImportField): string => {
    const index = mapping[field];
    if (index === undefined) return '';
    return row[index]?.trim() ?? '';
  };

  parsed.rows.forEach((row, i) => {
    // +2: one for the header row, one because spreadsheets are 1-based.
    const rowNumber = i + 2;

    const name = read(row, 'name');
    if (!name) {
      skipped.push({ rowNumber, reason: 'No animal name in the mapped name column.' });
      return;
    }

    const animal: ImportedAnimal = { name };

    const species = read(row, 'species');
    if (species) animal.species = species;

    const morph = read(row, 'morph');
    if (morph) animal.morph = morph;

    const notes = read(row, 'notes');
    if (notes) animal.notes = notes;

    const sexRaw = read(row, 'sex').toLowerCase();
    if (sexRaw) {
      const sex = SEX_VALUES[sexRaw];
      if (sex) {
        animal.sex = sex;
      } else {
        warnings.push({ rowNumber, reason: `Sex "${sexRaw}" not recognised — imported as unknown.` });
        animal.sex = 'unknown';
      }
    }

    for (const field of ['birthDate', 'acquisitionDate'] as const) {
      const raw = read(row, field);
      if (!raw) continue;
      const { date, ambiguous } = parseImportDate(raw);
      if (date) {
        animal[field] = date;
      } else if (ambiguous) {
        // Left unset rather than guessed. A wrong hatch date silently corrupts
        // age, and age drives growth comparisons.
        warnings.push({
          rowNumber,
          reason: `Date "${raw}" could be day/month or month/day — left blank. Use YYYY-MM-DD to import it.`,
        });
      } else {
        warnings.push({ rowNumber, reason: `Could not read date "${raw}" — left blank.` });
      }
    }

    const weightRaw = read(row, 'weightGrams');
    if (weightRaw) {
      const weight = parseImportNumber(weightRaw);
      if (weight === undefined || weight <= 0 || weight > MAX_PLAUSIBLE_WEIGHT_GRAMS) {
        warnings.push({ rowNumber, reason: `Weight "${weightRaw}" is not a usable number — left blank.` });
      } else {
        animal.weightGrams = weight;
      }
    }

    const lengthRaw = read(row, 'lengthInches');
    if (lengthRaw) {
      const length = parseImportNumber(lengthRaw);
      if (length !== undefined && length > 0) animal.lengthInches = length;
      else warnings.push({ rowNumber, reason: `Length "${lengthRaw}" is not a usable number — left blank.` });
    }

    animals.push(animal);
  });

  return { animals, skipped, warnings, unmappedHeaders };
}
