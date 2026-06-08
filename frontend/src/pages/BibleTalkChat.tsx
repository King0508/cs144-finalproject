import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import type { UserDoc } from "../types/domain";
import { useChatMessages } from "../hooks/queries/useChatMessages";
import { useSendMessage } from "../hooks/mutations/useSendMessage";
import { MessageBubble } from "../components/chat/MessageBubble";
import { ChatComposer } from "../components/chat/ChatComposer";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";

interface BibleTalkChatProps {
  userDoc: UserDoc;
}

export function BibleTalkChat({ userDoc }: BibleTalkChatProps) {
  const messages = useChatMessages(userDoc.bibleTalkId);
  const { send, queuedCount } = useSendMessage(userDoc);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newest = messages[messages.length - 1];
    if (
      newest &&
      newest.id !== lastSeenIdRef.current &&
      newest.authorUid !== userDoc.uid &&
      liveRegionRef.current
    ) {
      liveRegionRef.current.textContent = `${newest.authorName}: ${newest.text}`;
    }
    lastSeenIdRef.current = newest?.id ?? null;
  }, [messages, userDoc.uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  if (!userDoc.bibleTalkId) {
    return (
      <div className="space-y-section">
        <PageHeader
          eyebrow="Chat"
          title="Bible Talk Chat"
          description={
            userDoc.role === "ministryLeader"
              ? "You're signed in as a ministry leader, so you aren't a member of a single bible talk. Use the Dashboard, Studies, or Calendar to see activity across every campus."
              : "Your account isn't linked to a bible talk yet. Open Settings or sign out and re-onboard to pick one."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-stack motion-safe:stagger-children">
      <PageHeader
        eyebrow="Today"
        title="Bible Talk Chat"
        description="Messages are visible only to members of your bible talk."
      />

      <Card padding="none" className="flex h-[calc(100vh-18rem)] flex-col md:h-[calc(100vh-16rem)]">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-ink-soft">
              <Icon icon={Lock} size="sm" />
            </span>
            <p className="eyebrow">Private to bible talk</p>
          </div>
          <p className="caption">{messages.length} messages</p>
        </header>

        <div
          ref={liveRegionRef}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-6"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            <p className="py-section text-center text-sm text-ink-faint">
              No messages yet. Say hello.
            </p>
          ) : null}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.authorUid === userDoc.uid} />
          ))}
        </div>

        <ChatComposer onSend={send} />

        {queuedCount > 0 ? (
          <p
            className="border-t border-line bg-bg px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-ink-soft"
            role="status"
            aria-live="polite"
          >
            {queuedCount} message{queuedCount === 1 ? "" : "s"} queued — sending when online.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
