import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Trophy, Users, TrendingUp, XCircle, RotateCw } from 'lucide-react';
import type { Indicator } from '@/data/schema';
import { data, pillarById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { actualPeriods, PROGNOSA_ID } from '@/lib/metrics';
import { formatNumber, formatPercent, formatRupiahMiliar, formatUnit } from '@/lib/format';
import { Gauge } from '@/components/ui/Gauge';
import { Reveal } from '@/components/ui/Reveal';
import { ChartTableToggle } from '@/components/ui/ChartTableToggle';

const P = () => pillarById('prima');
const C = 'var(--prima)';
const G = 'var(--gold-glow)';

function LetterCard({ h, i }: { h: ReturnType<typeof P>['highlights'][number]; i: number }) {
  const [flipped, setFlipped] = useState(false);
  const pr = P().programs[i];
  return (
    <button
      type="button"
      className={`flip h-64 w-full text-left ${flipped ? 'is-flipped' : ''}`}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={`${h.letter}: ${h.title}. ${h.subtitle}. ${h.points.join('. ')}`}
    >
      <span className="flip-inner block">
        <span className="flip-face glass flex flex-col items-center justify-center overflow-hidden !rounded-3xl p-4 text-center" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(245,158,11,0.25), rgba(8,22,52,0.85) 70%)' }}>
          <span className="text-gold-grad text-[110px] font-extrabold leading-none drop-shadow-[0_0_30px_rgba(247,183,49,0.45)]">{h.letter}</span>
          <span className="mt-2 text-sm font-extrabold">{h.title}</span>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <RotateCw size={11} aria-hidden /> Balik kartu
          </span>
        </span>
        <span className="flip-face flip-back glass flex flex-col justify-between !rounded-3xl p-5" style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.28), rgba(20,184,166,0.15) 60%, rgba(8,22,52,0.9))' }}>
          <span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gold-glow)]">{h.letter} · Program</span>
            <span className="mt-1 block text-lg font-extrabold leading-tight">{h.title}</span>
            <span className="mt-1 block text-xs text-[var(--text-muted)]">{pr?.description}</span>
          </span>
          <span>
            <span className="block text-2xl font-extrabold text-gold-grad">{h.subtitle}</span>
            {h.points.map((pt) => (
              <span key={pt} className="block text-xs text-[var(--text)]">
                {pt}
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}

function Trajectory({ ind, unitShort }: { ind: Indicator; unitShort: string }) {
  const reduced = useReducedMotion();
  const { period } = usePeriod();
  const act = actualPeriods(data);
  const pid = PROGNOSA_ID(data)!;
  const prog = ind.values[pid]!;
  const dec = ind.decimals ?? 0;
  const pts = act.map((p) => ({ m: p.month, v: ind.values[p.id]!, id: p.id, short: p.short }));
  const last = pts[pts.length - 1];
  const W = 560;
  const H = 260;
  const pl = 56;
  const pr = 70;
  const minV = Math.min(...pts.map((p) => p.v)) * 0.85;
  const maxV = ind.target * 1.04;
  const x = (m: number) => pl + ((m - pts[0].m) / (12 - pts[0].m)) * (W - pl - pr);
  const y = (v: number) => 20 + (1 - (v - minV) / (maxV - minV)) * (H - 50);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.m)},${y(p.v)}`).join('');
  const gap = ind.target - prog;
  const ticks = [minV, (minV + maxV) / 2, ind.target];
  const chart = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Lintasan ${ind.label}: aktual ${pts[0].short}–${last.short}, prognosa Desember ${formatUnit(prog, ind.unit, dec)}, target ${formatUnit(ind.target, ind.unit, dec)}`}>
      <defs>
        <linearGradient id={`traj-${ind.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <text key={t} x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-muted)">
          {formatNumber(t, dec)}
        </text>
      ))}
      <line x1={pl} x2={W - 10} y1={y(ind.target)} y2={y(ind.target)} stroke="var(--status-ok)" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x={W - 10} y={y(ind.target) - 7} textAnchor="end" fontSize="11" fontWeight="800" fill="var(--status-ok)">
        Target {formatNumber(ind.target, dec)} {unitShort}
      </text>
      <path d={`${d}L${x(last.m)},${H - 30}L${x(pts[0].m)},${H - 30}Z`} fill={`url(#traj-${ind.id})`} />
      <motion.path d={d} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: reduced ? 1 : 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.9 }} />
      <line x1={x(last.m)} y1={y(last.v)} x2={x(12)} y2={y(prog)} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 5" />
      <line x1={x(last.m)} y1={y(last.v)} x2={x(12)} y2={y(ind.target)} stroke="var(--status-ok)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 4" />
      {pts.map((p) => (
        <g key={p.id}>
          <circle cx={x(p.m)} cy={y(p.v)} r={p.id === period.id ? 6 : 4} fill={p.id === period.id ? '#fff' : '#f59e0b'} stroke="#f59e0b" strokeWidth="2" />
          <text x={x(p.m)} y={y(p.v) - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="#eaf2ff">
            {formatNumber(p.v, dec)}
          </text>
          <text x={x(p.m)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
            {p.short}
          </text>
        </g>
      ))}
      <circle cx={x(12)} cy={y(prog)} r="6" fill="var(--bg-navy)" stroke="#f59e0b" strokeWidth="2.5" />
      <text x={x(12)} y={H - 12} textAnchor="middle" fontSize="11" fontStyle="italic" fill="var(--gold-glow)">
        Des (P)
      </text>
      {/* gap bracket */}
      <g>
        <line x1={x(12) + 14} x2={x(12) + 14} y1={y(ind.target)} y2={y(prog)} stroke="var(--status-warn)" strokeWidth="3" />
        <rect x={x(12) - 150} y={y(prog) + 26} width="136" height="40" rx="10" fill="rgba(245,158,11,0.16)" stroke="var(--status-warn)" />
        <text x={x(12) - 82} y={y(prog) + 43} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="var(--status-warn)">
          Gap {formatNumber(gap, dec)} {unitShort}
        </text>
        <text x={x(12) - 82} y={y(prog) + 58} textAnchor="middle" fontSize="10.5" fill="#eaf2ff" fontStyle="italic">
          Prognosa {formatNumber(prog, dec)} · {formatPercent((prog / ind.target) * 100)}
        </text>
      </g>
    </svg>
  );
  const table = (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">Lintasan {ind.label}</caption>
        <thead>
          <tr>
            <th>Periode</th>
            <th className="text-right">Nilai ({ind.unit})</th>
            <th className="text-right">vs target tahunan</th>
          </tr>
        </thead>
        <tbody>
          {pts.map((p) => (
            <tr key={p.id}>
              <th scope="row">{p.short}</th>
              <td className="text-right tnum">{formatNumber(p.v, dec)}</td>
              <td className="text-right tnum">{formatPercent((p.v / ind.target) * 100)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="italic">
              Des (Prognosa)
            </th>
            <td className="text-right italic tnum">{formatNumber(prog, dec)}</td>
            <td className="text-right italic tnum">{formatPercent((prog / ind.target) * 100)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="glass p-5">
      <ChartTableToggle title={`${ind.label} (${ind.unit})`} chart={chart} table={table} />
    </div>
  );
}

function CrmSnapshot() {
  const crm = P().crm!;
  const tiles = [
    { icon: Trophy, l: 'Close Won', v: formatPercent(crm.won.pct), s: `${formatRupiahMiliar(crm.won.rupiah)} · ${formatNumber(crm.won.customers)} pelanggan`, c: 'var(--status-ok)' },
    { icon: XCircle, l: 'Close Lost', v: formatPercent(crm.lost.pct), s: `${formatRupiahMiliar(crm.lost.rupiah)} · ${formatNumber(crm.lost.customers)} pelanggan`, c: 'var(--status-crit)' },
    { icon: TrendingUp, l: 'Top revenue of the month', v: formatRupiahMiliar(crm.topRevenue.rupiah), s: crm.topRevenue.unit, c: 'var(--gold-glow)' },
    { icon: Users, l: 'Top customer of the month', v: `${formatNumber(crm.topCustomer.customers)} plg`, s: crm.topCustomer.unit, c: 'var(--prima-2)' },
  ];
  return (
    <div className="glass p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow mb-1" style={{ color: G }}>
            Snapshot Dashboard CRM
          </p>
          <h3 className="text-2xl font-extrabold">Pipeline pemasaran yang tercatat.</h3>
        </div>
        <span className="chip text-[var(--text-muted)]">{crm.range}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <t.icon size={20} style={{ color: t.c }} aria-hidden />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.l}</p>
            <p className="text-2xl font-extrabold tnum" style={{ color: t.c }}>
              {t.v}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t.s}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">Nama individu (top sales) hanya ditampilkan bila sudah ada izin.</p>
    </div>
  );
}

export function PrimaKhas() {
  const p = P();
  return (
    <div className="space-y-14">
      <div>
        <Reveal>
          <p className="eyebrow mb-2" style={{ color: G }}>
            5 Program Kerja Beyond Growth &amp; Productivity
          </p>
          <h3 className="h2 mb-8 !text-[clamp(1.5rem,3vw,2.4rem)]">{p.closingLine}</h3>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {p.highlights.map((h, i) => (
            <Reveal key={h.letter} delay={i * 0.06} className={i === 4 ? 'col-span-2 md:col-span-1' : ''}>
              <LetterCard h={h} i={i} />
            </Reveal>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4" style={{ color: G }}>
          System · Capaian vs target
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(p.gauges ?? []).map((g, i) => {
            const pct = (g.actual / g.target) * 100;
            const under = pct < 100;
            return (
              <Reveal key={g.label} delay={i * 0.06}>
                <div className="glass h-full p-4 text-center">
                  <Gauge pct={pct} label={`${g.label} ${formatPercent(pct)} ${g.basis}`} color={under ? 'var(--status-warn)' : C} color2={under ? '#fbbf24' : 'var(--prima-2)'} />
                  <p className="-mt-6 text-3xl font-extrabold tnum" style={{ color: under ? 'var(--status-warn)' : G }}>
                    {formatPercent(pct)}
                  </p>
                  <p className="mt-1 text-sm font-bold">{g.label}</p>
                  <p className="text-xs text-[var(--text-muted)] tnum">
                    {formatNumber(g.actual, g.actual % 1 ? 2 : 0)} / {formatNumber(g.target, g.target % 1 ? 2 : 0)} {g.unit}
                  </p>
                  <p className="mt-2 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-[var(--best-glow)]">{g.basis}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4" style={{ color: G }}>
          Lintasan penjualan &amp; produktivitas · gap prognosa
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          {p.indicators.map((ind) => (
            <Trajectory key={ind.id} ind={ind} unitShort={ind.unit === 'GWh' ? 'GWh' : 'GWh/peg'} />
          ))}
        </div>
      </div>

      <CrmSnapshot />

      <Reveal className="text-center">
        <p className="text-gold-grad text-3xl font-extrabold italic md:text-4xl">{p.taglineSub}</p>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-muted)]">{p.closingSub}</p>
      </Reveal>
    </div>
  );
}
