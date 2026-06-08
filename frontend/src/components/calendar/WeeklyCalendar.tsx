import { useEffect, useMemo, useRef, useState } from "react";
import type { Study } from "../../types/domain";
import { useRescheduleStudy } from "../../hooks/mutations/useRescheduleStudy";
import { useDragReschedule } from "../../hooks/ui/useDragReschedule";
import { ONE_DAY_MS } from "../../lib/dates";
import { CalendarCell } from "./CalendarCell";
import { HoverCard, type HoverCardState } from "./HoverCard";

interface WeeklyCalendarProps {
  studies: Study[];
  weekStart: Date;
  onSelectStudy: (s: Study) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8am..9pm
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayIndex(d: Date, weekStart: Date): number {
  const ms = d.getTime() - weekStart.getTime();
  return Math.floor(ms / ONE_DAY_MS);
}

export function WeeklyCalendar({ studies, weekStart, onSelectStudy }: WeeklyCalendarProps) {
  const reschedule = useRescheduleStudy();
  const { state, handlers } = useDragReschedule(studies);
  const [keyboardFocus, setKeyboardFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverCardState | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const byCell = useMemo(() => {
    const map = new Map<string, Study[]>();
    for (const s of studies) {
      const dt = new Date(s.scheduledAt);
      const di = dayIndex(dt, weekStart);
      const hi = dt.getHours();
      if (di < 0 || di > 6) continue;
      if (hi < HOURS[0] || hi > HOURS[HOURS.length - 1]) continue;
      const key = `${di}-${hi}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.scheduledAt - b.scheduledAt);
    return map;
  }, [studies, weekStart]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setHover(null);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  function showHoverFromElement(study: Study, el: HTMLElement) {
    const container = containerRef.current;
    if (!container) return;
    const chipRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = chipRect.left - containerRect.left + chipRect.width / 2;
    const y = chipRect.bottom - containerRect.top;
    setHover({ study, x, y });
  }

  function announce(study: Study, newDate: Date) {
    if (liveRef.current) {
      liveRef.current.textContent = `Rescheduled ${study.studyName} with ${study.inviteeName} to ${newDate.toLocaleString()}`;
    }
  }

  function handleDrop(dayIdx: number, hour: number, e: React.DragEvent<HTMLDivElement>) {
    const cellKey = `${dayIdx}-${hour}`;
    const study = handlers.onCellDrop(cellKey, e);
    if (!study) return;
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + dayIdx);
    newDate.setHours(hour, 0, 0, 0);
    void reschedule(study.id, newDate.getTime());
    announce(study, newDate);
  }

  function onKeyMove(study: Study, deltaDays: number, deltaHours: number) {
    const newDate = new Date(study.scheduledAt);
    newDate.setDate(newDate.getDate() + deltaDays);
    newDate.setHours(newDate.getHours() + deltaHours);
    void reschedule(study.id, newDate.getTime());
    announce(study, newDate);
  }

  return (
    <div ref={containerRef} className="relative overflow-x-auto border border-line bg-surface">
      <div ref={liveRef} className="sr-only" role="status" aria-live="polite" />
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `4rem repeat(7, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Weekly calendar"
      >
        <div className="border-b border-line" />
        {DAYS.map((d, i) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          return (
            <div
              key={d}
              className="border-b border-l border-line px-2 py-3 text-center"
              role="columnheader"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">{d}</p>
              <p className="mt-1 font-display text-base tracking-tight text-ink">
                {date.getDate()}
              </p>
            </div>
          );
        })}

        {HOURS.map((hour) => (
          <div key={hour} className="contents" role="row">
            <div className="border-t border-line px-2 py-2 text-right text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            {DAYS.map((_, dayIdx) => {
              const cellKey = `${dayIdx}-${hour}`;
              const cellStudies = byCell.get(cellKey) ?? [];
              return (
                <CalendarCell
                  key={cellKey}
                  cellKey={cellKey}
                  studies={cellStudies}
                  isDragOver={state.dragOverKey === cellKey}
                  draggingId={state.draggingId}
                  keyboardFocusId={keyboardFocus}
                  onDragOver={(e) => handlers.onCellDragOver(cellKey, e)}
                  onDragLeave={(e) => handlers.onCellDragLeave(cellKey, e)}
                  onDrop={(e) => handleDrop(dayIdx, hour, e)}
                  onSelectStudy={onSelectStudy}
                  onChipDragStart={(studyId, e) => {
                    handlers.onChipDragStart(studyId, e);
                    setHover(null);
                  }}
                  onChipDragEnd={handlers.onChipDragEnd}
                  onChipShowHover={showHoverFromElement}
                  onChipClearHover={(s) =>
                    setHover((h) => (h?.study.id === s.id ? null : h))
                  }
                  onChipKeyMove={onKeyMove}
                  onChipFocus={(s) => setKeyboardFocus(s.id)}
                  onChipBlur={(s) => {
                    setKeyboardFocus(null);
                    setHover((h) => (h?.study.id === s.id ? null : h));
                  }}
                  onChipEscape={() => setHover(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {hover ? <HoverCard hover={hover} container={containerRef.current} /> : null}

      <p className="border-t border-line px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        Drag a study to reschedule. Focus a study and use Shift + arrow keys.
      </p>
    </div>
  );
}
