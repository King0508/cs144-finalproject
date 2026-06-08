/**
 * Promotes (or demotes) a user to a given role by email.
 *
 * Uses the Firebase Admin SDK, which bypasses Firestore security rules. This
 * is the one place we sidestep the self-promotion ban in
 * firestore/firestore.rules — required to bootstrap the very first
 * ministryLeader. After that, an existing ministryLeader can flip any role
 * through the app itself (rules allow it).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project \
 *   npm -w backend run promote -- you@example.com [role]
 *
 *   role defaults to "ministryLeader". Allowed: member | btLeader | ministryLeader.
 *
 * The target user must have signed in to the app at least once so that
 * /users/{uid} exists. If it doesn't, this script prints a helpful error
 * instead of silently creating a half-populated doc.
 */
import "dotenv/config";
import { auth, db } from "../src/firebase.js";

type Role = "member" | "btLeader" | "ministryLeader";
const ROLES: readonly Role[] = ["member", "btLeader", "ministryLeader"] as const;

function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}

async function main() {
  const [emailArg, roleArg = "ministryLeader"] = process.argv.slice(2);

  if (!emailArg) {
    console.error("[promote] missing email argument.");
    console.error("  usage: npm -w backend run promote -- <email> [role]");
    console.error(`  role: one of ${ROLES.join(" | ")} (default: ministryLeader)`);
    process.exit(1);
  }
  if (!isRole(roleArg)) {
    console.error(`[promote] invalid role "${roleArg}". Allowed: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  console.info(`[promote] project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.info(`[promote] looking up Firebase Auth user by email: ${emailArg}`);

  let uid: string;
  try {
    const authUser = await auth().getUserByEmail(emailArg);
    uid = authUser.uid;
    console.info(`[promote] resolved uid: ${uid}`);
  } catch (err) {
    console.error(
      `[promote] no Firebase Auth user with that email. Ask them to sign in once first.`,
    );
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const ref = db().collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(
      `[promote] /users/${uid} does not exist yet. The user must sign into the app once so useUserDoc creates the stub, then re-run this script.`,
    );
    process.exit(1);
  }

  const before = snap.data() as { role?: Role; displayName?: string; email?: string };
  console.info(
    `[promote] before: ${before.displayName ?? before.email ?? uid} role=${before.role ?? "(unset)"}`,
  );

  if (before.role === roleArg) {
    console.info(`[promote] already ${roleArg}; nothing to do.`);
    return;
  }

  await ref.update({ role: roleArg });
  console.info(`[promote] after:  ${before.displayName ?? before.email ?? uid} role=${roleArg}`);
  console.info("[promote] done. Hard-refresh the app to pick up the new role.");
}

main().catch((err) => {
  console.error("[promote] failed", err);
  process.exit(1);
});
