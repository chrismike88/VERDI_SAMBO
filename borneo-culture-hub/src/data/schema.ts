import { z } from 'zod';

export const STATUSES = ['MELAMPAUI', 'ON_TRACK', 'PERLU_PERHATIAN', 'KRITIS', 'MENUNGGU_DATA'] as const;
export type Status = (typeof STATUSES)[number];

const num = z.number({ error: 'harus berupa angka' });
const valueMap = z.record(z.string(), num.nullable());

const Period = z.object({
  id: z.string(),
  label: z.string(),
  short: z.string(),
  chip: z.string(),
  month: z.number().int().min(1).max(12),
  cohub: z.number().int().optional(),
  isPrognosa: z.boolean(),
});

const Indicator = z.object({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  type: z.enum(['zero', 'max', 'min', 'cumulative']),
  target: num,
  targetLabel: z.string().optional(),
  targetYtd: z.record(z.string(), num).optional(),
  values: valueMap,
  approx: z.boolean().optional(),
  decimals: z.number().int().optional(),
  programIds: z.array(z.string()).optional(),
  source: z.string(),
  note: z.string().optional(),
  catatanRanger: z.string().optional(),
  pic: z.string().optional(),
  statusOverride: z.object({ status: z.enum(STATUSES), reason: z.string() }).optional(),
});

const Highlight = z.object({
  letter: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  points: z.array(z.string()),
});

const DnaValue = z.object({
  id: z.string(),
  name: z.string(),
  definition: z.string(),
  behaviors: z.array(z.string()).length(5, 'perilaku kunci harus 5 butir'),
  scores: z.record(z.string(), z.number().min(1).max(5)),
});

const SymbolRow = z.object({
  program: z.string(),
  ritual: z.string(),
  frequency: z.string(),
  evidence: z.string(),
  rewardConsequence: z.array(z.string()),
  impact: z.string(),
  governance: z.array(z.string()),
});

const Pillar = z.object({
  id: z.enum(['bersinar', 'best', 'prima']),
  code: z.string(),
  name: z.string(),
  focus: z.string(),
  tagline: z.string(),
  taglineSub: z.string().optional(),
  cover: z.string(),
  dnaValues: z.array(z.string()),
  businessTarget: z.string(),
  ultimateTarget: z.string(),
  selfReportedProgress: z.string().optional(),
  keyIndicatorIds: z.array(z.string()),
  closingLine: z.string(),
  closingSub: z.string().optional(),
  kpiFokus: z.array(z.object({ label: z.string(), targetLabel: z.string(), value: num.nullable().optional(), source: z.string().optional() })),
  officialPrograms: z.array(z.string()).optional(),
  programs: z.array(z.object({ id: z.string(), name: z.string(), action: z.string().optional(), description: z.string(), indicatorIds: z.array(z.string()).optional() })),
  indicators: z.array(Indicator),
  monthlySeries: z
    .array(z.object({ id: z.string(), label: z.string(), unit: z.string(), actual: z.record(z.string(), num), forecastTotal: num.optional(), forecastMonths: z.array(z.string()).optional() }))
    .optional(),
  comparisons: z.array(z.object({ label: z.string(), before: num, after: num, beforeLabel: z.string(), afterLabel: z.string(), unit: z.string() })).optional(),
  gauges: z.array(z.object({ label: z.string(), unit: z.string(), target: num, actual: num, basis: z.string() })).optional(),
  crm: z
    .object({
      range: z.string(),
      won: z.object({ pct: num, rupiah: num, customers: num }),
      lost: z.object({ pct: num, rupiah: num, customers: num }),
      topRevenue: z.object({ unit: z.string(), rupiah: num }),
      topCustomer: z.object({ unit: z.string(), customers: num }),
    })
    .optional(),
  rituals: z.array(z.object({ id: z.string(), phase: z.string(), ritual: z.string(), activities: z.array(z.string()), impact: z.string(), evidenceIds: z.array(z.string()).optional() })),
  ritualTagline: z.string().optional(),
  ritualTaglineSub: z.string().optional(),
  behaviourChange: z.object({ from: z.string(), to: z.string() }).optional(),
  leaderBehavior: z.array(z.object({ step: z.enum(['Perencanaan', 'Pelaksanaan', 'Monitoring', 'Evaluasi']), description: z.string(), evidenceIds: z.array(z.string()).optional() })),
  leaderClosing: z.string().optional(),
  cultureDna: z.array(DnaValue),
  systems: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().optional(), metrics: z.array(z.object({ label: z.string(), value: z.string() })), imageId: z.string().optional(), access: z.enum(['intranet', 'publik']) })),
  symbols: z.array(SymbolRow),
  highlights: z.array(Highlight),
  sidakImpact: z.array(Highlight).optional(),
});

