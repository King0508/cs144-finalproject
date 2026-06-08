import type { GenderBarRow } from "../../hooks/queries/useDashboardAggregates";

interface GenderStackedBarCardProps {
  title: string;
  rows: GenderBarRow[];
  emptyHint: string;
  headingId: string;
}

export function GenderStackedBarCard({
  title,
  rows,
  emptyHint,
  headingId,
}: GenderStackedBarCardProps) {
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <section aria-labelledby={headingId} className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-3 border-b border-line pb-4">
        <p className="eyebrow">Composition</p>
        <h2 id={headingId} className="display-sm">
          {title}
        </h2>
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-2 w-3 bg-ink" />
            Brothers
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-2 w-3 bg-accent" />
            Sisters
          </span>
        </div>
      </header>
      {rows.length === 0 || rows.every((r) => r.total === 0) ? (
        <p className="caption">{emptyHint}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink">{row.name}</span>
                <span className="font-display text-sm tracking-tight text-ink-soft">
                  {row.total}
                  <span className="text-ink-faint">
                    {" "}
                    ({row.m}M / {row.f}F)
                  </span>
                </span>
              </div>
              <div
                className="flex h-1.5 overflow-hidden bg-line-strong"
                role="img"
                aria-label={`${row.name}: ${row.m} brothers and ${row.f} sisters`}
              >
                <div className="h-1.5 bg-ink" style={{ width: `${(row.m / max) * 100}%` }} />
                <div className="h-1.5 bg-accent" style={{ width: `${(row.f / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
