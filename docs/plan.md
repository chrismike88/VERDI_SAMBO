# plan.md — KWH AI Validator (versi baru)

Rencana pembuatan aplikasi clone dari **KWH AI Validator** (validator foto kWh meter prabayar), dengan fungsi dan jenis yang sama — aplikasi web yang berjalan di localhost dengan mesin AI Python — tetapi dengan tampilan baru yang jauh lebih kuat, lebih cepat dipakai verifikator, dan lebih akurat.

Sumber analisis: rekaman layar `WhatsApp_Video_2026-10-04_at_16_21_54.mp4` (10 menit, 1272×988, tanpa narasi). Semua fungsi di bagian 1 diambil dari apa yang benar-benar terlihat di video; timestamp dicantumkan agar mudah dicek ulang.

---

## 0. Ringkasan

**Apa yang dibuat.** Aplikasi untuk memvalidasi foto lapangan kWh meter prabayar secara massal: mencocokkan foto dengan data pelanggan dari Excel, memotong layar LCD, membaca angka STAN (sisa kWh) dengan AI, memeriksa kelayakan foto, IDPEL, stiker bulanan, dan lokasi, lalu memberi ruang bagi verifikator untuk mengoreksi dan mengekspor hasil ke Excel.

**Tiga prinsip versi baru.**
1. **Paritas dulu.** Semua fungsi yang ada di aplikasi asli tetap ada, dengan nama status yang kompatibel saat diekspor.
2. **Verifikator bekerja tanpa putus.** Empat modal di aplikasi asli diganti satu panel Inspektor di samping tabel, dengan navigasi keyboard. Memeriksa 35 foto tidak lagi berarti membuka-tutup 140 modal.
3. **AI yang lebih sering yakin.** Di video, 27 dari 34 foto yang selesai diproses (≈79%) berakhir di "Periksa / koreksi manual". Pipeline baru menargetkan angka ini turun di bawah 25%.

**Sasaran terukur (definisi selesai).**

| Metrik | Aplikasi asli (teramati) | Target versi baru |
|---|---|---|
| Waktu proses per foto | ≈16 detik (34 foto dalam ±9 menit) | ≤3 detik di CPU, ≤0,7 detik dengan GPU |
| Foto yang butuh pemeriksaan manual | ≈79% | <25% |
| Akurasi STAN (foto layak, baca tepat) | belum terukur | ≥95% pada dataset uji |
| Klik untuk memverifikasi 1 baris | ±4 (buka modal, isi, simpan, tutup) | 1 tombol keyboard |
| Tabel tetap mulus | 35 baris, paginasi 20 | 5.000+ baris, virtualisasi, 60 fps |
| Bekerja tanpa internet | ya | ya (font, ikon, model disimpan lokal) |

---

## 1. Hasil analisis aplikasi asli

### 1.1 Identitas dan lingkungan

