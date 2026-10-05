// Uji end-to-end di Chromium (Playwright): demo → proses AI → keputusan via keyboard → ekspor.
//   npm run e2e      (butuh paket "playwright" terpasang)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('Paket playwright belum terpasang: npm i -D playwright'); process.exit(1); }

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 960 }, acceptDownloads: true })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(`${base}/index.html?demo`);
  await page.waitForFunction(() => VS.state.job && !VS.state.job.running, null, { timeout: 120000 });
  const st = await page.evaluate(() => VS.state.stats);
  console.log('statistik:', JSON.stringify(st));
  assert.equal(st.total, 36);
  assert.equal(st.belum, 0);
  assert.ok(st.sesuai_ai >= 15, 'minimal 15 foto terbaca yakin');
  assert.ok(st.ulang >= 5, 'foto layar mati/stok/gelap/duplikat ditolak');
  assert.equal(await page.evaluate(() => VS.state.dup.list.length), 1, 'tepat satu duplikat');

  await page.click('[data-view="queue"]');
  await page.click('.q-row >> nth=1');
  await page.keyboard.press('r');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => VS.state.stats.rumah_tutup), 1, 'keputusan R tersimpan');

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.toolbar [data-action="export"]')]);
  assert.match(dl.suggestedFilename(), /^VERDI_SAMBO_\d{6}\.xlsx$/);
  assert.deepEqual(errors, []);
  console.log('E2E lulus.');
} finally {
  await browser.close();
  server.close();
}
