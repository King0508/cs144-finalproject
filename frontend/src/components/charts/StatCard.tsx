interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="border border-line bg-surface p-6 transition-all duration-200 ease-smooth hover:border-line-strong motion-safe:hover:-translate-y-px">
      <p className="eyebrow">{label}</p>
      <p className="numeric-display mt-4">{value}</p>
      {hint ? <p className="caption mt-2">{hint}</p> : null}
    </article>
  );
}
