// verify-site.mjs - the browser arm for crashthestack.com's deploy tree
// (P4b, ruling D20): the site at the root, the game at /jack-in/, the
// tracker at /tracker/, and the move's redirects.
//
//   node verify-site.mjs [STAGED] [--old DIR] [--port N] [--cdp N]
//
// STAGED is the tree scripts/stage-web builds (default build/hosted-site).
// --old DIR is the PREVIOUS publish's game tree, the one that lived at the
// root (its index.html, sw.js and wasm), for the tombstone leg: the arm
// serves it at / first so a real old worker installs, then switches to
// the staged tree, as a returning browser sees the deploy. Without --old
// that leg is skipped and says so.
//
// Legs, PASS / FAIL <name>: <detail>; any FAIL exits 1:
//   landing        / with no query is the landing page: the title, the JACK IN
//                  link to /jack-in/, the newest devlog post, the feed links;
//                  no redirect happened
//   pages          /about/ carries the approved disclosure (test/fixtures/
//                  disclosure.txt) verbatim; /devlog/ lists every post newest
//                  first; /docs/tracker/ is the tracker manual; /tracker/ is
//                  the tracker page; the game's old files are not at the root
//   feeds          /devlog/feed.xml parses as RSS 2.0 with the same posts as
//                  /devlog/feed.json (JSON Feed 1.1), the same URLs, dates in
//                  RFC 822 and RFC 3339, absolute links under the site's URL
//   manifest       /jack-in/assets/manifest.webmanifest resolves its scope and
//                  start_url to /jack-in/ and carries id /jack-in/
//   redirect-code  /?code=380000010V lands on /jack-in/?code=380000010V and
//                  the game boots there (the share code intact)
//   redirect-stack /?trace&stack&fresh&seed=1#x lands on /jack-in/ with the
//                  query and the hash, and deals seed 1
//   redirect-app   / opened in the installed app's display mode (fullscreen)
//                  lands on /jack-in/
//   tombstone      the old root-scoped worker, installed from --old and
//                  controlling /, meets the deploy: the next /?code= visit
//                  ends on /jack-in/?code=... with the game booted, the root
//                  registration gone, no crash-the-stack-* cache left, the
//                  game's own worker registered under /jack-in/
//   console        no error and no sokol refusal over the run
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--old", "--port", "--cdp"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const STAGED = path.resolve(positional[0] || "build/hosted-site");
const OLD = opt("--old", null) ? path.resolve(opt("--old", null)) : null;
const PORT = parseInt(opt("--port", "8096"), 10);
const CDP = parseInt(opt("--cdp", "9236"), 10);
const SITE_URL = "https://crashthestack.com";
const CODE = "380000010V";   // verify.mjs's cards seed 1 share code

for (const f of ["index.html", "jack-in/index.html", "jack-in/sw.js", "jack-in/crash-the-stack.wasm", "tracker/index.html", "sw.js", "_headers", "_redirects", "devlog/feed.xml", "devlog/feed.json"]) {
  if (!fs.existsSync(path.join(STAGED, f))) { console.log(`SETUP-FAILED: ${STAGED}/${f} missing (scripts/stage-web builds the tree)`); process.exit(2); }
}
if (OLD) for (const f of ["index.html", "sw.js", "crash-the-stack.wasm"]) {
  if (!fs.existsSync(path.join(OLD, f))) { console.log(`SETUP-FAILED: --old ${OLD}/${f} missing (the previous publish's game tree)`); process.exit(2); }
}

const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".json": "application/json;charset=utf-8", ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json", ".xml": "application/rss+xml;charset=utf-8", ".ogg": "audio/ogg", ".txt": "text/plain;charset=utf-8", ".cts": "text/plain;charset=utf-8" };
// which tree answers at the root: the staged one, or (the tombstone leg's
// first half) the old game
let root = STAGED;
const requests = [];
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  requests.push(urlPath);
  const rel = urlPath === "/" ? "/index.html" : (urlPath.endsWith("/") ? urlPath + "index.html" : urlPath);
  const fp = path.join(root, rel);
  if (fp !== root && !fp.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const udd = fs.mkdtempSync("/tmp/crash-verify-site-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`, "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } process.exit(code); }, 1500).unref();
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); shutdown(2); });
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); shutdown(2); });

