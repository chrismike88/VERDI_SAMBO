import { motion, useReducedMotion } from 'motion/react';

/** Garis energi emas (motif swoosh cover paparan). */
export function EnergyLine({ className = '', d = 'M-20 260 C 220 120, 520 420, 820 230 S 1180 120, 1260 210', delay = 0.6 }: { className?: string; d?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 1240 400" preserveAspectRatio="none" className={`pointer-events-none ${className}`} aria-hidden>
      <defs>
        <linearGradient id="energyGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#f7b731" stopOpacity="0" />
          <stop offset="0.25" stopColor="#ffd66b" />
          <stop offset="0.7" stopColor="#f7b731" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0.2" />
        </linearGradient>
        <filter id="energyGlow">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path d={d} fill="none" stroke="url(#energyGrad)" strokeWidth="3.5" strokeLinecap="round" filter="url(#energyGlow)" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : 2, delay: reduced ? 0 : delay, ease: [0.65, 0, 0.35, 1] }} />
      {!reduced && <path d={d} fill="none" stroke="#fff8d6" strokeWidth="2.5" strokeLinecap="round" className="energy-flow" opacity="0.9" />}
    </svg>
  );
}
