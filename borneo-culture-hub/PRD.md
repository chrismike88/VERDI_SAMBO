# PRD — BORNEO Culture Hub
### Landing Page Monitoring Program Budaya PLN 1 · 2 · 3 — PLN UID Kaltimra 2026

| | |
|---|---|
| **Versi** | 1.0 (draft) |
| **Tanggal** | 18 Oktober 2026 |
| **Pemilik produk** | Ranger Champion PLN UID Kaltimra |
| **Pemangku kepentingan** | Ranger Master (Muchamad Chaliq Fadli), Ranger Leader, manajemen UID, UP3 & ULP |
| **Sumber data v1** | Paparan CO HUB 3 PLN UID Kaltimra (26 halaman) + lembar *Pencapaian Program Budaya 2026* (Balikpapan, 15 Oktober 2026) — data **s.d. September 2026** |
| **Dokumen pendamping** | `PLAN.md` — rencana build bertahap di Claude Code |

> **Aturan emas untuk Claude Code:** semua angka di UI wajib berasal dari `src/data/budaya-2026.json` (isi dari Lampiran A). Tidak boleh ada angka yang di-*hardcode* di komponen.

---

## 1. Ringkasan

**BORNEO Culture Hub** adalah landing page satu halaman untuk **mengawal dan memonitor** pelaksanaan tiga program budaya PLN UID Kaltimra. Halaman ini menyatukan capaian KPI, ritual, perilaku pemimpin, skor Culture DNA, sistem, dan simbol budaya dalam satu tampilan yang memukau. Halaman ini juga menandai otomatis indikator mana yang perlu dikawal.

Nama "BORNEO" mengikuti akronim di paparan: ***B**eyond **R**eliability, **N**o Compromise on Safety, **E**xcellence for **O**utstanding Growth*.

| Program | Nama | Fokus | Nilai Culture DNA | Tagline |
|---|---|---|---|---|
| **PLN 1** | Borneo Bersinar | Beyond Safety | Disiplin · Tanpa Kompromi · Peduli | Bersama Peduli Keselamatan Ketenagalistrikan |
| **PLN 2** | Borneo Best | Beyond Service | Empati · Proaktif · Solutif | Beyond Expectations, Serving Together — *One Team. Five Actions. Happy Customers.* |
| **PLN 3** | Borneo Prima | Beyond Growth & Productivity | Berdampak · Berdedikasi · Do Extra Miles | Growth and Productivity |

---

## 2. Latar belakang & masalah

- Data capaian tersebar di slide paparan, lembar pencapaian bertanda tangan, Dashboard HSSE CC, Dashboard Distribusi, CRM, dan WAG.
- Slide bersifat statis. Slide tidak menunjukkan tren antar periode CO HUB dan tidak memberi sinyal indikator mana yang berisiko.
- Format angka di paparan tidak seragam (satuan GWh/TWh tertukar, pemisah desimal campur; lihat §12).
- Ranger Champion butuh satu tempat untuk tiga hal: **(1)** melihat status semua indikator dalam ±10 detik, **(2)** mengawal indikator berisiko, **(3)** mempresentasikan di forum CO HUB tanpa menyusun ulang slide.

---

## 3. Tujuan & ukuran keberhasilan

**Tujuan**

| ID | Tujuan |
|---|---|
| G1 | Status 3 pilar terbaca ≤ 10 detik sejak halaman dibuka. |
| G2 | Setiap indikator punya status otomatis (Melampaui / On Track / Perlu Perhatian / Kritis / Menunggu Data) dari aturan yang transparan (§8). |
| G3 | Tren lintas periode (CO HUB 1 → CO HUB 2 → Agustus → CO HUB 3 → Prognosa Des) bisa diputar dengan satu kontrol. |
| G4 | Halaman bisa langsung dipakai sebagai materi paparan CO HUB (Mode Presentasi, kompatibel *clicker*). |
| G5 | Update data bulanan ≤ 30 menit dengan mengedit satu file data, tanpa menyentuh kode komponen. |
| G6 | Tampilan memukau dan konsisten dengan identitas visual paparan (navy malam, glow biru, aksen emas, peta Borneo), tetapi tetap ringan di laptop kantor dan proyektor. |

**Ukuran keberhasilan**

| Metrik | Target |
|---|---|
| Angka di UI cocok dengan sumber (uji otomatis Lampiran A.10 & §8.4) | 100% |
| Waktu update data per bulan | ≤ 30 menit |
| Lighthouse Performance (desktop) | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Dipakai sebagai materi paparan CO HUB berikutnya | Ya |

**Bukan tujuan (v1)**
- Tidak ada login, backend, atau database.
- Tidak ada form input data di browser.
- Tidak ada integrasi API langsung ke HSSE CC, CRM, AP2T, atau Dashboard Distribusi.
- Tidak ada drill-down per UP3/ULP (masuk v2).
- Bukan pengganti dashboard operasional.

---

## 4. Pengguna & skenario

| Persona | Kebutuhan utama | Perangkat |
|---|---|---|
| **Ranger Champion** (pemilik) | Update data, pantau risiko, presentasi | Laptop, proyektor |
| **Ranger Master & Ranger Leader** | Status cepat, bahan arahan | Laptop, HP |
| **Manajemen UID** | Ringkasan eksekutif di layar pertama | HP, layar rapat |
| **Agen budaya & pegawai UP3/ULP** | Tahu target, perilaku yang diharapkan, apresiasi | HP (link via WA) |
| **Forum/penilai CO HUB** | Bukti implementasi & dampak | Layar besar |

**User stories**

| ID | Cerita |
|---|---|
| US-01 | Sebagai Ranger Champion, saya ingin melihat daftar indikator yang perlu dikawal, agar bisa langsung menghubungi PIC terkait. |
| US-02 | Sebagai Ranger Champion, saya ingin mengganti periode ke CO HUB 1 atau 2 untuk membandingkan progres. |
| US-03 | Sebagai Ranger Champion, saya ingin presentasi di forum memakai *clicker* tanpa membuka PowerPoint. |
| US-04 | Sebagai manajemen, saya ingin status ketiga pilar terlihat di layar pertama. |
| US-05 | Sebagai pegawai, saya ingin melihat 5 perilaku kunci tiap nilai Culture DNA. |
| US-06 | Sebagai Ranger Champion, saya ingin menambah data Oktober cukup dengan mengedit satu file. |
| US-07 | Sebagai penilai, saya ingin melihat foto evidence per program dan dokumen governance-nya. |

---

## 5. Ruang lingkup v1

| Prioritas | Fitur |
|---|---|
| **MUST** | Navbar + Period Switcher (F-01), Hero (F-02), Ringkasan 3 Pilar (F-03), Radar Pengawalan (F-04), 3 Pillar Section dengan 6 Lensa (F-05 s.d. F-08), Culture DNA konsolidasi (F-09), Footer (F-14), data layer + status engine + insight engine, responsif, *reduced motion* |
| **SHOULD** | Mode Presentasi (F-13), Timeline CO HUB (F-10), Galeri Evidence + lightbox (F-11), Governance & Dokumen (F-12), toggle grafik ↔ tabel |
| **COULD** | Stylesheet cetak/PDF, *single-file build* untuk cadangan offline, strip "Struktur Ranger", starfield latar |

---

## 6. Arsitektur informasi

```
/ (satu halaman)
├─ #beranda      Hero
├─ #ringkasan    Scoreboard 3 Pilar
├─ #radar        Radar Pengawalan (perlu dikawal · capaian menonjol · menunggu data)
├─ #bersinar     PLN 1 · Borneo Bersinar · Beyond Safety
├─ #best         PLN 2 · Borneo Best · Beyond Service
├─ #prima        PLN 3 · Borneo Prima · Beyond Growth & Productivity
├─ #culture-dna  Culture DNA Activation (9 nilai)
├─ #timeline     Perjalanan CO HUB 2026
├─ #evidence     Galeri Evidence
├─ #governance   Governance & Dokumen
└─ footer
```

**Pola tiap Pillar Section (dipakai ulang 3×):**
`Header pilar → KPI Band → Visual Khas pilar → Panel 6 Lensa (tab)`

**6 Lensa Budaya** (pola berulang di paparan):
1. Business Focus Alignment · 2. Ritual & Program · 3. Leader Behavior · 4. Culture DNA · 5. Sistem · 6. Simbol

---

## 7. Kebutuhan fungsional

### F-01 Navbar & Period Switcher
- Sticky. Background berubah jadi *glass blur* setelah scroll 40px.
- Kiri: logo PLN + "BORNEO Culture Hub". Tengah: anchor (Ringkasan, Radar, Bersinar, Best, Prima, Culture DNA). Kanan: Period Switcher + tombol "Mode Presentasi".
- **Period Switcher** (segmented control): `CO HUB 1 · Jun` | `CO HUB 2 · Jul` | `Agu` | `CO HUB 3 · Sep` | `Prognosa Des`.
- Section aktif disorot (IntersectionObserver).
- Mobile: hamburger membuka *sheet*. Period Switcher pindah ke *bottom bar* yang bisa digeser.
- **AC:**
  - Ganti periode memperbarui semua angka dengan transisi animasi ≤ 300 ms.
  - Periode tersimpan di URL (`?periode=2026-09`) sehingga link bisa dibagikan.
  - Default = periode aktual terbaru (bukan prognosa).
  - Periode Prognosa selalu ditandai visual (label "Prognosa", gaya putus-putus/italic).

### F-02 Hero
- **Eyebrow:** `PROGRAM BUDAYA PLN 1·2·3 · UID KALIMANTAN TIMUR & KALIMANTAN UTARA`
- **H1 (rekomendasi):** "Beyond Safety. Beyond Service. Beyond Growth."
  Alternatif: "Satu Budaya, Tiga Langkah Melampaui."