let pageWs = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); const page = list.find((t) => t.type === "page"); if (page) pageWs = page.webSocketDebuggerUrl; } catch { /* not up */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s"); shutdown(2); await new Promise(() => {}); }
const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = []; const consoleErrors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    consoleLines.push(text);
    if (msg.params.type === "error") consoleErrors.push("console.error: " + text);
  }
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");
async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitLine(re, from, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) return { m, index: i }; }
    await sleep(50);
  }
  return null;
}
// the game is up: the loader handed the page its app (no ?trace needed)
async function gameUp(ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const up = await evalJS("!!(globalThis.__crashUpdates && globalThis.__crashUpdates.app)").catch(() => false);
    if (up) return true;
    await sleep(250);
  }
  return false;
}
async function navigate(url) {
  let r = null;
  for (let i = 0; i < 3; i++) {
    r = await send("Page.navigate", { url });
    if (!r.errorText) return r;
    console.log(`note: Page.navigate ${r.errorText} (try ${i + 1}) for ${url}`);
    await sleep(1000);
  }
  return r;
}
// the page's URL once it has settled (a redirect script runs before paint)
async function settledLocation(ms = 4000) {
  let last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const now = await evalJS("location.href").catch(() => null);
    if (now && now === last) { await sleep(300); const again = await evalJS("location.href").catch(() => null); if (again === now) return now; }
    last = now; await sleep(150);
  }
  return last;
}
const results = []; let failed = 0;
const pass = (n, d) => { results.push(`PASS ${n}: ${d}`); console.log(`PASS ${n}: ${d}`); };
const fail = (n, d) => { results.push(`FAIL ${n}: ${d}`); console.log(`FAIL ${n}: ${d}`); failed++; };
const skip = (n, d) => { results.push(`SKIP ${n}: ${d}`); console.log(`SKIP ${n}: ${d}`); };
const origin = `http://127.0.0.1:${PORT}`;
const text = (p) => fs.readFileSync(path.join(STAGED, p), "utf8");

// ---- landing ----------------------------------------------------------------
{
  const mark = consoleLines.length;
  await navigate(`${origin}/`);
  await sleep(1500);
  const at = await settledLocation();
  const detail = [];
  if (at !== `${origin}/`) detail.push(`the root did not stay put: ${at}`);
  const title = await evalJS("document.title");
  if (title !== "Crash The Stack") detail.push(`title "${title}"`);
  const cta = await evalJS(`(document.querySelector('a.cta') || {}).getAttribute ? document.querySelector('a.cta').getAttribute('href') : null`);
  if (cta !== "/jack-in/") detail.push(`the JACK IN link points at ${cta}`);
  const latest = await evalJS(`(() => { const a = document.querySelector('.latest a'); return a ? [a.getAttribute('href'), a.textContent] : null; })()`);
  if (!latest || !/^\/devlog\/[^/]+\/$/.test(latest[0])) detail.push(`no newest post on the landing (${JSON.stringify(latest)})`);
  const feeds = await evalJS(`Array.from(document.querySelectorAll('link[rel=alternate]')).map((l) => l.getAttribute('href')).join(' ')`);
  if (!/\/devlog\/feed\.xml/.test(feeds) || !/\/devlog\/feed\.json/.test(feeds)) detail.push(`feed links ${feeds}`);
  if (consoleLines.slice(mark).some((l) => /^crash: page dpr/.test(l))) detail.push("the game booted on the landing");
  if (detail.length) fail("landing", detail.join("; ")); else pass("landing", `/ is the landing: JACK IN -> /jack-in/, newest post ${latest[0]} "${latest[1]}", both feed links, no redirect`);
}

