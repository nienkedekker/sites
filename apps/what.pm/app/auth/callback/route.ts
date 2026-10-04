import { createClientForServer } from "@/utils/supabase/server";
import { getSafeRedirectUrl } from "@/utils/auth/safe-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = getSafeRedirectUrl(
    requestUrl.searchParams.get("redirect_to"),
  );

  if (code) {
    const supabase = await createClientForServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging auth code:", error);
      const signIn = new URL("/sign-in", requestUrl.origin);
      signIn.searchParams.set(
        "error",
        "That sign-in link didn’t work. Try signing in again.",
      );
      signIn.searchParams.set("redirect", redirectTo);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
