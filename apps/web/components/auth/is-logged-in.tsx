"use client";

import { useAuth } from "@/providers/auth-provider";
import { ReactNode, ReactElement } from "react";

interface IsLoggedInProps {
  /** Content to render when user is logged in */
  children: ReactNode;
  /** Content to render during loading state (defaults to null) */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children only when the user is authenticated.
 * Shows fallback during loading, nothing when logged out.
 */
export default function IsLoggedIn({
  children,
  fallback = null,
}: IsLoggedInProps): ReactElement | null {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  return isLoggedIn ? <>{children}</> : null;
}
