import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface PremiumToolOnboardingProps {
  readonly storageKey: string;
  readonly title: string;
  readonly subtitle: string;
  readonly steps: readonly [string, string, string];
}

export function PremiumToolOnboarding({ storageKey, title, subtitle, steps }: PremiumToolOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === '1';
    setIsVisible(!isDismissed);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
      <div className="bg-card border border-accent/30 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">{title}</h2>
              <p className="text-sm text-secondary mt-1">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="text-muted hover:text-secondary dark:hover:text-gray-200 p-1"
            aria-label="Dismiss onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="mt-4 grid gap-2 sm:gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="text-sm text-white bg-card dark:bg-gray-700/40 rounded-lg px-3 py-2 border border-divider"
            >
              <span className="font-semibold text-accent mr-1">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}