import { useId, useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTip({ children, label = 'Info rumus & sumber' }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="grid h-6 w-6 place-items-center rounded-full text-[var(--text-muted)] hover:text-white hover:bg-white/10"
      >
        <Info size={14} aria-hidden />
      </button>
      {open && (
        <span role="tooltip" id={id} className="absolute right-0 top-7 z-30 w-64 rounded-xl border border-[var(--border)] bg-[#0b1d45] p-3 text-left text-xs leading-relaxed text-[var(--text)] shadow-2xl">
          {children}
        </span>
      )}
    </span>
  );
}
