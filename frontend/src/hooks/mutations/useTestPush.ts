import { useState } from "react";
import { api } from "../../store/api";

export interface UseTestPushResult {
  send: () => Promise<void>;
  busy: boolean;
  message: string | null;
}

export function useTestPush(): UseTestPushResult {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.sendTestPush();
      const live = res.streamed ?? 0;
      const push = res.delivered;
      setMessage(
        `Server notification sent — ${live} live (SSE), ${push} via Web Push.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return { send, busy, message };
}
