import { AlertTriangle, Check } from 'lucide-react';
import type { DashboardVerdict, VerdictLevel } from '../../engine/dashboardTriage';

const LEVEL_STYLES: Record<VerdictLevel, { wrap: string; icon: string }> = {
  clear: { wrap: 'border-divider bg-card', icon: 'text-accent' },
  watch: { wrap: 'border-sky-400/30 bg-sky-500/[0.06]', icon: 'text-sky-300' },
  attention: { wrap: 'border-amber-400/30 bg-amber-500/[0.06]', icon: 'text-amber-300' },
  urgent: { wrap: 'border-red-500/30 bg-red-500/[0.06]', icon: 'text-red-300' },
};

export function VerdictBanner({ verdict }: { readonly verdict: DashboardVerdict }) {
  const styles = LEVEL_STYLES[verdict.level];
  const isClear = verdict.level === 'clear';

  return (
    <div className={`mx-4 rounded-2xl border p-4 ${styles.wrap}`}>
      <div className="flex items-center gap-2.5">
        {isClear ? (
          <Check className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} />
        ) : (
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} />
        )}
        <h2 className="text-xl font-bold text-white tracking-tight">{verdict.headline}</h2>
      </div>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">{verdict.subline}</p>
    </div>
  );
}
