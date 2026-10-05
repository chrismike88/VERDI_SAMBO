// Membangun versi satu-file (offline, bisa dibuka dengan klik ganda) dan
// berkas Google Apps Script (gas/Index.html) dari sumber di repositori.
//   node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const b64 = (p) => readFileSync(join(root, p)).toString('base64');

let html = read('index.html');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  let css = read(href);
  css = css.replace(/url\('\.\.\/\.\.\/fonts\/([^']+)'\)/g, (_m, f) => `url(data:font/woff2;base64,${b64('fonts/' + f)})`);
  return `<style>\n${css}\n</style>`;
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const js = read(src).replace(/<\/script/gi, '<\\/script');
  return `<script>/* ${src} */\n${js}\n</script>`;
});

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/verdi-sambo.html'), html);
writeFileSync(join(root, 'gas/Index.html'), html);
console.log(`dist/verdi-sambo.html & gas/Index.html: ${(html.length / 1024).toFixed(0)} KB`);
