"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/utils/supabase/browser";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

/**
 * Provides authentication state to the app.
 * Handles initial auth check and subscribes to auth state changes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Initial auth check with error handling
    supabaseBrowser.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user ?? null);
      })
      .catch((error) => {
        console.error("Failed to get user:", error);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2) Subscribe to auth state changes
    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoggedIn: !!user, loading }),
    [user, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/**
 * Hook to access authentication state.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
