export type TimePeriodDays = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const PERIOD_VALUES: TimePeriodDays[] = [1, 2, 3, 4, 5, 6, 7];

// End of the inclusive day at `today + (days - 1)` in local time. We treat the
// window as "rolling N calendar days starting today" so the lower bound is
// `now` (enforced separately via `isStudyUpcoming`) and the upper bound is the
// last millisecond of the Nth day.
export function periodWindowEnd(now: number, days: TimePeriodDays): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (days - 1));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function describeTimePeriod(days: TimePeriodDays): string {
  if (days === 1) return "today";
  if (days === 7) return "this week";
  return `in the next ${days} days`;
}

function pillLabel(days: TimePeriodDays): string {
  if (days === 1) return "Today";
  if (days === 7) return "Week";
  return `${days} days`;
}

function pillAriaLabel(days: TimePeriodDays): string {
  if (days === 1) return "Show studies today";
  if (days === 7) return "Show studies this week";
  return `Show studies in the next ${days} days`;
}

interface TimePeriodFilterProps {
  value: TimePeriodDays;
  onChange: (next: TimePeriodDays) => void;
}

export function TimePeriodFilter({ value, onChange }: TimePeriodFilterProps) {
  return (
    <section aria-label="Time period filter" className="space-y-3">
      <p className="eyebrow">Window</p>
      <div
        role="tablist"
        aria-label="Time window"
        className="flex items-stretch overflow-x-auto border border-line"
      >
        {PERIOD_VALUES.map((days) => {
          const active = value === days;
          return (
            <button
              key={days}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={pillAriaLabel(days)}
              onClick={() => onChange(days)}
              className={
                "min-w-[64px] flex-1 shrink-0 border-r border-line px-4 py-2.5 text-xs font-medium tracking-tight transition-colors last:border-r-0 " +
                (active
                  ? "bg-ink text-onInk"
                  : "bg-transparent text-ink-soft hover:bg-ink/[0.03] hover:text-ink")
              }
            >
              {pillLabel(days)}
            </button>
          );
        })}
      </div>
      <p className="caption" aria-live="polite">
        Showing studies {describeTimePeriod(value)}.
      </p>
    </section>
  );
}
