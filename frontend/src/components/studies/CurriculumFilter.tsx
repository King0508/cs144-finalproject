import type { Study } from "../../types/domain";
import { CURRICULUM } from "../../lib/curriculum";

export type CurriculumFilter = { selected: number[] };

export function matchesCurriculumFilter(
  s: Pick<Study, "studyIndex">,
  f: CurriculumFilter,
): boolean {
  if (f.selected.length === 0) return true;
  if (s.studyIndex < 0) return false;
  return f.selected.includes(s.studyIndex);
}

export function describeCurriculumFilter(f: CurriculumFilter): string | null {
  const count = f.selected.length;
  if (count === 0) return null;
  if (count === 1) return `Only ${CURRICULUM[f.selected[0]]}`;
  if (count <= 3) return f.selected.map((i) => CURRICULUM[i]).join(", ");
  return `${count} studies selected`;
}

function toggleIndex(f: CurriculumFilter, index: number): CurriculumFilter {
  const has = f.selected.includes(index);
  const next = has
    ? f.selected.filter((i) => i !== index)
    : [...f.selected, index].sort((a, b) => a - b);
  return { selected: next };
}

interface CurriculumFilterControlProps {
  value: CurriculumFilter;
  onChange: (next: CurriculumFilter) => void;
}

export function CurriculumFilter({ value, onChange }: CurriculumFilterControlProps) {
  const allActive = value.selected.length === 0;

  return (
    <section aria-label="Curriculum filter" className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Curriculum</p>
        <button
          type="button"
          aria-pressed={allActive}
          onClick={() => onChange({ selected: [] })}
          className={
            "text-[11px] uppercase tracking-[0.18em] transition-colors " +
            (allActive ? "text-ink" : "text-ink-soft hover:text-ink")
          }
        >
          All studies
        </button>
      </div>

      <ol className="flex items-stretch overflow-x-auto border border-line">
        {CURRICULUM.map((name, index) => {
          const active = value.selected.includes(index);
          const ariaLabel = active
            ? `Remove ${name} from filter`
            : `Add ${name} to filter`;

          return (
            <li key={name} className="contents">
              <button
                type="button"
                aria-pressed={active}
                aria-label={ariaLabel}
                onClick={() => onChange(toggleIndex(value, index))}
                className={
                  "group relative flex shrink-0 items-center gap-2 border-r border-line px-3 py-2.5 text-xs font-medium tracking-tight transition-colors last:border-r-0 " +
                  (active
                    ? "bg-ink text-onInk"
                    : "bg-transparent text-ink-soft hover:bg-ink/[0.03] hover:text-ink")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "font-display text-[11px] tracking-tight " +
                    (active ? "text-onInk/70" : "text-ink-faint")
                  }
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap">{name}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="caption" aria-live="polite">
        {allActive
          ? "Tap a study to filter. Tap multiple to combine."
          : `${describeCurriculumFilter(value)}. Custom studies hidden.`}
      </p>
    </section>
  );
}
