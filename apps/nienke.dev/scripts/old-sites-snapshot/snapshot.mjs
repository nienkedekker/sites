// usage: node snapshot.mjs jobs.json [onlyId]
// job: { id, html, url, ts, width?, scale?, css?, assets?: { [url]: file }, out, maxHeight? }
// Anything not in `assets` is fetched from the Wayback capture nearest to `ts`.
// On Nienke's own domains a capture only counts if it's within WINDOW_DAYS of `ts`.
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join } from "node:path";

const WINDOW_DAYS = 60;
const strictHosts = /(^|\.)(foot-loose\.org|suckerlove\.org|hellomannequin\.org|wakeupsleepyhead\.org|airlocklove\.com|chocolatebeforedinner\.com|sevenhells\.tumblr\.com|heelzwaarleven\.nl|nienke\.io|stupidhackathon\.wtf|nienkedekker\.com|trigger-joy\.net|stereofrequency\.org|paranoiattack\.org|ghostanatomy\.org|nienke\.dev)$/;
const blockedHosts = /(ads\.|adstream|euniverse|flowgo|ad-logics|haloscan|cutandpastescripts|myfunstart|google-analytics|statcounter|sitemeter|youtube\.com|ytimg\.com)/;
const cacheDir = new URL("./cache/", import.meta.url).pathname;
mkdirSync(cacheDir, { recursive: true });

const norm = (u) =>
  u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/:80\//, "/").replace(/%20/g, " ").replace(/\?$/, "").toLowerCase();
const types = { ".gif": "image/gif", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".bmp": "image/bmp", ".css": "text/css" };
const blank = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const toDate = (ts) => new Date(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T00:00:00Z`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let queue = Promise.resolve();
const wayback = (url, ts) => {
  const run = queue.then(() => fetchWayback(url, ts));
  queue = run.catch(() => {});
  return run;
};

async function fetchWayback(url, ts) {
  const key = createHash("sha1").update(`${ts}|${url}`).digest("hex");
  const meta = join(cacheDir, `${key}.json`);
  if (existsSync(meta)) {
    const m = JSON.parse(readFileSync(meta, "utf-8"));
    if (m.ok) return { ...m, body: readFileSync(join(cacheDir, `${key}.bin`)) };
    if (m.status) return null;
  }
  let result = { ok: false };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://web.archive.org/web/${ts}id_/${url}`, { redirect: "follow", signal: AbortSignal.timeout(40000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`status ${res.status}`);
      const got = res.url.match(/\/web\/(\d{14})id_\//)?.[1];
      const body = Buffer.from(await res.arrayBuffer());
      const days = got ? Math.abs(toDate(got) - toDate(ts)) / 864e5 : Infinity;
      const host = new URL(url).hostname.replace(/^www\./, "");
      const inWindow = !strictHosts.test(host) || days <= WINDOW_DAYS;
      const sameUrl = norm(res.url.replace(/^.*?id_\//, "")) === norm(url);
      if (res.ok && got && inWindow && sameUrl && !body.toString("latin1", 0, 400).includes("Temporarily Offline")) {
        result = { ok: true, type: res.headers.get("content-type") ?? "", got };
        writeFileSync(join(cacheDir, `${key}.bin`), body);
      } else {
        result = { ok: false, status: res.status, got, days };
      }
      break;
    } catch {
      await sleep(5000 * (attempt + 1));
    }
  }
  if (result.ok || result.status) writeFileSync(meta, JSON.stringify(result));
  await sleep(2000);
  return result.ok ? { ...result, body: readFileSync(join(cacheDir, `${key}.bin`)) } : null;
}

const [, , jobsFile, only] = process.argv;
const jobs = JSON.parse(readFileSync(jobsFile, "utf-8")).filter((j) => !only || j.id === only);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable,HttpsFirstModeV2", "--allow-running-insecure-content"],
});

for (const job of jobs) {
  const width = job.width ?? 1024;
  const scale = job.scale ?? 2;
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width, height: 768, deviceScaleFactor: scale });
  const assets = Object.fromEntries(Object.entries(job.assets ?? {}).map(([u, f]) => [norm(u), f]));
  const raw = readFileSync(job.html);
  const charset = job.charset ?? (/charset=["']?utf-8/i.test(raw.toString("latin1", 0, 3000)) ? "utf-8" : "latin1");
  let html = raw.toString(charset);
  html = html.replace(/(color\s*:\s*)"(#?[0-9a-z]+)"/gi, "$1$2");
  if (job.css) html = html.replace(/<\/head>/i, `<style>${job.css}</style></head>`);
  const used = [];
  const missing = [];

  await page.setRequestInterception(true);
  const pending = new Set();
  page.on("request", (req) => {
    const work = handle(req).catch(() => {});
    pending.add(work);
    work.finally(() => pending.delete(work));
  });
  async function handle(req) {
    const url = req.url();
    if (url.startsWith("data:")) return req.continue();
    const key = norm(url);
    const type = req.resourceType();
    const miss = () => {
      missing.push(url);
      if (type === "image") return req.respond({ status: 200, contentType: "image/gif", body: blank });
      if (type === "document") return req.respond({ status: 200, contentType: "text/html", body: "" });
      return req.abort();
    };
    if (key === norm(job.url) && req.frame() === page.mainFrame() && req.isNavigationRequest()) {
      return req.respond({ status: 200, contentType: `text/html; charset=${charset}`, body: Buffer.from(html, charset) });
    }
    if (assets[key]) {
      used.push(`local ${url}`);
      return req.respond({ status: 200, contentType: types[extname(assets[key]).toLowerCase()] ?? "application/octet-stream", body: readFileSync(assets[key]) });
    }
    if (blockedHosts.test(url) || url.endsWith("favicon.ico") || !/^https?:/.test(url)) return miss();
    const hit = await wayback(url.replace(/^https:/, "http:"), job.ts);
    if (!hit) return miss();
    used.push(`${hit.got} ${url}`);
    return req.respond({ status: 200, contentType: hit.type, body: hit.body });
  }

  await page.goto(job.url, { waitUntil: "load", timeout: 300000 });
  for (let quiet = 0; quiet < 3; ) {
    if (pending.size) {
      quiet = 0;
      await Promise.all([...pending]);
    } else {
      quiet++;
    }
    await sleep(400);
  }
  await page.setJavaScriptEnabled(true);
  const bottom = await page.evaluate(() => {
    let max = 0;
    const docs = [document, ...[...document.querySelectorAll("iframe")].map((f) => f.contentDocument).filter(Boolean)];
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const leaf = ["IMG", "IFRAME", "INPUT", "TEXTAREA", "HR"].includes(el.tagName) ||
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (leaf) max = Math.max(max, r.bottom + scrollY);
    }
    return Math.ceil(max) + docs.length * 0;
  });
  const height = Math.max(job.minHeight ?? 420, Math.min(bottom + 32, job.maxHeight ?? 4000));
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await sleep(200);
  await page.screenshot({ path: job.out, clip: { x: 0, y: 0, width, height } });
  console.log(`${job.id}: ${width}x${height}`);
  for (const u of used) console.log(`   + ${u}`);
  for (const u of missing) console.log(`   - ${u}`);
  await page.close();
}

await browser.close();
