import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Pillar } from '@/data/schema';
import { LENSES, PILLAR_STYLE, type LensId } from '@/config/pillars';
import { Tabs } from '@/components/ui/Tabs';
import { AlignmentLens, RitualLens, LeaderLens, DnaLens, SistemLens, SimbolLens } from './Lenses';

export function LensaPanel({ pillar }: { pillar: Pillar }) {
  const S = PILLAR_STYLE[pillar.id];
  const fromHash = (): LensId | null => {
    const h = window.location.hash.replace('#', '');
    const m = LENSES.find((l) => h === `${pillar.id}-${l.id}`);
    return m ? m.id : null;
  };
  const [active, setActive] = useState<LensId>(() => fromHash() ?? 'alignment');

  useEffect(() => {
    const onHash = () => {
      const l = fromHash();
      if (l) {
        setActive(l);
        document.getElementById(`${pillar.id}-lensa`)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    const onEv = (e: Event) => {
      const d = (e as CustomEvent<{ pillar: string; id: LensId }>).detail;
      if (d.pillar === pillar.id) setActive(d.id);
    };
    if (fromHash()) setTimeout(onHash, 300);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('open-lens', onEv);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('open-lens', onEv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillar.id]);

  const change = (id: LensId) => {
    setActive(id);
    window.history.replaceState(null, '', `${window.location.search}#${pillar.id}-${id}`);
  };

  const body = {
    alignment: <AlignmentLens pillar={pillar} />,
    ritual: <RitualLens pillar={pillar} />,
    leader: <LeaderLens pillar={pillar} />,
    dna: <DnaLens pillar={pillar} />,
    sistem: <SistemLens pillar={pillar} />,
    simbol: <SimbolLens pillar={pillar} />,
  }[active];

  return (
    <div className="glass p-4 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow" style={{ color: S.glow }}>
            6 Lensa Budaya
          </p>
          <h3 className="text-2xl font-extrabold">{pillar.name} dari enam sisi</h3>
        </div>
      </div>
      <Tabs tabs={LENSES} active={active} onChange={change} idPrefix={pillar.id} accent={`linear-gradient(180deg, ${S.glow}, ${S.color})`} label={`Lensa budaya ${pillar.name}`} />
      <div role="tabpanel" id={`${pillar.id}-panel`} aria-labelledby={`${pillar.id}-tab-${active}`} tabIndex={0} className="mt-6 focus-visible:outline-none">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