- **Subjudul:** "Pemantauan Program Budaya Borneo Bersinar, Borneo Best, dan Borneo Prima — PLN UID Kaltimra 2026."
- **Badge periode:** "Data s.d. September 2026 · CO HUB 3" dan "Diperbarui 15 Okt 2026" (dari `meta`).
- **4 statistik count-up** (mengikuti periode aktif):
  - `0` Fatality
  - `10.770` Temuan Ditutup
  - `989,68 rb` Transaksi PLN Mobile
  - `5.339 GWh` Penjualan Energi (102,24% target s.d. Sep)
- **Visual:**
  - Peta Kaltim–Kaltara bercahaya dengan 6 node UP3 berdenyut (Balikpapan, Samarinda, Bontang, Berau, Kaltara, Nusantara).
  - Garis energi emas melingkar (motif *swoosh* dari cover paparan).
  - Starfield halus.
  - 3 emblem pilar mengorbit peta.
- **CTA:** "Lihat Ringkasan" (scroll ke #ringkasan) dan "Mode Presentasi".
- **AC:**
  - Elemen LCP adalah teks H1, bukan gambar.
  - Visual tidak memblokir render.
  - Dengan *reduced motion*, visual tampil statis dan angka langsung final.

### F-03 Ringkasan 3 Pilar (Scoreboard)
- 3 kartu besar, masing-masing berisi:
  - Emblem, kode program, nama, fokus.
  - **Status pilar terhitung** (aturan §8.3).
  - Label kecil "Laporan unit: …" dari field `selfReportedProgress` (mis. "100% On Track"), ditampilkan berdampingan dengan status terhitung.
  - Ring "x dari y indikator On Track/Melampaui".
  - 2 KPI utama.
  - Rata-rata Culture DNA periode aktif + delta vs periode sebelumnya.
  - Tombol "Selengkapnya".
- **AC:**
  - Hover: kartu terangkat 4px + glow warna pilar.
  - Klik kartu scroll ke section pilar.
  - Status selalu tampil sebagai ikon + teks, tidak hanya warna.

### F-04 Radar Pengawalan *(inti fungsi monitoring)*
Tiga kolom:
1. **Perlu Dikawal** — item berstatus Perlu Perhatian/Kritis dan flag prognosa.
2. **Capaian Menonjol** — item Melampaui, kenaikan Culture DNA terbesar, capaian beruntun.
3. **Menunggu Data** — KPI tanpa realisasi.

- Tiap item memuat: chip pilar, nama indikator, pesan otomatis (insight engine §8.5), angka pendukung, dan catatan tindak lanjut opsional dari data (`catatanRanger`, `pic`).
- **AC:** untuk dataset s.d. Sep 2026, Radar menampilkan minimal semua item di §8.4.

### F-05 Template Pillar Section (dipakai ulang 3×)

**a. Header**
- Emblem, `PLN 1 · BEYOND SAFETY`, nama, tagline, 3 nilai Culture DNA.
- KPI Fokus Bisnis (chip), Business Target & Ultimate Target (dari slide Simbol).

**b. KPI Band**
- Satu `KpiCard` per lagging indicator, berisi:
  - Label, nilai periode aktif, target, % capaian, status pill.
  - Sparkline Jun→Sep dengan titik prognosa putus-putus.
  - Tooltip berisi rumus dan sumber data.

**c. Visual khas pilar** — lihat F-06, F-07, F-08.

**d. Panel 6 Lensa (tab)**

| Lensa | Isi |
|---|---|
| Business Focus Alignment | Tabel KPI → program → indikator → target → realisasi per periode. Kolom periode aktif disorot. Mobile: scroll horizontal dengan kolom pertama *sticky*. |
| Ritual & Program | Spesifik per pilar. |
| Leader Behavior | Alur 4 langkah: Perencanaan → Pelaksanaan → Monitoring → Evaluasi, masing-masing dengan deskripsi dan thumbnail evidence. |
| Culture DNA | 3 kartu nilai: bar skor Agu→Sep, delta, dan 5 perilaku kunci. |
| Sistem | Kartu dashboard: screenshot + angka kunci. Label "Akses intranet". **Jangan tampilkan URL/IP internal.** |
| Simbol | Desktop: tabel Program · Bentuk Ritual · Frekuensi · Evidence · Reward & Consequence · Dampak Perilaku · Integrasi Governance. Mobile: kartu bertumpuk. |

- **AC:**
  - Tab bisa dinavigasi dengan keyboard (panah kiri/kanan) dan memakai pola ARIA tabs.
  - Deep link via hash (`#bersinar-dna`, `#best-simbol`, dst.).

### F-06 Borneo Bersinar — konten khas
1. **Ritual Safety Timeline**
   - Stepper horizontal 6 tahap: Before Work → During Work → After Work → Weekly → Monthly → Continuous.
   - Antar tahap dihubungkan garis energi yang menyala mengikuti scroll.
   - Tiap tahap: ritual, 3 aktivitas, dampak, foto evidence.
2. **Grafik Walk Down Care for Asset & Care for Safety**
   - Garis Jan–Sep aktual.
   - Okt–Des sebagai *band* prognosa putus-putus (total 3.465 → rata-rata 1.155/bulan).
   - Anotasi: April +41,3% dan September +43,0% dari bulan sebelumnya.
   - 4 tile: Realisasi 10.770 · Rata-rata 1.197/bulan · Prognosa Okt–Des 3.465 · Proyeksi setahun 14.235.
3. **Dampak Penguatan Budaya Safety** — 4 tile:
   - 0 fatality
   - LTIF tidak ada penambahan
   - 10.770 temuan closing
   - 100% kepatuhan
4. **Behaviour Change card** — animasi morph dari *"Sudah briefing."* menjadi *"Saya memahami bahaya, kontrol dan konsekuensi jika kontrol tidak dijalankan."*
5. **Dampak Sidak** — 4 poin: Risiko terkendali · Kepatuhan meningkat · Temuan berulang turun · Cegah kecelakaan.
6. **Quote penutup** — "Budaya Keselamatan dimulai dari saya." *Paham · Peduli · Bertindak · Mengingatkan.*

### F-07 Borneo Best — konten khas
1. **Siklus Beyond Service (orbit interaktif)**
   - 5 node mengelilingi pusat "Kepuasan Pelanggan — Empati · Proaktif · Solutif".
   - Klik node membuka panel detail: indikator, target, tren, ritual, reward & consequence, dampak.
   - Sorotan berpindah otomatis tiap 4 detik. Berhenti saat hover/fokus dan saat *reduced motion*.
   - Mobile: orbit berubah jadi daftar vertikal bernomor.
2. **BEST Acrostic** — 4 kartu B · E · S · T berisi capaian utama (Lampiran A.6).
3. **Gangguan 2025 vs 2026** — perbandingan berpasangan:
   - Jan–Sep 5.972 → 4.459 (−25,3%)
   - Rata-rata Apr–Sep 732 → 247 per bulan (−66%)
   - September 862 → 214
4. **Mini chart per program** sesuai Business Focus Alignment (5 kartu).
5. Footer pilar: *"Lima Pilar Terintegrasi. Pelayanan Terus Diperbaiki."*

### F-08 Borneo Prima — konten khas
1. **PRIMA Letter Wall**
   - 5 huruf besar P-R-I-M-A. Hover/tap membalik kartu.
   - Isi tiap kartu: program + capaian (367 lokasi · 5.339 GWh 102,24% · ARUS MAHAKAM · Media cetak & Instagram · Marketing Award).
2. **4 Gauge sistem**
   - Penjualan 102,24% *(vs target s.d. Sep)*
   - Produktivitas 75,33% *(vs target tahunan)*
   - Penambahan Pelanggan 108,91%
   - Daya Tersambung 110,25%
   - Label basis pembanding wajib tampil di bawah tiap gauge.
3. **Grafik lintasan penjualan & produktivitas**
   - Jun→Sep aktual, Prognosa Des, garis target tahunan (7.040 GWh; 10,46 GWh/pegawai).
   - Grafik ini harus memperlihatkan *gap* prognosa dengan jelas.
4. **Snapshot CRM (s.d. 16 Okt 2026):**
   - Close Won 68,61% (Rp104,13 M; 6.085 pelanggan)
   - Close Lost 0,31% (Rp0,47 M; 12 pelanggan)
   - Top revenue: UP3 Balikpapan Rp42,96 M
   - Top customer: UP3 Samarinda 3.152 pelanggan
   - Nama individu (*top sales*) **hanya ditampilkan bila diizinkan** (§13).
5. Tagline: *"Berdampak, Berdedikasi, Do Extra Miles."*

### F-09 Culture DNA konsolidasi
- **Radar chart 9 sumbu**, dua seri (Agustus vs September). Filter per pilar.
- **Bar rata-rata per pilar:**
  - Safety 4,71 → 4,84
  - Service 4,62 → 4,76
  - Growth 4,53 → 4,72
- **Sorotan otomatis:**
  - Kenaikan terbesar: *Do Extra Miles +0,31*
  - Skor tertinggi: *Tanpa Kompromi 4,86*
  - Skor terendah: *Proaktif & Berdampak 4,71*
- Klik nilai menampilkan 5 perilaku kuncinya.
- Penutup: *"One Ranger can start a change, together we create the culture!"*
- Periode tanpa skor (Jun, Jul, Prognosa) menampilkan state "Data belum tersedia".
- **AC:** radar punya alternatif tabel yang aksesibel.

### F-10 Timeline CO HUB 2026
- Node horizontal: Jun (CO HUB 1) · Jul (CO HUB 2) · Agu · Sep (CO HUB 3) · Okt · Des (Prognosa).
- Tiap node menampilkan snapshot 3 angka kunci (satu per pilar). Klik node sama dengan memilih periode.
- **Event:**
  - ARUS MAHAKAM Seri I (23–25 Sep)
  - ARUS MAHAKAM Seri II (14–16 Okt)
  - Paparan Borneo Prima (13 Okt)
  - Laporan Harian HSSE (14 Okt)
  - Lembar Pencapaian ditandatangani Ranger Master (15 Okt)
  - Kampus Yantek Batch 4 — UP3 Berau (tanggal dikonfirmasi)

### F-11 Galeri Evidence
- Grid *masonry* dengan filter per pilar dan per lensa.
- Lightbox berisi caption, unit, dan tanggal.
- Gambar *lazy-load*. `alt` wajib diisi.
- Bila gambar belum tersedia, tampilkan placeholder bergradien berlabel. Build tidak boleh gagal karena aset hilang.

### F-12 Governance & Dokumen
Kartu dokumen (Lampiran A.9) berisi chip pilar, nomor, judul, dan tanggal. Link file bersifat opsional (field `url`); di v1 tidak wajib.

### F-13 Mode Presentasi
- **Aktivasi:** tombol atau tombol keyboard `P`. Fullscreen dengan `F`. Keluar dengan `Esc`.
- **Navigasi:**
  - Maju: `→`, `PageDown`, `Space`
  - Mundur: `←`, `PageUp`
  - `1` / `2` / `3` lompat ke pilar
  - Standar *presenter clicker* mengirim PageUp/PageDown, jadi otomatis kompatibel.
- **Urutan slide** didefinisikan di `src/config/presentation.ts` (±14 slide): Hero → Ringkasan → Radar → [per pilar: Header+KPI, Visual khas, Culture DNA, Simbol] → Culture DNA konsolidasi → Timeline → "Terima Kasih".
- **Tampilan:** tipografi diskalakan untuk 1920×1080 dan 1280×720, progress bar, penghitung slide, navbar disembunyikan.
- **AC:**
  - Berfungsi dengan clicker standar.
  - Transisi antar slide tanpa *jank*.
  - Keluar dari mode presentasi mengembalikan posisi scroll semula.

### F-14 Footer
- Logo PLN & Danantara.
- "Disusun oleh Ranger Champion PLN UID Kaltimra" (nama dari `meta.disusunOleh`).
- Ranger Master, sumber data & tanggal update.
- Tagline: *"People First · Safety Always · Sustainability for Future"* dan *"Pemimpin menjadi teladan. Tim bergerak bersama. Pelanggan merasakan manfaat."*
- Catatan "Untuk penggunaan internal PLN".

### F-15 State & keterlacakan data
- Setiap angka punya field `source`. Tooltip menampilkan "Sumber: Lembar Pencapaian 15 Okt 2026" atau "Slide 7".
- **State visual:**
  - *Prognosa*: garis putus-putus, label "Prognosa"
  - *Menunggu Data*: slate, ikon jam
  - *Perkiraan (±)*: tanda "±" sebelum angka

---

## 8. Logika monitoring & status

### 8.1 Nilai status

| Status | Label UI | Warna | Ikon |
|---|---|---|---|
| `MELAMPAUI` | Melampaui Target | Emas `--status-exceed` | ★ |
| `ON_TRACK` | On Track | Hijau `--status-ok` | ✓ |
| `PERLU_PERHATIAN` | Perlu Perhatian | Amber `--status-warn` | ! |
| `KRITIS` | Kritis | Merah `--status-crit` | ✕ |
| `MENUNGGU_DATA` | Menunggu Data | Slate `--status-na` | ⏳ |

### 8.2 Tipe indikator & aturan

Ambang batas disimpan di `src/config/status.ts` agar mudah diubah.

| Tipe | Contoh | Benchmark | Aturan status |
|---|---|---|---|
| `zero` | Penambahan kasus, Temuan penyebab LTI | target = 0 | `0` → On Track · `>0` → Kritis |
| `max` (makin kecil makin baik) | Feedback rating ≤ 0,03% | batas atas | `≤ 50%` batas → Melampaui · `≤` batas → On Track · `≤ 110%` batas → Perlu Perhatian · lainnya → Kritis |
| `min` (level, target akhir tahun) | Kepatuhan APD 100%, Penurunan gangguan ≥ 5%, Validasi VAPE GADIS 95% | target | `≥ 110%` target → Melampaui · `≥` target → On Track · di bawah target: `req = (target − nilai) / sisaBulan`; bila kenaikan bulan terakhir `≥ req` → On Track, `≥ 50% req` → Perlu Perhatian, lainnya → Kritis |
| `cumulative` (target tahunan kumulatif) | Closing temuan, transaksi, rupiah, penjualan, produktivitas | `targetYtd` periode itu bila ada; bila tidak: `target × bulan/12` | `≥` target tahunan → Melampaui · `≥ 100%` benchmark → On Track · `≥ 95%` → Perlu Perhatian · lainnya → Kritis |

**Flag prognosa (semua tipe):** bila nilai prognosa Des tidak memenuhi target, tambahkan flag `PROGNOSA_DI_BAWAH_TARGET` dan naikkan status minimal ke **Perlu Perhatian**. Ini sinyal pengawalan utama.

**Override:** field `statusOverride: { status, reason }` boleh dipakai Ranger Champion. UI menampilkan ikon "✎ disesuaikan" + alasan.

### 8.3 Status pilar
Diambil dari status terburuk di antara indikatornya (Melampaui dihitung sebagai On Track). Indikator `MENUNGGU_DATA` tidak ikut menurunkan status, tetapi muncul di Radar.

### 8.4 Hasil yang diharapkan untuk data s.d. September 2026 *(dipakai sebagai unit test)*

| Pilar | Indikator | Perhitungan | Status |
|---|---|---|---|
| PLN 1 | Penambahan kasus | 0 | On Track |
| PLN 1 | Temuan penyebab LTI | 0 | On Track |
| PLN 1 | Tindak lanjut temuan (closed) | 10.770 / 14.235 = 75,66% vs pace 75% | On Track |
| PLN 1 | Kepatuhan APD & SOP | 100% = target | On Track |
| **PLN 1** | **Status pilar** | | **On Track** |
| PLN 2 | Jumlah kali transaksi | 989,68 / 651,76 rb = 151,85% target tahunan | Melampaui |
| PLN 2 | Rupiah transaksi PLN Mobile | 279,01 / 278,37 M = 100,23% target tahunan | Melampaui |
| PLN 2 | Feedback rating | 0,013% = 43% dari batas 0,03% | Melampaui |
| PLN 2 | Penurunan gangguan | 25% vs target 5% | Melampaui |
| PLN 2 | Validasi data VAPE GADIS | ±93% vs 95%; butuh +0,67 poin/bulan; kenaikan terakhir +3 poin | On Track |
| **PLN 2** | **Status pilar** | | **On Track** |
| PLN 3 | Realisasi penjualan | 5.339 / 5.222 GWh (target s.d. Sep) = 102,24% · prognosa 7.015 < 7.040 | **Perlu Perhatian** (flag prognosa) |
| PLN 3 | Produktivitas pegawai | 7,88 / 10,46 = 75,33% vs pace 75% · prognosa 10,36 < 10,46 | **Perlu Perhatian** (flag prognosa) |
| **PLN 3** | **Status pilar** | | **Perlu Perhatian** |
| — | **Menunggu Data** | IKP ≥ 99,50% · Susut distribusi 6,15% · Pertumbuhan penjualan 8,82% | Menunggu Data |

### 8.5 Insight engine (`src/lib/insights.ts`)

| Aturan | Pemicu | Contoh pesan (data Sep 2026) |
|---|---|---|
| R1 Prognosa | Prognosa < target | "Prognosa penjualan Des 7.015 GWh di bawah target 7.040 GWh (gap 25 GWh; 99,64%)." · "Prognosa produktivitas 10,36 di bawah target 10,46 GWh/pegawai (99,04%)." |
| R2 Run-rate | Tipe `cumulative` dengan ≥ 2 periode | "Run-rate penjualan Jul–Sep 634 GWh/bulan; butuh 567 GWh/bulan untuk target 7.040. Prognosa unit mengasumsikan ±559 GWh/bulan." · Produktivitas: run-rate 0,95/bulan vs butuh 0,86/bulan. |
| R3 Kebutuhan level | Tipe `min` di bawah target | "VAPE GADIS butuh +2 poin dalam 3 bulan (±93% → 95%)." |
| R4 Seri bulanan | Ada seri bulanan | "Walk Down butuh rata-rata 1.155 temuan/bulan Okt–Des; rata-rata Jan–Sep 1.197. Agustus terendah (961)." |
| R5 Capaian | Status Melampaui / beruntun | "Rupiah transaksi PLN Mobile sudah melewati target setahun pada September." · "Feedback rating di bawah batas 0,03% selama 3 periode beruntun (Jul–Sep)." · "Penurunan gangguan 25%, 5× target." |
| R6 Culture DNA | Skor turun / kenaikan terbesar / terendah | "Do Extra Miles naik +0,31 (4,41 → 4,72), kenaikan terbesar." · "Proaktif & Berdampak terendah (4,71)." |
| R7 Data kosong | KPI tanpa realisasi | "IKP ≥ 99,50% — realisasi belum diinput." |

> Pesan R2 bersifat **observasi**, bukan kesimpulan. Musim/beban Okt–Des bisa berbeda. UI cukup menampilkan angka dan selisihnya.

---

## 9. Model data

Satu file: `src/data/budaya-2026.json`, divalidasi Zod di `src/data/schema.ts` saat build dan saat test.

**Konvensi:**
- Angka disimpan sebagai *number* mentah dalam satuan yang tertulis di field `unit`: `ribu kali`, `Rp miliar`, `GWh`, `GWh/pegawai`, `%`, `temuan`.
- Format tampilan dikerjakan `src/lib/format.ts` memakai `Intl.NumberFormat('id-ID')`.

```ts
type PeriodId = '2026-06' | '2026-07' | '2026-08' | '2026-09' | '2026-12P'; // bisa ditambah
type Status = 'MELAMPAUI' | 'ON_TRACK' | 'PERLU_PERHATIAN' | 'KRITIS' | 'MENUNGGU_DATA';
type IndicatorType = 'zero' | 'max' | 'min' | 'cumulative';

interface Period {
  id: PeriodId;
  label: string;        // "CO HUB 3 · September 2026"
  short: string;        // "Sep"
  month: number;        // 1–12
  cohub?: 1 | 2 | 3;
  isPrognosa: boolean;
}

interface Indicator {
  id: string;
  label: string;
  unit: string;
  type: IndicatorType;
  target: number;                                     // tahunan / batas / level
  targetLabel?: string;                               // teks asli dari sumber
  targetYtd?: Partial<Record<PeriodId, number>>;      // mis. penjualan Sep = 5222
  values: Partial<Record<PeriodId, number | null>>;
  approx?: boolean;                                   // nilai "±"
  decimals?: number;
  programIds?: string[];
  source: string;
  note?: string;
  catatanRanger?: string;
  pic?: string;
  statusOverride?: { status: Status; reason: string };
}

interface KpiFokus {
  label: string;
  targetLabel: string;
  value?: number | null;   // null = Menunggu Data
  source?: string;
}

interface Program {
  id: string;
  name: string;
  action?: string;         // "Lindungi Data"
  description: string;
  indicatorIds?: string[];
}

interface RitualStep {
  id: string;
  phase: string;           // "Before Work"
  ritual: string;
  activities: string[];
  impact: string;
  evidenceIds?: string[];
}

interface LeaderStep {
  step: 'Perencanaan' | 'Pelaksanaan' | 'Monitoring' | 'Evaluasi';
  description: string;
  evidenceIds?: string[];
}

interface DnaValue {
  id: string;
  name: string;
  definition: string;
  behaviors: string[];     // 5 perilaku
  scores: Partial<Record<PeriodId, number>>;  // skala 1–5 (asumsi)
}

interface SystemItem {
  id: string;
  name: string;
  description?: string;
  metrics: { label: string; value: string }[];
  imageId?: string;
  access: 'intranet' | 'publik';
}

interface SymbolRow {
  program: string;
  ritual: string;
  frequency: string;
  evidence: string;
  rewardConsequence: string[];
  impact: string;
  governance: string[];
}

interface Highlight {
  letter?: string;
  title: string;
  subtitle?: string;
  points: string[];
}

interface Pillar {
  id: 'bersinar' | 'best' | 'prima';
  code: 'PLN 1' | 'PLN 2' | 'PLN 3';
  name: string;
  focus: string;
  tagline: string;
  dnaValues: string[];
  businessTarget: string;
  ultimateTarget: string;
  selfReportedProgress?: string;
  kpiFokus: KpiFokus[];
  programs: Program[];
  indicators: Indicator[];
  rituals: RitualStep[];
  leaderBehavior: LeaderStep[];
  cultureDna: DnaValue[];
  systems: SystemItem[];
  symbols: SymbolRow[];
  highlights: Highlight[];          // BEST acrostic, PRIMA cards, dampak safety, dll.
  monthlySeries?: {
    id: string;
    label: string;
    unit: string;
    actual: Record<string, number>;
    forecastTotal?: number;
  }[];
}

interface Dataset {
  meta: {
    title: string;
    year: number;
    dataAsOf: string;
    updatedAt: string;
    disusunOleh: string;
    rangerMaster: string;
    sources: string[];
  };
  periods: Period[];
  pillars: Pillar[];
  timeline: { date: string; title: string; pillarId?: string }[];
  documents: { pillarId: string; number?: string; title: string; date?: string; url?: string }[];
  evidence: { id: string; src: string; alt: string; caption: string; pillarId: string; lens?: string; unit?: string; date?: string }[];
}
```

**Validasi Zod wajib menangkap:**
- `periods` ganda.
- Nilai indikator di luar rentang wajar (% > 100 untuk tipe level persentase, angka negatif).
- `targetYtd` merujuk periode yang tidak ada.
- `evidenceIds` tanpa pasangan.

Pesan error harus ramah dan berbahasa Indonesia.

---

## 10. Arah desain visual

### 10.1 Konsep: **"Night Grid Borneo"**
Malam di atas Borneo: jaringan listrik menyala, data tampil sebagai cahaya.

- Basis navy gelap dengan glow biru-cyan.
- Aksen emas mengalir sebagai garis energi, diambil dari motif *swoosh* cover paparan.
- Kartu bergaya *glassmorphism*.
- Tiap pilar punya warna aksen sendiri, sementara emas menjadi benang merah ketiganya.

Mode default **gelap**. Stylesheet cetak memakai mode terang.

### 10.2 Design tokens (CSS variables di `src/styles/globals.css`)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg-deep` | `#040A1C` | Latar paling gelap (hero) |
| `--bg-navy` | `#081634` | Latar section |
| `--bg-midnight` | `#0D2150` | Section selang-seling |
| `--surface` | `rgba(255,255,255,0.05)` | Kartu glass |
| `--surface-hover` | `rgba(255,255,255,0.08)` | Hover |
| `--border` | `rgba(148,197,255,0.16)` | Garis kartu |
| `--text` | `#EAF2FF` | Teks utama |
| `--text-muted` | `#9DB2D3` | Teks sekunder |
| `--gold` | `#F7B731` | Aksen bersama, angka hero |
| `--gold-glow` | `#FFD66B` | Glow emas |
| `--pln-cyan` | `#00A3E0` | Aksen PLN |
| `--pln-yellow` | `#FFD200` | Logo/aksen kecil |
| `--bersinar` | `#10B981` (glow `#6EE7B7`) | PLN 1 — Beyond Safety |
| `--best` | `#3B82F6` (glow `#7DD3FC`) | PLN 2 — Beyond Service |
| `--prima` | `#F59E0B` (sekunder `#14B8A6`) | PLN 3 — Beyond Growth |
| `--status-exceed` | `#FACC15` | Melampaui |
| `--status-ok` | `#22C55E` | On Track |
| `--status-warn` | `#F59E0B` | Perlu Perhatian |
| `--status-crit` | `#EF4444` | Kritis |
| `--status-na` | `#64748B` | Menunggu Data |

Status selalu memakai **pill + ikon + teks** agar tidak tertukar dengan warna pilar. Semua kombinasi teks/latar wajib lolos kontras AA.

### 10.3 Tipografi
- **Plus Jakarta Sans** (variable, self-hosted via `@fontsource-variable/plus-jakarta-sans`). Font ini karya studio Indonesia dan cocok dengan karakter heading paparan.
- **Skala:**
  - Display: `clamp(2.5rem, 6vw, 5.5rem)`, weight 800, `letter-spacing: -0.02em`
  - H2: `clamp(1.75rem, 3.5vw, 3rem)`, weight 800
  - Body: 16–18px, weight 400–500
- **Angka KPI:** 40–56px weight 800, `font-variant-numeric: tabular-nums` agar angka tidak "goyang" saat count-up.
- **Label kecil/eyebrow:** uppercase, `letter-spacing: 0.14em`, 12–13px.

### 10.4 Motif & citra
- Siluet peta Kalimantan Timur + Kalimantan Utara dengan garis tepi bercahaya dan 6 node UP3.
- Garis energi emas: SVG path bergradien dengan animasi `stroke-dashoffset`.
- Ilustrasi pendukung dari paparan dipakai halus di tepi section: enggang, bekantan, jembatan, menara transmisi.
- Emblem tiap pilar (Bersinar, Best, Prima).
- Karakter ilustrasi dari cover dan slide Culture DNA (crop karakter saja; **teks dibangun ulang sebagai HTML**, bukan teks di dalam gambar).

### 10.5 Prinsip motion (Motion for React)
| Elemen | Durasi | Detail |
|---|---|---|
| Entrance | 400–700 ms | easing `[0.22, 1, 0.36, 1]`, stagger 60–80 ms |
| Count-up angka | 1,2 s | Mulai saat masuk viewport |
| Gambar grafik | 900 ms | Animasi draw |
| Hover kartu | — | Terangkat 4px + glow warna pilar |
| Ritual timeline | — | Progress mengikuti scroll |
| Pergantian periode | ≤ 300 ms | Angka *morph* ke nilai baru |

- Tanpa parallax berlebihan, tanpa autoplay video, tanpa library 3D berat.
- `prefers-reduced-motion: reduce` → count-up langsung final, orbit tidak berputar, starfield diam, transisi diganti fade singkat.

### 10.6 Spesifikasi komponen inti
| Komponen | Spesifikasi |
|---|---|
| `GlassCard` | bg `--surface`, border 1px `--border`, `backdrop-filter: blur(16px)`, radius 20px, highlight tipis di tepi atas |
| `KpiCard` | label (muted) · angka besar · "dari target X" · progress bar/ring · `StatusPill` · sparkline · ikon info (tooltip rumus & sumber) |
| `StatusPill` | radius penuh, ikon + teks, latar status 15% opacity, border status 40% |
| `ProgressRing` / `Gauge` | SVG murni, stroke bergradien warna pilar, angka di tengah |
| `Sparkline` | SVG murni, titik terakhir menonjol, segmen prognosa putus-putus |
| `ChartTableToggle` | Setiap grafik punya tombol "Lihat tabel" |
| `ImageWithFallback` | Placeholder gradien + label bila file tidak ada |

### 10.7 Momen "wow" (urut prioritas)
1. **Hero ignition** — garis peta tergambar, node UP3 menyala berurutan, garis emas menyapu, angka bergulir.
2. **Period scrubber** — semua angka, grafik, dan status ber-*morph* saat periode diganti.
3. **Orbit Siklus Beyond Service** — node berputar, panel detail meluncur.
4. **Ritual Safety yang menyala mengikuti scroll.**
5. **PRIMA letter flip.**
6. **Radar Culture DNA** — bentuk Agustus berubah menjadi bentuk September.
7. **Behaviour change morph** — dari "Sudah briefing." ke kalimat pemahaman.

**Hindari:**
- Tampilan template generik (gradien ungu, stok foto generik).
- Teks di dalam gambar.
- Emoji sebagai ikon.
- Warna sebagai satu-satunya penanda status.

---

## 11. Kebutuhan non-fungsional

| Aspek | Kebutuhan |
|---|---|
| **Performa** | LCP < 2,5 s (4G, laptop kelas menengah) · CLS < 0,1 · JS awal ≤ 300 KB gzip · library grafik di-*code-split* per section · gambar AVIF/WebP + `srcset` + lazy · visual hero berupa SVG/CSS (bukan raster besar) |
| **Kompatibilitas** | Chrome/Edge 2 versi terakhir · Safari iOS 16+ · Chrome Android · lebar 360–2560 px · proyektor 1920×1080 & 1280×720 |
| **Aksesibilitas** | WCAG 2.1 AA · kontras teks ≥ 4,5:1 · navigasi keyboard penuh · focus ring terlihat · `alt` gambar · alternatif tabel untuk grafik · `lang="id"` · status tidak bergantung warna |
| **Bahasa & format** | UI berbahasa Indonesia · `id-ID` (titik ribuan, koma desimal) · mata uang "Rp279,01 M" · tanggal "15 Oktober 2026" |
| **Kerahasiaan** | Data internal: host di intranet atau URL terproteksi · `<meta name="robots" content="noindex">` + `robots.txt` disallow · tanpa tracker pihak ketiga · **tanpa URL/IP internal** (mis. alamat Dashboard HSSE CC) · nama & foto pegawai hanya dengan izin |
| **Offline** | Font dan aset di-*self-host* (tanpa CDN) agar tetap jalan di lokasi forum tanpa internet · opsi *single-file build* sebagai cadangan |
| **Maintainability** | Nol angka hardcode di komponen · teks konten di file data · TypeScript strict · unit test untuk status/insight/format · validasi data via `npm run validate` |

---

## 12. Catatan kualitas data (temuan dari paparan)

Dashboard memakai **satu sumber kebenaran** dan menormalkan format berikut. Poin bertanda ❓ perlu dikonfirmasi (lihat §13).

| # | Temuan | Penanganan di dashboard |
|---|---|---|
| D1 | Satuan penjualan tertukar: slide 21 menulis "5,339 **TWh** / target 5,222 **TWh**". Tabel menulis "5,339 GWh". Slide 24 menulis "5.339 GWh". Target tahunan "7.040 GWh" = "7,04 TWh". | Simpan dalam GWh: realisasi **5.339 GWh**, target s.d. Sep **5.222 GWh**, target tahunan **7.040 GWh**. |
| D2 | Pemisah desimal campur (10.46 vs 10,46; 5.04 vs 6,01; 1,270.93 ribu). | Simpan sebagai *number*, tampilkan dengan `id-ID`. |
| D3 ❓ | System Borneo Best: judul "Gangguan turun tajam sejak **JUNI** 2026", sedangkan grafik di dalamnya "sejak **April** 2026" dan metriknya "Apr–Sep". | Pakai teks netral "Gangguan turun tajam pada 2026" sampai dikonfirmasi. |
| D4 ❓ | Dua metrik data pelanggan berbeda: "Validasi data VAPE GADIS ±93% (tergambar & terpetakan)" vs "PDL valid 83,84% (1.468.159)". Hitungan dari angka mentah memberi 83,85% (slide memotong ke 83,84%). | Tampilkan keduanya dengan label berbeda + tooltip definisi. |
| D5 ❓ | "+145% YoY (420.555 vs 171.430 transaksi)" basisnya berbeda dari total 989.684 transaksi Jan–Sep. | Tampilkan apa adanya dengan label "basis periode dikonfirmasi". |
| D6 ❓ | Transaksi "209,8% target YTD" menyiratkan target YTD ±471,7 rb, sedangkan tabel memuat target tahunan 651,76 rb. | Status memakai target tahunan; angka 209,8% ditampilkan sebagai "angka laporan". |
| D7 ❓ | Program PLN 3 di tabel (Breakdown Rencana Aksi, Forum Pencapaian, Penguatan Kompetensi Niaga, Prospek Pelanggan Baru, Program Percepatan Pelayanan Pelanggan) berbeda dengan 5 program PRIMA (P, R, I, M, A). | UI memakai PRIMA. Daftar resmi tabel tampil di tab Business Focus Alignment. Pemetaan dikonfirmasi. |
| D8 | Produktivitas 75,33% dibandingkan dengan target **tahunan**, sedangkan penjualan 102,24% dengan target **s.d. Sep**. | Label basis pembanding wajib tampil di gauge. |
| D9 | Slide Symbol Prima menulis "100% On Track", padahal prognosa Des penjualan dan produktivitas di bawah target. | Tampilkan status terhitung **dan** "Laporan unit: 100% On Track" berdampingan. |
| D10 ❓ | "Feedback negatif 0,013% · capaian 173,38%" — rumus capaian tidak tercantum. | Tampilkan sebagai "angka laporan"; status dihitung dari batas 0,03%. |
| D11 | KPI tanpa realisasi: IKP ≥ 99,50%, susut distribusi 6,15%, pertumbuhan penjualan 8,82%. | State "Menunggu Data" + masuk Radar. |
| D12 ❓ | Culture DNA hanya untuk Agustus & September; skala diasumsikan 1–5; jumlah responden tidak tercantum. | State "Data belum tersedia" untuk periode lain. |
| D13 | Typo di sumber: "Walk Down Caref", "Cosing", "Bussines", "Produktifitas", "Kalimatan Utara", "Lagging Indiator". | Ditulis benar di UI: *Care for*, *Closing*, *Business*, *Produktivitas*, *Kalimantan Utara*, *Indikator*. |
| D14 | Dashboard HSSE CC memakai alamat IP internal. | Jangan ditampilkan. Ganti label "Akses intranet". |

---

## 13. Pertanyaan terbuka

1. Nama produk final: **"BORNEO Culture Hub"** disetujui, atau ada nama lain?
2. Hosting: server intranet PLN, Vercel/Netlify dengan proteksi password, atau file offline?
3. Pemetaan program PLN 3 versi tabel ↔ PRIMA (D7).
4. Definisi resmi "validasi VAPE GADIS ±%" vs "PDL valid %" (D4).
5. Gangguan turun "sejak Juni" atau "sejak April" (D3)?
6. Culture DNA: skala, jumlah responden, dan apakah ada data Jun/Jul (D12)?
7. Sumber dan frekuensi realisasi IKP, susut distribusi, pertumbuhan penjualan (D11)?
8. Boleh menampilkan nama individu (top sales, marketer terbaik) dan foto pegawai?
9. Apakah tersedia target YTD per bulan untuk indikator kumulatif selain penjualan September?
10. Siapa saja yang boleh mengupdate data selain Ranger Champion?
11. Apakah data per UP3 tersedia untuk v2 (peta & ranking)?

---

## Lampiran A — Dataset s.d. September 2026

Sumber utama: lembar *Pencapaian Program Budaya 2026* (15 Okt 2026) dan slide paparan CO HUB 3. Angka sudah dinormalkan (lihat §12).

### A.1 Periode
| id | label | short | month | cohub | prognosa |
|---|---|---|---|---|---|
| `2026-06` | CO HUB 1 · Juni 2026 | Jun | 6 | 1 | – |
| `2026-07` | CO HUB 2 · Juli 2026 | Jul | 7 | 2 | – |
| `2026-08` | Agustus 2026 | Agu | 8 | – | – |
| `2026-09` | CO HUB 3 · September 2026 | Sep | 9 | 3 | – |
| `2026-12P` | Prognosa Desember 2026 | Des (P) | 12 | – | ✓ |

**meta:**
- `dataAsOf`: "2026-09-30"
- `updatedAt`: "2026-10-15"
- `rangerMaster`: "Muchamad Chaliq Fadli"
- `disusunOleh`: "Ranger Champion PLN UID Kaltimra"

### A.2 PLN 1 — Borneo Bersinar (Beyond Safety)

**KPI Fokus Bisnis:** Zero Fatality · Penurunan LTIF 100%
**Business target:** Zero Accident
**Ultimate target 2026:** Zero Harm Zero Loss
**Laporan unit:** 100% On Track (s.d. Sep 2026)

**Program:**
1. Safety Briefing
2. Walk Down Care for Asset & Care for Safety
3. CCV
4. Aplikasi Inspekta
5. HSSE Control Center
6. Safety untuk Masyarakat (Bersinar)

| id | Indikator | tipe | unit | Target | Jun | Jul | Agu | Sep | Prog Des |
|---|---|---|---|---|---|---|---|---|---|
| `kasus` | Penambahan kasus | zero | kasus | 0 | 0 | 0 | 0 | 0 | 0 |
| `lti` | Temuan penyebab LTI | zero | temuan | 0 | 0 | 0 | 0 | 0 | 0 |
| `closing` | Tindak lanjut temuan (closed) | cumulative | temuan | 14.235 | 7.339 | 8.435 | 9.396 | 10.770 | 14.235 |
| `apd` | Kepatuhan APD & SOP | min | % | 100 | 100 | 100 | 100 | 100 | 100 |

**Seri bulanan Walk Down** (temuan; jumlah kumulatif cocok dengan baris `closing`):

| Jan | Feb | Mar | Apr | Mei | Jun | Jul | Agu | Sep | Okt–Des (prognosa) |
|---|---|---|---|---|---|---|---|---|---|
| 1.417 | 1.299 | 993 | 1.403 | 1.072 | 1.155 | 1.096 | 961 | 1.374 | 3.465 (total) |

**Ritual Safety (6 tahap):**

| Tahap | Ritual | Aktivitas | Dampak |
|---|---|---|---|
| Before Work | Safety Briefing + JSA + CCV | Sampaikan risiko & pengendaliannya · Identifikasi bahaya · Pastikan pengendalian siap sebelum bekerja | Petugas memahami risiko dan konsekuensi; pengendalian disiapkan sebelum pekerjaan dimulai. |
| During Work | Supervision + CCTV/BWC + Monitoring | Pengawasan aktif di lapangan · Pantau kepatuhan & kondisi pekerjaan · Tindak segera jika ada penyimpangan | Penyimpangan terdeteksi lebih dini; pekerjaan bisa langsung dihentikan saat tidak aman dan dikoreksi segera. |
| After Work | Evaluation + Inspekta + Closing | Evaluasi hasil pekerjaan · Inspeksi & verifikasi lapangan · Tutup pekerjaan dengan aman | Temuan ditutup dan tidak berulang. |
| Weekly | Safety Briefing & Review | Review kinerja K3 · Sharing temuan & pembelajaran · Perkuat komitmen & perbaikan | Tren kinerja dibahas; hambatan dan temuan berulang mendapat tindakan. |
| Monthly | Gelar APD & Alker + Management Inspection | Cek kelengkapan APD & Alker · Management inspection di lapangan · Evaluasi sistem & kepatuhan | Kualitas APD, alat kerja, kepatuhan, dan kebutuhan perbaikan ditinjau berkala. |
| Continuous | Safety Quotes + Edukasi + Life Saving Rules | Sampaikan pesan keselamatan setiap hari · Edukasi berkelanjutan · Terapkan Life Saving Rules tanpa kompromi | Pesan keselamatan terus hadir; petugas memahami bahaya, kontrol, dan konsekuensi jika kontrol tidak dijalankan. |

**Tagline ritual:** "Menjadikan keselamatan sebagai kebiasaan sehari-hari untuk mencapai ZERO HARM ZERO LOSS" — *Mencegah kecelakaan · Meningkatkan kepatuhan · Meningkatkan kinerja · Melindungi pekerja, aset, dan masyarakat.*

**Behaviour change:**
- Dari: "Sudah briefing."
- Menjadi: "Saya memahami bahaya, kontrol dan konsekuensi jika kontrol tidak dijalankan."

**Dampak Penguatan Budaya Safety:**
- Zero Fatality — 0 fatality
- LTIF — tidak ada penambahan
- Closing temuan — 10.770 unsafe action/condition ditindaklanjuti
- Disiplin SOP & APD — 100% kepatuhan

**Dampak Sidak:**
- Risiko terkendali (bahaya kritis teridentifikasi & diamankan lebih cepat)
- Kepatuhan meningkat (disiplin SOP, APD, izin kerja, metode kerja aman)
- Temuan berulang turun (akar penyebab diperbaiki)
- Cegah kecelakaan (mengurangi peluang insiden, cedera, gangguan operasi)

**Leader Behavior:**
- Perencanaan — menyusun rencana aksi (safety briefing manajemen, Sidak Manajemen, Safety Quote)
- Pelaksanaan — implementasi safety briefing manajemen, Sidak Manajemen, Safety Quote
- Monitoring — monitoring harian sidak, temuan, rencana kerja, dan safety briefing harian ULP
- Evaluasi — evaluasi pelaksanaan

**Simbol:**

| Program | Ritual | Frekuensi | Evidence | Reward & Consequence | Dampak | Governance |
|---|---|---|---|---|---|---|
| ETAM (Edukasi dan Teladan untuk Aksi Menjaga keselamatan) | Internalisasi / Ritual & Komunikasi | Harian via pesan WhatsApp & pesan suara Walkiefleet HSSE Control Center | WA Group, Story WA, video pesan keselamatan HSSE CC | Publikasi | Pegawai & petugas lebih mudah memahami risiko, peduli keselamatan, saling mengingatkan, dan menerapkan kerja aman secara konsisten | Surat GM No. 1429/KLH.01.01/F140000/2026 tentang Himbauan Safety Quote |
| Reward & Konsekuensi | Reward and Consequences | Bulanan & semester | Penetapan reward & konsekuensi di unit induk & unit pelaksana | 1) Apresiasi/reward Inspekta Champion · 2) Sanksi/konsekuensi dengan SLA/denda pada tagihan untuk ketidaksesuaian implementasi | Mencegah kecelakaan berulang, meningkatkan disiplin, membentuk identitas budaya K3 yang peduli dan patuh | Penetapan Reward Program K3L Tahun 2026 |

