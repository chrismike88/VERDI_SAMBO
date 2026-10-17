import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { SLIDES, PILLAR_JUMP } from '@/config/presentation';
import { data } from '@/data';
import { PlnMark } from '@/components/ui/PlnLogo';

/** Mode Presentasi: menavigasi section halaman sebagai slide; kompatibel clicker (PageUp/PageDown). */
export function usePresentation() {
  const [on, setOn] = useState(false);
  const [i, setI] = useState(0);
  const savedY = useRef(0);

  const go = useCallback((n: number) => {
    const k = Math.max(0, Math.min(SLIDES.length - 1, n));
    setI(k);
    const s = SLIDES[k];
    if (s.lens) window.dispatchEvent(new CustomEvent('open-lens', { detail: s.lens }));
    if (s.target !== '__thanks') {
      requestAnimationFrame(() => {
        const el = document.getElementById(s.target);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
      });
    }
  }, []);

  const start = useCallback(() => {
    savedY.current = window.scrollY;
    setOn(true);
    go(0);
  }, [go]);

  const stop = useCallback(() => {
    setOn(false);
    if (document.fullscreenElement) document.exitFullscreen?.();
    requestAnimationFrame(() => window.scrollTo({ top: savedY.current, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('present-mode', on);
  }, [on]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!on) {
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          start();
        }
        return;
      }
      if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        go(i + 1);
      } else if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        stop();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen?.();
        else document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (PILLAR_JUMP[e.key]) {
        e.preventDefault();
        go(SLIDES.findIndex((s) => s.target === PILLAR_JUMP[e.key]));
      } else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(SLIDES.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on, i, go, start, stop]);

  return { on, i, start, stop, go };
}

export function PresentationHud({ p }: { p: ReturnType<typeof usePresentation> }) {
  const s = SLIDES[p.i];
  return (
    <AnimatePresence>
      {p.on && (
        <>
          <motion.div className="fixed inset-x-0 top-0 z-[70] h-1 bg-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="h-full bg-gradient-to-r from-[var(--bersinar)] via-[var(--gold)] to-[var(--prima)]" animate={{ width: `${((p.i + 1) / SLIDES.length) * 100}%` }} transition={{ duration: 0.4 }} />
          </motion.div>
          <motion.div role="toolbar" aria-label="Kontrol presentasi" className="glass fixed bottom-4 right-4 z-[70] flex items-center gap-1 !rounded-full p-1.5 pl-4" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
            <span className="mr-2 hidden text-sm font-bold sm:inline">{s.title}</span>
            <span className="mr-2 text-sm text-[var(--text-muted)] tnum" aria-live="polite">
              {p.i + 1} / {SLIDES.length}
            </span>
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Slide sebelumnya" onClick={() => p.go(p.i - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Slide berikutnya" onClick={() => p.go(p.i + 1)}>
              <ChevronRight size={18} />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Layar penuh (F)" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {}))}>
              <Maximize size={16} />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Keluar presentasi (Esc)" onClick={p.stop}>
              <X size={18} />
            </button>
          </motion.div>
          <AnimatePresence>
            {s.target === '__thanks' && (
              <motion.div className="fixed inset-0 z-[65] grid place-items-center bg-[radial-gradient(900px_600px_at_50%_40%,rgba(0,163,224,0.3),transparent),#040a1c] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div>
                  <div className="mb-6 flex justify-center">
                    <PlnMark size={64} />
                  </div>
                  <p className="eyebrow mb-4">BORNEO Culture Hub · {data.meta.unit}</p>
                  <p className="display text-gold-grad">Terima Kasih</p>
                  <p className="mt-6 text-xl text-[var(--text-muted)]">One Ranger can start a change, together we create the culture!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
