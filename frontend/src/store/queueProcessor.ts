import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { QueuedWrite } from "./offlineQueue";

/**
 * Single processor that knows how to drain every offline-queued write type.
 * Add a new case here when you introduce a new offline-capable action.
 */
export async function processQueuedWrite(item: QueuedWrite): Promise<void> {
  const { db } = getFirebase();

  switch (item.type) {
    case "chat.send": {
      const p = item.payload as {
        bibleTalkId: string;
        text: string;
        authorUid: string;
        authorName: string;
      };
      await addDoc(collection(db, "messages", p.bibleTalkId, "items"), {
        authorUid: p.authorUid,
        authorName: p.authorName,
        text: p.text,
        createdAt: serverTimestamp(),
      });
      return;
    }

    case "study.update": {
      const p = item.payload as { studyId: string; patch: Record<string, unknown> };
      await updateDoc(doc(db, "studies", p.studyId), p.patch);
      return;
    }

    default:
      console.warn("[queueProcessor] unknown queued write type", item.type);
  }
}
