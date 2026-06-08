import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { ChatMessage } from "../../types/domain";

interface RawChatDoc {
  authorUid: string;
  authorName: string;
  text: string;
  createdAt?: { toMillis?: () => number };
}

function decodeChatDoc(id: string, data: RawChatDoc): ChatMessage {
  return {
    id,
    authorUid: data.authorUid,
    authorName: data.authorName,
    text: data.text,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  };
}

/** Live-subscribes to the latest 200 messages in a bible-talk channel. */
export function useChatMessages(bibleTalkId: string | undefined): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!bibleTalkId) {
      setMessages([]);
      return;
    }
    const { db } = getFirebase();
    const q = query(
      collection(db, "messages", bibleTalkId, "items"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => decodeChatDoc(d.id, d.data() as RawChatDoc)));
    });
    return unsub;
  }, [bibleTalkId]);

  return messages;
}
