import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { completeRedirectSignIn, watchAuth } from "../../store/firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    // Resolve any pending redirect sign-in (popup fallback) before/as we start
    // listening, so onAuthStateChanged emits the signed-in user on return.
    void completeRedirectSignIn();
    const unsub = watchAuth((user) => setState({ user, loading: false }));
    return unsub;
  }, []);

  return state;
}
