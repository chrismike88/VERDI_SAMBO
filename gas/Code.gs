/**
 * VERDI SAMBO — Verifikasi kWh Meter ULP Samboja
 * Server Google Apps Script: hanya menyajikan aplikasi (HTML Service).
 *
 * Seluruh pemrosesan foto, aturan bisnis, dan penyimpanan batch berjalan di
 * browser pengguna (Web Worker + IndexedDB), sehingga tidak ada foto atau data
 * pelanggan yang dikirim ke server dan kuota Apps Script tidak terpakai untuk AI.
 *
 * Penerapan:
 *   1. node scripts/build.mjs        (menghasilkan gas/Index.html)
 *   2. clasp push  — atau salin Code.gs, Index.html, appsscript.json ke proyek Apps Script
 *   3. Deploy > New deployment > Web app
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('VERDI SAMBO — Verifikasi kWh Meter ULP Samboja')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.gstatic.com/images/icons/material/system/2x/bolt_black_48dp.png');
}
