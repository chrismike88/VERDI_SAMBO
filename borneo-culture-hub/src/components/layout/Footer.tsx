import { ShieldAlert } from 'lucide-react';
import { data } from '@/data';
import { formatDate } from '@/lib/format';
import { PlnMark } from '@/components/ui/PlnLogo';

export function Footer() {
  const m = data.meta;
  return (
    <footer className="relative border-t border-[var(--border)] bg-[#030817] pb-28 pt-16 lg:pb-12">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <PlnMark size={40} />
              <span className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-extrabold tracking-[0.2em] text-[var(--text-muted)]" title="Ganti dengan logo resmi Danantara di public/assets/brand/">
                DANANTARA
              </span>
            </div>
            <p className="mt-4 text-lg font-extrabold">
              BORNEO <span className="text-gold-grad">Culture Hub</span>
            </p>
            <p className="text-sm text-[var(--text-muted)]">Beyond Reliability, No Compromise on Safety, Excellence for Outstanding Growth.</p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Disusun oleh</p>
            <p className="font-bold">{m.disusunOleh}</p>
            <p className="mt-3 text-[var(--text-muted)]">Ranger Master</p>
            <p className="font-bold">{m.rangerMaster}</p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Sumber data</p>
            <ul className="space-y-1 text-[var(--text-muted)]">
              {m.sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-3">
              Data s.d. <strong>{formatDate(m.dataAsOf)}</strong> · diperbarui <strong>{formatDate(m.updatedAt)}</strong>
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border)] pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-extrabold tracking-wide text-[var(--gold-glow)]">People First · Safety Always · Sustainability for Future</p>
            <p className="text-[var(--text-muted)]">Pemimpin menjadi teladan. Tim bergerak bersama. Pelanggan merasakan manfaat.</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <ShieldAlert size={14} aria-hidden /> Untuk penggunaan internal PLN · © {m.year} {m.unit}
          </p>
        </div>
      </div>
    </footer>
  );
}
