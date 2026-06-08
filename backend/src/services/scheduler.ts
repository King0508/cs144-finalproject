import { db, messaging } from "../firebase.js";

/**
 * Background loop that fires reminder pushes 15 (configurable) minutes before
 * each scheduled study. Idempotent: marks `studies/{id}.reminderSent=true`
 * after sending so duplicate ticks (from multiple replicas) don't double-fire.
 *
 * For multi-replica safety we still rely on the `reminderSent` flag — the
 * first replica to flip it wins. Firestore single-doc writes are atomic so
 * this is safe without a leader-election dance.
 */
export function startScheduler(opts?: { intervalMs?: number; leadMinutes?: number }): () => void {
  if (process.env.DISABLE_SCHEDULER === "true") {
    console.info("[scheduler] disabled via DISABLE_SCHEDULER=true");
    return () => undefined;
  }
  const intervalMs = opts?.intervalMs ?? Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000);
  const leadMinutes = opts?.leadMinutes ?? Number(process.env.REMINDER_LEAD_MINUTES ?? 15);
  console.info(`[scheduler] tick every ${intervalMs}ms · lead ${leadMinutes}min`);

  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      await runOnce(leadMinutes);
    } catch (err) {
      console.error("[scheduler] tick failed", err);
    }
  };

  void tick();
  const handle = setInterval(tick, intervalMs);
  return () => {
    stopped = true;
    clearInterval(handle);
  };
}

async function runOnce(leadMinutes: number): Promise<void> {
  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + leadMinutes * 60_000;

  const snap = await db()
    .collection("studies")
    .where("status", "==", "scheduled")
    .where("scheduledAt", ">=", windowStart)
    .where("scheduledAt", "<", windowEnd)
    .get();

  for (const doc of snap.docs) {
    const s = doc.data() as {
      reminderSent?: boolean;
      bibleTalkId: string;
      inviteeName: string;
      studyName: string;
      scheduledAt: number;
      leadUid: string;
      supportUids?: string[];
      location?: string;
    };
    if (s.reminderSent) continue;

    // Collect FCM tokens for the lead + supports.
    const uids = [s.leadUid, ...(s.supportUids ?? [])];
    const userDocs = await db().getAll(...uids.map((u) => db().collection("users").doc(u)));
    const tokens: string[] = [];
    for (const u of userDocs) {
      const data = u.data() as { fcmTokens?: string[] } | undefined;
      if (data?.fcmTokens) tokens.push(...data.fcmTokens);
    }
    const unique = Array.from(new Set(tokens));

    if (unique.length > 0) {
      try {
        await messaging().sendEachForMulticast({
          tokens: unique,
          notification: {
            title: `Bible study in ${leadMinutes} minutes`,
            body: `${s.studyName} with ${s.inviteeName}${s.location ? ` · ${s.location}` : ""}`,
          },
          data: { url: "/calendar", studyId: doc.id, kind: "reminder" },
          webpush: { fcmOptions: { link: "/calendar" } },
        });
      } catch (err) {
        console.warn("[scheduler] push failed for study", doc.id, err);
      }
    }

    // Mark even if there were no tokens, so we don't churn on it forever.
    await doc.ref.update({ reminderSent: true });
  }
}
