/**
 * CohortConsentSetting
 *
 * Controls whether this keeper's anonymised weight-at-age observations feed the
 * species growth benchmarks.
 *
 * The copy here matters more than the control does. This defaults to on, so the
 * setting is the only place a keeper learns their data is being pooled at all —
 * which means it has to say exactly what is shared, exactly what is not, and
 * what happens when it is switched off. Vague reassurance ("we care about your
 * privacy") would be worse than no disclosure, because it implies a promise
 * without stating one.
 *
 * Turning it off deletes what was already contributed rather than merely
 * stopping new writes. A toggle that leaves old data behind is a lie.
 */

import { useEffect, useState } from 'react';
import { Users, Check, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cohortService } from '../../services/cohortService';

interface CohortConsentSettingProps {
  readonly userId: string;
}

export function CohortConsentSetting({ userId }: CohortConsentSettingProps) {
  const [contributes, setContributes] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('contributes_cohort_data')
        .eq('id', userId)
        .maybeSingle<{ contributes_cohort_data: boolean | null }>();

      if (cancelled) return;
      if (loadError) {
        console.error('Failed to load cohort consent:', loadError);
        setError('Could not load this setting.');
        return;
      }
      // Mirrors the column default, so the control shows the true current state
      // rather than defaulting to off and misrepresenting it.
      setContributes(data?.contributes_cohort_data ?? true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleToggle = async () => {
    if (contributes === null || saving) return;

    const next = !contributes;
    setSaving(true);
    setError(null);

    try {
      await cohortService.setContributionConsent(userId, next);
      setContributes(next);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update cohort consent:', err);
      setError(
        next
          ? 'Could not turn contribution on. Please try again.'
          : 'Could not turn contribution off. Your data has not been changed — please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-divider bg-card-elevated px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Users className="h-4 w-4 text-muted mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Contribute to growth benchmarks</p>
            <p className="text-xs text-muted mt-1">
              Habitat Builder pools weights across keepers to build growth curves for each species —
              something that does not otherwise exist for most reptiles.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={contributes === true}
          aria-label="Contribute to growth benchmarks"
          disabled={contributes === null || saving}
          onClick={() => void handleToggle()}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${contributes ? 'bg-accent' : 'bg-divider'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${contributes ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Stated plainly, because this is the only place it is stated. */}
      <dl className="mt-3 space-y-1 border-t border-divider pt-3 text-xs">
        <div className="flex gap-2">
          <dt className="text-muted shrink-0 w-16">Shared:</dt>
          <dd className="text-secondary">species, sex, age in days, weight, and the date</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted shrink-0 w-16">Never:</dt>
          <dd className="text-secondary">
            your account, your name, your animals' names, notes, photos, or location
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted shrink-0 w-16">If off:</dt>
          <dd className="text-secondary">
            everything you have already contributed is deleted, not just future weights
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-muted">
        Your own records are never affected either way — this only controls the anonymous copy.
      </p>

      {saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          {contributes ? 'Removing your contributions…' : 'Saving…'}
        </p>
      )}

      {justSaved && !saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
          <Check className="h-3 w-3" />
          {contributes ? 'Now contributing.' : 'Contributions removed.'}
        </p>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-300">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
