import { getFirebaseAuth } from "./firebase";
import type {
  AskResponse,
  DevSetRoleResponse,
  NextStudyResponse,
  RegisterFcmTokenResponse,
  TestPushResponse,
} from "../types/api";
import type { Role } from "../types/domain";

/**
 * Thin client for the backend Express API. Always attaches the Firebase ID
 * token as a Bearer header so the backend can verify the caller via the Admin
 * SDK. No cookies are involved — auth is bearer-only.
 */
async function authHeader(): Promise<Record<string, string>> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
    ...(await authHeader()),
  };
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  aiNextStudy(inviteeId: string) {
    return request<NextStudyResponse>("/api/ai/next-study", {
      method: "POST",
      body: JSON.stringify({ inviteeId }),
    });
  },

  aiAsk(question: string) {
    return request<AskResponse>("/api/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },

  registerFcmToken(token: string) {
    return request<RegisterFcmTokenResponse>("/api/notify/register", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  sendTestPush() {
    return request<TestPushResponse>("/api/notify/test", {
      method: "POST",
    });
  },

  // Dev-only: flips the caller's role via the Admin SDK, bypassing the
  // Firestore self-promotion rule. The endpoint is only mounted on the backend
  // when NODE_ENV !== "production"; in prod builds calling this will 404.
  devSetRole(role: Role) {
    return request<DevSetRoleResponse>("/api/dev/role", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },
};
