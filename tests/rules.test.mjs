// Unit test aturan bisnis R1–R13 dan pembaca 7-segmen (tanpa browser).
//   node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

globalThis.window = globalThis;
for (const f of ['assets/js/util.js', 'assets/js/cv.js', 'assets/js/rules.js']) {
  vm.runInThisContext(readFileSync(new URL('../' + f, import.meta.url), 'utf8'), { filename: f });
}
const { rules, util } = globalThis.VS;
const period = { month: 9, year: 2026 };

function row(over = {}) {
  return {
    id: 'r1', no: 1, idpel: '232100000425', nama: 'KARMIANTO', nomorMeter: '45123456789', stanCater: 4699,
    latRef: -1.0368, lonRef: 117.1182, photo: { name: '232100000425.jpg', idpel: '232100000425' }, verif: {}, stage: 'idle', ...over
  };
}
function ai(over = {}) {
  return {
    done: true, gate1: { ok: true, reasons: [], codes: [] }, lcdBox: { x: 0.3, y: 0.2, w: 0.3, h: 0.15 },
    stan: { text: '4699', conf: 0.98, agree: 3, digits: [] }, sticker: { found: true },
    overlay: { nama: 'KARMIANTO', idpel: '232100000425', lat: -1.0369, lon: 117.1183, tanggal: '09/12/2026 08:10:00' }, ...over
  };
}
const ev = (r, ctx = {}) => rules.evaluate(r, { period, ...ctx });

test('belum diproses → Menunggu AI', () => {
  const e = ev(row({ ai: null }));
  assert.equal(e.final, 'menunggu');
  assert.equal(e.aiVerif, 'MENUNGGU AI');
});

test('R6: semua lolos → Sesuai AI', () => {
  const e = ev(row({ ai: ai() }));
  assert.equal(e.final, 'sesuai_ai');
  assert.equal(e.statusAI, 'AI_CONFIDENT');
  assert.equal(e.konsistensi, 'CONSISTENT');
  assert.equal(e.cater, 'SESUAI');
  assert.equal(e.lokasi, 'DEKAT');
});

test('R1: Gate 1 gagal → Minta foto ulang', () => {
  const e = ev(row({ ai: ai({ gate1: { ok: false, reasons: ['Display meter tidak terlihat atau meter tidak menyala.'], codes: ['LCD_TIDAK_TERLIHAT'] }, stan: null }) }));
  assert.equal(e.final, 'ulang');
  assert.equal(e.kwh, 'TIDAK LAYAK');
  assert.equal(e.cv, 'TIDAK TERBACA');
});

test('R7: AI ragu → Periksa manual', () => {
  const e = ev(row({ ai: ai({ stan: { text: '4699', conf: 0.4, agree: 1, digits: [] } }) }));
  assert.equal(e.final, 'periksa');
  assert.equal(e.statusAI, 'AI_UNCERTAIN');
  assert.equal(e.konsistensi, 'INCONSISTENT');
});

test('R8: STAN cater kosong dihitung tanpa pembanding, bukan tidak sesuai', () => {
  const e = ev(row({ stanCater: null, ai: ai() }));
  assert.equal(e.cater, 'TANPA_PEMBANDING');
  assert.equal(e.final, 'sesuai_ai');
});

test('R8: selisih dengan cater → review', () => {
  const e = ev(row({ stanCater: 4600, ai: ai() }));
  assert.equal(e.final, 'periksa');
  assert.equal(e.cater, 'TIDAK_SESUAI');
});

test('R9: lokasi jauh tanpa stiker → review; dengan stiker → peringatan saja', () => {
  const far = { lat: -1.2, lon: 116.9 };
  const a = ev(row({ ai: ai({ overlay: { ...ai().overlay, ...far }, sticker: { found: false } }) }));
  assert.equal(a.lokasi, 'JAUH');
  assert.equal(a.final, 'periksa');
  const b = ev(row({ ai: ai({ overlay: { ...ai().overlay, ...far } }) }));
  assert.equal(b.final, 'sesuai_ai');
  assert.ok(b.warnings.some((w) => w.code === 'CEK_STIKER'));
});

test('R10: stiker beda periode → peringatan BEDA PERIODE', () => {
  const e = ev(row({ ai: ai({ stickerMonth: { month: 8, year: 2026, label: 'Agustus 2026' } }) }));
  assert.equal(e.stickerPeriod, 'BEDA PERIODE');
});

