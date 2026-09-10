/**
 * ImportView
 *
 * Brings a collection in from a spreadsheet or a competitor's export.
 *
 * Data portability is the stated reason keepers refuse to switch husbandry
 * apps — migrating years of history by hand is not worth it — so this exists to
 * remove that barrier rather than to be a nice-to-have.
 *
 * Four steps, and the mapping step is the one that matters: columns are
 * auto-matched by header name but ALWAYS shown for confirmation. A wrong guess
 * applied silently would mislabel an entire collection, and the keeper is the
 * only one who can tell "Weight" from "Weight Last Checked".
 */

import { useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Info,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  parseCsv,
  autoMapColumns,
  buildImportPreview,
  IMPORT_FIELDS,
  type ParsedCsv,
  type ColumnMapping,
  type ImportField,
} from '../../engine/csvImport';
import { importService, type ImportOutcome } from '../../services/importService';
import { enclosureService } from '../../services/enclosureService';
import { track } from '../../services/analyticsService';
import type { Enclosure } from '../../types/careCalendar';

type Step = 'upload' | 'map' | 'confirm' | 'done';

/** Files above this are not a reptile collection; they are a mistake. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function ImportView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [enclosureId, setEnclosureId] = useState<string>('');
  const [skipExisting, setSkipExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () => (parsed ? buildImportPreview(parsed, mapping) : null),
    [parsed, mapping]
  );

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > MAX_FILE_BYTES) {
      setError(
        'That file is larger than 5 MB. Export just your animal list rather than everything.'
      );
      return;
    }

    try {
      const text = await file.text();
      const result = parseCsv(text);

      if (result.headers.length === 0 || result.rows.length === 0) {
        setError('No rows found in that file. It needs a header row and at least one animal.');
        return;
      }

      setFileName(file.name);
      setParsed(result);
      setMapping(autoMapColumns(result.headers));
      setStep('map');
      track('feature_opened', { feature: 'import', rows: result.rows.length });
    } catch (err) {
      console.error('Failed to read import file:', err);
      setError('Could not read that file. It needs to be a CSV or tab-separated text file.');
    }
  };

  const loadEnclosures = async () => {
    if (!user) return;
    try {
      setEnclosures(await enclosureService.getEnclosures(user.id));
    } catch (err) {
      // Placement is optional; the import still works without an enclosure.
      console.error('Could not load enclosures:', err);
    }
  };

  const handleImport = async () => {
    if (!user || !preview) return;
    setImporting(true);
    setError(null);

    try {
      const result = await importService.importAnimals(preview.animals, {
        userId: user.id,
        enclosureId: enclosureId || undefined,
        skipExisting,
      });
      setOutcome(result);
      setStep('done');
    } catch (err) {
      console.error('Import failed:', err);
      setError('The import could not be completed. Nothing further was changed.');
    } finally {
      setImporting(false);
    }
  };

  const setFieldColumn = (field: ImportField, value: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (value === '') delete next[field];
      else next[field] = Number(value);
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link
        to="/my-animals"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Animals
      </Link>

      <header className="bg-card border border-divider rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-white">Import your collection</h1>
        </div>
        <p className="text-sm text-muted mt-1">
          Bring animals in from a spreadsheet or another app&apos;s export. Any CSV works — you
          confirm which column is which.
        </p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        </div>
      )}

      {/* ---- Step 1: upload ---- */}
      {step === 'upload' && (
        <div className="bg-card border border-divider rounded-2xl p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-divider flex flex-col items-center justify-center gap-2 text-muted active:opacity-70 transition-opacity"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-semibold text-white">Choose a file</span>
            <span className="text-xs">CSV, TSV or tab-separated text</span>
          </button>

          <div className="mt-4 pt-4 border-t border-divider">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Exporting from another app
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Most husbandry apps can export a CSV of your collection — look for Export, Reports or
              Download in their settings. You do not need a particular format: whatever columns come
              out, you map them on the next screen. A plain spreadsheet works just as well.
            </p>
          </div>
        </div>
      )}

      {/* ---- Step 2: confirm the mapping ---- */}
      {step === 'map' && parsed && preview && (
        <>
          <div className="bg-card border border-divider rounded-2xl p-5">
            <p className="text-sm text-white font-semibold">
              {fileName} · {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-muted mt-1">
              We matched what we could from your column names. Check each one — a wrong match here
              would mislabel your whole collection.
            </p>

            <div className="mt-4 space-y-2.5">
              {IMPORT_FIELDS.map((field) => (
                <div key={field.id} className="flex items-center gap-3">
                  <label htmlFor={`map-${field.id}`} className="text-xs text-muted w-32 shrink-0">
                    {field.label}
                    {field.required && <span className="text-red-300"> *</span>}
                  </label>
                  <select
                    id={`map-${field.id}`}
                    value={mapping[field.id] ?? ''}
                    onChange={(event) => setFieldColumn(field.id, event.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
                  >
                    <option value="">— not in this file —</option>
                    {parsed.headers.map((header, index) => (
                      <option key={`${header}-${index}`} value={index}>
                        {header || `Column ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Nothing is silently lost: say which columns nobody claimed. */}
            {preview.unmappedHeaders.length > 0 && (
              <p className="text-xs text-muted mt-4 pt-3 border-t border-divider">
                <Info className="w-3.5 h-3.5 inline mr-1" />
                Not imported: {preview.unmappedHeaders.join(', ')}. Habitat Builder does not have a
                field for these.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={mapping.name === undefined}
            onClick={() => {
              void loadEnclosures();
              setStep('confirm');
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-on-accent disabled:opacity-50"
          >
            {mapping.name === undefined ? 'Choose the name column to continue' : 'Preview import'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* ---- Step 3: preview and confirm ---- */}
      {step === 'confirm' && preview && (
        <>
          <div className="bg-card border border-divider rounded-2xl p-5">
            <p className="text-sm font-semibold text-white">
              {preview.animals.length} animal{preview.animals.length === 1 ? '' : 's'} ready to
              import
            </p>

            <div className="mt-3 space-y-1 max-h-52 overflow-y-auto">
              {preview.animals.slice(0, 50).map((animal, index) => (
                <div key={`${animal.name}-${index}`} className="flex justify-between gap-3 text-xs">
                  <span className="text-white truncate">{animal.name}</span>
                  <span className="text-muted truncate shrink-0">
                    {[animal.species, animal.sex, animal.morph].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
              ))}
              {preview.animals.length > 50 && (
                <p className="text-xs text-muted pt-1">…and {preview.animals.length - 50} more.</p>
              )}
            </div>
          </div>

          {preview.skipped.length > 0 && (
            <div className="bg-card border border-divider rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {preview.skipped.length} row{preview.skipped.length === 1 ? '' : 's'} cannot be
                imported
              </p>
              <ul className="space-y-1">
                {preview.skipped.slice(0, 10).map((problem) => (
                  <li key={problem.rowNumber} className="text-xs text-muted">
                    Row {problem.rowNumber}: {problem.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-200 uppercase tracking-wide mb-2">
                {preview.warnings.length} value{preview.warnings.length === 1 ? '' : 's'} need
                attention
              </p>
              <ul className="space-y-1">
                {preview.warnings.slice(0, 10).map((problem, index) => (
                  <li key={`${problem.rowNumber}-${index}`} className="text-xs text-amber-200/90">
                    Row {problem.rowNumber}: {problem.reason}
                  </li>
                ))}
                {preview.warnings.length > 10 && (
                  <li className="text-xs text-amber-200/70">
                    …and {preview.warnings.length - 10} more.
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="bg-card border border-divider rounded-2xl p-5 space-y-3">
            <div>
              <label htmlFor="import-enclosure" className="block text-xs text-muted mb-1">
                Put them all in an enclosure (optional)
              </label>
              <select
                id="import-enclosure"
                value={enclosureId}
                onChange={(event) => setEnclosureId(event.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
              >
                <option value="">— no enclosure —</option>
                {enclosures.map((enclosure) => (
                  <option key={enclosure.id} value={enclosure.id}>
                    {enclosure.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(event) => setSkipExisting(event.target.checked)}
                className="w-4 h-4 mt-0.5 accent-accent"
              />
              <span className="text-xs text-secondary">
                Skip animals whose name already exists. Leave this on unless you mean to create
                duplicates — re-importing the same file is easy to do by accident.
              </span>
            </label>
          </div>

          <div className="flex gap-2 pb-8">
            <button
              type="button"
              onClick={() => setStep('map')}
              className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl bg-card-elevated border border-divider text-white"
            >
              Back to mapping
            </button>
            <button
              type="button"
              disabled={importing || preview.animals.length === 0}
              onClick={() => {
                void handleImport();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-on-accent disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing…
                </>
              ) : (
                `Import ${preview.animals.length}`
              )}
            </button>
          </div>
        </>
      )}

      {/* ---- Step 4: outcome ---- */}
      {step === 'done' && outcome && (
        <>
          <div className="bg-card border border-divider rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              <p className="text-base font-semibold text-white">
                {outcome.created.length} animal{outcome.created.length === 1 ? '' : 's'} imported
              </p>
            </div>
            {outcome.weightsRecorded > 0 && (
              <p className="text-xs text-muted mt-1">
                {outcome.weightsRecorded} starting weight
                {outcome.weightsRecorded === 1 ? '' : 's'} recorded too.
              </p>
            )}
          </div>

          {outcome.skippedExisting.length > 0 && (
            <div className="bg-card border border-divider rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                {outcome.skippedExisting.length} already existed
              </p>
              <p className="text-xs text-muted">{outcome.skippedExisting.join(', ')}</p>
            </div>
          )}

          {/* Failures are named individually. "Something went wrong" is useless
 to someone who has just moved their whole collection across. */}
          {outcome.failed.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-xs font-semibold text-red-300 uppercase tracking-wide mb-2">
                {outcome.failed.length} could not be saved
              </p>
              <ul className="space-y-1">
                {outcome.failed.map((failure) => (
                  <li key={failure.name} className="text-xs text-red-200/90">
                    {failure.name}: {failure.reason}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-200/70 mt-2">
                Everything else imported. You can re-run the import — the ones that succeeded will
                be skipped.
              </p>
            </div>
          )}

          <div className="flex gap-2 pb-8">
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setParsed(null);
                setOutcome(null);
                setFileName(null);
              }}
              className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl bg-card-elevated border border-divider text-white"
            >
              Import another file
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-animals')}
              className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-on-accent"
            >
              See my animals
            </button>
          </div>
        </>
      )}
    </div>
  );
}
