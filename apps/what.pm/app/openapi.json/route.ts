import { OPENAPI } from "@/utils/agents/discovery";

export function GET() {
  return Response.json(OPENAPI, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
