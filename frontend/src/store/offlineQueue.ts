import { get, set } from "idb-keyval";

/**
 * Tiny IndexedDB-backed queue for writes attempted while offline. When the
 * browser regains connectivity the queue is flushed via processor() and each
 * pending write is retried in FIFO order.
 *
 * The queue is intentionally generic: it stores serialisable "intents" with a
 * `type` discriminator (e.g. "chat.send", "study.update") so the same
 * mechanism handles any offline write the UI wants to queue.
 */
const KEY = "ministry.offline.queue.v1";

export interface QueuedWrite {
  id: string;
  type: string;
  payload: unknown;
  enqueuedAt: number;
  attempts: number;
}

export async function readQueue(): Promise<QueuedWrite[]> {
  const items = (await get<QueuedWrite[]>(KEY)) || [];
  return items;
}

async function writeQueue(items: QueuedWrite[]): Promise<void> {
  await set(KEY, items);
}

export async function enqueue(type: string, payload: unknown): Promise<QueuedWrite> {
  const items = await readQueue();
  const item: QueuedWrite = {
    id: crypto.randomUUID(),
    type,
    payload,
    enqueuedAt: Date.now(),
    attempts: 0,
  };
  items.push(item);
  await writeQueue(items);
  return item;
}

export async function clearQueue(): Promise<void> {
  await writeQueue([]);
}

export type QueueProcessor = (item: QueuedWrite) => Promise<void>;

export async function flushQueue(processor: QueueProcessor): Promise<{ flushed: number; failed: number }> {
  const items = await readQueue();
  const remaining: QueuedWrite[] = [];
  let flushed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await processor(item);
      flushed += 1;
    } catch (err) {
      console.warn("[offlineQueue] item failed, will retry", item.type, err);
      failed += 1;
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  await writeQueue(remaining);
  return { flushed, failed };
}

/**
 * Installs an `online` event listener that runs the processor whenever
 * connectivity returns. Returns an unsubscribe function.
 */
export function installAutoFlush(processor: QueueProcessor): () => void {
  const handler = () => {
    void flushQueue(processor);
  };
  window.addEventListener("online", handler);
  // Also try once on install, in case we're already online.
  if (navigator.onLine) void flushQueue(processor);
  return () => window.removeEventListener("online", handler);
}
