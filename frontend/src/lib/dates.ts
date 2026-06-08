/** Pure date helpers shared across the app. All times are local. */

export const ONE_HOUR_MS = 60 * 60 * 1000;
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Monday-anchored start of week for `d`, with the time clamped to 00:00 local.
 * Used by the Calendar and Dashboard pages so both interpret "this week"
 * identically.
 */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/** Format an epoch-ms value into the local-time string accepted by `<input type="datetime-local">`. */
export function toDatetimeLocalValue(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Snap an epoch-ms value down to the nearest 15-minute boundary so default
 * prefilled times align with a 15-minute step grid.
 */
export function roundTo15(epochMs: number): number {
  const ms15 = 15 * 60 * 1000;
  return Math.round(epochMs / ms15) * ms15;
}
