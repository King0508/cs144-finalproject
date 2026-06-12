import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Icon } from "../ui/Icon";
import type { ServerEvent } from "../../store/sse";

interface Toast extends ServerEvent {
  id: string;
}

const VISIBLE_MS = 8_000;

/**
 * Renders an in-app toast whenever the backend pushes a server-initiated event
 * over the SSE channel (App.tsx re-dispatches each one as a
 * `ministry:server-event` window event). This is the on-screen counterpart to
 * the OS notification: it is always visible regardless of the operating
 * system's Do-Not-Disturb / notification settings, which makes the
 * server-initiated push unambiguous in the recorded demo.
 */
export function ServerEventToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ServerEvent>).detail;
      if (!detail) return;
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, VISIBLE_MS);
    };
    window.addEventListener("ministry:server-event", handler as EventListener);
    return () => window.removeEventListener("ministry:server-event", handler as EventListener);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-line-strong bg-surface p-4 animate-fade-in-up"
        >
          <span className="mt-0.5 text-accent">
            <Icon icon={Bell} size="sm" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Server notification</p>
            <p className="font-medium text-ink">{toast.title ?? "Campus Ministry"}</p>
            {toast.body ? <p className="caption mt-0.5 break-words">{toast.body}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <Icon icon={X} size="xs" />
          </button>
        </article>
      ))}
    </div>
  );
}
