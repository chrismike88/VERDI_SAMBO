import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, Presentation } from 'lucide-react';
import { PlnMark } from '@/components/ui/PlnLogo';
import { useActiveSection } from '@/hooks/useActiveSection';
import { PeriodSwitcher } from './PeriodSwitcher';

const LINKS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'radar', label: 'Radar' },
  { id: 'bersinar', label: 'Bersinar' },
  { id: 'best', label: 'Best' },
  { id: 'prima', label: 'Prima' },
  { id: 'culture-dna', label: 'Culture DNA' },
];
const ALL_IDS = ['beranda', ...LINKS.map((l) => l.id), 'timeline', 'evidence', 'governance'];

export function Navbar({ onPresent }: { onPresent: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(ALL_IDS);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <>
      <header className={`site-nav fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-[var(--border)] bg-[#040a1c]/75 backdrop-blur-xl' : 'bg-transparent'}`} style={{ height: 'var(--nav-h)' }}>
        <nav aria-label="Navigasi utama" className="container-x flex h-full items-center gap-4">
          <a href="#beranda" className="flex shrink-0 items-center gap-2.5">
            <PlnMark />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight">
                BORNEO <span className="text-gold-grad">Culture Hub</span>
              </span>
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">PLN UID Kaltimra</span>
            </span>
          </a>
          <ul className="mx-auto hidden items-center gap-0.5 xl:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} aria-current={active === l.id ? 'location' : undefined} className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${active === l.id ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                  {active === l.id && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="relative">{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <PeriodSwitcher idPrefix="nav" responsive />
            <button onClick={onPresent} className="btn btn-ghost !px-3.5 !py-2 text-sm" title="Mode Presentasi (P)">
              <Presentation size={16} aria-hidden /> <span className="hidden 2xl:inline">Presentasi</span>
              <span className="sr-only 2xl:hidden">Mode Presentasi</span>
            </button>
          </div>
          <button className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] lg:ml-2 xl:hidden" aria-label="Buka menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] bg-[#020611]/80 backdrop-blur xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Menu" className="glass absolute inset-x-3 top-3 p-5" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <span className="eyebrow">Navigasi</span>
                <button className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)]" aria-label="Tutup menu" onClick={() => setOpen(false)} autoFocus>
                  <X size={20} />
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {[...LINKS, { id: 'timeline', label: 'Timeline' }, { id: 'evidence', label: 'Evidence' }, { id: 'governance', label: 'Governance' }].map((l) => (
                  <li key={l.id}>
                    <a href={`#${l.id}`} onClick={() => setOpen(false)} className={`block rounded-xl border border-[var(--border)] px-4 py-3 font-semibold ${active === l.id ? 'bg-white/10' : ''}`}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setOpen(false);
                  onPresent();
                }}
                className="btn btn-gold mt-4 w-full justify-center"
              >
                <Presentation size={16} aria-hidden /> Mode Presentasi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mobile-period-bar fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[#040a1c]/85 px-3 py-2 backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <PeriodSwitcher compact idPrefix="mob" />
      </div>
    </>
  );
}
