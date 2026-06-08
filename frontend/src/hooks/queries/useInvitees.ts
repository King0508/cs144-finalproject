import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type QueryConstraint } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Invitee, UserDoc } from "../../types/domain";

export interface UseInviteesResult {
  invitees: Invitee[];
  loading: boolean;
}

export function useInvitees(user: UserDoc | null): UseInviteesResult {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInvitees([]);
      setLoading(false);
      return;
    }
    const { db } = getFirebase();
    const constraints: QueryConstraint[] = [];
    if (user.role === "member") {
      if (!user.bibleTalkId) {
        setInvitees([]);
        setLoading(false);
        return;
      }
      constraints.push(where("bibleTalkId", "==", user.bibleTalkId));
    } else if (user.role === "btLeader") {
      if (!user.campusId) {
        setInvitees([]);
        setLoading(false);
        return;
      }
      constraints.push(where("campusId", "==", user.campusId));
    }
    const q = query(collection(db, "invitees"), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invitee, "id">) }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        setInvitees(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useInvitees] snapshot error", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  return { invitees, loading };
}
