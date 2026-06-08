import type { Study } from "../types/domain";

const DEFAULT_DURATION_MINUTES = 60;

export function studyEndAt(
  s: Pick<Study, "scheduledAt" | "durationMinutes">,
): number {
  return s.scheduledAt + (s.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60_000;
}

export function isStudyUpcoming(s: Study, now: number = Date.now()): boolean {
  return studyEndAt(s) > now;
}
