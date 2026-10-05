/* VERDI SAMBO — kontroler aplikasi: navigasi, aksi, pintasan keyboard, alur data. */
(function () {
  'use strict';
  var VS = window.VS;
  var U = VS.util, S = VS.state, ST = VS.store, UI = VS.ui, V = VS.views, I = VS.inspector, esc = U.esc, icon = UI.icon;
  function $(id) { return document.getElementById(id); }

  var VIEWS = {
    dash: { el: 'view-dash', render: function () { V.renderDash(); } },
    setup: { el: 'view-setup', render: function () { V.renderSetup(); } },
    process: { el: 'view-process', render: function () { V.renderProcess(); } },
    queue: { el: 'view-queue', render: function () { V.renderQueue(); } },
    report: { el: 'view-report', render: function () { V.renderReport(); } },
    history: { el: 'view-history', render: function () { V.renderHistory(); } }
  };

  /* ---------- navigasi & rel ---------- */
  function nav(view) {
    if (!VIEWS[view]) return;
    if (view !== S.ui.view && view !== 'queue' && S.ui.inspectorOpen) { S.ui.inspectorOpen = false; I.render(); }
    S.ui.view = view;
    Object.keys(VIEWS).forEach(function (k) { $(VIEWS[k].el).hidden = k !== view; });
    VIEWS[view].render();
    renderSteps();
    $('main').scrollTop = 0;
    try { localStorage.setItem('vs-view', view); } catch (e) { /* abaikan */ }
  }

  function renderSteps() {
    var st = S.stats || {}, has = S.batch && S.rows.length;
    var photos = S.rows.filter(function (r) { return r.photo; }).length;
    var steps = [
      { v: 'dash', badge: icon('grid'), t: 'Dasbor', s: has ? U.BULAN[S.batch.month - 1] + ' ' + S.batch.year : 'Ringkasan' },
      { v: 'setup', badge: '1', t: 'Data & foto', s: has ? S.rows.length + ' baris · ' + photos + ' foto' : 'Belum dimuat', done: has },
      { v: 'process', badge: '2', t: 'Proses AI', s: has ? st.processed + ' / ' + st.total + (S.job && S.job.running ? ' · berjalan' : '') : 'Butuh data', dim: !has, done: has && st.belum === 0 },
      { v: 'queue', badge: '3', t: 'Periksa', s: has ? st.review + ' perlu review' : 'Butuh data', dim: !has, done: has && st.processed && !st.review },
      { v: 'report', badge: '4', t: 'Laporan & ekspor', s: has ? 'Valid ' + st.valid + ' · Excel' : 'Butuh data', dim: !has },
      { sep: true },
      { v: 'history', badge: icon('history'), t: 'Riwayat', s: S.audit.length + ' perubahan' }
    ];
    $('steps').innerHTML = steps.map(function (s) {
      if (s.sep) return '<li class="step-sep" role="presentation"></li>';
      return '<li><button class="step' + (s.dim ? ' dim' : '') + (s.done ? ' done' : '') + '" data-action="nav" data-view="' + s.v + '"' + (S.ui.view === s.v ? ' aria-current="page"' : '') + ' title="' + esc(s.t) + '">' +
        '<span class="badge">' + (s.done && /^\d$/.test(s.badge) ? icon('check') : s.badge) + '</span><span class="t">' + esc(s.t) + '</span><span class="s">' + esc(s.s) + '</span></button></li>';
    }).join('');
  }

  function renderHeader() {
    var st = S.stats || { processed: 0, total: 0 };
    var t = U.pad(Math.min(999, st.processed || 0), 3) + '/' + U.pad(Math.min(999, st.total || 0), 3);
    $('lcd-counter-text').textContent = t;
    var lvl = S.job && S.job.running ? Math.min(4, 1 + Math.round(S.job.perSec)) : st.total ? Math.round(4 * st.processed / st.total) : 0;
    $('signal-bars').querySelectorAll('i').forEach(function (b, i) { b.classList.toggle('on', i < lvl); });
    var pill = $('engine-pill');
    var busy = S.job && S.job.running;
    pill.className = 'engine-pill ' + (busy ? 'busy' : 'ready');
    pill.querySelector('.txt').textContent = busy ? 'Memproses · ' + U.fmtNum(S.job.perSec, 1) + ' foto/detik' : 'Mesin AI siap — ' + VS.engine.workers() + (VS.engine.mode() === 'worker' ? ' worker' : ' thread');
    $('log-count').textContent = S.logs.length > 999 ? '999+' : S.logs.length;
  }

  function renderAll() {
    renderHeader(); renderSteps();
    VIEWS[S.ui.view].render();
    if (S.ui.focus) I.renderFocus(); else I.render({ keepScroll: true });
  }

  // render tertunda (dibatasi) saat banyak event datang beruntun
  var pending = {}, raf = null;
  function schedule(what) {
    pending[what] = true;
    if (raf) return;
    raf = setTimeout(function () {
      raf = null;
      var p = pending; pending = {};
      if (p.header) renderHeader();
      if (p.steps) renderSteps();
      if (p.view && S.ui.view !== 'queue' && S.ui.view !== 'setup') VIEWS[S.ui.view].render();
    }, 180);
  }

  function applyTheme() {
    var t = S.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    $('btn-theme').innerHTML = icon(dark ? 'sun' : 'moon');
  }

  /* ---------- seleksi & navigasi baris ---------- */
  function select(id, open) {
    if (!S.byId[id]) return;
    var prev = S.ui.selectedId;
    S.ui.selectedId = id;
    if (open !== false) S.ui.inspectorOpen = true;
    if (S.ui.view === 'queue') {
      [prev, id].forEach(function (x) { if (x && S.byId[x]) V.updateRow(S.byId[x]); });
      V.scrollToRow(id);
    }
    I.render();
  }

  function move(d) {
    if (S.ui.focus) { I.focusMove(d); return; }
    var list = UI.filteredRows();
    if (!list.length) return;
    var idx = list.findIndex(function (r) { return r.id === S.ui.selectedId; });
    var n = idx < 0 ? 0 : Math.max(0, Math.min(list.length - 1, idx + d));
    var ps = S.ui.pageSize;
    if (ps) {
      var page = Math.floor(n / ps) + 1;
      if (page !== S.ui.page) { S.ui.page = page; if (S.ui.view === 'queue') V.drawRows(true); }
    }
    select(list[n].id, S.ui.inspectorOpen);
  }

  function nextReviewAfter(id) {
    var list = UI.filteredRows(), idx = list.findIndex(function (r) { return r.id === id; });
    for (var k = idx + 1; k < list.length; k++) {
      var f = S.evals[list[k].id].final;
      if (f === 'periksa' || f === 'ulang') return list[k].id;
    }
    return idx + 1 < list.length ? list[idx + 1].id : null;
  }

  /* ---------- keputusan ---------- */
  function decide(id, k) {
    var row = S.byId[id]; if (!row) return;
    var v = row.verif = row.verif || {};
    var before = { keputusan: v.keputusan || null, stan_final: S.evals[id].stanFinal };
    if (v.keputusan === k) return;
    v.keputusan = k; v.by = S.settings.verifikator; v.at = Date.now();
    ST.recomputeRow(row);
    var e = S.evals[id];
    ST.audit('Keputusan', row, before, { keputusan: k, stan_final: e.stanFinal });
    if (k === 'SESUAI' && !e.stanFinal) U.toast('STAN final masih kosong — isi dengan E sebelum ekspor.', 'warn', 4500);
    afterChange(row, true);
    var label = { SESUAI: 'Sesuai', TIDAK_SESUAI: 'Tidak sesuai', RUMAH_TUTUP: 'Rumah tutup' }[k];
    U.toast(row.nama + ': ' + label, 'ok', 1600);
    if (S.ui.focus) { I.focusAfterDecision(id); return; }
    if (S.settings.autoAdvance && S.ui.inspectorOpen) {
      var nx = nextReviewAfter(id);
      if (nx) { select(nx); return; }
    }
    I.render({ keepScroll: true });
  }

  function clearDecision(id) {
    var row = S.byId[id]; if (!row || !row.verif || !row.verif.keputusan) return;
    var before = { keputusan: row.verif.keputusan };
    row.verif.keputusan = null; row.verif.at = null;
    ST.recomputeRow(row);
    ST.audit('Batalkan keputusan', row, before, { keputusan: null });
    afterChange(row, true);
    if (S.ui.focus) I.renderFocus(); else I.render({ keepScroll: true });
  }

  function setStanManual(id, val) {
    var row = S.byId[id]; if (!row) return;
    var clean = String(val || '').trim().replace(',', '.');
    if (clean && !/^\d+(\.\d+)?$/.test(clean)) { U.toast('STAN harus berupa angka, mis. 4699 atau 46.99', 'warn'); return; }
    var v = row.verif = row.verif || {};
    var aiTxt = S.evals[id].stanAI;
    var next = clean === '' || clean === aiTxt ? null : clean;
    if ((v.stanManual || null) === next) return;
    var before = { stan_manual: v.stanManual || null };
    v.stanManual = next;
    ST.recomputeRow(row);
    ST.audit('Ubah STAN manual', row, before, { stan_manual: next, stan_final: S.evals[id].stanFinal });
    afterChange(row, true);
    U.toast('STAN final ' + (S.evals[id].stanFinal || '—') + ' disimpan', 'ok', 1500);
  }

  function setStickerMonth(id, val) {
    var row = S.byId[id]; if (!row) return;
    var v = row.verif = row.verif || {}, before = { stiker: v.stickerMonth ? v.stickerMonth.label : null };
    if (!val) v.stickerMonth = null;
    else { var p = val.split('-'); v.stickerMonth = { year: +p[0], month: +p[1], label: U.BULAN[+p[1] - 1] + ' ' + p[0], source: 'manual' }; }
    ST.recomputeRow(row);
    ST.audit('Ubah bulan stiker', row, before, { stiker: v.stickerMonth ? v.stickerMonth.label : null });
    afterChange(row, false);
    if (S.ui.focus) I.renderFocus(); else I.render({ keepScroll: true });
  }

  function setNote(id, val) {
    var row = S.byId[id]; if (!row) return;
    var v = row.verif = row.verif || {};
    if ((v.catatan || '') === val) return;
    ST.audit('Ubah catatan', row, { catatan: v.catatan || null }, { catatan: val || null });
    v.catatan = val;
    ST.saveSoon();
  }

  function afterChange(row, flash) {
    if (S.ui.view === 'queue') { V.updateRow(row); if (flash) V.flashRow(row.id); }
    schedule('header'); schedule('steps');
    if (S.ui.view !== 'queue') schedule('view');
    ST.saveSoon();
  }

  function bulk(k) {
    var ids = Object.keys(S.ui.checked);
    if (k === 'APPROVE') ids = ids.filter(function (id) { return S.evals[id].final === 'sesuai_ai'; });
    var n = 0;
    ids.forEach(function (id) {
      var row = S.byId[id], kk = k === 'APPROVE' ? 'SESUAI' : k;
      row.verif = row.verif || {};
      if (kk === 'CLEAR') { if (row.verif.keputusan) { row.verif.keputusan = null; n++; } return; }
      if (row.verif.keputusan === kk) return;
      row.verif.keputusan = kk; row.verif.by = S.settings.verifikator; row.verif.at = Date.now(); n++;
    });
    ST.recompute();
    ST.audit(k === 'APPROVE' ? 'Setujui massal Sesuai AI' : k === 'CLEAR' ? 'Hapus keputusan massal' : 'Keputusan massal', null, null, { jumlah: n, keputusan: k === 'APPROVE' ? 'SESUAI' : k });
    S.ui.checked = {};
    U.toast(n + ' baris diperbarui', 'ok');
    ST.save();
    renderAll();
  }

  /* ---------- Excel & foto ---------- */
  var setup = VS.setupState;

  function onExcel(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { U.toast('File melebihi 50 MB.', 'error'); return; }
    return VS.excel.readWorkbook(file).then(function (parsed) {
      setup.parsed = parsed; setup.excelFile = file;
      setup.mapping = VS.excel.guessMapping(parsed.headers);
      setup.built = VS.excel.buildRows(parsed, setup.mapping);
      setup.pairing = null;
      ST.log('Validasi Excel', file.name + ': ' + setup.built.ok.length + ' baris IDPEL/Nama valid, ' + setup.built.bad.length + ' bermasalah.', setup.built.bad.length ? 'warn' : 'ok');
      if (setup.mapping.idpel == null) U.toast('Kolom IDPEL tidak ditemukan. Pilih kolom yang berisi IDPEL di pemetaan kolom.', 'warn', 5000);
      if (S.ui.view === 'setup') V.renderSetup();
      renderHeader();
    }).catch(function (e) { U.toast('Gagal membaca Excel: ' + e.message, 'error', 5000); });
  }

  function onPhotos(files, folderName) {
    files = Array.prototype.slice.call(files || []);
    if (!files.length) return;
    setup.files = files;
    var rel = files[0].webkitRelativePath || '';
    setup.folderName = folderName || (rel ? rel.split('/')[0] : files.length + ' berkas terpilih');
    setup.pairing = null;
    var sc = VS.excel.scanFiles(files);
    ST.log('Folder', setup.folderName + ' — ' + sc.total + ' foto (' + sc.jpg + ' JPG, ' + sc.jpeg + ' JPEG, ' + sc.png + ' PNG)', sc.total ? 'ok' : 'warn');
    if (S.ui.view === 'setup') V.renderSetup();
  }

  function pickFolder() {
    if (window.showDirectoryPicker) {
      window.showDirectoryPicker({ id: 'verdi-foto', mode: 'read' }).then(async function (dir) {
        var files = [];
        async function walk(h, depth) {
          for await (var entry of h.values()) {
            if (entry.kind === 'file' && VS.excel.isImage(entry.name)) files.push(await entry.getFile());
            else if (entry.kind === 'directory' && depth < 2) await walk(entry, depth + 1);
          }
        }
        await walk(dir, 0);
        onPhotos(files, dir.name);
      }).catch(function (e) { if (e && e.name !== 'AbortError') $('in-folder').click(); });
    } else $('in-folder').click();
  }

  async function loadAndPair() {
    if (!setup.built || !setup.built.ok.length || !setup.files) return;
    var nameInp = $('batch-name');
    var month = +$('sel-month').value, year = +$('sel-year').value;
    ST.newBatch({
      nama: (nameInp && nameInp.value.trim()) || 'Verifikasi ' + U.BULAN[month - 1] + ' ' + year, month: month, year: year,
      excelName: setup.excelFile.name, folderName: setup.folderName, fileFormat: setup.format, headers: setup.parsed.headers, mapping: setup.mapping, stages: {}, loaded: true
    });
    var rows = setup.built.ok.map(function (r, i) { var c = JSON.parse(JSON.stringify(r)); c.id = U.uid('r_'); c.no = i + 1; return c; });
    var res = VS.excel.pair(rows, setup.files, setup.format);
    var totalSize = 0;
    rows.forEach(function (r) {
      if (r._file) {
        S.files[r.id] = r._file;
        if (r._file._demoOverlay) r.demoMeta = r._file._demoOverlay;
        totalSize += r._file.size;
      }
    });
    var keep = totalSize < 350 * 1024 * 1024;
    S.rows = rows; S.byId = {};
    rows.forEach(function (r) { S.byId[r.id] = r; });
    var saves = [];
    rows.forEach(function (r) {
      var f = r._file; delete r._file;
      if (f && keep) { r.photoStored = true; saves.push(ST.putBlob(r.id, 'photo', f)); }
    });
    await Promise.all(saves);
    ST.recompute();
    setup.pairing = { paired: res.paired, rows: rows.length, unmatchedFiles: res.unmatchedFiles, noPhoto: res.noPhoto };
    ST.log('Muat data', res.paired + ' foto real dipasangkan dari ' + setup.folderName + ', ' + res.unmatchedFiles.length + ' foto tanpa baris, ' + res.noPhoto.length + ' baris tanpa foto. AI belum dijalankan.', 'ok');
    if (!keep) ST.log('Penyimpanan', 'Foto asli tidak disalin ke penyimpanan browser (total > 350 MB); thumbnail dan potongan LCD tetap tersimpan.', 'warn');
    ST.audit('Muat batch', null, null, { batch: S.batch.nama, baris: rows.length, foto: res.paired });
    U.toast(res.paired + ' foto dipasangkan', 'ok');
    await ST.save();
    renderAll();
  }

  async function runDemo() {
    if (S.job && S.job.running) return;
    U.toast('Menyiapkan data demo ULP Samboja…', 'info', 2000);
    var month = +$('sel-month').value || 9, year = +$('sel-year').value || 2026;
    var d = await VS.demo.buildDemo({ month: month, year: year });
    await onExcel(VS.excel.demoWorkbookFile(d.rows));
    onPhotos(d.files, 'D:\\PLN\\ULP-SAMBOJA\\FOTO_' + U.BULAN_SINGKAT[month - 1] + '_' + year);
    setup.batchName = 'Demo ULP Samboja ' + U.BULAN[month - 1] + ' ' + year;
    var inp = $('batch-name'); if (inp) inp.value = setup.batchName;
    await loadAndPair();
    nav('process');
    setTimeout(function () { runScope('all'); }, 350);
  }

  function runScope(scope, ids) {
    if (!S.batch) return;
    if (scope === 'all') {
      var un = S.rows.filter(function (r) { return r.photo && !(r.ai && r.ai.done); });
      ids = (un.length ? un : S.rows.filter(function (r) { return r.photo; })).map(function (r) { return r.id; });
      ST.log('Proses', 'Memulai PROSES SEMUA DATA (' + ids.length + ' foto)…', 'info');
    } else if (scope === 'page') {
      ids = UI.visibleIds();
      ST.log('Proses', 'Memproses halaman ini (' + ids.length + ' foto)…', 'info');
    } else if (scope === 'selected') {
      ids = Object.keys(S.ui.checked);
    }
    VS.engine.run(scope, ids || []);
    renderHeader();
    if (S.ui.view === 'process') V.renderProcess();
  }

  function exportAll(selectedOnly) {
    if (!S.batch || !S.rows.length) { U.toast('Belum ada data untuk diekspor.', 'warn'); return; }
    var rows = selectedOnly ? S.rows.filter(function (r) { return S.ui.checked[r.id]; }) : S.rows;
    try {
      var name = VS.excel.exportXlsx(rows, selectedOnly ? 'terpilih' : '');
      ST.audit('Ekspor Excel', null, null, { file: name, baris: rows.length });
      ST.log('Ekspor', name + ' (' + rows.length + ' baris)', 'ok');
      U.toast('Ekspor selesai: ' + name, 'ok');
      renderSteps();
    } catch (e) { U.toast('Ekspor gagal: ' + e.message, 'error'); }
  }

  /* ---------- log drawer ---------- */
  function toggleLog(open) {
    S.ui.logOpen = open == null ? !S.ui.logOpen : open;
    $('log-drawer').hidden = !S.ui.logOpen;
    $('btn-log').setAttribute('aria-expanded', S.ui.logOpen);
    if (S.ui.logOpen) { $('log-body').innerHTML = '<div class="console">' + V.logLines(500, S.ui.logLevel) + '</div>'; $('log-body').scrollTop = 1e9; }
  }
  function copyLog() {
    var txt = S.logs.map(function (l) { return '[' + U.fmtTime(l.t) + '] [' + l.tag + '] ' + l.msg; }).join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { U.toast('Log disalin', 'ok'); }, function () { U.toast('Tidak dapat menyalin', 'warn'); });
  }
  function clearLog() { S.logs = []; toggleLog(S.ui.logOpen); if (S.ui.view === 'process') V.renderProcess(); renderHeader(); ST.saveSoon(); }

  /* ---------- aksi klik ---------- */
  var actions = {
    nav: function (el) { nav(el.getAttribute('data-view')); },
    demo: runDemo,
    template: function () { VS.excel.templateXlsx(); },
    'pick-excel': function () { $('in-excel').click(); },
    'pick-folder': pickFolder,
    'pick-photos': function () { $('in-photos').click(); },
    rescan: function () { if (setup.files) onPhotos(setup.files, setup.folderName); },
    'load-pair': loadAndPair,
    'dl-bad': function () {
      var aoa = [['Baris', 'IDPEL', 'Nama', 'Masalah']].concat(setup.built.bad.map(function (b) { return [b.baris, b.idpel, b.nama, b.masalah]; }));
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Bermasalah'); XLSX.writeFile(wb, 'baris_bermasalah.xlsx');
    },
    'run-all': function () { if (S.ui.view !== 'process') nav('process'); runScope('all'); },
    'run-page': function () { runScope('page'); },
    'run-selected': function () { runScope('selected'); },
    'run-one': function (el) { VS.engine.run('one', [el.getAttribute('data-id')]); },
    stop: function () { VS.engine.stop(); },
    'toggle-stage': function (el) {
      var k = el.getAttribute('data-stage'), st = S.batch.stages = S.batch.stages || {};
      st[k] = st[k] === false; ST.saveSoon(); V.renderProcess();
      ST.log('Tahap', (st[k] === false ? 'Nonaktif: ' : 'Aktif: ') + k, 'info');
    },
    select: function (el, e) {
      if (e.target.closest('input,button:not([data-action="select"])')) return;
      select(el.getAttribute('data-id'));
    },
    open: function (el) { select(el.getAttribute('data-id')); },
    'close-inspector': function () { S.ui.inspectorOpen = false; I.render(); if (S.ui.view === 'queue') V.drawRows(true); },
    prev: function () { move(-1); }, next: function () { move(1); },
    decide: function (el) { decide(el.getAttribute('data-id'), el.getAttribute('data-k')); },
    'clear-decision': function (el) { clearDecision(el.getAttribute('data-id')); },
    focus: function () { I.openFocus(); },
    'close-focus': function () { I.closeFocus(); },
    'focus-prev': function () { I.focusMove(-1); }, 'focus-next': function () { I.focusMove(1); },
    'focus-go': function (el) { I.focusGo(+el.getAttribute('data-i')); },
    'goto-seg': function (el) {
      var seg = el.getAttribute('data-seg');
      S.ui.filter = { q: '', status: '', cv: '', verif: seg === 'review' ? 'review' : '', lokasi: '', seg: seg === 'review' ? '' : seg };
      S.ui.page = 1; nav('queue');
    },
    'filter-group': function (el) {
      S.ui.filter = { q: el.getAttribute('data-val').indexOf('(tanpa') === 0 ? '' : el.getAttribute('data-val'), status: '', cv: '', verif: '', lokasi: '', seg: '' };
      S.ui.page = 1; nav('queue');
    },
    'toggle-table': function (el) {
      var box = $(el.getAttribute('data-target')); if (!box) return;
      var t = box.querySelector('.mini-table'), c = box.querySelector('.chart-view');
      var showTable = t.hidden; t.hidden = !showTable; c.hidden = showTable;
      el.innerHTML = showTable ? icon('chart') + 'Grafik' : icon('grid') + 'Tabel';
    },
    'reset-filter': function () { S.ui.filter = { q: '', status: '', cv: '', verif: '', lokasi: '', seg: '' }; S.ui.page = 1; V.renderQueue(); },
    page: function (el) { S.ui.page = +el.getAttribute('data-p'); $('q-body').scrollTop = 0; V.drawRows(true); },
    'bulk-approve': function () { bulk('APPROVE'); },
    bulk: function (el) { bulk(el.getAttribute('data-k')); },
    'bulk-clear-decision': function () { bulk('CLEAR'); },
    uncheck: function () { S.ui.checked = {}; refreshChecks(); },
    export: function () { exportAll(false); },
    'export-selected': function () { exportAll(true); },
    print: function () { window.print(); },
    'open-batch': function (el) {
      var id = el.getAttribute('data-id');
      ST.loadBatch(id).then(function (ok) {
        if (!ok) { U.toast('Batch tidak ditemukan.', 'error'); return; }
        $('sel-month').value = S.batch.month; $('sel-year').value = S.batch.year;
        U.toast('Batch “' + S.batch.nama + '” dibuka', 'ok');
        S.ui.inspectorOpen = false;
        nav(S.stats.review ? 'queue' : 'dash'); renderAll();
      });
    },
    'delete-batch': function (el) {
      var id = el.getAttribute('data-id'), b = S.batches.filter(function (x) { return x.id === id; })[0];
      UI.confirm('Hapus batch?', 'Batch “' + esc(b ? b.nama : id) + '” beserta thumbnail, potongan LCD, dan riwayatnya akan dihapus dari browser ini. Tindakan ini tidak dapat dibatalkan.', 'Hapus').then(function (ok) {
        if (!ok) return;
        ST.deleteBatch(id).then(function () {
          if (S.batch && S.batch.id === id) { ST.newBatch(); S.batch = null; S.rows = []; ST.recompute(); }
          U.toast('Batch dihapus', 'ok'); renderAll();
        });
      });
    },
    'log-copy': copyLog, 'log-clear': clearLog
  };

  function refreshChecks() {
    var slot = $('bulk-slot'); if (slot) slot.innerHTML = V.bulkBar(Object.keys(S.ui.checked).length);
    if (S.ui.view === 'queue') V.drawRows(true);
    if (S.ui.view === 'process') V.renderProcess();
  }

  /* ---------- pintasan keyboard ---------- */
  var gPending = false;
  function onKey(e) {
    if (document.querySelector('.modal-backdrop')) return;
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (typing) {
      if (e.key === 'Escape') { e.target.blur(); return; }
      if (e.key === 'Enter' && e.target.hasAttribute('data-stan-input')) { e.preventDefault(); setStanManual(e.target.getAttribute('data-stan-input'), e.target.value); e.target.blur(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && S.ui.view === 'queue') {
        e.preventDefault(); UI.filteredRows().forEach(function (r) { S.ui.checked[r.id] = true; }); refreshChecks();
      }
      return;
    }
    var k = e.key;
    if (gPending) {
      gPending = false;
      var m = { d: 'dash', p: 'process', q: 'queue', l: 'report', r: 'history', s: 'setup' }[k.toLowerCase()];
      if (m) { e.preventDefault(); if (S.ui.focus) I.closeFocus(); nav(m); }
      return;
    }
    var sel = S.ui.selectedId;
    switch (k) {
      case '/': e.preventDefault(); if (S.ui.focus) I.closeFocus(); if (S.ui.view !== 'queue') nav('queue'); setTimeout(function () { var s = $('q-search'); if (s) s.focus(); }, 30); break;
      case '?': e.preventDefault(); V.openKeys(); break;
      case 'g': gPending = true; setTimeout(function () { gPending = false; }, 1200); break;
      case 'j': case 'J': case 'ArrowDown': if (S.ui.view === 'queue' || S.ui.focus || S.ui.inspectorOpen) { e.preventDefault(); move(1); } break;
      case 'k': case 'K': case 'ArrowUp': if (S.ui.view === 'queue' || S.ui.focus || S.ui.inspectorOpen) { e.preventDefault(); move(-1); } break;
      case 'Enter': if (sel && !S.ui.focus) { e.preventDefault(); select(sel); } break;
      case 's': case 'S': if (sel && (S.ui.inspectorOpen || S.ui.focus)) { e.preventDefault(); decide(sel, 'SESUAI'); } break;
      case 't': case 'T': if (sel && (S.ui.inspectorOpen || S.ui.focus)) { e.preventDefault(); decide(sel, 'TIDAK_SESUAI'); } break;
      case 'r': case 'R': if (sel && (S.ui.inspectorOpen || S.ui.focus)) { e.preventDefault(); decide(sel, 'RUMAH_TUTUP'); } break;
      case 'e': case 'E': if (sel) { e.preventDefault(); var inp = document.querySelector('[data-stan-input="' + sel + '"]'); if (inp) { inp.focus(); inp.select(); } } break;
      case 'b': case 'B': I.toggleBoxes(); break;
      case 'z': case 'Z': var stc = I.stage(); if (stc) stc.toggleOne(); break;
      case 'f': case 'F': e.preventDefault(); if (S.ui.focus) I.closeFocus(); else I.openFocus(); break;
      case 'x': case 'X': if (sel && S.ui.view === 'queue') { if (S.ui.checked[sel]) delete S.ui.checked[sel]; else S.ui.checked[sel] = true; refreshChecks(); } break;
      case 'Escape':
        if (S.ui.focus) I.closeFocus();
        else if (S.ui.logOpen) toggleLog(false);
        else if (S.ui.inspectorOpen) { S.ui.inspectorOpen = false; I.render(); if (S.ui.view === 'queue') V.drawRows(true); }
        break;
    }
  }

  /* ---------- inisialisasi ---------- */
  function wire() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]');
      if (a && !a.disabled) {
        var fn = actions[a.getAttribute('data-action')];
        if (fn) { fn(a, e); return; }
      }
      var seg = e.target.closest('[data-seg]');
      if (seg && seg.closest('.strip, .legend') && !seg.closest('.kpi')) {
        var k = seg.getAttribute('data-seg');
        S.ui.filter.seg = S.ui.filter.seg === k ? '' : k; S.ui.page = 1;
        if (S.ui.view !== 'queue') nav('queue'); else V.renderQueue();
      }
    });
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-check')) { var id = t.getAttribute('data-check'); if (t.checked) S.ui.checked[id] = true; else delete S.ui.checked[id]; var slot = $('bulk-slot'); if (slot) slot.innerHTML = V.bulkBar(Object.keys(S.ui.checked).length); return; }
      if (t.id === 'chk-all') { UI.pageRows().rows.forEach(function (r) { if (t.checked) S.ui.checked[r.id] = true; else delete S.ui.checked[r.id]; }); refreshChecks(); return; }
      if (t.hasAttribute('data-filter')) { S.ui.filter[t.getAttribute('data-filter')] = t.value; S.ui.page = 1; V.drawRows(true); var sc = $('q-strip'); if (sc) sc.innerHTML = V.stripCard(); return; }
      if (t.id === 'page-size') { S.ui.pageSize = +t.value; S.ui.page = 1; V.drawRows(true); return; }
      if (t.hasAttribute('data-map')) {
        var v = t.value === '' ? null : +t.value; setup.mapping[t.getAttribute('data-map')] = v;
        if (v == null) delete setup.mapping[t.getAttribute('data-map')];
        setup.built = VS.excel.buildRows(setup.parsed, setup.mapping); V.renderSetup(); return;
      }
      if (t.name === 'fmt') { setup.format = t.value; setup.pairing = null; return; }
      if (t.hasAttribute('data-stan-input')) { setStanManual(t.getAttribute('data-stan-input'), t.value); return; }
      if (t.hasAttribute('data-sticker-month')) { setStickerMonth(t.getAttribute('data-sticker-month'), t.value); return; }
      if (t.hasAttribute('data-note')) { setNote(t.getAttribute('data-note'), t.value); return; }
      if (t.id === 'log-level') { S.ui.logLevel = t.value; toggleLog(true); return; }
      if (t.id === 'batch-name') { setup.batchName = t.value; return; }
    });
    document.addEventListener('input', U.debounce(function (e) {
      if (e.target.id === 'q-search') { S.ui.filter.q = e.target.value; S.ui.page = 1; V.drawRows(true); }
      if (e.target.id === 'hist-search') { S.ui.histQ = e.target.value; V.renderHistory(); var h = $('hist-search'); h.focus(); h.setSelectionRange(h.value.length, h.value.length); }
    }, 160));
    document.addEventListener('keydown', onKey);

    $('in-excel').addEventListener('change', function (e) { onExcel(e.target.files[0]); e.target.value = ''; });
    $('in-folder').addEventListener('change', function (e) { onPhotos(e.target.files); e.target.value = ''; });
    $('in-photos').addEventListener('change', function (e) { onPhotos(e.target.files, e.target.files.length + ' berkas terpilih'); e.target.value = ''; });
    $('btn-settings').addEventListener('click', V.openSettings);
    $('btn-keys').addEventListener('click', V.openKeys);
    $('btn-theme').addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      S.settings.theme = dark ? 'light' : 'dark'; ST.saveSettings(); applyTheme();
    });
    $('btn-log').addEventListener('click', function () { toggleLog(); });
    $('log-close').addEventListener('click', function () { toggleLog(false); });
    $('log-copy').addEventListener('click', copyLog);
    $('log-clear').addEventListener('click', clearLog);

    var ms = $('sel-month'), ys = $('sel-year');
    ms.innerHTML = U.BULAN.map(function (b, i) { return '<option value="' + (i + 1) + '">' + b + '</option>'; }).join('');
    var now = new Date(), yy = '';
    for (var y = now.getFullYear() + 1; y >= now.getFullYear() - 3; y--) yy += '<option value="' + y + '">' + y + '</option>';
    ys.innerHTML = yy;
    ms.value = now.getMonth() + 1; ys.value = now.getFullYear();
    function onPeriod() {
      if (S.batch) {
        var before = { periode: U.BULAN[S.batch.month - 1] + ' ' + S.batch.year };
        S.batch.month = +ms.value; S.batch.year = +ys.value;
        ST.audit('Ubah periode', null, before, { periode: U.BULAN[S.batch.month - 1] + ' ' + S.batch.year });
        ST.recompute(); ST.save();
      }
      renderAll();
    }
    ms.addEventListener('change', onPeriod); ys.addEventListener('change', onPeriod);

    VS.bus.on('row', function (row) {
      if (S.ui.view === 'queue') V.updateRow(row);
      if (row.id === S.ui.selectedId) {
        var lit = row.stage === 'idle' && row.ai && row.ai.done && Date.now() - row.ai.processedAt < 1500;
        if (S.ui.focus) I.renderFocus({ lit: lit }); else I.render({ keepScroll: true, lit: lit });
      }
      schedule('header'); schedule('steps'); schedule('view');
    });
    VS.bus.on('job', function () { schedule('header'); schedule('steps'); schedule('view'); });
    VS.bus.on('change', function () { renderAll(); });
    VS.bus.on('engine', function () { renderHeader(); });
    VS.bus.on('log', function (l) {
      if (S.ui.logOpen && (!S.ui.logLevel || l.level === S.ui.logLevel)) {
        var c = $('log-body').querySelector('.console'); if (c) { c.insertAdjacentHTML('beforeend', V.logLine(l)); $('log-body').scrollTop = 1e9; }
      }
      var pc = $('proc-console');
      if (pc && S.ui.view === 'process') { pc.insertAdjacentHTML('beforeend', V.logLine(l)); pc.scrollTop = pc.scrollHeight; }
      $('log-count').textContent = S.logs.length > 999 ? '999+' : S.logs.length;
    });

    function tick() { var d = new Date(); $('clock').textContent = U.fmtLongDate(d) + ' — ' + U.fmtTime(d); }
    tick(); setInterval(tick, 1000);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    window.addEventListener('beforeunload', function () { ST.save(); });
  }

  async function start() {
    UI.initTips();
    wire();
    var active = await ST.init();
    applyTheme();
    VS.engine.init(S.settings.workers);
    if (active) {
      var ok = await ST.loadBatch(active);
      if (ok) { $('sel-month').value = S.batch.month; $('sel-year').value = S.batch.year; }
    }
    if (!S.stats) ST.recompute();
    var v = 'dash';
    try { v = localStorage.getItem('vs-view') || 'dash'; } catch (e) { /* abaikan */ }
    if (!S.batch && v !== 'setup') v = 'dash';
    nav(v);
    renderHeader();
    if (/[?&]demo\b/.test(location.search) && !S.batch) runDemo();
  }

  VS.app = { renderAll: renderAll, applyTheme: applyTheme, onExcel: onExcel, onPhotos: onPhotos, nav: nav, decide: decide, select: select };
  start();
})();