// ---- pages ----------------------------------------------------------------
{
  const detail = [];
  const disclosure = fs.readFileSync("test/fixtures/disclosure.txt", "utf8").trim();
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");   // sxml->html's escaping
  const about = text("about/index.html");
  if (!about.includes(esc(disclosure)) && !about.includes(disclosure)) detail.push("/about/ does not carry the disclosure verbatim");
  const index = text("devlog/index.html");
  const posts = fs.readdirSync(path.join(STAGED, "devlog")).filter((d) => fs.existsSync(path.join(STAGED, "devlog", d, "index.html")));
  const listed = Array.from(index.matchAll(/href="\/devlog\/([^/"]+)\/"/g)).map((m) => m[1]);
  const missing = posts.filter((p) => !listed.includes(p));
  if (missing.length) detail.push(`posts not on /devlog/: ${missing.join(", ")}`);
  const dates = Array.from(index.matchAll(/<time datetime="([^"]+)"/g)).map((m) => m[1]);
  const sorted = [...dates].sort().reverse();
  if (dates.join() !== sorted.join()) detail.push(`/devlog/ is not newest first: ${dates.join(" ")}`);
  const tracker = text("docs/tracker/index.html");
  if (!/Motif Tracker/.test(tracker)) detail.push("/docs/tracker/ is not the tracker manual");
  const trackerPage = text("tracker/index.html");
  if (!/crash-tracker/.test(trackerPage)) detail.push("/tracker/ is not the tracker page");
  for (const f of ["crash-the-stack.wasm", "styles.css", "sigil-wasm-bridges.js"]) if (fs.existsSync(path.join(STAGED, f))) detail.push(`the old game's ${f} is at the root`);
  const headers = text("_headers");
  if (!/^\/jack-in\/\*/m.test(headers) || /^\/\*$/m.test(headers)) detail.push("_headers does not scope the isolation headers to /jack-in/*");
  if (detail.length) fail("pages", detail.join("; ")); else pass("pages", `/about/ carries the disclosure; /devlog/ lists ${posts.length} posts newest first; /docs/tracker/ and /tracker/ are what they should be; no game file at the root; _headers scoped`);
}

// ---- feeds ----------------------------------------------------------------
{
  const detail = [];
  const rss = text("devlog/feed.xml");
  const json = JSON.parse(text("devlog/feed.json"));
  if (!rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) detail.push("the RSS has no XML prolog");
  if (!/<rss version="2.0"/.test(rss)) detail.push("not RSS 2.0");
  const rssItems = Array.from(rss.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((m) => m[1]);
  const rssLinks = rssItems.map((i) => (i.match(/<link>([^<]+)<\/link>/) || [])[1]);
  const rssDates = rssItems.map((i) => (i.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1]);
  if (json.version !== "https://jsonfeed.org/version/1.1") detail.push(`JSON Feed version ${json.version}`);
  const jsonUrls = (json.items || []).map((i) => i.url);
  if (rssLinks.join() !== jsonUrls.join()) detail.push(`the two feeds list different posts: rss ${rssLinks.join(" ")} json ${jsonUrls.join(" ")}`);
  if (!rssLinks.length) detail.push("no entries");
  if (rssLinks.some((l) => !l.startsWith(SITE_URL + "/devlog/"))) detail.push(`an RSS link is not under ${SITE_URL}/devlog/: ${rssLinks.join(" ")}`);
  if (rssDates.some((d) => !/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} \+0000$/.test(d || ""))) detail.push(`an RSS pubDate is not RFC 822: ${rssDates.join(" | ")}`);
  if ((json.items || []).some((i) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(i.date_published || ""))) detail.push("a JSON Feed date_published is not RFC 3339");
  if (json.feed_url !== `${SITE_URL}/devlog/feed.json`) detail.push(`feed_url ${json.feed_url}`);
  if (!/<atom:link href="https:\/\/crashthestack\.com\/devlog\/feed\.xml" rel="self"/.test(rss)) detail.push("no atom self link");
  // newest first in both
  const jd = (json.items || []).map((i) => i.date_published);
  if (jd.join() !== [...jd].sort().reverse().join()) detail.push("the JSON Feed is not newest first");
  if (detail.length) fail("feeds", detail.join("; ")); else pass("feeds", `${rssLinks.length} posts in both feeds, the same URLs in the same order, RFC 822 and RFC 3339 dates, absolute links, the self link`);
}

// ---- manifest ----------------------------------------------------------------
{
  const detail = [];
  const url = `${origin}/jack-in/assets/manifest.webmanifest`;
  const m = await (await fetch(url)).json();
  const scope = new URL(m.scope, url).pathname, start = new URL(m.start_url, url).pathname;
  if (scope !== "/jack-in/") detail.push(`scope resolves to ${scope}`);
  if (start !== "/jack-in/") detail.push(`start_url resolves to ${start}`);
  if (m.id !== "/jack-in/") detail.push(`id ${m.id}`);
  if (detail.length) fail("manifest", detail.join("; ")); else pass("manifest", `scope ${scope}, start_url ${start}, id ${m.id}`);
}

