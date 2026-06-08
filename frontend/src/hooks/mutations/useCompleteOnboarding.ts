import { useCallback, useState } from "react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";

export interface UseCompleteOnboardingResult {
  complete: (input: { uid: string; campusId: string; bibleTalkId: string }) => Promise<void>;
  busy: boolean;
  error: string | null;
}

export function useCompleteOnboarding(): UseCompleteOnboardingResult {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(
    async ({ uid, campusId, bibleTalkId }: { uid: string; campusId: string; bibleTalkId: string }) => {
      setBusy(true);
      setError(null);
      try {
        if (!campusId || !bibleTalkId) {
          throw new Error("Pick a campus and bible talk to continue.");
        }
        const { db } = getFirebase();
        await updateDoc(doc(db, "users", uid), { campusId, bibleTalkId });
        await updateDoc(doc(db, "bibleTalks", bibleTalkId), {
          memberIds: arrayUnion(uid),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { complete, busy, error };
}
