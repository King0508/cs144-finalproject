import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Icon } from "../ui/Icon";

interface ChatComposerProps {
  onSend: (text: string) => void | Promise<unknown>;
}

export function ChatComposer({ onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void onSend(text);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 border-t border-line bg-surface px-5 py-4"
    >
      <label htmlFor="chat-input" className="sr-only">
        Type a message
      </label>
      <input
        id="chat-input"
        type="text"
        className="flex-1 border-0 bg-transparent px-0 py-2 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0"
        placeholder="Write a message…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="grid h-10 w-10 shrink-0 place-items-center bg-ink text-onInk transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/20"
      >
        <Icon icon={ArrowUp} size="sm" />
      </button>
    </form>
  );
}
