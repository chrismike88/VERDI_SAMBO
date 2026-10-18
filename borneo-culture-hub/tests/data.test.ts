import { describe, expect, it } from 'vitest';
import { data, pillarById, periodById } from '@/data';
import {
  achievementVsAnnual,
  achievementVsBenchmark,
  cumulativeSeries,
  dnaAverage,
  momChange,
  monthlyIncrements,
  pctChange,
  prognosaPerMonth,
  requiredPerMonth,
  runRate,
  seriesAverage,
} from '@/lib/metrics';

const sep = periodById('2026-09')!;
const ind = (p: string, i: string) => pillarById(p).indicators.find((x) => x.id === i)!;
const r2 = (v: number) => Math.round(v * 100) / 100;
const r1 = (v: number) => Math.round(v * 10) / 10;

describe('PRD Lampiran A.10', () => {
  const wd = pillarById('bersinar').monthlySeries![0];
  it('kumulatif Walk Down cocok dengan baris closing', () => {
    expect(cumulativeSeries(wd.actual)).toEqual([1417, 2716, 3709, 5112, 6184, 7339, 8435, 9396, 10770]);
    const closing = ind('bersinar', 'closing');
    expect([closing.values['2026-06'], closing.values['2026-07'], closing.values['2026-08'], closing.values['2026-09']]).toEqual([7339, 8435, 9396, 10770]);
  });
  it('rata-rata, MoM, kebutuhan Walk Down', () => {
    expect(r2(seriesAverage(wd.actual))).toBe(1196.67);
    expect(Math.round(seriesAverage(wd.actual))).toBe(1197);
    expect(r1(momChange(wd.actual, 'Apr')!)).toBe(41.3);
    expect(r1(momChange(wd.actual, 'Sep')!)).toBe(43.0);
    expect(wd.forecastTotal! / 3).toBe(1155);
    expect(10770 + wd.forecastTotal!).toBe(14235);
  });
  it('capaian kumulatif', () => {
    expect(r2(achievementVsAnnual(ind('bersinar', 'closing'), '2026-09')!)).toBe(75.66);
    expect(r2(achievementVsAnnual(ind('best', 'trx_kali'), '2026-09')!)).toBe(151.85);
    expect(r2(achievementVsAnnual(ind('best', 'trx_rp'), '2026-09')!)).toBe(100.23);
    expect(r2(achievementVsBenchmark(ind('prima', 'penjualan'), sep)!)).toBe(102.24);
    expect(r2(achievementVsAnnual(ind('prima', 'penjualan'), '2026-09')!)).toBe(75.84);
    expect(r2(achievementVsAnnual(ind('prima', 'penjualan'), '2026-12P')!)).toBe(99.64);
    expect(r2(achievementVsAnnual(ind('prima', 'produktivitas'), '2026-09')!)).toBe(75.33);
    expect(r2(achievementVsAnnual(ind('prima', 'produktivitas'), '2026-12P')!)).toBe(99.04);
  });
  it('run-rate penjualan & produktivitas', () => {
    const pj = ind('prima', 'penjualan');
    expect(monthlyIncrements(pj, data).map((x) => x.inc)).toEqual([623, 640, 640]);
    expect(r1(runRate(pj, data, '2026-09')!)).toBe(634.3);
    expect(r1(requiredPerMonth(pj, sep)!)).toBe(567.0);
    expect(r1(prognosaPerMonth(pj, data, sep)!)).toBe(558.7);
    const pr = ind('prima', 'produktivitas');
    expect(monthlyIncrements(pr, data).map((x) => r2(x.inc))).toEqual([0.97, 0.95, 0.92]);
    expect(r2(requiredPerMonth(pr, sep)!)).toBe(0.86);
  });
  it('gauge, feedback, VAPE GADIS, gangguan', () => {
    const g = pillarById('prima').gauges!;
    expect(r2((g[2].actual / g[2].target) * 100)).toBe(108.91);
    expect(r2((g[3].actual / g[3].target) * 100)).toBe(110.25);
    expect(r1((ind('best', 'feedback').values['2026-09']! / 0.03) * 100)).toBe(43.3);
    expect(r2(requiredPerMonth(ind('best', 'vape_gadis'), sep)!)).toBe(0.67);
    const c = pillarById('best').comparisons!;
    expect(r1(pctChange(c[0].before, c[0].after))).toBe(-25.3);
    expect(r1(pctChange(c[1].before, c[1].after))).toBe(-66.3);
    expect(r1(pctChange(c[2].before, c[2].after))).toBe(-75.2);
  });
  it('rata-rata Culture DNA per pilar', () => {
    expect([dnaAverage(pillarById('bersinar'), '2026-08'), dnaAverage(pillarById('bersinar'), '2026-09')]).toEqual([4.71, 4.84]);
    expect([dnaAverage(pillarById('best'), '2026-08'), dnaAverage(pillarById('best'), '2026-09')]).toEqual([4.62, 4.76]);
    expect([dnaAverage(pillarById('prima'), '2026-08'), dnaAverage(pillarById('prima'), '2026-09')]).toEqual([4.53, 4.72]);
    expect(dnaAverage(pillarById('prima'), '2026-07')).toBeNull();
  });
});
