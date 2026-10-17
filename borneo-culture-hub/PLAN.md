# PLAN — Build "BORNEO Culture Hub" dengan Claude Code

Rencana build bertahap untuk landing page monitoring Program Budaya PLN 1·2·3 (Borneo Bersinar · Borneo Best · Borneo Prima) PLN UID Kaltimra.

- Apa yang dibangun dan kenapa → **`PRD.md`**
- Bagaimana dan dalam urutan apa → dokumen ini

---

## 0. Cara memakai dokumen ini

1. **Buat folder proyek** `borneo-culture-hub/`. Taruh `PRD.md` dan `PLAN.md` di root.
2. **Siapkan aset** sesuai PRD Lampiran B di folder `assets-raw/`. Export dari file PowerPoint/gambar asli, bukan screenshot PDF. Aset boleh menyusul karena komponen punya placeholder.
3. **Inisialisasi git** (`git init`) agar tiap fase bisa di-*commit* dan mudah dibatalkan.
4. **Buka Claude Code** di folder itu. Jalankan fase satu per satu memakai prompt di §4. Pola kerjanya: satu fase = satu sesi → cek *Definition of Done* → lihat di browser → commit.
5. **Minta rencana dulu.** Di awal tiap fase, minta Claude Code menjelaskan rencananya sebelum menulis kode. Koreksi bila perlu, baru lanjut.

**Prinsip yang wajib dijaga di semua fase:**
- **Satu sumber angka:** `src/data/budaya-2026.json`. Komponen tidak boleh berisi angka hardcode.
- **Status dihitung**, bukan ditulis manual (aturan PRD §8).
- **Format Indonesia** (`id-ID`) lewat `src/lib/format.ts`.
- **Aksesibel & ringan:** *reduced motion*, keyboard, kontras AA, tanpa library 3D berat.
- **Tanpa URL/IP internal** dan tanpa tracker pihak ketiga.

---

## 1. Keputusan teknis

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Build tool | **Vite** | Cepat. Hasil statis (`dist/`) mudah di-host di server intranet. Tidak butuh SSR. |
| UI | **React + TypeScript (strict)** | Komponen dipakai ulang 3× (template pilar). Tipe data mencegah salah input. |
| Styling | **Tailwind CSS v4** + CSS variables (design tokens PRD §10.2) | Cepat diiterasi; token terpusat. |
| Animasi | **Motion for React** (`motion/react`) | Entrance, layout morph, scroll-linked. Mendukung *reduced motion*. |
| Grafik | **Recharts** (line, area, radar, bar) + **SVG kustom** (ring, gauge, sparkline) | Cukup ringan; SVG kustom untuk elemen yang perlu kontrol penuh. |
| Ikon | **lucide-react** | Konsisten, tree-shakable. |
| Validasi data | **Zod** | Menangkap salah ketik saat update bulanan. |
| State | React Context (`PeriodContext`, `PresentationContext`) | Cukup untuk 2 state global. |
| Smooth scroll | **Lenis** (opsional) | Nonaktif saat *reduced motion* & mode presentasi. |
| Font | `@fontsource-variable/plus-jakarta-sans` | Self-hosted, jalan offline. |
| Test | **Vitest** + Testing Library | Uji status engine, insight, format, dan angka PRD. |
| Kualitas kode | ESLint + Prettier | Konsistensi. |
| Opsional | `vite-plugin-singlefile` | Build 1 file HTML sebagai cadangan offline di lokasi forum. |

> Pakai versi stabil terbaru tiap paket saat instalasi. Jangan mengunci versi lama.

---

## 2. Struktur folder target

