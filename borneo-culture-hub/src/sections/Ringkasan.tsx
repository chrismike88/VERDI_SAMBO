import { motion } from 'motion/react';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { data } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { pillarStatus, indicatorStatus } from '@/lib/status';
import { dnaAverage, dnaPeriodFor } from '@/lib/metrics';
import { formatDelta, formatNumber, formatUnit, formatPercent } from '@/lib/format';
import { PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressRing } from '@/components/ui/ProgressRing';

export function Ringkasan() {
  const { period } = usePeriod();
  const dna = dnaPeriodFor(data, period.id);
  return (
    <section id="ringkasan" aria-labelledby="ringkasan-title" className="section section-alt">
      <div className="container-x">
        <SectionHeader id="ringkasan-title" eyebrow={`Scoreboard · ${period.label}`} title={<>Tiga pilar, <span className="text-gold-grad">satu pandangan.</span></>} subtitle="Status dihitung otomatis dari aturan transparan, ditampilkan berdampingan dengan laporan unit." />
        <div className="grid gap-5 lg:grid-cols-3">
          {data.pillars.map((p, i) => {
            const S = PILLAR_STYLE[p.id];
            const Icon = S.icon;
            const ps = pillarStatus(p, data, period);
            const avg = dna.current ? dnaAverage(p, dna.current) : null;
            const prevAvg = dna.previous ? dnaAverage(p, dna.previous) : null;
            return (
              <motion.a
                key={p.id}
                href={`#${p.id}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="glass glass-hover group flex flex-col overflow-hidden"
                style={{ '--accent': S.color } as React.CSSProperties}
                aria-label={`${p.code} ${p.name}: ${ps.status}`}
              >
                <div className="relative h-28 overflow-hidden">
                  <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_35%] opacity-55 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, #081634 92%), linear-gradient(90deg, color-mix(in srgb, ${S.color} 30%, transparent), transparent)` }} />
                  <div className="absolute bottom-3 left-5 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 backdrop-blur" style={{ background: `color-mix(in srgb, ${S.color} 30%, transparent)`, color: S.glow }}>
                      <Icon size={22} aria-hidden />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: S.glow }}>
                        {p.code} · {p.focus}
                      </p>
                      <h3 className="text-xl font-extrabold">{p.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-5 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={ps.status} size="lg" />
                    {p.selfReportedProgress && (
                      <span className="chip !text-[11px] text-[var(--text-muted)]">
                        <ClipboardCheck size={12} aria-hidden /> Laporan unit: {p.selfReportedProgress}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    <ProgressRing value={ps.okCount} max={Math.max(1, ps.total)} color={S.color} color2="var(--gold-glow)" label={`${ps.okCount} dari ${ps.total} indikator On Track atau Melampaui`}>
                      <span className="text-2xl font-extrabold tnum">
                        {ps.okCount}/{ps.total}
                      </span>
                    </ProgressRing>
                    <p className="text-sm text-[var(--text-muted)]">
                      <strong className="text-[var(--text)]">{ps.okCount} dari {ps.total}</strong> indikator lagging On Track / Melampaui pada {period.short}.
                    </p>
                  </div>
                  <ul className="grid gap-2.5">
                    {p.keyIndicatorIds.map((id) => {
                      const ind = p.indicators.find((x) => x.id === id)!;
                      const st = indicatorStatus(ind, data, period);
                      return (
                        <li key={id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
                          <span className="text-[13px] text-[var(--text-muted)]">{ind.label}</span>
                          <span className={`text-right ${period.isPrognosa ? 'prognosa' : ''}`}>
                            <span className="block font-extrabold tnum">{st.value == null ? '—' : formatUnit(st.value, ind.unit, ind.decimals ?? 0, ind.approx)}</span>
                            {st.pct != null && ind.type === 'cumulative' && <span className="block text-[11px] text-[var(--text-muted)] tnum">{formatPercent(st.pct)}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
                    <div>
                      <p className="eyebrow !text-[10.5px]">Rata-rata Culture DNA</p>
                      {avg != null ? (
                        <p className="mt-1 flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold tnum" style={{ color: S.glow }}>
                            {formatNumber(avg, 2)}
                          </span>
                          {prevAvg != null && <span className="text-xs font-bold text-[var(--status-ok)] tnum">{formatDelta(avg - prevAvg)} vs {data.periods.find((x) => x.id === dna.previous)?.short}</span>}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--status-na)]">Data belum tersedia</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: S.glow }}>
                      Selengkapnya <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
