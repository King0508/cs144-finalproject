import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { BibleTalk } from "../../types/domain";

/** Fetches the bible talks at a given campus. Returns `[]` while no campus is selected. */
export function useBibleTalksByCampus(campusId: string | undefined | null): BibleTalk[] {
  const [bibleTalks, setBibleTalks] = useState<BibleTalk[]>([]);

  useEffect(() => {
    if (!campusId) {
      setBibleTalks([]);
      return;
    }
    let cancelled = false;
    const { db } = getFirebase();
    (async () => {
      const q = query(collection(db, "bibleTalks"), where("campusId", "==", campusId));
      const snap = await getDocs(q);
      if (cancelled) return;
      setBibleTalks(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BibleTalk, "id">) })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [campusId]);

  return bibleTalks;
}
