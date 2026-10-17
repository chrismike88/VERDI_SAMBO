import { ShieldCheck, Zap, TrendingUp, type LucideIcon } from 'lucide-react';
import type { PillarId } from '@/data/schema';

export const PILLAR_STYLE: Record<PillarId | 'all', { color: string; glow: string; icon: LucideIcon; short: string }> = {
  bersinar: { color: 'var(--bersinar)', glow: 'var(--bersinar-glow)', icon: ShieldCheck, short: 'Safety' },
  best: { color: 'var(--best)', glow: 'var(--best-glow)', icon: Zap, short: 'Service' },
  prima: { color: 'var(--prima)', glow: 'var(--gold-glow)', icon: TrendingUp, short: 'Growth' },
  all: { color: 'var(--gold)', glow: 'var(--gold-glow)', icon: Zap, short: 'Semua' },
};

export const LENSES = [
  { id: 'alignment', label: 'Business Focus Alignment', short: 'Alignment' },
  { id: 'ritual', label: 'Ritual & Program', short: 'Ritual' },
  { id: 'leader', label: 'Leader Behavior', short: 'Leader' },
  { id: 'dna', label: 'Culture DNA', short: 'Culture DNA' },
  { id: 'sistem', label: 'Sistem', short: 'Sistem' },
  { id: 'simbol', label: 'Simbol', short: 'Simbol' },
] as const;
export type LensId = (typeof LENSES)[number]['id'];
