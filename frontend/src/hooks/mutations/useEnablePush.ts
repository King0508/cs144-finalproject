import { useState } from "react";
import { enablePush } from "../../store/push";

export interface UseEnablePushResult {
  enable: () => Promise<void>;
  busy: boolean;
  message: string | null;
}

export function useEnablePush(): UseEnablePushResult {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function enable(): Promise<void> {
    setBusy(true);
    setMessage(null);
    const res = await enablePush();
    setMessage(res.ok ? "Notifications enabled." : `Couldn't enable: ${res.reason}`);
    setBusy(false);
  }

  return { enable, busy, message };
}
