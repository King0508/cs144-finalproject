import { getFirebaseAuth } from "./firebase";

export interface ServerEvent {
  type: "notification" | "reminder";
  title?: string;
  body?: string;
  url?: string;
  studyId?: string;
}

/**
 * Subscribe to the backend Server-Sent Events stream (`/api/stream`). This is
 * the foreground counterpart to Web Push: while the tab is open the server can
 * deliver events live with no polling. Returns an unsubscribe function and
 * auto-reconnects with a freshly-minted Firebase ID token on error (since
 * EventSource cannot send an Authorization header, the token rides the query
 * string and is re-issued on every reconnect).
 */
export function subscribeServerEvents(onEvent: (event: ServerEvent) => void): () => void {
  let stopped = false;
  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleReconnect() {
    if (stopped || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, 5_000);
  }

  async function connect() {
    if (stopped) return;
    const user = getFirebaseAuth().currentUser;
    if (!user || typeof EventSource === "undefined") return;

    let token: string;
    try {
      token = await user.getIdToken();
    } catch {
      scheduleReconnect();
      return;
    }
    if (stopped) return;

    source = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);

    const forward = (type: ServerEvent["type"]) =>
      ((ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as Omit<ServerEvent, "type">;
          onEvent({ type, ...data });
        } catch {
          /* ignore malformed frame */
        }
      }) as EventListener;

    source.addEventListener("notification", forward("notification"));
    source.addEventListener("reminder", forward("reminder"));
    source.onerror = () => {
      source?.close();
      source = null;
      scheduleReconnect();
    };
  }

  void connect();

  return () => {
    stopped = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    source?.close();
    source = null;
  };
}
