interface CountCardProps {
  title: string;
  data: Map<string, number>;
  emptyHint: string;
}

export function CountCard({ title, data, emptyHint }: CountCardProps) {
  const entries = Array.from(data.entries()).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  const headingId = `cc-${title.replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-1 border-b border-line pb-3">
        <p className="eyebrow">Distribution</p>
        <h2 id={headingId} className="display-sm">
          {title}
        </h2>
      </header>
      {entries.length === 0 ? (
        <p className="caption">{emptyHint}</p>
      ) : (
        <ul className="space-y-4">
          {entries.map(([k, v]) => (
            <li key={k} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink">{k}</span>
                <span className="font-display text-base tracking-tight text-ink">{v}</span>
              </div>
              <div className="relative h-px w-full bg-line-strong">
                <div
                  className="absolute inset-y-0 left-0 h-px bg-ink"
                  style={{ width: `${(v / max) * 100}%` }}
                  role="presentation"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
