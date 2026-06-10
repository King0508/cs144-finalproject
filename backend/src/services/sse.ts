import type { Response } from "express";

/**
 * In-process Server-Sent Events hub. This is the project's second
 * server-initiated notification channel (alongside Firebase Cloud Messaging
 * Web Push): the backend can `broadcast()` an event and every connected browser
 * receives it over a long-lived `text/event-stream` response, with no client
 * polling.
 *
 * Events are role-scoped so a member never receives an event outside their
 * bible talk. The hub is per-replica; for the class demo that is fine, and the
 * Web Push path already covers cross-replica delivery for backgrounded clients.
 */

export type Role = "member" | "btLeader" | "ministryLeader";

export interface SseUser {
  uid: string;
  role: Role;
  campusId?: string;
  bibleTalkId?: string;
}

export interface SseEvent {
  type: string;
  payload: unknown;
  /** Optional role-scope hints so out-of-scope clients are skipped. */
  campusId?: string;
  bibleTalkId?: string;
}

interface SseClient {
  res: Response;
  user: SseUser;
}

const clients = new Set<SseClient>();
const HEARTBEAT_MS = 25_000;

/** Register a verified client and start streaming. Returns nothing; cleanup is
 * wired to the response `close` event. */
export function addClient(res: Response, user: SseUser): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Disable proxy buffering so events flush immediately through nginx.
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);

  const client: SseClient = { res, user };
  clients.add(client);

  const heartbeat = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, HEARTBEAT_MS);

  res.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
    res.end();
  });
}

/** Push an event to every in-scope connected client. Returns the delivery count. */
export function broadcast(event: SseEvent): number {
  const frame = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
  let delivered = 0;
  for (const client of clients) {
    if (!inScope(client.user, event)) continue;
    client.res.write(frame);
    delivered += 1;
  }
  return delivered;
}

export function clientCount(): number {
  return clients.size;
}

function inScope(user: SseUser, event: SseEvent): boolean {
  if (user.role === "ministryLeader") return true;
  if (event.campusId && user.role === "btLeader") return user.campusId === event.campusId;
  if (event.bibleTalkId) return user.bibleTalkId === event.bibleTalkId;
  // Unscoped events (e.g. the ML "test push") reach every connected client.
  return true;
}
