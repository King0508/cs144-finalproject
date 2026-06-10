import type { NextFunction, Request, Response } from "express";
import { auth, db } from "../firebase.js";

export interface AuthedRequest extends Request {
  authUser?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: "member" | "btLeader" | "ministryLeader";
    campusId?: string;
    bibleTalkId?: string;
  };
}

/**
 * Verifies an `Authorization: Bearer <Firebase ID token>` header, then loads
 * the matching `users/{uid}` doc so downstream handlers know the caller's
 * role-scoped visibility. Returns 401 if the token is missing / invalid,
 * and 403 if the user doc is missing (account not provisioned).
 *
 * No cookies are involved — every API call must present a fresh Bearer token.
 * Because there is no ambient credential, classic CSRF does not apply to this
 * API surface (see REQUIREMENTS.md).
 */
export async function verifyFirebaseToken(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header." });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Empty bearer token." });
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
      role?: "member" | "btLeader" | "ministryLeader";
      campusId?: string;
      bibleTalkId?: string;
      name?: string;
      displayName?: string;
    };
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: data.displayName ?? data.name ?? decoded.name ?? null,
      role: data.role ?? "member",
      campusId: data.campusId,
      bibleTalkId: data.bibleTalkId,
    };
    next();
  } catch (err) {
    console.warn("[auth] token verification failed", err);
    res.status(401).json({ error: "Invalid token." });
  }
}

/** Tighten an endpoint to ministry leaders only. */
export function requireMinistryLeader(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.authUser?.role !== "ministryLeader") {
    res.status(403).json({ error: "Ministry-leader role required." });
    return;
  }
  next();
}
