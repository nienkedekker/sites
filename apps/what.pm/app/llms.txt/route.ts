import { LLMS_TXT } from "@/utils/agents/discovery";

export const dynamic = "force-static";

export function GET() {
  return new Response(LLMS_TXT, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
