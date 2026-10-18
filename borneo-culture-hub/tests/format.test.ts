import { describe, expect, it } from 'vitest';
import { formatDate, formatDelta, formatNumber, formatPercent, formatRupiahMiliar, formatUnit } from '@/lib/format';

describe('format id-ID', () => {
  it('angka & persen', () => {
    expect(formatNumber(10770)).toBe('10.770');
    expect(formatNumber(989.68, 2)).toBe('989,68');
    expect(formatPercent(102.2368)).toBe('102,24%');
  });
  it('rupiah, unit, delta, tanggal', () => {
    expect(formatRupiahMiliar(279.01)).toBe('Rp279,01 M');
    expect(formatUnit(93, '%', 0, true)).toBe('±93%');
    expect(formatUnit(5339, 'GWh')).toBe('5.339 GWh');
    expect(formatDelta(0.31)).toBe('+0,31');
    expect(formatDate('2026-10-15')).toBe('15 Oktober 2026');
  });
});
