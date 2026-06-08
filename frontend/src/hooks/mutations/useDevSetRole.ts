import { useState } from "react";
import { api } from "../../store/api";
import type { Role } from "../../types/domain";

export interface DevSetRoleMessage {
  kind: "ok" | "err";
  text: string;
}

export interface UseDevSetRoleResult {
  setRole: (role: Role) => Promise<void>;
  busy: boolean;
  message: DevSetRoleMessage | null;
}

export function useDevSetRole(): UseDevSetRoleResult {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<DevSetRoleMessage | null>(null);

  async function setRole(role: Role): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      await api.devSetRole(role);
      setMessage({
        kind: "ok",
        text: `Role updated to ${role}. Refresh to re-scope queries.`,
      });
    } catch (err) {
      setMessage({
        kind: "err",
        text:
          err instanceof Error
            ? `${err.message} — make sure the backend dev server is running and NODE_ENV is not "production".`
            : "Role update failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return { setRole, busy, message };
}