```
borneo-culture-hub/
├─ PRD.md · PLAN.md · CLAUDE.md
├─ assets-raw/                      ← aset mentah dari PPT (tidak ikut build)
├─ public/
│  ├─ robots.txt                    ← Disallow: /
│  └─ assets/ brand/ pillars/ decor/ map/ evidence/{bersinar,best,prima}/ systems/
├─ scripts/
│  ├─ validate-data.ts              ← npm run validate
│  └─ optimize-images.mjs           ← konversi assets-raw → WebP/AVIF
├─ src/
│  ├─ data/
│  │  ├─ budaya-2026.json           ← SATU-SATUNYA sumber angka (PRD Lampiran A)
│  │  └─ schema.ts                  ← Zod schema + tipe TS
│  ├─ config/
│  │  ├─ status.ts                  ← ambang status (PRD §8.2)
│  │  ├─ pillars.ts                 ← warna aksen, ikon, urutan
│  │  └─ presentation.ts            ← urutan slide mode presentasi
│  ├─ lib/
│  │  ├─ format.ts                  ← angka/mata uang/tanggal id-ID
│  │  ├─ metrics.ts                 ← capaian, pace, run-rate, delta
│  │  ├─ status.ts                  ← status engine
│  │  └─ insights.ts                ← insight engine R1–R7
│  ├─ state/  PeriodContext.tsx · PresentationContext.tsx
│  ├─ hooks/  useCountUp · useActiveSection · useReducedMotion · useKeyNav · useInView
│  ├─ components/
│  │  ├─ ui/       GlassCard · StatusPill · KpiCard · ProgressRing · Gauge · Sparkline · CountUp
│  │  │            Tabs · SectionHeader · Tooltip · Lightbox · ChartTableToggle · ImageWithFallback
│  │  ├─ layout/   Navbar · PeriodSwitcher · MobileSheet · Footer · PresentationShell
│  │  └─ visuals/  BorneoMap · EnergyLine · Starfield
│  ├─ sections/
│  │  ├─ Hero · Ringkasan · RadarPengawalan · CultureDna · TimelineCohub · Evidence · Governance
│  │  └─ pillar/
│  │     ├─ PillarSection.tsx · PillarHeader.tsx · KpiBand.tsx · LensaPanel.tsx
│  │     ├─ lenses/  Alignment · Ritual · Leader · Dna · Sistem · Simbol
│  │     ├─ bersinar/ RitualSafetyTimeline · WalkDownChart · SafetyImpact · BehaviourChange
│  │     ├─ best/     ServiceOrbit · BestAcrostic · GangguanCompare · ProgramMiniCharts
│  │     └─ prima/    PrimaLetters · PrimaGauges · SalesTrajectory · CrmSnapshot
│  ├─ styles/ globals.css           ← tokens, base, utilities, print
│  ├─ App.tsx · main.tsx
└─ tests/  format.test.ts · metrics.test.ts · status.test.ts · insights.test.ts · data.test.ts
```

---

## 3. Fase build

Estimasi waktu dihitung dalam **sesi Claude Code** (±1–2 jam termasuk review). Total ±12 sesi.

### Fase 0 — Setup proyek
- [ ] Scaffold Vite + React + TS (strict). Tambahkan path alias `@/`.
- [ ] Pasang Tailwind v4, Motion, Recharts, lucide-react, Zod, font Plus Jakarta Sans, Vitest, ESLint, Prettier.
- [ ] Buat struktur folder §2 (file kosong/stub boleh).
- [ ] Siapkan `globals.css` berisi design tokens PRD §10.2, base typography, dan `prefers-reduced-motion`.
- [ ] Buat `CLAUDE.md`: ringkasan aturan proyek, perintah npm, konvensi (no hardcoded numbers, id-ID, aksesibilitas).
- [ ] Tambahkan `index.html` dengan `lang="id"`, `<meta name="robots" content="noindex">`, title, favicon. Tambahkan `public/robots.txt`.
- [ ] Siapkan script npm: `dev`, `build`, `preview`, `test`, `validate`, `lint`.

**DoD:** `npm run dev` menampilkan halaman kosong berlatar navy dengan font Jakarta Sans. `npm run build` dan `npm run lint` lolos.

