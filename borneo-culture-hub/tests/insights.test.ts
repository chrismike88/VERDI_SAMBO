import { describe, expect, it } from 'vitest';
import { data } from '@/data';
import { buildInsights, groupInsights } from '@/lib/insights';

describe('insight engine — Sep 2026', () => {
  const list = buildInsights(data, '2026-09');
  const msgs = list.map((i) => i.message).join('\n');
  it('R1 prognosa', () => {
    expect(msgs).toContain('Prognosa Des 7.015 GWh di bawah target 7.040 GWh (gap 25 GWh; 99,64%)');
    expect(msgs).toContain('99,04%');
  });
  it('R2 run-rate', () => {
    expect(msgs).toContain('Run-rate Jul–Sep 634,3 GWh/bulan; butuh 567,0 GWh/bulan');
    expect(msgs).toContain('±558,7');
  });
  it('R3 VAPE GADIS', () => expect(msgs).toContain('butuh +2 poin dalam 3 bulan (±93% → 95%)'));
  it('R4 Walk Down', () => expect(msgs).toContain('Walk Down butuh rata-rata 1.155 temuan/bulan Okt–Des; rata-rata Jan–Sep 1.197. Agustus terendah (961)'));
  it('R5 capaian', () => {
    expect(msgs).toContain('Rupiah transaksi PLN Mobile sudah melewati target setahun pada September');
    expect(msgs).toContain('selama 3 periode beruntun (Jul–Sep)');
    expect(msgs).toContain('5,0× target');
  });
  it('R6 Culture DNA', () => {
    expect(msgs).toContain('Do Extra Miles naik +0,31 (4,41 → 4,72), kenaikan terbesar');
    expect(msgs).toContain('Proaktif & Berdampak terendah (4,71)');
    expect(msgs).toContain('Tanpa Kompromi tertinggi (4,86)');
  });
  it('R7 menunggu data', () => {
    const g = groupInsights(list);
    expect(g.menunggu.map((i) => i.title)).toEqual(['Indeks Kepuasan Pelanggan', 'Susut distribusi (tanpa Emin)', 'Pertumbuhan penjualan']);
    expect(g.kawal.length).toBeGreaterThan(0);
  });
  it('Juni berbeda dari September', () => {
    const jun = buildInsights(data, '2026-06').map((i) => i.message).join('\n');
    expect(jun).not.toEqual(msgs);
    expect(jun).not.toContain('Do Extra Miles naik');
  });
});