export const DatasetSchema = z
  .object({
    meta: z.object({
      title: z.string(),
      year: z.number(),
      dataAsOf: z.string(),
      updatedAt: z.string(),
      disusunOleh: z.string(),
      rangerMaster: z.string(),
      unit: z.string(),
      sources: z.array(z.string()),
      nodes: z.array(z.string()),
    }),
    periods: z.array(Period).min(1),
    heroStats: z.array(z.object({ label: z.string(), pillarId: z.string(), indicatorId: z.string() })),
    pillars: z.array(Pillar).length(3),
    waitingKpis: z.array(z.object({ pillarId: z.string(), label: z.string(), targetLabel: z.string() })),
    timeline: z.array(z.object({ date: z.string().optional(), endDate: z.string().optional(), title: z.string(), pillarId: z.string().optional(), note: z.string().optional() })),
    documents: z.array(z.object({ pillarId: z.string(), number: z.string().optional(), title: z.string(), date: z.string().optional(), url: z.string().optional() })),
    evidence: z.array(z.object({ id: z.string(), src: z.string(), alt: z.string().min(1, 'alt wajib diisi'), caption: z.string(), pillarId: z.string(), lens: z.string().optional(), unit: z.string().optional(), date: z.string().optional() })),
  })
  .superRefine((d, ctx) => {
    const ids = d.periods.map((p) => p.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) ctx.addIssue({ code: 'custom', message: `Periode ganda: ${dup.join(', ')}`, path: ['periods'] });
    const periodSet = new Set(ids);
    const evSet = new Set(d.evidence.map((e) => e.id));
    for (const p of d.pillars) {
      for (const ind of p.indicators) {
        for (const [pid, v] of Object.entries(ind.values)) {
          if (!periodSet.has(pid)) ctx.addIssue({ code: 'custom', message: `Indikator "${ind.label}" memakai periode "${pid}" yang tidak terdaftar`, path: ['pillars', p.id, ind.id] });
          if (v != null && v < 0) ctx.addIssue({ code: 'custom', message: `Indikator "${ind.label}" periode ${pid} bernilai negatif (${v})`, path: ['pillars', p.id, ind.id] });
          if (v != null && ind.unit === '%' && ind.type === 'min' && v > 100) ctx.addIssue({ code: 'custom', message: `Indikator "${ind.label}" periode ${pid} lebih dari 100% (${v})`, path: ['pillars', p.id, ind.id] });
        }
        for (const pid of Object.keys(ind.targetYtd ?? {})) {
          if (!periodSet.has(pid)) ctx.addIssue({ code: 'custom', message: `targetYtd "${ind.label}" merujuk periode "${pid}" yang tidak ada`, path: ['pillars', p.id, ind.id] });
        }
      }
      const refs = [...p.rituals.flatMap((r) => r.evidenceIds ?? []), ...p.leaderBehavior.flatMap((l) => l.evidenceIds ?? [])];
      for (const r of refs) if (!evSet.has(r)) ctx.addIssue({ code: 'custom', message: `evidenceId "${r}" di pilar ${p.name} tidak punya pasangan di daftar evidence`, path: ['pillars', p.id] });
    }
  });

export type Dataset = z.infer<typeof DatasetSchema>;
export type Pillar = Dataset['pillars'][number];
export type Indicator = Pillar['indicators'][number];
export type Period = Dataset['periods'][number];
export type DnaValue = Pillar['cultureDna'][number];
export type PillarId = Pillar['id'];
