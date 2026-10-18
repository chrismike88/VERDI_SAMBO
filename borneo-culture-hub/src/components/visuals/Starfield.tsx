import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/** Kanvas bintang ringan (≤150 partikel). Diam saat reduced motion. */
export function Starfield({ count = 120, className = '' }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const n = Math.min(150, count);
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const stars = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2, v: 0.00002 + Math.random() * 0.00006 }));
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const frame = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reduced ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * 0.001 * s.s));
        if (!reduced) s.y -= s.v * 16;
        if (s.y < 0) s.y = 1;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${a})`;
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const loop = (t: number) => {
      if (visible) frame(t);
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [count, reduced]);
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
