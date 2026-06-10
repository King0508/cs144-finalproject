import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebase(): { app: FirebaseApp; db: Firestore } {
  if (!app) {
    if (!config.projectId) {
      throw new Error(
        "Missing Firebase config. Copy frontend/.env.example to frontend/.env.local and fill in your project's web config.",
      );
    }
    app = initializeApp(config);
    // Persistent local cache lets reads work offline and across tabs.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return { app, db: db! };
}

export function getFirebaseAuth() {
  return getAuth(getFirebase().app);
}

// Errors where a popup can't be used and we should fall back to a full-page
// redirect (common on browsers that block popups, or with strict COOP).
const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export async function signInWithGoogle(): Promise<User | void> {
  const provider = new GoogleAuthProvider();
  const auth = getFirebaseAuth();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (REDIRECT_FALLBACK_CODES.has(code)) {
      // Navigates away to Google and back; onAuthStateChanged resolves the
      // signed-in user on return (also surfaced via completeRedirectSignIn).
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

/**
 * Completes a redirect-based sign-in if one is pending. Safe to call on every
 * app load; returns the user when a redirect just completed, otherwise null.
 */
export async function completeRedirectSignIn(): Promise<User | null> {
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export async function signOutCurrent(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}