**Sistem:**
- Dashboard HSSE CC — monitoring Work Order, status BWC/CCTV, temuan K3 per UP3 (akses intranet)
- Laporan Harian Kinerja HSSE — kecelakaan, maturity level K3 & keamanan, temuan inspeksi Inspekta, pemenuhan SOP

### A.3 PLN 1 — Culture DNA "Beyond Safety"

| Nilai | Definisi | Agu | Sep | Δ |
|---|---|---|---|---|
| Disiplin | Konsisten menjalankan aturan dan tanggung jawab | 4,67 | 4,84 | +0,17 |
| Tanpa Kompromi | Menjaga standar keselamatan di setiap kondisi | 4,70 | 4,86 | +0,16 |
| Peduli | Aktif menjaga keselamatan diri dan rekan kerja | 4,77 | 4,83 | +0,06 |

**Perilaku kunci:**
- **Disiplin**
  - Mematuhi seluruh SOP kerja tanpa diingatkan
  - Menggunakan APD sesuai standar
  - Datang tepat waktu pada briefing/toolbox meeting
  - Melaksanakan Take-5/JSA sebelum bekerja
  - Menjaga kerapihan area kerja setelah pekerjaan selesai
- **Tanpa Kompromi**
  - Menghentikan pekerjaan apabila kondisi tidak aman
  - Menolak melakukan pekerjaan yang melanggar SOP
  - Berani mengingatkan rekan yang bekerja tidak aman
  - Melaporkan Unsafe Action/Unsafe Condition
  - Tidak mentoleransi pelanggaran K3
