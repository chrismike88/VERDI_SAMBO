import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber } from '@/lib/format';

export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const v = useCountUp(value, inView);
  return (
    <span ref={ref} className={`tnum ${className}`}>
      <span aria-hidden>
        {prefix}
        {formatNumber(v, decimals)}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {formatNumber(value, decimals)}
        {suffix}
      </span>
    </span>
  );
}
