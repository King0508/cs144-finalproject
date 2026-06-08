import { useState } from "react";
import { api } from "../../store/api";
import type { NextStudyResponse } from "../../types/api";

export interface UseNextStudySuggestionResult {
  suggest: (inviteeId: string) => Promise<void>;
  busy: boolean;
  result: NextStudyResponse | null;
  error: string | null;
}

export function useNextStudySuggestion(): UseNextStudySuggestionResult {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<NextStudyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function suggest(inviteeId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await api.aiNextStudy(inviteeId);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setBusy(false);
    }
  }

  return { suggest, busy, result, error };
}
