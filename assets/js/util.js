/* VERDI SAMBO — utilitas umum */
(function () {
  'use strict';
  var VS = window.VS = window.VS || {};

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BULAN_SINGKAT = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function uid(prefix) {
    var a = new Uint8Array(8);
    (self.crypto || window.crypto).getRandomValues(a);
    return (prefix || '') + Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }

  function fmtNum(n, d) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 });
  }

  function pct(a, b, d) { return b ? fmtNum(a * 100 / b, d == null ? 1 : d) + '%' : '0%'; }

  function fmtTime(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function fmtDateTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fmtLongDate(d) {
    return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  function haversine(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(function (v) { return v == null || isNaN(v); })) return null;
    var R = 6371, toR = Math.PI / 180;
    var dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function similarity(a, b) {
    // kemiripan Dice berbasis bigram (0..1)
    a = String(a || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    b = String(b || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    var m = {}, i, inter = 0;
    for (i = 0; i < a.length - 1; i++) { var bg = a.substr(i, 2); m[bg] = (m[bg] || 0) + 1; }
    for (i = 0; i < b.length - 1; i++) { var bg2 = b.substr(i, 2); if (m[bg2] > 0) { m[bg2]--; inter++; } }
    return 2 * inter / (a.length + b.length - 2);
  }

  /* tanggal stempel kamera: MM/DD/YYYY HH:MM:SS */
  function parseStampDate(s) {
    if (!s) return null;
    var m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return new Date(+m[3], +m[1] - 1, +m[2], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
  }

  // ---------- IndexedDB minimal ----------
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('IndexedDB tidak tersedia'));
      var r = indexedDB.open('verdi-sambo', 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs');
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function idb(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(store, mode), st = tx.objectStore(store), out = fn(st);
        tx.oncomplete = function () { res(out && 'result' in out ? out.result : out); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error); };
      });
    });
  }
  var store = {
    get: function (s, k) { return idb(s, 'readonly', function (st) { return st.get(k); }).catch(function () { return null; }); },
    put: function (s, k, v) { return idb(s, 'readwrite', function (st) { st.put(v, k); }).catch(function (e) { console.warn(e); }); },
    del: function (s, k) { return idb(s, 'readwrite', function (st) { st.delete(k); }).catch(function () {}); },
    delPrefix: function (s, prefix) {
      return idb(s, 'readwrite', function (st) {
        var range = IDBKeyRange.bound(prefix, prefix + '￿');
        st.delete(range);
      }).catch(function () {});
    }
  };

  // ---------- toast ----------
  function toast(msg, kind, ms) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast toast-' + (kind || 'info');
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="toast-dot"></span><span></span>';
    el.lastChild.textContent = msg;
    host.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); }, ms || 3200);
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  VS.util = {
    esc: esc, uid: uid, pad: pad, fmtNum: fmtNum, pct: pct, fmtTime: fmtTime, fmtDateTime: fmtDateTime, fmtLongDate: fmtLongDate,
    haversine: haversine, debounce: debounce, similarity: similarity, parseStampDate: parseStampDate,
    store: store, toast: toast, download: download, BULAN: BULAN, BULAN_SINGKAT: BULAN_SINGKAT
  };
})();
