import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { TrendingUp, Crown, Target } from 'lucide-react';
import { data } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { allDnaValues, dnaAverage, dnaPeriodFor } from '@/lib/metrics';
import { formatDelta, formatNumber } from '@/lib/format';
import { PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ChartTableToggle } from '@/components/ui/ChartTableToggle';
import { Reveal } from '@/components/ui/Reveal';

const MIN = 4;
const MAX = 5;

export function CultureDna() {
  const { period } = usePeriod();
  const reduced = useReducedMotion();
  const dp = dnaPeriodFor(data, period.id);
  const cur = dp.current ?? '2026-09';
  const prev = dp.current ? dp.previous : '2026-08';
  const vals = allDnaValues(data);
  const [filter, setFilter] = useState<string>('all');
  const [sel, setSel] = useState(vals[0].id);
  const lbl = (id?: string) => data.periods.find((p) => p.id === id)?.short ?? '';
  const n = vals.length;
  const R = 150;
  const cx = 200;
  const cy = 190;
  const pt = (i: number, v: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = ((Math.max(MIN, v) - MIN) / (MAX - MIN)) * R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const poly = (pid?: string) => (pid ? vals.map((v, i) => pt(i, v.scores[pid] ?? MIN).join(',')).join(' ') : '');
  const withDelta = prev ? vals.map((v) => ({ v, d: (v.scores[cur] ?? 0) - (v.scores[prev] ?? 0) })) : [];
  const up = withDelta.length ? withDelta.reduce((a, b) => (b.d > a.d ? b : a)) : null;
  const scores = vals.map((v) => v.scores[cur] ?? 0);
  const top = vals.filter((v) => v.scores[cur] === Math.max(...scores));
  const low = vals.filter((v) => v.scores[cur] === Math.min(...scores));
  const selected = vals.find((v) => v.id === sel)!;
  const selPillar = data.pillars.find((p) => p.id === selected.pillarId)!;

  const chart = (
    <svg viewBox="-70 0 540 390" className="mx-auto w-full max-w-[600px]" role="img" aria-label={`Radar Culture DNA 9 nilai, ${lbl(prev)} vs ${lbl(cur)}`}>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={vals.map((_, i) => pt(i, MIN + k * (MAX - MIN)).join(',')).join(' ')} fill="none" stroke="rgba(148,197,255,0.14)" />
      ))}
      {vals.map((v, i) => {
        const [x, y] = pt(i, MAX);
        const [lx, ly] = pt(i, MAX + 0.2);
        const S = PILLAR_STYLE[v.pillarId];
        const dim = filter !== 'all' && filter !== v.pillarId;
        return (
          <g key={v.id} opacity={dim ? 0.25 : 1}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(148,197,255,0.14)" />
            <text x={lx} y={ly} textAnchor={lx < cx - 10 ? 'end' : lx > cx + 10 ? 'start' : 'middle'} dominantBaseline="middle" fontSize="11" fontWeight="800" fill={S.glow} style={{ cursor: 'pointer' }} onClick={() => setSel(v.id)}>
              {v.name}
            </text>
          </g>
        );
      })}
      <text x={cx + 4} y={cy - R - 4} fontSize="8.5" fill="var(--text-muted)">
        {formatNumber(MAX, 2)}
      </text>
      <text x={cx + 4} y={cy - 2} fontSize="8.5" fill="var(--text-muted)">
        {formatNumber(MIN, 2)}
      </text>
      {prev && <polygon points={poly(prev)} fill="rgba(157,178,211,0.12)" stroke="rgba(157,178,211,0.7)" strokeDasharray="4 3" strokeWidth="1.5" />}
      <motion.polygon
        key={cur}
        initial={{ points: reduced || !prev ? poly(cur) : poly(prev) } as never}
        whileInView={{ points: poly(cur) } as never}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        fill="rgba(247,183,49,0.18)"
        stroke="var(--gold)"
        strokeWidth="2.5"
        style={{ filter: 'drop-shadow(0 0 10px rgba(247,183,49,0.5))' }}
      />
      {vals.map((v, i) => {
        const [x, y] = pt(i, v.scores[cur] ?? MIN);
        return <circle key={v.id} cx={x} cy={y} r={v.id === sel ? 5.5 : 3.5} fill={v.id === sel ? '#fff' : 'var(--gold)'} />;
      })}
    </svg>
  );
  const table = (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">Skor Culture DNA per nilai</caption>
        <thead>
          <tr>
            <th>Nilai</th>
            <th>Pilar</th>
            {prev && <th className="text-right">{lbl(prev)}</th>}
            <th className="text-right">{lbl(cur)}</th>
            {prev && <th className="text-right">Δ</th>}
          </tr>
        </thead>
        <tbody>
          {vals.map((v) => (
            <tr key={v.id}>
              <th scope="row">{v.name}</th>
              <td>{PILLAR_STYLE[v.pillarId].short}</td>
              {prev && <td className="text-right tnum">{formatNumber(v.scores[prev] ?? 0, 2)}</td>}
              <td className="text-right font-extrabold tnum">{formatNumber(v.scores[cur] ?? 0, 2)}</td>
              {prev && <td className="text-right tnum text-[var(--status-ok)]">{formatDelta((v.scores[cur] ?? 0) - (v.scores[prev] ?? 0))}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section id="culture-dna" aria-labelledby="dna-title" className="section section-alt overflow-hidden">
      <div className="container-x">
        <SectionHeader id="dna-title" eyebrow="Culture DNA Activation · 9 nilai" title={<>DNA budaya yang <span className="text-gold-grad">terus menguat.</span></>} subtitle={`Skor survei perilaku (skala 1–5) — ${lbl(prev)} dibanding ${lbl(cur)}. Klik nama nilai untuk melihat 5 perilaku kuncinya.`} />
        {!dp.current && (
          <p className="mb-6 rounded-xl border border-[var(--border)] bg-white/[0.03] p-3 text-sm text-[var(--status-na)]">
            ⏳ Data Culture DNA untuk {period.label} belum tersedia. Ditampilkan survei terakhir ({lbl(prev)} → {lbl(cur)}).
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass p-5 md:p-7">
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter pilar">
              {[{ id: 'all', label: 'Semua' }, ...data.pillars.map((p) => ({ id: p.id, label: p.focus }))].map((f) => (
                <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? '!bg-white/15 !text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                  {f.label}
                </button>
              ))}
              <span className="ml-auto flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-5 border-t-2 border-dashed border-[#9db2d3]" /> {lbl(prev)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-5 bg-[var(--gold)]" /> {lbl(cur)}
                </span>
              </span>
            </div>
            <ChartTableToggle title="Radar 9 nilai (sumbu mulai 4,00)" chart={chart} table={table} />
          </div>
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                up && { icon: TrendingUp, l: 'Kenaikan terbesar', v: `${up.v.name}`, s: formatDelta(up.d), c: 'var(--status-ok)' },
                { icon: Crown, l: 'Skor tertinggi', v: top.map((t) => t.name).join(' & '), s: formatNumber(top[0].scores[cur]!, 2), c: 'var(--gold-glow)' },
                { icon: Target, l: 'Skor terendah', v: low.map((t) => t.name).join(' & '), s: formatNumber(low[0].scores[cur]!, 2), c: 'var(--best-glow)' },
              ]
                .filter(Boolean)
                .map((x) => {
                  const t = x as { icon: typeof Crown; l: string; v: string; s: string; c: string };
                  return (
                    <div key={t.l} className="glass p-4">
                      <t.icon size={18} style={{ color: t.c }} aria-hidden />
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.l}</p>
                      <p className="font-extrabold leading-tight">{t.v}</p>
                      <p className="text-2xl font-extrabold tnum" style={{ color: t.c }}>
                        {t.s}
                      </p>
                    </div>
                  );
                })}
            </div>
            <div className="glass p-5">
              <p className="eyebrow mb-4">Rata-rata per pilar</p>
              <div className="space-y-4">
                {data.pillars.map((p) => {
                  const a = prev ? dnaAverage(p, prev) : null;
                  const b = dnaAverage(p, cur);
                  const S = PILLAR_STYLE[p.id];
                  return (
                    <div key={p.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-bold">{S.short}</span>
                        <span className="tnum">
                          {a != null && <span className="text-[var(--text-muted)]">{formatNumber(a, 2)} → </span>}
                          <strong style={{ color: S.glow }}>{b != null ? formatNumber(b, 2) : '—'}</strong>
                          {a != null && b != null && <span className="ml-2 text-xs font-bold text-[var(--status-ok)]">{formatDelta(b - a)}</span>}
                        </span>
                      </div>
                      <div className="relative h-3 overflow-hidden rounded-full bg-white/8">
                        {a != null && <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${((a - MIN) / (MAX - MIN)) * 100}%` }} />}
                        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: `linear-gradient(90deg, ${S.color}, ${S.glow})` }} initial={{ width: 0 }} whileInView={{ width: `${b != null ? ((b - MIN) / (MAX - MIN)) * 100 : 0}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="glass p-5">
              <label htmlFor="dna-select" className="eyebrow mb-2 block">
                5 perilaku kunci
              </label>
              <select id="dna-select" value={sel} onChange={(e) => setSel(e.target.value)} className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[#081634] px-3 py-2 font-bold">
                {vals.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {PILLAR_STYLE[v.pillarId].short}
                  </option>
                ))}
              </select>
              <p className="text-sm text-[var(--text-muted)]">
                <strong style={{ color: PILLAR_STYLE[selPillar.id].glow }}>{selected.name}</strong> — {selected.definition}
              </p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {selected.behaviors.map((b, i) => (
                  <li key={b} className="flex gap-2">
                    <span className="font-extrabold text-[var(--gold)] tnum">{i + 1}.</span> {b}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <Reveal className="mt-12 text-center">
          <p className="text-2xl font-extrabold md:text-3xl">
            “One Ranger can start a change, <span className="text-gold-grad">together we create the culture!</span>”
          </p>
        </Reveal>
      </div>
    </section>
  );
}
