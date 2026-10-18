import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function ProgressRing({ value, max = 100, size = 96, stroke = 9, color = 'var(--gold)', color2, children, label }: { value: number; max?: number; size?: number; stroke?: number; color?: string; color2?: string; children?: React.ReactNode; label?: string }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const k = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color2 ?? color} />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? c * (1 - k) : c }}
          whileInView={{ strokeDashoffset: c * (1 - k) }}
          animate={{ strokeDashoffset: c * (1 - k) }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
