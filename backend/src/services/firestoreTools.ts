import { db } from "../firebase.js";
import type { Query } from "firebase-admin/firestore";

/**
 * "Tools" the AskBot can call via Gemini function-calling. Each tool runs a
 * Firestore query that is FORCIBLY scoped to the caller's role. Gemini can
 * never widen visibility — even if it asks for `campusId: "*"`, the role
 * scope clamps it down.
 */
export interface Scope {
  role: "member" | "btLeader" | "ministryLeader";
  campusId?: string;
  bibleTalkId?: string;
}

export interface StudyFilters {
  studyName?: string;
  weekOf?: string;            // YYYY-MM-DD (Monday of the desired week)
  campusId?: string;
  bibleTalkId?: string;
  gender?: "M" | "F";
  status?: "scheduled" | "completed" | "cancelled";
}

function clampScope(filters: StudyFilters, scope: Scope): StudyFilters {
  const out = { ...filters };
  if (scope.role === "member") {
    if (!scope.bibleTalkId) {
      throw new Error("Member has no bibleTalkId — cannot scope queries.");
    }
    out.bibleTalkId = scope.bibleTalkId;
    delete out.campusId;
  } else if (scope.role === "btLeader") {
    if (!scope.campusId) {
      throw new Error("BT leader has no campusId — cannot scope queries.");
    }
    out.campusId = scope.campusId;
    // BT leader can ask about any BT on their campus, so we don't clamp bibleTalkId.
  }
  // ministryLeader: no clamping.
  return out;
}

function buildStudiesQuery(filters: StudyFilters) {
  let q: Query = db().collection("studies");
  if (filters.bibleTalkId) q = q.where("bibleTalkId", "==", filters.bibleTalkId);
  if (filters.campusId) q = q.where("campusId", "==", filters.campusId);
  if (filters.studyName) q = q.where("studyName", "==", filters.studyName);
  if (filters.gender) q = q.where("gender", "==", filters.gender);
  if (filters.status) q = q.where("status", "==", filters.status);
  if (filters.weekOf) {
    const start = new Date(filters.weekOf + "T00:00:00").getTime();
    if (!Number.isNaN(start)) {
      const end = start + 7 * 24 * 60 * 60 * 1000;
      q = q.where("scheduledAt", ">=", start).where("scheduledAt", "<", end);
    }
  }
  return q;
}

export const tools = {
  async listStudies(filters: StudyFilters, scope: Scope) {
    const clamped = clampScope(filters, scope);
    const snap = await buildStudiesQuery(clamped).limit(100).get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        inviteeName: data.inviteeName,
        studyName: data.studyName,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        gender: data.gender,
        leadName: data.leadName,
        location: data.location ?? null,
        status: data.status,
        campusId: data.campusId,
        bibleTalkId: data.bibleTalkId,
      };
    });
  },

  async countStudies(filters: StudyFilters, scope: Scope) {
    const clamped = clampScope(filters, scope);
    const snap = await buildStudiesQuery(clamped).count().get();
    return { count: snap.data().count };
  },

  async listInvitees(
    filters: { campusId?: string; bibleTalkId?: string; completedStudyIndex?: number },
    scope: Scope,
  ) {
    let q: Query = db().collection("invitees");
    if (scope.role === "member") {
      if (!scope.bibleTalkId) throw new Error("Member has no bibleTalkId.");
      q = q.where("bibleTalkId", "==", scope.bibleTalkId);
    } else if (scope.role === "btLeader") {
      if (!scope.campusId) throw new Error("BT leader has no campusId.");
      q = q.where("campusId", "==", scope.campusId);
    } else {
      if (filters.campusId) q = q.where("campusId", "==", filters.campusId);
      if (filters.bibleTalkId) q = q.where("bibleTalkId", "==", filters.bibleTalkId);
    }
    if (typeof filters.completedStudyIndex === "number") {
      q = q.where("currentStudyIndex", ">=", filters.completedStudyIndex);
    }
    const snap = await q.limit(200).get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        gender: data.gender,
        currentStudyIndex: data.currentStudyIndex,
        bibleTalkId: data.bibleTalkId,
        campusId: data.campusId,
      };
    });
  },
};

export type ToolName = keyof typeof tools;
