import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Presentation, CalendarCheck, RefreshCw } from 'lucide-react';
import { data, pillarById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { BorneoMap } from '@/components/visuals/BorneoMap';
import { Starfield } from '@/components/visuals/Starfield';
import { EnergyLine } from '@/components/visuals/EnergyLine';
import { CountUp } from '@/components/ui/CountUp';
import { PILLAR_STYLE } from '@/config/pillars';
import { formatDate, formatPercent, unitSuffix } from '@/lib/format';
import { indicatorStatus } from '@/lib/status';
import { latestActualPeriod } from '@/lib/metrics';

export function Hero({ onPresent }: { onPresent: () => void }) {
  const { period } = usePeriod();
  const reduced = useReducedMotion();
  const latest = latestActualPeriod(data);
  const fade = (delay: number) => ({ initial: { opacity: 0, y: reduced ? 0 : 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : 0.7, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <section id="beranda" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--nav-h)+28px)] pb-24 lg:pb-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1100px_700px_at_75%_40%,rgba(0,163,224,0.22),transparent_65%),radial-gradient(900px_600px_at_10%_90%,rgba(29,78,216,0.25),transparent_60%),linear-gradient(180deg,#040a1c,#06122b_60%,#040a1c)]" />
      <div className="grid-bg absolute inset-0 -z-10 opacity-60" aria-hidden />
      <Starfield className="-z-10" />
      <EnergyLine className="absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full opacity-80" />

      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.p {...fade(0.05)} className="eyebrow mb-5 !text-[var(--best-glow)]">
            Program Budaya PLN 1·2·3 · UID Kalimantan Timur &amp; Kalimantan Utara
          </motion.p>
          <h1 id="hero-title" className="display !text-[clamp(2.6rem,5.6vw,5rem)]">
            <span className="block whitespace-nowrap text-silver-grad">Beyond Safety.</span>
            <span className="block whitespace-nowrap text-silver-grad">Beyond Service.</span>
            <span className="block whitespace-nowrap text-gold-grad">Beyond Growth.</span>
          </h1>
          <motion.p {...fade(0.2)} className="mt-6 max-w-xl text-lg text-[var(--text-muted)]">
            Pemantauan Program Budaya <strong className="text-[var(--bersinar-glow)]">Borneo Bersinar</strong>, <strong className="text-[var(--best-glow)]">Borneo Best</strong>, dan <strong className="text-[var(--gold-glow)]">Borneo Prima</strong> — PLN UID Kaltimra {data.meta.year}.
          </motion.p>
          <motion.div {...fade(0.3)} className="mt-6 flex flex-wrap gap-2">
            <span className="chip">
              <CalendarCheck size={14} className="text-[var(--gold)]" aria-hidden /> Data s.d. {formatDate(data.meta.dataAsOf).replace(/^\d+ /, '')} · CO HUB {latest.cohub}
            </span>
            <span className="chip">
              <RefreshCw size={13} className="text-[var(--best-glow)]" aria-hidden /> Diperbarui {formatDate(data.meta.updatedAt, true)}
            </span>
            {period.id !== latest.id && <span className={`chip !border-[var(--gold)] !text-[var(--gold-glow)] ${period.isPrognosa ? 'italic' : ''}`}>Menampilkan: {period.label}</span>}
          </motion.div>
          <motion.div {...fade(0.4)} className="mt-8 flex flex-wrap gap-3">
            <a href="#ringkasan" className="btn btn-gold">
              Lihat Ringkasan <ArrowDown size={16} aria-hidden />
            </a>
            <button onClick={onPresent} className="btn btn-ghost">
              <Presentation size={16} aria-hidden /> Mode Presentasi
            </button>
          </motion.div>

          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.heroStats.map((s, i) => {
              const p = pillarById(s.pillarId);
              const ind = p.indicators.find((x) => x.id === s.indicatorId)!;
              const st = indicatorStatus(ind, data, period);
              const v = st.value ?? 0;
              const style = PILLAR_STYLE[p.id];
              const dec = ind.unit === 'ribu kali' ? 2 : (ind.decimals ?? 0);
              const suffix = ind.unit === 'GWh' ? ' GWh' : ind.unit === 'ribu kali' ? ' rb' : '';
              return (
                <motion.div key={s.label} {...fade(0.5 + i * 0.08)} className="glass px-4 py-3.5" style={{ borderColor: `color-mix(in srgb, ${style.color} 35%, transparent)` }}>
                  <dt className="order-2 text-[12px] font-semibold text-[var(--text-muted)]">{s.label}</dt>
                  <dd className={`whitespace-nowrap text-[22px] font-extrabold leading-tight xl:text-[26px] ${period.isPrognosa ? 'prognosa' : ''}`} style={{ color: style.glow }}>
                    <CountUp value={v} decimals={dec} suffix={suffix} />
                  </dd>
                  {ind.type === 'cumulative' && st.pct != null && (
                    <dd className="text-[11px] text-[var(--text-muted)]">
                      {formatPercent(st.pct)} {ind.targetYtd?.[period.id] != null ? `target s.d. ${period.short}` : 'vs pace'}
                    </dd>
                  )}
                  {ind.type === 'zero' && <dd className="text-[11px] text-[var(--text-muted)]">Zero {unitSuffix(ind.unit)} · s.d. {period.short}</dd>}
                </motion.div>
              );
            })}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(0,163,224,0.35),transparent_65%)] blur-2xl" aria-hidden />
          <BorneoMap className="relative w-full drop-shadow-[0_0_40px_rgba(0,163,224,0.35)]" />
          {data.pillars.map((p, i) => {
            const S = PILLAR_STYLE[p.id];
            const Icon = S.icon;
            const pos = [
              { left: '2%', top: '14%' },
              { right: '0%', top: '64%' },
              { left: '8%', bottom: '6%' },
            ][i];
            return (
              <motion.a
                key={p.id}
                href={`#${p.id}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={reduced ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={reduced ? { duration: 0 } : { opacity: { delay: 2.3 + i * 0.15 }, scale: { delay: 2.3 + i * 0.15 }, y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: 2.5 } }}
                className="glass absolute flex items-center gap-2.5 !rounded-2xl px-3 py-2"
                style={{ ...pos, borderColor: `color-mix(in srgb, ${S.color} 55%, transparent)`, boxShadow: `0 0 30px -8px ${S.color}` }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${S.color} 25%, transparent)`, color: S.glow }}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{p.code}</span>
                  <span className="block text-sm font-extrabold">{p.name}</span>
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
