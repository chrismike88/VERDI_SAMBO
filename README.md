# VERDI SAMBO — Verifikasi kWh Meter ULP Samboja

Dashboard web untuk memverifikasi foto lapangan kWh meter prabayar secara massal: mencocokkan foto dengan data pelanggan dari Excel, memotong layar LCD, membaca angka STAN dengan pembaca 7-segmen, memeriksa kelayakan foto, IDPEL, stiker petugas, periode, lokasi, dan foto duplikat, lalu memberi ruang bagi verifikator untuk memutuskan dan mengekspor hasilnya ke Excel.

Fungsinya mengikuti rencana `plan.md` (KWH AI Validator versi baru). Cara distribusinya mengikuti `PLAN.MD`: aplikasi dapat disajikan sebagai **Google Apps Script Web App** (HTML Service). Semua pemrosesan berjalan **di browser pengguna**, jadi foto dan data pelanggan tidak dikirim ke server mana pun.

## Menjalankan

| Cara | Langkah |
|---|---|
| Lokal (disarankan) | `npm run serve` lalu buka `http://localhost:8080` |
| Satu berkas, offline | `npm run build`, lalu buka `dist/verdi-sambo.html` dengan klik ganda |
| Google Apps Script | `npm run build`, lalu `clasp push` dari folder `gas/` (atau salin `Code.gs`, `Index.html`, `appsscript.json` ke proyek Apps Script). Setelah itu pilih **Deploy → New deployment → Web app**. |

Tombol **Coba data demo** (atau `?demo` di URL) membuat 36 pelanggan fiktif wilayah Samboja beserta foto meter sintetis. Data demo itu sengaja berisi kasus sulit: layar mati, foto buram, foto stok, foto gelap, silau, foto miring, duplikat, stiker hilang, lokasi jauh, foto bulan lalu, dan STAN cater yang berbeda atau kosong. Alur demo memakai jalur yang sama dengan data nyata: Excel dibaca, foto dipasangkan, lalu AI dijalankan.

## Fitur

**Paritas dengan aplikasi asli**
- Import Excel `.xlsx/.xls/.csv` (maks. 50 MB) dengan validasi IDPEL dan Nama, **pemetaan kolom otomatis**, pratinjau 5 baris, dan daftar baris bermasalah yang bisa diunduh.
- Periode bulan dan tahun; folder foto lewat dialog folder, pilih berkas, atau seret-lepas; hitungan JPG/JPEG/PNG; format nama file `IDPEL.jpg` atau `IDPEL_tanggal.jpg`.
- **Muat dan pasangkan** foto ke baris Excel, disertai laporan foto tanpa baris dan baris tanpa foto.
- Proses AI per tahap (bisa dinyalakan/dimatikan): proses halaman ini, proses semua, atau proses yang dipilih. Pemrosesan bisa dihentikan dan menampilkan estimasi waktu sisa. Log ditampilkan real-time dan bisa disalin atau dikosongkan.
- Statistik: Sukses AI, Valid, Tidak valid, Perlu review, Belum diproses, serta Sesuai cater, Tidak sesuai cater, dan Tanpa pembanding.
- Pencarian dan filter: status, hasil CV, verifikasi, lokasi. Paginasi 20/50/100/semua.
- Detail per baris: foto asli, potongan LCD, hasil AI, STAN manual, keputusan **Sesuai / Tidak sesuai / Rumah tutup**, dan peta jarak dengan tautan **Buka di Google Maps**.
- **Ekspor Excel** dengan kode status lama (`SESUAI AI`, `PERIKSA / KOREKSI MANUAL`, `AI_CONFIDENT`, …) ditambah kolom baru (Lampiran A), lembar Ringkasan, dan lembar Riwayat.

**Peningkatan (U1–U14)**
- **Inspektor samping** menggantikan 4 modal, sehingga tabel tetap terlihat. Foto bisa di-zoom, digeser, dan diputar, dengan kotak deteksi LCD dan stiker.
- **Mode fokus** (`F`): satu foto per layar, filmstrip antrean, dan pindah otomatis setelah keputusan.
- **Pembaca 7-segmen** dengan 3 varian binarisasi, keyakinan per digit (digit yang ragu diberi garis bawah oranye), dan cek konsistensi antarvarian.
- Validasi **bulan stiker** dan **tanggal foto** terhadap periode, pencocokan **nomor meter**, dan **deteksi foto duplikat** (pHash ditambah sidik jari piksel).
- **Rujukan lokasi cerdas**: koordinat pelanggan dari Excel, atau kantor terdekat (ULP Samboja / UP3 Balikpapan). Ambangnya bisa diatur.
- **Aksi massal** (setujui semua Sesuai AI, tandai, hapus keputusan, proses ulang, ekspor terpilih).
- **Laporan**: rekap per kelurahan, petugas, dan RBM; peta titik foto; daftar duplikat; cetak ringkasan.
- **Riwayat/audit**: setiap perubahan STAN dan keputusan tercatat (siapa, kapan, sebelum → sesudah).
- **Batch tersimpan** otomatis di IndexedDB dan tidak hilang saat halaman dimuat ulang.
- Tema terang/gelap, responsif sampai ponsel, dan navigasi penuh dengan keyboard.

