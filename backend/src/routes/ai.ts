import { Router } from "express";
import { z } from "zod";
import { db } from "../firebase.js";
import { nextStudyName, CURRICULUM } from "../curriculum.js";
import { askGemini, generateFollowUpMessage, classifyGeminiError } from "../services/gemini.js";
import type { AuthedRequest } from "../middleware/verifyFirebaseToken.js";

const router: Router = Router();

const nextStudyBody = z.object({ inviteeId: z.string().min(1).max(120) });

router.post("/next-study", async (req: AuthedRequest, res) => {
  try {
    const parsed = nextStudyBody.parse(req.body);
    const snap = await db().collection("invitees").doc(parsed.inviteeId).get();
    if (!snap.exists) {
      res.status(404).json({ error: "Invitee not found." });
      return;
    }
    const data = snap.data() as {
      name: string;
      currentStudyIndex: number;
      bibleTalkId: string;
      campusId: string;
    };

    // Role-based access: members can only ask about invitees in their BT;
    // BT leaders within their campus; ministry leaders everywhere.
    const user = req.authUser!;
    if (user.role === "member" && data.bibleTalkId !== user.bibleTalkId) {
      res.status(403).json({ error: "Out of scope." });
      return;
    }
    if (user.role === "btLeader" && data.campusId !== user.campusId) {
      res.status(403).json({ error: "Out of scope." });
      return;
    }

    const next = nextStudyName(data.currentStudyIndex);
    if (!next) {
      res.json({ nextStudyName: null, suggestedMessage: null });
      return;
    }
    const completed = data.currentStudyIndex >= 0 ? CURRICULUM[data.currentStudyIndex] : null;

    const message = await generateFollowUpMessage({
      inviteeName: data.name,
      completedStudy: completed,
      nextStudy: next,
      leadName: user.displayName ?? user.email?.split("@")[0] ?? "your bible-talk leader",
    });

    res.json({ nextStudyName: next, suggestedMessage: message });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Bad request", details: err.flatten() });
      return;
    }
    console.error("[ai/next-study]", err);
    const { httpStatus, message } = classifyGeminiError(err);
    const details =
      process.env.NODE_ENV === "production"
        ? undefined
        : err instanceof Error
          ? err.message
          : String(err);
    res.status(httpStatus).json({ error: message, details });
  }
});

const askBody = z.object({ question: z.string().min(1).max(500) });

router.post("/ask", async (req: AuthedRequest, res) => {
  try {
    const parsed = askBody.parse(req.body);
    const user = req.authUser!;
    const result = await askGemini(parsed.question, {
      role: user.role,
      campusId: user.campusId,
      bibleTalkId: user.bibleTalkId,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Bad request", details: err.flatten() });
      return;
    }
    console.error("[ai/ask]", err);
    const { httpStatus, message } = classifyGeminiError(err);
    const details =
      process.env.NODE_ENV === "production"
        ? undefined
        : err instanceof Error
          ? err.message
          : String(err);
    res.status(httpStatus).json({ error: message, details });
  }
});

export default router;
