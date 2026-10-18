import { Star, Check, AlertTriangle, X, Clock, PencilLine } from 'lucide-react';
import type { Status } from '@/data/schema';
import { STATUS_META } from '@/config/status';

const ICONS = { MELAMPAUI: Star, ON_TRACK: Check, PERLU_PERHATIAN: AlertTriangle, KRITIS: X, MENUNGGU_DATA: Clock } as const;

export function StatusPill({ status, size = 'md', adjusted, title }: { status: Status; size?: 'sm' | 'md' | 'lg'; adjusted?: string; title?: string }) {
  const m = STATUS_META[status];
  const Icon = ICONS[status];
  const c = `var(${m.cssVar})`;
  const pad = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      title={adjusted ? `Disesuaikan: ${adjusted}` : title}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${pad}`}
      style={{ color: c, background: `color-mix(in srgb, ${c} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 40%, transparent)` }}
    >
      <Icon aria-hidden size={size === 'lg' ? 16 : 13} strokeWidth={2.6} />
      {m.label}
      {adjusted && <PencilLine aria-label="disesuaikan" size={12} />}
    </span>
  );
}
