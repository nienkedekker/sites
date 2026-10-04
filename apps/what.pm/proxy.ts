import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { markdownTarget, prefersMarkdown } from "@/utils/agents/negotiate";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const negotiable = markdownTarget(pathname).kind !== "skip";

  if (negotiable && prefersMarkdown(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/markdown" : `/markdown${pathname}`;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/v1|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
