/* VERDI SAMBO — komponen UI bersama: ikon, chip status, LcdReadout, strip status, modal, tooltip, filter. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util, S = VS.state, esc = U.esc;

  function icon(name, cls) { return '<svg class="' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }

  var SEGMENTS = [
    { key: 'sesuai', finals: ['sesuai_ai', 'sesuai'], label: 'Sesuai', tone: 'ok', icon: 'check' },
    { key: 'rumah_tutup', finals: ['rumah_tutup'], label: 'Rumah tutup', tone: 'closed', icon: 'home' },
    { key: 'tidak_sesuai', finals: ['tidak_sesuai'], label: 'Tidak sesuai', tone: 'bad', icon: 'x' },
    { key: 'periksa', finals: ['periksa'], label: 'Periksa manual', tone: 'check', icon: 'search' },
    { key: 'ulang', finals: ['ulang'], label: 'Minta foto ulang', tone: 'retake', icon: 'camera' },
    { key: 'belum', finals: ['menunggu', 'memproses'], label: 'Belum diproses', tone: 'wait', icon: 'clock' }
  ];

  function segCount(stats, seg) { return seg.finals.reduce(function (a, f) { return a + (stats ? stats[f] || 0 : 0); }, 0); }

  function chip(finalKey, extra) {
    var f = VS.rules.FINAL[finalKey] || VS.rules.FINAL.menunggu;
    return '<span class="chip ' + f.tone + '" title="' + esc(f.code) + '">' + icon(f.icon, f.icon === 'spin' ? 'spin' : '') + esc(f.label) + (extra || '') + '</span>';
  }

  /* LcdReadout: angka STAN dengan segmen mati samar + garis bawah digit ragu */
  function lcd(text, o) {
    o = o || {};
    var size = o.size || 'md', len = o.len || 6;
    var t = text == null || text === '' ? '----' : String(text);
    var digits = o.digits || [], thr = o.threshold == null ? S.settings.minConfidence : o.threshold;
    var ghost = new Array(Math.max(len, t.replace('.', '').length) + 1).join('8');
    var di = 0, on = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (ch === '.') { on += '<span class="d">.</span>'; continue; }
      var dd = digits[di++];
      on += '<span class="d' + (dd && dd.conf < thr ? ' low' : '') + '"' + (dd ? ' title="Keyakinan ' + Math.round(dd.conf * 100) + '%"' : '') + '>' + esc(ch === '?' ? '-' : ch) + '</span>';
    }
    var side = size === 'sm' ? '' : '<span class="lcd-side"><span class="signal"><i class="on"></i><i class="on"></i><i class="on"></i><i class="' + (o.signal === false ? '' : 'on') + '"></i></span><span class="unit">kWh</span></span>';
    return '<div class="lcd ' + size + (text == null || text === '' ? ' empty' : '') + (o.lit ? ' lit' : '') + '"' + (o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : '') + '>' + side +
      '<span class="val"><span class="ghost">' + ghost + '</span><span class="on">' + on + '</span></span></div>';
  }

  function strip(stats, active, opts) {
    opts = opts || {};
    var total = stats ? stats.total : 0;
    var segs = SEGMENTS.map(function (s) {
      var n = segCount(stats, s);
      return '<button class="seg ' + s.tone + (active === s.key ? ' active' : '') + '" data-seg="' + s.key + '" style="flex-grow:' + n + '" aria-label="' + s.label + ': ' + n + '" data-tip="<b>' + s.label + '</b><br>' + n + ' baris · ' + U.pct(n, total) + '"></button>';
    }).join('');
    var legend = SEGMENTS.map(function (s) {
      var n = segCount(stats, s);
      return '<button data-seg="' + s.key + '" class="' + (active === s.key ? 'active' : '') + '"><span class="dot ' + s.tone + '"></span>' + s.label + ' <b>' + n + '</b></button>';
    }).join('');
    return '<div class="strip" role="group" aria-label="Distribusi status">' + (total ? segs : '') + '</div>' + (opts.noLegend ? '' : '<div class="legend">' + legend + '</div>');
  }

  function trio(row, e) {
    function cell(state, ic, label) {
      var cls = state === true ? 't-ok' : state === false ? 't-bad' : state === 'warn' ? 't-warn' : '';
      return '<span class="' + cls + '" data-tip="' + esc(label) + '">' + icon(ic) + '</span>';
    }
    var kwh = e.kwh === 'VALID' ? true : e.kwh === 'TIDAK LAYAK' ? false : null;
    var idp = e.idpel === 'MATCH' ? true : e.idpel === 'MISMATCH' ? false : null;
    var st = e.sticker === 'ADA' ? (e.stickerPeriod === 'BEDA PERIODE' ? 'warn' : true) : e.sticker === 'TIDAK TERIDENTIFIKASI' ? false : null;
    var g1 = row.ai && row.ai.gate1 && row.ai.gate1.reasons.length ? ': ' + row.ai.gate1.reasons.join(' ') : '';
    return '<span class="trio">' + cell(kwh, 'meter', 'KWH meter: ' + e.kwh + g1) + cell(idp, 'id', 'IDPEL: ' + e.idpel) +
      cell(st, 'sticker', 'Stiker: ' + e.sticker + (e.stickerPeriod ? ' · ' + e.stickerPeriod : '')) + '</span>';
  }

  // ---------- filter ----------
  function filteredRows() {
    var f = S.ui.filter, q = f.q.trim().toLowerCase(), seg = SEGMENTS.filter(function (s) { return s.key === f.seg; })[0];
    return S.rows.filter(function (r) {
      var e = S.evals[r.id]; if (!e) return false;
      if (q && (r.idpel + ' ' + r.nama + ' ' + (r.nomorMeter || '') + ' ' + (r.lokasi || '')).toLowerCase().indexOf(q) < 0) return false;
      if (seg && seg.finals.indexOf(e.final) < 0) return false;
      if (f.status && e.final !== f.status) return false;
      if (f.cv && e.cv !== f.cv) return false;
      if (f.verif === 'manual' && !(r.verif && r.verif.keputusan)) return false;
      if (f.verif === 'belum' && (r.verif && r.verif.keputusan)) return false;
      if (f.verif === 'ai' && e.final !== 'sesuai_ai') return false;
      if (f.verif === 'review' && ['periksa', 'ulang'].indexOf(e.final) < 0) return false;
      if (f.lokasi && e.lokasi !== f.lokasi) return false;
      return true;
    });
  }

  function pageRows() {
    var rows = filteredRows(), ps = S.ui.pageSize;
    if (ps === 0) return { rows: rows, all: rows, start: 0 };
    var pages = Math.max(1, Math.ceil(rows.length / ps));
    if (S.ui.page > pages) S.ui.page = pages;
    var start = (S.ui.page - 1) * ps;
    return { rows: rows.slice(start, start + ps), all: rows, start: start, pages: pages };
  }

  function visibleIds() { return pageRows().rows.map(function (r) { return r.id; }); }

  function reviewQueue() {
    return S.rows.filter(function (r) { var e = S.evals[r.id]; return e && (e.final === 'periksa' || e.final === 'ulang'); });
  }

  // ---------- modal ----------
  function modal(o) {
    var root = document.getElementById('modal-root');
    var prev = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '" style="' + (o.width ? 'width:min(' + o.width + 'px,100%)' : '') + '">' +
      '<div class="modal-head"><h2>' + esc(o.title) + '</h2><button class="icon-btn right" data-close aria-label="Tutup">' + icon('close') + '</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); if (o.onClose) o.onClose(); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    var first = wrap.querySelector('input,select,textarea,button:not([data-close])');
    setTimeout(function () { (first || wrap.querySelector('[data-close]')).focus(); }, 30);
    if (o.onMount) o.onMount(wrap.querySelector('.modal'), close);
    return close;
  }

  function confirmBox(title, text, okLabel) {
    return new Promise(function (res) {
      var done = false;
      modal({
        title: title, width: 460, body: '<p style="margin:0">' + text + '</p>',
        foot: '<button class="btn" data-close>Batal</button><button class="btn btn-dark" data-ok>' + esc(okLabel || 'Lanjutkan') + '</button>',
        onMount: function (m, close) { m.querySelector('[data-ok]').addEventListener('click', function () { done = true; close(); res(true); }); },
        onClose: function () { if (!done) res(false); }
      });
    });
  }

  // ---------- tooltip global ----------
  var tipEl = null;
  function initTips() {
    tipEl = document.createElement('div');
    tipEl.className = 'chart-tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
    function show(e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { tipEl.hidden = true; return; }
      tipEl.innerHTML = t.getAttribute('data-tip');
      tipEl.hidden = false;
      var r = t.getBoundingClientRect();
      var x = e.type === 'mousemove' && t.tagName !== 'SPAN' && t.tagName !== 'BUTTON' ? e.clientX : r.left + r.width / 2;
      var y = e.type === 'mousemove' && t.tagName !== 'SPAN' && t.tagName !== 'BUTTON' ? e.clientY : r.top;
      tipEl.style.left = Math.max(150, Math.min(window.innerWidth - 150, x)) + 'px';
      tipEl.style.top = Math.max(60, y) + 'px';
    }
    document.addEventListener('mouseover', show);
    document.addEventListener('mousemove', function (e) { if (!tipEl.hidden) show(e); });
    document.addEventListener('focusin', show);
    document.addEventListener('scroll', function () { tipEl.hidden = true; }, true);
  }

  function animateNumber(el, to) {
    if (!el) return;
    var from = +el.getAttribute('data-v') || 0;
    el.setAttribute('data-v', to);
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = U.fmtNum(to); return; }
    var t0 = performance.now();
    function step(t) {
      var k = Math.min(1, (t - t0) / 500), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      el.textContent = U.fmtNum(Math.round(v));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  VS.ui = {
    icon: icon, chip: chip, lcd: lcd, strip: strip, trio: trio, SEGMENTS: SEGMENTS, segCount: segCount,
    filteredRows: filteredRows, pageRows: pageRows, visibleIds: visibleIds, reviewQueue: reviewQueue,
    modal: modal, confirm: confirmBox, initTips: initTips, animateNumber: animateNumber
  };
})();
