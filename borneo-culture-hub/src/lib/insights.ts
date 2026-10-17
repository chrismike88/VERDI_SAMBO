import type { Dataset, Indicator, Period, Pillar } from '@/data/schema';
import { STATUS_META } from '@/config/status';
import { formatDelta, formatNumber, formatPercent, formatUnit } from './format';
import {
  actualPeriods,
  allDnaValues,
  dnaPeriodFor,
  PROGNOSA_ID,
  prognosaPerMonth,
  requiredPerMonth,
  runRate,
  valueAt,
} from './metrics';
import { indicatorStatus, meetsTarget } from './status';

export type InsightKind = 'warn' | 'win' | 'info' | 'na';

export interface Insight {
  id: string;
  rule: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7';
  kind: InsightKind;
  pillarId: string;
  indicatorId?: string;
  title: string;
  message: string;
  figures?: { label: string; value: string }[];
  catatanRanger?: string;
  pic?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const dec = (ind: Indicator) => ind.decimals ?? 0;
const fmt = (ind: Indicator, v: number, d = dec(ind)) => formatUnit(v, ind.unit, d, false);

function r1Prognosa(ind: Indicator, p: Pillar, d: Dataset): Insight | null {
  const pid = PROGNOSA_ID(d);
  const prog = pid ? valueAt(ind, pid) : null;
  if (prog == null || meetsTarget(ind, prog)) return null;
  const gap = Math.abs(ind.target - prog);
  const pct = (prog / ind.target) * 100;
  return {
    id: `r1-${ind.id}`,
    rule: 'R1',
    kind: 'warn',
    pillarId: p.id,
    indicatorId: ind.id,
    title: `Prognosa ${ind.label.toLowerCase()} di bawah target`,
    message: `Prognosa Des ${fmt(ind, prog)} di bawah target ${fmt(ind, ind.target)} (gap ${fmt(ind, gap)}; ${formatPercent(pct)}).`,
    figures: [
      { label: 'Prognosa Des', value: fmt(ind, prog) },
      { label: 'Target', value: fmt(ind, ind.target) },
      { label: 'Capaian prognosa', value: formatPercent(pct) },
    ],
    catatanRanger: ind.catatanRanger,
    pic: ind.pic,
  };
}

function r2RunRate(ind: Indicator, p: Pillar, d: Dataset, period: Period): Insight | null {
  if (ind.type !== 'cumulative' || period.isPrognosa) return null;
  const rr = runRate(ind, d, period.id);
  const req = requiredPerMonth(ind, period);
  if (rr == null || req == null) return null;
  const inc = actualPeriods(d).filter((x) => x.month <= period.month);
  if (inc.length < 2) return null;
  const pm = prognosaPerMonth(ind, d, period);
  const range = `${inc[1].short}–${period.short}`;
  const dd = Math.max(dec(ind), 1);
  const unitPm = `${ind.unit}/bulan`;
  let msg = `Run-rate ${range} ${formatNumber(rr, dd)} ${unitPm}; butuh ${formatNumber(req, dd)} ${unitPm} untuk target ${fmt(ind, ind.target)}.`;
  if (pm != null) msg += ` Prognosa unit mengasumsikan ±${formatNumber(pm, dd)} ${unitPm}.`;
  return {
    id: `r2-${ind.id}`,
    rule: 'R2',
    kind: 'info',
    pillarId: p.id,
    indicatorId: ind.id,
    title: `Observasi laju ${ind.label.toLowerCase()}`,
    message: msg,
    figures: [
      { label: 'Run-rate', value: formatNumber(rr, dd) },
      { label: 'Butuh/bulan', value: formatNumber(req, dd) },
      ...(pm != null ? [{ label: 'Asumsi prognosa', value: formatNumber(pm, dd) }] : []),
    ],
  };
}

function r3Level(ind: Indicator, p: Pillar, period: Period): Insight | null {
  if (ind.type !== 'min') return null;
  const v = valueAt(ind, period.id);
  if (v == null || v >= ind.target) return null;
  const rest = 12 - period.month;
  const need = ind.target - v;
  const short = ind.programIds?.length ? ind.label : ind.label;
  return {
    id: `r3-${ind.id}`,
    rule: 'R3',
    kind: 'info',
    pillarId: p.id,
    indicatorId: ind.id,
    title: `Kebutuhan ${short.toLowerCase()}`,
    message: `${short} butuh +${formatNumber(need, 2, 0)} poin dalam ${rest} bulan (${formatUnit(v, ind.unit, dec(ind), ind.approx)} → ${formatUnit(ind.target, ind.unit, dec(ind))}); ±${formatNumber(need / rest, 2)} poin/bulan.`,
  };
}

function r4Series(p: Pillar, d: Dataset, period: Period): Insight[] {
  const out: Insight[] = [];
  for (const s of p.monthlySeries ?? []) {
    const cumInd = p.indicators.find((i) => i.type === 'cumulative');
    const entries = Object.entries(s.actual).filter(([m]) => MONTHS.indexOf(m) + 1 <= period.month);
    if (!entries.length || !cumInd) continue;
    const total = entries.reduce((a, [, v]) => a + v, 0);
    const avg = total / entries.length;
    const low = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
    const lastMonth = MONTHS.indexOf(entries[entries.length - 1][0]) + 1;
    const rest = 12 - lastMonth;
    const need = rest > 0 ? (cumInd.target - total) / rest : 0;
    const range = `${entries[0][0]}–${entries[entries.length - 1][0]}`;
    const restRange = rest > 0 ? `${MONTHS[lastMonth]}–Des` : '';
    out.push({
      id: `r4-${s.id}`,
      rule: 'R4',
      kind: 'info',
      pillarId: p.id,
      indicatorId: cumInd.id,
      title: `Seri bulanan Walk Down`,
      message:
        (rest > 0 ? `Walk Down butuh rata-rata ${formatNumber(need)} ${s.unit}/bulan ${restRange}; ` : '') +
        `rata-rata ${range} ${formatNumber(avg)}. ${MONTHS_LONG[MONTHS.indexOf(low[0])]} terendah (${formatNumber(low[1])}).`,
    });
    void d;
  }
  return out;
}

function r5Wins(ind: Indicator, p: Pillar, d: Dataset, period: Period): Insight | null {
  const st = indicatorStatus(ind, d, period);
  const actual = actualPeriods(d).filter((x) => x.month <= period.month);
  if (ind.type === 'cumulative' && st.computed === 'MELAMPAUI') {
    const first = actual.find((x) => (valueAt(ind, x.id) ?? -Infinity) >= ind.target);
    if (!first) return null;
    return {
      id: `r5-${ind.id}`,
      rule: 'R5',
      kind: 'win',
      pillarId: p.id,
      indicatorId: ind.id,
      title: ind.label,
      message: `${ind.label} sudah melewati target setahun pada ${MONTHS_LONG[first.month - 1]} (${fmt(ind, valueAt(ind, period.id)!)} vs ${fmt(ind, ind.target)}; ${formatPercent((valueAt(ind, period.id)! / ind.target) * 100)}).`,
    };
  }
  if (ind.type === 'max' && (st.computed === 'MELAMPAUI' || st.computed === 'ON_TRACK')) {
    let n = 0;
    for (let i = actual.length - 1; i >= 0; i--) {
      const v = valueAt(ind, actual[i].id);
      if (v != null && v <= ind.target) n++;
      else break;
    }
    if (n < 2) return null;
    const from = actual[actual.length - n];
    return {
      id: `r5-${ind.id}`,
      rule: 'R5',
      kind: 'win',
      pillarId: p.id,
      indicatorId: ind.id,
      title: ind.label,
      message: `${ind.label} di bawah batas ${fmt(ind, ind.target)} selama ${n} periode beruntun (${from.short}–${period.short}); ${formatPercent((valueAt(ind, period.id)! / ind.target) * 100, 1)} dari batas.`,
    };
  }
  if (ind.type === 'min' && st.computed === 'MELAMPAUI') {
    const v = valueAt(ind, period.id)!;
    return {
      id: `r5-${ind.id}`,
      rule: 'R5',
      kind: 'win',
      pillarId: p.id,
      indicatorId: ind.id,
      title: ind.label,
      message: `${ind.label} ${fmt(ind, v)}, ${formatNumber(v / ind.target, 1)}× target ${fmt(ind, ind.target)}.`,
    };
  }
  if (ind.type === 'zero' && st.computed === 'ON_TRACK' && actual.length >= 2) {
    const allZero = actual.every((x) => valueAt(ind, x.id) === 0);
    if (!allZero) return null;
    return {
      id: `r5-${ind.id}`,
      rule: 'R5',
      kind: 'win',
      pillarId: p.id,
      indicatorId: ind.id,
      title: ind.label,
      message: `${ind.label} tetap 0 selama ${actual.length} periode beruntun (${actual[0].short}–${period.short}).`,
    };
  }
  return null;
}

function statusWarn(ind: Indicator, p: Pillar, d: Dataset, period: Period): Insight | null {
  const st = indicatorStatus(ind, d, period);
  if (st.flags.length || (st.status !== 'PERLU_PERHATIAN' && st.status !== 'KRITIS') || st.value == null) return null;
  return {
    id: `st-${ind.id}`,
    rule: 'R3',
    kind: 'warn',
    pillarId: p.id,
    indicatorId: ind.id,
    title: `${ind.label} — ${STATUS_META[st.status].label}`,
    message: `Realisasi ${formatUnit(st.value, ind.unit, dec(ind), ind.approx)} vs pembanding ${fmt(ind, st.benchmark)}${st.pct != null ? ` (${formatPercent(st.pct)})` : ''}.`,
    catatanRanger: ind.catatanRanger,
    pic: ind.pic,
  };
}

function r6Dna(d: Dataset, period: Period): Insight[] {
  const { current, previous } = dnaPeriodFor(d, period.id);
  if (!current) return [];
  const vals = allDnaValues(d).filter((v) => v.scores[current] != null);
  const out: Insight[] = [];
  if (previous) {
    const withDelta = vals.filter((v) => v.scores[previous] != null).map((v) => ({ v, delta: v.scores[current]! - v.scores[previous]! }));
    const best = withDelta.reduce((a, b) => (b.delta > a.delta ? b : a));
    out.push({
      id: 'r6-up',
      rule: 'R6',
      kind: 'win',
      pillarId: best.v.pillarId,
      title: 'Kenaikan Culture DNA terbesar',
      message: `${best.v.name} naik ${formatDelta(best.delta)} (${formatNumber(best.v.scores[previous]!, 2)} → ${formatNumber(best.v.scores[current]!, 2)}), kenaikan terbesar.`,
    });
    for (const x of withDelta.filter((w) => w.delta < 0)) {
      out.push({
        id: `r6-down-${x.v.id}`,
        rule: 'R6',
        kind: 'warn',
        pillarId: x.v.pillarId,
        title: `Culture DNA ${x.v.name} turun`,
        message: `${x.v.name} turun ${formatDelta(x.delta)} (${formatNumber(x.v.scores[previous]!, 2)} → ${formatNumber(x.v.scores[current]!, 2)}).`,
      });
    }
  }
  const scores = vals.map((v) => v.scores[current]!);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const top = vals.filter((v) => v.scores[current] === max);
  const low = vals.filter((v) => v.scores[current] === min);
  out.push({
    id: 'r6-top',
    rule: 'R6',
    kind: 'win',
    pillarId: top[0].pillarId,
    title: 'Skor Culture DNA tertinggi',
    message: `${top.map((v) => v.name).join(' & ')} tertinggi (${formatNumber(max, 2)}).`,
  });
  out.push({
    id: 'r6-low',
    rule: 'R6',
    kind: 'info',
    pillarId: low[0].pillarId,
    title: 'Skor Culture DNA terendah',
    message: `${low.map((v) => v.name).join(' & ')} terendah (${formatNumber(min, 2)}) — tetap jadi fokus penguatan.`,
  });
  return out;
}

function r7Empty(d: Dataset, period: Period): Insight[] {
  const out: Insight[] = d.waitingKpis.map((k, i) => ({
    id: `r7-kpi-${i}`,
    rule: 'R7' as const,
    kind: 'na' as const,
    pillarId: k.pillarId,
    title: k.label,
    message: `${k.label} ${k.targetLabel} — realisasi belum diinput.`,
  }));
  for (const p of d.pillars)
    for (const ind of p.indicators)
      if (valueAt(ind, period.id) == null)
        out.push({ id: `r7-${ind.id}`, rule: 'R7', kind: 'na', pillarId: p.id, indicatorId: ind.id, title: ind.label, message: `${ind.label} — realisasi ${period.short} belum diinput.` });
  return out;
}

export function buildInsights(d: Dataset, periodId: string): Insight[] {
  const period = d.periods.find((p) => p.id === periodId)!;
  const out: Insight[] = [];
  for (const p of d.pillars) {
    for (const ind of p.indicators) {
      const r1 = r1Prognosa(ind, p, d);
      if (r1) {
        out.push(r1);
        const r2 = r2RunRate(ind, p, d, period);
        if (r2) out.push(r2);
      }
      const w = statusWarn(ind, p, d, period);
      if (w) out.push(w);
      const r3 = r3Level(ind, p, period);
      if (r3) out.push(r3);
      const r5 = r5Wins(ind, p, d, period);
      if (r5) out.push(r5);
    }
    out.push(...r4Series(p, d, period));
  }
  out.push(...r6Dna(d, period));
  out.push(...r7Empty(d, period));
  return out;
}

export function groupInsights(list: Insight[]) {
  return {
    kawal: list.filter((i) => i.kind === 'warn' || i.kind === 'info'),
    menonjol: list.filter((i) => i.kind === 'win'),
    menunggu: list.filter((i) => i.kind === 'na'),
  };
}
