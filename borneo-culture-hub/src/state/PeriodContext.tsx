import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { data } from '@/data';
import { latestActualPeriod, previousActual } from '@/lib/metrics';
import type { Period } from '@/data/schema';

interface Ctx {
  periodId: string;
  period: Period;
  prevPeriod?: Period;
  setPeriodId: (id: string) => void;
}

const PeriodCtx = createContext<Ctx | null>(null);

function initialPeriod(): string {
  const q = new URLSearchParams(window.location.search).get('periode');
  if (q && data.periods.some((p) => p.id === q)) return q;
  return latestActualPeriod(data).id;
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periodId, setId] = useState(initialPeriod);
  const setPeriodId = useCallback((id: string) => setId(id), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (periodId === latestActualPeriod(data).id) url.searchParams.delete('periode');
    else url.searchParams.set('periode', periodId);
    window.history.replaceState(null, '', url);
  }, [periodId]);

  const value = useMemo(() => {
    const period = data.periods.find((p) => p.id === periodId)!;
    return { periodId, period, prevPeriod: previousActual(data, periodId), setPeriodId };
  }, [periodId, setPeriodId]);

  return <PeriodCtx.Provider value={value}>{children}</PeriodCtx.Provider>;
}

export function usePeriod() {
  const c = useContext(PeriodCtx);
  if (!c) throw new Error('usePeriod harus di dalam PeriodProvider');
  return c;
}
