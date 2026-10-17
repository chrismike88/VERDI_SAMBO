import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import type { Indicator } from '@/data/schema';
import { data } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { indicatorStatus } from '@/lib/status';
import { formatPercent, formatUnit, formatValue, unitSuffix } from '@/lib/format';
import { CountUp } from './CountUp';
import { StatusPill } from './StatusPill';
import { Sparkline } from './Sparkline';
import { InfoTip } from './InfoTip';

const FORMULA: Record<Indicator['type'], string> = {
  zero: 'Target 0. Nilai 0 → On Track; lebih dari 0 → Kritis.',
  max: 'Makin kecil makin baik. ≤50% batas → Melampaui; ≤ batas → On Track; ≤110% batas → Perlu Perhatian.',
  min: 'Level target akhir tahun. ≥110% target → Melampaui; ≥ target → On Track; di bawah target dibandingkan kebutuhan kenaikan per bulan.',
  cumulative: 'Kumulatif terhadap target YTD (atau target × bulan/12). ≥ target tahunan → Melampaui; ≥100% pembanding → On Track; ≥95% → Perlu Perhatian.',
};

export function KpiCard({ ind, accent }: { ind: Indicator; accent: string }) {
  const { period } = usePeriod();
  const st = indicatorStatus(ind, data, period);
  const dec = ind.decimals ?? 0;
  const v = st.value;
  const points = data.periods.map((p) => ({ label: p.short, value: ind.values[p.id] ?? null, prognosa: p.isPrognosa, active: p.id === period.id }));
  const benchLabel = ind.type === 'cumulative' ? (ind.targetYtd?.[period.id] != null ? `target s.d. ${period.short}` : period.isPrognosa ? 'target tahunan' : `pace ${period.month}/12`) : ind.type === 'max' ? 'batas' : 'target';
  return (
    <motion.article layout className="glass glass-hover flex flex-col gap-3 p-5" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-[var(--text-muted)]">{ind.label}</h4>
        <InfoTip>
          <strong className="block mb-1">Rumus status</strong>
          {FORMULA[ind.type]}
          {ind.note && <span className="mt-2 block text-[var(--text-muted)]">Catatan: {ind.note}</span>}
          <span className="mt-2 block text-[var(--gold-glow)]">Sumber: {ind.source}</span>
        </InfoTip>
      </div>
      <div className={`flex items-baseline gap-1.5 ${period.isPrognosa ? 'prognosa' : ''}`}>
        {v == null ? (
          <span className="text-3xl font-extrabold text-[var(--status-na)]">—</span>
        ) : (
          <>
            {ind.approx && <span className="text-2xl font-bold text-[var(--text-muted)]">±</span>}
            {ind.unit === 'Rp miliar' && <span className="text-2xl font-bold">Rp</span>}
            <CountUp value={v} decimals={dec} className="text-[40px] font-extrabold leading-none" />
            <span className="text-base font-bold text-[var(--text-muted)]">{unitSuffix(ind.unit)}</span>
          </>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        dari target <strong className="text-[var(--text)]">{ind.targetLabel ?? formatUnit(ind.target, ind.unit, dec)}</strong>
        {st.pct != null && ind.type !== 'zero' && (
          <>
            {' '}
            · <span className="tnum">{formatPercent(st.pct)}</span> vs {benchLabel}
            {ind.type === 'cumulative' && ind.targetYtd?.[period.id] == null && !period.isPrognosa && <> ({formatValue(st.benchmark, ind.unit, dec)})</>}
          </>
        )}
      </p>
      {ind.type !== 'zero' && st.pct != null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8" aria-hidden>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, var(--gold-glow))` }} initial={false} animate={{ width: `${Math.min(100, ind.type === 'max' ? 100 - Math.min(100, st.pct) + 0 : st.pct)}%` }} transition={{ duration: 0.3 }} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={st.status} adjusted={st.override?.reason} />
        {st.flags.includes('PROGNOSA_DI_BAWAH_TARGET') && (
          <span className="chip !text-[11px]" style={{ color: 'var(--status-warn)' }}>
            <AlertTriangle size={12} aria-hidden /> Prognosa di bawah target
          </span>
        )}
      </div>
      <Sparkline points={points} color={accent} target={ind.type === 'zero' ? undefined : ind.target} label={`Tren ${ind.label} Jun–Des`} />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {data.periods.map((p) => (
          <span key={p.id} className={p.isPrognosa ? 'prognosa' : ''} style={p.id === period.id ? { color: '#fff', fontWeight: 800 } : undefined}>
            {p.short}
          </span>
        ))}
      </div>
    </motion.article>
  );
}
