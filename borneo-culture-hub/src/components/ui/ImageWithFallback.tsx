import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export function ImageWithFallback({ src, alt, label, className = '', accent, imgClassName = 'object-cover' }: { src?: string; alt: string; label?: string; className?: string; accent?: string; imgClassName?: string }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className={`relative overflow-hidden ${className}`} style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}>
      {!failed ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`h-full w-full ${imgClassName}`} />
      ) : (
        <div role="img" aria-label={`${alt} (foto menyusul)`} className="placeholder-shimmer flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
          <ImageIcon size={22} className="text-white/50" aria-hidden />
          <span className="text-xs font-semibold text-white/70">{label ?? alt}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Foto menyusul</span>
        </div>
      )}
    </div>
  );
}
