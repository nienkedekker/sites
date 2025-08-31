"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const { pending } = useFormStatus(); // optional for disabling UI

  const handleClick = async () => {
    // 1) trigger client signout so AuthProvider updates immediately
    await supabaseBrowser.auth.signOut({ scope: "local" });
    // 2) call server action to clear server cookies
    await signOutAction();
    // 3) force RSC refresh
    router.refresh();
  };

  //

  return (
    <Button type="button" onClick={handleClick} disabled={pending}>
      Sign out
    </Button>
  );
}
