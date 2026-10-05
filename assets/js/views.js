/* VERDI SAMBO — tampilan: Dasbor, Data & foto, Proses, Periksa (antrian), Laporan, Riwayat, Pengaturan. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util, S = VS.state, UI = VS.ui, esc = U.esc, icon = UI.icon;

  function $(id) { return document.getElementById(id); }
  function periodLabel() { return S.batch ? U.BULAN[S.batch.month - 1] + ' ' + S.batch.year : ''; }

  /* =================== DASBOR =================== */
  function renderDash() {
    var el = $('view-dash');
    if (!S.batch || !S.rows.length) { el.innerHTML = welcome(); return; }
    var st = S.stats, total = st.total || 1;
    var pctAi = st.total ? (st.aiSukses * 100 / st.total) : 0;
    var decided = S.rows.filter(function (r) { return r.verif && r.verif.keputusan; }).length;
    var h1 = st.belum === st.total ? st.total + ' foto siap diproses AI'
      : st.review ? st.review + ' foto menunggu keputusan Anda' : 'Semua foto sudah terverifikasi';
    var sub = st.processed + ' dari ' + st.total + ' foto sudah dianalisis. ' + st.aiSukses + ' terbaca yakin oleh AI, ' + decided + ' sudah diputuskan verifikator' +
      (S.dup.list.length ? ', ' + S.dup.list.length + ' foto terindikasi duplikat' : '') + '.';
    var cta = '';
    if (st.belum) cta += '<button class="btn btn-primary btn-lg" data-action="run-all">' + icon('play') + 'Proses semua (' + st.belum + ')</button>';
    if (st.review) cta += '<button class="btn ' + (st.belum ? '' : 'btn-primary ') + 'btn-lg" data-action="focus">' + icon('focus') + 'Mulai review <kbd>F</kbd></button>';
    cta += '<button class="btn btn-lg" data-action="export">' + icon('download') + 'Ekspor Excel</button>';

    var kpis = [
      { k: 'sesuai', tone: 'ok', icon: 'check', label: 'Valid', v: st.valid, note: st.sesuai_ai + ' AI · ' + st.sesuai + ' manual' },
      { k: 'review', tone: 'check', icon: 'search', label: 'Perlu review', v: st.review, note: st.periksa + ' periksa · ' + st.ulang + ' foto ulang' },
      { k: 'tidak_sesuai', tone: 'bad', icon: 'x', label: 'Tidak valid', v: st.tidakValid, note: 'keputusan tidak sesuai' },
      { k: 'rumah_tutup', tone: 'closed', icon: 'home', label: 'Rumah tutup', v: st.rumah_tutup, note: 'tidak dapat dibaca' },
      { k: 'belum', tone: 'wait', icon: 'clock', label: 'Belum diproses', v: st.belum, note: 'menunggu AI' }
    ].map(function (k) {
      return '<button class="kpi ' + k.tone + '" data-action="goto-seg" data-seg="' + k.k + '"><div class="k-label">' + icon(k.icon) + k.label + '</div>' +
        '<div class="k-val"><span data-anim="' + k.v + '">' + U.fmtNum(k.v) + '</span><small>' + U.pct(k.v, st.total, 0) + '</small></div>' +
        '<div class="tiny muted">' + k.note + '</div><div class="k-bar"><i style="width:' + (k.v * 100 / total) + '%"></i></div></button>';
    }).join('');

    el.innerHTML =
      '<div class="hero"><div class="hero-grid"><div>' +
      '<div class="eyebrow">Periode ' + periodLabel() + ' · ' + esc(S.batch.unit) + '</div>' +
      '<h1>' + esc(h1) + '</h1><p>' + esc(sub) + '</p><div class="hero-actions">' + cta + '</div></div>' +
      '<div class="hero-meter"><div class="cap"><span>Sukses AI</span><span><b>' + st.aiSukses + '</b> / ' + st.total + ' foto</span></div>' +
      UI.lcd(pctAi.toFixed(1), { size: 'xl', len: pctAi >= 99.95 ? 4 : 3, label: 'Sukses AI ' + pctAi.toFixed(1) + ' persen', lit: true }) +
      UI.strip(st, S.ui.filter.seg) + '</div></div></div>' +
      '<div class="kpis">' + kpis + '</div>' +
      '<div class="grid g-12">' +
      '<div class="card span-7"><div class="card-head"><h3>Status per kelurahan</h3><span class="sub">klik baris untuk menyaring antrian</span><div class="right"><button class="btn btn-ghost btn-sm table-toggle" data-action="toggle-table" data-target="dash-lok">' + icon('grid') + 'Tabel</button></div></div><div class="card-pad" id="dash-lok">' + groupBars('lokasi') + '</div></div>' +
      '<div class="card span-5"><div class="card-head"><h3>Perbandingan STAN cater</h3><span class="sub">STAN final vs catatan cater</span></div><div class="card-pad">' + caterBlock() + '</div>' +
      '<div class="card-head" style="border-top:1px solid var(--line-2)"><h3>Keyakinan pembacaan AI</h3><span class="sub">foto layak dengan angka terbaca</span></div><div class="card-pad">' + confHistogram() + '</div></div>' +
      '<div class="card span-7"><div class="card-head"><h3>Lokasi foto</h3><span class="sub">titik foto diwarnai status; ' + icon('map') + ' kantor rujukan</span></div><div class="geo-map">' + geoMap(360) + '</div></div>' +
      '<div class="card span-5"><div class="card-head"><h3>Aktivitas terbaru</h3><div class="right"><button class="btn btn-ghost btn-sm" data-action="nav" data-view="history">Lihat riwayat ' + icon('right') + '</button></div></div><div class="card-pad">' + activityFeed() + '</div></div>' +
      '</div>';
    el.querySelectorAll('[data-anim]').forEach(function (n) { n.setAttribute('data-v', 0); UI.animateNumber(n, +n.getAttribute('data-anim')); });
  }

  function welcome() {
    var saved = S.batches.length ? '<div class="card" style="margin-top:16px"><div class="card-head"><h3>Batch tersimpan</h3><span class="sub">lanjutkan pekerjaan sebelumnya</span></div>' + batchList() + '</div>' : '';
    return '<div class="empty-hero"><div class="welcome">' +
      '<div class="hero"><div class="hero-grid"><div>' +
      '<div class="eyebrow">ULP Samboja · UP3 Balikpapan</div>' +
      '<h1>Verifikasi foto kWh meter, tanpa membuka-tutup 140 modal.</h1>' +
      '<p>Mulai dengan file Excel pelanggan. Foto dipasangkan setelah folder dipilih, lalu AI membaca layar LCD 7-segmen, memeriksa kelayakan foto, IDPEL, stiker, periode, lokasi, dan duplikat — semua berjalan di browser Anda, data tidak keluar dari komputer.</p>' +
      '<div class="hero-actions"><button class="btn btn-primary btn-lg" data-action="demo">' + icon('bolt') + 'Coba data demo (36 pelanggan)</button>' +
      '<button class="btn btn-lg" data-action="nav" data-view="setup">' + icon('upload') + 'Pilih file Excel</button>' +
      '<button class="btn btn-lg" data-action="template">' + icon('download') + 'Template Excel</button></div></div>' +
      '<div class="hero-meter"><div class="cap"><span>Contoh pembacaan STAN</span><span>keyakinan <b>99,8%</b></span></div>' + UI.lcd('4699', { size: 'xl', len: 6, lit: true }) +
      '<div class="cap"><span>Pembaca 7-segmen lokal · 3 varian binarisasi</span><span>Web Worker paralel</span></div></div></div></div>' +
      '<div class="feature-row">' +
      feature('layers', 'Inspektor samping', 'Foto, potongan LCD, pemeriksaan, peta, dan keputusan dalam satu panel. Tabel tetap terlihat.') +
      feature('focus', 'Mode fokus', 'Satu foto per layar, keyboard penuh: J/K pindah, S/T/R memutuskan.') +
      feature('camera', 'Cek foto daur ulang', 'pHash mendeteksi foto yang sama dipakai untuk pelanggan berbeda.') +
      feature('chart', 'Laporan & ekspor', 'Rekap per kelurahan/petugas, peta titik foto, ekspor Excel kompatibel format lama.') +
      '</div>' + saved + '</div></div>';
  }
  function feature(ic, t, d) { return '<div class="card feature">' + icon(ic) + '<h3>' + t + '</h3><p>' + d + '</p></div>'; }

  function batchList() {
    return '<ul class="batch-list">' + S.batches.map(function (b) {
      return '<li><span class="trio"><span>' + icon('db') + '</span></span><div><div class="b-name">' + esc(b.nama) + (S.batch && S.batch.id === b.id ? ' <span class="tag ok">aktif</span>' : '') + '</div>' +
        '<div class="b-meta">' + U.BULAN[b.month - 1] + ' ' + b.year + ' · ' + b.total + ' baris · ' + b.processed + ' diproses · ' + b.review + ' perlu review · diubah ' + U.fmtDateTime(b.updatedAt) + '</div></div>' +
        '<div class="right"><button class="btn btn-sm" data-action="open-batch" data-id="' + b.id + '">Buka</button><button class="btn btn-ghost btn-sm btn-danger" data-action="delete-batch" data-id="' + b.id + '" aria-label="Hapus batch">' + icon('trash') + '</button></div></li>';
    }).join('') + '</ul>';
  }

  function groupBars(field) {
    var groups = {};
    S.rows.forEach(function (r) {
      var k = r[field] || '(tanpa ' + field + ')';
      var g = groups[k] = groups[k] || { k: k, total: 0 };
      g.total++;
      var f = S.evals[r.id].final; g[f] = (g[f] || 0) + 1;
    });
    var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.total - a.total; });
    var max = Math.max.apply(null, list.map(function (g) { return g.total; }).concat([1]));
    var bars = '<div class="bars-h">' + list.map(function (g) {
      var segs = UI.SEGMENTS.map(function (s) {
        var n = UI.segCount(g, s);
        return n ? '<span class="seg ' + s.tone + '" style="flex-grow:' + n + '" data-tip="<b>' + esc(g.k) + '</b><br>' + s.label + ': ' + n + ' dari ' + g.total + '"></span>' : '';
      }).join('');
      return '<div class="bar-row" data-action="filter-group" data-field="' + field + '" data-val="' + esc(g.k) + '" style="cursor:pointer"><span class="lbl" title="' + esc(g.k) + '">' + esc(g.k) + '</span>' +
        '<div style="width:' + (g.total * 100 / max) + '%"><div class="strip">' + segs + '</div></div><span class="n">' + g.total + '</span></div>';
    }).join('') + '</div><div class="legend">' + UI.SEGMENTS.map(function (s) { return '<button tabindex="-1"><span class="dot ' + s.tone + '"></span>' + s.label + '</button>'; }).join('') + '</div>';
    var table = '<table class="mini-table" hidden><thead><tr><th>' + esc(field) + '</th>' + UI.SEGMENTS.map(function (s) { return '<th class="r">' + s.label + '</th>'; }).join('') + '<th class="r">Total</th></tr></thead><tbody>' +
      list.map(function (g) { return '<tr><td>' + esc(g.k) + '</td>' + UI.SEGMENTS.map(function (s) { return '<td class="r">' + UI.segCount(g, s) + '</td>'; }).join('') + '<td class="r">' + g.total + '</td></tr>'; }).join('') + '</tbody></table>';
    return '<div class="chart-view">' + bars + '</div>' + table;
  }

  function caterBlock() {
    var st = S.stats, t = st.caterSesuai + st.caterTidak + st.caterTanpa;
    var segs = [
      { n: st.caterSesuai, tone: 'ok', l: 'Sesuai cater' },
      { n: st.caterTidak, tone: 'bad', l: 'Tidak sesuai cater' },
      { n: st.caterTanpa, tone: 'wait', l: 'Tanpa pembanding' }
    ];
    return '<div class="strip" style="height:14px">' + (t ? segs.map(function (s) { return '<span class="seg ' + s.tone + '" style="flex-grow:' + s.n + '" data-tip="<b>' + s.l + '</b><br>' + s.n + ' baris"></span>'; }).join('') : '') + '</div>' +
      '<div class="legend">' + segs.map(function (s) { return '<button tabindex="-1"><span class="dot ' + s.tone + '"></span>' + s.l + ' <b>' + s.n + '</b></button>'; }).join('') + '</div>' +
      '<p class="tiny muted" style="margin:10px 0 0">Baris tanpa STAN cater dihitung “tanpa pembanding”, tidak masuk “tidak sesuai”.</p>';
  }

  function confHistogram() {
    var bins = new Array(10).fill(0), n = 0;
    S.rows.forEach(function (r) { var e = S.evals[r.id]; if (e && e.conf != null) { bins[Math.min(9, Math.floor(e.conf * 10))]++; n++; } });
    if (!n) return '<div class="empty" style="padding:20px">' + icon('chart') + '<div class="tiny">Belum ada pembacaan STAN.</div></div>';
    var W = 420, H = 150, pl = 26, pb = 22, max = Math.max.apply(null, bins), bw = (W - pl) / 10;
    var thr = S.settings.minConfidence;
    var g = '';
    [0, 0.5, 1].forEach(function (k) {
      var y = H - pb - k * (H - pb - 8);
      g += '<line class="grid-line" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(k * max) + '</text>';
    });
    var bars = bins.map(function (c, i) {
      var h = c ? Math.max(3, c / max * (H - pb - 8)) : 0, x = pl + i * bw + 1, y = H - pb - h;
      var col = (i + 1) / 10 <= thr ? 'var(--check)' : 'var(--ok)';
      var path = h ? 'M' + x + ',' + (H - pb) + 'V' + (y + 4) + 'q0,-4 4,-4h' + (bw - 10) + 'q4,0 4,4V' + (H - pb) + 'z' : '';
      return (path ? '<path d="' + path + '" fill="' + col + '"/>' : '') +
        '<rect class="hit" x="' + (pl + i * bw) + '" y="0" width="' + bw + '" height="' + (H - pb) + '" data-tip="<b>' + (i * 10) + '–' + (i * 10 + 10) + '%</b><br>' + c + ' foto"/>' +
        (i % 2 === 0 ? '<text x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + i * 10 + '%</text>' : '');
    }).join('');
    var tx = pl + thr * (W - pl);
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram keyakinan AI">' + g + bars +
      '<line x1="' + tx + '" x2="' + tx + '" y1="4" y2="' + (H - pb) + '" stroke="var(--ink)" stroke-dasharray="3 3" stroke-width="1.5"/>' +
      '<text x="' + (tx + 4) + '" y="12" style="fill:var(--ink);font-weight:650">ambang ' + Math.round(thr * 100) + '%</text></svg></div>';
  }

  function geoMap(h) {
    var pts = [];
    S.rows.forEach(function (r) {
      var e = S.evals[r.id];
      var lat = e && e.fotoLat != null ? e.fotoLat : r.latRef, lon = e && e.fotoLon != null ? e.fotoLon : r.lonRef;
      if (lat != null && lon != null) pts.push({ r: r, e: e, lat: lat, lon: lon });
    });
    var offs = S.settings.offices || [];
    if (!pts.length) return '<div class="empty">' + icon('map') + '<h3>Belum ada koordinat</h3><div class="tiny">Koordinat diambil dari stempel foto, EXIF, atau kolom LAT/LON Excel.</div></div>';
    var all = pts.map(function (p) { return [p.lat, p.lon]; }).concat(offs.filter(function (o) {
      return pts.some(function (p) { return U.haversine(p.lat, p.lon, o.lat, o.lon) < 60; });
    }).map(function (o) { return [o.lat, o.lon]; }));
    var minLat = Math.min.apply(null, all.map(function (a) { return a[0]; })), maxLat = Math.max.apply(null, all.map(function (a) { return a[0]; }));
    var minLon = Math.min.apply(null, all.map(function (a) { return a[1]; })), maxLon = Math.max.apply(null, all.map(function (a) { return a[1]; }));
    var W = 760, H = h || 360, pad = 30;
    var sx = (W - 2 * pad) / Math.max(0.01, maxLon - minLon), sy = (H - 2 * pad) / Math.max(0.01, maxLat - minLat), s = Math.min(sx, sy);
    var ox = (W - (maxLon - minLon) * s) / 2, oy = (H - (maxLat - minLat) * s) / 2;
    function X(lon) { return ox + (lon - minLon) * s; } function Y(lat) { return H - (oy + (lat - minLat) * s); }
    var kmPx = s / 111; // perkiraan
    var scaleKm = [1, 2, 5, 10, 20, 50].filter(function (k) { return k * kmPx < 140; }).pop() || 1;
    var grid = '';
    for (var gx = 0; gx <= W; gx += 40) grid += '<line class="grid-line" x1="' + gx + '" x2="' + gx + '" y1="0" y2="' + H + '" opacity=".6"/>';
    for (var gy = 0; gy <= H; gy += 40) grid += '<line class="grid-line" x1="0" x2="' + W + '" y1="' + gy + '" y2="' + gy + '" opacity=".6"/>';
    var tone = { sesuai_ai: 'var(--ok)', sesuai: 'var(--ok)', tidak_sesuai: 'var(--bad)', rumah_tutup: 'var(--closed)', periksa: 'var(--check)', ulang: 'var(--retake)', menunggu: 'var(--wait)', memproses: 'var(--wait)' };
    var links = pts.filter(function (p) { return p.e && p.e.lokasi === 'JAUH' && p.r.latRef != null; }).map(function (p) {
      return '<line x1="' + X(p.r.lonRef) + '" y1="' + Y(p.r.latRef) + '" x2="' + X(p.lon) + '" y2="' + Y(p.lat) + '" stroke="var(--retake)" stroke-dasharray="4 4" stroke-width="1.5" opacity=".7"/>';
    }).join('');
    var dots = pts.map(function (p) {
      var f = p.e ? p.e.final : 'menunggu', lab = (VS.rules.FINAL[f] || {}).label;
      return '<circle class="pt" data-action="select" data-id="' + p.r.id + '" cx="' + X(p.lon).toFixed(1) + '" cy="' + Y(p.lat).toFixed(1) + '" r="7" fill="' + tone[f] + '" data-tip="<b>' + esc(p.r.nama) + '</b><br>' + p.r.idpel + '<br>' + lab + (p.e && p.e.jarakKm != null ? '<br>' + U.fmtNum(p.e.jarakKm, 2) + ' km dari rujukan' : '') + '"/>';
    }).join('');
    var offices = offs.filter(function (o) { return o.lat >= minLat - 0.01 && o.lat <= maxLat + 0.01 && o.lon >= minLon - 0.01 && o.lon <= maxLon + 0.01; }).map(function (o) {
      var x = X(o.lon), y = Y(o.lat);
      return '<g data-tip="<b>' + esc(o.nama) + '</b><br>' + o.lat.toFixed(4) + ', ' + o.lon.toFixed(4) + '"><rect x="' + (x - 9) + '" y="' + (y - 9) + '" width="18" height="18" rx="4" fill="var(--band)" stroke="var(--petir)" stroke-width="2"/>' +
        '<path d="M' + (x + 1) + ',' + (y - 6) + 'l-5,7h4l-1,5 5,-7h-4z" fill="var(--petir)"/><text x="' + (x + 13) + '" y="' + (y + 4) + '" style="fill:var(--ink);font-weight:700">' + esc(o.nama) + '</text></g>';
    }).join('');
    var scale = '<g transform="translate(' + (W - pad - scaleKm * kmPx) + ',' + (H - 14) + ')"><line x1="0" x2="' + (scaleKm * kmPx) + '" y1="0" y2="0" stroke="var(--ink-2)" stroke-width="2"/><text x="' + (scaleKm * kmPx / 2) + '" y="-5" text-anchor="middle">' + scaleKm + ' km</text></g>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Peta titik foto">' + grid + links + offices + dots + scale + '</svg>';
  }

  function activityFeed() {
    var items = S.audit.slice(0, 7).map(function (a) {
      return '<li><time>' + U.fmtTime(a.t) + '</time><div><b>' + esc(a.aksi) + '</b>' + (a.nama ? ' · ' + esc(a.nama) : '') + '<div class="tiny muted">' + esc(a.oleh) + (a.sesudah && a.sesudah.keputusan ? ' · ' + esc(a.sesudah.keputusan.replace('_', ' ')) : '') + '</div></div></li>';
    });
    if (items.length < 7) {
      S.logs.slice(-(7 - items.length)).reverse().forEach(function (l) {
        items.push('<li><time>' + U.fmtTime(l.t) + '</time><div><b>' + esc(l.tag) + '</b><div class="tiny muted">' + esc(l.msg) + '</div></div></li>');
      });
    }
    return items.length ? '<ul class="feed">' + items.join('') + '</ul>' : '<div class="empty" style="padding:20px">Belum ada aktivitas.</div>';
  }

  /* =================== DATA & FOTO =================== */
  var setup = VS.setupState = { parsed: null, mapping: {}, excelFile: null, files: null, folderName: '', format: 'IDPEL', built: null, pairing: null };

  function renderSetup() {
    var el = $('view-setup');
    var p = setup.parsed;
    var excelCard;
    if (!p) {
      excelCard = '<div class="dropzone" id="dz-excel" data-action="pick-excel" tabindex="0" role="button" aria-label="Pilih file Excel">' + icon('upload') +
        '<div class="dz-title">Pilih atau seret file Excel master</div><div class="dz-sub">Format .xlsx, .xls, .csv (maks. 50 MB) · kolom wajib IDPEL dan Nama</div></div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" data-action="template">' + icon('download') + 'Unduh template</button>' +
        (S.batch && S.batch.excelName ? '<span class="tag">Batch aktif memakai ' + esc(S.batch.excelName) + '</span>' : '') + '</div>';
    } else {
      var b = setup.built || { ok: [], bad: [] };
      excelCard = '<div class="file-ok">' + icon('file') + '<div><b>' + esc(setup.excelFile.name) + '</b><span class="tiny">' + b.ok.length + ' baris valid, ' + b.bad.length + ' bermasalah · lembar “' + esc(p.sheet) + '”</span></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-action="pick-excel">Ganti file</button></div>' +
        '<div class="form-sec" style="margin-top:16px">Pemetaan kolom</div><div class="map-grid">' +
        VS.excel.FIELDS.map(function (f) {
          return '<label>' + f.label + (f.required ? ' <span class="req">*</span>' : '') + '<select class="input" data-map="' + f.key + '"><option value="">— tidak ada —</option>' +
            p.headers.map(function (h, i) { return '<option value="' + i + '"' + (setup.mapping[f.key] === i ? ' selected' : '') + '>' + esc(h) + '</option>'; }).join('') + '</select></label>';
        }).join('') + '</div>' +
        '<div class="preview-wrap"><table class="preview"><thead><tr>' + p.headers.map(function (h, i) {
          var mapped = Object.keys(setup.mapping).some(function (k) { return setup.mapping[k] === i; });
          return '<th class="' + (mapped ? 'mapped' : '') + '">' + esc(h) + '</th>';
        }).join('') + '</tr></thead><tbody>' + p.rows.slice(0, 5).map(function (r) {
          return '<tr>' + p.headers.map(function (h, i) { return '<td>' + esc(r[i] instanceof Date ? r[i].toISOString().slice(0, 10) : r[i]) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' +
        (b.bad.length ? '<div class="notice warn" style="margin-top:12px">' + icon('warn') + '<div><b>' + b.bad.length + ' baris bermasalah tidak akan dimuat.</b> <button class="btn btn-ghost btn-sm" data-action="dl-bad">Unduh daftar</button>' +
          '<ul class="list-scroll">' + b.bad.slice(0, 50).map(function (x) { return '<li>Baris ' + x.baris + ': ' + esc(x.masalah) + '</li>'; }).join('') + '</ul></div></div>' : '');
    }

    var files = setup.files;
    var sc = files ? VS.excel.scanFiles(files) : null;
    var photoCard = '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-dark" data-action="pick-folder">' + icon('folder') + 'Pilih folder foto</button>' +
      '<button class="btn" data-action="pick-photos">' + icon('upload') + 'Pilih berkas foto</button></div>' +
      '<div class="dropzone" id="dz-photos" style="margin-top:12px;padding:18px" data-action="pick-folder"><div class="dz-sub">…atau seret folder / foto ke sini</div></div>' +
      (sc ? '<div class="notice ' + (sc.total ? 'ok' : 'warn') + '" style="margin-top:12px">' + icon(sc.total ? 'check' : 'warn') + '<div><b>' + (sc.total ? 'Folder valid (' + sc.total + ' foto)' : 'Tidak ada foto JPG/PNG') + '</b><div class="tiny">' + esc(setup.folderName || 'berkas terpilih') + '</div></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-action="rescan">Cek ulang</button></div>' +
        '<div class="counts"><span class="count-chip"><b>' + sc.jpg + '</b>JPG</span><span class="count-chip"><b>' + sc.jpeg + '</b>JPEG</span><span class="count-chip"><b>' + sc.png + '</b>PNG</span>' + (sc.other ? '<span class="count-chip"><b>' + sc.other + '</b>berkas lain diabaikan</span>' : '') + '</div>'
        : '<div class="notice" style="margin-top:12px">' + icon('info') + '<div>Folder belum dipilih. Foto dibaca langsung dari komputer Anda dan tidak diunggah ke mana pun.</div></div>') +
      '<div class="form-sec" style="margin-top:16px">Format nama file</div><div class="radio-cards">' +
      '<label class="radio-card"><input type="radio" name="fmt" value="IDPEL"' + (setup.format === 'IDPEL' ? ' checked' : '') + '><div><code>232100000425.jpg</code><small>IDPEL.jpg (default)</small></div></label>' +
      '<label class="radio-card"><input type="radio" name="fmt" value="IDPEL_DATE"' + (setup.format === 'IDPEL_DATE' ? ' checked' : '') + '><div><code>232100000425_20260915.jpg</code><small>IDPEL_tanggal.jpg</small></div></label></div>';

    var ready = setup.built && setup.built.ok.length && files && sc.total;
    var status = !p ? 'Mulai dengan file Excel pelanggan. Foto dipasangkan setelah folder dipilih.'
      : !files ? 'Excel siap. Pilih folder foto untuk dipasangkan.' : ready ? 'Excel dan folder foto siap. Klik Muat dan pasangkan.' : 'Periksa pemetaan kolom IDPEL dan Nama.';
    var pairing = setup.pairing ? '<div class="card card-pad" style="margin-top:16px"><div class="notice ok">' + icon('check') + '<div><b>' + setup.pairing.paired + ' foto dipasangkan dengan ' + setup.pairing.rows + ' baris Excel.</b><div class="tiny">' +
      setup.pairing.unmatchedFiles.length + ' foto tanpa baris · ' + setup.pairing.noPhoto.length + ' baris tanpa foto</div></div><button class="btn btn-primary" style="margin-left:auto" data-action="nav" data-view="process">Lanjut ke proses ' + icon('right') + '</button></div>' +
      (setup.pairing.unmatchedFiles.length ? '<details style="margin-top:10px"><summary class="tiny">Foto tanpa baris (' + setup.pairing.unmatchedFiles.length + ')</summary><ul class="list-scroll">' + setup.pairing.unmatchedFiles.slice(0, 200).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' : '') +
      (setup.pairing.noPhoto.length ? '<details style="margin-top:6px"><summary class="tiny">Baris tanpa foto (' + setup.pairing.noPhoto.length + ')</summary><ul class="list-scroll">' + setup.pairing.noPhoto.slice(0, 200).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' : '') + '</div>' : '';

    el.innerHTML = '<div class="view-head"><div><div class="eyebrow">Langkah 1</div><h1>Data &amp; foto</h1><p>Muat Excel master pelanggan, pilih folder foto lapangan, lalu pasangkan berdasarkan IDPEL di nama file.</p></div>' +
      '<div class="actions"><button class="btn" data-action="demo">' + icon('bolt') + 'Isi dengan data demo</button></div></div>' +
      '<div class="grid g-2"><div class="card"><div class="card-head"><span class="trio"><span class="t-ok">1</span></span><h3>Excel pelanggan</h3></div><div class="card-pad">' + excelCard + '</div></div>' +
      '<div class="card"><div class="card-head"><span class="trio"><span class="t-ok">2</span></span><h3>Folder foto</h3></div><div class="card-pad">' + photoCard + '</div></div></div>' +
      '<div class="card card-pad" style="margin-top:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>Periode ' + U.BULAN[(+$('sel-month').value || 9) - 1] + ' ' + ($('sel-year').value || 2026) + '</b><div class="tiny muted">' + status + '</div></div>' +
      '<label class="tiny muted" style="display:grid;gap:3px">Nama batch<input class="input" id="batch-name" value="' + esc(setup.batchName || ('Verifikasi ' + U.BULAN[(+$('sel-month').value || 9) - 1] + ' ' + ($('sel-year').value || 2026))) + '" style="min-width:240px"></label>' +
      '<button class="btn btn-primary btn-lg" data-action="load-pair"' + (ready ? '' : ' disabled') + '>' + icon('layers') + 'Muat dan pasangkan</button></div>' + pairing +
      (S.batches.length ? '<div class="card" style="margin-top:16px"><div class="card-head"><h3>Batch tersimpan</h3><span class="sub">tersimpan otomatis di browser ini</span></div>' + batchList() + '</div>' : '');
    wireDrops();
  }

  function wireDrops() {
    [['dz-excel', function (files) { if (files[0]) VS.app.onExcel(files[0]); }], ['dz-photos', function (files) { VS.app.onPhotos(files, 'Seret-lepas'); }]].forEach(function (d) {
      var z = $(d[0]); if (!z) return;
      z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('drag'); });
      z.addEventListener('dragleave', function () { z.classList.remove('drag'); });
      z.addEventListener('drop', function (e) {
        e.preventDefault(); z.classList.remove('drag');
        if (d[0] === 'dz-photos' && e.dataTransfer.items) collectDropped(e.dataTransfer.items).then(d[1]);
        else d[1](Array.prototype.slice.call(e.dataTransfer.files));
      });
      z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); z.click(); } });
    });
  }

  function collectDropped(items) {
    var out = [], pending = [];
    function walk(entry) {
      if (entry.isFile) pending.push(new Promise(function (res) { entry.file(function (f) { out.push(f); res(); }, res); }));
      else if (entry.isDirectory) {
        var reader = entry.createReader();
        pending.push(new Promise(function (res) {
          (function readAll() {
            reader.readEntries(function (ents) { if (!ents.length) return res(); ents.forEach(walk); readAll(); }, res);
          })();
        }));
      }
    }
    Array.prototype.forEach.call(items, function (it) { var en = it.webkitGetAsEntry && it.webkitGetAsEntry(); if (en) walk(en); });
    function settle() { var n = pending.length; return Promise.all(pending).then(function () { return pending.length > n ? settle() : out; }); }
    return settle();
  }

  /* =================== PROSES =================== */
  var NODES = [
    { key: 'gate1', title: 'Kelayakan foto', icon: 'camera' },
    { key: 'crop', title: 'Potong LCD', icon: 'box' },
    { key: 'stan', title: 'Baca STAN', icon: 'meter' },
    { key: 'meter', title: 'Nomor meter', icon: 'id', locked: true },
    { key: 'sticker', title: 'Stiker', icon: 'sticker' },
    { key: 'rules', title: 'Aturan', icon: 'check2', locked: true }
  ];

  function nodeStats() {
    var c = { layak: 0, tolak: 0, crop: 0, yakin: 0, ragu: 0, mOk: 0, mBad: 0, mNa: 0, sAda: 0, sTidak: 0, done: 0 };
    S.rows.forEach(function (r) {
      var ai = r.ai, e = S.evals[r.id];
      if (!ai || !ai.done) return;
      c.done++;
      if (ai.gate1 && ai.gate1.ok) c.layak++; else c.tolak++;
      if (ai.lcdBox) c.crop++;
      if (e.statusAI === 'AI_CONFIDENT') c.yakin++; else if (e.statusAI === 'AI_UNCERTAIN') c.ragu++;
      if (e.meterMatch === true) c.mOk++; else if (e.meterMatch === false) c.mBad++; else c.mNa++;
      if (e.sticker === 'ADA') c.sAda++; else if (e.sticker === 'TIDAK TERIDENTIFIKASI') c.sTidak++;
    });
    return c;
  }

  function renderProcess() {
    var el = $('view-process');
    if (!S.batch || !S.rows.length) { el.innerHTML = needData('Proses AI'); return; }
    var st = S.batch.stages || {}, job = S.job, c = nodeStats(), sel = Object.keys(S.ui.checked).length;
    var running = job && job.running;
    var nodeTxt = {
      gate1: '<b>' + c.layak + '</b> layak<br><b>' + c.tolak + '</b> ditolak',
      crop: '<b>' + c.crop + '</b> terpotong',
      stan: '<b>' + c.yakin + '</b> yakin<br><b>' + c.ragu + '</b> ragu',
      meter: c.mOk + c.mBad ? '<b>' + c.mOk + '</b> cocok<br><b>' + c.mBad + '</b> beda' : 'dari stempel / OCR',
      sticker: '<b>' + c.sAda + '</b> ada<br><b>' + c.sTidak + '</b> tidak',
      rules: '<b>' + S.stats.aiSukses + '</b> sesuai<br><b>' + S.stats.review + '</b> review'
    };
    var nodes = NODES.map(function (n, i) {
      var on = n.locked ? true : st[n.key] !== false;
      return '<div class="node ' + (running ? 'running' : c.done ? 'active' : '') + '"><button class="node-btn" data-action="toggle-stage" data-stage="' + n.key + '" aria-pressed="' + on + '"' + (n.locked ? ' disabled title="Tahap ini selalu aktif"' : ' title="Aktif/nonaktifkan tahap"') + '>' + icon(n.icon) + '</button>' +
        '<div class="n-title">' + n.title + '</div><div class="n-stats">' + nodeTxt[n.key] + '</div></div>';
    }).join('');
    var pct = job ? Math.round(job.done * 100 / Math.max(1, job.total)) : 0;
    var unprocessed = S.rows.filter(function (r) { return r.photo && !(r.ai && r.ai.done); }).length;
    var withPhoto = S.rows.filter(function (r) { return r.photo; }).length;
    var avgMs = (function () { var a = S.rows.filter(function (r) { return r.ai && r.ai.durationMs; }); return a.length ? a.reduce(function (s, r) { return s + r.ai.durationMs; }, 0) / a.length : null; })();
    var btns = running ? '<button class="btn btn-dark btn-lg" data-action="stop">' + icon('stop') + 'Hentikan</button>' :
      '<button class="btn btn-lg" data-action="run-page">' + icon('play') + 'Proses halaman ini</button>' +
      '<button class="btn btn-primary btn-lg" data-action="run-all">' + icon('play') + (unprocessed ? 'Proses semua (' + unprocessed + ')' : 'Proses ulang semua (' + withPhoto + ')') + '</button>' +
      '<button class="btn btn-lg" data-action="run-selected"' + (sel ? '' : ' disabled') + '>' + icon('play') + 'Proses yang dipilih (' + sel + ')</button>';
    var statusTxt = running ? 'Memproses ' + job.done + ' / ' + job.total + ' foto · ' + U.fmtNum(job.perSec, 1) + ' foto/detik · ±' + etaTxt(job.eta) + ' lagi'
      : job ? (job.stop ? 'Dihentikan' : 'Selesai') + ': ' + job.done + ' foto diproses' : 'Siap memproses data AI.';
    el.innerHTML = '<div class="view-head"><div><div class="eyebrow">Langkah 2</div><h1>Proses AI</h1><p>Setiap tahap menulis hasil dan alasannya. Klik simpul untuk mengaktifkan atau menonaktifkan tahap. Foto di halaman yang sedang dilihat diproses lebih dulu.</p></div></div>' +
      '<div class="card"><div class="pipeline">' + nodes + '</div>' +
      '<div class="card-pad" style="border-top:1px solid var(--line-2)"><div class="proc-row">' + btns + '</div>' +
      '<div style="margin-top:16px;display:flex;justify-content:space-between;font-size:13.5px"><span id="proc-status">' + esc(statusTxt) + '</span><b class="num" id="proc-count">' + (job ? job.done + ' / ' + job.total + ' (' + pct + '%)' : '0 / ' + withPhoto) + '</b></div>' +
      '<div class="progress' + (running ? ' run' : '') + '" style="margin-top:6px"><i id="proc-bar" style="width:' + pct + '%"></i></div>' +
      '<div class="proc-row" style="margin-top:16px;gap:28px">' +
      procStat(VS.engine.workers(), VS.engine.mode() === 'worker' ? 'Web Worker paralel' : 'thread utama') +
      procStat(job ? U.fmtNum(job.perSec, 1) : '—', 'foto / detik') +
      procStat(avgMs ? U.fmtNum(avgMs / 1000, 2) + ' s' : '—', 'rata-rata per foto') +
      procStat(S.stats.processed + ' / ' + S.stats.total, 'sudah dianalisis') +
      '<div style="flex:1;min-width:200px">' + sparkline() + '</div></div></div></div>' +
      '<div class="card" style="margin-top:16px"><div class="card-head"><h3>Log proses</h3><span class="sub">real-time</span><div class="right">' +
      '<button class="btn btn-ghost btn-sm" data-action="log-copy">' + icon('copy') + 'Salin</button><button class="btn btn-ghost btn-sm" data-action="log-clear">' + icon('trash') + 'Kosongkan log</button></div></div>' +
      '<div class="console" id="proc-console">' + logLines(300) + '</div></div>';
    var con = $('proc-console'); if (con) con.scrollTop = con.scrollHeight;
  }
  function procStat(v, l) { return '<div class="proc-stat"><span class="v">' + v + '</span><span class="l">' + l + '</span></div>'; }
  function etaTxt(s) { if (s == null || !isFinite(s)) return '—'; return s < 60 ? Math.ceil(s) + ' detik' : Math.ceil(s / 60) + ' menit'; }

  function sparkline() {
    var d = S.throughput.slice(-60);
    if (d.length < 2) return '<div class="tiny muted">Grafik throughput muncul saat proses berjalan.</div>';
    var W = 300, H = 46, max = Math.max.apply(null, d.map(function (p) { return p.v; })) || 1;
    var pts = d.map(function (p, i) { return (i * W / (d.length - 1)).toFixed(1) + ',' + (H - 4 - p.v / max * (H - 10)).toFixed(1); }).join(' ');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:46px" role="img" aria-label="Throughput"><polyline points="' + pts + '" fill="none" stroke="var(--link)" stroke-width="2" stroke-linejoin="round"/></svg><div class="tiny muted">Throughput (foto/detik), puncak ' + U.fmtNum(max, 1) + '</div></div>';
  }

  function logLines(n, level) {
    return S.logs.filter(function (l) { return !level || l.level === level; }).slice(-n).map(logLine).join('') || '<div class="ln"><span class="t">--:--:--</span><span class="tag">Siap</span><span class="m">Log kosong.</span></div>';
  }
  function logLine(l) { return '<div class="ln ' + l.level + '"><span class="t">' + U.fmtTime(l.t) + '</span><span class="tag">' + esc(l.tag) + '</span><span class="m">' + esc(l.msg) + '</span></div>'; }

  function needData(title) {
    return '<div class="view-head"><div><h1>' + title + '</h1></div></div><div class="card"><div class="empty">' + icon('db') + '<h3>Belum ada data</h3><p>Muat Excel dan folder foto terlebih dahulu, atau coba data demo.</p>' +
      '<div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-primary" data-action="demo">' + icon('bolt') + 'Coba data demo</button><button class="btn" data-action="nav" data-view="setup">' + icon('upload') + 'Pilih file Excel</button></div></div></div>';
  }

  /* =================== ANTRIAN =================== */
  var ROW_H = 60;
  function renderQueue() {
    var el = $('view-queue');
    if (!S.batch || !S.rows.length) { el.innerHTML = needData('Periksa'); return; }
    var f = S.ui.filter, st = S.stats;
    var opts = function (list, cur) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); };
    var sel = Object.keys(S.ui.checked).length;
    el.innerHTML = '<div class="view-head"><div><div class="eyebrow">Langkah 3</div><h1>Periksa</h1><p>Klik baris untuk membuka inspektor. <kbd>J</kbd>/<kbd>K</kbd> berpindah, <kbd>S</kbd> <kbd>T</kbd> <kbd>R</kbd> memutuskan, <kbd>F</kbd> mode fokus.</p></div>' +
      '<div class="actions"><button class="btn btn-primary" data-action="focus"' + (st.review ? '' : ' disabled') + '>' + icon('focus') + 'Mode fokus (' + st.review + ')</button></div></div>' +
      '<div class="q-top"><div class="card q-strip-card" id="q-strip">' + stripCard() + '</div>' +
      '<div class="toolbar"><div class="search">' + icon('search') + '<input class="input" id="q-search" placeholder="Cari IDPEL, nama pelanggan, atau nomor meter…" value="' + esc(f.q) + '" aria-label="Cari"><kbd>/</kbd></div>' +
      '<select class="input" data-filter="status" aria-label="Filter status">' + opts([['', 'Semua status']].concat(Object.keys(VS.rules.FINAL).map(function (k) { return [k, VS.rules.FINAL[k].label]; })), f.status) + '</select>' +
      '<select class="input" data-filter="cv" aria-label="Filter hasil CV">' + opts([['', 'Semua hasil CV'], ['READABLE', 'Layar terbaca'], ['TIDAK TERBACA', 'Layar tak terbaca'], ['-', 'Belum dianalisis']], f.cv) + '</select>' +
      '<select class="input" data-filter="verif" aria-label="Filter verifikasi">' + opts([['', 'Semua verifikasi'], ['review', 'Perlu review'], ['ai', 'Sesuai AI'], ['manual', 'Sudah diputuskan'], ['belum', 'Belum diputuskan']], f.verif) + '</select>' +
      '<select class="input" data-filter="lokasi" aria-label="Filter lokasi">' + opts([['', 'Semua lokasi'], ['DEKAT', 'Lokasi sesuai'], ['JAUH', 'Lokasi jauh'], ['TANPA_KOORDINAT', 'Tanpa koordinat']], f.lokasi) + '</select>' +
      '<button class="btn btn-ghost" data-action="reset-filter">' + icon('rotate') + 'Reset</button>' +
      '<button class="btn" data-action="export" style="margin-left:auto">' + icon('download') + 'Ekspor Excel</button></div>' +
      '<div id="bulk-slot">' + bulkBar(sel) + '</div></div>' +
      '<div class="qtable" role="grid" aria-label="Antrian verifikasi"><div class="q-scroll"><div class="q-head" role="row"><span><input type="checkbox" class="cbx" id="chk-all" aria-label="Pilih semua di halaman"></span><span>No</span><span>IDPEL</span><span>Nama pelanggan</span><span>Cek</span><span class="r">STAN cater</span><span>STAN AI</span><span>Verifikasi</span><span>Foto · layar</span><span></span></div>' +
      '<div class="q-body" id="q-body"><div id="q-spacer" style="position:relative"></div></div></div>' +
      '<div class="pager" id="q-pager"></div></div>';
    drawRows(true);
    var body = $('q-body');
    body.addEventListener('scroll', function () { drawRows(false); }, { passive: true });
  }

  function stripCard() {
    var st = S.stats;
    return UI.strip(st, S.ui.filter.seg) + '<div class="row2"><span>Sesuai cater <b>' + st.caterSesuai + '</b></span><span>Tidak sesuai cater <b>' + st.caterTidak + '</b></span><span>Tanpa pembanding <b>' + st.caterTanpa + '</b></span>' +
      '<span>Sukses AI <b>' + st.aiSukses + ' / ' + st.total + '</b> (' + U.pct(st.aiSukses, st.total) + ')</span>' + (S.dup.list.length ? '<span>Duplikat <b>' + S.dup.list.length + '</b></span>' : '') + '</div>';
  }

  function bulkBar(n) {
    if (!n) return '';
    var ids = Object.keys(S.ui.checked), aiCount = ids.filter(function (id) { return S.evals[id] && S.evals[id].final === 'sesuai_ai'; }).length;
    return '<div class="bulkbar"><b>' + n + ' dipilih</b>' +
      '<button class="btn btn-sm btn-primary" data-action="bulk-approve"' + (aiCount ? '' : ' disabled') + '>' + icon('check') + 'Setujui ' + aiCount + ' Sesuai AI</button>' +
      '<button class="btn btn-sm" data-action="bulk" data-k="SESUAI">' + icon('check2') + 'Tandai sesuai</button>' +
      '<button class="btn btn-sm" data-action="bulk" data-k="TIDAK_SESUAI">' + icon('x') + 'Tidak sesuai</button>' +
      '<button class="btn btn-sm" data-action="bulk" data-k="RUMAH_TUTUP">' + icon('home') + 'Rumah tutup</button>' +
      '<button class="btn btn-sm" data-action="bulk-clear-decision">' + icon('rotate') + 'Hapus keputusan</button>' +
      '<button class="btn btn-sm" data-action="run-selected">' + icon('play') + 'Proses ulang</button>' +
      '<button class="btn btn-sm" data-action="export-selected">' + icon('download') + 'Ekspor terpilih</button>' +
      '<button class="btn btn-sm btn-ghost" data-action="uncheck" style="margin-left:auto">Batal pilih</button></div>';
  }

  function rowHtml(r, top) {
    var e = S.evals[r.id], u = S.urls[r.id] || {}, sel = S.ui.selectedId === r.id;
    var stanAi = e.stanAI != null ? UI.lcd(e.stanAI, { size: 'sm', len: 5, digits: r.ai && r.ai.stan ? r.ai.stan.digits : [] }) : UI.lcd(null, { size: 'sm', len: 5 });
    var manual = r.verif && r.verif.stanManual != null && r.verif.stanManual !== '' ? '<span class="tag" data-tip="STAN manual">' + icon('id') + esc(r.verif.stanManual) + '</span>' : '';
    var running = r.stage === 'running';
    var warn = e.warnings.length ? ' <span class="tag warn" data-tip="' + esc(e.warnings.map(function (w) { return w.text; }).join('<br>')) + '">' + icon('warn') + e.warnings.length + '</span>' : '';
    return '<div class="q-row' + (sel ? ' sel' : '') + '" role="row" data-id="' + r.id + '" data-action="select" style="position:absolute;left:0;right:0;top:' + top + 'px" tabindex="-1" aria-selected="' + sel + '">' +
      '<span><input type="checkbox" class="cbx" data-check="' + r.id + '"' + (S.ui.checked[r.id] ? ' checked' : '') + ' aria-label="Pilih ' + esc(r.nama) + '"></span>' +
      '<span class="no">' + r.no + '</span><span class="idp">' + r.idpel + '</span>' +
      '<span class="nm">' + esc(r.nama) + '<small>' + esc(r.lokasi || r.alamat || (r.nomorMeter ? 'Meter ' + r.nomorMeter : '')) + '</small></span>' +
      UI.trio(r, e) +
      '<span class="cater">' + (r.stanCater != null ? U.fmtNum(r.stanCater, 0) : '<span class="muted">—</span>') + '</span>' +
      '<span style="display:flex;gap:4px;align-items:center">' + stanAi + manual + '</span>' +
      '<span>' + UI.chip(e.final) + warn + '</span>' +
      '<span class="thumbs"><span class="thumb' + (u.thumb ? '' : ' blank') + (running ? ' running' : '') + '" style="' + (u.thumb ? 'background-image:url(' + u.thumb + ')' : '') + '" data-tip="Foto asli"></span>' +
      '<span class="thumb crop' + (u.crop ? '' : ' blank') + '" style="' + (u.crop ? 'background-image:url(' + u.crop + ')' : '') + '" data-tip="' + (u.crop ? 'Potongan layar LCD' : 'Potongan layar belum ada') + '"></span></span>' +
      '<span class="row-menu"><button class="icon-btn" data-action="open" data-id="' + r.id + '" aria-label="Buka inspektor ' + esc(r.nama) + '" style="width:30px;height:30px">' + icon('eye') + '</button></span></div>';
  }

  var lastRange = null;
  function drawRows(force) {
    var body = $('q-body'), spacer = $('q-spacer');
    if (!body || !spacer) return;
    var pr = UI.pageRows(), rows = pr.rows;
    spacer.style.height = Math.max(rows.length * ROW_H, 1) + 'px';
    if (!rows.length) {
      spacer.innerHTML = '<div class="empty">' + icon('search') + '<h3>Tidak ada baris yang cocok</h3><p>Ubah kata kunci atau reset filter.</p><button class="btn" data-action="reset-filter">Reset filter</button></div>';
      spacer.style.height = 'auto'; lastRange = null; drawPager(pr); return;
    }
    var h = body.clientHeight || 600, first = Math.max(0, Math.floor(body.scrollTop / ROW_H) - 6), last = Math.min(rows.length, Math.ceil((body.scrollTop + h) / ROW_H) + 6);
    var key = first + ':' + last + ':' + rows.length;
    if (!force && key === lastRange) return;
    lastRange = key;
    var html = '';
    for (var i = first; i < last; i++) html += rowHtml(rows[i], i * ROW_H);
    spacer.innerHTML = html;
    drawPager(pr);
    var all = $('chk-all');
    if (all) all.checked = rows.length && rows.every(function (r) { return S.ui.checked[r.id]; });
  }

  function drawPager(pr) {
    var el = $('q-pager'); if (!el) return;
    var total = pr.all.length, ps = S.ui.pageSize, pages = pr.pages || 1, p = S.ui.page;
    var from = total ? pr.start + 1 : 0, to = ps ? Math.min(total, pr.start + ps) : total;
    var btns = '';
    if (ps) {
      btns += '<button data-action="page" data-p="1" aria-label="Halaman pertama">«</button><button data-action="page" data-p="' + Math.max(1, p - 1) + '" aria-label="Sebelumnya">‹</button>';
      var a = Math.max(1, p - 2), b = Math.min(pages, a + 4); a = Math.max(1, b - 4);
      for (var i = a; i <= b; i++) btns += '<button data-action="page" data-p="' + i + '"' + (i === p ? ' aria-current="page"' : '') + '>' + i + '</button>';
      btns += '<button data-action="page" data-p="' + Math.min(pages, p + 1) + '" aria-label="Berikutnya">›</button><button data-action="page" data-p="' + pages + '" aria-label="Halaman terakhir">»</button>';
    }
    el.innerHTML = '<span>Menampilkan ' + from + ' – ' + to + ' dari ' + total + ' data' + (total !== S.rows.length ? ' (tersaring dari ' + S.rows.length + ')' : '') + '</span>' +
      '<select class="input" id="page-size" aria-label="Baris per halaman">' + [[20, '20 / halaman'], [50, '50 / halaman'], [100, '100 / halaman'], [0, 'Semua (gulir)']].map(function (o) {
        return '<option value="' + o[0] + '"' + (ps === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select><div class="pages">' + btns + '</div>';
  }

  function updateRow(row) {
    var n = document.querySelector('.q-row[data-id="' + row.id + '"]');
    if (n) {
      var top = parseFloat(n.style.top) || 0, tmp = document.createElement('div');
      tmp.innerHTML = rowHtml(row, top);
      n.replaceWith(tmp.firstChild);
    }
    var sc = $('q-strip'); if (sc) sc.innerHTML = stripCard();
  }

  function flashRow(id) {
    var n = document.querySelector('.q-row[data-id="' + id + '"]');
    if (n) { n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); }
  }

  function scrollToRow(id) {
    var pr = UI.pageRows(), idx = pr.rows.findIndex(function (r) { return r.id === id; }), body = $('q-body');
    if (idx < 0 || !body) return;
    var top = idx * ROW_H;
    if (top < body.scrollTop) body.scrollTop = top;
    else if (top + ROW_H > body.scrollTop + body.clientHeight) body.scrollTop = top + ROW_H - body.clientHeight;
    drawRows(false);
  }

  /* =================== LAPORAN =================== */
  function renderReport() {
    var el = $('view-report');
    if (!S.batch || !S.rows.length) { el.innerHTML = needData('Laporan'); return; }
    var st = S.stats;
    var sum = [['Total data', st.total], ['Sukses AI', st.aiSukses + ' (' + U.pct(st.aiSukses, st.total) + ')'], ['Valid', st.valid], ['Tidak valid', st.tidakValid],
      ['Rumah tutup', st.rumah_tutup], ['Perlu review', st.review], ['Belum diproses', st.belum], ['Foto duplikat', S.dup.list.length]];
    el.innerHTML = '<div class="view-head"><div><div class="eyebrow">Langkah 4</div><h1>Laporan &amp; ekspor</h1><p>Rekap batch ' + esc(S.batch.nama) + ' — periode ' + periodLabel() + '. Ekspor Excel mempertahankan kode status aplikasi lama dan menambah kolom baru.</p></div>' +
      '<div class="actions"><button class="btn btn-primary" data-action="export">' + icon('download') + 'Ekspor Excel</button><button class="btn" data-action="export-selected"' + (Object.keys(S.ui.checked).length ? '' : ' disabled') + '>' + icon('download') + 'Ekspor terpilih</button><button class="btn" data-action="print">' + icon('print') + 'Cetak ringkasan</button></div></div>' +
      '<div class="grid g-12">' +
      '<div class="card span-4"><div class="card-head"><h3>Ringkasan batch</h3></div><div class="card-pad"><table class="mini-table"><tbody>' + sum.map(function (s) { return '<tr><td>' + s[0] + '</td><td class="r"><b>' + s[1] + '</b></td></tr>'; }).join('') + '</tbody></table>' +
      '<div style="margin-top:14px">' + UI.strip(st, null, { noLegend: false }) + '</div></div></div>' +
      '<div class="card span-8"><div class="card-head"><h3>Rekap per kelurahan</h3><div class="right"><button class="btn btn-ghost btn-sm" data-action="toggle-table" data-target="rep-lok">' + icon('grid') + 'Tabel</button></div></div><div class="card-pad" id="rep-lok">' + groupBars('lokasi') + '</div></div>' +
      '<div class="card span-6"><div class="card-head"><h3>Tingkat review per petugas</h3><span class="sub">bahan evaluasi kualitas foto</span></div><div class="card-pad">' + officerTable() + '</div></div>' +
      '<div class="card span-6"><div class="card-head"><h3>Tingkat review per RBM</h3></div><div class="card-pad" id="rep-rbm">' + groupBars('rbm') + '</div></div>' +
      '<div class="card span-7"><div class="card-head"><h3>Peta titik foto</h3><span class="sub">garis putus = foto jauh dari koordinat pelanggan</span></div><div class="geo-map">' + geoMap(380) + '</div></div>' +
      '<div class="card span-5"><div class="card-head"><h3>Foto duplikat</h3><span class="sub">pHash, jarak ≤ ' + S.settings.dupDistance + '</span></div>' + dupList() + '</div>' +
      '</div>';
  }

  function officerTable() {
    var g = {};
    S.rows.forEach(function (r) {
      var k = r.petugas || '(tanpa petugas)', e = S.evals[r.id], x = g[k] = g[k] || { k: k, n: 0, rev: 0, ulang: 0, ok: 0 };
      x.n++; if (e.final === 'periksa' || e.final === 'ulang') x.rev++; if (e.final === 'ulang') x.ulang++; if (e.final === 'sesuai_ai' || e.final === 'sesuai') x.ok++;
    });
    var list = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.rev / b.n - a.rev / a.n; });
    return '<table class="mini-table"><thead><tr><th>Petugas</th><th class="r">Foto</th><th class="r">Sesuai</th><th class="r">Review</th><th class="r">Foto ulang</th><th>Tingkat review</th></tr></thead><tbody>' +
      list.map(function (x) {
        var p = x.rev * 100 / x.n;
        return '<tr><td><b>' + esc(x.k) + '</b></td><td class="r">' + x.n + '</td><td class="r">' + x.ok + '</td><td class="r">' + x.rev + '</td><td class="r">' + x.ulang + '</td>' +
          '<td style="min-width:120px"><div class="strip" style="height:8px"><span class="seg check" style="flex-grow:' + p + '"></span><span class="seg" style="flex-grow:' + (100 - p) + ';background:transparent"></span></div><span class="tiny num">' + U.fmtNum(p, 0) + '%</span></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function dupList() {
    if (!S.dup.list.length) return '<div class="empty" style="padding:28px">' + icon('check') + '<h3>Tidak ada foto duplikat</h3><div class="tiny">Semua foto berbeda satu sama lain.</div></div>';
    return '<ul class="dup-list">' + S.dup.list.map(function (d) {
      var ua = S.urls[d.a.id] || {}, ub = S.urls[d.b.id] || {};
      return '<li><span class="thumb" style="background-image:url(' + (ua.thumb || '') + ')"></span><span class="thumb" style="background-image:url(' + (ub.thumb || '') + ')"></span>' +
        '<div style="min-width:0"><b>' + esc(d.b.nama) + '</b> memakai foto yang sama dengan <b>' + esc(d.a.nama) + '</b><div class="tiny muted">' + d.b.idpel + ' ↔ ' + d.a.idpel + ' · jarak hash ' + d.dist + '</div></div>' +
        '<button class="btn btn-sm" data-action="open" data-id="' + d.b.id + '" style="margin-left:auto">Buka</button></li>';
    }).join('') + '</ul>';
  }

  /* =================== RIWAYAT =================== */
  function renderHistory() {
    var el = $('view-history');
    if (!S.batch) { el.innerHTML = needData('Riwayat'); return; }
    var q = (S.ui.histQ || '').toLowerCase();
    var list = S.audit.filter(function (a) { return !q || (a.aksi + ' ' + (a.idpel || '') + ' ' + (a.nama || '') + ' ' + a.oleh).toLowerCase().indexOf(q) >= 0; });
    el.innerHTML = '<div class="view-head"><div><div class="eyebrow">Audit</div><h1>Riwayat perubahan</h1><p>Setiap perubahan STAN manual dan keputusan tercatat: siapa, kapan, sebelum dan sesudah. Riwayat tidak dapat diubah dari antarmuka dan ikut terekspor.</p></div></div>' +
      '<div class="toolbar" style="margin-bottom:12px"><div class="search">' + icon('search') + '<input class="input" id="hist-search" placeholder="Cari aksi, IDPEL, nama, verifikator…" value="' + esc(S.ui.histQ || '') + '"></div><span class="tag">' + list.length + ' entri</span></div>' +
      '<div class="card">' + (list.length ? '<div style="overflow:auto"><table class="mini-table"><thead><tr><th>Waktu</th><th>Oleh</th><th>Aksi</th><th>IDPEL</th><th>Nama</th><th>Sebelum</th><th>Sesudah</th></tr></thead><tbody>' +
        list.slice(0, 1000).map(function (a) {
          return '<tr><td class="num">' + U.fmtDateTime(a.t) + '</td><td>' + esc(a.oleh) + '</td><td><b>' + esc(a.aksi) + '</b></td><td class="num">' + esc(a.idpel || '—') + '</td><td>' + esc(a.nama || '—') + '</td><td class="tiny">' + fmtObj(a.sebelum) + '</td><td class="tiny">' + fmtObj(a.sesudah) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="empty">' + icon('history') + '<h3>Belum ada perubahan</h3><p>Keputusan dan koreksi STAN akan tercatat di sini.</p></div>') + '</div>';
  }
  function fmtObj(o) {
    if (o == null) return '—';
    if (typeof o !== 'object') return esc(o);
    return Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== ''; }).map(function (k) { return esc(k) + ': <b>' + esc(o[k]) + '</b>'; }).join('<br>') || '—';
  }

  /* =================== PENGATURAN =================== */
  function openSettings() {
    var s = S.settings;
    function num(k, label, step, hint) { return '<label>' + label + (hint ? ' <small>' + hint + '</small>' : '') + '<input class="input" type="number" step="' + (step || 1) + '" data-set="' + k + '" value="' + s[k] + '"></label>'; }
    function sw(k, label) { return '<label class="switch"><input type="checkbox" data-set="' + k + '"' + (s[k] ? ' checked' : '') + '>' + label + '</label>'; }
    var offices = s.offices.map(function (o, i) {
      return '<tr><td><input class="input" data-off="' + i + '" data-f="nama" value="' + esc(o.nama) + '"></td><td><input class="input" data-off="' + i + '" data-f="level" value="' + esc(o.level) + '" style="width:70px"></td>' +
        '<td><input class="input" type="number" step="0.0001" data-off="' + i + '" data-f="lat" value="' + o.lat + '"></td><td><input class="input" type="number" step="0.0001" data-off="' + i + '" data-f="lon" value="' + o.lon + '"></td>' +
        '<td><button class="icon-btn" data-del-off="' + i + '" aria-label="Hapus kantor">' + icon('trash') + '</button></td></tr>';
    }).join('');
    UI.modal({
      title: 'Pengaturan', width: 820,
      body: '<div class="form-sec">Ambang AI</div><div class="form-grid">' +
        num('minConfidence', 'Keyakinan STAN minimum', 0.05, '0–1, per digit') + num('minAgree', 'Bacaan konsisten minimum', 1, 'dari 3 varian') +
        num('minSharpness', 'Ketajaman minimum', 10, 'varians Laplacian') + num('minBrightness', 'Kecerahan minimum', 1, '0–255') +
        num('maxColorfulness', 'Batas colorfulness (foto stok)', 1) + num('dupDistance', 'Jarak pHash duplikat', 1, '≤ dianggap sama') + '</div>' +
        '<div class="form-sec">Aturan bisnis</div><div class="form-grid">' +
        num('caterTolerance', 'Toleransi selisih STAN cater', 0.1, 'kWh') + num('radiusPelangganKm', 'Radius koordinat pelanggan', 0.1, 'km') +
        num('radiusKantorKm', 'Radius kantor rujukan', 1, 'km, bila tanpa koordinat pelanggan') + '<span></span>' +
        sw('caterMismatchReview', 'Selisih dengan STAN cater wajib direview') + sw('periodReview', 'Foto di luar periode wajib direview') + '</div>' +
        '<div class="form-sec">Kantor rujukan</div><div style="overflow:auto"><table class="mini-table"><thead><tr><th>Nama</th><th>Level</th><th>Lat</th><th>Lon</th><th></th></tr></thead><tbody id="off-body">' + offices + '</tbody></table></div>' +
        '<button class="btn btn-sm" style="margin-top:8px" data-add-off>' + icon('plus') + 'Tambah kantor</button>' +
        '<div class="form-sec">Mesin AI</div><div class="form-grid">' + num('workers', 'Jumlah worker paralel', 1, 'core CPU: ' + (navigator.hardwareConcurrency || '?')) +
        sw('ocrEnabled', 'OCR teks stempel & stiker (Tesseract.js, unduh ±10 MB saat pertama, perlu internet)') + '</div>' +
        '<div class="form-sec">Tampilan &amp; verifikator</div><div class="form-grid">' +
        '<label>Nama verifikator<input class="input" data-set="verifikator" value="' + esc(s.verifikator) + '"></label>' +
        '<label>Tema<select class="input" data-set="theme"><option value="auto"' + (s.theme === 'auto' ? ' selected' : '') + '>Ikuti sistem</option><option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Terang</option><option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Gelap</option></select></label>' +
        sw('autoAdvance', 'Pindah otomatis ke baris berikutnya setelah keputusan') + '</div>',
      foot: '<button class="btn" data-reset-set>Kembalikan bawaan</button><span style="flex:1"></span><button class="btn" data-close>Batal</button><button class="btn btn-dark" data-save-set>Simpan</button>',
      onMount: function (m, close) {
        var offices = JSON.parse(JSON.stringify(s.offices));
        m.addEventListener('click', function (e) {
          var d = e.target.closest('[data-del-off]');
          if (d) { offices.splice(+d.getAttribute('data-del-off'), 1); d.closest('tr').remove(); }
          if (e.target.closest('[data-add-off]')) {
            offices.push({ id: U.uid('o_'), nama: 'Kantor baru', level: 'ULP', lat: -1.0447, lon: 117.115 });
            var i = offices.length - 1, tr = document.createElement('tr');
            tr.innerHTML = '<td><input class="input" data-off="' + i + '" data-f="nama" value="Kantor baru"></td><td><input class="input" data-off="' + i + '" data-f="level" value="ULP" style="width:70px"></td><td><input class="input" type="number" step="0.0001" data-off="' + i + '" data-f="lat" value="-1.0447"></td><td><input class="input" type="number" step="0.0001" data-off="' + i + '" data-f="lon" value="117.115"></td><td></td>';
            m.querySelector('#off-body').appendChild(tr);
          }
          if (e.target.closest('[data-reset-set]')) {
            m.querySelectorAll('[data-set]').forEach(function (inp) {
              var k = inp.getAttribute('data-set'), v = VS.rules.DEFAULT_SETTINGS[k];
              if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v;
            });
          }
          if (e.target.closest('[data-save-set]')) {
            var next = Object.assign({}, s), oldWorkers = s.workers;
            m.querySelectorAll('[data-set]').forEach(function (inp) {
              var k = inp.getAttribute('data-set');
              next[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? Number(inp.value) : inp.value;
            });
            m.querySelectorAll('[data-off]').forEach(function (inp) {
              var o = offices[+inp.getAttribute('data-off')]; if (!o) return;
              var f = inp.getAttribute('data-f'); o[f] = f === 'lat' || f === 'lon' ? Number(inp.value) : inp.value;
            });
            next.offices = offices.filter(Boolean);
            next.workers = Math.max(1, Math.min(16, next.workers | 0));
            S.settings = next;
            VS.store.saveSettings();
            VS.store.audit('Ubah pengaturan', null, null, { minConfidence: next.minConfidence, radiusPelangganKm: next.radiusPelangganKm, caterTolerance: next.caterTolerance });
            if (next.workers !== oldWorkers) VS.engine.init(next.workers);
            if (next.ocrEnabled) VS.engine.loadTesseract().catch(function (err) { U.toast(err.message, 'warn', 5000); });
            VS.app.applyTheme();
            VS.store.recompute();
            close();
            U.toast('Pengaturan disimpan', 'ok');
            VS.app.renderAll();
          }
        });
      }
    });
  }

  function openKeys() {
    var keys = [['/', 'Fokus ke pencarian'], ['J / ↓', 'Baris berikutnya'], ['K / ↑', 'Baris sebelumnya'], ['Enter', 'Buka inspektor'], ['S', 'Sesuai'], ['T', 'Tidak sesuai'], ['R', 'Rumah tutup'],
      ['E', 'Ubah STAN final'], ['B', 'Tampilkan/sembunyikan kotak deteksi'], ['Z', 'Zoom 1:1 / pas'], ['F', 'Mode fokus'], ['X', 'Pilih/batal pilih baris'], ['Esc', 'Tutup inspektor / keluar mode fokus'], ['?', 'Daftar pintasan'],
      ['G lalu D/P/Q/L', 'Pindah ke Dasbor / Proses / Periksa / Laporan']];
    UI.modal({ title: 'Pintasan keyboard', width: 520, body: '<table class="keys-table"><tbody>' + keys.map(function (k) { return '<tr><td>' + k[0].split(' ').map(function (x) { return x === '/' && k[0] !== '/' ? ' / ' : x === 'lalu' ? ' lalu ' : '<kbd>' + esc(x) + '</kbd>'; }).join('') + '</td><td>' + k[1] + '</td></tr>'; }).join('') + '</tbody></table>' });
  }

  VS.views = {
    renderDash: renderDash, renderSetup: renderSetup, renderProcess: renderProcess, renderQueue: renderQueue, renderReport: renderReport, renderHistory: renderHistory,
    drawRows: drawRows, updateRow: updateRow, flashRow: flashRow, scrollToRow: scrollToRow, bulkBar: bulkBar, stripCard: stripCard, logLine: logLine, logLines: logLines,
    openSettings: openSettings, openKeys: openKeys, geoMap: geoMap, sparkline: sparkline, etaTxt: etaTxt, nodeStats: nodeStats
  };
})();
