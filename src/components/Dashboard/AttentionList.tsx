import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AttentionItem } from '../../engine/dashboardTriage';
import type { AlertSeverity } from '../../types/thresholds';

const SEVERITY_STYLES: Record<AlertSeverity, { border: string; chipText: string; chipBg: string }> = {
  urgent: { border: 'border-red-500/30', chipText: 'text-red-300', chipBg: 'bg-red-500/10' },
  warning: { border: 'border-amber-400/30', chipText: 'text-amber-300', chipBg: 'bg-amber-500/10' },
  info: { border: 'border-sky-400/30', chipText: 'text-sky-300', chipBg: 'bg-sky-500/10' },
};

function AttentionCard({ item }: { readonly item: AttentionItem }) {
  const navigate = useNavigate();
  const styles = SEVERITY_STYLES[item.severity];

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden ${styles.border}`}>
      <div className="p-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">{item.subjectName}</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${styles.chipText} ${styles.chipBg}`}
          >
            {item.category}
          </span>
        </div>
        <p className="text-[13px] text-white/90 leading-snug mt-1.5">{item.headline}</p>
        <p className="text-xs text-muted leading-relaxed mt-1">{item.detail}</p>
      </div>

      {item.actionLabel && item.actionPath && (
        <button
          type="button"
          onClick={() => navigate(item.actionPath)}
          className="w-full min-h-[44px] px-3.5 flex items-center justify-between border-t border-divider text-sm font-semibold text-accent active:opacity-70 transition-opacity"
        >
          {item.actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface AttentionListProps {
  readonly items: AttentionItem[];
  /** Collapsed behind a "show all" once the list gets long. */
  readonly initialVisible?: number;
  readonly onShowAll?: () => void;
  readonly showingAll?: boolean;
}

export function AttentionList({
  items,
  initialVisible = 3,
  onShowAll,
  showingAll = false,
}: AttentionListProps) {
  if (items.length === 0) return null;

  const visible = showingAll ? items : items.slice(0, initialVisible);
  const hidden = items.length - visible.length;

  return (
    <div className="mx-4 space-y-2">
      {visible.map((item) => (
        <AttentionCard key={item.id} item={item} />
      ))}

      {hidden > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="w-full min-h-[44px] rounded-xl bg-card border border-divider text-sm font-semibold text-muted active:opacity-70 transition-opacity"
        >
          Show {hidden} more
        </button>
      )}
    </div>
  );
}
