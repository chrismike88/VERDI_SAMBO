import { useRef } from 'react';
import { motion } from 'motion/react';

export function Tabs<T extends string>({ tabs, active, onChange, idPrefix, accent, label }: { tabs: readonly { id: T; label: string; short?: string }[]; active: T; onChange: (id: T) => void; idPrefix: string; accent: string; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n >= 0) {
      e.preventDefault();
      onChange(tabs[n].id);
      refs.current[n]?.focus();
    }
  };
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {tabs.map((t, i) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${on ? 'text-[#06122b]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            {on && <motion.span layoutId={`${idPrefix}-pill`} className="absolute inset-0 rounded-full" style={{ background: accent }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
