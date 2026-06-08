import type { Study } from "../../types/domain";
import { StudyCard } from "./StudyCard";

interface StudyColumnProps {
  title: string;
  emptyLabel: string;
  studies: Study[];
  onEdit: (s: Study) => void;
  onComplete: (s: Study) => void;
}

export function StudyColumn({
  title,
  emptyLabel,
  studies,
  onEdit,
  onComplete,
}: StudyColumnProps) {
  const headingId = `col-${title.replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <header className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 id={headingId} className="display-sm">
          {title}
        </h2>
        <span className="eyebrow">{studies.length}</span>
      </header>
      {studies.length === 0 ? (
        <p className="border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-faint">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-3">
          {studies.map((s) => (
            <li key={s.id}>
              <StudyCard study={s} onEdit={onEdit} onComplete={onComplete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
