import { NextResponse, type NextRequest } from "next/server";
import { parseReport } from "@/utils/data/nanami";
import {
  getReport,
  isNanami,
  isOwner,
  saveReport,
} from "@/utils/server/nanami";
import { hasNanami } from "@/utils/server/services";

const MAX_BODY_BYTES = 64 * 1024;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });

// nanami pushes its report here every minute
export async function POST(request: NextRequest) {
  if (!hasNanami() || !isNanami(request.headers.get("authorization"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return json({ error: "Too large" }, 413);

  let report;
  try {
    report = parseReport(JSON.parse(body));
  } catch {
    report = null;
  }
  if (!report) return json({ error: "Not a report" }, 400);

  try {
    await saveReport(report);
    return json({ ok: true });
  } catch (error) {
    console.error("nanami report error:", error);
    return json({ error: "Failed to save" }, 500);
  }
}

// The nanami pages poll this for the latest report
export async function GET() {
  if (!hasNanami() || !(await isOwner())) {
    return json({ error: "Unauthorized" }, 401);
  }
  try {
    return json(await getReport());
  } catch (error) {
    console.error("nanami report error:", error);
    return json({ error: "Failed to load" }, 500);
  }
}