- **Peduli**
  - Membantu rekan menjaga keselamatan kerja
  - Mengingatkan penggunaan APD kepada rekan
  - Aktif mengikuti safety briefing
  - Memberikan saran perbaikan aspek keselamatan
  - Menjadi contoh perilaku aman di tempat kerja

**Quote:** "Budaya Keselamatan dimulai dari saya." — *Paham · Peduli · Bertindak · Mengingatkan*

### A.4 PLN 2 — Borneo Best (Beyond Service)

**KPI Fokus Bisnis:**
- Indeks Kepuasan Pelanggan ≥ 99,50% *(Menunggu Data)*
- Target susut distribusi (tanpa Emin) 6,15% *(Menunggu Data)*
- Penggambaran aset distribusi berbasis ArcGIS

**Business target:** IKP ≥ 99,50%
**Ultimate target 2026:** Kepuasan Pelanggan
**Laporan unit:** 5 Program On Track (s.d. Sep 2026)

**Program (Siklus Beyond Service):**

| # | Aksi | Program | Deskripsi |
|---|---|---|---|
| 01 | Lindungi Data Pelanggan | VAPE GADIS | Validasi data pelanggan per gardu |
| 02 | Engagement / Dekati Pelanggan | Goes to Public | Kunjungan, sosialisasi & pencatatan CRM |
| 03 | Dengarkan Keluhan | Tok Tok Wow | Catat feedback, profil & riwayat pelanggan |
| 04 | Siapkan Petugas Gercep | Akademi Yantek | Perkuat kompetensi, K3 & kesiapan layanan |
| 05 | Jaga Keandalan Listrik | Checkpoint Distribusi & Niaga | Evaluasi jaringan & koordinasikan tindak lanjut |