- Nama: **KWH AI VALIDATOR** — subjudul "Pengecekan Foto KWh Meter dengan AI (Localhost)".
- URL: `127.0.0.1/validator/` di Chrome; indikator header "Mode : Localhost (XAMPP + Python)".
- Panel Quick Access di dialog file menunjukkan folder `app, bootstrap, config, database, public, resources, routes, storage, vendor` — pola proyek Laravel. Dugaan kuat: frontend/backend PHP (Laravel di XAMPP) + layanan Python untuk AI.
- Data demo: `D:\PLN\DEMO-KWHAI\DEMO_VALID_82\` berisi folder `FOTO`, `TERBACA_100`, file `DATA_PELANGGAN_TERBACA_100.xlsx` (7 KB, 35 pelanggan) dan `DATA_PELANGGAN_VALID.xlsx` (73 KB).
- Foto lapangan memakai overlay kamera stempel waktu: `Nama`, `Idpel`, `Alamat`, `Lat/Lon`, `Tanggal` (format `MM/DD/YYYY HH:MM:SS`). Banyak meter memiliki stiker seperti "LPB AMB AGT 2026".
- Kantor rujukan yang dipakai di demo: PT PLN (Persero) UP3 Kuala Kapuas (−3.0084, 114.3855).

### 1.2 Alur kerja end-to-end (urutan di video)

1. Pilih file Excel master (dialog Windows) → validasi kolom IDPEL/Nama → "35 pelanggan valid" (t≈6–10 s).
2. Pilih bulan dan tahun periode (September 2026).
3. Atur folder foto: tombol **Pilih** → modal "Pengaturan Folder Foto Aktif (N)" → tombol jelajahi membuka dialog native Windows "Browse For Folder — Pilih Folder Foto Meter KWh PLN" → **Simpan & Terapkan** → "Folder Valid (35 foto) — 35 JPG, 0 JPEG, 0 PNG" (t≈14–30 s).
4. Pilih format nama file: `IDPEL.jpg` (default) atau `IDPEL_tanggal.jpg`.
5. **Muat Data** → foto dipasangkan dengan baris Excel; crop lama dibersihkan otomatis; tabel terisi status "Menunggu AI" (t≈34 s).
6. **Proses Semua Data** (atau Proses Halaman Ini) → crop cepat LCD untuk 20 foto di halaman aktif, lalu foto diproses satu per satu; log berjalan real-time; statistik bertambah (t≈60 s → akhir video).
7. Verifikator membuka detail per baris, melihat foto asli, potongan LCD, hasil AI, mengisi STAN manual, menekan Sesuai / Tidak Sesuai / Rumah Tutup.
8. Filter dan **Export Excel**.

Rekaman berhenti di menit ke-10 saat baris ke-35 masih diproses.

### 1.3 Inventaris layar dan komponen

**Header**
- Logo petir, judul, subjudul.
- Indikator mode (titik hijau + "Mode : Localhost (XAMPP + Python)").
- Tombol pengaturan (ikon gir; tidak dibuka di video).
- Jam dan tanggal hidup ("Minggu, 4 Oktober 2026 — 13:31:09").

**Panel 1 — Import Data Pelanggan**
- Zona pilih file: "Pilih File Excel — Format: .xlsx, .xls, .csv (maks. 50 MB)"; setelah terpilih menampilkan nama file + "35 pelanggan valid. Klik untuk ganti file."
- Dropdown Bulan dan Tahun.
- Tombol **Muat Data**.
- Pesan status bertingkat: "Silakan pilih Excel Master terlebih dahulu" → "Excel dan Folder Foto siap. Klik Muat Data." → "Data berhasil dimuat. Proses AI dapat dijalankan." + sumber foto + kartu hijau "35 foto real cocok dengan 35 baris Excel."

**Panel 2 — Proses AI**
- Tiga tombol tahap: **Cek Foto** (Computer Vision), **OCR STAN** (Nomor Meter), **Validasi** (Aturan Bisnis).
- **Proses Halaman Ini** dan **Proses Semua Data**.
- Bar progres: teks status ("Siap memproses data AI."), hitungan `0 / 35`, persen, tombol **Stop**.
- Empat checkbox tahap: Computer Vision, OCR Nomor Meter, OCR STAN KWh, Validasi Aturan.
- Konsol "LOG AKTIVITAS INFERENSI AI (REAL-TIME)" bergaya terminal + tombol **Bersihkan**.

**Panel 3 — Pengaturan Folder Foto**
- Baris "Folder Foto (N)" + path + tombol **Pilih**.
- Kartu status folder: "Folder Belum Dipilih" / "Folder Valid (35 foto) — 35 foto terbaca (35 JPG, 0 JPEG, 0 PNG)" + tombol **Cek** (pindai ulang).
- Radio "Format Nama File": `IDPEL.jpg (default)` / `IDPEL_tanggal.jpg`.

**Kartu statistik (8 buah)**
- Baris besar: **Sukses AI** `x / total (persen)`, **Sesuai Cater** `x / total`, **Tidak Sesuai** `x / total`.
- Baris kecil: **Total Data**, **Valid**, **Tidak Valid**, **Perlu Review**, **Belum Diproses** — masing-masing dengan persen dan bar tipis.

**Toolbar filter**
- Pencarian "Cari IDPEL, nama pelanggan, atau nomor meter…".
- Dropdown: Semua Status, Semua Hasil CV, Semua Verifikasi, Semua Lokasi.
- Tombol **Filter**, **Reset**, **Export Excel**.

**Tabel**
- Kolom: ☐, NO, IDPEL, NAMA PELANGGAN, VALIDASI PLN, STAN CATER, STAN AI, VERIFIKASI, CV, FOTO, AKSI.
- Sel VALIDASI PLN berisi tiga baris mini: KWH METER, IDPEL, STIKER (bisa diklik → modal Validasi PLN).
- Kolom FOTO berisi dua thumbnail: **FOTO** (foto asli) dan **LAYAR** (crop LCD; ikon jam pasir "WAIT" sebelum diproses).
- Kolom AKSI: ikon mata (buka detail) dan pensil.
- Paginasi `« ‹ 1 2 › »`, "Menampilkan 1 - 20 dari 35 data", pilihan "20 / halaman".

**Modal**
| Modal | Pemicu | Isi | Contoh di video |
|---|---|---|---|
| Validasi PLN — IDPEL (NAMA) | klik sel Validasi PLN | ① KWH METER (Belum diproses / Valid / Tidak layak + alasan), ② IDPEL (Belum diverifikasi / Match + Excel vs Foto), ③ Stiker bulanan (Belum diperiksa / Ada / Tidak teridentifikasi) + catatan "Pengecekan validitas bulan/tahun belum diimplementasikan." | t≈38 s, 80 s, 362 s, 494 s |
| Pengecekan Foto Meter — IDPEL (NAMA) | ikon mata | Kiri: foto + overlay, potongan LCD (badge Menunggu AI / Terdeteksi), "Peta Geodesic & Titik Koordinat" (garis Meter → PLN Kuala Kapuas, jarak km, badge "CEK STIKER (> 1.0 km)", tombol **Buka di Google Maps**). Kanan: Rincian Referensi Excel (IDPEL, Nama, Match), Rincian Foto Lapangan (IDPEL filename, Nama overlay, Alamat, Koordinat, Kantor PLN rujukan, Jarak, Status geolokasi), Informasi Hasil AI (STAN Cater, A. STAN AI, B. STAN Manual + **Simpan**, C. STAN Final, D. Status AI, E. Status Konsistensi, F. Kualitas Foto, G. Status Verifikasi, H. Instruksi/Alasan), Koreksi Cepat: **Sesuai**, **Tidak Sesuai**, **Rumah Tutup** | t≈42 s, 90 s, 168 s, 444 s, 590 s |
| Detail Slice Layar LCD Meter | klik thumbnail LAYAR | Crop LCD + badge status + penjelasan | t≈122 s, 156 s, 258 s, 404 s |
| Foto Asli Meter | klik thumbnail FOTO | Foto penuh + footer `File: … | IDPEL: … | STAN AI: …` | t≈152 s, 394 s |
| Pengaturan Folder Foto Aktif (N) | tombol Pilih | Penjelasan, input path ("Contoh: D:\PLN\22520"), tombol jelajahi, **Batal**, **Simpan & Terapkan** | t≈14 s |

### 1.4 Kamus status (wajib dipertahankan untuk kompatibilitas ekspor)

| Dimensi | Nilai yang terlihat |
|---|---|
| KWH Meter | `BELUM DIPROSES`, `VALID`, `TIDAK LAYAK` |
| IDPEL | `BELUM DIVERIFIKASI`, `MATCH` (Excel vs nama file) |
| Stiker bulanan | `BELUM_DIPERIKSA`, `ADA`, `TIDAK TERIDENTIFIKASI` |
| Status AI (D) | `BELUM_DIPROSES`, `AI_CONFIDENT`, `AI_UNCERTAIN` |
| Status konsistensi (E) | `—`, `CONSISTENT`, `INCONSISTENT`, `NOT_RUN` |
| Kualitas foto / CV (F) | `-`, `Analyzing`, `READABLE`, `TIDAK TERBACA` |
| Status verifikasi (G) | `MENUNGGU AI`, `MEMPROSES`, `SESUAI AI`, `PERIKSA / KOREKSI MANUAL`, `MINTA FOTO ULANG` (+ hasil manual: Sesuai, Tidak Sesuai, Rumah Tutup) |
| Potongan LCD | `SLICE LAYAR BELUM ADA`, `LCD BERHASIL DIPOTONG (COMPUTER VISION)`, `TERBACA: 4699 (99.8%)`, `LCD TERDETEKSI (PERLU VERIFIKASI)`, `TIDAK LAYAK / GAGAL GATE 1` |
| Geolokasi | `CEK STIKER` bila jarak > 1,0 km |
| STAN final | STAN manual bila diisi, selain itu STAN AI; `NULL` bila tidak ada |

Alasan Gate 1 yang muncul:
- "Display meter tidak terlihat atau meter tidak menyala."
- "Bukan area LCD meteran: LOGO_WARNA_BUKAN_LCD(colorful)" — foto stok produk meter berlatar biru.
- "Bukan area LCD meteran: GRADIENT_HORIZON(vy=2288,vx=378,ratio=6.1)".

Instruksi (H) yang muncul:
- "Menunggu eksekusi proses AI."
- "Foto layak, tetapi AI tidak dapat memastikan angka meter. Silakan lakukan pemeriksaan manual."
- "AI berhasil membaca angka meter dengan hasil yang konsisten."

### 1.5 Pipeline AI yang teramati (dari log)

```
[13:31:17] [Validasi Excel] DATA_PELANGGAN_TERBACA_100.xlsx: 35 baris IDPEL/Nama valid.
[13:31:37] Folder foto aktif berhasil diatur ke: D:\PLN\DEMO-KWHAI\DEMO_VALID_82\TERBACA_100 (35 foto)
[13:31:41] [Clean Crop] 17 file crop lama otomatis dibersihkan saat muat data.
[13:31:41] [Muat Data] 35 foto real dipasangkan dari folder terpilih … AI belum dijalankan.
[13:32:02] Memulai PROSES SEMUA DATA (35 foto)...
[13:32:02] [Crop Cepat] Memotong layar LCD untuk 20 foto halaman ini...
[13:32:06] [Crop Siap] 16 gambar crop LCD di halaman ini langsung tampil seketika!
[13:32:06] [1/35] Memproses: 225200000425.jpg (KARMIANTO) [Prioritas Crop Disk]
```

Urutan logis: Gate 1 kelayakan (heuristik warna/gradien/kecerahan) → deteksi dan crop LCD → OCR STAN (beberapa kali, dicek konsistensinya) → OCR nomor meter → deteksi stiker → aturan bisnis (IDPEL, jarak, status akhir).

### 1.6 Hasil yang teramati (34 foto selesai)

| Hasil | Jumlah | Contoh |
|---|---|---|
| Sesuai AI (konsisten) | 3 | ALPIANOR 4699, LESMAN 2346, RAJIBUN 4963 |
| Periksa / koreksi manual | 27 | KARMIANTO, HUSNAH, LENOTO (layar jelas "2771" tetapi tetap ragu) |
| Minta foto ulang (Gate 1 gagal) | 4 | PENDRI, MMUBIN, WAIDJIN 05 (foto stok), MUNSAI |
| Stiker tidak teridentifikasi | 3 | KRISNO, BATHIN, AYAMANTO LIPAT |

### 1.7 Celah dan peluang perbaikan

1. **OCR STAN terlalu sering ragu**, termasuk pada layar yang terbaca jelas oleh mata. Perlu pengenal digit 7-segmen khusus, bukan OCR teks umum.
2. **Lambat** (≈16 s/foto, sekuensial). Perlu batching, worker paralel, dan model ringan.
3. **Validasi bulan/tahun stiker belum ada** (diakui di UI). Stiker "AGT 2026" bisa dibaca dan dibandingkan dengan periode.
4. **Periode foto tidak dicek.** Overlay foto bertanggal Agustus 2026 sementara periode yang dipilih September 2026 — tidak ada peringatan.
5. **Kartu "Tidak Sesuai" menyesatkan.** Saat STAN cater kosong, baris yang terbaca AI dihitung "Tidak Sesuai" (terlihat 2/35 di t≈344 s). Kasus tanpa STAN cater harus dihitung "tidak ada pembanding".
6. **Rujukan jarak tidak tepat.** Semua foto berjarak 150–180 km dari satu kantor UP3, sehingga semuanya "CEK STIKER". Rujukan sebaiknya koordinat pelanggan (dari master/GIS) atau ULP terdekat.
7. **Nomor meter tidak dicocokkan.** Kolom "Idpel" di overlay kadang berisi IDPEL 12 digit (MUNSAI: 225200030861), kadang nomor meter 11 digit (ALPIANOR: 32209754046, sama dengan pelat "32 2097 5404 6"). Keduanya tidak dibandingkan dengan pelat maupun master.
8. **Foto stok/duplikat** hanya tertangkap kebetulan lewat heuristik warna. Perlu pemeriksaan duplikat (hash perseptual) dan EXIF.
9. **Alur verifikasi berbasis modal**: buka → baca → tutup → baris berikutnya. Checkbox baris ada, tetapi tidak terlihat aksi massal.
10. **Hanya Windows/localhost**, path disk ditulis manual, dialog folder native di sisi server.
11. **Tampilan**: delapan kartu identik, label serba huruf kapital, warna status sebagai satu-satunya pembeda, informasi penting (angka STAN) tampil kecil di tengah tabel.

---

## 2. Ruang lingkup versi baru

### 2.1 Paritas fitur (wajib, semua dari bagian 1)

- [ ] Import Excel `.xlsx/.xls/.csv` maks. 50 MB, validasi IDPEL/Nama, hitung baris valid.
- [ ] Periode bulan dan tahun.
- [ ] Folder foto: input path, dialog pilih folder native (mode localhost), pindai ulang, hitung JPG/JPEG/PNG.
- [ ] Format nama file `IDPEL.jpg` dan `IDPEL_tanggal.jpg`.
- [ ] Muat data: pasangkan foto ↔ baris Excel, bersihkan crop lama, laporkan yang tidak berpasangan.
- [ ] Proses AI per tahap (Cek foto, OCR STAN/nomor meter, Validasi aturan), per halaman, semua data, dengan tombol hentikan.
- [ ] Checkbox aktif/nonaktif tiap tahap.
- [ ] Log real-time + kosongkan log.
- [ ] Statistik: Sukses AI, Sesuai cater, Tidak sesuai, Total, Valid, Tidak valid, Perlu review, Belum diproses.
- [ ] Pencarian (IDPEL, nama, nomor meter) dan filter status, hasil CV, verifikasi, lokasi.
- [ ] Tabel dengan kolom setara + thumbnail foto & layar.
- [ ] Detail per baris: foto asli + overlay, potongan LCD, peta/jarak + buka Google Maps, referensi Excel vs foto lapangan, hasil AI A–H, STAN manual, keputusan Sesuai/Tidak sesuai/Rumah tutup.
- [ ] Paginasi + jumlah per halaman.
- [ ] Export Excel.
- [ ] Indikator mode, jam, pengaturan.

### 2.2 Peningkatan (fitur unggulan)

| # | Fitur | Nilai bagi pengguna |
|---|---|---|
| U1 | **Inspektor samping** menggantikan 4 modal; tabel tetap terlihat | Verifikasi tanpa putus |
| U2 | **Mode fokus** layar penuh, satu foto per layar, keyboard penuh (J/K, S/T/R) | 3–5× lebih cepat untuk antrian panjang |
| U3 | **Pembaca 7-segmen** + titik desimal + skor keyakinan per digit | Turunkan "Periksa manual" <25% |
| U4 | **Validasi stiker bulan/tahun** (baca "AGT 2026") vs periode | Menutup fitur yang belum diimplementasikan |
| U5 | **Cek periode overlay** (tanggal foto vs periode) | Tangkap foto bulan lalu |
| U6 | **Cocokkan nomor meter**: pelat (OCR) vs overlay vs master | Tangkap foto meter yang salah |
| U7 | **Deteksi duplikat/foto stok** (pHash antar-foto + EXIF) | Cegah foto daur ulang |
| U8 | **Rujukan lokasi cerdas**: koordinat pelanggan atau ULP terdekat, ambang bisa diatur | Status lokasi yang bermakna |
| U9 | **Aksi massal** pada baris terpilih (setujui semua "Sesuai AI", minta foto ulang) | Hemat klik |
| U10 | **Halaman laporan**: distribusi status, peta titik foto, rekap per lokasi/petugas | Bahan KPI dan evaluasi petugas |
| U11 | **Riwayat & audit**: siapa mengubah STAN/keputusan, kapan | Akuntabel |
| U12 | **Batch tersimpan**: buka kembali pekerjaan kemarin, tidak hilang saat refresh | Aman |
| U13 | **Pemetaan kolom Excel otomatis** + pratinjau 5 baris | Excel dari unit mana pun bisa dipakai |
| U14 | Tema terang/gelap, responsif sampai tablet | Nyaman dipakai lama |

### 2.3 Di luar lingkup (versi pertama)

- Aplikasi mobile untuk petugas lapangan (pengambilan foto).
- Integrasi langsung ke sistem korporat (AP2T/ACMT dan sejenisnya) — disiapkan lewat ekspor dan API, integrasi menyusul.
- Multi-tenant lintas UP3 di server pusat (arsitektur disiapkan, belum diaktifkan).

---

## 3. Arsitektur dan stack

### 3.1 Gambaran

```
 Browser (React SPA)                         Mesin lokal (satu proses launcher)
