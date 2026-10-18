import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { data, pillarById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { formatDateRange, formatUnit } from '@/lib/format';
import { PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';

const SNAP = [
  { pillar: 'bersinar', ind: 'closing', label: 'Closing temuan' },
  { pillar: 'best', ind: 'trx_kali', label: 'Transaksi PLN Mobile' },
  { pillar: 'prima', ind: 'penjualan', label: 'Penjualan' },
];

export function TimelineCohub() {
  const { periodId, setPeriodId } = usePeriod();
  const events = [...data.timeline].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  return (
    <section id="timeline" aria-labelledby="timeline-title" className="section">
      <div className="container-x">
        <SectionHeader id="timeline-title" eyebrow="Perjalanan CO HUB 2026" title={<>Dari CO HUB 1 menuju <span className="text-gold-grad">akhir tahun.</span></>} subtitle="Klik sebuah titik untuk memutar seluruh halaman ke periode tersebut." />
        <div className="relative">
          <div className="absolute left-0 right-0 top-[30px] hidden h-0.5 bg-gradient-to-r from-[var(--bersinar)] via-[var(--best)] to-[var(--prima)] md:block" aria-hidden />
          <ol className="grid gap-4 md:grid-cols-5">
            {data.periods.map((p, i) => {
              const on = p.id === periodId;
              return (
                <motion.li key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <button onClick={() => setPeriodId(p.id)} aria-pressed={on} className="group w-full text-left">
                    <span className={`relative z-10 mb-4 grid h-[60px] w-[60px] place-items-center rounded-full border-2 text-sm font-extrabold transition md:mx-auto ${p.isPrognosa ? 'border-dashed italic' : ''}`} style={{ borderColor: on ? 'var(--gold)' : 'var(--border)', background: on ? 'linear-gradient(180deg,#ffe08a,#f7b731)' : '#081634', color: on ? '#1a1203' : 'var(--text)', boxShadow: on ? '0 0 30px -4px var(--gold)' : undefined }}>
                      {p.short}
                    </span>
                    <span className={`glass block p-4 transition group-hover:bg-white/[0.07] ${on ? '!border-[var(--gold)]' : ''}`}>
                      <span className={`block text-sm font-extrabold ${p.isPrognosa ? 'italic' : ''}`}>{p.label}</span>
                      <span className="mt-2 block space-y-1">
                        {SNAP.map((s) => {
                          const ind = pillarById(s.pillar).indicators.find((x) => x.id === s.ind)!;
                          const v = ind.values[p.id];
                          return (
                            <span key={s.ind} className="flex justify-between gap-2 text-xs">
                              <span style={{ color: PILLAR_STYLE[s.pillar as 'bersinar'].glow }}>{s.label}</span>
                              <span className={`font-bold tnum ${p.isPrognosa ? 'italic' : ''}`}>{v == null ? '—' : formatUnit(v, ind.unit, ind.unit === 'ribu kali' ? 2 : 0)}</span>
                            </span>
                          );
                        })}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </div>
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-extrabold">Agenda &amp; peristiwa penting</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const S = PILLAR_STYLE[(e.pillarId ?? 'all') as 'all'];
              return (
                <li key={e.title} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
                  <CalendarDays size={18} className="mt-0.5 shrink-0" style={{ color: S.glow }} aria-hidden />
                  <div>
                    <p className="font-bold leading-snug">{e.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {e.date ? formatDateRange(e.date, e.endDate) : e.note}
                      {e.pillarId && ` · ${pillarById(e.pillarId).name}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
