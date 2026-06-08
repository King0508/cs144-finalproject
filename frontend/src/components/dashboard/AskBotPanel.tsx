import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAiAsk } from "../../hooks/mutations/useAiAsk";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { TextInput } from "../ui/Field";

const SUGGESTED = [
  "How many Light and Darkness studies are happening this week and what are their names?",
  "Which invitees finished a study in the last 2 weeks?",
  "Who is leading the most studies this month?",
];

export function AskBotPanel() {
  const [question, setQuestion] = useState("");
  const { ask, busy, answer, tools, error } = useAiAsk();

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    void ask(trimmed);
  }

  return (
    <section aria-labelledby="askbot-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-2 border-b border-line pb-4">
        <p className="eyebrow inline-flex items-center gap-2">
          <Icon icon={Sparkles} size="xs" />
          Intelligence
        </p>
        <h2 id="askbot-heading" className="display-sm">
          Ask MinistryBot
        </h2>
        <p className="caption">
          Powered by Gemini 2.5 Flash. Only answers about data you have permission to see.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="askbot-input" className="sr-only">
            Ask a question about your ministry's bible studies
          </label>
          <TextInput
            id="askbot-input"
            type="text"
            placeholder="Ask anything about your studies…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={busy || !question.trim()}
          aria-busy={busy}
        >
          {busy ? "Thinking" : "Ask"}
        </Button>
      </form>

      <ul className="mt-5 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="inline-flex items-center border border-line-strong px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setQuestion(s);
                submit(s);
              }}
              disabled={busy}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-ink">
          {error}
        </p>
      ) : null}

      {answer ? (
        <article className="mt-6 border border-line bg-bg p-5">
          <p className="whitespace-pre-wrap body text-ink">{answer}</p>
          {tools.length > 0 ? (
            <p className="caption mt-3 border-t border-line pt-3">Used: {tools.join(", ")}</p>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
