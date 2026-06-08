import type { Study } from "../../types/domain";
import { StudyChip } from "./StudyChip";

interface CalendarCellProps {
  cellKey: string;
  studies: Study[];
  isDragOver: boolean;
  draggingId: string | null;
  keyboardFocusId: string | null;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSelectStudy: (s: Study) => void;
  onChipDragStart: (studyId: string, e: React.DragEvent<HTMLElement>) => void;
  onChipDragEnd: () => void;
  onChipShowHover: (s: Study, target: HTMLElement) => void;
  onChipClearHover: (s: Study) => void;
  onChipKeyMove: (s: Study, deltaDays: number, deltaHours: number) => void;
  onChipFocus: (s: Study) => void;
  onChipBlur: (s: Study) => void;
  onChipEscape: () => void;
}

export function CalendarCell({
  cellKey,
  studies,
  isDragOver,
  draggingId,
  keyboardFocusId,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectStudy,
  onChipDragStart,
  onChipDragEnd,
  onChipShowHover,
  onChipClearHover,
  onChipKeyMove,
  onChipFocus,
  onChipBlur,
  onChipEscape,
}: CalendarCellProps) {
  return (
    <div
      role="gridcell"
      className={
        "relative min-h-[3rem] border-l border-t border-line p-1 transition-colors " +
        (isDragOver ? "bg-accent-soft outline outline-1 outline-offset-[-1px] outline-accent" : "")
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {studies.length > 1 ? (
        <span
          className="pointer-events-none absolute right-1 top-1 z-[1] bg-ink px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-onInk"
          aria-label={`${studies.length} studies at this time`}
        >
          {studies.length}
        </span>
      ) : null}
      <div className="flex flex-col gap-0.5" data-cell={cellKey}>
        {studies.map((s) => (
          <StudyChip
            key={s.id}
            study={s}
            isDragging={draggingId === s.id}
            isKeyboardFocused={keyboardFocusId === s.id}
            onClick={() => onSelectStudy(s)}
            onDragStart={(e) => onChipDragStart(s.id, e)}
            onDragEnd={onChipDragEnd}
            onShowHover={(el) => onChipShowHover(s, el)}
            onClearHover={() => onChipClearHover(s)}
            onKeyMove={(dd, dh) => onChipKeyMove(s, dd, dh)}
            onFocus={() => onChipFocus(s)}
            onBlur={() => onChipBlur(s)}
            onEscape={onChipEscape}
          />
        ))}
      </div>
    </div>
  );
}
