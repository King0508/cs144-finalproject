import type { ChatMessage } from "../../types/domain";

interface MessageBubbleProps {
  message: ChatMessage;
  /** True when this message was authored by the current user. */
  mine: boolean;
}

export function MessageBubble({ message, mine }: MessageBubbleProps) {
  return (
    <article
      className={
        "max-w-[80%] px-4 py-3 text-[15px] leading-6 " +
        (mine
          ? "ml-auto bg-ink text-onInk"
          : "border border-line bg-surface text-ink")
      }
    >
      <p
        className={
          "mb-1 text-[10px] uppercase tracking-[0.18em] " +
          (mine ? "text-onInk/60" : "text-ink-faint")
        }
      >
        <span className="font-medium">{message.authorName}</span>
        <span aria-hidden="true"> · </span>
        <time dateTime={new Date(message.createdAt).toISOString()}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </p>
      <p className="whitespace-pre-wrap break-words">{message.text}</p>
    </article>
  );
}
