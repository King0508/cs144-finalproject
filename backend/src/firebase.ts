import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null = null;

/**
 * Initialises the Firebase Admin SDK. Credentials are resolved in this order:
 *   1. `GOOGLE_APPLICATION_CREDENTIALS` env var pointing at a JSON file
 *      (used in dev and on GKE via a mounted Kubernetes Secret).
 *   2. Application Default Credentials (used by workload identity on GKE if
 *      we wire that up instead of a key file — see SETUP.md).
 *
 * Idempotent — safe to call repeatedly.
 */
export function getApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID env var is required.");
  }
  app = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  return app;
}

export function db(): Firestore {
  return getFirestore(getApp());
}

export function messaging(): Messaging {
  return getMessaging(getApp());
}

export function auth(): Auth {
  return getAuth(getApp());
}