┌─────────────────────────────┐   HTTP    ┌──────────────────────────────────────────┐
│ Workbench · Inspektor ·     │◀────────▶│ FastAPI (REST)                            │
│ Mode fokus · Laporan        │   WS     │  ├─ Batch & import service (pandas)       │
│ TanStack Query/Table/Virtual│◀────────▶│  ├─ Job queue (asyncio + ProcessPool)     │
└─────────────────────────────┘ log,prog  │  │    └─ AI workers ×N ─┐                │
                                          │  ├─ Rules engine        │                │
                                          │  ├─ Export (openpyxl)   ▼                │
                                          │  └─ SQLite / MySQL   AI pipeline         │
                                          │                      (OpenCV, detektor,  │
                                          │                       pembaca 7-seg, OCR)│
                                          └──────────────────────────────────────────┘
                                                     │ baca langsung
                                                     ▼
                                          D:\…\FOTO  (folder foto lapangan)
                                          .\data\crops, .\data\thumbs (cache)
```

### 3.2 Pilihan stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | React + Vite + TypeScript | Ekosistem tabel/virtualisasi matang |
| Styling | Tailwind CSS + token CSS sendiri; primitif Radix (dialog, popover, tooltip) | Aksesibel tanpa terlihat "template" |
| Data & tabel | TanStack Query, TanStack Table, TanStack Virtual | 5.000+ baris tetap mulus |
| State UI | Zustand | Seleksi, filter, shortcut |
| Motion | Motion (Framer Motion) | Animasi responsif aksi, hormati reduced-motion |
| Foto | react-zoom-pan-pinch | Zoom/geser foto meter |
| Peta | MapLibre GL (online) + skema jarak SVG (offline) | Tetap jalan tanpa internet |
| Grafik | ECharts | Laporan |
| Backend | Python 3.12, FastAPI, Uvicorn, SQLModel | Satu runtime dengan AI, WebSocket bawaan |
| Database | SQLite (default localhost); MySQL/PostgreSQL opsional | Nol konfigurasi; kompatibel XAMPP bila perlu |
| Excel | pandas + openpyxl | Import/ekspor dengan format sel |
| Antrian job | asyncio + `ProcessPoolExecutor` (Redis/RQ opsional untuk mode server) | Paralel tanpa dependensi tambahan |
| Distribusi | Launcher `.exe` (PyInstaller) yang menyalakan server dan membuka browser | Pengguna cukup klik dua kali |

**Keputusan yang perlu dikonfirmasi:** aplikasi asli memakai XAMPP (PHP). Rencana ini merekomendasikan FastAPI saja (satu runtime, WebSocket bawaan, lebih mudah dibungkus). Bila tim ingin tetap di Laravel, alternatifnya: Laravel (API + auth + ekspor) + FastAPI khusus AI, dengan event via Laravel Reverb. Lihat bagian 13.

### 3.3 Struktur repositori

```
kwh-validator/
├─ apps/
│  ├─ web/                    # React SPA
│  │  ├─ src/
│  │  │  ├─ app/              # routing, providers, shortcut global
│  │  │  ├─ features/
│  │  │  │  ├─ setup/         # import Excel, folder, periode
│  │  │  │  ├─ process/       # pipeline view, progres, log
│  │  │  │  ├─ queue/         # tabel antrian, filter, aksi massal
│  │  │  │  ├─ inspector/     # panel detail + keputusan
│  │  │  │  ├─ focus/         # mode fokus
│  │  │  │  ├─ report/        # laporan & peta
│  │  │  │  └─ settings/
│  │  │  ├─ components/       # LcdReadout, StatusChip, StatusStrip, SignalBars…
│  │  │  ├─ styles/tokens.css
│  │  │  └─ lib/api.ts, ws.ts
│  │  └─ public/fonts/        # Archivo, DSEG7 (self-host, offline)
│  └─ api/                    # FastAPI
│     ├─ app/
│     │  ├─ main.py
│     │  ├─ routers/          # batches, rows, jobs, export, settings, folder
│     │  ├─ services/         # import_excel, pairing, export_xlsx, geo
│     │  ├─ jobs/             # queue, worker, events
│     │  ├─ rules/            # rules engine + konfigurasi ambang
│     │  ├─ models/           # SQLModel
│     │  └─ ws.py
│     └─ tests/
├─ ml/
│  ├─ pipeline/               # gate1, detect, crop, read_7seg, ocr_overlay, sticker, dedupe
│  ├─ models/                 # file bobot (.onnx)
│  ├─ datasets/               # skrip pelabelan & split
│  ├─ train/                  # pelatihan detektor & pembaca digit
│  └─ eval/                   # laporan akurasi per versi model
├─ launcher/                  # start.py → PyInstaller
├─ docs/
└─ plan.md
```

---

## 4. Pipeline AI v2

### 4.1 Tahapan

Setiap foto melewati tahapan berikut. Tiap tahap menulis hasil dan alasannya, sehingga Inspektor bisa menjelaskan "mengapa".

| Tahap | Masukan → keluaran | Metode | Status yang dihasilkan |
|---|---|---|---|
| G0 Baca berkas | file → metadata | EXIF (waktu, GPS, model kamera), SHA-1, pHash, ukuran | duplikat? |
| G1 Kelayakan foto | foto → layak/tidak + alasan | OpenCV: blur (varians Laplacian), kecerahan, silau, warna dominan, rasio gradien (mempertahankan aturan `LOGO_WARNA_BUKAN_LCD`, `GRADIENT_HORIZON`) + klasifikasi "meter / bukan meter" | KWH Meter `VALID` / `TIDAK LAYAK` |
| G2 Deteksi objek | foto → kotak LCD, pelat nomor, stiker, keypad | Detektor ringan (PP-PicoDet atau YOLOX, ekspor ONNX) | Potongan LCD `TERDETEKSI` |
| G3 Normalisasi LCD | kotak LCD → crop lurus | Koreksi perspektif, CLAHE, binarisasi adaptif, 3 varian augmentasi | — |
| G4 Baca STAN | 3 varian crop → angka + keyakinan per digit | Pengenal 7-segmen (CRNN + CTC kecil, dilatih pada crop LCD meter prabayar), deteksi titik desimal | `AI_CONFIDENT` / `AI_UNCERTAIN`; `CONSISTENT` / `INCONSISTENT` |
| G5 Nomor meter | kotak pelat → 11 digit | OCR digit (PaddleOCR rec ringan) | cocok/tidak dengan master & overlay |
| G6 Overlay foto | pita bawah foto → Nama, Idpel, Alamat, Lat/Lon, Tanggal | OCR teks + parser regex | data "Foto lapangan" |
| G7 Stiker | kotak stiker → ada? + bulan/tahun | Klasifikasi + OCR singkatan bulan (JAN…DES, AGT) | `ADA` / `TIDAK TERIDENTIFIKASI` + `BULAN SESUAI` / `BEDA PERIODE` |
| G8 Aturan bisnis | semua hasil → status verifikasi | Rules engine (4.3) | `SESUAI AI` / `PERIKSA / KOREKSI MANUAL` / `MINTA FOTO ULANG` |
| G9 Cadangan VLM (opsional, mati secara default) | crop LCD ragu → angka | Model visi-bahasa lokal (mis. via Ollama) | hanya untuk saran, tidak pernah otomatis "Sesuai" |

**Kecepatan.** Crop cepat untuk halaman yang sedang dilihat tetap dipertahankan (prioritas tampilan), tetapi sisa batch diproses paralel oleh N worker (default = jumlah core − 1), dengan model ONNX Runtime (CPU) atau CUDA bila tersedia. Thumbnail dan crop di-cache ke disk.

**Catatan meter prabayar.** Sebagian meter prabayar dapat menampilkan sisa kWh dengan desimal. Di foto demo, titik desimal tidak terlihat jelas (ALPIANOR dibaca 4699), jadi pembaca 7-segmen harus mampu mendeteksi titik desimal bila ada, dan aturan penulisan STAN (dengan/tanpa desimal) disamakan dengan cara cater mencatat — lihat bagian 13.

### 4.2 Model dan dataset

- **Sumber data latih:** arsip foto ULP yang sudah punya STAN cater benar (mis. `DATA_PELANGGAN_VALID.xlsx` + folder foto), minimal 1.000 foto untuk detektor dan 5.000 crop digit (augmentasi dari ±1.500 crop asli).
- **Label:** kotak `lcd`, `nameplate_no`, `sticker`, `keypad`, `meter_body` (Label Studio/CVAT); string STAN per crop; bulan/tahun stiker.
- **Pembagian:** 70/15/15 per lokasi (bukan acak per foto) agar evaluasi jujur.
- **Lisensi:** pilih detektor berlisensi Apache-2.0 (PP-PicoDet, YOLOX). Ultralytics YOLO berlisensi AGPL-3.0 — hanya dipakai bila konsekuensinya diterima.
- **Versi model** dicatat di setiap hasil (`model_versions`) agar hasil lama bisa ditelusuri.

### 4.3 Aturan bisnis (rules engine, ambang dapat diatur di Pengaturan)

| Kode | Aturan | Hasil |
|---|---|---|
| R1 | G1 gagal | Verifikasi `MINTA FOTO ULANG`, CV `TIDAK TERBACA`, alasan G1 ditampilkan |
| R2 | IDPEL nama file = IDPEL Excel | IDPEL `MATCH`; selain itu `MISMATCH` → `PERIKSA` |
| R3 | Nama overlay ≈ nama Excel (kemiripan ≥ 0,85) | info; bila jauh → peringatan |
| R4 | Nomor meter pelat/overlay = nomor meter master (bila kolom ada) | bila beda → `PERIKSA` |
| R5 | STAN: keyakinan min. digit ≥ 0,90 dan ≥ 2 dari 3 varian sama | `AI_CONFIDENT` + `CONSISTENT` |
| R6 | R5 terpenuhi, semua cek lain lolos | `SESUAI AI` |
| R7 | LCD terdeteksi tetapi R5 gagal | `PERIKSA / KOREKSI MANUAL`, alasan: "Foto layak, tetapi AI tidak dapat memastikan angka meter." |
| R8 | STAN cater ada: |STAN final − STAN cater| ≤ toleransi | `Sesuai cater` / `Tidak sesuai cater`; **STAN cater kosong → "Tanpa pembanding"** (tidak masuk Tidak sesuai) |
| R9 | Jarak foto ke rujukan > ambang (default 1,0 km) | wajib stiker `ADA`; bila tidak → `PERIKSA` |
| R10 | Bulan/tahun stiker ≠ periode | peringatan `BEDA PERIODE` |
| R11 | Tanggal overlay/EXIF di luar periode | peringatan `FOTO DI LUAR PERIODE` |
| R12 | pHash sangat mirip foto lain di batch (jarak ≤ 6) atau foto stok | `MINTA FOTO ULANG`, alasan "Foto sama dengan IDPEL …" |
| R13 | Keputusan manual | `SESUAI` / `TIDAK SESUAI` / `RUMAH TUTUP` menimpa status AI; STAN manual menjadi STAN final |

**Definisi statistik (diselaraskan dengan aplikasi asli):**
- Sukses AI = jumlah `SESUAI AI` / total.
- Valid = `SESUAI AI` + keputusan manual `SESUAI`.
- Tidak valid = keputusan manual `TIDAK SESUAI`.
- Perlu review = `PERIKSA / KOREKSI MANUAL` + `MINTA FOTO ULANG` yang belum diputuskan.
- Belum diproses = `MENUNGGU AI` + `MEMPROSES`.
- Rumah tutup ditampilkan tersendiri (tidak ada di asli, ditambahkan).

### 4.4 Evaluasi

- Skrip `ml/eval` menghasilkan laporan per versi model: akurasi STAN tepat, akurasi per digit, tingkat "ragu", false-accept (AI yakin tetapi salah — **target < 0,5%**, ini metrik paling penting karena baris "Sesuai AI" mungkin tidak dilihat manusia).
- Dataset uji emas dibekukan; setiap perubahan model wajib lolos regresi sebelum dirilis.

---

## 5. Model data

| Tabel | Kolom utama |
|---|---|
| `batch` | id, nama, unit (ULP/UP3), bulan, tahun, excel_nama, folder_path, format_nama_file, dibuat_oleh, dibuat_pada, status |
| `pelanggan` | id, batch_id, idpel, nama, nomor_meter, alamat, lokasi/rbm, petugas, stan_cater, lat_ref, lon_ref, baris_excel (JSON baris asli) |
| `foto` | id, pelanggan_id, path, nama_file, sha1, phash, exif_waktu, exif_lat, exif_lon, lebar, tinggi, thumb_path |
| `hasil_ai` | id, foto_id, run_id, gate1_status, gate1_alasan, metrik_kualitas (JSON), bbox (JSON), crop_path, stan_ai, stan_keyakinan, stan_kandidat (JSON), status_ai, konsistensi, kualitas_cv, nomor_meter_ocr, overlay (JSON: nama, idpel, alamat, lat, lon, tanggal), stiker_status, stiker_bulan, stiker_tahun, jarak_km, rujukan_id, durasi_ms, model_versions (JSON), dibuat_pada |
| `verifikasi` | id, pelanggan_id, status_verifikasi, stan_manual, stan_final, keputusan, catatan, verifikator, waktu |
| `audit_log` | id, entitas, entitas_id, aksi, sebelum (JSON), sesudah (JSON), oleh, waktu |
| `kantor_rujukan` | id, nama, level (UP3/ULP), lat, lon |
| `pengaturan` | kunci, nilai (JSON) — ambang, worker, tahap aktif, tema |
| `job` | id, batch_id, cakupan (halaman/semua/terpilih), tahap (JSON), status, progres, mulai, selesai |

---

## 6. API dan event real-time

**REST**

| Metode | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/batches` | Buat batch (periode, unit) |
| GET | `/api/batches` / `/api/batches/{id}` | Daftar dan buka kembali batch |
| POST | `/api/batches/{id}/excel` | Unggah + validasi Excel, kembalikan pratinjau dan usulan pemetaan kolom |
| PUT | `/api/batches/{id}/columns` | Simpan pemetaan kolom |
| POST | `/api/folder/browse` | Buka dialog folder native (mode localhost) → path |
| PUT | `/api/batches/{id}/folder` | Set path + format nama file |
| GET | `/api/batches/{id}/folder/scan` | Hitung JPG/JPEG/PNG, deteksi nama file tak dikenal |
| POST | `/api/batches/{id}/load` | Pasangkan foto ↔ baris, bersihkan crop lama |
| POST | `/api/batches/{id}/jobs` | Mulai proses `{cakupan, ids?, tahap[]}` |
| POST | `/api/jobs/{id}/stop` | Hentikan |
| GET | `/api/batches/{id}/rows` | Daftar baris dengan filter, urut, kursor halaman |
| GET | `/api/rows/{id}` | Detail lengkap untuk Inspektor |
| GET | `/api/rows/{id}/photo?size=thumb|full` · `/crop` | Gambar |
| PATCH | `/api/rows/{id}/verification` | STAN manual, keputusan, catatan |
| POST | `/api/batches/{id}/bulk-verify` | Aksi massal |
| GET | `/api/batches/{id}/stats` | Statistik |
| GET | `/api/batches/{id}/export.xlsx` | Ekspor (kolom: lihat Lampiran A) |
| GET/PUT | `/api/settings` | Pengaturan |
| GET | `/api/health` | Status mesin AI (CPU/GPU, model termuat) |

