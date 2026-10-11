"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/layouts/sign-out-button";
import { useAuth } from "@/providers/auth-provider";

export function AccountLinks({ discover }: { discover: boolean }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;

  return isLoggedIn ? (
    <>
      <li>
        <Link href="/create" className="link hover:text-ink">
          Create
        </Link>
      </li>
      {discover && (
        <li>
          <Link href="/discover" className="link hover:text-ink">
            Discover
          </Link>
        </li>
      )}
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
