import { motion } from 'motion/react';
import { FileText, ExternalLink } from 'lucide-react';
import { data } from '@/data';
import { PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function Governance() {
  return (
    <section id="governance" aria-labelledby="gov-title" className="section">
      <div className="container-x">
        <SectionHeader id="gov-title" eyebrow="Governance & Dokumen" title={<>Budaya yang <span className="text-gold-grad">terlembagakan.</span></>} subtitle="Surat, penetapan, dan forum yang mengikat ritual budaya ke dalam tata kelola." />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.documents.map((d, i) => {
            const p = data.pillars.find((x) => x.id === d.pillarId);
            const S = PILLAR_STYLE[(p?.id ?? 'all') as 'all'];
            const Tag = d.url ? 'a' : 'div';
            return (
              <motion.li key={d.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.06 }}>
                <Tag {...(d.url ? { href: d.url, target: '_blank', rel: 'noreferrer' } : {})} className="glass glass-hover flex h-full gap-4 p-5" style={{ '--accent': S.color } as React.CSSProperties}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${S.color} 20%, transparent)`, color: S.glow }}>
                    <FileText size={20} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="chip !py-0.5 !text-[10.5px]" style={{ color: S.glow }}>
                      {p ? p.code : 'Semua pilar'}
                    </span>
                    <span className="mt-2 block break-words text-[13px] font-bold text-[var(--gold-glow)]">{d.number}</span>
                    <span className="mt-1 block font-semibold leading-snug">{d.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      {d.date}
                      {d.url && <ExternalLink size={11} aria-hidden />}
                    </span>
                  </span>
                </Tag>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
