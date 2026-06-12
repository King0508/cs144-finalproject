import type { Role } from "./domain";

/** Response shapes returned by the backend Express API. */

export interface NextStudyResponse {
  nextStudyName: string | null;
  suggestedMessage: string | null;
}

export interface AskResponse {
  answer: string;
  usedTools: string[];
}

export interface RegisterFcmTokenResponse {
  ok: true;
}

export interface TestPushResponse {
  ok: true;
  /** Number of devices reached via Web Push (FCM). */
  delivered: number;
  /** Number of connected browsers reached live via the SSE channel. */
  streamed?: number;
}

export interface DevSetRoleResponse {
  ok: true;
  role: Role;
}
