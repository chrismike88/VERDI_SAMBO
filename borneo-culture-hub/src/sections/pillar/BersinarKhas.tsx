import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { HardHat, Eye, ClipboardCheck, CalendarDays, CalendarRange, Infinity as InfinityIcon, ShieldCheck, TrendingDown, CheckCircle2, ShieldAlert, Repeat, HeartPulse, Quote, ArrowRight } from 'lucide-react';
import { pillarById, evidenceById } from '@/data';
import { cumulativeSeries, momChange, seriesAverage } from '@/lib/metrics';
import { formatNumber, formatPercent } from '@/lib/format';
import { ChartTableToggle } from '@/components/ui/ChartTableToggle';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { CountUp } from '@/components/ui/CountUp';
import { Reveal } from '@/components/ui/Reveal';

const P = () => pillarById('bersinar');
const PHASE_ICON = [HardHat, Eye, ClipboardCheck, CalendarDays, CalendarRange, InfinityIcon];
const C = 'var(--bersinar)';
const G = 'var(--bersinar-glow)';

function RitualStep({ r, i, n, progress }: { r: ReturnType<typeof P>['rituals'][number]; i: number; n: number; progress: MotionValue<number> }) {
  const Icon = PHASE_ICON[i];
  const reduced = useReducedMotion();
  const lit = useTransform(progress, [i / n, (i + 0.6) / n], [0.35, 1]);
  const ev = r.evidenceIds?.[0] ? evidenceById(r.evidenceIds[0]) : undefined;
  return (
    <motion.li style={{ opacity: reduced ? 1 : lit }} className="relative flex gap-4 md:flex-col md:gap-0">
      <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 md:mx-auto md:mb-4" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${C} 55%, #081634), #06122b)`, color: G, boxShadow: `0 0 24px -6px ${C}` }}>
        <Icon size={24} aria-hidden />
      </span>
      <div className="flex-1 rounded-2xl border border-[var(--border)] bg-white/[0.035] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: G }}>
          {String(i + 1).padStart(2, '0')} · {r.phase}
        </p>
        <h4 className="mt-1 font-extrabold leading-snug">{r.ritual}</h4>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--text-muted)]">
          {r.activities.map((a) => (
            <li key={a} className="flex gap-1.5">
              <CheckCircle2 size={13} className="mt-1 shrink-0" style={{ color: G }} aria-hidden /> {a}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-[var(--border)] pt-2 text-[12.5px]">
          <span className="font-bold text-[var(--gold-glow)]">Dampak: </span>
          {r.impact}
        </p>
        {ev && <ImageWithFallback src={ev.src} alt={ev.alt} label={ev.caption} accent={C} className="mt-3 aspect-[16/9] rounded-lg" />}
      </div>
    </motion.li>
  );
}

function RitualTimeline() {
  const p = P();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const prog = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const scale = useTransform(prog, [0, 1], [0, 1]);
  return (
    <div ref={ref}>
      <Reveal>
        <p className="eyebrow mb-2" style={{ color: G }}>
          Membangun Ritual Safety
        </p>
        <h3 className="h2 !text-[clamp(1.5rem,3vw,2.4rem)]">Keselamatan menyala di setiap tahap kerja.</h3>
      </Reveal>
      <div className="relative mt-8">
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-white/10 md:left-[8%] md:right-[8%] md:top-7 md:bottom-auto md:h-0.5 md:w-auto" aria-hidden />
        <motion.div className="absolute left-7 top-0 bottom-0 w-0.5 origin-top md:hidden" style={{ scaleY: reduced ? 1 : scale, background: `linear-gradient(180deg, ${G}, var(--gold))`, boxShadow: `0 0 12px ${C}` }} aria-hidden />
        <motion.div className="absolute left-[8%] right-[8%] top-7 hidden h-0.5 origin-left md:block" style={{ scaleX: reduced ? 1 : scale, background: `linear-gradient(90deg, ${G}, var(--gold))`, boxShadow: `0 0 12px ${C}` }} aria-hidden />
        <ol className="relative grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          {p.rituals.map((r, i) => (
            <RitualStep key={r.id} r={r} i={i} n={p.rituals.length} progress={prog} />
          ))}
        </ol>
      </div>
      {p.ritualTagline && (
        <Reveal className="mt-6 rounded-2xl border border-[var(--border)] p-5 text-center">
          <p className="font-extrabold">{p.ritualTagline}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{p.ritualTaglineSub}</p>
        </Reveal>
      )}
    </div>
  );
}

