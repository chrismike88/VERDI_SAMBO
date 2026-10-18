import { Fragment, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, MonitorSmartphone, ClipboardList, PlayCircle, Activity, RefreshCcw, ChevronDown, Award, Gavel, CalendarClock, Camera } from 'lucide-react';
import type { Pillar } from '@/data/schema';
import { data, evidenceById } from '@/data';
import { usePeriod } from '@/state/PeriodContext';
import { indicatorStatus } from '@/lib/status';
import { dnaPeriodFor } from '@/lib/metrics';
import { formatDate, formatDelta, formatNumber, formatUnit } from '@/lib/format';
import { PILLAR_STYLE } from '@/config/pillars';
import { StatusPill } from '@/components/ui/StatusPill';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

/* ---------- 1. Business Focus Alignment ---------- */
export function AlignmentLens({ pillar }: { pillar: Pillar }) {
  const { period } = usePeriod();
  const progOf = (id: string) => pillar.programs.find((p) => p.id === id);
  return (
    <div className="space-y-6">
      <div className="table-wrap">
        <table className="data-table min-w-[880px]">
          <caption className="sr-only">Business Focus Alignment {pillar.name}: indikator, program, target, dan realisasi per periode</caption>
          <thead>
            <tr>
              <th className="sticky-col">Indikator</th>
              <th>Program</th>
              <th>Target</th>
              {data.periods.map((p) => (
                <th key={p.id} className={`${p.id === period.id ? 'is-active' : ''} ${p.isPrognosa ? 'italic' : ''} text-right`}>
                  {p.chip}
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pillar.indicators.map((ind) => {
              const st = indicatorStatus(ind, data, period);
              return (
                <tr key={ind.id}>
                  <th scope="row" className="sticky-col font-semibold">
                    {ind.label}
                  </th>
                  <td className="text-[var(--text-muted)]">{(ind.programIds ?? []).map((id) => progOf(id)?.name).join(', ')}</td>
                  <td className="whitespace-nowrap font-semibold text-[var(--gold-glow)]">{ind.targetLabel}</td>
                  {data.periods.map((p) => {
                    const v = ind.values[p.id];
                    return (
                      <td key={p.id} className={`text-right tnum whitespace-nowrap ${p.id === period.id ? 'is-active font-extrabold' : ''} ${p.isPrognosa ? 'italic text-[var(--text-muted)]' : ''}`}>
                        {v == null ? '—' : formatUnit(v, ind.unit, ind.decimals ?? 0, ind.approx)}
                      </td>
                    );
                  })}
                  <td>
                    <StatusPill status={st.status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] p-4">
          <p className="eyebrow mb-3">KPI Fokus Bisnis</p>
          <ul className="space-y-2">
            {pillar.kpiFokus.map((k) => (
              <li key={k.label} className="flex items-center justify-between gap-3 text-sm">
                <span>{k.label}</span>
                <span className="flex items-center gap-2">
                  <strong className="text-[var(--gold-glow)]">{k.targetLabel}</strong>
                  {k.value === null && <StatusPill status="MENUNGGU_DATA" size="sm" />}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {pillar.officialPrograms && (
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <p className="eyebrow mb-3">Program resmi (lembar pencapaian)</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text-muted)]">
              {pillar.officialPrograms.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-[var(--text-muted)]">Tampilan utama memakai 5 program PRIMA. Pemetaan ke program resmi sedang dikonfirmasi.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 2. Ritual & Program ---------- */
export function RitualLens({ pillar }: { pillar: Pillar }) {
  const { period } = usePeriod();
  const S = PILLAR_STYLE[pillar.id];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pillar.programs.map((pr, i) => (
        <motion.div key={pr.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-lg font-extrabold" style={{ background: `color-mix(in srgb, ${S.color} 22%, transparent)`, color: S.glow }}>
              {pr.action && pr.action.length === 1 ? pr.action : String(i + 1).padStart(2, '0')}
            </span>
            <div>
              {pr.action && pr.action.length > 1 && <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: S.glow }}>{pr.action}</p>}
              <h4 className="font-extrabold leading-tight">{pr.name}</h4>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{pr.description}</p>
          {(pr.indicatorIds ?? []).length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {pr.indicatorIds!.map((id) => {
                const ind = pillar.indicators.find((x) => x.id === id);
                if (!ind) return null;
                const st = indicatorStatus(ind, data, period);
                return (
                  <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-xs">
                    <span className="text-[var(--text-muted)]">{ind.label}</span>
                    <StatusPill status={st.status} size="sm" />
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      ))}
      {pillar.rituals.length > 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--text-muted)] sm:col-span-2 lg:col-span-3">
          Ritual harian–bulanan ({pillar.rituals.map((r) => r.phase).join(' → ')}) tampil di <a className="font-bold underline" href={`#${pillar.id}-khas`}>Ritual Safety Timeline</a>.
        </div>
      )}
    </div>
  );
}

/* ---------- 3. Leader Behavior ---------- */
const STEP_ICON = { Perencanaan: ClipboardList, Pelaksanaan: PlayCircle, Monitoring: Activity, Evaluasi: RefreshCcw } as const;
export function LeaderLens({ pillar }: { pillar: Pillar }) {
  const S = PILLAR_STYLE[pillar.id];
  return (
    <div>
      <ol className="relative grid gap-4 md:grid-cols-4">
        <div className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 md:block" style={{ background: `linear-gradient(90deg, ${S.color}, var(--gold))` }} aria-hidden />
        {pillar.leaderBehavior.map((l, i) => {
          const Icon = STEP_ICON[l.step];
          const ev = (l.evidenceIds ?? []).map(evidenceById).filter(Boolean);
          return (
            <motion.li key={l.step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="relative flex flex-col">
              <span className="relative z-10 mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-white/15" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${S.color} 45%, #081634), #081634)`, color: S.glow }}>
                <Icon size={24} aria-hidden />
              </span>
              <div className="flex flex-1 flex-col rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gold-glow)]">Langkah {i + 1}</p>
                <h4 className="text-lg font-extrabold">{l.step}</h4>
                <p className="mt-1 flex-1 text-sm text-[var(--text-muted)]">{l.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ev.map((e) => (
                    <ImageWithFallback key={e!.id} src={e!.src} alt={e!.alt} label={e!.caption} accent={S.color} className="aspect-[4/3] rounded-lg" />
                  ))}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
      {pillar.leaderClosing && <p className="mt-6 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-white/5 to-transparent p-4 text-center font-semibold">{pillar.leaderClosing}</p>}
    </div>
  );
}

/* ---------- 4. Culture DNA ---------- */
export function DnaLens({ pillar }: { pillar: Pillar }) {
  const { period } = usePeriod();
  const S = PILLAR_STYLE[pillar.id];
  const { current, previous } = dnaPeriodFor(data, period.id);
  const fallbackCur = current ?? '2026-09';
  const fallbackPrev = previous ?? '2026-08';
  const [open, setOpen] = useState<string | null>(pillar.cultureDna[0].id);
  const lbl = (id: string) => data.periods.find((p) => p.id === id)?.short ?? id;
  return (
    <div>
      {!current && (
        <p className="mb-4 rounded-xl border border-[var(--border)] bg-white/[0.03] p-3 text-sm text-[var(--status-na)]">
          ⏳ Skor Culture DNA untuk {period.label} belum tersedia. Ditampilkan skor terakhir ({lbl(fallbackPrev)} → {lbl(fallbackCur)}).
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {pillar.cultureDna.map((v, i) => {
          const a = v.scores[fallbackPrev];
          const b = v.scores[fallbackCur];
          const isOpen = open === v.id;
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="flex flex-col rounded-2xl border border-[var(--border)] bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-extrabold text-[#06122b]" style={{ background: `linear-gradient(160deg, ${S.glow}, ${S.color})` }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-xl font-extrabold uppercase tracking-wide">{v.name}</h4>
                  <p className="text-sm text-[var(--text-muted)]">{v.definition}</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  { id: fallbackPrev, val: a, c: 'rgba(157,178,211,0.6)' },
                  { id: fallbackCur, val: b, c: S.color },
                ].map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="w-9 text-xs font-bold text-[var(--text-muted)]">{lbl(r.id)}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/8">
                      <motion.div className="h-full rounded-full" style={{ background: r.c }} initial={{ width: 0 }} animate={{ width: `${r.val != null ? ((r.val - 4) / 1) * 100 : 0}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                    <span className="w-10 text-right font-extrabold tnum">{r.val != null ? formatNumber(r.val, 2) : '—'}</span>
                  </div>
                ))}
                <p className="text-right text-xs text-[var(--text-muted)]">
                  skala 1–5 (sumbu bar mulai 4,00) · Δ <strong className="text-[var(--status-ok)]">{a != null && b != null ? formatDelta(b - a) : '—'}</strong>
                </p>
              </div>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : v.id)} className="mt-4 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm font-bold">
                5 perilaku kunci <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {isOpen && (
                <ol className="mt-3 space-y-2">
                  {v.behaviors.map((b, k) => (
                    <li key={b} className="flex gap-2.5 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold" style={{ background: `color-mix(in srgb, ${S.color} 30%, transparent)`, color: S.glow }}>
                        {k + 1}
                      </span>
                      {b}
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 5. Sistem ---------- */
export function SistemLens({ pillar }: { pillar: Pillar }) {
  const S = PILLAR_STYLE[pillar.id];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pillar.systems.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white/[0.03]">
          <ImageWithFallback src={s.imageId ? `assets/systems/${s.imageId}.webp` : undefined} alt={`Tangkapan layar ${s.name}`} label={s.name} accent={S.color} className="aspect-[16/7]" />
          <div className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 font-extrabold">
                <MonitorSmartphone size={17} style={{ color: S.glow }} aria-hidden /> {s.name}
              </h4>
              <span className="chip !text-[10.5px] text-[var(--text-muted)]">
                <Lock size={11} aria-hidden /> {s.access === 'intranet' ? 'Akses intranet' : 'Publik'}
              </span>
            </div>
            {s.description && <p className="text-sm text-[var(--text-muted)]">{s.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {s.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-black/25 p-3">
                  <dt className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)]">{m.label}</dt>
                  <dd className="font-extrabold tnum">{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 6. Simbol ---------- */
export function SimbolLens({ pillar }: { pillar: Pillar }) {
  const S = PILLAR_STYLE[pillar.id];
  const cols = [
    { k: 'ritual', l: 'Bentuk Ritual / Simbol', icon: Award },
    { k: 'frequency', l: 'Frekuensi', icon: CalendarClock },
    { k: 'evidence', l: 'Evidence Implementasi', icon: Camera },
    { k: 'rewardConsequence', l: 'Reward & Consequence', icon: Award },
    { k: 'impact', l: 'Dampak Perilaku', icon: Activity },
    { k: 'governance', l: 'Integrasi Governance', icon: Gavel },
  ] as const;
  const cell = (v: string | string[]) =>
    Array.isArray(v) ? (
      v.length > 1 ? (
        <ol className="list-decimal space-y-1 pl-4">
          {v.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      ) : (
        v[0]
      )
    ) : (
      v
    );
  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Business Target', v: pillar.businessTarget },
          { l: 'Ultimate Target', v: pillar.ultimateTarget },
          { l: 'Overall Progress (laporan unit)', v: pillar.selfReportedProgress ?? '—' },
          { l: 'Periode', v: `s.d. ${formatDate(data.meta.dataAsOf).replace(/^\d+ /, '')}` },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-[var(--border)] p-4" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${S.color} 14%, transparent), transparent)` }}>
            <p className="eyebrow !text-[10.5px]">{x.l}</p>
            <p className="font-extrabold">{x.v}</p>
          </div>
        ))}
      </div>
      <div className="table-wrap hidden lg:block">
        <table className="data-table">
          <caption className="sr-only">Simbol budaya {pillar.name}</caption>
          <thead>
            <tr>
              <th className="sticky-col">Program</th>
              {cols.map((c) => (
                <th key={c.k}>{c.l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pillar.symbols.map((r) => (
              <tr key={r.program}>
                <th scope="row" className="sticky-col min-w-[160px] font-extrabold" style={{ color: S.glow }}>
                  {r.program}
                </th>
                {cols.map((c) => (
                  <td key={c.k} className="min-w-[150px] text-[13px] text-[var(--text-muted)]">
                    {cell(r[c.k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:hidden">
        {pillar.symbols.map((r) => (
          <div key={r.program} className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <h4 className="mb-3 font-extrabold" style={{ color: S.glow }}>
              {r.program}
            </h4>
            <dl className="space-y-3">
              {cols.map((c) => (
                <Fragment key={c.k}>
                  <dt className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{c.l}</dt>
                  <dd className="-mt-2 text-sm">{cell(r[c.k])}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
