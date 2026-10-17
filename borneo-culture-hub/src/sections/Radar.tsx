import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Trophy, Clock, Eye, UserRound, StickyNote } from 'lucide-react';
import { data, pillarById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { buildInsights, groupInsights, type Insight } from '@/lib/insights';
import { PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';

const COLS = [
  { key: 'kawal', title: 'Perlu Dikawal', desc: 'Status Perlu Perhatian / Kritis, flag prognosa & observasi laju', icon: AlertTriangle, color: 'var(--status-warn)' },
  { key: 'menonjol', title: 'Capaian Menonjol', desc: 'Melampaui target, capaian beruntun, kenaikan Culture DNA', icon: Trophy, color: 'var(--status-exceed)' },
  { key: 'menunggu', title: 'Menunggu Data', desc: 'KPI yang realisasinya belum diinput', icon: Clock, color: 'var(--status-na)' },
] as const;

function Item({ it }: { it: Insight }) {
  const p = it.pillarId === 'all' ? null : pillarById(it.pillarId);
  const S = PILLAR_STYLE[(p?.id ?? 'all') as keyof typeof PILLAR_STYLE];
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }} className="rounded-2xl border border-[var(--border)] bg-white/[0.035] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {p && (
          <span className="chip !py-0.5 !text-[10.5px]" style={{ color: S.glow, borderColor: `color-mix(in srgb, ${S.color} 45%, transparent)` }}>
            {p.code} · {S.short}
          </span>
        )}
        {it.kind === 'info' && (
          <span className="chip !py-0.5 !text-[10.5px] text-[var(--best-glow)]">
            <Eye size={11} aria-hidden /> Observasi
          </span>
        )}
        <span className="ml-auto text-[10px] font-bold text-white/30">{it.rule}</span>
      </div>
      <p className="text-[14px] font-bold leading-snug">{it.title}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--text-muted)]">{it.message}</p>
      {it.figures && (
        <dl className="mt-3 flex flex-wrap gap-2">
          {it.figures.map((f) => (
            <div key={f.label} className="rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{f.label}</dt>
              <dd className="text-sm font-extrabold tnum">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {(it.catatanRanger || it.pic) && (
        <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)]">
          {it.pic && (
            <p className="flex items-center gap-1.5">
              <UserRound size={12} aria-hidden /> PIC: {it.pic}
            </p>
          )}
          {it.catatanRanger && (
            <p className="flex items-center gap-1.5">
              <StickyNote size={12} aria-hidden /> {it.catatanRanger}
            </p>
          )}
        </div>
      )}
    </motion.li>
  );
}

export function Radar() {
  const { period } = usePeriod();
  const g = groupInsights(buildInsights(data, period.id));
  return (
    <section id="radar" aria-labelledby="radar-title" className="section">
      <div className="container-x">
        <SectionHeader id="radar-title" eyebrow={`Radar Pengawalan · ${period.label}`} title={<>Apa yang <span className="text-gold-grad">perlu dikawal</span> hari ini?</>} subtitle="Disusun otomatis oleh insight engine dari data. Pesan laju (run-rate) bersifat observasi, bukan kesimpulan — musim dan beban Okt–Des bisa berbeda." />
        <div className="grid gap-5 lg:grid-cols-3">
          {COLS.map((c) => {
            const items = g[c.key];
            const Icon = c.icon;
            return (
              <div key={c.key} className="glass flex flex-col p-5" style={{ borderTop: `2px solid ${c.color}` }}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${c.color} 18%, transparent)`, color: c.color }}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold">{c.title}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{c.desc}</p>
                  </div>
                  <span className="text-3xl font-extrabold tnum" style={{ color: c.color }}>
                    {items.length}
                  </span>
                </div>
                <ul className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((it) => (
                      <Item key={it.id} it={it} />
                    ))}
                  </AnimatePresence>
                  {!items.length && <li className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">Tidak ada item pada periode ini.</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
