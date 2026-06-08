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
      setMessage(`Sent to ${res.delivered} device${res.delivered === 1 ? "" : "s"}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return { send, busy, message };
}
