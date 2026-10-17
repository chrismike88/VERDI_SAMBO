# BORNEO Culture Hub

Landing page untuk mengawal dan memonitor Program Budaya **PLN 1 · Borneo Bersinar** (Beyond Safety), **PLN 2 · Borneo Best** (Beyond Service), dan **PLN 3 · Borneo Prima** (Beyond Growth & Productivity) di PLN UID Kaltimra 2026. Spesifikasi lengkap ada di `PRD.md`, rencana build di `PLAN.md`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # cek file data
npm run test       # uji angka PRD Lampiran A.10, status §8.4, insight R1–R7
npm run build      # hasil statis di dist/
npm run build:single  # satu file HTML di dist-single/ (cadangan offline)
```

## Isi halaman

Hero (peta Kaltim–Kaltara + 6 UP3) · Ringkasan 3 Pilar · Radar Pengawalan · 3 section pilar (KPI band, visual khas, 6 lensa budaya) · Culture DNA 9 nilai · Timeline CO HUB · Galeri Evidence · Governance · Footer.

- **Period switcher** (CO HUB 1 · CO HUB 2 · Agu · CO HUB 3 · Prognosa Des) mengubah semua angka, status, dan isi Radar. Periode tersimpan di URL (`?periode=2026-07`).
- **Mode Presentasi:** tekan `P` (atau tombol). `→`/`PageDown`/`Space` maju, `←`/`PageUp` mundur, `1`/`2`/`3` lompat ke pilar, `F` layar penuh, `Esc` keluar. Clicker presenter standar langsung bisa dipakai. Urutan slide ada di `src/config/presentation.ts`.
- Deep link lensa: `#bersinar-dna`, `#best-simbol`, `#prima-alignment`, dst.

## Update data bulanan

Semua angka berasal dari **satu file**: `src/data/budaya-2026.json`. Komponen tidak berisi angka.

1. Tambah periode di `periods`, mis. `{ "id": "2026-10", "label": "Oktober 2026", "short": "Okt", "chip": "Okt", "month": 10, "isPrognosa": false }`.
2. Isi nilai periode itu di `values` tiap indikator (dan `targetYtd` bila ada).
3. Perbarui skor Culture DNA (`scores`), prognosa `2026-12P`, dan `meta.dataAsOf` / `meta.updatedAt`.
4. Opsional: isi `catatanRanger` dan `pic` pada indikator yang sedang dikawal — tampil di Radar.
5. Jalankan `npm run validate && npm run test && npm run build`, lalu salin `dist/` ke server.

Status dihitung otomatis (`src/lib/status.ts`, ambang di `src/config/status.ts`). Bila perlu menyesuaikan, pakai `statusOverride: { "status": "ON_TRACK", "reason": "…" }` pada indikator.

## Aset

Letakkan foto evidence di `public/assets/evidence/{bersinar,best,prima}/` dengan nama file sesuai `evidence[].src` di file data, dan screenshot dashboard di `public/assets/systems/`. Selama file belum ada, kartu tampil sebagai placeholder bergradien (build tidak gagal). Ganti penanda logo PLN/Danantara di `src/components/ui/PlnLogo.tsx` dan footer dengan logo resmi.

Peta Kalimantan dibuat dari GeoJSON batas provinsi (Dukcapil 2019) yang disederhanakan (`src/components/visuals/mapData.ts`).

## Deploy

- **Server intranet (disarankan):** salin isi `dist/` ke Nginx/IIS. Path relatif, jadi bisa di subfolder.
- **Vercel/Netlify:** deploy `dist/` dan aktifkan proteksi password.
- **Offline:** buka `dist-single/index.html` langsung dari laptop.

Halaman memakai `noindex` dan `robots.txt` disallow, tanpa tracker dan tanpa URL/IP internal. Untuk penggunaan internal PLN.

## Asumsi yang masih perlu dikonfirmasi (PRD §13)

- Hosting final; izin menampilkan nama individu & foto pegawai (saat ini tidak ditampilkan).
- Gangguan turun "sejak Juni" vs "sejak April" → dipakai teks netral.
- Definisi VAPE GADIS ±93% vs PDL valid 83,84% → ditampilkan terpisah dengan catatan.
- Pemetaan program resmi PLN 3 ↔ PRIMA → PRIMA tampil utama, daftar resmi ada di lensa Alignment.
- Culture DNA hanya Agu & Sep (skala 1–5 diasumsikan).
