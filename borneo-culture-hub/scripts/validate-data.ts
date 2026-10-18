import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatasetSchema } from '../src/data/schema';

const file = fileURLToPath(new URL('../src/data/budaya-2026.json', import.meta.url));
let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error('✕ budaya-2026.json bukan JSON yang valid:', (e as Error).message);
  process.exit(1);
}
const r = DatasetSchema.safeParse(raw);
if (!r.success) {
  console.error(`✕ Data belum valid (${r.error.issues.length} masalah):`);
  for (const i of r.error.issues) console.error(`  • ${i.path.join(' › ') || '(root)'}: ${i.message}`);
  process.exit(1);
}
const d = r.data;
const n = d.pillars.reduce((s, p) => s + p.indicators.length, 0);
console.log(`✓ Data valid — ${d.periods.length} periode, ${d.pillars.length} pilar, ${n} indikator, ${d.evidence.length} evidence. Data s.d. ${d.meta.dataAsOf}.`);
