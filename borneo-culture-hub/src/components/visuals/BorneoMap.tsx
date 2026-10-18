import { motion, useReducedMotion } from 'motion/react';
import { MAP_NODES, MAP_PATHS, MAP_VIEWBOX } from './mapData';

/** Peta Kalimantan; Kaltim & Kaltara menyala dengan 6 node UP3 berdenyut. */
export function BorneoMap({ className = '', ignite = true, focus = true }: { className?: string; ignite?: boolean; focus?: boolean }) {
  const reduced = useReducedMotion() || !ignite;
  const nodes = Object.entries(MAP_NODES);
  const draw = (delay: number, dur = 2.2) => ({
    initial: { pathLength: reduced ? 1 : 0, fillOpacity: reduced ? 1 : 0 },
    animate: { pathLength: 1, fillOpacity: 1 },
    transition: { pathLength: { duration: reduced ? 0 : dur, delay, ease: [0.65, 0, 0.35, 1] as const }, fillOpacity: { duration: reduced ? 0 : 1, delay: delay + dur * 0.7 } },
  });
  return (
    <svg viewBox={focus ? '330 0 670 800' : MAP_VIEWBOX} className={className} role="img" aria-label="Peta Kalimantan Timur dan Kalimantan Utara dengan 6 UP3: Balikpapan, Samarinda, Bontang, Berau, Kaltara, Nusantara">
      <defs>
        <linearGradient id="mapFill" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="mapFill2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.35" />
        </linearGradient>
        <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="nodeGlow">
          <stop offset="0" stopColor="#fff7d1" />
          <stop offset="0.4" stopColor="#ffd66b" />
          <stop offset="1" stopColor="#f7b731" stopOpacity="0" />
        </radialGradient>
      </defs>
      <linearGradient id="westFade" x1="330" x2="640" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity="1" />
      </linearGradient>
      <mask id="westMask">
        <rect x="0" y="0" width="1000" height="804" fill="url(#westFade)" />
      </mask>
      <g mask="url(#westMask)">
      {(['kalbar', 'kalteng', 'kalsel'] as const).map((k) => (
        <motion.path key={k} d={MAP_PATHS[k]} fill="rgba(56,120,220,0.08)" stroke="rgba(125,211,252,0.22)" strokeWidth="1.2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 1.2 }} />
      ))}
      </g>
      <g filter="url(#mapGlow)">
        <motion.path d={MAP_PATHS.kaltim} fill="url(#mapFill)" stroke="#7dd3fc" strokeWidth="2.4" strokeLinejoin="round" {...draw(0.1)} />
        <motion.path d={MAP_PATHS.kaltara} fill="url(#mapFill2)" stroke="#a5f3fc" strokeWidth="2.4" strokeLinejoin="round" {...draw(0.4)} />
      </g>
      {nodes.map(([name, [x, y]], i) => {
        const delay = reduced ? 0 : 1.6 + i * 0.18;
        const right = name !== 'Nusantara' && name !== 'Balikpapan';
        return (
          <motion.g key={name} initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: reduced ? 0 : 0.5 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            {!reduced && <circle cx={x} cy={y} r="6" fill="none" stroke="#ffd66b" strokeWidth="2" className="node-pulse" style={{ animationDelay: `${i * 0.4}s` }} />}
            <circle cx={x} cy={y} r="16" fill="url(#nodeGlow)" opacity="0.8" />
            <circle cx={x} cy={y} r="5" fill="#fff" />
            <text x={right ? x + 16 : x - 16} y={y + 5} textAnchor={right ? 'start' : 'end'} fontSize="17" fontWeight="700" fill="#eaf2ff" style={{ paintOrder: 'stroke', stroke: '#040a1c', strokeWidth: 4 }}>
              {name}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