### Fase 1 — Data layer, status engine, insight engine
- [ ] Tulis `schema.ts` (Zod) sesuai PRD §9.
- [ ] Isi `budaya-2026.json` lengkap dari PRD Lampiran A.1–A.9.
- [ ] Tulis `format.ts`: `formatNumber`, `formatPercent`, `formatRupiahMiliar`, `formatUnit`, `formatDate`, dan tanda "±".
- [ ] Tulis `metrics.ts`: capaian vs target, pace (`bulan/12`), `targetYtd`, run-rate, kebutuhan per bulan, delta Culture DNA.
- [ ] Tulis `status.ts` sesuai PRD §8.2–8.3, termasuk flag `PROGNOSA_DI_BAWAH_TARGET` dan `statusOverride`.
- [ ] Tulis `insights.ts` aturan R1–R7 (PRD §8.5). Output: array `{ kind: 'warn'|'win'|'info'|'na', pillarId, title, message, figures }`.
- [ ] Tulis `scripts/validate-data.ts` dengan pesan error berbahasa Indonesia.
- [ ] Test:
  - `data.test.ts` meng-assert **semua** nilai PRD Lampiran A.10.
  - `status.test.ts` meng-assert **semua** baris PRD §8.4.

**DoD:** `npm run validate` dan `npm run test` hijau. Status PLN 1 = On Track, PLN 2 = On Track, PLN 3 = Perlu Perhatian (flag prognosa).

### Fase 2 — Design system & komponen dasar
- [ ] Buat `GlassCard`, `StatusPill`, `KpiCard`, `ProgressRing`, `Gauge`, `Sparkline` (segmen prognosa putus-putus), `CountUp` (tabular-nums, hormati *reduced motion*), `Tabs` (ARIA, panah kiri/kanan), `SectionHeader`, `Tooltip` (rumus + sumber), `ChartTableToggle`, `ImageWithFallback`, `Lightbox`.
- [ ] Buat `BorneoMap` (SVG peta + 6 node UP3 berdenyut; fallback siluet abstrak bila `kaltim-kaltara.svg` belum ada), `EnergyLine` (path emas animasi `stroke-dashoffset`), `Starfield` (canvas ringan ≤ 150 partikel, diam saat *reduced motion*).
- [ ] Buat halaman uji internal sementara (`?ui=1`) untuk melihat semua komponen. Hapus atau sembunyikan di build produksi.

**DoD:** semua komponen tampil benar di 360px dan 1440px. Kontras AA. Fokus keyboard terlihat.

### Fase 3 — App shell, Navbar, Period Switcher, Hero
- [ ] Buat `PeriodContext`: periode aktif, sinkron dengan `?periode=`, default periode aktual terbaru.
- [ ] Buat `Navbar`: sticky, efek glass setelah 40px, anchor aktif (IntersectionObserver), `PeriodSwitcher`, tombol Mode Presentasi. Mobile: `MobileSheet` dan bottom bar periode.
- [ ] Buat `Hero` sesuai PRD F-02, termasuk "Hero ignition": peta tergambar → node menyala → garis emas menyapu → 4 angka bergulir.
- [ ] Buat `Footer` sesuai F-14.

**DoD:** ganti periode mengubah angka hero dengan animasi ≤ 300 ms. Elemen LCP = H1. Mode *reduced motion* tampil statis tanpa error.

### Fase 4 — Ringkasan 3 Pilar & Radar Pengawalan
- [ ] Buat `Ringkasan` (F-03): 3 kartu dengan status terhitung + label "Laporan unit", ring indikator, 2 KPI, rata-rata Culture DNA + delta.
- [ ] Buat `RadarPengawalan` (F-04): 3 kolom (Perlu Dikawal · Capaian Menonjol · Menunggu Data) dari `insights.ts`.

**DoD:** untuk data Sep 2026, Radar memuat minimal item PRD §8.4 dan contoh pesan R1–R7. Ganti ke CO HUB 1 mengubah isi Radar sesuai data Juni.

