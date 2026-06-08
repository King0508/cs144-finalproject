/**
 * Wipes the entire `users` collection.
 *
 * Use this after re-seeding when existing user docs reference bibleTalk IDs
 * that no longer exist. On next sign-in, useUserDoc lazily re-creates a fresh
 * stub with no bibleTalkId / campusId / gender, which trips App's
 * `needsOnboarding` check and walks the user through onboarding into one of
 * the newly-seeded bible talks.
 *
 * Does NOT delete the Firebase Auth user — that lives in the Auth service,
 * not Firestore. Your Google account can sign back in unchanged.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project \
 *   npm -w backend run reset-users
 */
import "dotenv/config";
import { db } from "../src/firebase.js";

async function main() {
  console.info(`[resetUsers] writing to project ${process.env.FIREBASE_PROJECT_ID}`);
  const snap = await db().collection("users").get();
  console.info(`[resetUsers] deleting ${snap.size} user docs…`);
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = db().batch();
    for (const d of snap.docs.slice(i, i + 400)) b.delete(d.ref);
    await b.commit();
  }
  console.info("[resetUsers] done. Sign in again to re-create your user doc and re-onboard.");
}

main().catch((e) => {
  console.error("[resetUsers] failed", e);
  process.exit(1);
});
