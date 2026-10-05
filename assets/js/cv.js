/* VERDI SAMBO — mesin Computer Vision (berjalan di browser / Web Worker).
 *
 * Semua fungsi didefinisikan di dalam satu factory agar kode yang sama dapat
 * dijalankan di thread utama maupun disalin utuh ke Web Worker (Blob URL),
 * termasuk saat aplikasi dibuka langsung dari file:// atau Apps Script.
 *
 * Tahapan yang diimplementasikan nyata (tanpa server):
 *   G0  metadata berkas, pHash (DCT 8x8) untuk deteksi duplikat
 *   G1  kelayakan foto: kecerahan, ketajaman (varians Laplacian), colorfulness,
 *       rasio gradien horizon, keberadaan layar LCD
 *   G2  deteksi area LCD (segmentasi warna layar + komponen terhubung)
 *   G3  normalisasi crop LCD + 3 varian binarisasi
 *   G4  pembaca angka 7-segmen + keyakinan per digit + konsistensi antar varian
 *   G7  deteksi stiker petugas (blob kuning)
 */
function VS_CV_FACTORY() {
  'use strict';

  var HAS_OFFSCREEN = typeof OffscreenCanvas !== 'undefined';

  function makeCanvas(w, h) {
    if (HAS_OFFSCREEN) return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function canvasToBlob(c, type, q) {
    if (c.convertToBlob) return c.convertToBlob({ type: type, quality: q });
    return new Promise(function (res) { c.toBlob(res, type, q); });
  }

  // ---------- konversi dasar ----------
  function toGray(img) {
    var d = img.data, n = img.width * img.height, g = new Uint8ClampedArray(n);
    for (var i = 0, j = 0; i < n; i++, j += 4) g[i] = (d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000;
    return g;
  }

  function resizeGray(g, w, h, nw, nh) {
    var out = new Float32Array(nw * nh), sx = w / nw, sy = h / nh;
    for (var y = 0; y < nh; y++) {
      var y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (var x = 0; x < nw; x++) {
        var x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        var s = 0, c = 0;
        for (var yy = y0; yy < y1 && yy < h; yy++) for (var xx = x0; xx < x1 && xx < w; xx++) { s += g[yy * w + xx]; c++; }
        out[y * nw + x] = c ? s / c : 0;
      }
    }
    return out;
  }

  function downscaleRGB(img, nw) {
    var w = img.width, h = img.height, nh = Math.max(1, Math.round(h * nw / w));
    var sx = w / nw, sy = h / nh, d = img.data, out = new Uint8ClampedArray(nw * nh * 3);
    for (var y = 0; y < nh; y++) {
      var y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (var x = 0; x < nw; x++) {
        var x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        var r = 0, gg = 0, b = 0, c = 0;
        for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) {
          var k = (yy * w + xx) * 4; r += d[k]; gg += d[k + 1]; b += d[k + 2]; c++;
        }
        var o = (y * nw + x) * 3; out[o] = r / c; out[o + 1] = gg / c; out[o + 2] = b / c;
      }
    }
    return { data: out, width: nw, height: nh };
  }

  function hsv(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, mx ? d / mx : 0, mx / 255];
  }

  // ---------- metrik kualitas ----------
  function laplacianVar(g, w, h) {
    var s = 0, s2 = 0, n = 0;
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      var i = y * w + x;
      var v = g[i - w] + g[i + w] + g[i - 1] + g[i + 1] - 4 * g[i];
      s += v; s2 += v * v; n++;
    }
    var m = s / n; return s2 / n - m * m;
  }

  function colorfulness(rgb) {
    var d = rgb.data, n = rgb.width * rgb.height, srg = 0, syb = 0, srg2 = 0, syb2 = 0, blue = 0;
    for (var i = 0; i < n; i++) {
      var r = d[i * 3], g = d[i * 3 + 1], b = d[i * 3 + 2];
      var rg = r - g, yb = 0.5 * (r + g) - b;
      srg += rg; syb += yb; srg2 += rg * rg; syb2 += yb * yb;
      var hv = hsv(r, g, b); if (hv[0] > 195 && hv[0] < 250 && hv[1] > 0.45 && hv[2] > 0.3) blue++;
    }
    var mrg = srg / n, myb = syb / n;
    var sd = Math.sqrt(Math.max(0, srg2 / n - mrg * mrg) + Math.max(0, syb2 / n - myb * myb));
    var mn = Math.sqrt(mrg * mrg + myb * myb);
    return { value: sd + 0.3 * mn, blueShare: blue / n };
  }

  function gradientRatio(g, w, h) {
    var vx = 0, vy = 0;
    for (var y = 1; y < h; y++) for (var x = 1; x < w; x++) {
      var i = y * w + x;
      vx += Math.abs(g[i] - g[i - 1]); vy += Math.abs(g[i] - g[i - w]);
    }
    return { vx: Math.round(vx / 10), vy: Math.round(vy / 10), ratio: vy / Math.max(1, vx) };
  }

  // ---------- komponen terhubung ----------
  function components(mask, w, h, minArea) {
    var lab = new Int32Array(w * h), comps = [], stack = new Int32Array(w * h), id = 0;
    for (var p = 0; p < w * h; p++) {
      if (!mask[p] || lab[p]) continue;
      id++; var sp = 0; stack[sp++] = p; lab[p] = id;
      var x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0;
      while (sp) {
        var q = stack[--sp], qx = q % w, qy = (q / w) | 0; area++;
        if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
        if (qx > 0 && mask[q - 1] && !lab[q - 1]) { lab[q - 1] = id; stack[sp++] = q - 1; }
        if (qx < w - 1 && mask[q + 1] && !lab[q + 1]) { lab[q + 1] = id; stack[sp++] = q + 1; }
        if (qy > 0 && mask[q - w] && !lab[q - w]) { lab[q - w] = id; stack[sp++] = q - w; }
        if (qy < h - 1 && mask[q + w] && !lab[q + w]) { lab[q + w] = id; stack[sp++] = q + w; }
      }
      if (area >= (minArea || 1)) comps.push({ id: id, x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0 + 1, h: y1 - y0 + 1, area: area });
    }
    return comps;
  }

  function dilate(mask, w, h) {
    var o = new Uint8Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x;
      if (mask[i] || (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w])) o[i] = 1;
    }
    return o;
  }

  // ---------- G2 deteksi LCD ----------
  function detectLcd(rgb) {
    var w = rgb.width, h = rgb.height, d = rgb.data, mask = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var hv = hsv(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
      if (hv[0] >= 45 && hv[0] <= 118 && hv[1] >= 0.08 && hv[1] <= 0.6 && hv[2] >= 0.42) mask[i] = 1;
    }
    mask = dilate(mask, w, h);
    var comps = components(mask, w, h, Math.max(12, w * h * 0.004)), best = null;
    comps.forEach(function (c) {
      var aspect = c.w / c.h, fill = c.area / (c.w * c.h);
      if (aspect < 1.4 || aspect > 7.5 || fill < 0.45) return;
      // rata-rata kecerahan dan saturasi di dalam kotak (layar menyala cukup terang)
      var score = c.area * fill * (aspect > 1.8 && aspect < 5 ? 1.2 : 1);
      if (!best || score > best.score) best = { x0: c.x0, y0: c.y0, w: c.w, h: c.h, fill: fill, aspect: aspect, area: c.area, score: score };
    });
    return { box: best, maskShare: comps.reduce(function (a, c) { return a + c.area; }, 0) / (w * h) };
  }

  // ---------- G7 stiker ----------
  function detectSticker(rgb, lcdBox) {
    var w = rgb.width, h = rgb.height, d = rgb.data, mask = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var hv = hsv(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
      if (hv[0] >= 36 && hv[0] <= 64 && hv[1] >= 0.45 && hv[2] >= 0.62) mask[i] = 1;
    }
    var comps = components(dilate(mask, w, h), w, h, Math.max(6, w * h * 0.0015)), best = null;
    comps.forEach(function (c) {
      var fill = c.area / (c.w * c.h), aspect = c.w / c.h;
      if (fill < 0.5 || aspect < 0.6 || aspect > 6) return;
      if (lcdBox && c.x0 >= lcdBox.x0 && c.x1 <= lcdBox.x0 + lcdBox.w && c.y0 >= lcdBox.y0 && c.y1 <= lcdBox.y0 + lcdBox.h) return;
      if (!best || c.area > best.area) best = { x0: c.x0, y0: c.y0, w: c.w, h: c.h, area: c.area };
    });
    return best;
  }

  // ---------- G0 pHash ----------
  function phash(g, w, h) {
    var N = 32, s = resizeGray(g, w, h, N, N), dct = new Float32Array(64);
    for (var u = 0; u < 8; u++) for (var v = 0; v < 8; v++) {
      var sum = 0;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++)
        sum += s[y * N + x] * Math.cos((2 * x + 1) * u * Math.PI / 64) * Math.cos((2 * y + 1) * v * Math.PI / 64);
      dct[v * 8 + u] = sum;
    }
    var vals = Array.prototype.slice.call(dct, 1).sort(function (a, b) { return a - b; });
    var med = vals[31], hex = '', nib = 0;
    for (var k = 0; k < 64; k++) {
      nib = (nib << 1) | (dct[k] > med ? 1 : 0);
      if (k % 4 === 3) { hex += nib.toString(16); nib = 0; }
    }
    return hex;
  }

  function hamming(a, b) {
    if (!a || !b || a.length !== b.length) return 64;
    var n = 0;
    for (var i = 0; i < a.length; i++) {
      var x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      while (x) { n += x & 1; x >>= 1; }
    }
    return n;
  }

  /* sidik jari halus 32x24 (base64) untuk memastikan duplikat: pHash saja terlalu
     kasar karena foto meter sejenis memiliki komposisi yang mirip */
  function signature(g, w, h) {
    var s = resizeGray(g, w, h, 48, 36), b = '';
    for (var i = 0; i < s.length; i++) b += String.fromCharCode(Math.round(s[i]));
    return btoa(b);
  }

  /* selisih persentil-99 antar sidik jari: foto berbeda selalu punya area yang
     jauh berbeda (angka, stempel), foto daur ulang/kompresi ulang tidak */
  function sigDiff(a, b) {
    if (!a || !b) return 255;
    var x = atob(a), y = atob(b), n = Math.min(x.length, y.length);
    if (!n || x.length !== y.length) return 255;
    var d = new Array(n);
    for (var i = 0; i < n; i++) d[i] = Math.abs(x.charCodeAt(i) - y.charCodeAt(i));
    d.sort(function (p, q) { return p - q; });
    return d[Math.floor(n * 0.99)];
  }

  // ---------- G3/G4 pembaca 7-segmen ----------
  var PATTERNS = {
    '1111110': '0', '0110000': '1', '1101101': '2', '1111001': '3', '0110011': '4',
    '1011011': '5', '1011111': '6', '1110000': '7', '1110010': '7', '1111111': '8',
    '1111011': '9', '0011111': '6', '1110011': '9'
  };
  // urutan segmen: a b c d e f g
  var REGIONS = [
    [0.22, 0.78, 0.00, 0.13], // a
    [0.74, 1.00, 0.14, 0.42], // b
    [0.74, 1.00, 0.58, 0.86], // c
    [0.22, 0.78, 0.87, 1.00], // d
    [0.00, 0.26, 0.58, 0.86], // e
    [0.00, 0.26, 0.14, 0.42], // f
    [0.22, 0.78, 0.43, 0.57]  // g
  ];

  function otsu(g) {
    var hist = new Array(256).fill(0), n = g.length;
    for (var i = 0; i < n; i++) hist[g[i] | 0]++;
    var sum = 0; for (var t = 0; t < 256; t++) sum += t * hist[t];
    var sB = 0, wB = 0, best = 0, th = 127;
    for (t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sB += t * hist[t];
      var mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; th = t; }
    }
    return th;
  }

  function binarize(g, w, h, mode, th) {
    var ink = new Uint8Array(w * h);
    if (mode === 'adaptive') {
      // rata-rata lokal via integral image
      var I = new Float64Array((w + 1) * (h + 1));
      for (var y = 0; y < h; y++) { var row = 0; for (var x = 0; x < w; x++) { row += g[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
      var r = Math.max(6, Math.round(h * 0.28));
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        var xa = Math.max(0, x - r), xb = Math.min(w, x + r + 1), ya = Math.max(0, y - r), yb = Math.min(h, y + r + 1);
        var s = I[yb * (w + 1) + xb] - I[ya * (w + 1) + xb] - I[yb * (w + 1) + xa] + I[ya * (w + 1) + xa];
        var m = s / ((xb - xa) * (yb - ya));
        ink[y * w + x] = g[y * w + x] < m - 14 ? 1 : 0;
      }
    } else {
      for (var i = 0; i < w * h; i++) ink[i] = g[i] <= th ? 1 : 0;
    }
    return ink;
  }

  function readDigits(ink, w, h) {
    // buang tinta yang menyentuh tepi (bingkai LCD / bayangan casing)
    var comps = components(ink, w, h, Math.max(4, w * h * 0.0012));
    comps = comps.filter(function (c) {
      var touches = c.x0 === 0 || c.y0 === 0 || c.x1 === w - 1 || c.y1 === h - 1;
      return !(touches && (c.w > w * 0.5 || c.h > h * 0.85));
    });
    if (!comps.length) return null;
    comps.sort(function (a, b) { return a.x0 - b.x0; });
    // gabungkan segmen yang saling tumpang-tindih secara horizontal menjadi satu digit
    var groups = [], tol = Math.max(2, h * 0.06);
    comps.forEach(function (c) {
      var g = null;
      for (var k = groups.length - 1; k >= 0; k--) {
        if (c.x0 <= groups[k].x1 + tol && c.x1 >= groups[k].x0 - tol) { g = groups[k]; break; }
      }
      if (g) {
        g.x0 = Math.min(g.x0, c.x0); g.x1 = Math.max(g.x1, c.x1); g.y0 = Math.min(g.y0, c.y0); g.y1 = Math.max(g.y1, c.y1); g.n++;
      } else groups.push({ x0: c.x0, x1: c.x1, y0: c.y0, y1: c.y1, n: 1 });
    });
    groups.forEach(function (g) { g.w = g.x1 - g.x0 + 1; g.h = g.y1 - g.y0 + 1; });
    var maxH = Math.max.apply(null, groups.map(function (g) { return g.h; }));
    var digits = groups.filter(function (g) { return g.h >= maxH * 0.62; });
    if (!digits.length) return null;
    var hs = digits.map(function (g) { return g.h; }).sort(function (a, b) { return a - b; });
    var H = hs[(hs.length / 2) | 0];
    var top = Math.min.apply(null, digits.map(function (g) { return g.y0; }));
    var bottom = Math.max.apply(null, digits.map(function (g) { return g.y1; }));
    var ws = digits.filter(function (g) { return g.w / g.h > 0.38; }).map(function (g) { return g.w; }).sort(function (a, b) { return a - b; });
    var fullW = ws.length ? ws[(ws.length / 2) | 0] : H * 0.55;

    // titik desimal: blob kecil di bawah, di antara digit
    var dots = groups.filter(function (g) {
      return g.h < H * 0.22 && g.w < H * 0.22 && g.y1 >= bottom - H * 0.18 && g.y0 > top + H * 0.6;
    });

    var out = [];
    digits.forEach(function (g) {
      var ratio = g.w / H, segs = [], conf;
      if (ratio < 0.32) {
        // angka 1: hanya segmen b & c, kolom sempit
        var fill = 0, n = 0;
        for (var y = g.y0; y <= g.y1; y++) for (var x = g.x0; x <= g.x1; x++) { fill += ink[y * w + x]; n++; }
        conf = Math.min(1, Math.max(0, (fill / n - 0.35) / 0.4) + 0.45);
        out.push({ ch: '1', conf: +conf.toFixed(3), x0: g.x0, x1: g.x1, segs: '0110000' });
        return;
      }
      // pakai lebar digit penuh (angka sempit dirapatkan ke kanan seperti LCD asli)
      var bx0 = g.x1 - fullW + 1 < g.x0 ? g.x1 - fullW + 1 : g.x0;
      var bw = Math.max(g.w, fullW), own = g.h >= H * 0.88 && g.h <= H * 1.12;
      var by0 = own ? g.y0 : top, bh = own ? g.h : bottom - top + 1;
      var bits = '', segConf = [];
      REGIONS.forEach(function (R) {
        var xa = Math.round(bx0 + R[0] * bw), xb = Math.round(bx0 + R[1] * bw);
        var ya = Math.round(by0 + R[2] * bh), yb = Math.round(by0 + R[3] * bh);
        var s = 0, c = 0;
        for (var yy = Math.max(0, ya); yy < Math.min(h, yb); yy++) for (var xx = Math.max(0, xa); xx < Math.min(w, xb); xx++) { s += ink[yy * w + xx]; c++; }
        var r = c ? s / c : 0;
        bits += r > 0.3 ? '1' : '0';
        segConf.push(r > 0.3 ? Math.min(1, (r - 0.3) / 0.28) : Math.min(1, (0.3 - r) / 0.2));
        segs.push(+r.toFixed(2));
      });
      var ch = PATTERNS[bits], pen = 0;
      if (!ch) {
        // tetangga terdekat (Hamming) dengan penalti
        var bestD = 9;
        Object.keys(PATTERNS).forEach(function (p) {
          var dd = 0; for (var k = 0; k < 7; k++) if (p[k] !== bits[k]) dd++;
          if (dd < bestD) { bestD = dd; ch = PATTERNS[p]; }
        });
        pen = bestD === 1 ? 0.45 : 1;
        if (bestD > 1) ch = '?';
      }
      conf = Math.max(0, Math.min.apply(null, segConf) * 0.55 + avg(segConf) * 0.45 - pen);
      out.push({ ch: ch, conf: +conf.toFixed(3), x0: g.x0, x1: g.x1, segs: bits });
    });

    var text = '';
    out.forEach(function (d, i) {
      text += d.ch;
      var next = out[i + 1];
      if (next && dots.some(function (dot) { return dot.x0 > d.x1 - 2 && dot.x1 < next.x0 + 2; })) text += '.';
    });
    return { text: text, digits: out, digitHeight: H };
  }

  function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

  function readSevenSeg(crop) {
    // normalisasi tinggi ke 96 px
    var g0 = toGray(crop), H = 96, W = Math.max(40, Math.round(crop.width * H / crop.height));
    var g = resizeGray(g0, crop.width, crop.height, W, H);
    // CLAHE sederhana: regangkan kontras global berbasis persentil
    var sorted = Array.prototype.slice.call(g).sort(function (a, b) { return a - b; });
    var lo = sorted[Math.floor(sorted.length * 0.02)], hi = sorted[Math.floor(sorted.length * 0.98)], span = Math.max(1, hi - lo);
    for (var i = 0; i < g.length; i++) g[i] = Math.max(0, Math.min(255, (g[i] - lo) * 255 / span));
    var th = otsu(g);
    var variants = [
      { name: 'otsu', ink: binarize(g, W, H, 'global', th) },
      { name: 'otsu-ketat', ink: binarize(g, W, H, 'global', th * 0.8) },
      { name: 'adaptif', ink: binarize(g, W, H, 'adaptive') }
    ];
    var reads = variants.map(function (v) {
      var r = readDigits(v.ink, W, H);
      return { variant: v.name, text: r ? r.text : '', digits: r ? r.digits : [] };
    });
    var tally = {};
    reads.forEach(function (r) { if (r.text && r.text.indexOf('?') < 0) tally[r.text] = (tally[r.text] || 0) + 1; });
    var best = null, agree = 0;
    Object.keys(tally).forEach(function (t) {
      if (tally[t] > agree || (tally[t] === agree && t.length > (best || '').length)) { best = t; agree = tally[t]; }
    });
    if (!best) {
      var fallback = reads.filter(function (r) { return r.text; })[0];
      return { text: fallback ? fallback.text : '', agree: 0, conf: 0, digits: fallback ? fallback.digits : [], reads: reads, threshold: th };
    }
    var chosen = reads.filter(function (r) { return r.text === best; });
    var digits = chosen[0].digits.map(function (d, k) {
      var c = avg(chosen.map(function (r) { return r.digits[k] ? r.digits[k].conf : 0; }));
      return { ch: d.ch, conf: +c.toFixed(3) };
    });
    var minConf = digits.length ? Math.min.apply(null, digits.map(function (d) { return d.conf; })) : 0;
    return { text: best, agree: agree, conf: +minConf.toFixed(3), digits: digits, reads: reads, threshold: th };
  }

  // ---------- orkestrasi satu foto ----------
  async function decode(blob, maxW) {
    var bmp = await createImageBitmap(blob);
    var scale = Math.min(1, maxW / bmp.width), w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    var c = makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
    var origW = bmp.width, origH = bmp.height;
    if (bmp.close) bmp.close();
    return { canvas: c, ctx: ctx, img: ctx.getImageData(0, 0, w, h), origW: origW, origH: origH };
  }

  async function processPhoto(blob, opt) {
    opt = opt || {};
    var t0 = Date.now(), st = opt.stages || {}, th = opt.thresholds || {};
    var dec = await decode(blob, 1280), img = dec.img, W = img.width, H = img.height;
    var res = { width: dec.origW, height: dec.origH, timings: {}, gate1: { ok: true, reasons: [], codes: [] } };

    // thumbnail (selalu)
    var tw = 240, thh = Math.round(H * tw / W), tc = makeCanvas(tw, thh);
    tc.getContext('2d').drawImage(dec.canvas, 0, 0, tw, thh);
    res.thumb = await canvasToBlob(tc, 'image/jpeg', 0.78);

    // G0
    var gray = toGray(img);
    res.phash = phash(gray, W, H);
    res.sig = signature(gray, W, H);
    res.timings.g0 = Date.now() - t0;

    var small = downscaleRGB(img, 240), sw = small.width, sh = small.height;
    var sg = new Float32Array(sw * sh);
    for (var i = 0; i < sw * sh; i++) sg[i] = small.data[i * 3] * 0.299 + small.data[i * 3 + 1] * 0.587 + small.data[i * 3 + 2] * 0.114;
    var g320 = resizeGray(gray, W, H, 200, Math.round(H * 200 / W));

    // G1 kelayakan
    var bright = avg(sg), lap = laplacianVar(g320, 200, Math.round(H * 200 / W));
    var col = colorfulness(small), grad = gradientRatio(sg, sw, sh);
    var lcd = detectLcd(small);
    res.quality = {
      brightness: +bright.toFixed(1), sharpness: +lap.toFixed(1), colorfulness: +col.value.toFixed(1),
      blueShare: +col.blueShare.toFixed(3), gradient: grad, lcdMaskShare: +lcd.maskShare.toFixed(3)
    };
    if (st.gate1 !== false) {
      if (bright < (th.minBrightness || 45)) { res.gate1.ok = false; res.gate1.codes.push('GELAP'); res.gate1.reasons.push('Foto terlalu gelap (kecerahan ' + bright.toFixed(0) + ').'); }
      if (col.blueShare > 0.28 && col.value > (th.maxColorfulness || 60)) {
        res.gate1.ok = false; res.gate1.codes.push('LOGO_WARNA_BUKAN_LCD');
        res.gate1.reasons.push('Bukan area LCD meteran: LOGO_WARNA_BUKAN_LCD(colorful)');
      } else if (grad.ratio > 5.5) {
        res.gate1.ok = false; res.gate1.codes.push('GRADIENT_HORIZON');
        res.gate1.reasons.push('Bukan area LCD meteran: GRADIENT_HORIZON(vy=' + grad.vy + ',vx=' + grad.vx + ',ratio=' + grad.ratio.toFixed(1) + ')');
      }
      if (lap < (th.minSharpness || 40)) { res.gate1.ok = false; res.gate1.codes.push('BURAM'); res.gate1.reasons.push('Foto buram (varians Laplacian ' + lap.toFixed(0) + ').'); }
      if (!lcd.box) { res.gate1.ok = false; res.gate1.codes.push('LCD_TIDAK_TERLIHAT'); res.gate1.reasons.push('Display meter tidak terlihat atau meter tidak menyala.'); }
    }
    res.timings.g1 = Date.now() - t0;

    // G2 + G3 crop LCD
    if (lcd.box && st.crop !== false) {
      var k = W / sw, b = lcd.box, padX = b.w * k * 0.04, padY = b.h * k * 0.08;
      var bx = Math.max(0, Math.round(b.x0 * k + padX)), by = Math.max(0, Math.round(b.y0 * k + padY));
      var bw = Math.min(W - bx, Math.round(b.w * k - 2 * padX)), bh = Math.min(H - by, Math.round(b.h * k - 2 * padY));
      res.lcdBox = { x: bx / W, y: by / H, w: bw / W, h: bh / H };
      var crop = dec.ctx.getImageData(bx, by, bw, bh);
      var cc = makeCanvas(bw, bh); cc.getContext('2d').putImageData(crop, 0, 0);
      res.crop = await canvasToBlob(cc, 'image/png');
      res.timings.g3 = Date.now() - t0;
      // G4 baca STAN
      if (st.stan !== false && res.gate1.ok) {
        res.stan = readSevenSeg(crop);
        res.timings.g4 = Date.now() - t0;
      }
    }

    // G7 stiker
    if (st.sticker !== false) {
      var s = detectSticker(small, lcd.box);
      res.sticker = s ? { found: true, box: { x: s.x0 / sw, y: s.y0 / sh, w: s.w / sw, h: s.h / sh } } : { found: false };
    }
    res.durationMs = Date.now() - t0;
    return res;
  }

  return {
    processPhoto: processPhoto, readSevenSeg: readSevenSeg, hamming: hamming, phash: phash, sigDiff: sigDiff, _components: components, _readDigits: readDigits,
    toGray: toGray, detectLcd: detectLcd, downscaleRGB: downscaleRGB
  };
}

if (typeof window !== 'undefined') {
  window.VS = window.VS || {};
  window.VS.cv = VS_CV_FACTORY();
}
