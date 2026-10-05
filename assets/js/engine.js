/* VERDI SAMBO — mesin pemrosesan: kumpulan Web Worker paralel + antrean job. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util, S = VS.state, ST = VS.store;

  var pool = [], mode = 'main', ready = null, seq = 0, pending = {};

  function workerSource() {
    return 'var CV = (' + VS_CV_FACTORY.toString() + ')();\n' +
      'self.onmessage = function (e) {\n' +
      '  var m = e.data;\n' +
      '  if (m.ping) { self.postMessage({ pong: true, offscreen: typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined" }); return; }\n' +
      '  CV.processPhoto(m.blob, m.opt).then(function (r) { self.postMessage({ id: m.id, ok: true, r: r }); })\n' +
      '    .catch(function (err) { self.postMessage({ id: m.id, ok: false, error: String(err && err.message || err) }); });\n' +
      '};';
  }

  function makePool(n) {
    pool.forEach(function (w) { w.worker.terminate(); });
    pool = [];
    var url;
    try { url = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' })); } catch (e) { return Promise.resolve('main'); }
    var probes = [];
    for (var i = 0; i < n; i++) {
      (function () {
        var w;
        try { w = new Worker(url); } catch (e) { return; }
        var slot = { worker: w, busy: false };
        probes.push(new Promise(function (res) {
          var to = setTimeout(function () { res(false); }, 2500);
          w.onmessage = function (e) {
            if (e.data && e.data.pong) { clearTimeout(to); res(!!e.data.offscreen); w.onmessage = onMsg(slot); return; }
          };
          w.onerror = function () { clearTimeout(to); res(false); };
          w.postMessage({ ping: true });
        }));
        pool.push(slot);
      })();
    }
    return Promise.all(probes).then(function (oks) {
      var good = oks.length && oks.every(Boolean);
      if (!good) { pool.forEach(function (s) { s.worker.terminate(); }); pool = []; }
      return good ? 'worker' : 'main';
    });
  }

  function onMsg(slot) {
    return function (e) {
      var m = e.data, p = pending[m.id];
      slot.busy = false;
      if (!p) return;
      delete pending[m.id];
      if (m.ok) p.res(m.r); else p.rej(new Error(m.error));
    };
  }

  function init(n) {
    ready = makePool(n || S.settings.workers).then(function (m) {
      mode = m;
      VS.bus.emit('engine', { mode: mode, workers: mode === 'worker' ? pool.length : 1 });
      return m;
    });
    return ready;
  }

  function analyze(blob, opt) {
    if (mode !== 'worker') return VS.cv.processPhoto(blob, opt);
    return new Promise(function (res, rej) {
      var slot = pool.filter(function (s) { return !s.busy; })[0] || pool[seq % pool.length];
      slot.busy = true;
      var id = ++seq;
      pending[id] = { res: res, rej: rej };
      slot.worker.postMessage({ id: id, blob: blob, opt: opt });
    });
  }

  // ---------- OCR opsional (Tesseract.js dari CDN) ----------
  var tessP = null;
  function loadTesseract() {
    if (tessP) return tessP;
    tessP = new Promise(function (res, rej) {
      if (window.Tesseract) return res(window.Tesseract);
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = function () { res(window.Tesseract); };
      s.onerror = function () { tessP = null; rej(new Error('Tesseract.js gagal dimuat (perlu internet).')); };
      document.head.appendChild(s);
    });
    return tessP;
  }

  function parseOverlay(text) {
    var o = {}, m;
    if ((m = text.match(/Nama\s*[:;]\s*(.+)/i))) o.nama = m[1].trim();
    if ((m = text.match(/Id\s*pel\s*[:;]\s*([\d\s]{11,16})/i))) o.idpel = m[1].replace(/\s/g, '');
    if ((m = text.match(/Alamat\s*[:;]\s*(.+)/i))) o.alamat = m[1].trim();
    if ((m = text.match(/Lat\s*\/?\s*Lon\s*[:;]\s*(-?\d+[.,]\d+)[,\s]+(-?\d+[.,]\d+)/i))) { o.lat = +m[1].replace(',', '.'); o.lon = +m[2].replace(',', '.'); }
    if ((m = text.match(/Tanggal\s*[:;]\s*([\d\/]+\s+[\d:]+)/i))) o.tanggal = m[1].trim();
    return o;
  }

  function parseStickerText(text) {
    var m = String(text).toUpperCase().match(/\b(JAN|FEB|MAR|APR|MEI|JUN|JUL|AGT|AGU|SEP|OKT|NOV|DES)\w*\s*['`]?\s*(20\d{2}|\d{2})\b/);
    if (!m) return null;
    var idx = U.BULAN_SINGKAT.indexOf(m[1] === 'AGU' ? 'AGT' : m[1]);
    var yr = m[2].length === 2 ? 2000 + +m[2] : +m[2];
    return { month: idx + 1, year: yr, label: U.BULAN[idx] + ' ' + yr, source: 'ocr' };
  }

  async function ocrRegions(blob, ai) {
    var T = await loadTesseract();
    var bmp = await createImageBitmap(blob), out = {};
    function region(x, y, w, h, scale) {
      var c = document.createElement('canvas');
      c.width = Math.round(w * bmp.width * scale); c.height = Math.round(h * bmp.height * scale);
      c.getContext('2d').drawImage(bmp, x * bmp.width, y * bmp.height, w * bmp.width, h * bmp.height, 0, 0, c.width, c.height);
      return c;
    }
    var band = await T.recognize(region(0, 0.8, 0.75, 0.2, 1.4), 'eng');
    out.overlay = parseOverlay(band.data.text);
    if (ai.sticker && ai.sticker.found) {
      var b = ai.sticker.box;
      var st = await T.recognize(region(Math.max(0, b.x - 0.01), Math.max(0, b.y - 0.01), Math.min(1, b.w + 0.02), Math.min(1, b.h + 0.02), 2.5), 'eng');
      out.sticker = parseStickerText(st.data.text);
    }
    if (bmp.close) bmp.close();
    return out;
  }

  // ---------- job ----------
  function stageOpts() {
    var st = S.batch.stages || {};
    return {
      stages: { gate1: st.gate1 !== false, crop: st.crop !== false, stan: st.stan !== false, sticker: st.sticker !== false },
      thresholds: { minBrightness: S.settings.minBrightness, minSharpness: S.settings.minSharpness, maxColorfulness: S.settings.maxColorfulness }
    };
  }

  async function processRow(row) {
    var blob = await ST.getPhotoBlob(row);
    if (!blob) throw new Error('Berkas foto tidak tersedia. Pilih ulang folder foto.');
    var t0 = performance.now();
    var r = await analyze(blob, stageOpts());
    var ai = {
      done: true, processedAt: Date.now(), durationMs: Math.round(performance.now() - t0), gate1: r.gate1, quality: r.quality,
      lcdBox: r.lcdBox || null, stan: r.stan || null, sticker: r.sticker || null, phash: r.phash, sig: r.sig, width: r.width, height: r.height,
      overlay: null, exif: null, stickerMonth: null, models: { cv: 'verdi-cv-1.0', seg7: 'seg7-heuristic-1.0' }
    };
    if (r.thumb) await ST.putBlob(row.id, 'thumb', r.thumb);
    if (r.crop) await ST.putBlob(row.id, 'crop', r.crop); else ST.setBlobUrl(row.id, 'crop', null);

    // metadata stempel: dari data demo, EXIF, atau OCR
    var d = row.demoMeta || blob._demoOverlay;
    if (d) {
      ai.overlay = { nama: d.nama, idpel: d.overlayIdpel, alamat: d.alamat, lat: d.lat, lon: d.lon, tanggal: d.tanggal, source: 'demo' };
      if (d.stiker && r.sticker && r.sticker.found) ai.stickerMonth = Object.assign(parseStickerText(d.stiker) || {}, { source: 'demo' });
    }
    if (window.exifr && !d) {
      try {
        var ex = await exifr.parse(blob, { gps: true, pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude', 'Model', 'Make'] });
        if (ex) ai.exif = { date: (ex.DateTimeOriginal || ex.CreateDate) ? new Date(ex.DateTimeOriginal || ex.CreateDate).getTime() : null, lat: ex.latitude, lon: ex.longitude, kamera: [ex.Make, ex.Model].filter(Boolean).join(' ') };
      } catch (e) { /* tanpa EXIF */ }
    }
    if (S.settings.ocrEnabled && !d) {
      try {
        var o = await ocrRegions(blob, ai);
        if (o.overlay && Object.keys(o.overlay).length) ai.overlay = Object.assign({ source: 'ocr' }, o.overlay);
        if (o.sticker) ai.stickerMonth = o.sticker;
      } catch (e) { ST.log('OCR', e.message, 'warn'); }
    }
    return ai;
  }

  function orderRows(ids) {
    // prioritas: baris di halaman aktif lebih dulu (crop tampil seketika)
    var vis = {};
    (VS.ui && VS.ui.visibleIds ? VS.ui.visibleIds() : []).forEach(function (id) { vis[id] = true; });
    return ids.slice().sort(function (a, b) { return (vis[b] ? 1 : 0) - (vis[a] ? 1 : 0); });
  }

  async function run(scope, ids) {
    if (S.job && S.job.running) return;
    await ready;
    var rows = ids.map(function (id) { return S.byId[id]; }).filter(function (r) { return r && r.photo; });
    if (!rows.length) { U.toast('Tidak ada baris dengan foto untuk diproses.', 'warn'); return; }
    var queue = orderRows(rows.map(function (r) { return r.id; }));
    var job = S.job = { running: true, scope: scope, total: queue.length, done: 0, failed: 0, startedAt: Date.now(), stop: false, perSec: 0, eta: null };
    queue.forEach(function (id) { S.byId[id].stage = 'queued'; });
    var conc = mode === 'worker' ? pool.length : 1;
    ST.log('Proses', 'Mulai: ' + queue.length + ' foto, ' + conc + ' worker, ' + (mode === 'worker' ? 'Web Worker paralel' : 'thread utama'), 'info');
    U.toast('Pemrosesan dimulai', 'info');
    VS.bus.emit('job', job);

    var idx = 0;
    async function lane() {
      while (idx < queue.length && !job.stop) {
        var row = S.byId[queue[idx++]];
        if (!row) continue;
        row.stage = 'running';
        ST.recomputeRow(row);
        VS.bus.emit('row', row);
        try {
          var before = row.ai && row.ai.stan ? row.ai.stan.text : null;
          row.ai = await processRow(row);
          ST.log('AI', '[' + (job.done + 1) + '/' + job.total + '] ' + row.photo.name + ' (' + row.nama + ') → ' + summarize(row) + ' · ' + row.ai.durationMs + ' ms', row.ai.gate1.ok ? 'ok' : 'warn');
          if (before !== (row.ai.stan ? row.ai.stan.text : null)) { /* hasil baru */ }
        } catch (e) {
          job.failed++;
          row.ai = { done: true, error: e.message, gate1: { ok: false, reasons: ['Gagal memproses: ' + e.message], codes: ['ERROR'] }, processedAt: Date.now() };
          ST.log('Galat', row.idpel + ': ' + e.message, 'error');
        }
        row.stage = 'idle';
        job.done++;
        var el = (Date.now() - job.startedAt) / 1000;
        job.perSec = job.done / Math.max(0.5, el);
        job.eta = (job.total - job.done) / Math.max(0.01, job.perSec);
        S.throughput.push({ t: Date.now(), v: job.perSec });
        if (S.throughput.length > 120) S.throughput.shift();
        ST.recomputeRow(row);
        VS.bus.emit('row', row);
        VS.bus.emit('job', job);
      }
    }
    var lanes = [];
    for (var i = 0; i < conc; i++) lanes.push(lane());
    await Promise.all(lanes);
    queue.forEach(function (id) { if (S.byId[id] && S.byId[id].stage === 'queued') S.byId[id].stage = 'idle'; });
    ST.recompute();   // duplikat dihitung ulang atas seluruh batch
    job.running = false; job.finishedAt = Date.now();
    var st = S.stats, secs = ((job.finishedAt - job.startedAt) / 1000);
    var msg = job.done + ' foto dalam ' + U.fmtNum(secs, 1) + ' detik (' + U.fmtNum(job.done / Math.max(0.1, secs), 1) + ' foto/detik) — ' +
      st.aiSukses + ' sesuai AI, ' + st.periksa + ' periksa manual, ' + st.ulang + ' minta foto ulang';
    ST.log(job.stop ? 'Dihentikan' : 'Selesai', msg, 'ok');
    U.toast(job.stop ? 'Pemrosesan dihentikan' : job.done + ' foto selesai diproses', 'ok');
    ST.save();
    VS.bus.emit('job', job);
    VS.bus.emit('change');
  }

  function summarize(row) {
    var ai = row.ai;
    if (!ai.gate1.ok) return 'Gate 1 gagal: ' + ai.gate1.codes.join(', ');
    if (!ai.stan || !ai.stan.text) return 'LCD terdeteksi, angka tidak terbaca';
    return 'STAN ' + ai.stan.text + ' (' + Math.round(ai.stan.conf * 100) + '%, ' + ai.stan.agree + '/3 bacaan sama)';
  }

  function stop() { if (S.job && S.job.running) { S.job.stop = true; ST.log('Proses', 'Permintaan berhenti diterima; menunggu foto yang sedang dianalisis.', 'warn'); } }

  VS.engine = { init: init, run: run, stop: stop, mode: function () { return mode; }, workers: function () { return mode === 'worker' ? pool.length : 1; }, loadTesseract: loadTesseract, parseStickerText: parseStickerText };
})();
