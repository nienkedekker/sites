"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      // 1) trigger client signout so AuthProvider updates immediately
      await supabaseBrowser.auth.signOut({ scope: "local" });
      // 2) call server action to clear server cookies
      await signOutAction();
      // 3) force RSC refresh
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
