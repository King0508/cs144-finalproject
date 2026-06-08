import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
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

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return result.user;
}

export async function signOutCurrent(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}
