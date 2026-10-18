import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface SparkPoint {
  label: string;
  value: number | null;
  prognosa?: boolean;
  active?: boolean;
}

export function Sparkline({ points, color = 'var(--gold)', target, height = 56, label }: { points: SparkPoint[]; color?: string; target?: number; height?: number; label: string }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const W = 220;
  const H = height;
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  if (!vals.length) return null;
  const all = target != null ? [...vals, target] : vals;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => 8 + (i * (W - 16)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - 8 - ((v - min) / span) * (H - 18);
  const actual = points.map((p, i) => ({ ...p, i })).filter((p) => !p.prognosa && p.value != null);
  const prog = points.map((p, i) => ({ ...p, i })).filter((p) => p.prognosa && p.value != null);
  const d = actual.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.value!)}`).join('');
  const last = actual[actual.length - 1];
  const area = last ? `${d}L${x(last.i)},${H}L${x(actual[0].i)},${H}Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`sp${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {target != null && <line x1="0" x2={W} y1={y(target)} y2={y(target)} stroke="var(--gold-glow)" strokeOpacity="0.45" strokeDasharray="3 4" />}
      <path d={area} fill={`url(#sp${id})`} />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 0.9 }}
      />
      {last && prog.map((p) => <line key={p.i} x1={x(last.i)} y1={y(last.value!)} x2={x(p.i)} y2={y(p.value!)} stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />)}
      {points.map((p, i) =>
        p.value == null ? null : (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={p.active ? 5 : 2.6} fill={p.prognosa ? 'var(--bg-navy)' : p.active ? '#fff' : color} stroke={color} strokeWidth={p.prognosa || p.active ? 2 : 0} style={p.active ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined} />
        ),
      )}
    </svg>
  );
}
