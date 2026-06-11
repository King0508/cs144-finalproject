import { useCallback } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Study } from "../../types/domain";

/**
 * Marks a study as completed and bumps the invitee's `currentStudyIndex` if
 * this study advances them further than before.
 *
 * Runs inside a single Firestore `runTransaction` so the two writes (study
 * status + invitee progress) commit atomically, and the index comparison is
 * made against the freshly-read invitee document rather than a possibly-stale
 * client cache.
 */
export function useCompleteStudy(): (study: Study) => Promise<void> {
  return useCallback(async (study: Study) => {
    const { db } = getFirebase();
    await runTransaction(db, async (tx) => {
      const studyRef = doc(db, "studies", study.id);
      const inviteeRef = doc(db, "invitees", study.inviteeId);
      // All reads must precede writes in a Firestore transaction.
      const inviteeSnap = await tx.get(inviteeRef);
      tx.update(studyRef, { status: "completed" });
      if (inviteeSnap.exists()) {
        const current = (inviteeSnap.data().currentStudyIndex ?? -1) as number;
        if (study.studyIndex > current) {
          tx.update(inviteeRef, { currentStudyIndex: study.studyIndex });
        }
      }
    });
  }, []);
}
