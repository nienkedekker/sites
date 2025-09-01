"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      type="button"
      onClick={handleClick}
      disabled={pending}
      variant="ghost"
    >
      Sign out
    </Button>
  );
}
