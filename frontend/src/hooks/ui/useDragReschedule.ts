import { useCallback, useState } from "react";
import type { Study } from "../../types/domain";

export interface DragRescheduleState {
  draggingId: string | null;
  dragOverKey: string | null;
}

export interface DragRescheduleHandlers {
  onChipDragStart: (studyId: string, e: React.DragEvent<HTMLElement>) => void;
  onChipDragEnd: () => void;
  onCellDragOver: (cellKey: string, e: React.DragEvent<HTMLElement>) => void;
  onCellDragLeave: (cellKey: string, e: React.DragEvent<HTMLElement>) => void;
  /** Returns the study that was dropped (or null) so callers can do their own work. */
  onCellDrop: (cellKey: string, e: React.DragEvent<HTMLElement>) => Study | null;
}

/**
 * Tracks which calendar chip is being dragged and which cell is the current
 * drop target. Decoupled from the actual "reschedule" side-effect so callers
 * can wire it to any persistence layer.
 */
export function useDragReschedule(
  studies: Study[],
): { state: DragRescheduleState; handlers: DragRescheduleHandlers } {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const onChipDragStart = useCallback((studyId: string, e: React.DragEvent<HTMLElement>) => {
    e.dataTransfer.setData("text/plain", studyId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(studyId);
  }, []);

  const onChipDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverKey(null);
  }, []);

  const onCellDragOver = useCallback(
    (cellKey: string, e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverKey((prev) => (prev === cellKey ? prev : cellKey));
    },
    [],
  );

  const onCellDragLeave = useCallback(
    (cellKey: string, e: React.DragEvent<HTMLElement>) => {
      // Only clear when we actually leave the cell (not when moving between
      // child chips); compare relatedTarget to currentTarget.
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      setDragOverKey((prev) => (prev === cellKey ? null : prev));
    },
    [],
  );

  const onCellDrop = useCallback(
    (_cellKey: string, e: React.DragEvent<HTMLElement>): Study | null => {
      e.preventDefault();
      setDragOverKey(null);
      const studyId = e.dataTransfer.getData("text/plain");
      setDraggingId(null);
      if (!studyId) return null;
      return studies.find((s) => s.id === studyId) ?? null;
    },
    [studies],
  );

  return {
    state: { draggingId, dragOverKey },
    handlers: { onChipDragStart, onChipDragEnd, onCellDragOver, onCellDragLeave, onCellDrop },
  };
}
