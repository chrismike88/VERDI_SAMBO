import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';

export function ChartTableToggle({ chart, table, title }: { chart: React.ReactNode; table: React.ReactNode; title: string }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-[var(--text-muted)]">{title}</h4>
        <button type="button" onClick={() => setShowTable((s) => !s)} className="chip hover:bg-white/10" aria-pressed={showTable}>
          {showTable ? <BarChart3 size={13} aria-hidden /> : <Table2 size={13} aria-hidden />}
          {showTable ? 'Lihat grafik' : 'Lihat tabel'}
        </button>
      </div>
      {showTable ? table : chart}
    </div>
  );
}
