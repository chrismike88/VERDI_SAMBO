/* VERDI SAMBO — Inspektor samping (pengganti 4 modal) dan Mode Fokus. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util, S = VS.state, UI = VS.ui, esc = U.esc, icon = UI.icon;

  function photoUrl(row) {
    var u = S.urls[row.id] = S.urls[row.id] || {};
    if (!u.photo && S.files[row.id]) u.photo = URL.createObjectURL(S.files[row.id]);
    return u.photo || u.thumb || null;
  }

  /* ---------- PhotoStage: zoom/geser/putar + kotak deteksi ---------- */
  function stageHtml(row, big) {
    var url = photoUrl(row), ai = row.ai || {}, boxes = '';
    if (ai.lcdBox) {
      var b = ai.lcdBox, ok = ai.gate1 && ai.gate1.ok;
      boxes += '<div class="det det-lcd" style="left:' + b.x * 100 + '%;top:' + b.y * 100 + '%;width:' + b.w * 100 + '%;height:' + b.h * 100 + '%"><span>LCD ' + (ai.stan && ai.stan.text ? Math.round(ai.stan.conf * 100) + '%' : ok ? 'terdeteksi' : '') + '</span></div>';
    }
    if (ai.sticker && ai.sticker.found && ai.sticker.box) {
      var s = ai.sticker.box;
      boxes += '<div class="det sticker" style="left:' + s.x * 100 + '%;top:' + s.y * 100 + '%;width:' + s.w * 100 + '%;height:' + s.h * 100 + '%"><span>Stiker</span></div>';
    }
    return '<div class="stage' + (big ? ' big' : '') + (S.ui.showBoxes ? '' : ' hide-boxes') + '" data-stage tabindex="0" aria-label="Foto meter, gulir untuk zoom, seret untuk geser">' +
      (url ? '<div class="pz"><img alt="Foto kWh meter ' + esc(row.nama) + '" src="' + url + '">' + boxes + '</div><div class="scan"></div>'
        : '<div class="noimg">' + (row.photo ? 'Berkas foto tidak tersedia di sesi ini.<br>Pilih ulang folder foto untuk melihat foto penuh.' : 'Tidak ada foto yang dipasangkan dengan baris ini.') + '</div>') +
      '<div class="stage-tools"><button data-st="boxes" aria-pressed="' + S.ui.showBoxes + '" title="Kotak deteksi (B)">' + icon('box') + 'Kotak</button>' +
      '<button data-st="rotate" title="Putar 90°">' + icon('rotate') + 'Putar</button><button data-st="one" title="Zoom 1:1 (Z)">' + icon('zoom') + '1:1</button>' +
      '<button data-st="fit" title="Pas layar">' + icon('focus') + 'Pas</button><span class="zoomv" data-zoomv>—</span></div></div>';
  }

  function attachStage(root) {
    var st = root.querySelector('[data-stage]'); if (!st) return null;
    var pz = st.querySelector('.pz'), img = st.querySelector('img');
    var view = { s: 1, tx: 0, ty: 0, rot: 0, w: 0, h: 0, fit: 1 };
    function apply() {
      if (!pz) return;
      pz.style.width = view.w + 'px'; pz.style.height = view.h + 'px';
      pz.style.transform = 'translate(' + view.tx + 'px,' + view.ty + 'px) rotate(' + view.rot + 'deg) scale(' + view.s + ') translate(' + (-view.w / 2) + 'px,' + (-view.h / 2) + 'px)';
      var zv = st.querySelector('[data-zoomv]'); if (zv) zv.textContent = Math.round(view.s * 100) + '%';
    }
    function fit() {
      if (!view.w) return;
      var r = st.getBoundingClientRect(), rot = view.rot % 180 !== 0;
      var w = rot ? view.h : view.w, h = rot ? view.w : view.h;
      view.fit = Math.min(r.width / w, (r.height - 44) / h);
      view.s = view.fit; view.tx = 0; view.ty = -16; apply();
    }
    if (img) {
      var onload = function () { view.w = img.naturalWidth; view.h = img.naturalHeight; img.style.width = view.w + 'px'; fit(); };
      if (img.complete && img.naturalWidth) onload(); else img.addEventListener('load', onload);
    }
    st.addEventListener('wheel', function (e) {
      if (!view.w) return;
      e.preventDefault();
      var r = st.getBoundingClientRect(), px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2;
      var k = Math.exp(-e.deltaY * 0.0015), s2 = Math.max(view.fit * 0.5, Math.min(8, view.s * k));
      view.tx = px - (px - view.tx) * (s2 / view.s); view.ty = py - (py - view.ty) * (s2 / view.s); view.s = s2; apply();
    }, { passive: false });
    var drag = null;
    st.addEventListener('pointerdown', function (e) { if (e.target.closest('.stage-tools')) return; drag = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty }; st.setPointerCapture(e.pointerId); });
    st.addEventListener('pointermove', function (e) { if (!drag) return; view.tx = drag.tx + e.clientX - drag.x; view.ty = drag.ty + e.clientY - drag.y; apply(); });
    st.addEventListener('pointerup', function () { drag = null; });
    st.addEventListener('dblclick', function () { toggleOne(); });
    function toggleOne() {
      if (Math.abs(view.s - 1) < 0.01) fit();
      else {
        // 1:1 berpusat pada kotak LCD bila ada
        var row = S.byId[S.ui.selectedId], b = row && row.ai && row.ai.lcdBox;
        view.s = 1;
        if (b && view.rot === 0) { view.tx = -(b.x + b.w / 2 - 0.5) * view.w; view.ty = -(b.y + b.h / 2 - 0.5) * view.h; } else { view.tx = 0; view.ty = 0; }
        apply();
      }
    }
    st.querySelector('.stage-tools').addEventListener('click', function (e) {
      var b = e.target.closest('[data-st]'); if (!b) return;
      var k = b.getAttribute('data-st');
      if (k === 'boxes') toggleBoxes();
      if (k === 'rotate') { view.rot = (view.rot + 90) % 360; fit(); }
      if (k === 'one') toggleOne();
      if (k === 'fit') fit();
    });
    var ro = new ResizeObserver(function () { if (view.w && Math.abs(view.s - view.fit) < 0.001) fit(); });
    ro.observe(st);
    return { fit: fit, toggleOne: toggleOne, el: st };
  }

  function toggleBoxes() {
    S.ui.showBoxes = !S.ui.showBoxes;
    document.querySelectorAll('[data-stage]').forEach(function (s) {
      s.classList.toggle('hide-boxes', !S.ui.showBoxes);
      var b = s.querySelector('[data-st="boxes"]'); if (b) b.setAttribute('aria-pressed', S.ui.showBoxes);
    });
  }

  /* ---------- bagian-bagian detail ---------- */
  function lcdSection(row, e, lit) {
    var ai = row.ai;
    if (!ai || !ai.done) {
      return '<div class="insp-sec"><h4>Pembacaan STAN</h4>' + UI.lcd(null, { size: 'lg' }) +
        '<div class="conf-line"><span>' + (row.stage === 'running' ? 'AI sedang membaca layar…' : 'Menunggu eksekusi proses AI.') + '</span>' +
        (row.photo && row.stage !== 'running' ? '<button class="btn btn-sm" data-action="run-one" data-id="' + row.id + '">' + icon('play') + 'Proses foto ini</button>' : '') + '</div></div>';
    }
    if (!ai.gate1.ok) {
      var human = ai.gate1.codes.indexOf('LCD_TIDAK_TERLIHAT') >= 0 ? 'Layar meter tidak terlihat atau mati'
        : ai.gate1.codes.indexOf('LOGO_WARNA_BUKAN_LCD') >= 0 || ai.gate1.codes.indexOf('GRADIENT_HORIZON') >= 0 ? 'Bukan foto meter di lokasi (kemungkinan foto stok)'
          : ai.gate1.codes.indexOf('GELAP') >= 0 ? 'Foto terlalu gelap' : ai.gate1.codes.indexOf('BURAM') >= 0 ? 'Foto buram' : 'Foto tidak layak';
      return '<div class="insp-sec"><h4>Pembacaan STAN</h4><div class="reason-card">' + icon('camera') + '<div><b>' + human + '</b>Minta petugas mengambil foto ulang.' +
        '<details><summary>Detail teknis (Gate 1)</summary>' + ai.gate1.reasons.map(esc).join('<br>') + '<br>Kecerahan ' + (ai.quality ? ai.quality.brightness : '—') + ' · ketajaman ' + (ai.quality ? ai.quality.sharpness : '—') + ' · colorfulness ' + (ai.quality ? ai.quality.colorfulness : '—') + '</details></div></div>' +
        (S.urls[row.id] && S.urls[row.id].crop ? '<div class="crop-mini">Potongan layar <img src="' + S.urls[row.id].crop + '" alt="Potongan layar LCD"></div>' : '') + '</div>';
    }
    var stan = ai.stan || {}, digits = stan.digits || [];
    return '<div class="insp-sec"><h4>Pembacaan STAN <span class="right">' + (e.statusAI === 'AI_CONFIDENT' ? '<span class="tag ok" title="AI_CONFIDENT">' + icon('check') + 'AI yakin</span>' : '<span class="tag warn" title="AI_UNCERTAIN">' + icon('search') + 'AI ragu</span>') + '</span></h4>' +
      UI.lcd(stan.text || null, { size: 'lg', len: 6, digits: digits, lit: lit, label: 'STAN AI ' + (stan.text || 'tidak terbaca') }) +
      '<div class="conf-line"><span>Keyakinan <b>' + (stan.conf != null ? U.fmtNum(stan.conf * 100, 1) + '%' : '—') + '</b></span><span><b>' + (stan.agree || 0) + ' dari 3</b> bacaan sama</span>' +
      '<span class="digit-conf">' + digits.map(function (d) { return '<span class="' + (d.conf < S.settings.minConfidence ? 'low' : '') + '" title="Digit ' + esc(d.ch) + '">' + Math.round(d.conf * 100) + '</span>'; }).join('') + '</span></div>' +
      (S.urls[row.id] && S.urls[row.id].crop ? '<div class="crop-mini">Potongan asli <img src="' + S.urls[row.id].crop + '" alt="Potongan layar LCD"><span class="muted">varian: ' + (stan.reads || []).map(function (r) { return esc(r.variant) + ' “' + esc(r.text || '∅') + '”'; }).join(', ') + '</span></div>' : '') + '</div>';
  }

  function checksSection(row, e) {
    var items = e.checks.map(function (c) {
      var cls = c.ok === true ? 'ok' : c.ok === false ? 'bad' : c.ok === 'warn' ? 'warn' : 'na';
      var ic = cls === 'ok' ? 'check' : cls === 'bad' ? 'x' : cls === 'warn' ? 'warn' : 'info';
      return '<li class="' + cls + '"><span class="ic">' + icon(ic) + '</span><div><b>' + esc(c.label) + '</b><small>' + esc(c.detail || '') + '</small></div></li>';
    });
    if (!items.length) items.push('<li class="na"><span class="ic">' + icon('clock') + '</span><div><b>Belum diperiksa</b><small>Pemeriksaan muncul setelah AI memproses foto.</small></div></li>');
    var extra = e.warnings.filter(function (w) { return ['NAMA_BEDA'].indexOf(w.code) >= 0; }).map(function (w) {
      return '<li class="warn"><span class="ic">' + icon('warn') + '</span><div><b>Perhatian</b><small>' + esc(w.text) + '</small></div></li>';
    });
    return '<div class="insp-sec"><h4>Pemeriksaan</h4><ul class="checks">' + items.join('') + extra.join('') + '</ul>' +
      '<div class="notice ' + (e.final === 'sesuai_ai' ? 'ok' : e.final === 'periksa' || e.final === 'ulang' ? 'warn' : '') + '" style="margin-top:10px">' + icon(e.final === 'sesuai_ai' ? 'check' : 'info') + '<div><b>' + esc((VS.rules.FINAL[e.final] || {}).label) + '</b> · ' + esc(e.instruksi) + '</div></div></div>';
  }

  function compareSection(row, e) {
    var ov = (row.ai && row.ai.overlay) || {}, ex = (row.ai && row.ai.exif) || {};
    var src = ov.source === 'ocr' ? 'OCR stempel' : ov.source === 'demo' ? 'stempel (data demo)' : ex.date ? 'EXIF' : '—';
    function line(label, ref, field, diff) {
      return '<tr><th>' + label + '</th><td>' + (ref != null && ref !== '' ? esc(ref) : '<span class="muted">—</span>') + '</td><td' + (diff ? ' class="diff"' : '') + '>' + (field != null && field !== '' ? esc(field) : '<span class="muted">—</span>') + '</td></tr>';
    }
    var ovId = ov.idpel ? String(ov.idpel) : null;
    var period = U.BULAN[S.batch.month - 1].slice(0, 3) + ' ' + S.batch.year;
    var fotoTgl = e.fotoTanggal ? U.fmtDateTime(e.fotoTanggal) : null;
    var koordRef = row.latRef != null ? row.latRef.toFixed(5) + ', ' + row.lonRef.toFixed(5) : null;
    var koordFoto = e.fotoLat != null ? e.fotoLat.toFixed(5) + ', ' + e.fotoLon.toFixed(5) : null;
    return '<div class="insp-sec"><h4>Referensi ↔ lapangan <span class="right tiny muted">sumber: ' + src + '</span></h4><table class="cmp"><thead><tr><th></th><th>Excel</th><th>Foto</th></tr></thead><tbody>' +
      line('Nama', row.nama, ov.nama, ov.nama && e.namaSim != null && e.namaSim < 0.85) +
      line('IDPEL', row.idpel, ovId && ovId.length === 12 ? ovId : (row.photo ? row.photo.idpel + ' (file)' : null), ovId && ovId.length === 12 && ovId !== row.idpel) +
      line('No. meter', row.nomorMeter, ovId && ovId.length === 11 ? ovId : (row.ai && row.ai.nomorMeterOcr), e.meterMatch === false) +
      line('Alamat', row.alamat, ov.alamat, false) +
      line('Tanggal', period, fotoTgl, e.periodOk === false) +
      line('Koordinat', koordRef, koordFoto, e.lokasi === 'JAUH') +
      line('STAN', row.stanCater != null ? row.stanCater + ' (cater)' : null, e.stanFinal, e.cater === 'TIDAK_SESUAI') +
      '</tbody></table></div>';
  }

  function geoSection(row, e) {
    if (e.jarakKm == null) {
      return '<div class="insp-sec"><h4>Lokasi foto</h4><div class="notice">' + icon('map') + '<div>Koordinat foto tidak tersedia (tidak ada stempel/EXIF GPS).</div></div></div>';
    }
    var W = 380, H = 150, cx = W / 2, cy = H / 2, R = 52;
    var dLat = e.fotoLat - e.rujukan.lat, dLon = (e.fotoLon - e.rujukan.lon) * Math.cos(e.rujukan.lat * Math.PI / 180);
    var ang = Math.atan2(dLat, dLon), dist = e.jarakKm, rr = Math.min(R * 1.25, dist / e.radiusKm * R);
    if (dist > e.radiusKm) rr = Math.min(W / 2 - 24, R + 18 + Math.log10(1 + dist / e.radiusKm) * 50);
    var px = cx + Math.cos(ang) * rr, py = cy - Math.sin(ang) * rr, far = e.lokasi === 'JAUH';
    var gm = 'https://www.google.com/maps/dir/?api=1&origin=' + e.rujukan.lat + ',' + e.rujukan.lon + '&destination=' + e.fotoLat + ',' + e.fotoLon;
    return '<div class="insp-sec"><h4>Lokasi foto</h4><div class="geo"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Skema jarak foto ke rujukan">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="color-mix(in srgb, var(--ok) 10%, transparent)" stroke="var(--ok)" stroke-dasharray="4 4"/>' +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + px + '" y2="' + py + '" stroke="' + (far ? 'var(--retake)' : 'var(--ink-2)') + '" stroke-width="2" stroke-dasharray="' + (far ? '6 4' : '0') + '"/>' +
      '<rect x="' + (cx - 8) + '" y="' + (cy - 8) + '" width="16" height="16" rx="4" fill="var(--band)" stroke="var(--petir)" stroke-width="2"/>' +
      '<circle cx="' + px + '" cy="' + py + '" r="8" fill="' + (far ? 'var(--retake)' : 'var(--ok)') + '" stroke="var(--surface-2)" stroke-width="2"/>' +
      '<text x="' + ((cx + px) / 2 + 6) + '" y="' + ((cy + py) / 2 - 6) + '" style="fill:var(--ink);font-weight:700;font-size:12px">' + U.fmtNum(dist, dist < 10 ? 2 : 1) + ' km</text>' +
      '<text x="' + (cx + 12) + '" y="' + (cy + 22) + '" style="fill:var(--ink-2);font-size:11px">' + esc(e.rujukan.source === 'pelanggan' ? 'koordinat pelanggan' : e.rujukan.nama) + '</text>' +
      '<text x="8" y="' + (H - 8) + '" style="fill:var(--ink-3);font-size:10.5px">radius ' + e.radiusKm + ' km</text></svg>' +
      '<div class="geo-cap">' + (far ? '<span class="tag err">' + icon('warn') + 'Lokasi jauh — cek stiker</span>' : '<span class="tag ok">' + icon('check') + 'Dalam radius</span>') +
      '<a href="' + gm + '" target="_blank" rel="noopener">' + icon('map') + 'Buka di Google Maps</a></div></div></div>';
  }

  function decisionSection(row, e) {
    var v = row.verif || {}, k = v.keputusan;
    var sm = v.stickerMonth || (row.ai && row.ai.stickerMonth);
    var months = '<option value="">— belum diisi —</option>';
    for (var y = S.batch.year; y >= S.batch.year - 1; y--) for (var m = 12; m >= 1; m--) {
      var sel = sm && sm.month === m && sm.year === y;
      months += '<option value="' + y + '-' + m + '"' + (sel ? ' selected' : '') + '>' + U.BULAN[m - 1] + ' ' + y + '</option>';
    }
    return '<div class="insp-sec"><h4>Keputusan</h4>' +
      (k ? '<div class="decision-done">' + UI.chip({ SESUAI: 'sesuai', TIDAK_SESUAI: 'tidak_sesuai', RUMAH_TUTUP: 'rumah_tutup' }[k]) + '<span class="muted tiny">oleh ' + esc(v.by || '') + ' · ' + U.fmtDateTime(v.at) + '</span><button class="btn btn-ghost btn-sm" data-action="clear-decision" data-id="' + row.id + '" style="margin-left:auto">Batalkan</button></div>' : '') +
      '<div class="stan-edit"><label for="stan-final-' + row.id + '">STAN final <span class="muted tiny">(<kbd>E</kbd> ubah)</span><div class="tiny muted">' + (v.stanManual != null && v.stanManual !== '' ? 'diisi manual' : e.stanAI ? 'dari AI' : 'belum ada') + '</div></label>' +
      '<input class="input" id="stan-final-' + row.id + '" data-stan-input="' + row.id + '" inputmode="decimal" autocomplete="off" value="' + esc(e.stanFinal || '') + '" placeholder="----" aria-label="STAN final"></div>' +
      '<div class="decide"><button class="btn d-ok' + (k === 'SESUAI' ? ' on' : '') + '" data-action="decide" data-k="SESUAI" data-id="' + row.id + '">' + icon('check') + 'Sesuai<kbd>S</kbd></button>' +
      '<button class="btn d-bad' + (k === 'TIDAK_SESUAI' ? ' on' : '') + '" data-action="decide" data-k="TIDAK_SESUAI" data-id="' + row.id + '">' + icon('x') + 'Tidak sesuai<kbd>T</kbd></button>' +
      '<button class="btn d-closed' + (k === 'RUMAH_TUTUP' ? ' on' : '') + '" data-action="decide" data-k="RUMAH_TUTUP" data-id="' + row.id + '">' + icon('home') + 'Rumah tutup<kbd>R</kbd></button></div>' +
      '<div class="form-grid" style="margin-top:12px;grid-template-columns:1fr"><label>Bulan stiker' + (sm && sm.source ? ' <small>(' + (sm.source === 'ocr' ? 'OCR' : sm.source === 'demo' ? 'data demo' : 'manual') + ')</small>' : '') + '<select class="input" data-sticker-month="' + row.id + '"' + (row.ai && row.ai.sticker && row.ai.sticker.found ? '' : ' disabled') + '>' + months + '</select></label>' +
      '<label>Catatan (opsional)<textarea class="input" rows="2" data-note="' + row.id + '" placeholder="mis. meter tertutup pagar, foto dari luar">' + esc(v.catatan || '') + '</textarea></label></div></div>';
  }

  function detailBody(row, opts) {
    var e = S.evals[row.id];
    return lcdSection(row, e, opts && opts.lit) + checksSection(row, e) + decisionSection(row, e) + compareSection(row, e) + geoSection(row, e);
  }

  /* ---------- Inspektor ---------- */
  var stageCtl = null;
  function renderInspector(opts) {
    var el = document.getElementById('inspector');
    var row = S.byId[S.ui.selectedId];
    if (!row || !S.ui.inspectorOpen) { el.hidden = true; el.innerHTML = ''; stageCtl = null; return; }
    var keepScroll = el.scrollTop;
    var e = S.evals[row.id];
    var list = UI.pageRows().all, idx = list.findIndex(function (r) { return r.id === row.id; });
    el.hidden = false;
    el.innerHTML = '<div class="insp-head"><div class="who"><b>' + esc(row.nama) + '</b><span>' + row.idpel + ' · baris ' + row.no + '</span></div>' +
      '<div class="right">' + UI.chip(e.final) + '<button class="icon-btn" data-action="focus" title="Mode fokus (F)" aria-label="Mode fokus">' + icon('focus') + '</button>' +
      '<button class="icon-btn" data-action="close-inspector" title="Tutup (Esc)" aria-label="Tutup inspektor">' + icon('close') + '</button></div></div>' +
      '<div class="insp-sec" style="padding-bottom:12px">' + stageHtml(row) + '</div>' + detailBody(row, opts) +
      '<div class="navline"><button class="btn btn-sm" data-action="prev"' + (idx > 0 ? '' : ' disabled') + '>' + icon('left') + 'Sebelumnya <kbd>K</kbd></button><span class="num">' + (idx + 1) + ' / ' + list.length + '</span>' +
      '<button class="btn btn-sm" data-action="next"' + (idx < list.length - 1 ? '' : ' disabled') + '>Berikutnya <kbd>J</kbd>' + icon('right') + '</button></div>';
    stageCtl = attachStage(el);
    if (opts && opts.keepScroll) el.scrollTop = keepScroll;
    if (opts && opts.lit && stageCtl) { stageCtl.el.classList.add('lock'); }
  }

  /* ---------- Mode fokus ---------- */
  var focus = { ids: [], cur: 0, decided: {} };
  function openFocus() {
    var q = UI.reviewQueue();
    if (!q.length) { U.toast('Tidak ada baris yang perlu review.', 'info'); return; }
    focus.ids = q.map(function (r) { return r.id; });
    focus.decided = {};
    var startIdx = focus.ids.indexOf(S.ui.selectedId);
    focus.cur = startIdx >= 0 ? startIdx : 0;
    S.ui.focus = true;
    S.ui.selectedId = focus.ids[focus.cur];
    renderFocus();
  }
  function closeFocus() {
    S.ui.focus = false;
    var el = document.getElementById('focus'); el.hidden = true; el.innerHTML = '';
    VS.app.renderAll();
  }
  function remaining() { return focus.ids.filter(function (id) { return !focus.decided[id] && S.evals[id] && (S.evals[id].final === 'periksa' || S.evals[id].final === 'ulang'); }).length; }

  function renderFocus(opts) {
    var el = document.getElementById('focus');
    el.hidden = false;
    var left = remaining();
    if (!left) {
      el.innerHTML = '<div class="focus-top"><span class="ttl">' + icon('focus') + ' Mode fokus</span><span class="left-n"><b>0</b> tersisa</span><button class="btn btn-sm" data-action="close-focus" style="margin-left:12px;color:#fff;background:transparent;border-color:#2b3b52">Keluar <kbd>Esc</kbd></button></div>' +
        '<div class="focus-done"><div>' + UI.lcd('0', { size: 'xl', len: 3, lit: true }) + '<h2 style="margin-top:22px">Antrian review kosong.</h2><p class="muted" style="color:#9fb0c8">' + Object.keys(focus.decided).length + ' keputusan tersimpan di sesi fokus ini.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-primary btn-lg" data-action="export">' + icon('download') + 'Ekspor Excel</button><button class="btn btn-lg" data-action="close-focus">Kembali ke antrian</button></div></div></div><div></div>';
      return;
    }
    var row = S.byId[focus.ids[focus.cur]];
    S.ui.selectedId = row.id;
    var e = S.evals[row.id];
    var film = focus.ids.map(function (id, i) {
      var r = S.byId[id], u = S.urls[id] || {}, ev = S.evals[id], tone = (VS.rules.FINAL[ev.final] || {}).tone;
      return '<button class="film' + (i === focus.cur ? ' cur' : '') + (focus.decided[id] ? ' done' : '') + '" data-action="focus-go" data-i="' + i + '" style="background-image:url(' + (u.thumb || '') + ')" aria-label="' + esc(r.nama) + '"><span class="fb dot ' + tone + '"></span></button>';
    }).join('');
    el.innerHTML = '<div class="focus-top"><span class="ttl">' + icon('focus') + ' Mode fokus</span><span style="color:#9fb0c8">' + esc(row.nama) + ' · ' + row.idpel + '</span>' + UI.chip(e.final) +
      '<span class="left-n"><b>' + left + '</b> tersisa dari ' + focus.ids.length + '</span>' +
      '<button class="btn btn-sm" data-action="close-focus" style="margin-left:12px;color:#fff;background:transparent;border-color:#2b3b52">Keluar <kbd>Esc</kbd></button></div>' +
      '<div class="focus-main"><div style="position:relative;min-height:0">' + stageHtml(row, true) + '</div><div class="focus-side">' + detailBody(row, opts) +
      '<div class="navline"><button class="btn btn-sm" data-action="focus-prev">' + icon('left') + 'Sebelumnya <kbd>K</kbd></button><span class="num">' + (focus.cur + 1) + ' / ' + focus.ids.length + '</span><button class="btn btn-sm" data-action="focus-next">Berikutnya <kbd>J</kbd>' + icon('right') + '</button></div></div></div>' +
      '<div class="filmstrip">' + film + '</div>';
    stageCtl = attachStage(el);
    var cur = el.querySelector('.film.cur'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function focusMove(d) {
    if (!focus.ids.length) return;
    focus.cur = (focus.cur + d + focus.ids.length) % focus.ids.length;
    renderFocus();
  }
  function focusAfterDecision(id) {
    focus.decided[id] = true;
    if (!remaining()) { renderFocus(); return; }
    if (S.settings.autoAdvance) {
      for (var k = 1; k <= focus.ids.length; k++) {
        var j = (focus.cur + k) % focus.ids.length;
        if (!focus.decided[focus.ids[j]]) { focus.cur = j; break; }
      }
    }
    renderFocus();
  }

  VS.inspector = {
    render: renderInspector, toggleBoxes: toggleBoxes, stage: function () { return stageCtl; },
    openFocus: openFocus, closeFocus: closeFocus, renderFocus: renderFocus, focusMove: focusMove, focusAfterDecision: focusAfterDecision,
    focusGo: function (i) { focus.cur = i; renderFocus(); }
  };
})();