| id | Indikator | Program | tipe | unit | Target | Jun | Jul | Agu | Sep | Prog Des |
|---|---|---|---|---|---|---|---|---|---|---|
| `trx_kali` | Jumlah kali transaksi PLN Mobile | Goes to Public | cumulative | ribu kali | 651,76 | 530,47 | 678,83 | 865,46 | 989,68 | 1.270,93 |
| `trx_rp` | Rupiah transaksi PLN Mobile | Goes to Public | cumulative | Rp miliar | 278,37 | 165,42 | 200,91 | 240,84 | 279,01 | 361,88 |
| `feedback` | Feedback rating negatif | Tok Tok Wow | max | % | 0,03 | 0,116 | 0,011 | 0,013 | 0,013 | 0,013 |
| `gangguan_berulang` | Penurunan pengaduan gangguan berulang | Akademi Yantek | min | % | 5 | 15 | 20 | 20 | 25 | 25 |
| `gangguan_penyulang` | Penurunan gangguan penyulang | Checkpoint D&N | min | % | 5 | 15 | 20 | 20 | 25 | 25 |
| `vape_gadis` | Validasi data pelanggan (tergambar & terpetakan) | VAPE GADIS | min, approx | % | 95 | 85 | 87 | 90 | 93 | 95 |

> Di lembar pencapaian, baris "Penurunan gangguan" (5% / 15–25%) adalah satu baris. Di slide Business Focus Alignment, angka yang sama dipakai untuk Akademi Yantek **dan** Checkpoint. Simpan sebagai dua indikator dengan nilai sama dan catatan `note` (❓ konfirmasi apakah memang identik).
>
> Untuk uji §8.4, satu baris "Penurunan gangguan" sudah cukup mewakili.

