import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
  meta?: string;
}

export function Lightbox({ items, index, onClose, onIndex }: { items: LightboxItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (index == null) return;
    closeRef.current?.focus();
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [index, items.length, onClose, onIndex]);
  const it = index != null ? items[index] : null;
  return (
    <AnimatePresence>
      {it && (
        <motion.div role="dialog" aria-modal="true" aria-label={it.caption} className="fixed inset-0 z-[80] grid place-items-center bg-[#020611]/90 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.figure initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} className="glass w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback src={it.src} alt={it.alt} label={it.caption} className="aspect-video w-full bg-black/40" imgClassName="object-contain" />
            <figcaption className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-bold">{it.caption}</p>
                {it.meta && <p className="text-sm text-[var(--text-muted)]">{it.meta}</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost btn !p-2.5" aria-label="Sebelumnya" onClick={() => onIndex((index! - 1 + items.length) % items.length)}>
                  <ChevronLeft size={18} />
                </button>
                <button className="btn-ghost btn !p-2.5" aria-label="Berikutnya" onClick={() => onIndex((index! + 1) % items.length)}>
                  <ChevronRight size={18} />
                </button>
                <button ref={closeRef} className="btn-ghost btn !p-2.5" aria-label="Tutup" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
