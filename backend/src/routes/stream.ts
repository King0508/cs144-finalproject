import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../firebase.js";
import { addClient, type Role } from "../services/sse.js";

const router: Router = Router();

const tokenQuery = z.object({ token: z.string().min(20).max(4096) });

/**
 * GET /api/stream — opens a Server-Sent Events connection.
 *
 * The browser `EventSource` API cannot set an `Authorization` header, so the
 * Firebase ID token is passed as a query parameter and verified here with the
 * Admin SDK before the stream is opened. This route is mounted *before* the
 * global Bearer-token middleware in `server.ts` for exactly that reason.
 */
router.get("/", async (req, res) => {
  let token: string;
  try {
    token = tokenQuery.parse(req.query).token;
  } catch {
    res.status(400).json({ error: "Missing stream token." });
    return;
  }

  try {
    const decoded = await auth().verifyIdToken(token);
    const userSnap = await db().collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) {
      res.status(403).json({ error: "User not provisioned." });
      return;
    }
    const data = userSnap.data() as {
      role?: Role;
      campusId?: string;
      bibleTalkId?: string;
    };
    addClient(res, {
      uid: decoded.uid,
      role: data.role ?? "member",
      campusId: data.campusId,
      bibleTalkId: data.bibleTalkId,
    });
  } catch (err) {
    console.warn("[stream] token verification failed", err);
    res.status(401).json({ error: "Invalid token." });
  }
});

export default router;