test('R11: foto di luar periode → review (bawaan)', () => {
  const e = ev(row({ ai: ai({ overlay: { ...ai().overlay, tanggal: '08/15/2026 07:51:00' } }) }));
  assert.equal(e.periodOk, false);
  assert.equal(e.final, 'periksa');
  const e2 = ev(row({ ai: ai({ overlay: { ...ai().overlay, tanggal: '08/15/2026 07:51:00' } }) }), { settings: { periodReview: false } });
  assert.equal(e2.final, 'sesuai_ai');
});

test('R4: nomor meter di stempel (11 digit) berbeda dengan master → review', () => {
  const e = ev(row({ ai: ai({ overlay: { ...ai().overlay, idpel: '32209754046' } }) }));
  assert.equal(e.meterMatch, false);
  assert.equal(e.final, 'periksa');
});

test('R12: duplikat → Minta foto ulang', () => {
  const e = ev(row({ ai: ai() }), { dupMap: { r1: '232100000999' } });
  assert.equal(e.final, 'ulang');
  assert.equal(e.dupWith, '232100000999');
});

test('R13: keputusan manual menimpa status AI, STAN manual menjadi STAN final', () => {
  const e = ev(row({ ai: ai({ stan: { text: '4699', conf: 0.3, agree: 1, digits: [] } }), verif: { keputusan: 'SESUAI', stanManual: '4700' } }));
  assert.equal(e.final, 'sesuai');
  assert.equal(e.stanFinal, '4700');
  const r = ev(row({ ai: ai(), verif: { keputusan: 'RUMAH_TUTUP' } }));
  assert.equal(r.final, 'rumah_tutup');
  assert.equal(r.cater, null);
});

test('statistik mengikuti definisi aplikasi asli', () => {
  const rows = [row({ id: 'a', ai: ai() }), row({ id: 'b', ai: ai({ stan: { text: '1', conf: 0.1, agree: 1, digits: [] } }) }),
    row({ id: 'c', ai: null }), row({ id: 'd', ai: ai(), verif: { keputusan: 'TIDAK_SESUAI' } })];
  const evals = {}; rows.forEach((r) => { evals[r.id] = ev(r); });
  const s = rules.stats(rows, evals);
  assert.equal(s.total, 4); assert.equal(s.aiSukses, 2); assert.equal(s.valid, 1);
  assert.equal(s.tidakValid, 1); assert.equal(s.review, 1); assert.equal(s.belum, 1);
});

test('utilitas: haversine, kemiripan nama, tanggal stempel', () => {
  assert.ok(Math.abs(util.haversine(-1.0447, 117.115, -1.265, 116.831) - 39.9) < 1);
  assert.ok(util.similarity('H. MUHAMMAD NOOR', 'H MUHAMMAD NOOR') > 0.9);
  assert.equal(new Date(util.parseStampDate('09/15/2026 07:51:02')).getDate(), 15);
});

test('pembaca 7-segmen pada citra sintetis', () => {
  // gambar 4 digit "2026" langsung ke buffer RGBA
  const W = 300, H = 100, data = new Uint8ClampedArray(W * H * 4).fill(200);
  const SEG = { 2: 'abged', 0: 'abcdef', 6: 'afgedc' };
  const rect = (x0, y0, x1, y1) => { [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; data[i] = data[i + 1] = data[i + 2] = 30; } };
  [...'2026'].forEach((ch, k) => {
    const x = 30 + k * 62, y = 10, w = 40, h = 76, t = 10;
    for (const s of SEG[ch]) {
      if (s === 'a') rect(x + t, y, x + w - t, y + t);
      if (s === 'g') rect(x + t, y + h / 2 - t / 2, x + w - t, y + h / 2 + t / 2);
      if (s === 'd') rect(x + t, y + h - t, x + w - t, y + h);
      if (s === 'f') rect(x, y + t, x + t, y + h / 2 - t / 2 - 1);
      if (s === 'b') rect(x + w - t, y + t, x + w, y + h / 2 - t / 2 - 1);
      if (s === 'e') rect(x, y + h / 2 + t / 2 + 1, x + t, y + h - t);
      if (s === 'c') rect(x + w - t, y + h / 2 + t / 2 + 1, x + w, y + h - t);
    }
  });
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  const r = globalThis.VS.cv.readSevenSeg({ data, width: W, height: H });
  assert.equal(r.text, '2026');
  assert.ok(r.agree >= 2);
});
