import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { watchAuth } from "../../store/firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsub = watchAuth((user) => setState({ user, loading: false }));
    return unsub;
  }, []);

  return state;
}