### Fase 5 — Template Pillar + Borneo Bersinar
- [ ] Buat template generik `PillarSection`, `PillarHeader`, `KpiBand`, `LensaPanel` (6 tab), dan semua komponen di `lenses/`.
- [ ] Buat konten khas Bersinar (F-06): `RitualSafetyTimeline` (menyala mengikuti scroll), `WalkDownChart` (aktual + band prognosa + anotasi), `SafetyImpact`, `BehaviourChange` (text morph), dampak sidak, quote.

**DoD:** semua angka Bersinar cocok dengan Lampiran A.2–A.3. Tab bisa dinavigasi keyboard. Deep link `#bersinar-dna` berfungsi. Tampilan mobile rapi.

### Fase 6 — Borneo Best
- [ ] Buat `ServiceOrbit` (F-07): orbit 5 node, panel detail, rotasi sorotan otomatis yang bisa dijeda. Mobile berubah jadi daftar bernomor.
- [ ] Buat `BestAcrostic`, `GangguanCompare`, `ProgramMiniCharts`.
- [ ] Isi 6 lensa Best dari data.

**DoD:** angka cocok dengan Lampiran A.4–A.6. Orbit dapat dioperasikan dengan keyboard (Tab/Enter). *Reduced motion* menghentikan rotasi.

### Fase 7 — Borneo Prima
- [ ] Buat `PrimaLetters` (kartu flip 5 huruf), `PrimaGauges` (4 gauge + label basis pembanding), `SalesTrajectory` (aktual + prognosa + garis target, memperlihatkan gap), `CrmSnapshot`.
- [ ] Isi 6 lensa Prima. Tab Business Focus Alignment menampilkan daftar program resmi dan PRIMA.

**DoD:** angka cocok dengan Lampiran A.7–A.8. Gap prognosa penjualan (25 GWh) dan produktivitas (0,10) terlihat jelas di grafik.

### Fase 8 — Culture DNA, Timeline, Evidence, Governance
- [ ] Buat `CultureDna` (F-09): radar 9 sumbu Agu vs Sep (morph), filter pilar, bar rata-rata per pilar, sorotan otomatis, alternatif tabel.
- [ ] Buat `TimelineCohub` (F-10): node periode yang terhubung ke `PeriodContext`, plus event.
- [ ] Buat `Evidence` (F-11): masonry, filter pilar/lensa, lightbox, placeholder.
- [ ] Buat `Governance` (F-12).

**DoD:** semua section tampil berurutan sesuai PRD §6. Navigasi anchor dari navbar mendarat tepat (memperhitungkan tinggi navbar).

### Fase 9 — Mode Presentasi
- [ ] Buat `PresentationContext` dan `PresentationShell`. Urutan slide dari `config/presentation.ts`.
- [ ] Keyboard: `P` (masuk/keluar), `F` (fullscreen), `→` / `PageDown` / `Space` (maju), `←` / `PageUp` (mundur), `1` / `2` / `3` (lompat pilar), `Esc` (keluar).
- [ ] Skala tipografi untuk 1920×1080 dan 1280×720. Tambahkan progress bar, penghitung slide, dan slide penutup "Terima Kasih".
- [ ] Keluar dari mode presentasi mengembalikan posisi scroll semula.

**DoD:** diuji dengan *presenter clicker* (atau simulasi PageUp/PageDown) di layar 1920×1080 tanpa jank.

### Fase 10 — Polish: motion, responsif, aksesibilitas, performa, cetak
- [ ] Audit motion: durasi/easing sesuai PRD §10.5, tanpa efek berlebihan, *reduced motion* penuh.
- [ ] Uji responsif di 360 · 390 · 768 · 1024 · 1280 · 1440 · 1920 px.
- [ ] Aksesibilitas: audit axe, uji keyboard penuh, `alt` lengkap, alternatif tabel grafik, kontras AA.
- [ ] Performa: code-split Recharts per section, gambar WebP/AVIF + `srcset` + lazy (`scripts/optimize-images.mjs`), preload font. Target Lighthouse ≥ 90 (Performance) dan ≥ 95 (Accessibility).
- [ ] Tambahkan stylesheet cetak (mode terang, tiap section mulai halaman baru) agar bisa "Save as PDF".
- [ ] Rapikan copy: typo sumber sudah dikoreksi (PRD §12 D13), istilah konsisten.

