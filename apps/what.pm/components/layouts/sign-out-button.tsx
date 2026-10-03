"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { ReactElement, useState } from "react";

export function SignOutButton(): ReactElement {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);

    try {
      await supabaseBrowser.auth.signOut({ scope: "local" });
      await signOutAction();
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      setError("Failed to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className="link cursor-pointer hover:text-ink disabled:opacity-50"
      >
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <span className="text-danger" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