### A.5 PLN 2 — Culture DNA "Beyond Service"

| Nilai | Definisi | Agu | Sep | Δ |
|---|---|---|---|---|
| Empati | Memahami dan melayani pelanggan dengan lebih baik | 4,71 | 4,84 | +0,13 |
| Proaktif | Bergerak lebih awal dan mengantisipasi kebutuhan pelanggan | 4,56 | 4,71 | +0,15 |
| Solutif | Memberikan solusi terbaik untuk kebutuhan pelanggan | 4,60 | 4,74 | +0,14 |

**Perilaku kunci:**
- **Empati**
  - Menyapa pelanggan dengan ramah dan sopan
  - Mendengarkan kebutuhan pelanggan tanpa memotong pembicaraan
  - Menggunakan bahasa yang mudah dipahami
  - Menunjukkan kepedulian terhadap kondisi pelanggan
  - Mengakhiri pelayanan dengan memastikan pelanggan memahami solusi
- **Proaktif**
  - Memberikan informasi sebelum pelanggan bertanya
  - Menginformasikan progres pekerjaan secara berkala
  - Menawarkan bantuan tambahan kepada pelanggan
  - Mengedukasi pelanggan mengenai PLN Mobile atau layanan digital
  - Mengidentifikasi potensi masalah sebelum menjadi keluhan
