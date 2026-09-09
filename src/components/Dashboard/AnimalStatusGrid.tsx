import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Info } from 'lucide-react';
import type { EnclosureAnimal } from '../../types/careCalendar';
import { freshnessDaysFor, type SmartStatusLevel, type StatusSensitivity } from '../../services/smartStatusService';
import type { ThresholdAlert } from '../../types/thresholds';

const STATUS_META: Record<
  SmartStatusLevel,
  { label: string; text: string; border: string; panel: string; blurb: string }
> = {
  // These describe the CARE ROUTINE, not the animal's condition — the score
  // is driven by whether logs and tasks are current, and the app has no way
  // to know an animal is healthy.
  healthy: {
    label: 'On track',
    text: 'text-accent',
    border: 'border-divider',
    panel: 'border-accent/25 bg-accent/[0.06]',
    blurb: 'Care tasks and logs are current for this animal.',
  },
  watch: {
    label: 'Watch',
    text: 'text-sky-300',
    border: 'border-sky-400/30',
    panel: 'border-sky-400/25 bg-sky-500/[0.06]',
    blurb: 'Nothing is wrong yet — these are the things drifting out of date.',
  },
  'needs-check': {
    label: 'Needs a look',
    text: 'text-amber-300',
    border: 'border-amber-400/30',
    panel: 'border-amber-400/25 bg-amber-500/[0.06]',
    blurb: 'Enough has slipped here to be worth checking properly.',
  },
  urgent: {
    label: 'Urgent',
    text: 'text-red-300',
    border: 'border-red-500/30',
    panel: 'border-red-500/25 bg-red-500/[0.06]',
    blurb: 'Something here needs attention now.',
  },
};

interface AnimalStatusGridProps {
  readonly animals: EnclosureAnimal[];
  readonly statusByAnimalId: Record<string, SmartStatusLevel>;
  readonly alertsByAnimalId: Record<string, ThresholdAlert[]>;
  readonly summaryByAnimalId: Record<string, string>;
  /** Why the animal is at its status — straight from computeSmartStatus. */
  readonly reasonsByAnimalId: Record<string, string[]>;
  readonly sensitivity: StatusSensitivity;
  readonly onToggleSensitivity: () => void;
}

export function AnimalStatusGrid({
  animals,
  statusByAnimalId,
  alertsByAnimalId,
  summaryByAnimalId,
  reasonsByAnimalId,
  sensitivity,
  onToggleSensitivity,
}: AnimalStatusGridProps) {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const freshnessDays = freshnessDaysFor(sensitivity);

  return (
    <div className="mx-4 grid grid-cols-2 gap-2 items-start">
      {animals.map((animal) => {
        const status = statusByAnimalId[animal.id] ?? 'healthy';
        const meta = STATUS_META[status];
        const alerts = alertsByAnimalId[animal.id] ?? [];
        const reasons = reasonsByAnimalId[animal.id] ?? [];
        const isOpen = openId === animal.id;

        // Prefer the reason the animal is flagged over a generic stat — a
        // grid that says "Fed yesterday" next to a red border is useless.
        const line = alerts[0]?.title ?? summaryByAnimalId[animal.id] ?? 'Nothing logged yet';
        const open = () => navigate(`/my-animals/${animal.id}`);

        return (
          <div
            key={animal.id}
            className={`bg-card border rounded-2xl overflow-hidden ${meta.border}`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={open}
                className="block w-full aspect-[4/3] bg-card-elevated active:opacity-70 transition-opacity"
              >
                {animal.photoUrl ? (
                  <img
                    src={animal.photoUrl}
                    alt={animal.name || 'Animal'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center">
                    <PawPrint className="w-7 h-7 text-divider" />
                  </span>
                )}
              </button>

              {/* Tapping the status explains it rather than navigating away —
                  "Watch" is usually about stale logs, not a sick animal, and
                  that distinction is invisible without saying it. */}
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : animal.id)}
                aria-expanded={isOpen}
                aria-label={`Why is ${animal.name || 'this animal'} marked ${meta.label}?`}
                className="absolute top-0 right-0 p-1.5 active:opacity-70 transition-opacity"
              >
                <span
                  className={`flex items-center gap-1 text-[10px] font-semibold rounded-full pl-2 pr-1.5 py-0.5 bg-surface/85 backdrop-blur-sm ${meta.text}`}
                >
                  {meta.label}
                  <Info className="w-3 h-3" />
                </span>
              </button>
            </div>

            <button type="button" onClick={open} className="block w-full p-2.5 text-left active:opacity-70 transition-opacity">
              <p className="text-[13px] font-bold text-white truncate">
                {animal.name || `#${animal.animalNumber ?? 1}`}
              </p>
              <p className="text-[10px] text-muted leading-snug mt-1 line-clamp-2">{line}</p>
            </button>

            {isOpen && (
              <div className={`mx-2.5 mb-2.5 rounded-xl border px-2.5 py-2 ${meta.panel}`}>
                {/* Label-independent heading: "Why On track?" reads badly. */}
                <p className={`text-[11px] font-semibold ${meta.text}`}>What this means</p>
                <p className="text-[10px] text-muted leading-relaxed mt-1">{meta.blurb}</p>

                {reasons.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {reasons.map((reason) => (
                      <li key={reason} className="text-[10px] text-white/85 flex items-start gap-1.5 leading-relaxed">
                        <span className="mt-[3px] flex-shrink-0 w-1 h-1 rounded-full bg-current opacity-60" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Surfaced here because this panel is where the window's
                    effect is actually felt. */}
                <button
                  type="button"
                  onClick={onToggleSensitivity}
                  className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] active:opacity-70 transition-opacity"
                >
                  <span className="text-muted">
                    {freshnessDays}-day activity window
                  </span>
                  <span className="font-semibold text-accent">
                    {sensitivity === 'relaxed' ? 'Use 14 days' : 'Use 30 days'}
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
