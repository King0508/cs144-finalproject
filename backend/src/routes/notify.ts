import { Router } from "express";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, messaging } from "../firebase.js";
import { requireMinistryLeader, type AuthedRequest } from "../middleware/verifyFirebaseToken.js";

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
    const snap = await db().collection("users").get();
    const tokens: string[] = [];
    snap.forEach((d) => {
      const data = d.data() as { fcmTokens?: string[] };
      if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
    });
    const unique = Array.from(new Set(tokens));
    if (unique.length === 0) {
      res.json({ ok: true, delivered: 0 });
      return;
    }
    const triggeredBy = req.authUser!.email ?? req.authUser!.uid;
    const result = await messaging().sendEachForMulticast({
      tokens: unique,
      notification: {
        title: "Campus Ministry — test push",
        body: `Server push sent by ${triggeredBy}.`,
      },
      data: { url: "/dashboard", kind: "test" },
      webpush: {
        fcmOptions: { link: "/dashboard" },
      },
    });
    res.json({ ok: true, delivered: result.successCount });
  } catch (err) {
    console.error("[notify/test]", err);
    res.status(500).json({ error: "Send failed." });
  }
});

export default router;
