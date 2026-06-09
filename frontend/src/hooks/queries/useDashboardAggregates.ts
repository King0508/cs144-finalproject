import { useMemo } from "react";
import type { BibleTalk, Campus, Invitee, Study } from "../../types/domain";

export interface GenderBarRow {
  id: string;
  name: string;
  m: number;
  f: number;
  total: number;
}

export interface DashboardAggregates {
  campusRows: GenderBarRow[];
  bibleTalkRows: GenderBarRow[];
  studyRows: GenderBarRow[];
  needsFollowUp: Invitee[];
}

interface UseDashboardAggregatesInput {
  studies: Study[];
  invitees: Invitee[];
  bibleTalks: BibleTalk[];
  campuses: Campus[];
}

/**
 * Pure derivations from the Dashboard's four live collections. Each
 * downstream chart can pick the slice it needs without re-deriving on its own.
 */
export function useDashboardAggregates({
  studies,
  invitees,
  bibleTalks,
  campuses,
}: UseDashboardAggregatesInput): DashboardAggregates {
  const campusRows = useMemo<GenderBarRow[]>(() => {
    const byId = new Map<string, { id: string; name: string; m: number; f: number }>();
    for (const c of campuses) {
      byId.set(c.id, { id: c.id, name: c.name, m: 0, f: 0 });
    }
    for (const s of studies) {
      let row = byId.get(s.campusId);
      if (!row) {
        // Mirrors bibleTalkRows: if a study references a campus we don't
        // have in scope, surface it under the raw id rather than dropping.
        row = { id: s.campusId, name: s.campusId, m: 0, f: 0 };
        byId.set(s.campusId, row);
      }
      if (s.gender === "M") row.m += 1;
      else row.f += 1;
    }
    return Array.from(byId.values())
      .map((r) => ({ ...r, total: r.m + r.f }))
      .sort((a, b) => b.total - a.total);
  }, [campuses, studies]);

  const bibleTalkRows = useMemo<GenderBarRow[]>(() => {
    const byId = new Map<string, { id: string; name: string; m: number; f: number }>();
    for (const bt of bibleTalks) {
      byId.set(bt.id, { id: bt.id, name: bt.name, m: 0, f: 0 });
    }
    for (const s of studies) {
      let row = byId.get(s.bibleTalkId);
      if (!row) {
        // Study refers to a bible talk we don't have in scope (e.g. for a
        // member who only sees their own). Track it under its raw id so the
        // count isn't silently dropped.
        row = { id: s.bibleTalkId, name: s.bibleTalkId, m: 0, f: 0 };
        byId.set(s.bibleTalkId, row);
      }
      if (s.gender === "M") row.m += 1;
      else row.f += 1;
    }
    return Array.from(byId.values())
      .map((r) => ({ ...r, total: r.m + r.f }))
      .sort((a, b) => b.total - a.total);
  }, [bibleTalks, studies]);

  const studyRows = useMemo<GenderBarRow[]>(() => {
    const byName = new Map<string, { id: string; name: string; m: number; f: number }>();
    for (const s of studies) {
      let row = byName.get(s.studyName);
      if (!row) {
        row = { id: s.studyName, name: s.studyName, m: 0, f: 0 };
        byName.set(s.studyName, row);
      }
      if (s.gender === "M") row.m += 1;
      else row.f += 1;
    }
    return Array.from(byName.values())
      .map((r) => ({ ...r, total: r.m + r.f }))
      .sort((a, b) => b.total - a.total);
  }, [studies]);

  const needsFollowUp = useMemo(() => {
    // Invitees who completed a study in the last 21 days and have no future scheduled study.
    const cutoff = Date.now() - 21 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return invitees.filter((inv) => {
      const hasFuture = studies.some(
        (s) => s.inviteeId === inv.id && s.scheduledAt >= now && s.status !== "cancelled",
      );
      if (hasFuture) return false;
      const lastCompleted = studies
        .filter((s) => s.inviteeId === inv.id && s.status === "completed")
        .sort((a, b) => b.scheduledAt - a.scheduledAt)[0];
      if (!lastCompleted) return false;
      return lastCompleted.scheduledAt >= cutoff && inv.currentStudyIndex < 7;
    });
  }, [invitees, studies]);

  return { campusRows, bibleTalkRows, studyRows, needsFollowUp };
}
