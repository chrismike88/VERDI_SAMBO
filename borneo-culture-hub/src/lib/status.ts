import type { Dataset, Indicator, Period, Pillar, Status } from '@/data/schema';
import { THRESHOLDS, STATUS_META } from '@/config/status';
import { actualPeriods, benchmark, PROGNOSA_ID, valueAt } from './metrics';

export type Flag = 'PROGNOSA_DI_BAWAH_TARGET';

export interface IndicatorStatus {
  status: Status;
  computed: Status;
  flags: Flag[];
  value: number | null;
  benchmark: number;
  /** Capaian terhadap benchmark (%), null bila tak ada data. */
  pct: number | null;
  override?: { status: Status; reason: string };
}

/** Apakah nilai memenuhi target akhir (dipakai untuk flag prognosa). */
export function meetsTarget(ind: Indicator, v: number): boolean {
  switch (ind.type) {
    case 'zero':
      return v === 0;
    case 'max':
      return v <= ind.target;
    case 'min':
    case 'cumulative':
      return v >= ind.target;
  }
}

function previousValue(ind: Indicator, d: Dataset, period: Period): { v: number; months: number } | null {
  const a = actualPeriods(d).filter((p) => p.month < period.month);
  for (let i = a.length - 1; i >= 0; i--) {
    const v = valueAt(ind, a[i].id);
    if (v != null) return { v, months: period.month - a[i].month };
  }
  return null;
}

/** Status dasar sebelum flag prognosa (PRD §8.2). */
export function baseStatus(ind: Indicator, d: Dataset, period: Period): Status {
  const v = valueAt(ind, period.id);
  if (v == null) return 'MENUNGGU_DATA';
  switch (ind.type) {
    case 'zero':
      return v === 0 ? 'ON_TRACK' : 'KRITIS';
    case 'max': {
      const r = v / ind.target;
      if (r <= THRESHOLDS.max.exceed) return 'MELAMPAUI';
      if (r <= THRESHOLDS.max.ok) return 'ON_TRACK';
      if (r <= THRESHOLDS.max.warn) return 'PERLU_PERHATIAN';
      return 'KRITIS';
    }
    case 'min': {
      if (v >= ind.target * THRESHOLDS.min.exceed) return 'MELAMPAUI';
      if (v >= ind.target) return 'ON_TRACK';
      const rest = 12 - period.month;
      if (rest <= 0) return 'KRITIS';
      const req = (ind.target - v) / rest;
      const prev = previousValue(ind, d, period);
      if (!prev) return 'PERLU_PERHATIAN';
      const lastInc = (v - prev.v) / prev.months;
      if (lastInc >= req) return 'ON_TRACK';
      if (lastInc >= req * THRESHOLDS.min.warnReqRatio) return 'PERLU_PERHATIAN';
      return 'KRITIS';
    }
    case 'cumulative': {
      if (v >= ind.target) return 'MELAMPAUI';
      const b = benchmark(ind, period);
      const r = v / b;
      if (r >= 1) return 'ON_TRACK';
      if (r >= THRESHOLDS.cumulative.warn) return 'PERLU_PERHATIAN';
      return 'KRITIS';
    }
  }
}

export function indicatorStatus(ind: Indicator, d: Dataset, period: Period): IndicatorStatus {
  const value = valueAt(ind, period.id);
  const b = benchmark(ind, period);
  let computed = baseStatus(ind, d, period);
  const flags: Flag[] = [];
  const pid = PROGNOSA_ID(d);
  const prog = pid ? valueAt(ind, pid) : null;
  if (computed !== 'MENUNGGU_DATA' && prog != null && !meetsTarget(ind, prog)) {
    flags.push('PROGNOSA_DI_BAWAH_TARGET');
    if (computed === 'MELAMPAUI' || computed === 'ON_TRACK') computed = 'PERLU_PERHATIAN';
  }
  let pct: number | null = null;
  if (value != null) {
    if (ind.type === 'zero') pct = value === 0 ? 100 : 0;
    else if (b !== 0) pct = (value / b) * 100;
  }
  const override = ind.statusOverride;
  return { status: override?.status ?? computed, computed, flags, value, benchmark: b, pct, override };
}

/** Status pilar = terburuk di antara indikator; Melampaui dihitung On Track; Menunggu Data diabaikan. */
export function pillarStatus(p: Pillar, d: Dataset, period: Period): { status: Status; okCount: number; total: number } {
  const statuses = p.indicators.map((i) => indicatorStatus(i, d, period).status).filter((s) => s !== 'MENUNGGU_DATA');
  if (!statuses.length) return { status: 'MENUNGGU_DATA', okCount: 0, total: 0 };
  const norm = statuses.map((s) => (s === 'MELAMPAUI' ? 'ON_TRACK' : s));
  const worst = norm.reduce((w, s) => (STATUS_META[s].rank > STATUS_META[w].rank ? s : w), 'ON_TRACK' as Status);
  const okCount = statuses.filter((s) => s === 'ON_TRACK' || s === 'MELAMPAUI').length;
  return { status: worst, okCount, total: statuses.length };
}
