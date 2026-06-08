import { Check } from "lucide-react";
import { CURRICULUM } from "../../lib/curriculum";
import { Icon } from "../ui/Icon";

interface CurriculumProgressProps {
  /** -1 means "no studies completed yet". */
  currentStudyIndex: number;
}

export function CurriculumProgress({ currentStudyIndex }: CurriculumProgressProps) {
  const completedCount = Math.max(0, currentStudyIndex + 1);
  const total = CURRICULUM.length;

  return (
    <section aria-labelledby="prog-heading" className="space-y-stack">
      <header className="flex items-baseline justify-between border-b border-line pb-3">
        <div className="space-y-1">
          <p className="eyebrow">Curriculum</p>
          <h2 id="prog-heading" className="display-sm">
            Progress
          </h2>
        </div>
        <p className="font-display text-2xl tracking-tight text-ink">
          {completedCount}
          <span className="text-ink-faint"> / {total}</span>
        </p>
      </header>

      {/* Hairline step rail */}
      <ol className="grid grid-cols-8 gap-1" aria-label="Step rail">
        {CURRICULUM.map((name, i) => {
          const completed = i <= currentStudyIndex;
          const isNext = i === currentStudyIndex + 1;
          return (
            <li key={name} className="h-1">
              <span
                aria-label={`${name}${completed ? ", completed" : isNext ? ", next" : ""}`}
                className={
                  "block h-full w-full " +
                  (completed
                    ? "bg-ink"
                    : isNext
                      ? "bg-accent"
                      : "bg-line-strong")
                }
              />
            </li>
          );
        })}
      </ol>

      {/* Detailed list */}
      <ol className="divide-y divide-line border-t border-line">
        {CURRICULUM.map((name, i) => {
          const completed = i <= currentStudyIndex;
          const isNext = i === currentStudyIndex + 1;
          return (
            <li
              key={name}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className={
                    "font-display text-base tracking-tight " +
                    (completed
                      ? "text-ink"
                      : isNext
                        ? "text-accent"
                        : "text-ink-faint")
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={
                    completed
                      ? "text-ink"
                      : isNext
                        ? "text-ink"
                        : "text-ink-faint"
                  }
                >
                  {name}
                </span>
              </div>
              {completed ? (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                  <Icon icon={Check} size="xs" />
                  Done
                </span>
              ) : isNext ? (
                <span className="text-[11px] uppercase tracking-[0.18em] text-accent">
                  Next
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
