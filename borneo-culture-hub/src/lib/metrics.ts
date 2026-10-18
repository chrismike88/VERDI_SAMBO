import type { Dataset, Indicator, Period, DnaValue, Pillar } from '@/data/schema';

export const PROGNOSA_ID = (d: Dataset) => d.periods.find((p) => p.isPrognosa)?.id;

/** Periode aktual (bukan prognosa) urut bulan. */
export function actualPeriods(d: Dataset): Period[] {
  return d.periods.filter((p) => !p.isPrognosa).sort((a, b) => a.month - b.month);
}

export function latestActualPeriod(d: Dataset): Period {
  const a = actualPeriods(d);
  return a[a.length - 1];
}

export function previousActual(d: Dataset, periodId: string): Period | undefined {
  const a = actualPeriods(d);
  const i = a.findIndex((p) => p.id === periodId);
  if (i > 0) return a[i - 1];
  if (i === -1) return a[a.length - 1]; // prognosa → bandingkan dengan aktual terakhir
  return undefined;
}

export function valueAt(ind: Indicator, periodId: string): number | null {
  const v = ind.values[periodId];
  return v == null ? null : v;
}

/** Target pembanding: targetYtd bila ada, bila tidak target × bulan/12 (untuk kumulatif). */
export function benchmark(ind: Indicator, period: Period): number {
  if (ind.type !== 'cumulative') return ind.target;
  const ytd = ind.targetYtd?.[period.id];
  if (ytd != null) return ytd;
  return (ind.target * period.month) / 12;
}

export const pace = (month: number) => month / 12;

/** Capaian (%) terhadap target tahunan. */
export function achievementVsAnnual(ind: Indicator, periodId: string): number | null {
  const v = valueAt(ind, periodId);
  if (v == null || ind.target === 0) return null;
  return (v / ind.target) * 100;
}

/** Capaian (%) terhadap benchmark periode. Untuk tipe max: persen pemakaian batas. */
export function achievementVsBenchmark(ind: Indicator, period: Period): number | null {
  const v = valueAt(ind, period.id);
  if (v == null) return null;
  if (ind.type === 'zero') return v === 0 ? 100 : 0;
  const b = benchmark(ind, period);
  if (b === 0) return null;
  return (v / b) * 100;
}

/** Selisih antarperiode berurutan untuk seri kumulatif. */
export function monthlyIncrements(ind: Indicator, d: Dataset): { period: Period; inc: number }[] {
  const a = actualPeriods(d);
  const out: { period: Period; inc: number }[] = [];
  for (let i = 1; i < a.length; i++) {
    const v0 = valueAt(ind, a[i - 1].id);
    const v1 = valueAt(ind, a[i].id);
    if (v0 != null && v1 != null) out.push({ period: a[i], inc: (v1 - v0) / (a[i].month - a[i - 1].month) });
  }
  return out;
}

export function runRate(ind: Indicator, d: Dataset, upToPeriodId?: string): number | null {
  let inc = monthlyIncrements(ind, d);
  if (upToPeriodId) {
    const m = d.periods.find((p) => p.id === upToPeriodId)?.month ?? 12;
    inc = inc.filter((x) => x.period.month <= m);
  }
  if (!inc.length) return null;
  return inc.reduce((s, x) => s + x.inc, 0) / inc.length;
}

/** Kebutuhan per bulan sisa tahun untuk mencapai target. */
export function requiredPerMonth(ind: Indicator, period: Period): number | null {
  const v = valueAt(ind, period.id);
  if (v == null) return null;
  const rest = 12 - period.month;
  if (rest <= 0) return null;
  return (ind.target - v) / rest;
}

/** Asumsi laju bulanan di balik angka prognosa unit. */
export function prognosaPerMonth(ind: Indicator, d: Dataset, period: Period): number | null {
  const pid = PROGNOSA_ID(d);
  if (!pid) return null;
  const p = valueAt(ind, pid);
  const v = valueAt(ind, period.id);
  if (p == null || v == null) return null;
  const rest = 12 - period.month;
  return rest > 0 ? (p - v) / rest : null;
}

export function cumulativeSeries(actual: Record<string, number>): number[] {
  let s = 0;
  return Object.values(actual).map((v) => (s += v));
}

export function seriesAverage(actual: Record<string, number>): number {
  const v = Object.values(actual);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function momChange(actual: Record<string, number>, month: string): number | null {
  const keys = Object.keys(actual);
  const i = keys.indexOf(month);
  if (i <= 0) return null;
  return ((actual[keys[i]] - actual[keys[i - 1]]) / actual[keys[i - 1]]) * 100;
}

export function pctChange(before: number, after: number): number {
  return ((after - before) / before) * 100;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function dnaScore(v: DnaValue, periodId: string): number | null {
  return v.scores[periodId] ?? null;
}

/** Rata-rata Culture DNA pilar untuk periode (dibulatkan 2 desimal seperti paparan). */
export function dnaAverage(p: Pillar, periodId: string): number | null {
  const s = p.cultureDna.map((v) => dnaScore(v, periodId));
  if (s.some((x) => x == null)) return null;
  return round2((s as number[]).reduce((a, b) => a + b, 0) / s.length);
}

/** Periode skor DNA terakhir ≤ periode aktif (null bila tidak ada). */
export function dnaPeriodFor(d: Dataset, periodId: string): { current?: string; previous?: string } {
  const withScores = d.periods.filter((p) => d.pillars.some((pl) => pl.cultureDna.some((v) => v.scores[p.id] != null)));
  const cur = withScores.find((p) => p.id === periodId);
  if (!cur) return {};
  const idx = withScores.indexOf(cur);
  return { current: cur.id, previous: withScores[idx - 1]?.id };
}

export function allDnaValues(d: Dataset) {
  return d.pillars.flatMap((p) => p.cultureDna.map((v) => ({ ...v, pillarId: p.id })));
}
