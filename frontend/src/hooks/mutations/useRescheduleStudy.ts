import { useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import { enqueue } from "../../store/offlineQueue";

/**
 * Persists a new `scheduledAt` for the given study. Falls back to the offline
 * queue when the network is unreachable so the user's intent isn't lost.
 */
export function useRescheduleStudy(): (studyId: string, newScheduledAt: number) => Promise<void> {
  return useCallback(async (studyId: string, newScheduledAt: number) => {
    const patch = { scheduledAt: newScheduledAt };
    if (!navigator.onLine) {
      await enqueue("study.update", { studyId, patch });
      return;
    }
    try {
      const { db } = getFirebase();
      await updateDoc(doc(db, "studies", studyId), patch);
    } catch (err) {
      console.warn("[useRescheduleStudy] update failed, queueing", err);
      await enqueue("study.update", { studyId, patch });
    }
  }, []);
}
