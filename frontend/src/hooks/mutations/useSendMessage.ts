import { useCallback, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import { enqueue } from "../../store/offlineQueue";
import type { UserDoc } from "../../types/domain";

export interface UseSendMessageResult {
  send: (text: string) => Promise<boolean>;
  queuedCount: number;
}

/**
 * Sends a chat message to the user's bible-talk channel. Falls back to the
 * offline queue when the network is unreachable. Returns true if the message
 * went straight to Firestore, false if it was queued.
 */
export function useSendMessage(userDoc: UserDoc): UseSendMessageResult {
  const [queuedCount, setQueuedCount] = useState(0);

  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !userDoc.bibleTalkId) return false;
      const payload = {
        bibleTalkId: userDoc.bibleTalkId,
        text: trimmed,
        authorUid: userDoc.uid,
        authorName: userDoc.displayName,
      };
      if (!navigator.onLine) {
        await enqueue("chat.send", payload);
        setQueuedCount((n) => n + 1);
        return false;
      }
      try {
        const { db } = getFirebase();
        await addDoc(collection(db, "messages", userDoc.bibleTalkId, "items"), {
          authorUid: payload.authorUid,
          authorName: payload.authorName,
          text: payload.text,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        console.warn("[useSendMessage] send failed, queueing", err);
        await enqueue("chat.send", payload);
        setQueuedCount((n) => n + 1);
        return false;
      }
    },
    [userDoc.bibleTalkId, userDoc.uid, userDoc.displayName],
  );

  return { send, queuedCount };
}
