/**
 * Date helpers anchored to the ministry's timezone (America/Los_Angeles).
 *
 * The AI features reason about "today / this week / this month" relative to
 * when leaders actually meet, not the server's UTC clock. Everything here is
 * derived from `Intl.DateTimeFormat` with an explicit `timeZone`, so it is
 * correct regardless of where the backend runs (and handles PST/PDT).
 */

export const MINISTRY_TZ = "America/Los_Angeles";

/** YYYY-MM-DD for the given instant, as seen on a wall clock in LA. */
export function laDateString(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MINISTRY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Human-friendly date, e.g. "Mon, Jun 8, 2026", as seen in LA. */
export function laDisplayDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MINISTRY_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** YYYY-MM-DD of the Monday that starts the LA week containing `date`. */
export function laWeekMonday(date: Date = new Date()): string {
  const today = laDateString(date);
  // Interpret the calendar date as UTC so getUTCDay() yields its weekday
  // independent of the host timezone.
  const dt = new Date(`${today}T00:00:00Z`);
  const daysSinceMonday = (dt.getUTCDay() + 6) % 7; // 0=Sun -> 6, 1=Mon -> 0
  dt.setUTCDate(dt.getUTCDate() - daysSinceMonday);
  return dt.toISOString().slice(0, 10);
}

/**
 * Inclusive first day and exclusive day-after-last for the LA month
 * containing `date`, both as YYYY-MM-DD.
 */
export function laMonthRange(date: Date = new Date()): { start: string; endExclusive: string } {
  const today = laDateString(date);
  const [year, month] = today.split("-").map(Number);
  const start = `${today.slice(0, 7)}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, endExclusive };
}

/**
 * Offset in ms between LA wall-clock time and UTC at the given instant
 * (negative because LA is behind UTC: -7h PDT, -8h PST).
 */
function laOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MINISTRY_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour") % 24; // some engines emit "24" for midnight
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asUtc - date.getTime();
}

/**
 * Epoch ms for LA-local midnight at the start of `ymd` (YYYY-MM-DD).
 * Returns NaN for an unparseable input.
 */
export function laDateToEpochMs(ymd: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return NaN;
  const [, y, m, d] = match.map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, 0, 0, 0);
  // LA midnight in UTC = wall-clock-as-UTC minus LA's offset from UTC.
  return wallAsUtc - laOffsetMs(new Date(wallAsUtc));
}
