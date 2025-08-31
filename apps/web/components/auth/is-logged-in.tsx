"use client";

import { useAuth } from "@/providers/auth-provider";
import { ReactNode } from "react";

export default function IsLoggedIn({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <>{fallback}</>;
  return isLoggedIn ? <>{children}</> : null;
}
