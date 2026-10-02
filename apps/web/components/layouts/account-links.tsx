"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { linkStyles } from "@/utils/styles";
import { useAuth } from "@/providers/auth-provider";

/** Footer links that depend on being signed in: Export and Sign in/out */
export function AccountLinks() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;

  return isLoggedIn ? (
    <>
      <li>
        <Link href="/export" className={linkStyles.footer}>
          Export
        </Link>
      </li>
      <li>
        <SignOutButton />
      </li>
    </>
  ) : (
    <li>
      <Link href="/sign-in" className={linkStyles.footer}>
        Sign in
      </Link>
    </li>
  );
}
