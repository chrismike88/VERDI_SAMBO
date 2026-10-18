import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Database, Users, Ear, Wrench, Zap, Pause, Play, TrendingDown, HeartHandshake } from 'lucide-react';
import { data, pillarById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { indicatorStatus } from '@/lib/status';
import { formatNumber, formatPercent, formatUnit } from '@/lib/format';
import { pctChange } from '@/lib/metrics';
import { StatusPill } from '@/components/ui/StatusPill';
import { Sparkline } from '@/components/ui/Sparkline';
import { Reveal } from '@/components/ui/Reveal';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const P = () => pillarById('best');
const C = 'var(--best)';
const G = 'var(--best-glow)';
const ICONS = [Database, Users, Ear, Wrench, Zap];

function ProgramDetail({ idx }: { idx: number }) {
  const p = P();
  const { period } = usePeriod();
  const pr = p.programs[idx];
  const sym = p.symbols.find((s) => s.program === pr.name);
  const inds = (pr.indicatorIds ?? []).map((id) => p.indicators.find((x) => x.id === id)!).filter(Boolean);
  return (
    <motion.div key={pr.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="glass h-full p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: G }}>
        {String(idx + 1).padStart(2, '0')} · {pr.action}
      </p>
      <h4 className="text-2xl font-extrabold">{pr.name}</h4>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{pr.description}</p>
      <div className="mt-4 space-y-3">
        {inds.map((ind) => {
          const st = indicatorStatus(ind, data, period);
          return (
            <div key={ind.id} className="rounded-xl bg-black/25 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-[var(--text-muted)]">{ind.label}</span>
                <StatusPill status={st.status} size="sm" />
              </div>
              <p className={`mt-1 text-2xl font-extrabold tnum ${period.isPrognosa ? 'prognosa' : ''}`}>
                {st.value == null ? '—' : formatUnit(st.value, ind.unit, ind.decimals ?? 0, ind.approx)} <span className="text-sm font-semibold text-[var(--text-muted)]">/ target {ind.targetLabel}</span>
              </p>
              <Sparkline height={40} color={C} target={ind.target} label={`Tren ${ind.label}`} points={data.periods.map((pp) => ({ label: pp.short, value: ind.values[pp.id] ?? null, prognosa: pp.isPrognosa, active: pp.id === period.id }))} />
            </div>
          );
        })}
      </div>
      {sym && (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow !text-[10px]">Ritual</dt>
            <dd>{sym.ritual}</dd>
          </div>
          <div>
            <dt className="eyebrow !text-[10px]">Reward &amp; Consequence</dt>
            <dd>{sym.rewardConsequence.join(' · ')}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="eyebrow !text-[10px]">Dampak</dt>
            <dd className="text-[var(--gold-glow)]">{sym.impact}</dd>
          </div>
        </dl>
      )}
    </motion.div>
  );
}

function ServiceOrbit() {
  const p = P();
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 900px)');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const n = p.programs.length;
  useEffect(() => {
    if (reduced || paused || hover) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4000);
    return () => clearInterval(t);
  }, [reduced, paused, hover, n]);

  if (!desktop) {
    return (
      <div className="space-y-4">
        <ol className="space-y-3">
          {p.programs.map((pr, i) => {
            const Icon = ICONS[i];
            const on = i === active;
            return (
              <li key={pr.id}>
                <button onClick={() => setActive(i)} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-[var(--best-glow)] bg-white/[0.07]' : 'border-[var(--border)] bg-white/[0.03]'}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${C} 30%, transparent)`, color: G }}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: G }}>
                      {String(i + 1).padStart(2, '0')} · {pr.action}
                    </span>
                    <span className="block font-extrabold">{pr.name}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <AnimatePresence mode="wait">
          <ProgramDetail idx={active} />
        </AnimatePresence>
      </div>
    );
  }

  const R = 200;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,520px)_1fr]" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <div className="absolute inset-[8%] rounded-full border border-dashed border-[var(--best-glow)]/30" style={{ animation: reduced ? undefined : 'orbit-spin 60s linear infinite' }} aria-hidden />
        <div className="absolute inset-[20%] rounded-full border border-[var(--border)]" aria-hidden />
        <div className="absolute inset-[30%] grid place-items-center rounded-full text-center" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45), rgba(8,22,52,0.9) 70%)', boxShadow: '0 0 80px -10px rgba(59,130,246,0.7)' }}>
          <div>
            <HeartHandshake size={30} className="mx-auto mb-1 text-[var(--gold-glow)]" aria-hidden />
            <p className="text-lg font-extrabold leading-tight">
              Kepuasan
              <br />
              Pelanggan
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--best-glow)]">Empati · Proaktif · Solutif</p>
          </div>
        </div>
        {p.programs.map((pr, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + (Math.cos(a) * R * 100) / 520;
          const y = 50 + (Math.sin(a) * R * 100) / 520;
          const Icon = ICONS[i];
          const on = i === active;
          return (
            <button
              key={pr.id}
              onClick={() => setActive(i)}
              aria-pressed={on}
              aria-label={`${String(i + 1).padStart(2, '0')} ${pr.action}: ${pr.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <motion.span animate={{ scale: on ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2" style={{ borderColor: on ? 'var(--gold)' : 'rgba(125,211,252,0.35)', background: on ? 'linear-gradient(160deg,#ffe08a,#f7b731)' : 'linear-gradient(160deg,#1d4ed8,#081634)', color: on ? '#1a1203' : G, boxShadow: on ? '0 0 40px -4px var(--gold)' : '0 0 20px -8px var(--best)' }}>
                <Icon size={26} aria-hidden />
              </motion.span>
              <span className={`mt-2 block w-32 text-[12px] font-extrabold leading-tight ${on ? 'text-white' : 'text-[var(--text-muted)]'}`}>{pr.name}</span>
            </button>
          );
        })}
        {!reduced && (
          <button onClick={() => setPaused((x) => !x)} className="chip absolute bottom-0 right-0 hover:bg-white/10" aria-label={paused ? 'Lanjutkan rotasi sorotan' : 'Jeda rotasi sorotan'}>
            {paused ? <Play size={12} aria-hidden /> : <Pause size={12} aria-hidden />} {paused ? 'Putar' : 'Jeda'}
          </button>
        )}
      </div>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          <ProgramDetail idx={active} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function BestAcrostic() {
  const p = P();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {p.highlights.map((h, i) => (
        <Reveal key={h.title} delay={i * 0.07}>
          <div className="glass glass-hover relative h-full overflow-hidden p-5" style={{ '--accent': C } as React.CSSProperties}>
            <span className="pointer-events-none absolute -right-3 -top-8 text-[140px] font-extrabold leading-none text-white/[0.05]" aria-hidden>
              {h.letter}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-gold-grad text-5xl font-extrabold leading-none">{h.letter}</span>
              <div>
                <p className="text-lg font-extrabold uppercase">{h.title}</p>
                <p className="text-[12px] font-semibold" style={{ color: G }}>
                  {h.subtitle}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-[var(--text-muted)]">
              {h.points.map((pt) => (
                <li key={pt} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--gold)' }} />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function GangguanCompare() {
  const p = P();
  const comps = p.comparisons ?? [];
  return (
    <div className="glass p-5 md:p-7">
      <p className="eyebrow mb-1" style={{ color: G }}>
        Serving · Gangguan 2025 vs 2026
      </p>
      <h3 className="mb-6 text-2xl font-extrabold">Gangguan turun tajam pada 2026.</h3>
      <div className="grid gap-6 md:grid-cols-3">
        {comps.map((c, i) => {
          const ch = pctChange(c.before, c.after);
          const max = Math.max(c.before, c.after);
          return (
            <Reveal key={c.label} delay={i * 0.08}>
              <p className="mb-3 text-sm font-bold">{c.label}</p>
              {[
                { l: c.beforeLabel, v: c.before, col: 'rgba(157,178,211,0.45)' },
                { l: c.afterLabel, v: c.after, col: 'linear-gradient(90deg, var(--best), var(--best-glow))' },
              ].map((r) => (
                <div key={r.l} className="mb-2 flex items-center gap-3">
                  <span className="w-10 text-xs font-bold text-[var(--text-muted)]">{r.l}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/5">
                    <motion.div className="flex h-full items-center justify-end rounded-lg pr-2 text-xs font-extrabold tnum" style={{ background: r.col }} initial={{ width: 0 }} whileInView={{ width: `${(r.v / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                      {formatNumber(r.v)}
                    </motion.div>
                  </div>
                </div>
              ))}
              <p className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold text-[var(--status-ok)] tnum">
                <TrendingDown size={20} aria-hidden /> {formatPercent(ch, 1).replace('-', '−')}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{c.unit}</p>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function ProgramMiniCharts() {
  const p = P();
  const { period } = usePeriod();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {p.programs.map((pr, i) => {
        const ind = p.indicators.find((x) => x.id === pr.indicatorIds?.[0]);
        if (!ind) return null;
        const st = indicatorStatus(ind, data, period);
        const Icon = ICONS[i];
        return (
          <Reveal key={pr.id} delay={i * 0.05}>
            <div className="glass h-full p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon size={16} style={{ color: G }} aria-hidden />
                <p className="text-[12px] font-extrabold">{pr.name}</p>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">Target {ind.targetLabel}</p>
              <p className={`text-xl font-extrabold tnum ${period.isPrognosa ? 'prognosa' : ''}`}>{st.value == null ? '—' : formatUnit(st.value, ind.unit, ind.decimals ?? 0, ind.approx)}</p>
              <Sparkline height={44} color={C} target={ind.target} label={`Tren ${ind.label}`} points={data.periods.map((pp) => ({ label: pp.short, value: ind.values[pp.id] ?? null, prognosa: pp.isPrognosa, active: pp.id === period.id }))} />
              <StatusPill status={st.status} size="sm" />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function BestKhas() {
  const p = P();
  return (
    <div className="space-y-14">
      <div>
        <Reveal>
          <p className="eyebrow mb-2" style={{ color: G }}>
            Siklus Beyond Service
          </p>
          <h3 className="h2 mb-8 !text-[clamp(1.5rem,3vw,2.4rem)]">Lima aksi, satu pelanggan yang bahagia.</h3>
        </Reveal>
        <ServiceOrbit />
      </div>
      <div>
        <Reveal>
          <p className="eyebrow mb-4" style={{ color: G }}>
            System · Dashboard Pencapaian Kinerja untuk Kepuasan Pelanggan
          </p>
        </Reveal>
        <BestAcrostic />
      </div>
      <GangguanCompare />
      <div>
        <p className="eyebrow mb-4" style={{ color: G }}>
          Mini chart per program · Business Focus Alignment
        </p>
        <ProgramMiniCharts />
      </div>
      <Reveal className="text-center">
        <p className="text-2xl font-extrabold md:text-3xl">
          {p.closingLine.split('. ')[0]}. <span className="text-gold-grad">{p.closingLine.split('. ').slice(1).join('. ')}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{p.closingSub}</p>
      </Reveal>
    </div>
  );
}
