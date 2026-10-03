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
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
