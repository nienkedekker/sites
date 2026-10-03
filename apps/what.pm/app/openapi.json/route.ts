import { OPENAPI } from "@/utils/agents/discovery";

export const dynamic = "force-static";

export function GET() {
  return Response.json(OPENAPI, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