// ---- wasm: the page and the wasm it names belong to each other ----------------
// The wasm is not a file in the deploy any more. Pages refuses a file over
// 25 MiB and the game's is 41,921,264 bytes (sigil 0.22.5), so it lives in R2
// and a Pages Function serves it same-origin at a content-addressed path
// (/jack-in/w/<sha16>/crash-the-stack.wasm; web/r2-wasm.js says why same-origin
// is not optional). Locally there is no Function: scripts/wasm-to-r2 --local
// puts the same bytes at the same paths so this leg reads the same on a static
// server and on the deployed site.
//
// The assertion that matters is the last one: the bytes served under a hash
// must hash to it. That is what makes a page and a wasm from different builds
// impossible to pair, which is the whole reason for content addressing. The
// header checks are the isolation: a wasm without CORP is refused by the
// cross-origin-isolated page and the game does not boot.
{
  const detail = [], sizes = [];
  for (const [page, name] of [["jack-in", "crash-the-stack"], ["tracker", "crash-tracker"]]) {
    const pageRes = await fetch(`${origin}/${page}/`);
    if (!pageRes.ok) { detail.push(`/${page}/ answered ${pageRes.status}`); continue; }
    const html = await pageRes.text();
    // a server that answers a missing path with another page would otherwise be
    // read as the game's own, and its data-wasm believed
    if (!html.includes("sigil-web-app.js")) { detail.push(`/${page}/ is not the game's page (no loader script)`); continue; }
    const m = html.match(/data-wasm="([^"]+)"/);
    if (!m) { detail.push(`/${page}/ has no data-wasm`); continue; }
    const named = m[1];
    if (!/^w\/[0-9a-f]{16}\/[a-z0-9-]+$/.test(named)) {
      detail.push(`/${page}/ names ${named}, which is not w/<sha16>/<name> (was wasm-to-r2 run?)`);
      continue;
    }
    if (!named.endsWith(`/${name}`)) { detail.push(`/${page}/ names ${named}, not ${name}`); continue; }
    const url = `${origin}/${page}/${named}.wasm`;
    const res = await fetch(url);
    if (res.status !== 200) { detail.push(`${url} answered ${res.status}`); continue; }
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("application/wasm")) detail.push(`${url} is ${type || "untyped"}`);
    // The immutable cache-control and the CORP header come from the Function,
    // which no local server runs, so they are asserted against the deployed
    // site by scripts/verify-wasm-live rather than guessed at here.
    const bytes = new Uint8Array(await res.arrayBuffer());
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    const want = named.split("/")[1];
    if (digest !== want) detail.push(`${url} serves bytes that hash to ${digest}, not ${want}`);
    else sizes.push(`/${page}/ ${name} ${bytes.length} bytes at ${want}`);
  }
  if (detail.length) fail("wasm", detail.join("; "));
  else pass("wasm", sizes.join("; "));
}

