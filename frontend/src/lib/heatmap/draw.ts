import {
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  labelHour,
  type HeatmapCell,
} from "./aggregate";

/*
 * Monochrome charcoal ramp. Density is the only encoded dimension; gender
 * detail is exposed in the tooltip and the screen-reader table rather than
 * by mixing colors into the heatmap surface.
 */
const RAMP_RGB = { r: 26, g: 26, b: 26 };
const EMPTY_FILL = "rgba(26, 26, 26, 0.04)";

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function rampColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  // 0 → ~6% ink, 1 → 100% ink. Keeps the lightest cells barely visible while
  // saturating dense ones to full charcoal.
  const alpha = 0.06 + clamped * 0.94;
  return `rgba(${RAMP_RGB.r}, ${RAMP_RGB.g}, ${RAMP_RGB.b}, ${alpha.toFixed(3)})`;
}

export function fillForCell(cell: HeatmapCell, maxCount: number): string {
  if (cell.count === 0) return EMPTY_FILL;
  return rampColor(cell.count / Math.max(1, maxCount));
}

export interface HeatmapGeometry {
  leftAxis: number;
  topAxis: number;
  cellW: number;
  cellH: number;
}

export function heatmapGeometry(width: number, height: number): HeatmapGeometry {
  const leftAxis = 56;
  const topAxis = 32;
  const cellW = (width - leftAxis - 8) / HEATMAP_DAYS.length;
  const cellH = (height - topAxis - 28) / HEATMAP_HOURS.length;
  return { leftAxis, topAxis, cellW, cellH };
}

export function pickHeatmapCell(
  x: number,
  y: number,
  width: number,
  height: number,
): { row: number; col: number } | null {
  const { leftAxis, topAxis, cellW, cellH } = heatmapGeometry(width, height);
  if (x < leftAxis || y < topAxis) return null;
  const col = Math.floor((x - leftAxis) / cellW);
  const row = Math.floor((y - topAxis) / cellH);
  if (col < 0 || col > 6 || row < 0 || row >= HEATMAP_HOURS.length) return null;
  return { row, col };
}

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  grid: HeatmapCell[][],
  maxCount: number,
  width: number,
  height: number,
): void {
  const { leftAxis, topAxis, cellW, cellH } = heatmapGeometry(width, height);
  const ink = readToken("--color-ink", "#1a1a1a");
  const inkSoft = readToken("--color-ink-soft", "rgba(26,26,26,0.62)");
  const inkFaint = readToken("--color-ink-faint", "rgba(26,26,26,0.42)");

  ctx.clearRect(0, 0, width, height);

  // Day labels along the top — small, all-caps, generously tracked.
  ctx.font = '500 10px "Inter Tight", system-ui, sans-serif';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = inkFaint;
  HEATMAP_DAYS.forEach((d, c) => {
    ctx.fillText(d.toUpperCase(), leftAxis + c * cellW + cellW / 2, topAxis / 2);
  });

  // Hour labels along the left.
  ctx.textAlign = "right";
  ctx.font = '400 10px "Inter Tight", system-ui, sans-serif';
  HEATMAP_HOURS.forEach((h, r) => {
    ctx.fillStyle = inkFaint;
    ctx.fillText(labelHour(h), leftAxis - 8, topAxis + r * cellH + cellH / 2);
  });

  // Cells — no inner padding rounding to keep the grid Swiss-precise.
  for (let r = 0; r < HEATMAP_HOURS.length; r++) {
    for (let c = 0; c < HEATMAP_DAYS.length; c++) {
      const cell = grid[r][c];
      const x = leftAxis + c * cellW;
      const y = topAxis + r * cellH;
      const w = cellW - 1;
      const h = cellH - 1;

      ctx.fillStyle = fillForCell(cell, maxCount);
      ctx.fillRect(x, y, w, h);

      if (cell.count > 0) {
        const intensity = cell.count / Math.max(1, maxCount);
        ctx.fillStyle = intensity > 0.55 ? "rgba(246, 243, 238, 0.95)" : ink;
        ctx.textAlign = "center";
        ctx.font = '400 13px "Fraunces", Georgia, serif';
        ctx.fillText(String(cell.count), x + w / 2, y + h / 2);
      }
    }
  }

  // Legend at the bottom — single horizontal ramp, no labels in caps.
  ctx.textAlign = "left";
  ctx.font = '500 9px "Inter Tight", system-ui, sans-serif';
  ctx.fillStyle = inkSoft;
  ctx.fillText("FEWER", leftAxis, height - 10);
  ctx.textAlign = "right";
  ctx.fillText("MORE", width - 4, height - 10);

  const lx = leftAxis + 56;
  const lw = Math.max(40, width - leftAxis - 56 - 56);
  const grad = ctx.createLinearGradient(lx, 0, lx + lw, 0);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    grad.addColorStop(t, rampColor(t));
  }
  ctx.fillStyle = grad;
  ctx.fillRect(lx, height - 18, lw, 4);

  // Single hairline above the legend keeps the chart Swiss-grid precise.
  ctx.fillStyle = inkFaint;
  ctx.fillRect(leftAxis, height - 24, width - leftAxis - 4, 1);
}