**DoD:** skor Lighthouse tercapai. Tidak ada error console. Cetak PDF terbaca.

### Fase 11 — Build & deploy
- [ ] Jalankan `npm run build` → `dist/`. Uji dengan `npm run preview`.
- [ ] Opsional: `npm run build:single` (vite-plugin-singlefile) → `dist-single/index.html` untuk cadangan offline. Bila ukurannya terlalu besar, gambar evidence boleh dikecualikan.
- [ ] Tulis panduan deploy di `README.md`:
  - (a) salin `dist/` ke server intranet (Nginx/IIS), atau
  - (b) Vercel/Netlify dengan proteksi akses.
  - Pilihan final mengikuti keputusan PRD §13 no. 2.

**DoD:** halaman bisa diakses dari target hosting dan berjalan tanpa internet setelah termuat.

---

## 4. Prompt Claude Code per fase (copy-paste)

**Prompt pembuka (sekali, di awal):**
```
Baca PRD.md dan PLAN.md di root project ini sampai selesai. Ringkas dalam 10 poin apa yang
akan kita bangun, aturan utama (satu sumber angka, status dihitung, format id-ID, aksesibilitas),
dan daftar pertanyaan terbuka yang memengaruhi build. Jangan menulis kode dulu.
```

**Fase 0:**
```
Kerjakan PLAN.md Fase 0. Ikuti stack di PLAN.md §1 dan struktur folder §2. Pakai design tokens
dari PRD §10.2 di src/styles/globals.css. Buat CLAUDE.md berisi aturan proyek. Jelaskan rencanamu
dulu, lalu eksekusi. Di akhir, jalankan npm run build dan npm run lint, lalu laporkan checklist Fase 0.
```

**Fase 1:**
```
Kerjakan PLAN.md Fase 1. Isi src/data/budaya-2026.json LENGKAP dari PRD Lampiran A.1–A.9
(normalisasi angka sesuai PRD §12). Implementasikan schema Zod, format.ts, metrics.ts, status.ts
(PRD §8.2–8.3), dan insights.ts (PRD §8.5). Tulis test yang meng-assert semua nilai PRD Lampiran
A.10 dan semua baris PRD §8.4. Jalankan npm run validate dan npm run test sampai hijau. Bila ada
angka di PRD yang menurutmu tidak konsisten, laporkan, jangan diubah diam-diam.
```

**Fase 2:**
```
Kerjakan PLAN.md Fase 2. Bangun komponen dasar dan visual (BorneoMap, EnergyLine, Starfield)
sesuai PRD §10.3–10.6. Konsep visual "Night Grid Borneo": navy malam, glow biru-cyan, aksen emas,
kartu glass. Hindari tampilan template generik. Semua komponen harus menghormati
prefers-reduced-motion dan bisa dioperasikan dengan keyboard. Buat halaman uji ?ui=1.
```

**Fase 3:**
```
Kerjakan PLAN.md Fase 3: PeriodContext (sinkron ?periode=), Navbar + PeriodSwitcher (desktop &
mobile), Hero sesuai PRD F-02 dengan momen "Hero ignition", dan Footer F-14. Semua angka diambil
dari data + lib, tidak ada hardcode. Pastikan elemen LCP adalah H1.
```

**Fase 4:**
```
Kerjakan PLAN.md Fase 4: section Ringkasan (PRD F-03) dan Radar Pengawalan (PRD F-04) yang
memakai status.ts dan insights.ts. Tunjukkan isi Radar untuk periode 2026-09 dan 2026-06 sebagai bukti.
```

