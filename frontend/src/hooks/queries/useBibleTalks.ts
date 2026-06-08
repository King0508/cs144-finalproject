import { useEffect, useState } from "react";
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { BibleTalk, UserDoc } from "../../types/domain";

export interface UseBibleTalksResult {
  bibleTalks: BibleTalk[];
  loading: boolean;
}

/**
 * Subscribes to the bible talks the current user is allowed to see, based on
 * role. Firestore rules enforce the same scoping server-side; this just queries
 * efficiently:
 *   - ministryLeader: every bible talk
 *   - btLeader:       all bible talks on their campus
 *   - member:         just their own bible talk
 */
export function useBibleTalks(user: UserDoc | null): UseBibleTalksResult {
  const [bibleTalks, setBibleTalks] = useState<BibleTalk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBibleTalks([]);
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    const constraints: QueryConstraint[] = [];

    if (user.role === "member") {
      if (!user.bibleTalkId) {
        setBibleTalks([]);
        setLoading(false);
        return;
      }
      constraints.push(where(documentId(), "==", user.bibleTalkId));
    } else if (user.role === "btLeader") {
      if (!user.campusId) {
        setBibleTalks([]);
        setLoading(false);
        return;
      }
      constraints.push(where("campusId", "==", user.campusId));
    }
    // ministryLeader: no constraint — see everything.

    const q = query(collection(db, "bibleTalks"), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BibleTalk, "id">),
        }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        setBibleTalks(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useBibleTalks] snapshot error", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  return { bibleTalks, loading };
}
