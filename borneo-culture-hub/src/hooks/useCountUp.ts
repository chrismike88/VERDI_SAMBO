import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/** Menganimasikan angka menuju `target`. Dari 0 saat pertama terlihat, lalu morph ≤300 ms saat nilai berubah. */
export function useCountUp(target: number, start: boolean, firstDuration = 1200) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? target : 0);
  const fromRef = useRef(reduced ? target : 0);
  const firstRef = useRef(true);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      fromRef.current = target;
      setVal(target);
      return;
    }
    const from = fromRef.current;
    const dur = firstRef.current ? firstDuration : 300;
    firstRef.current = false;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = from + (target - from) * e;
      setVal(v);
      fromRef.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, reduced, firstDuration]);

  return val;
}