**Fase 5:**
```
Kerjakan PLAN.md Fase 5: template PillarSection + LensaPanel 6 tab (PRD F-05) yang generik untuk
3 pilar, lalu konten khas Borneo Bersinar (PRD F-06). Cocokkan setiap angka dengan PRD Lampiran A.2–A.3.
```

**Fase 6:**
```
Kerjakan PLAN.md Fase 6: konten khas Borneo Best (PRD F-07) — ServiceOrbit, BestAcrostic,
GangguanCompare, ProgramMiniCharts — memakai template pilar yang sudah ada. Cocokkan angka dengan
PRD Lampiran A.4–A.6.
```

**Fase 7:**
```
Kerjakan PLAN.md Fase 7: konten khas Borneo Prima (PRD F-08) — PrimaLetters, PrimaGauges (dengan
label basis pembanding), SalesTrajectory (gap prognosa harus jelas), CrmSnapshot. Cocokkan angka
dengan PRD Lampiran A.7–A.8.
```

**Fase 8:**
```
Kerjakan PLAN.md Fase 8: CultureDna (PRD F-09), TimelineCohub (F-10), Evidence (F-11), Governance
(F-12). Radar Culture DNA wajib punya alternatif tabel. Aset yang belum ada tampil sebagai placeholder.
```

**Fase 9:**
```
Kerjakan PLAN.md Fase 9: Mode Presentasi sesuai PRD F-13, kompatibel dengan presenter clicker
(PageUp/PageDown). Urutan slide di src/config/presentation.ts. Uji di viewport 1920x1080 dan 1280x720.
```

**Fase 10:**
```
Kerjakan PLAN.md Fase 10: audit motion, responsif (360–1920 px), aksesibilitas (axe + keyboard),
performa (code-split, optimasi gambar, Lighthouse ≥ 90 perf / ≥ 95 a11y), dan stylesheet cetak.
Laporkan skor dan perbaikan yang dilakukan.
```

**Fase 11:**
```
Kerjakan PLAN.md Fase 11: build produksi, opsi build single-file, dan README berisi panduan deploy
ke server intranet dan ke Vercel/Netlify dengan proteksi akses.
```

**Prompt perbaikan visual (kapan saja):**
```
Bagian [nama section] terasa [datar/terlalu ramai/kurang kontras]. Perbaiki sesuai konsep
"Night Grid Borneo" di PRD §10 tanpa mengubah data atau logika status. Tunjukkan sebelum/sesudah.
```

---

## 5. QA & verifikasi

| Area | Cara cek | Lulus bila |
|---|---|---|
| Angka | `npm run test` (`data.test.ts`, `status.test.ts`) | Semua nilai PRD A.10 & §8.4 cocok |
| Data | `npm run validate` | Tanpa error |
| Periode | Klik tiap periode di switcher | Semua angka, grafik, status, dan Radar berubah konsisten; Prognosa bergaya putus-putus |
| Responsif | DevTools: 360, 390, 768, 1024, 1280, 1440, 1920 | Tanpa scroll horizontal (kecuali tabel yang memang di-scroll), teks tidak terpotong |
| Proyektor | Mode Presentasi di 1920×1080 & 1280×720, uji clicker | Terbaca dari belakang ruangan, navigasi lancar |
| Motion | DevTools → Rendering → emulasi `prefers-reduced-motion` | Tidak ada animasi gerak; angka langsung final |
| Aksesibilitas | axe DevTools + navigasi hanya keyboard | 0 pelanggaran serius; semua kontrol bisa dijangkau |
| Performa | Lighthouse (desktop & mobile) | Perf ≥ 90 (desktop), A11y ≥ 95 |
| Kerahasiaan | Cari "10.32", "http://10." di `dist/` | Tidak ditemukan; `noindex` aktif |
| Copy | Baca seluruh halaman | Typo sumber terkoreksi; istilah konsisten |

---

## 6. SOP update data bulanan (setelah tiap CO HUB / akhir bulan)

