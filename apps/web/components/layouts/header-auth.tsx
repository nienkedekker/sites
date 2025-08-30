import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClientForServer } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClientForServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <>
      <Button asChild variant="link">
        <Link href="/create">Create</Link>
      </Button>
      <form action={signOutAction} className="inline">
        <Button type="submit" variant="link" className="cursor-pointer">
          Sign out
        </Button>
      </form>
    </>
  ) : (
    <>
      <Button asChild variant="link">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </>
  );
}
