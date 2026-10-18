import type { Status } from '@/data/schema';

/** Ambang status (PRD §8.2). Ubah di sini, bukan di komponen. */
export const THRESHOLDS = {
  max: { exceed: 0.5, ok: 1, warn: 1.1 },
  min: { exceed: 1.1, warnReqRatio: 0.5 },
  cumulative: { warn: 0.95 },
} as const;

export const STATUS_META: Record<Status, { label: string; icon: string; cssVar: string; rank: number }> = {
  MELAMPAUI: { label: 'Melampaui Target', icon: '★', cssVar: '--status-exceed', rank: 0 },
  ON_TRACK: { label: 'On Track', icon: '✓', cssVar: '--status-ok', rank: 1 },
  PERLU_PERHATIAN: { label: 'Perlu Perhatian', icon: '!', cssVar: '--status-warn', rank: 2 },
  KRITIS: { label: 'Kritis', icon: '✕', cssVar: '--status-crit', rank: 3 },
  MENUNGGU_DATA: { label: 'Menunggu Data', icon: '⏳', cssVar: '--status-na', rank: -1 },
};
