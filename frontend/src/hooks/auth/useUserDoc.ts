import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import type { UserDoc } from "../../types/domain";
import type { User } from "firebase/auth";

export interface UserDocState {
  userDoc: UserDoc | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to /users/{uid}. If the doc doesn't exist yet (first-time
 * sign-in) we lazily create a minimal record with role="member" so the user
 * can proceed to onboarding.
 */
export function useUserDoc(authUser: User | null): UserDocState {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!authUser) {
      setUserDoc(null);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    const { db } = getFirebase();
    const ref = doc(db, "users", authUser.uid);

    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          try {
            await setDoc(ref, {
              uid: authUser.uid,
              email: authUser.email ?? "",
              displayName: authUser.displayName ?? authUser.email ?? "Anonymous",
              photoURL: authUser.photoURL ?? null,
              role: "member",
              createdAt: serverTimestamp(),
              fcmTokens: [],
            });
          } catch (err) {
            console.error("[useUserDoc] failed to create stub user doc", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
          return;
        }
        const data = snap.data() as Omit<UserDoc, "uid">;
        setUserDoc({ ...data, uid: snap.id });
        setLoading(false);
      },
      (err) => {
        console.error("[useUserDoc] snapshot error", err);
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, [authUser]);

  return { userDoc, loading, error };
}