- **Solutif**
  - Memberikan solusi yang sesuai kebutuhan pelanggan
  - Memberikan alternatif solusi apabila terdapat kendala
  - Melakukan koordinasi lintas fungsi tanpa membebani pelanggan
  - Melakukan follow up hingga pekerjaan selesai
  - Memastikan pelanggan puas terhadap penyelesaian masalah

### A.6 PLN 2 — BEST Acrostic, Leader Behavior, Simbol

**BEST (System — Dashboard Pencapaian Kinerja untuk Kepuasan Pelanggan):**

| Huruf | Judul | Sub | Capaian utama |
|---|---|---|---|
| **B** | Beyond — Melampaui | Kinerja Bidang OHSD 100% tercapai | Response time 24,18 menit (capaian 118,63%) · SAIDI 108,70% · SAIFI 105,88% · Feedback negatif 0,013% (capaian 173,38%) |
| **E** | Expectations — Harapan | Transaksi PLN Mobile di atas target setahun | 989.684 transaksi Jan–Sep (209,8% target YTD) · Rp279,0 M, melewati target setahun Rp278,4 M · Naik +145% YoY (420.555 vs 171.430 transaksi) |
| **S** | Serving — Melayani | Gangguan turun tajam pada 2026 (D3) | Gangguan Jan–Sep −25,3% (5.972 → 4.459) · Apr–Sep rata-rata 247/bulan vs 732 di 2025 (−66%) · September 214 vs 862 di 2025 |
| **T** | Together — Bersama | Pelanggan & aset terdata & terpetakan | 1.468.159 PDL valid · 83,84% · PDL valid naik dari 32,02% ke 83,84% |

**Leader Behaviour** — *"Bersama membangun budaya kerja unggul di setiap langkah"*:
- Perencanaan — merancang strategi, menetapkan target, menyusun rencana aksi budaya yang terukur *(evidence: FGD Program Distribusi, Koordinasi Tim Distribusi)*
- Pelaksanaan — menggerakkan tim dan memastikan program budaya berjalan sesuai rencana *(evidence: Guerilla marketing & kolaborasi komunitas, Light Up The Dream, Komunitas EV Bike)*
- Monitoring — memantau progres, memastikan kepatuhan, dan mendampingi *(evidence: Dashboard Distribusi, COC VAPE GADIS)*
- Evaluasi & Perbaikan — mengevaluasi hasil, menemukan peluang perbaikan, menindaklanjuti berkelanjutan *(evidence: Evaluasi Program VAPE GADIS, Kampus Yantek Batch 4)*

**Penutup:** "Ranger Leader & Ranger Master hadir dan berperan aktif di setiap tahap" — *Konsisten · Kolaboratif · Berdampak · Berkelanjutan*

**Simbol:**

| Program | Ritual | Frekuensi | Evidence | Reward & Consequence | Dampak | Governance |
|---|---|---|---|---|---|---|
| VAPE GADIS | COC VAPE GADIS & validasi data pelanggan per gardu | Evaluasi rutin | COC VAPE GADIS · Dashboard Distribusi | Apresiasi UP3 dengan PDL valid tertinggi; UP3 terendah wajib rencana percepatan | PDL valid naik 32,02% → 83,84%; titik koordinat akurat, yantek lebih cepat tiba | Data AP2T dipantau di Dashboard Distribusi & ArcGIS; progres 6 UP3 dibahas di COC |
| Goes to Public | Guerilla marketing & touring EV bersama komunitas | Aktivasi berkelanjutan | Touring EV bersama komunitas EV Bike Balikpapan | Apresiasi unit transaksi tertinggi; capaian di bawah target dievaluasi bulanan | Transaksi PLN Mobile 989.684 kali (209,8% target YTD), +145% YoY; pelanggan makin digital | Target kali & rupiah dimonitor bulanan; kolaborasi komunitas EV |
| Tok Tok Wow | Sapa pelanggan, customer journey & catat feedback | Review bulanan | Marketing Award per 3 bulan | Apresiasi petugas dengan feedback positif; keluhan berulang wajib ditindaklanjuti | Feedback negatif 0,013% (< 0,03%); keluhan & profil pelanggan terpetakan | Feedback & riwayat tercatat di CRM; tindak lanjut lintas fungsi |
| Akademi Yantek | Kampus Yantek: refreshment kompetensi & K3 | Triwulan & semester | Kampus Yantek Batch 4 · UP3 Berau | Apresiasi yantek & posko terbaik; pelanggaran K3 diberi konsekuensi sesuai prosedur | Response time 24,18 menit (118,63%); kompetensi & budaya K3 yantek menguat | Digelar bersama UP3; materi selaras K3 & SOP distribusi |
| Checkpoint Distribusi & Niaga | Checkpoint & FGD lintas distribusi–niaga | Checkpoint berkala | FGD Program Distribusi | Apresiasi unit paling andal; penyulang gangguan berulang wajib punya PIC & rencana aksi | Gangguan penyulang turun 25,3% (Jan–Sep); SAIDI 108,70% & SAIFI 105,88% | Evaluasi lintas peran; tindak lanjut terkoordinasi per PIC unit |

**Sistem:** Dashboard Kinerja OHSD · Dashboard Transaksi PLN Mobile · Grafik Gangguan Penyulang 2025 vs 2026 · Dashboard JTM & JTM SR App (pelanggan terdata & terpetakan) — semuanya akses intranet.

### A.7 PLN 3 — Borneo Prima (Beyond Growth & Productivity)

**KPI Fokus Bisnis:**
- Pertumbuhan penjualan 8,82% *(Menunggu Data)*
- Produktivitas 10,46 GWh/pegawai

**Business target:** Penjualan energi > 7,04 TWh
**Ultimate target:** Produktivitas per pegawai > 10 GWh
**Laporan unit:** 100% On Track (s.d. Sep 2026)

**Program resmi (lembar pencapaian):**
1. Breakdown Rencana Aksi
2. Forum Pencapaian
3. Penguatan Kompetensi Niaga
4. Prospek Pelanggan Baru
5. Program Percepatan Pelayanan Pelanggan

**5 Program PRIMA (tampilan utama):**

| Huruf | Program | Deskripsi | Capaian |
|---|---|---|---|
| **P** | Profil & Peta Pelanggan | Profiling dan visualisasi peta pelanggan | **367 lokasi** — data profiling pelanggan di aplikasi DPLC |
| **R** | Report Penjualan Rutin | Sales report berkala untuk evaluasi & tindak lanjut | **5.339 GWh** realisasi s.d. Sep · target 5.222 GWh · **102,24%** |
| **I** | Improvement Kompetensi Marketers | Upskilling tim pemasaran | **ARUS MAHAKAM** — Seri I 23–25 Sep · Seri II 14–16 Okt |
| **M** | Maksimalkan Branding | Marketing kit, banner, flyer, optimalisasi media sosial | **Media cetak & Instagram** di lokasi strategis |
| **A** | Ajang Kompetisi Marketing | Kompetisi pendorong kreativitas & prestasi | **Marketing Award & Rewarding** — penghargaan UP3 & ULP di Forum Distribusi Niaga |

**Slogan:** "Kenali Pelanggan, Kuatkan Pemasaran, Tumbuhkan Penjualan!"

| id | Indikator | tipe | unit | Target tahunan | targetYtd | Jun | Jul | Agu | Sep | Prog Des |
|---|---|---|---|---|---|---|---|---|---|---|
| `penjualan` | Realisasi penjualan energi listrik | cumulative | GWh | 7.040 | Sep: 5.222 | 3.436 | 4.059 | 4.699 | 5.339 | 7.015 |
| `produktivitas` | Produktivitas pegawai | cumulative | GWh/pegawai | 10,46 | – | 5,04 | 6,01 | 6,96 | 7,88 | 10,36 |

**System (gauge):**

| Metrik | Target | Realisasi | Capaian | Basis |
|---|---|---|---|---|
| Penjualan tenaga listrik | 5.222 GWh | 5.339 GWh | 102,24% | target s.d. Sep |
| Produktivitas per pegawai | 10,46 GWh | 7,88 GWh | 75,33% | target Des (tahunan) |
| Percepatan penyambungan — jumlah penambahan pelanggan | 64.589 plg | 70.343 plg | 108,91% | target s.d. Sep |
| Percepatan penyambungan — penambahan daya tersambung | 208,38 MVA | 229,74 MVA | 110,25% | target s.d. Sep |

**Snapshot Dashboard CRM** (rentang 01 Jan–16 Okt 2026):
- Close Won 68,61% · Rp104,13 M · 6.085 pelanggan
- Close Lost 0,31% · Rp0,47 M · 12 pelanggan
- Top revenue of the month: UP3 Balikpapan Rp42,96 M
- Top customer of the month: UP3 Samarinda 3.152 pelanggan

**Leader Behavior:**
- Perencanaan — rencana aksi: breakdown target & perencanaan pemasaran berdasarkan potensi unit
- Pelaksanaan — probing konsumen & calon pelanggan, penyampaian promo tematik
- Monitoring — monitoring harian progres penjualan, updating potensi & confidence level
- Evaluasi — evaluasi bulanan hasil pemasaran tiap unit

**Penutup:** "Ranger Master & Ranger Leader berperan aktif memastikan tiap tahap berdampak, berdedikasi dan *do extra miles*."

