/** Penanda logo PLN sederhana (ganti dengan aset resmi di public/assets/brand/logo-pln.svg). */
export function PlnMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="6" fill="#FFD200" />
      <path d="M22 5 11 22h8l-3 13 13-19h-8l3-11z" fill="#E4261B" />
      <path d="M7 27c4 2 8 2 13 0s9-2 13 0M7 31c4 2 8 2 13 0s9-2 13 0" stroke="#00A3E0" strokeWidth="2" fill="none" />
    </svg>
  );
}
