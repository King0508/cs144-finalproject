import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type QueryConstraint } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Study, UserDoc } from "../../types/domain";

export interface UseStudiesResult {
  studies: Study[];
  loading: boolean;
}

/**
 * Subscribes to the studies the current user is allowed to see, based on role.
 * Firestore security rules enforce the same scoping server-side; this hook
 * just queries efficiently rather than over-fetching and filtering client-side.
 */
export function useStudies(user: UserDoc | null): UseStudiesResult {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStudies([]);
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    const constraints: QueryConstraint[] = [];

    if (user.role === "member") {
      if (!user.bibleTalkId) {
        setStudies([]);
        setLoading(false);
        return;
      }
      constraints.push(where("bibleTalkId", "==", user.bibleTalkId));
    } else if (user.role === "btLeader") {
      if (!user.campusId) {
        setStudies([]);
        setLoading(false);
        return;
      }
      constraints.push(where("campusId", "==", user.campusId));
    }
    // ministryLeader: no constraint — see everything.

    const q = query(collection(db, "studies"), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Study, "id">) }));
        items.sort((a, b) => a.scheduledAt - b.scheduledAt);
        setStudies(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useStudies] snapshot error", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  return { studies, loading };
}
