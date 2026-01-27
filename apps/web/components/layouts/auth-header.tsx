"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { ThemeSwitcher } from "@/components/features/theme-switcher";
import { useAuth } from "@/providers/auth-provider";
import { navStyles } from "@/utils/styles";

/**
 * Header section that displays auth-related navigation links.
 * Shows Create/Sign out when logged in, Sign in when logged out.
 */
export function AuthHeader(): React.ReactElement {
  const { isLoggedIn, loading } = useAuth();

  // Show placeholder during loading to prevent layout shift
  if (loading) {
    return (
      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        <div
          className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          aria-hidden="true"
        />
        <ThemeSwitcher />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 sm:gap-6 ${isLoggedIn ? "" : "ml-auto"}`}
    >
      {isLoggedIn ? (
        <>
          <Link href="/create" className={navStyles.link}>
            Create
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link href="/sign-in" className={navStyles.link}>
          Sign in
        </Link>
      )}
      <ThemeSwitcher />
    </div>
  );
}
