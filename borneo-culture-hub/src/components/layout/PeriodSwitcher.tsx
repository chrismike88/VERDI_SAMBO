import { motion } from 'motion/react';
import { data } from '@/data';
import { usePeriod } from '@/state/PeriodContext';

export function PeriodSwitcher({ compact = false, responsive = false, idPrefix = 'ps' }: { compact?: boolean; responsive?: boolean; idPrefix?: string }) {
  const { periodId, setPeriodId } = usePeriod();
  return (
    <div role="radiogroup" aria-label="Pilih periode data" className="scrollbar-none flex items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--border)] bg-[#06122b]/70 p-1">
      {data.periods.map((p) => {
        const on = p.id === periodId;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={on}
            onClick={() => setPeriodId(p.id)}
            title={p.label}
            className={`relative shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${on ? 'text-[#1a1203]' : 'text-[var(--text-muted)] hover:text-white'} ${p.isPrognosa ? 'italic' : ''}`}
          >
            {on && <motion.span layoutId={`${idPrefix}-period`} className="absolute inset-0 rounded-full" style={{ background: p.isPrognosa ? 'repeating-linear-gradient(135deg,#ffd66b 0 6px,#f7b731 6px 12px)' : 'linear-gradient(180deg,#ffe08a,#f7b731)' }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {responsive ? (
              <>
                <span className="relative 2xl:hidden">{p.isPrognosa ? 'Prog. Des' : p.cohub ? `CO HUB ${p.cohub}` : p.short}</span>
                <span className="relative hidden 2xl:inline">{p.chip}</span>
              </>
            ) : (
              <span className="relative">{compact ? p.short : p.chip}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
