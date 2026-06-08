import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock idb-keyval with an in-memory store so we don't need a real IndexedDB.
const store = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: (k: string) => Promise.resolve(store.get(k)),
  set: (k: string, v: unknown) => {
    store.set(k, v);
    return Promise.resolve();
  },
}));

import {
  enqueue,
  readQueue,
  flushQueue,
  clearQueue,
} from "../store/offlineQueue";

describe("offlineQueue", () => {
  beforeEach(async () => {
    store.clear();
  });
  afterEach(async () => {
    await clearQueue();
  });

  it("enqueues writes and reads them back in FIFO order", async () => {
    await enqueue("chat.send", { text: "hi" });
    await enqueue("study.update", { studyId: "a" });
    const items = await readQueue();
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("chat.send");
    expect(items[1].type).toBe("study.update");
  });

  it("flushes all items when processor succeeds", async () => {
    await enqueue("chat.send", { text: "1" });
    await enqueue("chat.send", { text: "2" });
    const result = await flushQueue(async () => undefined);
    expect(result).toEqual({ flushed: 2, failed: 0 });
    expect(await readQueue()).toHaveLength(0);
  });

  it("retains failed items in the queue for retry", async () => {
    await enqueue("chat.send", { text: "ok" });
    await enqueue("chat.send", { text: "fail" });
    let i = 0;
    const result = await flushQueue(async () => {
      if (i++ === 1) throw new Error("nope");
    });
    expect(result.flushed).toBe(1);
    expect(result.failed).toBe(1);
    const remaining = await readQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].attempts).toBe(1);
  });
});
