"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { ThemeSwitcher } from "@/components/features/theme-switcher";
import { useAuth } from "@/providers/auth-provider";

export function AuthHeader() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-4 sm:gap-6 ${isLoggedIn ? "" : "ml-auto"}`}
    >
      {isLoggedIn ? (
        <>
          <Link
            href="/create"
            className="font-medium hover:underline underline-offset-4"
          >
            Create
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/sign-in"
          className="font-medium hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      )}
      <ThemeSwitcher />
    </div>
  );
}