1. Buka `src/data/budaya-2026.json`.
2. Tambahkan periode baru di `periods`, misalnya:
   ```json
   { "id": "2026-10", "label": "Oktober 2026", "short": "Okt", "month": 10, "isPrognosa": false }
   ```
3. Isi nilai periode itu di `values` setiap indikator. Bila ada target YTD, isi juga di `targetYtd`.
4. Perbarui skor Culture DNA (`scores`) bila survei terbaru tersedia.
5. Perbarui prognosa `2026-12P` bila direvisi.
6. Perbarui `meta.dataAsOf`, `meta.updatedAt`, dan `source`.
7. Isi `catatanRanger` atau `pic` untuk indikator yang sedang dikawal (opsional).
8. Jalankan `npm run validate`, lalu `npm run test`, lalu `npm run build`.
9. Deploy ulang isi `dist/`.

**Alternatif lewat Claude Code:**
```
Update data periode 2026-10 di src/data/budaya-2026.json dengan angka berikut: [tempel tabel].
Jangan ubah komponen. Jalankan validate, test (perbarui expected value test bila memang berubah
karena data baru), dan build. Laporkan perubahan status dan insight baru di Radar.
```

---

## 7. Roadmap v2

| Prioritas | Fitur |
|---|---|
| Tinggi | Impor data dari template Excel → JSON (script), agar update cukup mengisi spreadsheet |
| Tinggi | Drill-down 6 UP3 (Balikpapan, Samarinda, Bontang, Berau, Kaltara, Nusantara): peta interaktif + ranking |
| Sedang | Riwayat Culture DNA lengkap (Jun–Des) & jumlah responden |
| Sedang | Ekspor PDF otomatis per CO HUB |
| Sedang | Integrasi API: HSSE CC, CRM, Dashboard Distribusi (butuh izin TI) |
| Rendah | Login & form admin untuk input data |
| Rendah | Multi-tahun (2027 dst.) |

---

## 8. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Inkonsistensi data sumber (PRD §12) | Angka salah tampil di forum | Satu sumber JSON, normalisasi, test otomatis, label "angka laporan", konfirmasi ❓ ke PIC |
| Aset beresolusi rendah (crop dari PDF) | Kesan kurang profesional | Export dari PPT asli; placeholder rapi bila belum ada |
| Efek visual berat di laptop kantor/proyektor | Patah-patah saat presentasi | Tanpa 3D, partikel dibatasi, code-split, uji di perangkat nyata |
| Data internal terbuka ke publik | Risiko kerahasiaan | Host intranet/terproteksi, `noindex`, tanpa URL/IP internal, izin nama & foto |
| Scope creep (fitur v2 masuk v1) | Molor | Pegang tabel MUST/SHOULD/COULD PRD §5 |
| Status terhitung berbeda dengan "laporan unit" | Diskusi sensitif di forum | Tampilkan keduanya berdampingan + rumus transparan di tooltip |
| Tidak ada internet di lokasi forum | Halaman gagal termuat | Font & aset self-hosted + build single-file sebagai cadangan |

---

## 9. Definition of Done global (v1)

- [ ] Semua fitur MUST dan SHOULD di PRD §5 berfungsi.
- [ ] `npm run validate`, `npm run test`, `npm run lint`, dan `npm run build` hijau.
- [ ] Status pilar s.d. Sep 2026: PLN 1 On Track · PLN 2 On Track · PLN 3 Perlu Perhatian (sesuai PRD §8.4).
- [ ] Lighthouse desktop: Perf ≥ 90, A11y ≥ 95.
- [ ] Mode Presentasi lulus uji clicker di 1920×1080.
- [ ] Tidak ada angka hardcode di komponen (cek: `grep` angka kunci seperti 10770, 5339, 989 di `src/components` dan `src/sections` tidak menemukan hasil).
- [ ] Pertanyaan terbuka PRD §13 sudah dijawab atau dicatat sebagai asumsi di `CLAUDE.md`.
