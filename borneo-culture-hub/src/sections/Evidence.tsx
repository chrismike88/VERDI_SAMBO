import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Maximize2 } from 'lucide-react';
import { data } from '@/data';
import { LENSES, PILLAR_STYLE } from '@/config/pillars';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Lightbox } from '@/components/ui/Lightbox';

export function Evidence() {
  const [pillar, setPillar] = useState('all');
  const [lens, setLens] = useState('all');
  const [idx, setIdx] = useState<number | null>(null);
  const items = useMemo(() => data.evidence.filter((e) => (pillar === 'all' || e.pillarId === pillar || e.pillarId === 'all') && (lens === 'all' || e.lens === lens)), [pillar, lens]);
  const lb = items.map((e) => ({ src: e.src, alt: e.alt, caption: e.caption, meta: [e.unit, e.date, e.pillarId !== 'all' ? data.pillars.find((p) => p.id === e.pillarId)?.name : 'Semua pilar'].filter(Boolean).join(' · ') }));
  const filterBtn = (on: boolean) => `chip ${on ? '!bg-white/15 !text-white' : 'text-[var(--text-muted)] hover:text-white'}`;
  return (
    <section id="evidence" aria-labelledby="evidence-title" className="section section-alt">
      <div className="container-x">
        <SectionHeader id="evidence-title" eyebrow="Galeri Evidence" title={<>Bukti implementasi di <span className="text-gold-grad">lapangan.</span></>} subtitle="Foto evidence per program. Kartu bergradien menandai foto yang akan ditambahkan dari file paparan asli." />
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pilar">
            {[{ id: 'all', name: 'Semua pilar' }, ...data.pillars].map((p) => (
              <button key={p.id} aria-pressed={pillar === p.id} onClick={() => setPillar(p.id)} className={filterBtn(pillar === p.id)}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter lensa">
            {[{ id: 'all', short: 'Semua lensa' }, ...LENSES].map((l) => (
              <button key={l.id} aria-pressed={lens === l.id} onClick={() => setLens(l.id)} className={filterBtn(lens === l.id)}>
                {l.short}
              </button>
            ))}
          </div>
        </div>
        <motion.ul layout className="columns-2 gap-4 md:columns-3 xl:columns-4">
          <AnimatePresence>
            {items.map((e, i) => {
              const S = PILLAR_STYLE[e.pillarId as 'all'];
              const tall = e.src.includes('cover-') && !e.src.includes('cohub3');
              return (
                <motion.li key={e.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-4 break-inside-avoid">
                  <button onClick={() => setIdx(i)} className="group relative block w-full overflow-hidden rounded-2xl border border-[var(--border)] text-left" aria-label={`Perbesar: ${e.caption}`}>
                    <ImageWithFallback src={e.src} alt={e.alt} label={e.caption} accent={S.color} className={tall ? 'aspect-[9/14]' : i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'} imgClassName="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10">
                      <span>
                        <span className="block text-sm font-bold">{e.caption}</span>
                        <span className="block text-[11px]" style={{ color: S.glow }}>
                          {e.pillarId === 'all' ? 'Semua pilar' : data.pillars.find((p) => p.id === e.pillarId)?.name}
                        </span>
                      </span>
                      <Maximize2 size={15} className="opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
        <Lightbox items={lb} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />
      </div>
    </section>
  );
}