**WebSocket** `/ws/batches/{id}`

| Event | Payload |
|---|---|
| `log` | `{waktu, level, tag, pesan}` |
| `progress` | `{job_id, selesai, total, persen, per_detik, eta_detik}` |
| `row.stage` | `{row_id, tahap, status}` — untuk animasi tahap di tabel/Inspektor |
| `row.updated` | ringkasan baris terbaru |
| `stats.updated` | statistik terbaru |
| `job.finished` | ringkasan akhir |

---

## 7. Desain UI — konsep "Layar Meter"

### 7.1 Konsep

Subjek aplikasi ini adalah satu benda yang sangat spesifik: kWh meter prabayar di dinding rumah pelanggan — casing plastik abu keputihan, layar LCD hijau pucat dengan angka 7-segmen gelap, indikator sinyal bertingkat, keypad, dan stiker petugas. Desainnya meminjam bahasa benda itu, tetapi hanya di satu tempat: **angka STAN selalu tampil sebagai layar LCD 7-segmen sungguhan**. Itulah elemen yang diingat orang. Selebihnya adalah meja kerja yang tenang dan disiplin, karena penggunanya verifikator yang menatap ratusan foto per hari.

Audiens: verifikator dan supervisor di ULP/UP3. Tugas utama layar: **memilah foto secepat mungkin dan yakin akan setiap keputusan**.

