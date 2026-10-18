const nf = (min: number, max: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: min, maximumFractionDigits: max });

export function formatNumber(v: number, decimals = 0, minDecimals = decimals): string {
  return nf(minDecimals, decimals).format(v);
}

/** Persen dengan koma desimal: 75.66 → "75,66%" */
export function formatPercent(v: number, decimals = 2): string {
  return `${formatNumber(v, decimals)}%`;
}

export function formatDelta(v: number, decimals = 2): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  return `${sign}${formatNumber(Math.abs(v), decimals)}`;
}

/** Rupiah dalam miliar: 279.01 → "Rp279,01 M" */
export function formatRupiahMiliar(v: number, decimals = 2): string {
  return `Rp${formatNumber(v, decimals)} M`;
}

/** Nilai + satuan sesuai unit indikator. */
export function formatUnit(v: number, unit: string, decimals = 0, approx = false): string {
  const pre = approx ? '±' : '';
  switch (unit) {
    case '%':
      return `${pre}${formatNumber(v, decimals)}%`;
    case 'Rp miliar':
      return `${pre}${formatRupiahMiliar(v, decimals)}`;
    case 'ribu kali':
      return `${pre}${formatNumber(v, decimals)} rb`;
    default:
      return `${pre}${formatNumber(v, decimals)} ${unit}`;
  }
}

/** Hanya angka (tanpa satuan) untuk tampilan besar. */
export function formatValue(v: number, unit: string, decimals = 0): string {
  if (unit === 'Rp miliar') return `Rp${formatNumber(v, decimals)}`;
  return formatNumber(v, decimals);
}

export function unitSuffix(unit: string): string {
  switch (unit) {
    case '%':
      return '%';
    case 'Rp miliar':
      return 'M';
    case 'ribu kali':
      return 'rb kali';
    default:
      return unit;
  }
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "2026-10-15" → "15 Oktober 2026" (atau "15 Okt 2026" bila short) */
export function formatDate(iso: string, short = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const names = short ? BULAN_PENDEK : BULAN;
  return d ? `${d} ${names[m - 1]} ${y}` : `${names[m - 1]} ${y}`;
}

export function formatDateRange(start: string, end?: string): string {
  if (!end) return formatDate(start, true);
  const [, m1, d1] = start.split('-').map(Number);
  const [y2, m2, d2] = end.split('-').map(Number);
  if (m1 === m2) return `${d1}–${d2} ${BULAN_PENDEK[m2 - 1]} ${y2}`;
  return `${d1} ${BULAN_PENDEK[m1 - 1]} – ${d2} ${BULAN_PENDEK[m2 - 1]} ${y2}`;
}
