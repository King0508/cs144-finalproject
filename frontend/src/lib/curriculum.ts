/**
 * The 8-step bible-study curriculum. Order is meaningful — when an invitee
 * completes study at index N, the suggested next study is at index N+1.
 * Single source of truth: re-exported by the backend (see /backend/src/curriculum.ts).
 */
export const CURRICULUM = [
  "Seeking God",
  "Word of God",
  "Discipleship",
  "Kingdom",
  "Light and Darkness",
  "Cross",
  "Church",
  "CTC",
] as const;

export type StudyName = (typeof CURRICULUM)[number];

export const STUDY_INDEX: Record<StudyName, number> = CURRICULUM.reduce(
  (acc, name, idx) => {
    acc[name] = idx;
    return acc;
  },
  {} as Record<StudyName, number>,
);

/** Index of the next study in the curriculum, or null if the invitee has completed all 8. */
export function nextStudyIndex(currentIndex: number): number | null {
  if (currentIndex < -1 || currentIndex >= CURRICULUM.length - 1) return null;
  return currentIndex + 1;
}

export function nextStudyName(currentIndex: number): StudyName | null {
  const idx = nextStudyIndex(currentIndex);
  return idx === null ? null : CURRICULUM[idx];
}
