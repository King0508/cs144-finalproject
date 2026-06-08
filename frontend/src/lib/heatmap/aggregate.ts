import type { Study } from "../../types/domain";

export const HEATMAP_HOURS: readonly number[] = Array.from({ length: 14 }, (_, i) => 8 + i);
export const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface HeatmapCell {
  count: number;
  men: number;
  women: number;
  studies: Study[];
}

export function aggregateHeatmap(studies: Study[], weekStart: Date): HeatmapCell[][] {
  const grid: HeatmapCell[][] = HEATMAP_HOURS.map(() =>
    HEATMAP_DAYS.map(() => ({ count: 0, men: 0, women: 0, studies: [] as Study[] })),
  );
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

  for (const s of studies) {
    if (s.scheduledAt < weekStartMs || s.scheduledAt >= weekEndMs) continue;
    const dt = new Date(s.scheduledAt);
    const dayIdx = Math.floor((s.scheduledAt - weekStartMs) / (24 * 60 * 60 * 1000));
    const hour = dt.getHours();
    const rowIdx = HEATMAP_HOURS.indexOf(hour);
    if (rowIdx < 0 || dayIdx < 0 || dayIdx > 6) continue;
    const cell = grid[rowIdx][dayIdx];
    cell.count += 1;
    cell.studies.push(s);
    if (s.gender === "M") cell.men += 1;
    else cell.women += 1;
  }
  return grid;
}

export function labelHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
