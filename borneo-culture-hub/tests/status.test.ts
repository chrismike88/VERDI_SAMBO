import { describe, expect, it } from 'vitest';
import { data, pillarById, periodById } from '@/data';
import { indicatorStatus, pillarStatus } from '@/lib/status';

const sep = periodById('2026-09')!;
const st = (p: string, i: string) => indicatorStatus(pillarById(p).indicators.find((x) => x.id === i)!, data, sep);

describe('PRD §8.4 — status s.d. September 2026', () => {
  it.each([
    ['bersinar', 'kasus', 'ON_TRACK'],
    ['bersinar', 'lti', 'ON_TRACK'],
    ['bersinar', 'closing', 'ON_TRACK'],
    ['bersinar', 'apd', 'ON_TRACK'],
    ['best', 'trx_kali', 'MELAMPAUI'],
    ['best', 'trx_rp', 'MELAMPAUI'],
    ['best', 'feedback', 'MELAMPAUI'],
    ['best', 'gangguan_berulang', 'MELAMPAUI'],
    ['best', 'gangguan_penyulang', 'MELAMPAUI'],
    ['best', 'vape_gadis', 'ON_TRACK'],
    ['prima', 'penjualan', 'PERLU_PERHATIAN'],
    ['prima', 'produktivitas', 'PERLU_PERHATIAN'],
  ])('%s/%s → %s', (p, i, s) => {
    expect(st(p, i).status).toBe(s);
  });
  it('flag prognosa di PLN 3', () => {
    expect(st('prima', 'penjualan').flags).toContain('PROGNOSA_DI_BAWAH_TARGET');
    expect(st('prima', 'produktivitas').flags).toContain('PROGNOSA_DI_BAWAH_TARGET');
    expect(st('bersinar', 'closing').flags).toHaveLength(0);
  });
  it('status pilar', () => {
    expect(pillarStatus(pillarById('bersinar'), data, sep).status).toBe('ON_TRACK');
    expect(pillarStatus(pillarById('best'), data, sep).status).toBe('ON_TRACK');
    expect(pillarStatus(pillarById('prima'), data, sep).status).toBe('PERLU_PERHATIAN');
  });
});
