import { useEffect, useMemo, useRef, useState } from "react";
import type { Study } from "../../types/domain";
import {
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  aggregateHeatmap,
  labelHour,
} from "../../lib/heatmap/aggregate";
import { drawHeatmap, pickHeatmapCell } from "../../lib/heatmap/draw";

interface WeeklyHeatmapCanvasProps {
  studies: Study[];
  weekStart: Date;
}

interface HoverState {
  row: number;
  col: number;
  x: number;
  y: number;
}

export function WeeklyHeatmapCanvas({ studies, weekStart }: WeeklyHeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 480 });

  const grid = useMemo(() => aggregateHeatmap(studies, weekStart), [studies, weekStart]);
  const maxCount = useMemo(() => Math.max(1, ...grid.flat().map((c) => c.count)), [grid]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setDims({ width: w, height: Math.max(360, Math.min(560, Math.round(w * 0.6))) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    canvas.style.width = `${dims.width}px`;
    canvas.style.height = `${dims.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHeatmap(ctx, grid, maxCount, dims.width, dims.height);
  }, [grid, maxCount, dims]);

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = pickHeatmapCell(x, y, dims.width, dims.height);
    if (cell) {
      setHover({ ...cell, x, y });
    } else {
      setHover(null);
    }
  }

  return (
    <div ref={containerRef} className="relative border border-line bg-surface p-6">
      <header className="mb-5 space-y-1 border-b border-line pb-4">
        <p className="eyebrow">Activity</p>
        <h2 className="display-sm">When studies happen this week</h2>
        <p className="caption">Darker cells mean more studies in that hour. Hover for detail.</p>
      </header>

      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
        aria-hidden="true"
        className="block"
      />

      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 max-w-xs bg-ink p-3 text-onInk"
          style={{
            left: Math.min(hover.x + 16, dims.width - 240),
            top: Math.min(hover.y + 16, dims.height - 80),
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-onInk/60">
            {HEATMAP_DAYS[hover.col]} · {labelHour(HEATMAP_HOURS[hover.row])}
          </p>
          <p className="mt-1 font-display text-base tracking-tight">
            {grid[hover.row][hover.col].count} studies
          </p>
          <p className="caption mt-0.5 text-onInk/60">
            {grid[hover.row][hover.col].men}M / {grid[hover.row][hover.col].women}F
          </p>
          {grid[hover.row][hover.col].studies.slice(0, 5).map((s) => (
            <p key={s.id} className="mt-1 truncate text-xs text-onInk/75">
              {s.inviteeName} · {s.studyName}
            </p>
          ))}
        </div>
      ) : null}

      {/* Visually hidden table mirrors the canvas data for screen readers. */}
      <table className="sr-only-table">
        <caption>Bible studies this week by day and hour.</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            {HEATMAP_DAYS.map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HEATMAP_HOURS.map((hour, r) => (
            <tr key={hour}>
              <th scope="row">{labelHour(hour)}</th>
              {HEATMAP_DAYS.map((d, c) => {
                const cell = grid[r][c];
                return (
                  <td key={d}>
                    {cell.count} studies ({cell.men} men, {cell.women} women)
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
