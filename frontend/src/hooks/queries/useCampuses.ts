import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Campus } from "../../types/domain";

export interface UseCampusesResult {
  campuses: Campus[];
  loading: boolean;
}

export function useCampuses(): UseCampusesResult {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { db } = getFirebase();
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "campuses"));
        if (cancelled) return;
        setCampuses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campus, "id">) })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { campuses, loading };
}
