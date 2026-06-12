import { Router } from "express";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, messaging } from "../firebase.js";
import { requireMinistryLeader, type AuthedRequest } from "../middleware/verifyFirebaseToken.js";
import { broadcast } from "../services/sse.js";

const router: Router = Router();

const registerBody = z.object({ token: z.string().min(20).max(4096) });

/** The PWA calls this after FCM hands it a registration token. */
router.post("/register", async (req: AuthedRequest, res) => {
  try {
    const { token } = registerBody.parse(req.body);
    const uid = req.authUser!.uid;
    await db().collection("users").doc(uid).update({
      fcmTokens: FieldValue.arrayUnion(token),
    });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Bad request" });
      return;
    }
    console.error("[notify/register]", err);
    res.status(500).json({ error: "Register failed." });
  }
});

/**
 * Ministry-leader-only demo button: pushes a "hello from the server" to every
 * registered device. Used in the recorded demo to visibly trigger a server-
 * initiated notification.
 */
router.post("/test", requireMinistryLeader, async (req: AuthedRequest, res) => {
  try {
    const triggeredBy = req.authUser!.email ?? req.authUser!.uid;
    const title = "Campus Ministry — test push";
    const body = `Server push sent by ${triggeredBy}.`;

    // Broadcast over the SSE channel first, unconditionally. This is a
    // standalone server-initiated notification channel and must not depend on
    // whether any device has registered an FCM Web Push token.
    const streamed = broadcast({
      type: "notification",
      payload: { title, body, url: "/dashboard", kind: "test" },
    });

    // Best-effort Web Push to any registered devices (in addition to SSE).
    const snap = await db().collection("users").get();
    const tokens: string[] = [];
    snap.forEach((d) => {
      const data = d.data() as { fcmTokens?: string[] };
      if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
    });
    const unique = Array.from(new Set(tokens));
    let delivered = 0;
    if (unique.length > 0) {
      const result = await messaging().sendEachForMulticast({
        tokens: unique,
        notification: { title, body },
        data: { url: "/dashboard", kind: "test" },
        webpush: {
          fcmOptions: { link: "/dashboard" },
        },
      });
      delivered = result.successCount;
    }

    res.json({ ok: true, delivered, streamed });
  } catch (err) {
    console.error("[notify/test]", err);
    res.status(500).json({ error: "Send failed." });
  }
});

export default router;