**Simbol:**

| Program | Ritual | Frekuensi | Evidence | Reward & Consequence | Dampak | Integrasi |
|---|---|---|---|---|---|---|
| Report Penjualan Rutin | Internalisasi / Ritual | Harian via WAG, bulanan via surat | WAG pemasaran, surat ke UP3 tiap bulan | 1) Apresiasi unit kinerja tertinggi · 2) Teguran unit kinerja terbawah | Pola pikir memberi dampak nyata pada kinerja penjualan & berdedikasi melayani konsumen | 1) Surat No. 4916_AGA.04.01_F14000000_2026 tentang Evaluasi & Optimalisasi Penggunaan Aplikasi CRM untuk Kegiatan Pemasaran · 2) Forum Sinergi Distribusi & Niaga Semesteran |
| Marketing Reward | Reward & Consequences | Semesteran | Surat apresiasi marketer terbaik tiap bulan (contoh: sertifikat ULP Tanjung Redeb "Terbaik 3") | 1) Reward marketer terbaik · 2) Reward unit kinerja terbaik | Pegawai termotivasi melakukan lebih dari standar (*do extra miles*) | 1) Penetapan Marketer Terbaik SMT 1 2026 · 2) Penetapan Unit Terbaik SMT 1 2026 |

**Sistem:** Dashboard CRM · Dashboard Potensi Pelanggan 2026 (peta potensi per ULP & kategori) — akses intranet.

### A.8 PLN 3 — Culture DNA "Beyond Growth and Productivity"

| Nilai | Definisi | Agu | Sep | Δ |
|---|---|---|---|---|
| Berdampak | Memberikan manfaat nyata bagi unit dan pelanggan | 4,60 | 4,71 | +0,11 |
| Berdedikasi | Komitmen dan integritas dalam setiap pekerjaan | 4,59 | 4,72 | +0,13 |
| Do Extra Miles | Melampaui tugas rutin untuk hasil yang lebih besar | 4,41 | 4,72 | +0,31 |

**Perilaku kunci:**
- **Berdampak**
  - Pekerjaan yang dilakukan memberikan manfaat nyata bagi unit
  - Menghasilkan ide perbaikan yang dapat diterapkan
  - Berorientasi pada kualitas hasil kerja
  - Menyelesaikan pekerjaan sesuai target yang disepakati
  - Mengukur hasil pekerjaannya berdasarkan dampak terhadap pelanggan atau bisnis
- **Berdedikasi**
  - Menyelesaikan pekerjaan tepat waktu
  - Menunjukkan komitmen terhadap target unit
  - Tetap menjaga kualitas meskipun dalam tekanan pekerjaan
  - Bersedia membantu penyelesaian pekerjaan tim
  - Menjaga integritas dalam setiap pelaksanaan tugas
- **Do Extra Miles**
  - Melakukan pekerjaan di luar tugas rutin untuk kepentingan organisasi
  - Secara sukarela membantu unit atau rekan lain
  - Mengusulkan inovasi atau improvement tanpa diminta
  - Bersedia mengambil tanggung jawab tambahan untuk mencapai target bersama
  - Memberikan pelayanan yang melebihi harapan pelanggan atau pemangku kepentingan

**Footer Culture DNA (Service & Growth):** Fokus pada Pertumbuhan Berkualitas · Inovasi & Efisiensi · Produktivitas Tinggi · Keandalan & Kepuasan Pelanggan — *"One Ranger can start a change, together we create the culture!"*

### A.9 Governance & Dokumen

| Pilar | Nomor / Nama | Judul | Tanggal |
|---|---|---|---|
| Semua | Lembar Pencapaian Program Budaya 2026 | Business Focus Alignment PLN UID Kaltimra 2026 — ditandatangani Ranger Master | 15 Okt 2026 |
| PLN 1 | Surat GM No. 1429/KLH.01.01/F140000/2026 | Himbauan Safety Quote | 2026 |
| PLN 1 | Penetapan Reward Program K3L | Reward Program K3L Tahun 2026 | 2026 |
| PLN 1 | Laporan Harian Kinerja HSSE | UID Kaltimra — Rabu, 14 Oktober 2026 | 14 Okt 2026 |
| PLN 2 | COC VAPE GADIS | Pembahasan progres 6 UP3 | Rutin |
| PLN 3 | Surat No. 4916_AGA.04.01_F14000000_2026 | Evaluasi & Optimalisasi Penggunaan Aplikasi CRM untuk Kegiatan Pemasaran | 2026 |
| PLN 3 | Forum Sinergi Distribusi & Niaga | Forum semesteran | Semesteran |
| PLN 3 | Penetapan Marketer & Unit Terbaik | Semester 1 2026 | 2026 |
| PLN 3 | Paparan Borneo Prima | Program Budaya "Beyond Growth & Productivity" | 13 Okt 2026 |

### A.10 Nilai turunan yang diharapkan *(assert di `tests/data.test.ts`)*

| Nilai | Hasil |
|---|---|
| Kumulatif Walk Down Jan–Sep | 1.417 · 2.716 · 3.709 · 5.112 · 6.184 · **7.339** (Jun) · **8.435** (Jul) · **9.396** (Agu) · **10.770** (Sep) |
| Rata-rata Walk Down Jan–Sep | 1.196,67 → tampil **1.197** |
| Kenaikan MoM April / September | **+41,3%** / **+43,0%** |
| Kebutuhan Walk Down Okt–Des | 3.465 → **1.155/bulan** |
| Closing temuan vs target tahunan | **75,66%** |
| Transaksi kali vs target tahunan | **151,85%** |
| Rupiah transaksi vs target tahunan | **100,23%** |
| Penjualan vs target s.d. Sep / vs tahunan | **102,24%** / **75,84%** |
| Prognosa penjualan vs target | **99,64%** (gap 25 GWh) |
| Kenaikan penjualan bulanan Jul / Agu / Sep | 623 / 640 / 640 GWh → run-rate **634,3** · butuh **567,0** · asumsi prognosa **558,7** GWh/bulan |
| Produktivitas vs target tahunan / prognosa | **75,33%** / **99,04%** |
| Kenaikan produktivitas Jul / Agu / Sep | 0,97 / 0,95 / 0,92 → butuh **0,86**/bulan |
| Penambahan pelanggan / daya tersambung | **108,91%** / **110,25%** |
| Feedback rating vs batas | **43,3%** dari batas |
| Kebutuhan VAPE GADIS | **+0,67 poin/bulan** |
| Gangguan Jan–Sep / rata-rata Apr–Sep / September | **−25,3%** / **−66,3%** / **−75,2%** |
| Rata-rata Culture DNA Agu → Sep | Safety 4,71 → **4,84** (+0,13) · Service 4,62 → **4,76** (+0,14) · Growth 4,53 → **4,72** (+0,18) |
| Kenaikan terbesar / skor tertinggi / terendah (Sep) | Do Extra Miles **+0,31** / Tanpa Kompromi **4,86** / Proaktif & Berdampak **4,71** |

---

## Lampiran B — Daftar aset

Letakkan di `public/assets/`. Export dari **file PowerPoint asli atau gambar sumber**, bukan screenshot PDF, agar tajam di layar besar. Format WebP/AVIF (foto) atau SVG/PNG transparan (logo). Bila file belum ada, komponen `ImageWithFallback` menampilkan placeholder.

| Folder | File | Isi | Wajib? |
|---|---|---|---|
| `brand/` | `logo-pln.svg` | Logo PLN resmi (dari Komunikasi Korporat) | MUST |
| `brand/` | `logo-danantara.svg` | Logo Danantara Indonesia resmi | MUST |
| `pillars/` | `emblem-bersinar.png` | Logo Borneo Bersinar (transparan) | MUST |
| `pillars/` | `emblem-best.png` | Logo Borneo Best (transparan) | MUST |
| `pillars/` | `emblem-prima.png` | Emblem enggang Borneo Prima (transparan) | MUST |
| `pillars/` | `cover-cohub3.webp` | Ilustrasi cover CO HUB 3 (karakter + kota hijau) | SHOULD |
| `pillars/` | `cover-bersinar.webp`, `cover-best.webp`, `cover-prima.webp` | Cover tiap pilar | SHOULD |
| `pillars/` | `char-safety-*.webp`, `char-service-*.webp`, `char-growth-*.webp` | Crop karakter dari slide Culture DNA (tanpa teks) | COULD |
| `decor/` | `enggang.webp`, `bekantan.webp`, `jembatan.webp`, `borneo-mist.webp` | Elemen dekoratif latar | COULD |
| `map/` | `kaltim-kaltara.svg` | Siluet Prov. Kaltim + Kaltara (dari GeoJSON open data, disederhanakan, mis. dengan mapshaper) | MUST |
| `evidence/bersinar/` | `safety-briefing`, `jsa-ccv`, `cctv-bwc`, `inspekta-closing`, `weekly-review`, `gelar-apd`, `safety-quotes`, `sidak-manajemen` | Foto evidence | SHOULD |
| `evidence/best/` | `fgd-distribusi`, `koordinasi-distribusi`, `light-up-the-dream`, `komunitas-ev-bike`, `touring-ev`, `coc-vape-gadis`, `dashboard-distribusi`, `marketing-award-2026`, `kampus-yantek-batch4` | Foto evidence | SHOULD |
| `evidence/prima/` | `breakdown-target`, `probing-konsumen`, `arus-mahakam`, `media-cetak`, `marketing-award-gold`, `sertifikat-ulp-tg-redeb` | Foto evidence | SHOULD |
| `systems/` | `hsse-cc.webp`, `laporan-harian-hsse.webp`, `dashboard-ohsd.webp`, `dashboard-pln-mobile.webp`, `gangguan-2025-2026.webp`, `dashboard-jtm.webp`, `dashboard-crm.webp`, `potensi-pelanggan.webp` | Screenshot dashboard (URL/IP disamarkan) | SHOULD |
