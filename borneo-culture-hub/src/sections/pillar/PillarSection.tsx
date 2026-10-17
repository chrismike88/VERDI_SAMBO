import { motion } from 'motion/react';
import { Target, Flag, Sparkles } from 'lucide-react';
import type { Pillar } from '@/data/schema';
import { data } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { pillarStatus } from '@/lib/status';
import { PILLAR_STYLE } from '@/config/pillars';
import { StatusPill } from '@/components/ui/StatusPill';
import { KpiCard } from '@/components/ui/KpiCard';
import { Reveal } from '@/components/ui/Reveal';
import { LensaPanel } from './LensaPanel';

export function PillarSection({ pillar, alt, children }: { pillar: Pillar; alt?: boolean; children: React.ReactNode }) {
  const { period } = usePeriod();
  const S = PILLAR_STYLE[pillar.id];
  const Icon = S.icon;
  const ps = pillarStatus(pillar, data, period);
  return (
    <section id={pillar.id} aria-labelledby={`${pillar.id}-title`} className={`section overflow-hidden ${alt ? 'section-alt' : ''}`} style={{ '--accent': S.color } as React.CSSProperties}>
      <div className="pointer-events-none absolute right-[-12%] top-[6%] h-[520px] w-[520px] rounded-full opacity-20 blur-[120px]" style={{ background: S.color }} aria-hidden />
      <div className="container-x relative">
        {/* Header */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="eyebrow mb-4 flex items-center gap-3" style={{ color: S.glow }}>
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${S.color} 22%, transparent)` }}>
                <Icon size={18} aria-hidden />
              </span>
              {pillar.code} · {pillar.focus}
            </motion.p>
            <Reveal>
              <h2 id={`${pillar.id}-title`} className="display !text-[clamp(2.5rem,6.5vw,5rem)]">
                <span className="text-silver-grad">BORNEO </span>
                <span className="text-gold-grad">{pillar.name.replace('Borneo ', '').toUpperCase()}</span>
              </h2>
              <p className="mt-3 text-xl font-semibold" style={{ color: S.glow }}>
                {pillar.tagline}
              </p>
              {pillar.taglineSub && <p className="mt-1 text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">{pillar.taglineSub}</p>}
            </Reveal>
            <Reveal delay={0.1} className="mt-6 flex flex-wrap items-center gap-2">
              <StatusPill status={ps.status} size="lg" />
              {pillar.dnaValues.map((v) => (
                <span key={v} className="chip" style={{ borderColor: `color-mix(in srgb, ${S.color} 40%, transparent)` }}>
                  <Sparkles size={12} style={{ color: S.glow }} aria-hidden /> {v}
                </span>
              ))}
            </Reveal>
            <Reveal delay={0.15} className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="glass flex items-center gap-3 p-4">
                <Target size={22} style={{ color: S.glow }} aria-hidden />
                <div>
                  <p className="eyebrow !text-[10.5px]">Business Target</p>
                  <p className="font-extrabold">{pillar.businessTarget}</p>
                </div>
              </div>
              <div className="glass flex items-center gap-3 p-4">
                <Flag size={22} className="text-[var(--gold)]" aria-hidden />
                <div>
                  <p className="eyebrow !text-[10.5px]">Ultimate Target {data.meta.year}</p>
                  <p className="font-extrabold">{pillar.ultimateTarget}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="mt-4 flex flex-wrap gap-2">
              <span className="eyebrow mr-1 self-center !text-[10.5px]">KPI Fokus Bisnis</span>
              {pillar.kpiFokus.map((k) => (
                <span key={k.label} className="chip" title={k.source}>
                  {k.label} <span className="text-[var(--gold-glow)]">{k.targetLabel}</span>
                  {k.value === null && <span className="text-[var(--status-na)]">· ⏳ Menunggu Data</span>}
                </span>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.1} className="relative mx-auto hidden w-full max-w-[340px] lg:block">
            <div className="absolute -inset-6 rounded-[32px] opacity-50 blur-2xl" style={{ background: `radial-gradient(circle, ${S.color}, transparent 70%)` }} aria-hidden />
            <img src={pillar.cover} alt={`Poster ${pillar.name}: ${pillar.tagline}`} loading="lazy" className="relative aspect-[9/14] w-full rounded-[28px] border border-white/10 object-cover object-top shadow-2xl" />
          </Reveal>
        </div>

        {/* KPI band */}
        <div className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-xl font-extrabold">Lagging Indikator</h3>
            <p className={`text-sm text-[var(--text-muted)] ${period.isPrognosa ? 'prognosa' : ''}`}>Periode: {period.label}</p>
          </div>
          <div className={`grid gap-4 sm:grid-cols-2 ${pillar.indicators.length > 4 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
            {pillar.indicators.map((ind) => (
              <KpiCard key={ind.id} ind={ind} accent={S.color} />
            ))}
          </div>
        </div>

        {/* Visual khas */}
        <div id={`${pillar.id}-khas`} className="mt-16 scroll-mt-24">
          {children}
        </div>

        {/* Lensa */}
        <div id={`${pillar.id}-lensa`} className="mt-16 scroll-mt-24">
          <LensaPanel pillar={pillar} />
        </div>
      </div>
    </section>
  );
}
