import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/** Gauge setengah lingkaran; skala 0–120%. */
export function Gauge({ pct, color = 'var(--prima)', color2 = 'var(--prima-2)', label }: { pct: number; color?: string; color2?: string; label: string }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const max = 120;
  const k = Math.max(0, Math.min(1, pct / max));
  const r = 80;
  const len = Math.PI * r;
  const tick = (100 / max) * Math.PI;
  const tx = 100 - Math.cos(tick) * r;
  const ty = 100 - Math.sin(tick) * r;
  return (
    <svg viewBox="0 0 200 116" className="w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`gg${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={color2} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
      <motion.path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        stroke={`url(#gg${id})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={len}
        initial={{ strokeDashoffset: reduced ? len * (1 - k) : len }}
        whileInView={{ strokeDashoffset: len * (1 - k) }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      <line x1={tx} y1={ty} x2={100 - Math.cos(tick) * (r - 18)} y2={100 - Math.sin(tick) * (r - 18)} stroke="#fff" strokeWidth="2" opacity="0.7" />
      <text x={100 - Math.cos(tick) * (r + 14)} y={100 - Math.sin(tick) * (r + 14)} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
        100%
      </text>
    </svg>
  );
}
