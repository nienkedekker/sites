"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/utils/supabase/browser";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  syncSession: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumped on every auth event, so a slow syncSession can't undo a later one
  const version = useRef(0);

  useEffect(() => {
    const { data } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        version.current++;
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // The browser client doesn't notice session cookies a server action set, and
  // getSession reads them without emitting an auth event
  const syncSession = useCallback(async () => {
    const seen = version.current;
    const { data } = await supabaseBrowser.auth.getSession();
    if (seen !== version.current) return;
    setUser(data.session?.user ?? null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoggedIn: !!user, loading, syncSession }),
    [user, loading, syncSession],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