### 7.2 Warna

| Nama | Hex | Peran |
|---|---|---|
| Casing | `#ECEEE9` | Latar aplikasi (terang) — abu kehijauan seperti casing meter, bukan krem |
| Tinta Gardu | `#13233A` | Teks utama, pita header |
| Layar LCD | `#BFCBA0` | Latar komponen pembacaan STAN |
| Segmen | `#1E2A1C` | Angka 7-segmen di atas Layar LCD |
| Petir | `#FFC21A` | Aksi utama dan cincin fokus — dipakai hemat |
| Biru Jaringan | `#1F5FD1` | Tautan, seleksi baris, info |
| Panggung Foto | `#0F1620` | Latar area foto di Inspektor/mode fokus (foto tampak lebih jelas di latar gelap) |

Warna status (selalu disertai ikon dan teks, tidak pernah warna saja):

| Status | Hex | Ikon |
|---|---|---|
| Sesuai / Sesuai AI | `#1E9E5A` | centang |
| Periksa manual | `#D9822B` | kaca pembesar |
| Minta foto ulang | `#D6453D` | kamera dengan panah putar |
| Rumah tutup | `#7A5AE0` | rumah |
| Menunggu / diproses | `#8A94A6` | jam / bar berjalan |

```css
:root {
  --casing: #ECEEE9;  --surface: #F7F8F5;  --line: #D5D9D0;
  --ink: #13233A;     --ink-2: #4A586B;
  --lcd: #BFCBA0;     --lcd-ink: #1E2A1C;  --lcd-ghost: rgb(30 42 28 / .08);
  --petir: #FFC21A;   --link: #1F5FD1;     --stage: #0F1620;
  --ok: #1E9E5A; --check: #D9822B; --retake: #D6453D; --closed: #7A5AE0; --wait: #8A94A6;
  --r-sm: 4px; --r-md: 8px; --r-lg: 14px;   /* radius berbeda menurut hierarki */
}
:root[data-theme="dark"] {
  --casing: #0E1826;  --surface: #142236;  --line: #23344C;
  --ink: #E6EAF0;     --ink-2: #9AA7B8;
  --lcd: #A9B78C;     --lcd-ink: #141D13;  /* LCD tetap terang: layar asli memang terang */
}
```

### 7.3 Tipografi

- **Archivo** (variabel, sumbu lebar 62–125, lisensi OFL) — satu keluarga untuk seluruh antarmuka, dengan **sumbu lebar dipakai untuk mengode kepadatan**:
  - Judul: lebar 112, tebal 650 — kesan pelat nama peralatan listrik.
  - Teks: lebar 100, tebal 400.
  - Tabel padat: lebar 88, angka `tabular-nums` agar IDPEL rata.
- **DSEG7 Classic** (OFL) — **hanya** untuk angka STAN dan penghitung header. Segmen mati ditampilkan samar (`--lcd-ghost`) di belakang angka, persis seperti LCD asli.
- Skala (rasio 1,25): 12 / 14 (tabel) / 16 (teks) / 20 / 25 / 31 / 39 px. Tinggi baris teks 1,5; judul 1,15.
- Huruf kalimat untuk semua label dan status (bukan huruf kapital semua). Kode teknis (`AI_UNCERTAIN`) hanya di tooltip dan ekspor.
- Font disimpan lokal di `public/fonts` agar jalan offline.

### 7.4 Tata letak

