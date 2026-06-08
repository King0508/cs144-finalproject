import { useState } from "react";
import { api } from "../../store/api";

export interface UseAiAskResult {
  ask: (question: string) => Promise<void>;
  busy: boolean;
  answer: string | null;
  tools: string[];
  error: string | null;
}

export function useAiAsk(): UseAiAskResult {
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string): Promise<void> {
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await api.aiAsk(question);
      setAnswer(res.answer);
      setTools(res.usedTools);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ask failed.");
    } finally {
      setBusy(false);
    }
  }

  return { ask, busy, answer, tools, error };
}
