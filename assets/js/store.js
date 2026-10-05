/* VERDI SAMBO — state aplikasi, persistensi (IndexedDB), log, dan audit. */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};
  var U = VS.util, DB = U.store;

  var listeners = {};
  var bus = {
    on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit: function (ev, data) { (listeners[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); }
  };

  var state = {
    batch: null, rows: [], byId: {}, evals: {}, stats: null, dup: { map: {}, list: [] },
    settings: Object.assign({}, VS.rules.DEFAULT_SETTINGS),
    files: {}, urls: {}, logs: [], audit: [], batches: [],
    job: null,
    ui: {
      view: 'dash', selectedId: null, checked: {}, page: 1, pageSize: 20,
      filter: { q: '', status: '', cv: '', verif: '', lokasi: '', seg: '' },
      inspectorOpen: false, focus: false, showBoxes: true, logOpen: false, logLevel: ''
    },
    throughput: []
  };

  function log(tag, msg, level) {
    var e = { t: Date.now(), tag: tag, msg: msg, level: level || 'info' };
    state.logs.push(e);
    if (state.logs.length > 1500) state.logs.splice(0, state.logs.length - 1500);
    bus.emit('log', e);
    saveSoon();
  }

  function audit(action, row, before, after) {
    var e = {
      id: U.uid('a_'), t: Date.now(), oleh: state.settings.verifikator || 'Verifikator',
      aksi: action, idpel: row ? row.idpel : null, nama: row ? row.nama : null, sebelum: before, sesudah: after
    };
    state.audit.unshift(e);
    bus.emit('audit', e);
    saveSoon();
  }

  function recompute() {
    var ctx = { settings: state.settings, period: state.batch ? { month: state.batch.month, year: state.batch.year } : {} };
    state.dup = VS.rules.computeDuplicates(state.rows, state.settings.dupDistance);
    ctx.dupMap = state.dup.map;
    var ev = {};
    state.rows.forEach(function (r) { ev[r.id] = VS.rules.evaluate(r, ctx); });
    state.evals = ev;
    state.stats = VS.rules.stats(state.rows, ev);
  }

  function recomputeRow(row) {
    var ctx = { settings: state.settings, period: { month: state.batch.month, year: state.batch.year }, dupMap: state.dup.map };
    state.evals[row.id] = VS.rules.evaluate(row, ctx);
    state.stats = VS.rules.stats(state.rows, state.evals);
  }

  // ---------- persistensi ----------
  var saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  }

  function serializableRows() {
    return state.rows.map(function (r) {
      var c = Object.assign({}, r);
      if (c.stage === 'running' || c.stage === 'queued') c.stage = 'idle';
      return c;
    });
  }

  function save() {
    if (!state.batch) return Promise.resolve();
    var b = state.batch;
    var meta = {
      id: b.id, nama: b.nama, unit: b.unit, month: b.month, year: b.year, excelName: b.excelName,
      folderName: b.folderName, createdAt: b.createdAt, updatedAt: Date.now(), total: state.rows.length,
      processed: state.stats ? state.stats.processed : 0, review: state.stats ? state.stats.review : 0
    };
    var i = state.batches.findIndex(function (x) { return x.id === b.id; });
    if (i >= 0) state.batches[i] = meta; else state.batches.unshift(meta);
    return Promise.all([
      DB.put('kv', 'batch:' + b.id, { batch: b, rows: serializableRows(), audit: state.audit.slice(0, 3000), logs: state.logs.slice(-500) }),
      DB.put('kv', 'batches', state.batches),
      DB.put('kv', 'activeBatch', b.id)
    ]);
  }

  function saveSettings() {
    return DB.put('kv', 'settings', state.settings);
  }

  function revokeUrls() {
    Object.keys(state.urls).forEach(function (k) {
      var u = state.urls[k];
      ['photo', 'crop', 'thumb'].forEach(function (t) { if (u[t]) URL.revokeObjectURL(u[t]); });
    });
    state.urls = {};
  }

  function setBlobUrl(rowId, type, blob) {
    var u = state.urls[rowId] = state.urls[rowId] || {};
    if (u[type]) URL.revokeObjectURL(u[type]);
    u[type] = blob ? URL.createObjectURL(blob) : null;
  }

  function putBlob(rowId, type, blob) {
    setBlobUrl(rowId, type, blob);
    return DB.put('blobs', state.batch.id + ':' + rowId + ':' + type, blob);
  }

  function getPhotoBlob(row) {
    if (state.files[row.id]) return Promise.resolve(state.files[row.id]);
    return DB.get('blobs', state.batch.id + ':' + row.id + ':photo');
  }

  function loadBatch(id) {
    return DB.get('kv', 'batch:' + id).then(function (data) {
      if (!data) return false;
      revokeUrls();
      state.batch = data.batch; state.rows = data.rows || []; state.audit = data.audit || []; state.logs = data.logs || [];
      state.files = {}; state.byId = {};
      state.rows.forEach(function (r) { state.byId[r.id] = r; });
      state.ui.checked = {}; state.ui.selectedId = null; state.ui.page = 1;
      recompute();
      // muat thumbnail & crop secara bertahap
      var jobs = state.rows.map(function (r) {
        return Promise.all(['thumb', 'crop', 'photo'].map(function (t) {
          if (t === 'photo' && !r.photoStored) return null;
          return DB.get('blobs', state.batch.id + ':' + r.id + ':' + t).then(function (b) { if (b) setBlobUrl(r.id, t, b); });
        }));
      });
      return Promise.all(jobs).then(function () { DB.put('kv', 'activeBatch', id); return true; });
    });
  }

  function deleteBatch(id) {
    state.batches = state.batches.filter(function (b) { return b.id !== id; });
    return Promise.all([DB.del('kv', 'batch:' + id), DB.delPrefix('blobs', id + ':'), DB.put('kv', 'batches', state.batches)]);
  }

  function init() {
    return Promise.all([DB.get('kv', 'settings'), DB.get('kv', 'batches'), DB.get('kv', 'activeBatch')]).then(function (res) {
      if (res[0]) state.settings = Object.assign({}, VS.rules.DEFAULT_SETTINGS, res[0]);
      state.batches = res[1] || [];
      return res[2];
    });
  }

  function newBatch(opts) {
    revokeUrls();
    state.batch = Object.assign({
      id: U.uid('b_'), nama: 'Batch', unit: 'ULP Samboja', month: 9, year: 2026, excelName: null, folderName: null,
      fileFormat: 'IDPEL', createdAt: Date.now(), mapping: null, loaded: false, photoStats: null
    }, opts || {});
    state.rows = []; state.byId = {}; state.files = {}; state.audit = []; state.logs = [];
    state.ui.checked = {}; state.ui.selectedId = null; state.ui.page = 1;
    recompute();
  }

  VS.bus = bus;
  VS.state = state;
  VS.store = {
    log: log, audit: audit, recompute: recompute, recomputeRow: recomputeRow, save: save, saveSoon: saveSoon,
    saveSettings: saveSettings, putBlob: putBlob, setBlobUrl: setBlobUrl, getPhotoBlob: getPhotoBlob,
    loadBatch: loadBatch, deleteBatch: deleteBatch, init: init, newBatch: newBatch, revokeUrls: revokeUrls
  };
})();
