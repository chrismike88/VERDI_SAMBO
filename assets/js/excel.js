/* VERDI SAMBO — import Excel master, pemetaan kolom, pemasangan foto, dan ekspor. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util;

  var FIELDS = [
    { key: 'idpel', label: 'IDPEL', required: true, re: /^(id\s*_?pel|idpel|id\s*pelanggan|no\.?\s*pelanggan)/i },
    { key: 'nama', label: 'Nama', required: true, re: /^(nama|nm\s*pel|pelanggan)/i },
    { key: 'nomorMeter', label: 'Nomor meter', re: /(no(mor)?\.?\s*_?meter|nomor_meter|no\.?\s*kwh|meter\s*id)/i },
    { key: 'stanCater', label: 'STAN cater', re: /(stan|cater|sisa\s*kwh|kwh\s*baca)/i },
    { key: 'alamat', label: 'Alamat', re: /^alamat/i },
    { key: 'lokasi', label: 'Lokasi / kelurahan', re: /^(lokasi|kel(urahan)?|desa|wilayah|gardu)/i },
    { key: 'rbm', label: 'Kode RBM', re: /^(rbm|rute|kode\s*rbm)/i },
    { key: 'petugas', label: 'Petugas', re: /^(petugas|cater\s*nama|kode\s*petugas)/i },
    { key: 'lat', label: 'Latitude', re: /^(lat|latitude|koordinat\s*y)$/i },
    { key: 'lon', label: 'Longitude', re: /^(lon|lng|long|longitude|koordinat\s*x)$/i }
  ];

  function readWorkbook(file) {
    return file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, { type: 'array', cellDates: true });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
      // cari baris header: baris pertama yang memuat kolom mirip IDPEL
      var hi = 0;
      for (var i = 0; i < Math.min(15, aoa.length); i++) {
        if (aoa[i].some(function (c) { return /id\s*_?pel/i.test(String(c)); })) { hi = i; break; }
      }
      var headers = (aoa[hi] || []).map(function (h, k) { return String(h || ('KOLOM_' + (k + 1))).trim(); });
      var body = aoa.slice(hi + 1).filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
      return { sheet: wb.SheetNames[0], headers: headers, rows: body };
    });
  }

  function guessMapping(headers) {
    var map = {}, used = {};
    FIELDS.forEach(function (f) {
      for (var i = 0; i < headers.length; i++) {
        if (used[i]) continue;
        var h = headers[i];
        if (f.key === 'nama' && /alamat|petugas/i.test(h)) continue;
        if (f.key === 'nomorMeter' && /stan/i.test(h)) continue;
        if (f.re.test(h)) { map[f.key] = i; used[i] = true; break; }
      }
    });
    return map;
  }

  function normIdpel(v) {
    var s = String(v == null ? '' : v).trim();
    if (/e\+/i.test(s)) s = Number(s).toFixed(0);
    return s.replace(/\D/g, '');
  }

  function buildRows(parsed, mapping) {
    var ok = [], bad = [], seen = {};
    parsed.rows.forEach(function (r, i) {
      function g(k) { return mapping[k] == null ? null : r[mapping[k]]; }
      var idpel = normIdpel(g('idpel')), nama = String(g('nama') || '').trim();
      var problem = null;
      if (!/^\d{11,12}$/.test(idpel)) problem = 'IDPEL tidak valid (' + (g('idpel') || 'kosong') + ')';
      else if (!nama) problem = 'Nama kosong';
      else if (seen[idpel]) problem = 'IDPEL ganda (sama dengan baris ' + seen[idpel] + ')';
      if (problem) { bad.push({ baris: i + 2, idpel: idpel || String(g('idpel') || ''), nama: nama, masalah: problem }); return; }
      seen[idpel] = i + 2;
      var raw = {};
      parsed.headers.forEach(function (h, k) { raw[h] = r[k] instanceof Date ? r[k].toISOString() : r[k]; });
      ok.push({
        id: U.uid('r_'), no: ok.length + 1, idpel: idpel, nama: nama,
        nomorMeter: g('nomorMeter') != null && String(g('nomorMeter')).trim() !== '' ? normIdpel(g('nomorMeter')) : null,
        stanCater: VS.rules.num(g('stanCater')),
        alamat: g('alamat') ? String(g('alamat')) : null, lokasi: g('lokasi') ? String(g('lokasi')) : null,
        rbm: g('rbm') ? String(g('rbm')) : null, petugas: g('petugas') ? String(g('petugas')) : null,
        latRef: VS.rules.num(g('lat')), lonRef: VS.rules.num(g('lon')),
        baris: i + 2, raw: raw, photo: null, ai: null, verif: {}, stage: 'idle'
      });
    });
    return { ok: ok, bad: bad };
  }

  /* ---------- foto ---------- */
  function isImage(name) { return /\.(jpe?g|png)$/i.test(name); }

  function scanFiles(files) {
    var st = { jpg: 0, jpeg: 0, png: 0, total: 0, other: 0 };
    files.forEach(function (f) {
      var m = f.name.match(/\.(jpe?g|png)$/i);
      if (!m) { st.other++; return; }
      st[m[1].toLowerCase()]++; st.total++;
    });
    return st;
  }

  function idpelFromName(name, format) {
    var base = name.replace(/\.[^.]+$/, '');
    if (format === 'IDPEL_DATE') {
      var m = base.match(/^(\d{11,12})[_-](\d{6,8})/);
      return m ? { idpel: m[1], tanggal: m[2] } : null;
    }
    var m2 = base.match(/^(\d{11,12})$/) || base.match(/^(\d{11,12})(?:[_\-\s].*)?$/);
    return m2 ? { idpel: m2[1] } : null;
  }

  function pair(rows, files, format) {
    var byIdpel = {}, unmatched = [], unknown = [];
    files.filter(function (f) { return isImage(f.name); }).forEach(function (f) {
      var p = idpelFromName(f.name, format);
      if (!p) { unknown.push(f.name); return; }
      if (!byIdpel[p.idpel]) byIdpel[p.idpel] = { file: f, meta: p };
    });
    var paired = 0, noPhoto = [];
    rows.forEach(function (r) {
      var hit = byIdpel[r.idpel];
      if (hit) {
        r.photo = { name: hit.file.name, size: hit.file.size, type: hit.file.type, idpel: hit.meta.idpel, tanggalNama: hit.meta.tanggal || null };
        r._file = hit.file; paired++; hit.used = true;
      } else { r.photo = null; noPhoto.push(r.idpel + ' ' + r.nama); }
    });
    Object.keys(byIdpel).forEach(function (k) { if (!byIdpel[k].used) unmatched.push(byIdpel[k].file.name); });
    return { paired: paired, noPhoto: noPhoto, unmatchedFiles: unmatched.concat(unknown) };
  }

  /* ---------- ekspor (Lampiran A) ---------- */
  var EXPORT_COLS = ['NO', 'IDPEL', 'NAMA', 'VALIDASI_KWH', 'VALIDASI_IDPEL', 'STIKER', 'STIKER_BULAN', 'STAN_CATER', 'STAN_AI', 'KEYAKINAN_AI',
    'STAN_MANUAL', 'STAN_FINAL', 'STATUS_AI', 'KONSISTENSI', 'KUALITAS_CV', 'STATUS_VERIFIKASI', 'KEPUTUSAN', 'ALASAN', 'NOMOR_METER_OCR',
    'NAMA_OVERLAY', 'ALAMAT_FOTO', 'LAT_FOTO', 'LON_FOTO', 'TANGGAL_FOTO', 'JARAK_KM', 'KANTOR_RUJUKAN', 'DUPLIKAT_DENGAN', 'PERBANDINGAN_CATER',
    'VERIFIKATOR', 'WAKTU_VERIFIKASI', 'CATATAN', 'FILE_FOTO'];

  function safeCell(v) {
    // cegah formula injection saat dibuka di Excel/Sheets
    if (typeof v === 'string' && /^[=+\-@]/.test(v) && !/^-?\d/.test(v)) return "'" + v;
    return v;
  }

  function exportRows(rows) {
    var S = VS.state, E = S.evals;
    var aoa = [EXPORT_COLS.concat(S.batch && S.batch.headers ? S.batch.headers.map(function (h) { return 'ASLI_' + h; }) : [])];
    rows.forEach(function (r) {
      var e = E[r.id] || {}, ai = r.ai || {}, ov = ai.overlay || {}, v = r.verif || {};
      var sm = v.stickerMonth || ai.stickerMonth;
      var line = [r.no, r.idpel, r.nama, e.kwh, e.idpel, e.sticker, sm ? sm.label : '', r.stanCater, e.stanAI, e.conf != null ? +(e.conf * 100).toFixed(1) : '',
        v.stanManual != null ? v.stanManual : '', e.stanFinal, e.statusAI, e.konsistensi, e.cv, e.aiVerif,
        v.keputusan ? v.keputusan.replace('_', ' ') : '', e.final === 'ulang' || e.final === 'periksa' ? e.instruksi : (e.reviewReasons || []).join(' '),
        ai.nomorMeterOcr || '', ov.nama || '', ov.alamat || '', e.fotoLat != null ? e.fotoLat : '', e.fotoLon != null ? e.fotoLon : '',
        e.fotoTanggal ? U.fmtDateTime(e.fotoTanggal) : '', e.jarakKm != null ? +e.jarakKm.toFixed(3) : '', e.rujukan ? e.rujukan.nama : '',
        e.dupWith || '', e.cater || '', v.by || '', v.at ? U.fmtDateTime(v.at) : '', v.catatan || '', r.photo ? r.photo.name : ''];
      if (S.batch && S.batch.headers) S.batch.headers.forEach(function (h) { line.push(r.raw ? r.raw[h] : ''); });
      aoa.push(line.map(safeCell));
    });
    return aoa;
  }

  function exportXlsx(rows, suffix) {
    var S = VS.state, wb = XLSX.utils.book_new();
    var aoa = exportRows(rows);
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = aoa[0].map(function (h) { return { wch: Math.max(8, Math.min(42, String(h).length + 4)) }; });
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: aoa[0].length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Verifikasi');

    var st = S.stats, b = S.batch;
    var sum = [
      ['VERDI SAMBO — Verifikasi kWh Meter ULP Samboja'], [],
      ['Periode', U.BULAN[b.month - 1] + ' ' + b.year], ['Unit', b.unit], ['File Excel', b.excelName || '-'], ['Folder foto', b.folderName || '-'],
      ['Diekspor oleh', S.settings.verifikator], ['Waktu ekspor', U.fmtDateTime(Date.now())], [],
      ['Metrik', 'Jumlah', 'Persen'],
      ['Total data', st.total, 1], ['Sukses AI (Sesuai AI)', st.aiSukses, st.total ? st.aiSukses / st.total : 0],
      ['Valid (Sesuai AI + Sesuai manual)', st.valid, st.total ? st.valid / st.total : 0],
      ['Tidak valid (Tidak sesuai)', st.tidakValid, st.total ? st.tidakValid / st.total : 0],
      ['Rumah tutup', st.rumah_tutup, st.total ? st.rumah_tutup / st.total : 0],
      ['Perlu review', st.review, st.total ? st.review / st.total : 0],
      ['Belum diproses', st.belum, st.total ? st.belum / st.total : 0], [],
      ['Sesuai cater', st.caterSesuai], ['Tidak sesuai cater', st.caterTidak], ['Tanpa pembanding (STAN cater kosong)', st.caterTanpa]
    ];
    var ws2 = XLSX.utils.aoa_to_sheet(sum);
    ws2['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 10 }];
    for (var i = 11; i <= 17; i++) { var c = ws2['C' + i]; if (c) c.z = '0.0%'; }
    XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

    var au = [['Waktu', 'Oleh', 'Aksi', 'IDPEL', 'Nama', 'Sebelum', 'Sesudah']].concat(S.audit.map(function (a) {
      return [U.fmtDateTime(a.t), a.oleh, a.aksi, a.idpel, a.nama, JSON.stringify(a.sebelum || ''), JSON.stringify(a.sesudah || '')].map(safeCell);
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(au), 'Riwayat');
    wb.Props = { Title: 'VERDI SAMBO ' + U.BULAN[b.month - 1] + ' ' + b.year, Author: S.settings.verifikator, CreatedDate: new Date() };
    var name = 'VERDI_SAMBO_' + b.year + U.pad(b.month) + (suffix ? '_' + suffix : '') + '.xlsx';
    U.saveWorkbook(wb, name);
    return name;
  }

  function templateXlsx() {
    var aoa = [['IDPEL', 'NAMA', 'NOMOR_METER', 'STAN_CATER', 'ALAMAT', 'LOKASI', 'RBM', 'PETUGAS', 'LAT', 'LON'],
      ['232100000425', 'CONTOH PELANGGAN', '45123456789', 4699, 'RT 05 Kel. Margomulyo, Samboja', 'Margomulyo', 'SMB-01', 'SMB', -1.0368, 117.1182]];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Master');
    U.saveWorkbook(wb, 'Template_Master_VERDI_SAMBO.xlsx');
  }

  function demoWorkbookFile(rows) {
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Master');
    var out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return new File([out], 'DATA_PELANGGAN_SAMBOJA_DEMO.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  VS.excel = {
    FIELDS: FIELDS, readWorkbook: readWorkbook, guessMapping: guessMapping, buildRows: buildRows, scanFiles: scanFiles,
    pair: pair, exportXlsx: exportXlsx, templateXlsx: templateXlsx, demoWorkbookFile: demoWorkbookFile, isImage: isImage, idpelFromName: idpelFromName
  };
})();