**Konsep:** meja kerja tiga zona — alur kerja di kiri (urutan nyata, jadi pantas bernomor), antrian di tengah, Inspektor di kanan. Konten rata kiri; angka rata kanan.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ KWH AI Validator  [September 2026 ▾] [ULP Samboja ▾] ╔══════════════════╗ [Atur] │
│                                                      ║ ▂▄▆█   027 / 035 ║        │
│                                                      ╚══════════════════╝        │
├────────────┬──────────────────────────────────────────────┬──────────────────────┤
│ ① Data     │ ████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░               │ 225200007639         │
│   35 baris │ Sesuai 3  Periksa 27  Ulang 4  Belum 1       │ ALPIANOR             │
│ ② Foto     │ ──────────────────────────────────────────── │ ┌──────────────────┐ │
│   35 JPG   │ [/ Cari IDPEL, nama, nomor meter]            │ │ foto di          │ │
│ ③ Proses   │ [Status ▾] [CV ▾] [Verifikasi ▾] [Lokasi ▾]  │ │ panggung gelap   │ │
│   34/35    │ ──────────────────────────────────────────── │ │ + kotak LCD      │ │
│ ④ Periksa  │ ☐ 225200000425 KARMIANTO  ✓✓●  ----  Periksa │ └──────────────────┘ │
│   27 antri │ ☐ 225200007639 ALPIANOR   ✓✓●  4699  Sesuai  │ ╔══════════════════╗ │
│ ⑤ Ekspor   │ ☐ 225200022332 PENDRI     ✕–○  ----  Ulang   │ ║ ▂▄▆█ kWh   4699  ║ │
│            │ ☐ …                                          │ ╚══════════════════╝ │
│ Log proses │                                              │ Pemeriksaan …        │
│ (laci)     │                                              │ [S] [T] [R]          │
└────────────┴──────────────────────────────────────────────┴──────────────────────┘
```

- **Pita header (Tinta Gardu):** nama aplikasi, periode dan unit sebagai pemilih, **penghitung LCD** (sudah diproses / total, dengan bar sinyal yang mengisi sesuai throughput), indikator mesin AI ("Mesin AI siap — GPU" / "CPU"), pengaturan. Jam besar di asli dihapus — jam sistem sudah ada di taskbar.
- **Rel alur (kiri, 200 px):** lima langkah berurutan dengan ringkasan di bawah tiap langkah; langkah yang belum siap redup dan menjelaskan apa yang kurang. Log proses menjadi laci di bawah rel, bukan panel permanen.
- **Strip status (tengah atas):** satu bar bertumpuk proporsional menggantikan 8 kartu. Tiap segmen bisa diklik sebagai filter. Angka "Sesuai cater / Tidak sesuai cater / Tanpa pembanding" muncul sebagai baris kedua bila kolom STAN cater ada.
- **Antrian (tengah):** tabel virtual, baris 56 px, kolom ringkas:
  `☐ | IDPEL | Nama | Cek (meter, IDPEL, stiker sebagai 3 ikon) | STAN cater | STAN AI (mini-LCD) | Verifikasi (chip) | Foto + layar (thumb) `
  Kolom AKSI dihapus — klik baris membuka Inspektor; menu titik tiga muncul saat hover/fokus.
- **Inspektor (kanan, 420 px, bisa dilebarkan):** lihat 7.5.
- **≥1600 px:** tiga zona. **1280–1599 px:** rel menyusut jadi ikon. **<1280 px / tablet:** Inspektor menjadi lembar dari bawah.

Alternatif yang dipertimbangkan: mempertahankan susunan asli (3 panel di atas, tabel di bawah, detail di modal). Ditolak karena panel pengaturan memakan setengah layar setelah sekali pakai, dan modal memutus alur verifikasi.

### 7.5 Spesifikasi layar

**A. Persiapan (langkah ①–②)** — tampil penuh di area tengah saat batch baru, lalu menyusut menjadi ringkasan di rel.
- Zona seret-lepas Excel; setelah dibaca: pratinjau 5 baris, pemetaan kolom otomatis (IDPEL, Nama, Nomor meter, STAN cater, Lokasi, Lat/Lon) dengan dropdown koreksi, hitungan "35 baris valid, 0 bermasalah" + daftar baris bermasalah yang bisa diunduh.
- Folder foto: tombol "Pilih folder" (dialog native di localhost; `showDirectoryPicker` di mode server), path bisa ditempel, chip hitungan JPG/JPEG/PNG, daftar foto tanpa pasangan dan baris tanpa foto.
- Format nama file sebagai dua pilihan berlabel contoh nyata: `225200000425.jpg` / `225200000425_20260915.jpg`.
- Tombol utama: **Muat dan pasangkan** → toast "35 foto dipasangkan".

**B. Proses (langkah ③)**
```
 Kelayakan foto ──▶ Potong LCD ──▶ Baca STAN ──▶ Nomor meter ──▶ Stiker ──▶ Aturan
   30 layak           30 terpotong    3 yakin        28 cocok       27 ada      selesai
   4 ditolak                          27 ragu
