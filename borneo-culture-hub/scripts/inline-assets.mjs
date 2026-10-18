// Menyematkan gambar dari public/assets ke dist-single/index.html agar benar-benar satu file (bisa dibuka offline).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const file = 'dist-single/index.html';
let html = readFileSync(file, 'utf8');
const mime = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', avif: 'image/avif' };
const refs = new Set(html.match(/assets\/[\w/.-]+\.(webp|png|jpe?g|svg|avif)/g) ?? []);
let n = 0;
for (const ref of refs) {
  const src = `public/${ref}`;
  if (!existsSync(src)) continue; // aset yang belum ada tetap tampil sebagai placeholder
  const uri = `data:${mime[ref.split('.').pop()]};base64,${readFileSync(src).toString('base64')}`;
  html = html.split(ref).join(uri);
  n++;
}
const fav = readFileSync('public/favicon.svg').toString('base64');
html = html.replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${fav}"`);
writeFileSync(file, html);
console.log(`✓ ${n} gambar disematkan ke ${file} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
