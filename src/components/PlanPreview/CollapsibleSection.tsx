import { useState, type ReactNode } from 'react';

export interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-divider">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-card transition-colors"
      >
        <span className="text-xl font-bold text-white">{title}</span>
        <span className="text-muted text-lg">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-6 pb-6 border-t border-divider">{children}</div>}
    </div>
  );
}
