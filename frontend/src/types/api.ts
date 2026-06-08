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
  delivered: number;
}

export interface DevSetRoleResponse {
  ok: true;
  role: Role;
}
