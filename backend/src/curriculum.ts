/**
 * Single source of truth for the 8-step bible-study curriculum, mirrored
 * (intentionally — these two files are short and must stay in sync) on the
 * frontend at frontend/src/lib/curriculum.ts.
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

export function nextStudyName(currentIndex: number): StudyName | null {
  if (currentIndex < -1 || currentIndex >= CURRICULUM.length - 1) return null;
  return CURRICULUM[currentIndex + 1];
}
