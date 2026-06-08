import { useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Invitee, Study } from "../../types/domain";

/**
 * Marks a study as completed and bumps the invitee's `currentStudyIndex` if
 * this study advances them further than they've been before.
 */
export function useCompleteStudy(invitees: Invitee[]): (study: Study) => Promise<void> {
  return useCallback(
    async (study: Study) => {
      const { db } = getFirebase();
      await updateDoc(doc(db, "studies", study.id), { status: "completed" });
      const invitee = invitees.find((i) => i.id === study.inviteeId);
      if (invitee && study.studyIndex > invitee.currentStudyIndex) {
        await updateDoc(doc(db, "invitees", study.inviteeId), {
          currentStudyIndex: study.studyIndex,
        });
      }
    },
    [invitees],
  );
}
