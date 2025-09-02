"use client";

import { useAuth } from "@/providers/auth-provider";
import { ReactNode } from "react";

interface IsLoggedInProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function IsLoggedIn({
  children,
  fallback = null,
}: IsLoggedInProps) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <>{fallback}</>;
  return isLoggedIn ? <>{children}</> : null;
}
