import { Router } from "express";
import { z } from "zod";
import { db } from "../firebase.js";
import type { AuthedRequest } from "../middleware/verifyFirebaseToken.js";

const router: Router = Router();

const roleBody = z.object({
  role: z.enum(["member", "btLeader", "ministryLeader"]),
});

/**
 * Dev-only role switcher used by the "Switch role" card in Settings.
 *
 * Bypasses the Firestore self-promotion ban by writing through the Admin SDK,
 * which ignores security rules. This route is only mounted when
 * NODE_ENV !== "production" — see server.ts. Production builds therefore
 * cannot reach it at all, so the Firestore rules remain the only authority on
 * role changes in real environments.
 *
 * The caller is identified by their verified Firebase ID token (see
 * verifyFirebaseToken middleware) — the body never carries a uid.
 */
router.post("/role", async (req: AuthedRequest, res) => {
  try {
    const { role } = roleBody.parse(req.body);
    const uid = req.authUser!.uid;
    await db().collection("users").doc(uid).update({ role });
    res.json({ ok: true, role });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Bad request: role must be one of member, btLeader, ministryLeader." });
      return;
    }
    console.error("[dev/role]", err);
    res.status(500).json({ error: "Role update failed." });
  }
});

export default router;
