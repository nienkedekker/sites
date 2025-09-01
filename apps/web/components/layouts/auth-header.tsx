"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { useAuth } from "@/providers/auth-provider";

export function AuthHeader() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <div className="flex gap-2 items-center">
      {isLoggedIn ? (
        <>
          <Button asChild variant="link">
            <Link href="/create">Create</Link>
          </Button>
          <SignOutButton />
        </>
      ) : (
        <>
          <Button asChild variant="link">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </>
      )}
    </div>
  );
}
