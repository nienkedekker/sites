"use client";

import { useAuth } from "@/providers/auth-provider";
import { ReactNode, ReactElement } from "react";

interface IsLoggedInProps {
  children: ReactNode;
  fallback?: ReactNode;
}

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
