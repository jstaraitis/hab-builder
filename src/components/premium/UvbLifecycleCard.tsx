import { useState } from 'react';
import { Lightbulb, ShoppingCart, Check, AlertTriangle, Loader2 } from 'lucide-react';
import {
  getUvbLifecycleStatus,
  UVB_BULB_SPECS,
  UVB_BULB_TYPE_ORDER,
  type UvbBulbType,
  type UvbLifecycleState,
} from '../../engine/uvbLifecycle';
import { generateAmazonSearchLink } from '../../utils/amazonLinks';
import type { Enclosure } from '../../types/careCalendar';

const STATE_STYLES: Record<
  UvbLifecycleState,
  {
    bar: string;
    text: string;
    ring: string;
    label: string;
  }
> = {
  fresh: { bar: 'bg-accent', text: 'text-accent', ring: 'border-divider', label: 'Good' },
  good: { bar: 'bg-accent', text: 'text-accent', ring: 'border-divider', label: 'Good' },
  'due-soon': {
    bar: 'bg-amber-400',
    text: 'text-amber-300',
    ring: 'border-amber-400/30',
    label: 'Due soon',
  },
  overdue: {
    bar: 'bg-orange-500',
    text: 'text-orange-300',
    ring: 'border-orange-500/40',
    label: 'Overdue',
  },
  critical: {
    bar: 'bg-red-500',
    text: 'text-red-300',
    ring: 'border-red-500/40',
    label: 'Replace now',
  },
};

interface UvbLifecycleCardProps {
  readonly enclosure: Enclosure;
  readonly onReplace: (bulbType: UvbBulbType) => Promise<void>;
  /** Persists a bulb type for an enclosure that has a date but no type yet. */
  readonly onSetBulbType: (bulbType: UvbBulbType) => Promise<void>;
  /** Whether the species requires UVB — drives the empty-state prompt. */
  readonly speciesNeedsUvb?: boolean;
}

export function UvbLifecycleCard({
  enclosure,
  onReplace,
  onSetBulbType,
  speciesNeedsUvb,
}: UvbLifecycleCardProps) {
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  const status = getUvbLifecycleStatus(enclosure.uvbBulbInstalledOn, enclosure.uvbBulbType);

  // Declared above the early return below — the no-bulb branch renders a
  // picker that calls it, and a const declared later would be in the temporal
  // dead zone by the time that handler fires.
  const handlePick = async (bulbType: UvbBulbType, mode: 'replace' | 'identify') => {
    setSaving(true);
    try {
      if (mode === 'replace') {
        await onReplace(bulbType);
      } else {
        await onSetBulbType(bulbType);
      }
      setPicking(false);
    } finally {
      setSaving(false);
    }
  };

  // No bulb on record. For a species that needs UVB this is worth prompting
  // about — silently hiding the card is how a keeper never discovers the
  // tracking exists. For a species that doesn't, stay out of the way.
  if (!status) {
    if (!speciesNeedsUvb) return null;

    return (
      <div className="bg-card border border-amber-400/30 rounded-2xl mx-4 p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-300" />
          <h3 className="text-med font-bold text-white">UVB Bulb</h3>
        </div>
        <p className="text-sm font-semibold text-white">No bulb recorded</p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          This species needs UVB to process calcium. Add your bulb and we&apos;ll track its real
          lifespan and tell you before the output fades.
        </p>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="w-full min-h-[44px] mt-3 rounded-xl bg-accent text-on-accent text-sm font-semibold active:opacity-80 transition-opacity"
        >
          Add UVB bulb
        </button>

        {picking && (
          <div className="mt-3 space-y-1.5">
            {UVB_BULB_TYPE_ORDER.map((type) => {
              const spec = UVB_BULB_SPECS[type];
              return (
                <button
                  key={type}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    void handlePick(type, 'replace');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card-elevated border border-divider text-left active:opacity-70 transition-opacity disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{spec.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{spec.hint}</p>
                  </div>
                  <span className="text-[11px] text-muted flex-shrink-0">
                    {spec.lifespanMonths} mo
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const styles = STATE_STYLES[status.state];
  const needsType = !enclosure.uvbBulbType || enclosure.uvbBulbType === 'unknown';

  return (
    <div className={`bg-card border ${styles.ring} rounded-2xl overflow-hidden mx-4`}>
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3">
        <Lightbulb className="w-4 h-4 text-accent" />
        <h3 className="text-med font-bold text-white">UVB Bulb</h3>
        <span className={`ml-auto text-xs font-semibold ${styles.text}`}>{styles.label}</span>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{status.headline}</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">{status.detail}</p>
        </div>

        {/* Life remaining */}
        <div>
          <div
            className="h-2 w-full bg-card-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={status.percentElapsed}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="UVB bulb life used"
          >
            <div
              className={`h-full ${styles.bar} transition-all`}
              style={{ width: `${status.percentElapsed}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-muted">
            <span>{status.spec.label}</span>
            <span>
              Installed {status.installedOn.toLocaleDateString()} · {status.spec.lifespanMonths} mo
              life
            </span>
          </div>
        </div>

        {/* An unidentified bulb is being tracked on the shortest lifespan, which
 may be wrong by half. Getting the real type is worth one prompt. */}
        {needsType && !picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="w-full flex items-start gap-2 p-2.5 rounded-xl bg-card-elevated border border-divider text-left active:opacity-70 transition-opacity"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-white">Which bulb is this?</span> We&apos;re
              assuming 6 months. A T5 HO lasts twice that — tell us and we&apos;ll track it
              properly.
            </span>
          </button>
        )}

        {picking ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              Select bulb type
            </p>
            {UVB_BULB_TYPE_ORDER.map((type) => {
              const spec = UVB_BULB_SPECS[type];
              return (
                <button
                  key={type}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    void handlePick(type, needsType ? 'identify' : 'replace');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card-elevated border border-divider text-left active:opacity-70 transition-opacity disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{spec.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{spec.hint}</p>
                  </div>
                  <span className="text-[11px] text-muted flex-shrink-0">
                    {spec.lifespanMonths} mo
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPicking(false)}
              disabled={saving}
              className="w-full py-2 text-xs text-muted active:opacity-70 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPicking(true)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-on-accent text-sm font-semibold active:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />I replaced it
                </>
              )}
            </button>

            <a
              href={generateAmazonSearchLink(status.spec.searchQuery)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card-elevated border border-divider text-white text-sm font-semibold active:opacity-70 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy replacement
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