### Pintasan keyboard

| Tombol | Aksi | Tombol | Aksi |
|---|---|---|---|
| `/` | Cari | `S` `T` `R` | Sesuai / Tidak sesuai / Rumah tutup |
| `J` `K` / `↓` `↑` | Baris berikutnya / sebelumnya | `E` | Ubah STAN final |
| `Enter` | Buka inspektor | `B` | Kotak deteksi |
| `F` | Mode fokus | `Z` | Zoom 1:1 |
| `X` | Pilih baris | `Ctrl+A` | Pilih semua hasil filter |
| `Esc` | Tutup | `?` | Daftar pintasan |
| `G` lalu `D/S/P/Q/L/R` | Pindah halaman | | |

## Arsitektur

```
index.html
assets/css/app.css        token desain "Layar Meter", tema terang/gelap, responsif
assets/js/cv.js           mesin CV (G0–G7): kelayakan, deteksi LCD, pembaca 7-segmen, stiker, pHash
assets/js/engine.js       kumpulan Web Worker paralel + antrean job, EXIF, OCR opsional
assets/js/rules.js        aturan bisnis R1–R13 + definisi statistik (fungsi murni)
assets/js/excel.js        import/pemetaan kolom/pemasangan foto/ekspor (SheetJS)
assets/js/store.js        state, IndexedDB, log, audit
assets/js/ui.js           LcdReadout, StatusChip, StatusStrip, modal, tooltip
assets/js/views.js        Dasbor, Data & foto, Proses, Periksa, Laporan, Riwayat, Pengaturan
assets/js/inspector.js    Inspektor & Mode fokus
assets/js/app.js          navigasi, aksi, pintasan keyboard
assets/js/demo.js         generator data & foto demo
vendor/, fonts/           SheetJS, exifr, Archivo, DSEG7 (lokal, tanpa CDN)
gas/                      Google Apps Script (Code.gs, appsscript.json, Index.html hasil build)
tests/                    unit test aturan & pembaca 7-segmen, E2E Playwright
```

Kode CV ditulis dalam satu *factory* sehingga kode yang sama bisa berjalan di thread utama maupun di Web Worker (lewat Blob URL). Karena itu aplikasi tetap bekerja saat dibuka dari `file://` atau di dalam iframe Apps Script.

## Pengujian

```
npm test        # 15 unit test: R1–R13, statistik, utilitas, pembaca 7-segmen
npm run e2e     # alur penuh di Chromium (butuh paket playwright)
```

## Keterbatasan yang perlu diketahui

- Mesin CV menggunakan **heuristik citra klasik** (segmentasi warna LCD, binarisasi, sampling segmen), **bukan model jaringan saraf terlatih** seperti rencana G2/G4 di `plan.md`. Pada set demo, semua foto normal terbaca tepat dan kasus silau/buram ditandai "AI ragu". Namun ambang bawaannya dikalibrasi pada foto sintetis. **Sebelum dipakai untuk produksi, ambang di Pengaturan perlu dikalibrasi dengan foto asli ULP**, dan akurasinya perlu diukur pada dataset uji (target `plan.md`: akurasi ≥95%, false-accept <0,5%).
- Teks stempel kamera (nama, IDPEL, alamat, koordinat, tanggal) dan bulan stiker hanya terbaca otomatis jika **OCR (Tesseract.js)** diaktifkan di Pengaturan. Fitur ini memerlukan internet saat pertama kali dipakai. Tanpa OCR, sumber koordinat dan tanggal adalah EXIF foto, dan bulan stiker bisa diisi manual di inspektor. Pada data demo, metadata stempel diambil dari generator dan ditandai "data demo".
- Data batch tersimpan di browser (IndexedDB) pada perangkat tersebut. Sinkronisasi ke Google Sheets/Drive dan akses multi-verifikator (bagian 5–8 `PLAN.MD`) belum dibangun.
- Ekspor menggunakan SheetJS Community, sehingga sel status tidak diberi warna. Filter otomatis dan lebar kolom tetap diatur.
- Koordinat kantor ULP Samboja dan UP3 Balikpapan adalah perkiraan. Ubah nilainya di **Pengaturan → Kantor rujukan**.
