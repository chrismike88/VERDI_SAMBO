/** Urutan slide Mode Presentasi. `target` = id elemen; `lens` membuka tab lensa. */
export interface Slide {
  target: string;
  title: string;
  lens?: { pillar: string; id: string };
}

export const SLIDES: Slide[] = [
  { target: 'beranda', title: 'Pembuka' },
  { target: 'ringkasan', title: 'Ringkasan 3 Pilar' },
  { target: 'radar', title: 'Radar Pengawalan' },
  { target: 'bersinar', title: 'PLN 1 · Borneo Bersinar' },
  { target: 'bersinar-khas', title: 'Ritual Safety & Walk Down' },
  { target: 'bersinar-lensa', title: 'Culture DNA Beyond Safety', lens: { pillar: 'bersinar', id: 'dna' } },
  { target: 'bersinar-lensa', title: 'Simbol Beyond Safety', lens: { pillar: 'bersinar', id: 'simbol' } },
  { target: 'best', title: 'PLN 2 · Borneo Best' },
  { target: 'best-khas', title: 'Siklus Beyond Service' },
  { target: 'best-lensa', title: 'Culture DNA Beyond Service', lens: { pillar: 'best', id: 'dna' } },
  { target: 'best-lensa', title: 'Simbol Beyond Service', lens: { pillar: 'best', id: 'simbol' } },
  { target: 'prima', title: 'PLN 3 · Borneo Prima' },
  { target: 'prima-khas', title: 'PRIMA & Lintasan Penjualan' },
  { target: 'prima-lensa', title: 'Culture DNA Beyond Growth', lens: { pillar: 'prima', id: 'dna' } },
  { target: 'prima-lensa', title: 'Simbol Beyond Growth', lens: { pillar: 'prima', id: 'simbol' } },
  { target: 'culture-dna', title: 'Culture DNA Konsolidasi' },
  { target: 'timeline', title: 'Perjalanan CO HUB 2026' },
  { target: '__thanks', title: 'Terima Kasih' },
];

export const PILLAR_JUMP: Record<string, string> = { '1': 'bersinar', '2': 'best', '3': 'prima' };
