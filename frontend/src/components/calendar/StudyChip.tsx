import type { Study } from "../../types/domain";

interface StudyChipProps {
  study: Study;
  isDragging: boolean;
  isKeyboardFocused: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onShowHover: (target: HTMLElement) => void;
  onClearHover: () => void;
  onKeyMove: (deltaDays: number, deltaHours: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  onEscape: () => void;
}

export function StudyChip({
  study,
  isDragging,
  isKeyboardFocused,
  onClick,
  onDragStart,
  onDragEnd,
  onShowHover,
  onClearHover,
  onKeyMove,
  onFocus,
  onBlur,
  onEscape,
}: StudyChipProps) {
  const accentStripe = study.gender === "F" ? "before:bg-accent" : "before:bg-ink";
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={(e) => onShowHover(e.currentTarget)}
      onMouseLeave={onClearHover}
      onFocus={(e) => {
        onFocus();
        onShowHover(e.currentTarget);
      }}
      onBlur={() => {
        onBlur();
        onClearHover();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onEscape();
          return;
        }
        if (e.shiftKey && e.key === "ArrowLeft") {
          e.preventDefault();
          onKeyMove(-1, 0);
        } else if (e.shiftKey && e.key === "ArrowRight") {
          e.preventDefault();
          onKeyMove(1, 0);
        } else if (e.shiftKey && e.key === "ArrowUp") {
          e.preventDefault();
          onKeyMove(0, -1);
        } else if (e.shiftKey && e.key === "ArrowDown") {
          e.preventDefault();
          onKeyMove(0, 1);
        }
      }}
      className={
        "relative block w-full truncate bg-bg pl-2 pr-1 py-1 text-left text-[11px] text-ink transition-colors hover:bg-ink hover:text-onInk " +
        "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[2px] " +
        accentStripe +
        (isDragging ? " opacity-50" : "") +
        (isKeyboardFocused ? " outline outline-1 outline-offset-[-1px] outline-ink" : "")
      }
      aria-label={`${study.studyName} with ${study.inviteeName} at ${new Date(
        study.scheduledAt,
      ).toLocaleString()}. Press Shift plus arrow keys to reschedule. Press Enter to edit. Press Escape to dismiss the details popover.`}
    >
      <span className="block truncate font-medium">{study.inviteeName}</span>
      <span className="block truncate text-ink-soft">{study.studyName}</span>
    </button>
  );
}
