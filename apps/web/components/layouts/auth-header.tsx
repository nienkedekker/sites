"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { useAuth } from "@/providers/auth-provider";

export function AuthHeader() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <Link href="/create" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Create
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link href="/sign-in" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Sign in
        </Link>
      )}
    </>
  );
}