// ---- the redirects ----------------------------------------------------------------
{
  const mark = consoleLines.length;
  await navigate(`${origin}/?code=${CODE}`);
  const at = await settledLocation(6000);
  const booted = await gameUp(60000);
  const detail = [];
  if (at !== `${origin}/jack-in/?code=${CODE}`) detail.push(`landed on ${at}`);
  if (!booted) detail.push("the game did not boot at /jack-in/");
  if (detail.length) fail("redirect-code", detail.join("; ")); else pass("redirect-code", `/?code=${CODE} -> ${at.replace(origin, "")}, the game booted`);
}
{
  const mark = consoleLines.length;
  await navigate(`${origin}/?trace&stack&fresh&seed=1#x`);
  const at = await settledLocation(6000);
  const seed = await waitLine(/^crash: seed (\d+) /, mark, 60000);
  const detail = [];
  if (at !== `${origin}/jack-in/?trace&stack&fresh&seed=1#x`) detail.push(`landed on ${at}`);
  if (!seed) detail.push("no deal"); else if (seed.m[1] !== "1") detail.push(`dealt seed ${seed.m[1]}`);
  if (detail.length) fail("redirect-stack", detail.join("; ")); else pass("redirect-stack", `/?trace&stack&fresh&seed=1#x -> ${at.replace(origin, "")}, seed 1 dealt`);
}
{
  // headless Chrome has no installed-app display mode to put a page in, so
  // the page's matchMedia answers fullscreen for this boot (an override
  // installed before the landing's script runs); the script's branch is
  // what the leg proves
  const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    (() => { const real = window.matchMedia.bind(window);
      window.matchMedia = (q) => /display-mode: fullscreen/.test(q) ? { matches: true, media: q } : real(q); })();` });
  const mark = consoleLines.length;
  await navigate(`${origin}/`);
  const at = await settledLocation(6000);
  const booted = await gameUp(60000);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  const detail = [];
  if (at !== `${origin}/jack-in/`) detail.push(`landed on ${at}`);
  if (!booted) detail.push("the game did not boot");
  if (detail.length) fail("redirect-app", detail.join("; ")); else pass("redirect-app", `/ with display-mode fullscreen (the installed app) -> /jack-in/, the game booted`);
}

// ---- tombstone ----------------------------------------------------------------
let tombstoneWindow = [consoleErrors.length, consoleErrors.length];
if (!OLD) skip("tombstone", "no --old DIR (the previous publish's game tree); the old-worker leg needs it");
else {
  const detail = [];
  const name = "tombstone";
  tombstoneWindow[0] = consoleErrors.length;
  // 1. the old game at the root, its worker installed and in control
  await send("Storage.clearDataForOrigin", { origin, storageTypes: "service_workers,cache_storage" });
  root = OLD;
  let mark = consoleLines.length;
  await navigate(`${origin}/?trace&stack&fresh&seed=1`);
  const reg = await waitLine(/^crash: sw registered$/, mark, 120000);
  if (!reg) detail.push("the old game never registered its worker (crash: sw registered)");
  let oldReady = false;
  for (let i = 0; i < 240 && !detail.length && !oldReady; i++) {
    oldReady = await evalJS(`navigator.serviceWorker.getRegistrations().then((rs) => rs.some((r) => new URL(r.scope).pathname === "/" && r.active && r.active.state === "activated")).then((ok) => ok && caches.keys()).then((ks) => !!(ks && ks.some((k) => k.startsWith("crash-the-stack-"))))`).catch(() => false);
    if (!oldReady) await sleep(500);
  }
  if (!detail.length && !oldReady) detail.push("the old root worker did not reach activated with its cache within 120 s");
  // a second visit under the old worker: served from its cache (the case a returning browser is in)
  if (!detail.length) {
    mark = consoleLines.length;
    await navigate(`${origin}/?trace&stack&fresh&seed=2`);
    const controlled = await waitLine(/^crash: page dpr /, mark, 60000) && await evalJS("!!navigator.serviceWorker.controller");
    if (!controlled) detail.push("the old worker does not control the root page on a second visit");
  }
  // 2. the deploy: the staged tree answers at the root now
  if (!detail.length) {
    root = STAGED;
    mark = consoleLines.length;
    const before = requests.length;
    await navigate(`${origin}/?trace&code=${CODE}`);
    // the old worker serves its cached game page, which registers /sw.js
    // again; the tombstone installs, activates, drops the caches,
    // unregisters and reloads the client through the landing
    let at = null;
    const t0 = Date.now();
    // five minutes: the old page installs the tombstone, which activates,
    // clears the caches and navigates it. On a loaded box (three web builds
    // and another arm's Chrome) that round trip has taken over two minutes,
    // and the leg is about what happens, not how fast
    while (Date.now() - t0 < 300000) {
      at = await evalJS("location.href").catch(() => null);
      if (at === `${origin}/jack-in/?trace&code=${CODE}`) break;
      await sleep(250);
    }
    const booted = at === `${origin}/jack-in/?trace&code=${CODE}` ? await gameUp(60000) : null;
    if (at !== `${origin}/jack-in/?trace&code=${CODE}`) detail.push(`after the deploy the old client sits at ${at} (requests since: ${requests.slice(before).join(" ")})`);
    else if (!booted) detail.push("the game did not boot at /jack-in/ after the move");
    if (!detail.length) {
      // the game's own worker registers under /jack-in/ once the board's boot is done
      const registered = await waitLine(/^crash: sw registered$/, mark, 120000);
      if (!registered) detail.push("the game at /jack-in/ never said crash: sw registered");
      // the registration lands a moment after the line; poll for it
      let state = null;
      for (let i = 0; i < 40; i++) {
        state = await evalJS(`navigator.serviceWorker.getRegistrations().then((rs) => rs.map((r) => new URL(r.scope).pathname)).then((scopes) => caches.keys().then((ks) => ({ scopes, caches: ks })))`);
        if (state.scopes.includes("/jack-in/") && !state.scopes.includes("/")) break;
        await sleep(500);
      }
      if (state.scopes.includes("/")) detail.push(`the root registration is still there (scopes ${state.scopes.join(" ")})`);
      if (state.caches.some((k) => k.startsWith("crash-the-stack-"))) detail.push(`an old cache survived: ${state.caches.join(" ")}`);
      if (!state.scopes.includes("/jack-in/")) detail.push(`no worker under /jack-in/ (scopes ${state.scopes.join(" ")})`);
      if (!detail.length) pass(name, `the old root worker met the deploy: /?trace&code=${CODE} ended on /jack-in/?trace&code=${CODE} with the game booted; registrations ${state.scopes.join(" ")}; caches ${state.caches.join(" ") || "none"}`);
    }
  }
  root = STAGED;
  tombstoneWindow[1] = consoleErrors.length;
  if (detail.length) fail(name, detail.join("; "));
}

// ---- soundtrack -------------------------------------------------------------
// The album's listening page is staged from the tree (stage-web builds it
// from docs/music/album/listen plus scripts/album-manifest), so a publish
// can never quietly put an older bundle back: the page must carry the
// site's clothes and a manifest with every track.
{
  const detail = [];
  const page = text("soundtrack/index.html");
  const css = text("soundtrack/style.css");
  if (!/--bg: #0d0a1a/.test(css)) detail.push("the stylesheet is not the site's palette (no --bg: #0d0a1a)");
  if (!/JetBrainsMono-Regular\.woff2/.test(css)) detail.push("the stylesheet does not use the site's face");
  if (!/class="nav"/.test(page)) detail.push("the page does not carry the site's nav");
  if (!/href="\/jack-in\/"/.test(page)) detail.push("the nav has no PLAY link to /jack-in/");
  let album = null;
  try { album = JSON.parse(text("soundtrack/album.json")); } catch (e) { detail.push(`album.json does not parse: ${e.message}`); }
  if (album) {
    if (!Array.isArray(album.tracks) || album.tracks.length !== 15) detail.push(`album.json lists ${album.tracks ? album.tracks.length : "no"} tracks, not 15`);
    else {
      const bad = album.tracks.filter((t) => !t.title || !(t.duration_seconds > 0) || !/^https:\/\/assets\.crashthestack\.com\/soundtrack\//.test(t.mp3 || ""));
      if (bad.length) detail.push(`${bad.length} track(s) with no title, length or MP3 URL (first: ${JSON.stringify(bad[0])})`);
    }
  }
  const nav = await fetch(`${origin}/soundtrack/`).then((r) => r.status).catch(() => 0);
  if (nav !== 200) detail.push(`/soundtrack/ answers ${nav}`);
  if (detail.length) fail("soundtrack", detail.join("; "));
  else pass("soundtrack", `/soundtrack/ is the site's page (palette, JetBrains Mono, the nav) with ${album.tracks.length} tracks, ${Math.round(album.duration_seconds)} s, the MP3s on assets.crashthestack.com`);
}

// ---- console ----------------------------------------------------------------
{
  const sokol = consoleLines.filter((l) => /^sokol\[level=[01]\]/.test(l));
  // the tombstone leg's own window is left out: the old page's fetches die
  // as the tree switches under it, which is what a deploy does to it
  const errors = consoleErrors.filter((e, i) => !(i >= tombstoneWindow[0] && i < tombstoneWindow[1]) && !/image fetch failed: TypeError: Failed to fetch|Failed to load resource: net::ERR_FAILED/.test(e));
  if (sokol.length || errors.length) fail("console", `${errors.length} error(s), ${sokol.length} sokol refusal(s): ${errors.slice(0, 3).join(" | ")} ${sokol.slice(0, 2).join(" | ")}`);
  else pass("console", `${consoleLines.length} console lines, 0 errors, no sokol refusal`);
}

console.log(`RESULT: ${results.filter((r) => r.startsWith("PASS")).length} passed, ${failed} failed, ${results.filter((r) => r.startsWith("SKIP")).length} skipped`);
shutdown(failed ? 1 : 0);
