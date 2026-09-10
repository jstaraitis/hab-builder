/**
 * FeederColonyView
 *
 * Colony tracking for keepers who breed their own feeders.
 *
 * The screen is built around one verdict — is this colony keeping up with what
 * you pull from it — because that is the question a spreadsheet cannot answer
 * and the one that decides whether the colony survives. Counts and costs are
 * supporting detail.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bug, Plus, Loader2, AlertTriangle, Check, Scale } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  feederColonyService,
  type ColonyWithAssessment,
} from '../../services/feederColonyService';
import { FEEDER_SPECIES, type ColonyVerdict, type FeederSpecies } from '../../engine/feederColony';
import { track } from '../../services/analyticsService';

const VERDICT_STYLE: Record<ColonyVerdict, { label: string; chip: string; border: string }> = {
  establishing: { label: 'Establishing', chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30', border: 'border-l-sky-400' },
  sustainable: { label: 'Sustainable', chip: 'bg-accent/15 text-accent border-accent/30', border: 'border-l-accent' },
  'over-harvesting': { label: 'Over-harvesting', chip: 'bg-red-500/15 text-red-300 border-red-500/30', border: 'border-l-red-400' },
  'under-used': { label: 'Under-used', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30', border: 'border-l-amber-400' },
  unknown: { label: 'Not enough data', chip: 'bg-card-elevated text-muted border-divider', border: 'border-l-divider' },
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-red-400',
  warning: 'border-l-amber-400',
  note: 'border-l-sky-400',
};

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function FeederColonyView() {
  const { user } = useAuth();

  const [colonies, setColonies] = useState<ColonyWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // New colony form
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<FeederSpecies>('dubia');
  const [startedOn, setStartedOn] = useState(() => toDateInputValue(new Date()));
  const [females, setFemales] = useState('');
  const [males, setMales] = useState('');
  const [setupCost, setSetupCost] = useState('');

  // Harvest logging
  const [harvestFor, setHarvestFor] = useState<string | null>(null);
  const [harvestCount, setHarvestCount] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const list = await feederColonyService.getColonies(user.id);
      const withAssessments = await Promise.all(
        list.map((colony) => feederColonyService.getWithAssessment(colony))
      );
      setColonies(withAssessments);
      track('feature_opened', { feature: 'feeder-colonies', colonies: list.length });
    } catch (err) {
      console.error('Failed to load colonies:', err);
      setError('Could not load your colonies.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await feederColonyService.createColony(user.id, {
        name: name.trim(),
        species,
        startedOn: fromDateInputValue(startedOn),
        breedingFemales: females ? Number(females) : undefined,
        breedingMales: males ? Number(males) : undefined,
        countedOn: females || males ? new Date() : undefined,
        setupCost: setupCost ? Number(setupCost) : undefined,
      });
      setShowAdd(false);
      setName('');
      setFemales('');
      setMales('');
      setSetupCost('');
      await load();
    } catch (err) {
      console.error('Failed to create colony:', err);
      setError('Could not save that colony.');
    } finally {
      setSaving(false);
    }
  };

  const handleHarvest = async (colonyId: string) => {
    if (!user || !harvestCount) return;
    setSaving(true);
    try {
      await feederColonyService.addEvent(user.id, {
        colonyId,
        eventDate: new Date(),
        kind: 'harvest',
        count: Number(harvestCount),
      });
      setHarvestFor(null);
      setHarvestCount('');
      await load();
    } catch (err) {
      console.error('Failed to log harvest:', err);
      setError('Could not log that harvest.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <header className="bg-card border border-divider rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-white">Feeder colonies</h1>
          </div>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-accent text-on-accent"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
        <p className="text-sm text-muted mt-1">
          Track what you pull out against what your breeding stock can replace, so a colony does not
          collapse without warning.
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

      {showAdd && (
        <div className="bg-card border border-divider rounded-2xl p-5 space-y-3">
          <div>
            <label htmlFor="colony-name" className="block text-xs text-muted mb-1">
              Name
            </label>
            <input
              id="colony-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main dubia bin"
              className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
            />
          </div>

          <div>
            <label htmlFor="colony-species" className="block text-xs text-muted mb-1">
              Species
            </label>
            <select
              id="colony-species"
              value={species}
              onChange={(e) => setSpecies(e.target.value as FeederSpecies)}
              className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
            >
              {Object.values(FEEDER_SPECIES).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
            {/* The species note carries the thing keepers most often get wrong. */}
            <p className="text-xs text-muted mt-1.5">{FEEDER_SPECIES[species].note}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="colony-started" className="block text-xs text-muted mb-1">
                Started
              </label>
              <input
                id="colony-started"
                type="date"
                value={startedOn}
                onChange={(e) => setStartedOn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
              />
            </div>
            <div>
              <label htmlFor="colony-setup-cost" className="block text-xs text-muted mb-1">
                Setup cost
              </label>
              <input
                id="colony-setup-cost"
                type="number"
                inputMode="decimal"
                value={setupCost}
                onChange={(e) => setSetupCost(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="colony-females" className="block text-xs text-muted mb-1">
                Breeding females
              </label>
              <input
                id="colony-females"
                type="number"
                inputMode="numeric"
                value={females}
                onChange={(e) => setFemales(e.target.value)}
                placeholder="estimate"
                className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
              />
            </div>
            <div>
              <label htmlFor="colony-males" className="block text-xs text-muted mb-1">
                Breeding males
              </label>
              <input
                id="colony-males"
                type="number"
                inputMode="numeric"
                value={males}
                onChange={(e) => setMales(e.target.value)}
                placeholder="estimate"
                className="w-full px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            A rough estimate is fine — nobody counts a colony exactly, and the maths is banded to
            match.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-card-elevated border border-divider text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={() => void handleCreate()}
              className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-accent text-on-accent disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add colony'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}

      {!loading && colonies.length === 0 && !showAdd && (
        <div className="bg-card border border-divider rounded-2xl p-6 text-center">
          <Bug className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-white font-semibold">No colonies yet</p>
          <p className="text-sm text-muted mt-1">
            Add one to track whether it can keep up with your feeding.
          </p>
        </div>
      )}

      {colonies.map(({ colony, assessment }) => {
        const style = VERDICT_STYLE[assessment.verdict];
        const profile = FEEDER_SPECIES[colony.species];

        return (
          <section
            key={colony.id}
            className={`bg-card border border-divider border-l-4 ${style.border} rounded-2xl p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{colony.name}</h2>
                <p className="text-xs text-muted mt-0.5">
                  {profile.label} · {assessment.ageMonths} months old
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${style.chip}`}
              >
                {style.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-card-elevated rounded-xl p-3">
                <p className="text-xs text-muted">Pulling</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {assessment.harvestPerWeek === null ? '—' : `${assessment.harvestPerWeek}/wk`}
                </p>
              </div>
              <div className="bg-card-elevated rounded-xl p-3">
                <p className="text-xs text-muted">Can replace</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {assessment.sustainablePerWeek
                    ? `${assessment.sustainablePerWeek.low}–${assessment.sustainablePerWeek.high}`
                    : '—'}
                </p>
              </div>
              <div className="bg-card-elevated rounded-xl p-3">
                <p className="text-xs text-muted">Per feeder</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {assessment.costPerFeeder === null ? '—' : assessment.costPerFeeder.toFixed(2)}
                </p>
              </div>
            </div>

            {assessment.findings.length > 0 && (
              <div className="space-y-2.5 mt-4">
                {assessment.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`border-l-4 ${SEVERITY_BORDER[finding.severity]} bg-card-elevated rounded-r-xl p-3`}
                  >
                    <p className="text-sm font-semibold text-white">{finding.title}</p>
                    <p className="text-xs text-muted mt-1.5">{finding.detail}</p>
                    <p className="text-xs text-white mt-1.5">
                      <span className="text-muted">What to do: </span>
                      {finding.fix}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {assessment.insufficientData && (
              <p className="text-xs text-muted mt-3">
                Log a few harvests and record roughly how many breeding adults you have — the
                verdict needs both.
              </p>
            )}

            {/* Stale counts quietly invalidate the verdict, so their age is stated. */}
            {colony.countedOn && (
              <p className="text-xs text-muted mt-3">
                Counts last estimated {colony.countedOn.toLocaleDateString()}.
              </p>
            )}

            <div className="mt-4">
              {harvestFor === colony.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    autoFocus
                    value={harvestCount}
                    onChange={(e) => setHarvestCount(e.target.value)}
                    placeholder="How many?"
                    className="flex-1 px-3 py-2 rounded-xl bg-card-elevated border border-divider text-white text-sm"
                  />
                  <button
                    type="button"
                    disabled={saving || !harvestCount}
                    onClick={() => void handleHarvest(colony.id)}
                    className="px-3 py-2 rounded-xl bg-accent text-on-accent text-sm font-semibold disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHarvestFor(null)}
                    className="px-3 py-2 rounded-xl bg-card-elevated border border-divider text-muted text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHarvestFor(colony.id)}
                  className="w-full min-h-[44px] rounded-xl bg-card-elevated border border-divider text-sm font-semibold text-white flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4 text-accent" />
                  Log a harvest
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
