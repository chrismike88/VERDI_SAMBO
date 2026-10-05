/* VERDI SAMBO — generator data demo.
 * Membuat 36 pelanggan fiktif wilayah ULP Samboja beserta foto kWh meter
 * sintetis (layar LCD 7-segmen, keypad, stiker petugas, stempel kamera).
 * Variasi kasus sengaja dibuat agar seluruh aturan bisnis teruji:
 * layar mati, foto buram, foto stok, silau, duplikat, stiker hilang,
 * lokasi jauh, foto bulan lalu, STAN cater berbeda/kosong.
 */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var SEG = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd',
    '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'
  };

  function segPoly(ctx, s, x, y, w, h, t) {
    var g = t * 0.18, hh = h / 2, P;
    function H(x0, x1, yc) { return [[x0 + g, yc], [x0 + t / 2 + g, yc - t / 2], [x1 - t / 2 - g, yc - t / 2], [x1 - g, yc], [x1 - t / 2 - g, yc + t / 2], [x0 + t / 2 + g, yc + t / 2]]; }
    function V(xc, y0, y1) { return [[xc, y0 + g], [xc + t / 2, y0 + t / 2 + g], [xc + t / 2, y1 - t / 2 - g], [xc, y1 - g], [xc - t / 2, y1 - t / 2 - g], [xc - t / 2, y0 + t / 2 + g]]; }
    var L = x + t / 2, R = x + w - t / 2, T = y + t / 2, B = y + h - t / 2, M = y + hh;
    switch (s) {
      case 'a': P = H(L, R, T); break;
      case 'd': P = H(L, R, B); break;
      case 'g': P = H(L, R, M); break;
      case 'f': P = V(L, T, M); break;
      case 'b': P = V(R, T, M); break;
      case 'e': P = V(L, M, B); break;
      case 'c': P = V(R, M, B); break;
    }
    ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
    ctx.closePath(); ctx.fill();
  }

  function drawDigit(ctx, ch, x, y, w, h, t, on, ghost) {
    'abcdefg'.split('').forEach(function (s) {
      ctx.fillStyle = ghost; segPoly(ctx, s, x, y, w, h, t);
    });
    if (ch === ' ' || ch == null) return;
    var segs = SEG[ch] || '';
    ctx.fillStyle = on;
    segs.split('').forEach(function (s) { segPoly(ctx, s, x, y, w, h, t); });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function noise(ctx, w, h, amt, R) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (R() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];

  /* opsi: { stan, variant, nama, idpel, nomorMeter, alamat, lat, lon, tanggal, stiker, seed } */
  function drawMeterPhoto(o) {
    var W = 1040, Hh = 780, c = document.createElement('canvas');
    c.width = W; c.height = Hh;
    var ctx = c.getContext('2d'), R = rng(o.seed || 1), v = o.variant || 'ok';

    // latar: dinding rumah atau latar produk (foto stok)
    if (v === 'stock') {
      var bg = ctx.createLinearGradient(0, 0, 0, Hh);
      bg.addColorStop(0, '#0B4FB3'); bg.addColorStop(1, '#3FA0F5');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      for (var k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(120 + k * 170, 680 - k * 40, 60 + k * 8, 0, 7); ctx.fill(); }
    } else {
      var wallHue = [[204, 186, 166], [214, 200, 190], [188, 176, 168], [222, 211, 196]][Math.floor(R() * 4)];
      ctx.fillStyle = 'rgb(' + wallHue.join(',') + ')'; ctx.fillRect(0, 0, W, Hh);
      // papan kayu / tekstur
      ctx.strokeStyle = 'rgba(90,60,40,.18)'; ctx.lineWidth = 2;
      for (var y = 40; y < Hh; y += 56 + R() * 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + R() * 6 - 3); ctx.stroke(); }
      // kabel
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(470, 0); ctx.bezierCurveTo(480, 40, 500, 60, 500, 96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(560, 700); ctx.bezierCurveTo(560, 740, 600, 760, 640, 780); ctx.stroke();
    }

    ctx.save();
    // variasi posisi & jarak kamera antarfoto
    var sc = 0.86 + R() * 0.2, ox = (R() - 0.5) * 150, oy = (R() - 0.5) * 50;
    ctx.translate(W / 2 + ox, Hh / 2 + oy - 20); ctx.scale(sc, sc); ctx.translate(-W / 2, -Hh / 2);
    if (v === 'tilt') { ctx.translate(W / 2, Hh / 2); ctx.rotate(-0.06); ctx.translate(-W / 2, -Hh / 2); }

    // casing meter
    var mx = 300, my = 92, mw = 440, mh = 590;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; roundRect(ctx, mx + 12, my + 16, mw, mh, 26); ctx.fill();
    var cg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
    cg.addColorStop(0, '#F3F4EF'); cg.addColorStop(1, '#D6D8D0');
    ctx.fillStyle = cg; roundRect(ctx, mx, my, mw, mh, 26); ctx.fill();
    ctx.strokeStyle = '#B9BCB2'; ctx.lineWidth = 3; ctx.stroke();

    if (v === 'stock') {
      // logo warna-warni pabrikan
      ['#E53935', '#FDD835', '#43A047', '#1E88E5'].forEach(function (col, i) {
        ctx.fillStyle = col; ctx.fillRect(mx + 30 + i * 46, my + 26, 40, 22);
      });
    }
    ctx.fillStyle = '#5B6470'; ctx.font = '600 20px Arial';
    ctx.fillText('kWh METER PRABAYAR', mx + 110, my + 44);

    // bingkai + LCD
    var lx = mx + 50, ly = my + 72, lw = 340, lh = 124;
    ctx.fillStyle = '#3C4148'; roundRect(ctx, lx - 12, ly - 12, lw + 24, lh + 24, 10); ctx.fill();
    var lcdOff = v === 'off';
    ctx.fillStyle = lcdOff ? '#3A4136' : (v === 'faint' ? '#C3CDAA' : '#BFCBA0');
    ctx.fillRect(lx, ly, lw, lh);
    if (!lcdOff) {
      var ink = v === 'faint' ? 'rgba(30,42,28,.42)' : '#1E2A1C', ghost = 'rgba(30,42,28,.055)';
      // indikator sinyal (kiri)
      ctx.fillStyle = ink;
      for (var b = 0; b < 4; b++) ctx.fillRect(lx + 12 + b * 7, ly + 30 - b * 6, 5, 8 + b * 6);
      // digit
      var dh = 72, dw = 33, dt = 9, gap = 10, n = 6, s = String(o.stan == null ? '' : o.stan);
      while (s.length < n) s = ' ' + s;
      var startX = lx + 44, dy = ly + 26;
      for (var i = 0; i < n; i++) drawDigit(ctx, s[i], startX + i * (dw + gap), dy, dw, dh, dt, ink, ghost);
      ctx.fillStyle = ink; ctx.font = '700 15px Arial'; ctx.fillText('kWh', lx + lw - 38, ly + lh - 10);
      if (v === 'glare') {
        var gr = ctx.createRadialGradient(lx + 230, ly + 52, 4, lx + 230, ly + 52, 120);
        gr.addColorStop(0, 'rgba(255,255,255,.96)'); gr.addColorStop(0.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(lx, ly, lw, lh);
      }
    }

    // keypad 4x3
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '↵'];
    for (var r = 0; r < 4; r++) for (var cI = 0; cI < 3; cI++) {
      var kx = mx + 95 + cI * 88, ky = my + 248 + r * 62;
      ctx.fillStyle = '#2E3238'; roundRect(ctx, kx, ky, 70, 46, 9); ctx.fill();
      ctx.fillStyle = '#F2F2F2'; ctx.font = '600 22px Arial'; ctx.fillText(keys[r * 3 + cI], kx + 28, ky + 31);
    }
    // pelat nomor meter
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx + 70, my + 512, 300, 46);
    ctx.strokeStyle = '#9AA0A8'; ctx.lineWidth = 2; ctx.strokeRect(mx + 70, my + 512, 300, 46);
    ctx.fillStyle = '#111'; ctx.font = '700 22px "Courier New", monospace';
    var nm = o.nomorMeter || '';
    ctx.fillText(nm.replace(/(\d{2})(\d{4})(\d{4})(\d)/, '$1 $2 $3 $4'), mx + 92, my + 543);

    // stiker petugas
    if (o.stiker) {
      ctx.save(); ctx.translate(mx + 18, my + 430); ctx.rotate(-0.08);
      ctx.fillStyle = '#F2C94C'; ctx.fillRect(0, 0, 120, 62);
      ctx.fillStyle = '#3B2F06'; ctx.font = '800 17px Arial';
      ctx.fillText('LPB SMB', 12, 25); ctx.fillText(o.stiker, 12, 49);
      ctx.restore();
    }
    ctx.restore();

    if (v === 'blur') { var tmp = document.createElement('canvas'); tmp.width = W; tmp.height = Hh; tmp.getContext('2d').drawImage(c, 0, 0); ctx.filter = 'blur(13px)'; ctx.drawImage(tmp, 0, 0); ctx.filter = 'none'; }
    if (v === 'dark') { ctx.fillStyle = 'rgba(0,0,0,.86)'; ctx.fillRect(0, 0, W, Hh); }
    if (v !== 'stock') noise(ctx, W, Hh, 14, R);

    // stempel kamera
    if (v !== 'stock') {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, Hh - 132, W, 132);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '600 20px Arial';
      var lines = ['Nama : ' + o.nama, 'Idpel : ' + o.overlayIdpel, 'Alamat : ' + o.alamat,
        'Lat/Lon : ' + o.lat.toFixed(6) + ', ' + o.lon.toFixed(6), 'Tanggal : ' + o.tanggal];
      lines.forEach(function (t, i) { ctx.fillText(t, 22, Hh - 108 + i * 23); });
    }
    return new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.86); });
  }

  var NAMES = ['KARMIANTO', 'ALPIANOR', 'HUSNAH', 'LENOTO', 'LESMAN', 'RAJIBUN', 'PENDRI', 'MMUBIN', 'WAIDJIN', 'MUNSAI',
    'KRISNO', 'BATHIN', 'AYAMANTO', 'SITI ARAFAH', 'H. MUHAMMAD NOOR', 'RUSDIANSYAH', 'NORHAYATI', 'SUPRIADI', 'MASNAH', 'JUMRANI',
    'ABDUL GANI', 'SAMSUL BAHRI', 'IRMAWATI', 'YUSUF LATIF', 'DARMAWATI', 'HAIRUL ANAM', 'SUKARNI', 'ROSMIATI', 'BAHTIAR', 'FITRIANI',
    'SYAHRANI', 'MULYADI', 'NURLAILA', 'ANDI BASO', 'HASANUDDIN', 'SRI WAHYUNI'];
  var KEL = [
    ['Sungai Merdeka', -0.9478, 117.0465], ['Amborawang Laut', -1.0123, 117.0904], ['Amborawang Darat', -0.9897, 117.0583],
    ['Teluk Pemedas', -1.0702, 117.1556], ['Margomulyo', -1.0368, 117.1182], ['Sanipah', -1.0516, 117.1641],
    ['Handil Baru', -1.0233, 117.1937], ['Muara Sembilang', -1.0890, 117.1725], ['Kampung Lama', -1.0447, 117.1323],
    ['Wonotirto', -1.0015, 117.1218], ['Karya Jaya', -1.0634, 117.0947], ['Tani Bhakti', -0.9701, 117.0812]
  ];
  var RBM = ['SMB-01', 'SMB-02', 'SMB-03', 'SMB-04'];
  var PETUGAS = ['SMB', 'AMB', 'RDN', 'FTH'];

  /* skenario per indeks pelanggan */
  var SCEN = {
    1: { variant: 'off' }, 6: { variant: 'off' }, 7: { variant: 'blur' }, 8: { variant: 'stock' }, 9: { variant: 'dark' },
    10: { noSticker: true }, 11: { noSticker: true }, 12: { noSticker: true, far: true },
    13: { variant: 'glare' }, 14: { variant: 'faint' }, 15: { variant: 'tilt' },
    16: { prevMonth: true }, 17: { prevMonth: true, stickerPrev: true }, 18: { caterDiff: 37 }, 19: { caterDiff: -120 },
    20: { caterEmpty: true }, 21: { caterEmpty: true }, 22: { far: true }, 23: { dupOf: 4 }, 24: { overlayMeter: true },
    25: { variant: 'glare' }, 30: { far: true, noSticker: true }
  };

  async function buildDemo(period) {
    var R = rng(20261005), rows = [], files = [];
    var mIdx = (period && period.month) || 9, yr = (period && period.year) || 2026;
    var blobs = {};
    for (var i = 0; i < NAMES.length; i++) {
      var sc = SCEN[i] || {};
      var kel = KEL[i % KEL.length];
      var idpel = '2321' + pad(Math.floor(10000000 + R() * 89999999), 8);
      var nomorMeter = (i % 3 === 0 ? '14' : '45') + pad(Math.floor(R() * 999999999), 9);
      var stan = Math.floor(200 + R() * 9500);
      if (i === 3) stan = 2771;
      if (i === 1) stan = 4699;
      var lat = kel[1] + (R() - 0.5) * 0.006, lon = kel[2] + (R() - 0.5) * 0.006;
      var plat = lat, plon = lon;
      if (sc.far) { plat = lat - 0.09 - R() * 0.05; plon = lon - 0.12; }
      var mm = sc.prevMonth ? mIdx - 1 : mIdx, yy = yr;
      if (mm < 1) { mm = 12; yy--; }
      var day = 2 + Math.floor(R() * 24), hh = 7 + Math.floor(R() * 9), mi = Math.floor(R() * 60), ss = Math.floor(R() * 60);
      var tanggal = pad(mm, 2) + '/' + pad(day, 2) + '/' + yy + ' ' + pad(hh, 2) + ':' + pad(mi, 2) + ':' + pad(ss, 2);
      var stMonth = sc.stickerPrev || sc.prevMonth ? (mIdx === 1 ? 12 : mIdx - 1) : mIdx;
      var stiker = sc.noSticker ? null : MONTHS[stMonth - 1] + ' ' + (stMonth > mIdx ? yr - 1 : yr);
      var cater = sc.caterEmpty ? null : stan + (sc.caterDiff || 0);
      if (!sc.caterEmpty && !sc.caterDiff && R() < 0.15) cater = stan + 1;
      var alamat = 'RT ' + pad(1 + Math.floor(R() * 30), 2) + ' Kel. ' + kel[0] + ', Samboja';
      var row = {
        IDPEL: idpel, NAMA: NAMES[i], NOMOR_METER: nomorMeter, STAN_CATER: cater, ALAMAT: alamat,
        LOKASI: kel[0], RBM: RBM[i % RBM.length], PETUGAS: PETUGAS[i % PETUGAS.length], LAT: +lat.toFixed(6), LON: +lon.toFixed(6)
      };
      rows.push(row);
      var meta = {
        nama: NAMES[i], overlayIdpel: sc.overlayMeter ? nomorMeter : idpel, alamat: alamat,
        lat: plat, lon: plon, tanggal: tanggal, stiker: stiker, stan: stan, nomorMeter: nomorMeter,
        variant: sc.variant || 'ok', seed: 1000 + i
      };
      var blob;
      if (sc.dupOf != null && blobs[sc.dupOf]) blob = blobs[sc.dupOf].blob;
      else blob = await drawMeterPhoto(meta);
      blobs[i] = { blob: blob, meta: meta };
      var fname = idpel + '.jpg';
      var f = new File([blob], fname, { type: 'image/jpeg', lastModified: Date.now() });
      f._demoOverlay = sc.dupOf != null ? blobs[sc.dupOf].meta : meta;
      files.push(f);
    }
    // satu foto tanpa pasangan untuk menguji laporan pemasangan
    var orphan = await drawMeterPhoto({ nama: 'TIDAK DIKENAL', overlayIdpel: '232199999999', alamat: '-', lat: -1.04, lon: 117.1, tanggal: '09/10/2026 10:00:00', stan: 1234, nomorMeter: '45000000000', seed: 77, stiker: 'SEP 2026' });
    files.push(new File([orphan], '232199999999.jpg', { type: 'image/jpeg' }));
    return { rows: rows, files: files };
  }

  VS.demo = { buildDemo: buildDemo, drawMeterPhoto: drawMeterPhoto, MONTHS: MONTHS };
})();
