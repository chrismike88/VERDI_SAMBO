import { lazy, Suspense } from 'react';
import { MotionConfig } from 'motion/react';
import { data, pillarById } from '@/data';
import { PeriodProvider } from '@/state/PeriodContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PresentationHud, usePresentation } from '@/components/layout/Presentation';
import { Hero } from '@/sections/Hero';
import { Ringkasan } from '@/sections/Ringkasan';
import { Radar } from '@/sections/Radar';
import { PillarSection } from '@/sections/pillar/PillarSection';
import { BersinarKhas } from '@/sections/pillar/BersinarKhas';
import { BestKhas } from '@/sections/pillar/BestKhas';
import { PrimaKhas } from '@/sections/pillar/PrimaKhas';

const CultureDna = lazy(() => import('@/sections/CultureDna').then((m) => ({ default: m.CultureDna })));
const TimelineCohub = lazy(() => import('@/sections/TimelineCohub').then((m) => ({ default: m.TimelineCohub })));
const Evidence = lazy(() => import('@/sections/Evidence').then((m) => ({ default: m.Evidence })));
const Governance = lazy(() => import('@/sections/Governance').then((m) => ({ default: m.Governance })));

function Page() {
  const pres = usePresentation();
  return (
    <>
      <a href="#ringkasan" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-[var(--gold)] focus:px-4 focus:py-2 focus:font-bold focus:text-black">
        Lewati ke konten
      </a>
      <Navbar onPresent={pres.start} />
      <main>
        <Hero onPresent={pres.start} />
        <Ringkasan />
        <Radar />
        <PillarSection pillar={pillarById('bersinar')} alt>
          <BersinarKhas />
        </PillarSection>
        <PillarSection pillar={pillarById('best')}>
          <BestKhas />
        </PillarSection>
        <PillarSection pillar={pillarById('prima')} alt>
          <PrimaKhas />
        </PillarSection>
        <Suspense fallback={<div className="h-screen" />}>
          <CultureDna />
          <TimelineCohub />
          <Evidence />
          <Governance />
        </Suspense>
      </main>
      <Footer />
      <PresentationHud p={pres} />
    </>
  );
}

export default function App() {
  void data;
  return (
    <MotionConfig reducedMotion="user">
      <PeriodProvider>
        <Page />
      </PeriodProvider>
    </MotionConfig>
  );
}
