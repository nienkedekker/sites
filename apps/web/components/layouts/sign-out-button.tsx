"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { ReactElement, useState } from "react";
import { navStyles } from "@/utils/styles";

export function SignOutButton(): ReactElement {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);

    try {
      // 1) trigger client signout so AuthProvider updates immediately
      await supabaseBrowser.auth.signOut({ scope: "local" });
      // 2) call server action to clear server cookies
      await signOutAction();
      // 3) force RSC refresh
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      setError("Failed to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className={navStyles.linkDisabled}
      >
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <span className="text-red-600 dark:text-red-400 text-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