function WalkDownChart() {
  const p = P();
  const s = p.monthlySeries![0];
  const months = Object.keys(s.actual);
  const vals = Object.values(s.actual);
  const fm = s.forecastMonths ?? [];
  const fAvg = (s.forecastTotal ?? 0) / Math.max(1, fm.length);
  const all = [...months, ...fm];
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = seriesAverage(s.actual);
  const cum = cumulativeSeries(s.actual);
  const annotate = months.map((m) => ({ m, ch: momChange(s.actual, m) })).filter((x) => x.ch != null && x.ch > 40);
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const W = 720;
  const H = 280;
  const pl = 44;
  const pb = 30;
  const max = 1600;
  const bw = (W - pl - 10) / all.length;
  const y = (v: number) => H - pb - (v / max) * (H - pb - 20);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${pl + bw * i + bw / 2},${y(v)}`).join('');
  const tiles = [
    { l: `Realisasi ${months[0]}–${months[months.length - 1]}`, v: total, s: 'temuan', d: 0 },
    { l: 'Rata-rata aktual', v: Math.round(avg), s: 'temuan/bulan', d: 0 },
    { l: `Prognosa ${fm[0]}–${fm[fm.length - 1]}`, v: s.forecastTotal ?? 0, s: `±${formatNumber(fAvg)}/bulan`, d: 0 },
    { l: 'Proyeksi setahun', v: total + (s.forecastTotal ?? 0), s: 'temuan', d: 0 },
  ];
  const chart = (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Grafik temuan Walk Down per bulan ${months[0]}–${months[months.length - 1]} dengan prognosa ${fm.join(', ')}`}>
      <defs>
        <linearGradient id="wdBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6ee7b7" stopOpacity="0.85" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {[0, 400, 800, 1200, 1600].map((t) => (
        <g key={t}>
          <line x1={pl} x2={W} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.07)" />
          <text x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
            {formatNumber(t)}
          </text>
        </g>
      ))}
      {vals.map((v, i) => (
        <motion.rect key={i} x={pl + bw * i + bw * 0.18} width={bw * 0.64} rx="5" fill="url(#wdBar)" initial={{ y: H - pb, height: 0 }} animate={inView || reduced ? { y: y(v), height: H - pb - y(v) } : {}} transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : i * 0.05 }} />
      ))}
      {fm.map((m, k) => {
        const i = months.length + k;
        return <rect key={m} x={pl + bw * i + bw * 0.18} y={y(fAvg)} width={bw * 0.64} height={H - pb - y(fAvg)} rx="5" fill="rgba(247,183,49,0.08)" stroke="var(--gold)" strokeDasharray="5 4" />;
      })}
      <motion.path d={line} fill="none" stroke="#fff" strokeWidth="2" initial={{ pathLength: 0 }} animate={inView || reduced ? { pathLength: 1 } : {}} transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.4 }} />
      <line x1={pl + bw * months.length + bw / 2} x2={W - bw / 2} y1={y(fAvg)} y2={y(fAvg)} stroke="var(--gold)" strokeDasharray="5 4" strokeWidth="2" />
      {vals.map((v, i) => (
        <g key={i}>
          <circle cx={pl + bw * i + bw / 2} cy={y(v)} r="3.5" fill="#fff" />
          <text x={pl + bw * i + bw / 2} y={y(v) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#eaf2ff">
            {formatNumber(v)}
          </text>
        </g>
      ))}
      {annotate.map(({ m, ch }) => {
        const i = months.indexOf(m);
        return (
          <g key={m}>
            <rect x={pl + bw * i + bw / 2 - 30} y={y(s.actual[m]) - 44} width="60" height="18" rx="9" fill="var(--gold)" />
            <text x={pl + bw * i + bw / 2} y={y(s.actual[m]) - 31} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a1203">
              +{formatNumber(ch!, 1)}%
            </text>
          </g>
        );
      })}
      <text x={pl + bw * (months.length + 1) + bw / 2} y={y(fAvg) - 12} textAnchor="middle" fontSize="11" fontWeight="700" fontStyle="italic" fill="var(--gold-glow)">
        Prognosa ±{formatNumber(fAvg)}/bln
      </text>
      {all.map((m, i) => (
        <text key={m} x={pl + bw * i + bw / 2} y={H - 10} textAnchor="middle" fontSize="11.5" fontStyle={i >= months.length ? 'italic' : undefined} fill={i >= months.length ? 'var(--gold-glow)' : 'var(--text-muted)'}>
          {m}
        </text>
      ))}
    </svg>
  );
  const table = (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">Temuan Walk Down per bulan</caption>
        <thead>
          <tr>
            <th>Bulan</th>
            <th className="text-right">Temuan</th>
            <th className="text-right">Kumulatif</th>
            <th className="text-right">Perubahan</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={m}>
              <th scope="row">{m}</th>
              <td className="text-right tnum">{formatNumber(vals[i])}</td>
              <td className="text-right tnum">{formatNumber(cum[i])}</td>
              <td className="text-right tnum">{i ? formatPercent(momChange(s.actual, m)!, 1) : '—'}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="italic">
              {fm[0]}–{fm[fm.length - 1]} (prognosa)
            </th>
            <td className="text-right italic tnum">{formatNumber(s.forecastTotal ?? 0)}</td>
            <td className="text-right italic tnum">{formatNumber(total + (s.forecastTotal ?? 0))}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="glass p-5 md:p-7">
      <p className="eyebrow mb-1" style={{ color: G }}>
        Walk Down Care for Asset &amp; Care for Safety
      </p>
      <h3 className="mb-5 text-2xl font-extrabold">Temuan ditutup, bulan demi bulan.</h3>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.l} className={`rounded-2xl border border-[var(--border)] p-4 ${i === 2 ? 'prognosa border-dashed !border-[var(--gold)]' : ''}`} style={{ background: i === 3 ? 'linear-gradient(135deg, rgba(247,183,49,0.14), transparent)' : 'rgba(255,255,255,0.03)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.l}</p>
            <p className="text-3xl font-extrabold" style={{ color: i === 3 ? 'var(--gold-glow)' : G }}>
              <CountUp value={t.v} />
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t.s}</p>
          </div>
        ))}
      </div>
      <ChartTableToggle title="Tren bulanan (aktual vs prognosa)" chart={chart} table={table} />
    </div>
  );
}

