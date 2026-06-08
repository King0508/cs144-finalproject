import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { Invitee } from "../../types/domain";

/** Live-subscribes to a single /invitees/{id} doc. */
export function useInvitee(inviteeId: string | undefined): Invitee | null {
  const [invitee, setInvitee] = useState<Invitee | null>(null);

  useEffect(() => {
    if (!inviteeId) {
      setInvitee(null);
      return;
    }
    const { db } = getFirebase();
    return onSnapshot(doc(db, "invitees", inviteeId), (snap) => {
      if (snap.exists()) setInvitee({ id: snap.id, ...(snap.data() as Omit<Invitee, "id">) });
      else setInvitee(null);
    });
  }, [inviteeId]);

  return invitee;
}
