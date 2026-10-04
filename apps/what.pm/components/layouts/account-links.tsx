"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { useAuth } from "@/providers/auth-provider";

export function AccountLinks() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;

  return isLoggedIn ? (
    <>
      <li>
        <Link href="/recs" className="link hover:text-ink">
          Recs
        </Link>
      </li>
      <li>
        <Link href="/settings" className="link hover:text-ink">
          Settings
        </Link>
      </li>
      <li>
        <SignOutButton />
      </li>
    </>
  ) : (
    <li>
      <Link href="/sign-in" className="link hover:text-ink">
        Sign in
      </Link>
    </li>
  );
}