function BehaviourChange() {
  const p = P();
  const bc = p.behaviourChange!;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-100px' });
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (reduced) {
      setPhase(1);
      return;
    }
    if (!inView) return;
    const t = setInterval(() => setPhase((x) => (x + 1) % 2), 3800);
    const first = setTimeout(() => setPhase(1), 900);
    return () => {
      clearInterval(t);
      clearTimeout(first);
    };
  }, [inView, reduced]);
  return (
    <div ref={ref} className="glass relative overflow-hidden p-6 md:p-8">
      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(600px 200px at 80% 50%, ${C}, transparent)` }} aria-hidden />
      <p className="eyebrow relative mb-4" style={{ color: G }}>
        Behaviour Change
      </p>
      <div className="relative grid items-center gap-4 md:grid-cols-[auto_auto_1fr]">
        <span className={`text-xl font-bold transition-all duration-500 ${phase ? 'text-white/40 line-through decoration-[var(--status-crit)] decoration-2' : 'text-white'}`}>“{bc.from}”</span>
        <ArrowRight className="hidden md:block" style={{ color: 'var(--gold)' }} aria-hidden />
        <div className="min-h-[64px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.p key="to" initial={{ opacity: 0, filter: 'blur(8px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.6 }} className="text-xl font-extrabold leading-snug md:text-2xl">
                <span className="text-gold-grad">“{bc.to}”</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const IMPACT_ICON = [ShieldCheck, TrendingDown, CheckCircle2, HardHat];
const SIDAK_ICON = [ShieldAlert, CheckCircle2, Repeat, HeartPulse];

export function BersinarKhas() {
  const p = P();
  return (
    <div className="space-y-12">
      <RitualTimeline />
      <WalkDownChart />
      <div>
        <Reveal>
          <p className="eyebrow mb-2" style={{ color: G }}>
            Dampak Penguatan Budaya Safety UID Kaltimra
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {p.highlights.map((h, i) => {
            const Icon = IMPACT_ICON[i % 4];
            return (
              <Reveal key={h.title} delay={i * 0.06}>
                <div className="glass glass-hover h-full p-5" style={{ '--accent': C } as React.CSSProperties}>
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${C} 22%, transparent)`, color: G }}>
                    <Icon size={22} aria-hidden />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h.title}</p>
                  <p className="mt-1 text-xl font-extrabold" style={{ color: G }}>
                    {h.subtitle}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">{h.points[0]}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
      <BehaviourChange />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="eyebrow mb-3" style={{ color: G }}>
            Dampak Sidak Manajemen
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(p.sidakImpact ?? []).map((s, i) => {
              const Icon = SIDAK_ICON[i % 4];
              return (
                <div key={s.title} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
                  <Icon size={20} className="mt-0.5 shrink-0" style={{ color: G }} aria-hidden />
                  <div>
                    <p className="font-extrabold">{s.title}</p>
                    <p className="text-[13px] text-[var(--text-muted)]">{s.points[0]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Reveal className="glass relative flex flex-col justify-center overflow-hidden p-7">
          <Quote size={40} className="absolute right-5 top-5 opacity-20" style={{ color: G }} aria-hidden />
          <p className="text-2xl font-extrabold leading-snug md:text-3xl">
            “{p.closingLine.replace('dimulai dari saya.', '')}
            <span className="text-gold-grad">dimulai dari saya.</span>”
          </p>
          <p className="mt-3 text-sm font-semibold tracking-wide" style={{ color: G }}>
            {p.closingSub}
          </p>
        </Reveal>
      </div>
    </div>
  );
}