```
- Tiap simpul tahap adalah sakelar (pengganti 4 checkbox + 3 tombol tahap asli); angka di bawahnya hidup.
- Tombol: **Proses halaman ini**, **Proses semua (35)**, **Proses yang dipilih**; saat berjalan berubah menjadi **Hentikan** dengan estimasi sisa waktu ("±1 menit lagi, 2,4 foto/detik").
- Laci log: monospasi kecil boleh di sini (konteks konsol), tag berwarna, filter level, tombol **Kosongkan log**, **Salin**.

**C. Antrian (langkah ④)** — lihat 7.4. Tambahan:
- Seleksi banyak (Shift-klik, Ctrl-A) memunculkan bilah aksi massal: "Setujui 3 Sesuai AI", "Minta foto ulang", "Ekspor terpilih".
- Baris yang sedang diproses menampilkan garis tahap tipis yang berjalan di kolom Foto.
- Thumbnail layar menampilkan crop LCD asli; sebelum ada crop, kotak kosong bergaris (bukan ikon jam pasir).

**D. Inspektor** (menggabungkan modal Validasi PLN, Pengecekan Foto, Slice LCD, Foto Asli)
```
┌ 225200007639  ALPIANOR ───────────────── ✕ ┐
│ ┌────────────────────────────────────────┐ │
│ │ foto, panggung gelap, zoom & geser     │ │
│ │     ┌───────┐  ← kotak LCD (tombol B)  │ │
│ │     └───────┘                          │ │
│ └────────────────────────────────────────┘ │
│ [Kotak deteksi] [Putar] [1:1] [Overlay]    │
│ ╔════════════════════════════════════════╗ │
│ ║ ▂▄▆█ kWh                     4699      ║ │  ← DSEG7, segmen mati samar
│ ╚════════════════════════════════════════╝ │
│ Keyakinan 99,8%   3 dari 3 bacaan sama     │
│ Potongan asli ▸ [crop LCD kecil]           │
│                                            │
│ Pemeriksaan                                │
│ ✓ Foto layak meter                         │
│ ✓ IDPEL cocok (Excel = nama file)          │
│ ✓ Nomor meter cocok 32209754046            │
│ ● Stiker ada, Agustus 2026                 │
│   ⚠ beda dengan periode September 2026     │
│ ⚠ Lokasi jauh dari rujukan   [Buka peta]   │
│                                            │
│ Referensi ↔ Lapangan (beda disorot)        │
│ Nama      ALPIANOR      ALPIANOR           │
│ Alamat    —             Bararawa, …        │
│ Tanggal   Sep 2026      15 Agu 2026 07:51  │
│                                            │
│ STAN final [ 4699 ]   (E untuk ubah)       │
│ [S Sesuai] [T Tidak sesuai]                │
│ [R Rumah tutup]                            │
│ Catatan (opsional)                         │
│ J ‹ Sebelumnya            Berikutnya › K   │
└────────────────────────────────────────────┘
```
- Keputusan langsung tersimpan dan Inspektor pindah ke baris berikutnya yang perlu review (bisa dimatikan).
- Bila Gate 1 gagal, area LCD diganti kartu alasan yang dapat dibaca manusia ("Layar meter tidak terlihat atau mati") dengan detail teknis yang bisa dibuka.
- Peta: MapLibre bila online, skema jarak SVG bila offline (meneruskan gagasan "Peta Geodesic" asli), tombol **Buka di Google Maps**.

**E. Mode fokus** (tombol F)
- Layar penuh Panggung Foto; foto besar di kiri, LCD + pemeriksaan + keputusan di kanan; antrian mini di bawah sebagai filmstrip.
- Hanya baris "Perlu review"; penghitung "12 tersisa".
- Selesai antrian → layar ringkas: "Antrian review kosong. 27 keputusan tersimpan." + tombol **Ekspor Excel**.

**F. Laporan (langkah ⑤)**
- Ringkasan batch, distribusi status (bar bertumpuk), tingkat review per lokasi/petugas, peta titik foto (diwarnai status), daftar foto duplikat.
- **Ekspor Excel** (format kompatibel asli + kolom tambahan), **Ekspor terpilih**, cetak PDF ringkasan.

**G. Pengaturan**
- Ambang: kelayakan foto, keyakinan STAN, jumlah bacaan konsisten, toleransi cater, jarak lokasi, kemiripan duplikat.
- Kantor rujukan (tabel UP3/ULP + koordinat, bisa impor CSV).
- Mesin AI: jumlah worker, CPU/GPU, versi model, cadangan VLM (mati secara default).
- Tampilan: tema, kepadatan tabel, pindah otomatis setelah keputusan.

### 7.6 Komponen kunci

| Komponen | Spesifikasi |
|---|---|
| `LcdReadout` | Latar `--lcd`, digit DSEG7 `--lcd-ink`, segmen mati `--lcd-ghost`, ikon sinyal + "kWh" kecil di kiri; ukuran `sm` (tabel, 18 px), `md` (header), `lg` (Inspektor, 44 px). Digit dengan keyakinan < ambang diberi garis bawah oranye per digit. Saat kosong menampilkan `----`. |
| `StatusChip` | Ikon + teks huruf kalimat, latar 12% warna status, radius `--r-sm`. Kontras teks ≥ 4.5:1. |
| `StatusStrip` | Bar bertumpuk 10 px + legenda angka; segmen klik = filter; animasi lebar segmen saat statistik berubah. |
| `CheckTrio` | Tiga ikon meter/IDPEL/stiker di tabel; tooltip berisi alasan. |
| `PipelineView` | Simpul tahap terhubung garis; simpul = sakelar + angka hidup. |
| `SignalBars` | Empat bar seperti indikator meter; mengisi sesuai throughput proses. |
| `PhotoStage` | Zoom/geser, lapisan kotak deteksi, sakelar overlay, putar 90°. |

### 7.7 Gerak (motion)

- **Satu momen khas:** saat AI selesai membaca sebuah baris yang sedang dibuka, garis pindai melintas di foto, kotak LCD "mengunci" pada posisinya, lalu digit di `LcdReadout` menyala segmen demi segmen (±400 ms). Ini menjawab peristiwa nyata, bukan dekorasi.
- Selebihnya gerak hanya sebagai respons aksi: Inspektor meluncur masuk, chip berganti status dengan transisi warna 150 ms, baris yang baru diputuskan berkedip lembut sekali.
- Tidak ada animasi masuk per kartu/section.
- `prefers-reduced-motion`: semua animasi diganti perubahan instan.

### 7.8 Bahasa antarmuka (pengganti label lama)

| Label asli | Label baru | Alasan |
|---|---|---|
| PERIKSA / KOREKSI MANUAL | Periksa manual | Ringkas, huruf kalimat |
| SESUAI AI | Sesuai (AI) | Membedakan dari keputusan manusia |
| MINTA FOTO ULANG | Minta foto ulang | — |
| TIDAK TERBACA | Layar tak terbaca | Jelas apa yang tak terbaca |
| AI_UNCERTAIN / AI_CONFIDENT | AI ragu / AI yakin | Kode teknis ke tooltip & ekspor |
| CEK STIKER (> 1.0 km) | Lokasi jauh — cek stiker | Menjelaskan sebab dan tindakan |
| Slice Layar LCD Meteran (Crop AI) | Potongan layar LCD | Bahasa pengguna |
| Peta Geodesic & Titik Koordinat | Lokasi foto | — |
| Koreksi Cepat Verifikator | Keputusan | — |
| LOG AKTIVITAS INFERENSI AI (REAL-TIME) | Log proses | — |
| Bersihkan | Kosongkan log | Kata kerja spesifik |
| Muat Data | Muat dan pasangkan | Menjelaskan yang terjadi |
| Proses Semua Data | Proses semua (35) | Menunjukkan cakupan |
| Stop | Hentikan | Bahasa Indonesia konsisten |
| "Silakan pilih Excel Master yang valid, pilih Folder Foto, lalu klik Muat Data." | "Mulai dengan file Excel pelanggan. Foto dipasangkan setelah folder dipilih." + tombol **Pilih file Excel** | Keadaan kosong mengajak bertindak |

Konsistensi: tombol **Proses semua** → toast "Pemrosesan dimulai" → selesai "35 foto selesai diproses". Pesan galat menyebut apa yang salah dan cara memperbaikinya, mis. "Kolom IDPEL tidak ditemukan. Pilih kolom yang berisi IDPEL di pemetaan kolom."

### 7.9 Aksesibilitas dan pintasan keyboard

- Kontras AA di kedua tema; status tidak pernah hanya warna.
- Cincin fokus 2 px Petir + garis luar 1 px Tinta Gardu (terlihat di latar terang dan gelap).
- Seluruh alur bisa tanpa mouse.

| Tombol | Aksi |
|---|---|
| `/` | Fokus ke pencarian |
| `J` / `K` atau ↓ / ↑ | Baris berikutnya / sebelumnya |
| `Enter` | Buka Inspektor |
| `S` / `T` / `R` | Sesuai / Tidak sesuai / Rumah tutup |
| `E` | Ubah STAN final |
| `B` | Tampilkan/sembunyikan kotak deteksi |
| `Z` | Zoom 1:1 |
| `F` | Mode fokus |
| `Esc` | Tutup Inspektor / keluar mode fokus |
| `?` | Daftar pintasan |

### 7.10 Catatan review desain

Rencana awal diuji terhadap pola "default" yang sering muncul pada dashboard serupa, lalu direvisi:
- **Delapan kartu statistik identik → satu strip status.** Kartu seragam adalah pola template; strip proporsional lebih cepat dibaca dan langsung berfungsi sebagai filter.
- **Tema gelap biru dongker penuh dengan aksen neon → latar terang "Casing" dengan panggung foto gelap.** Gelap penuh adalah pilihan default; yang benar-benar butuh gelap hanya area foto.
- **Font monospasi untuk IDPEL → Archivo dengan angka tabular.** Monospasi hanya di laci log, tempat ia memang bermakna.
- **Label huruf kapital di setiap chip → huruf kalimat + ikon.**
- Keberanian visual dihabiskan di satu tempat: `LcdReadout`. Semua elemen lain sengaja tenang.

---

## 8. Roadmap

Estimasi untuk tim 2 orang (1 frontend, 1 backend/ML). Total ±9–10 minggu.

| Fase | Durasi | Tugas utama | Kriteria selesai |
|---|---|---|---|
| **0. Persiapan data** | 1 minggu | Kumpulkan foto berlabel STAN dari arsip ULP; sepakati kolom Excel master; label kotak LCD/pelat/stiker untuk ±1.000 foto; konfirmasi aturan desimal STAN | Dataset terbagi 70/15/15 per lokasi; dokumen format Excel disetujui |
| **1. Fondasi** | 1,5 minggu | Repo monorepo, FastAPI + SQLite, model data, WebSocket, React + token desain, font lokal, `LcdReadout`, `StatusChip`, tata letak tiga zona | Halaman kosong berjalan offline; komponen kunci ada di Storybook |
| **2. Paritas fitur** | 2 minggu | Import + pemetaan kolom, folder + dialog native, pasangkan, tabel virtual, filter, Inspektor dengan data mock AI, keputusan manual, ekspor Excel, statistik | Semua item 2.1 tercentang dengan pipeline AI tiruan |
| **3. Pipeline AI v2** (paralel dengan fase 2) | 3 minggu | Gate 1, detektor ONNX, normalisasi LCD, pembaca 7-segmen, OCR overlay & nomor meter, stiker, rules engine, worker paralel, laporan evaluasi | Akurasi STAN ≥95%, false-accept <0,5%, ≤3 s/foto CPU pada dataset uji |
| **4. Fitur unggulan** | 2 minggu | Mode fokus, aksi massal, validasi stiker & periode, duplikat, rujukan lokasi cerdas, laporan + peta, audit log, batch tersimpan | Item U1–U14 berfungsi; demo end-to-end 35 foto |
| **5. QA, paket, uji pengguna** | 1 minggu | E2E Playwright, uji 5.000 baris, launcher `.exe`, panduan singkat, UAT dengan 2–3 verifikator ULP | Verifikator menyelesaikan 35 foto tanpa bantuan; temuan UAT ditutup |

Urutan ini sengaja menaruh paritas fitur dengan AI tiruan lebih dulu, supaya tampilan dan alur bisa diuji pengguna sementara model dilatih.

---

## 9. Pengujian dan QA

- **Unit (backend):** rules engine (setiap aturan R1–R13 punya kasus uji), parser overlay, pemasangan nama file, ekspor.
- **Regresi model:** dataset emas beku; CI gagal bila akurasi turun >1 poin atau false-accept naik.
- **E2E (Playwright):** import → folder → muat → proses → verifikasi via keyboard → ekspor; dijalankan dengan Chromium bawaan.
- **Visual:** tangkapan layar per komponen di kedua tema.
- **Kinerja:** 5.000 baris tabel ≥55 fps saat gulir; proses 500 foto tanpa kebocoran memori.
- **Aksesibilitas:** axe-core di CI, uji navigasi keyboard manual.
- **Data uji:** set demo 35 foto dari video (termasuk kasus foto stok WAIDJIN 05, layar mati PENDRI/MMUBIN, stiker tak teridentifikasi KRISNO/BATHIN).

---

## 10. Deployment dan operasional

**Mode localhost (default, sama seperti asli)**
- Satu launcher: `KWH-AI-Validator.exe` → menyalakan FastAPI di `127.0.0.1:8000`, membuka browser, ikon di system tray dengan menu "Buka" dan "Matikan".
- Data di `%LOCALAPPDATA%\KWHValidator\` (database, cache crop/thumbnail, log).
- Persyaratan minimum: Windows 10 64-bit, RAM 8 GB, CPU 4 core; GPU NVIDIA opsional.

**Mode server (opsional, untuk UP3)**
- Docker Compose: api + web (static) + PostgreSQL + Redis (antrian) + worker GPU.
- Login (akun lokal atau SSO bila tersedia), peran: verifikator, supervisor, admin.
- Folder foto dari share jaringan atau unggahan.

**Pembaruan model** tanpa memasang ulang aplikasi: file `.onnx` + `manifest.json` di folder model, dipilih di Pengaturan.

---

## 11. Keamanan dan privasi data

- Data berisi nama, IDPEL, alamat, dan koordinat rumah pelanggan → diperlakukan sebagai data pribadi (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi).
- Default: semua pemrosesan lokal, tidak ada unggahan ke internet. Cadangan VLM berbasis cloud, bila suatu saat dipakai, harus opsi eksplisit dan tercatat.
- Server hanya mendengarkan `127.0.0.1` di mode localhost.
- Audit log tidak bisa diubah dari UI.
- Ekspor memberi tanda waktu dan nama pengekspor di metadata file.

---

## 12. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data latih berlabel kurang | Akurasi STAN tidak tercapai | Mulai fase 0 lebih awal; pakai STAN cater historis sebagai label; augmentasi sintetis digit 7-segmen |
| Variasi merek meter (Itron, Hexing, dll.) | Detektor gagal pada merek tertentu | Stratifikasi dataset per merek; metrik per merek di laporan evaluasi |
| AI yakin tetapi salah | Data salah lolos tanpa dilihat | Ambang ketat, false-accept sebagai metrik utama, sampling acak 5% "Sesuai AI" untuk dicek manusia |
| Format Excel berbeda antarunit | Import gagal | Pemetaan kolom otomatis + manual, templat Excel resmi |
| PC kantor lemah | Proses lambat | Model ONNX kecil, worker bisa diatur, proses di latar belakang |
| Ketergantungan internet (peta, font) | Fitur rusak saat offline | Semua aset lokal; peta jatuh ke skema SVG |
| Lisensi model (AGPL) | Masalah distribusi | Pakai detektor Apache-2.0 |

---

## 13. Pertanyaan terbuka (perlu keputusan sebelum fase 1)

1. **Stack backend:** FastAPI saja (rekomendasi) atau tetap Laravel/XAMPP + FastAPI untuk AI?
2. **Penulisan STAN:** apakah STAN dicatat dengan desimal (mis. 46.99) atau tanpa (4699)? Bagaimana pembulatan dibanding STAN cater?
3. **Kolom Excel master resmi:** apakah tersedia nomor meter, STAN cater, koordinat pelanggan, petugas, kode RBM?
4. **Arti "periode":** bulan pengambilan foto atau bulan pelaporan? (menentukan aturan R10–R11)
5. **Kode stiker** "LPB AMB AGT 2026": apa arti setiap bagian, dan apakah kode petugas/unit perlu divalidasi juga?
6. **Rujukan lokasi:** apakah ada koordinat pelanggan dari GIS/master, atau cukup ULP terdekat?
7. **Pengguna:** satu verifikator per PC, atau beberapa verifikator berbagi satu batch (butuh mode server)?
8. **Nama dan identitas:** tetap "KWH AI Validator" atau nama baru; perlu logo PLN sesuai pedoman identitas korporat?

---

## Lampiran A — Format Excel

**Masukan (master)**

| Kolom | Wajib | Contoh |
|---|---|---|
| IDPEL | ya | 225200000425 |
| NAMA | ya | KARMIANTO |
| NOMOR_METER | disarankan | 32210397611 |
| STAN_CATER | disarankan | 4699 |
| ALAMAT / LOKASI / RBM | opsional | Kuala Kapuas |
| LAT, LON | opsional | −1.562742, 115.159593 |
| PETUGAS | opsional | AMB |

**Keluaran (ekspor)** — kolom asli dipertahankan, ditambah:
`NO, IDPEL, NAMA, VALIDASI_KWH, VALIDASI_IDPEL, STIKER, STIKER_BULAN, STAN_CATER, STAN_AI, KEYAKINAN_AI, STAN_MANUAL, STAN_FINAL, STATUS_AI, KONSISTENSI, KUALITAS_CV, STATUS_VERIFIKASI, KEPUTUSAN, ALASAN, NOMOR_METER_OCR, NAMA_OVERLAY, ALAMAT_FOTO, LAT_FOTO, LON_FOTO, TANGGAL_FOTO, JARAK_KM, KANTOR_RUJUKAN, DUPLIKAT_DENGAN, VERIFIKATOR, WAKTU_VERIFIKASI, FILE_FOTO`
Sel status diberi warna sesuai palet; baris judul dibekukan; filter otomatis aktif.

## Lampiran B — Contoh log versi baru

```
09:12:03  Excel     DATA_PELANGGAN_TERBACA_100.xlsx dibaca: 35 baris valid, 0 bermasalah
09:12:20  Folder    D:\PLN\DEMO-KWHAI\DEMO_VALID_82\TERBACA_100 — 35 JPG
09:12:22  Pasangan  35 foto dipasangkan, 0 foto tanpa baris, 0 baris tanpa foto
09:12:30  Proses    Mulai: 35 foto, 7 worker, CPU
09:12:31  Crop      Halaman 1: 20 potongan LCD siap
09:12:44  Selesai   35 foto dalam 14 detik (2,5 foto/detik) — 26 sesuai AI, 6 periksa manual, 3 minta foto ulang
```
(angka hasil di contoh ini ilustrasi target, bukan hasil uji)

## Lampiran C — Frame referensi dari video

| Waktu | Isi |
|---|---|
| 0:02 | Dashboard kosong (3 panel, statistik, tabel kosong) |
| 0:06 | Dialog file: struktur folder demo |
| 0:14–0:18 | Modal folder + dialog "Browse For Folder" |
| 0:34–0:36 | Data termuat, log pasangan, tabel "Menunggu AI" |
| 0:38 | Modal Validasi PLN (belum diproses) |
| 0:42 | Modal Pengecekan Foto Meter (sebelum AI) |
| 1:04–1:14 | Log proses semua data, baris "Memproses" |
| 1:30 | Detail setelah AI: AI_UNCERTAIN, INCONSISTENT |
| 2:02 | Slice LCD "Berhasil dipotong" |
| 2:32–2:36 | Foto asli ALPIANOR + slice "Terbaca 4699 (99.8%)" |
| 2:48 | Detail LESMAN: AI_CONFIDENT, CONSISTENT, Sesuai AI |
| 4:04 | Paginasi halaman 1 |
| 4:18 | Slice LENOTO "LCD terdeteksi (perlu verifikasi)" |
| 5:44 | Statistik: Sukses AI 2/35, Tidak sesuai 2/35 |
| 6:44 | Slice PENDRI "Tidak layak / Gagal gate 1" |
| 7:24 | Detail MMUBIN: Gate 1 layar mati, Minta foto ulang |
| 7:44–8:20 | WAIDJIN 05: foto stok, LOGO_WARNA_BUKAN_LCD |
| 9:50 | MUNSAI: GRADIENT_HORIZON |
| 9:58 | Halaman 2, baris 35 masih diproses |
