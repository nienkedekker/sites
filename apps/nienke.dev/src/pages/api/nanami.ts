import type { APIRoute } from "astro";
import { getReport, isNanami, isSignedIn, saveReport } from "../../lib/nanami";
import { parseReport } from "../../lib/nanami-report";

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });

// nanami pushes its report here every minute
export const POST: APIRoute = async ({ request }) => {
  if (!isNanami(request.headers.get("authorization"))) {
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
};

// The status page polls this for the latest report
export const GET: APIRoute = async ({ cookies }) => {
  if (!isSignedIn(cookies)) return json({ error: "Unauthorized" }, 401);
  try {
    return json(await getReport());
  } catch (error) {
    console.error("nanami report error:", error);
    return json({ error: "Failed to load" }, 500);
  }
};
