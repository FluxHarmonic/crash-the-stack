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
//                  link to /jack-in/, the newest news post, the feed links;
//                  no redirect happened
//   pages          /about/ carries the approved disclosure (test/fixtures/
//                  disclosure.txt) verbatim; /news/ lists every post newest
//                  first; /docs/tracker/ is the tracker manual; /tracker/ is
//                  the tracker page; the game's old files are not at the root
//   feeds          /news/feed.xml parses as RSS 2.0 with the same posts as
//                  /news/feed.json (JSON Feed 1.1), the same URLs, dates in
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
//   not-found      a missing path answers the site's 404.html with status 404 (the
//                  server answers as Cloudflare Pages does: without a 404.html,
//                  the landing page with 200); /about/ still 200
//   preview        every page a link points at carries og:image (the gameplay
//                  shot, 1200x630) and twitter:card summary_large_image; the
//                  soundtrack page links /news/, not /devlog/
//   devlog         the staged _redirects sends /devlog/, its old post paths and
//                  its feeds to /news/ (301); /news/ is headed News
//   crosslink      every page's footer links Harkfell beside Flux Harmonic
//   version-missing the game's version fetch takes its missing branch for a 404
//                  AND for 200 with HTML (t-5bb869)
//   webgl          scripts/webgl-check.mjs on /jack-in/ and /tracker/: with WebGL
//                  off or only WebGL 1, the page says it needs WebGL 2 and never
//                  fetches the wasm (the game registers no service worker);
//                  with no context for the stage, the message replaces the raw
//                  error; with WebGL 2, no message and the app starts
//   analytics      (scripts/plausible-check.mjs) every HTML page in the tree
//                  carries David's Plausible snippet with crashthestack.com's
//                  script ID exactly once, in <head>; the game's and the
//                  tracker's pages carry the gated one (the script only on
//                  crashthestack.com: the itch.io build is the same page).
//                  Then in Chrome at https://crashthestack.com itself (every
//                  request for it answered by a second server over this tree
//                  that applies the staged _headers, as Pages does; every
//                  https://plausible.io request sent to a stub: no internet),
//                  the landing, /about/, /news/, a post, /soundtrack/, a
//                  missing page, /jack-in/ and /tracker/ each load the script
//                  and send a pageview for crashthestack.com that comes back
//                  202, and /jack-in/ and /tracker/ stay cross-origin isolated
//                  while they do. (The game's worker is not registered there:
//                  its own fetches would leave the harness for the live site.
//                  The sw leg covers the worker.)
//   itch           /jack-in/ and /tracker/ played on another host (this
//                  server's loopback origin, as on itch.io) ask plausible.io
//                  for nothing
//   sw             the staged jack-in/sw.js, run in a sandbox: its install
//                  precaches nothing from plausible.io, and no fetch listener
//                  answers plausible.io's script GET or its event POST (as
//                  fetch or as a no-cors beacon), so none is cached or queued;
//                  a same-origin GET is answered (the control)
//   coep           /jack-in/ at crashthestack.com with a plausible.io that
//                  sends no CORP: the script is requested and blocked, the
//                  page stays isolated (so COEP really judges it, and the
//                  analytics leg's pass means plausible.io's CORP is enough)
//   privacy        the landing's footer says "Privacy-friendly analytics by
//                  Plausible: no cookies, no personal data."
//   analytics-down plausible.io unreachable (every request refused): the
//                  landing and the game at crashthestack.com still work, with
//                  no error or exception
//   console        no error and no sokol refusal over the run
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { auditTree, plausibleStub, PRIVACY } from "./scripts/plausible-check.mjs";

const PLAUSIBLE_ID = "pa-5iTMFNFjYxMn3THin-cwJ";
const PLAUSIBLE_HOST = "crashthestack.com";

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

for (const f of ["index.html", "jack-in/index.html", "jack-in/sw.js", "tracker/index.html", "sw.js", "_headers", "_redirects", "news/feed.xml", "news/feed.json"]) {
  if (!fs.existsSync(path.join(STAGED, f))) { console.log(`SETUP-FAILED: ${STAGED}/${f} missing (scripts/stage-web builds the tree)`); process.exit(2); }
}
// the wasm is not a staged file any more: stage-web's --local run puts it at
// jack-in/w/<sha16>/crash-the-stack.wasm, the path the deploy's Function
// serves, and the wasm leg checks the page against it
{
  const hashed = fs.existsSync(path.join(STAGED, "jack-in", "w")) && fs.readdirSync(path.join(STAGED, "jack-in", "w"));
  const ok = hashed && hashed.some((h) => fs.existsSync(path.join(STAGED, "jack-in", "w", h, "crash-the-stack.wasm")));
  if (!ok) { console.log(`SETUP-FAILED: ${STAGED}/jack-in/w/<sha16>/crash-the-stack.wasm missing (scripts/stage-web calls scripts/wasm-to-r2 --local)`); process.exit(2); }
}
if (OLD) for (const f of ["index.html", "sw.js", "crash-the-stack.wasm"]) {
  if (!fs.existsSync(path.join(OLD, f))) { console.log(`SETUP-FAILED: --old ${OLD}/${f} missing (the previous publish's game tree)`); process.exit(2); }
}

const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".json": "application/json;charset=utf-8", ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json", ".xml": "application/rss+xml;charset=utf-8", ".ogg": "audio/ogg", ".txt": "text/plain;charset=utf-8", ".cts": "text/plain;charset=utf-8" };
// which tree answers at the root: the staged one, or (the tombstone leg's
// first half) the old game
let root = STAGED;
// paths the server treats as absent (the version-missing leg hides
// /version.json, and /404.html for the host that has none)
let hidden = new Set();
const requests = [];
const indexed = [];   // missing paths answered with the root index and 200 (a tree with no 404.html), for a red's detail
// A missing path is answered as Cloudflare Pages answers it (0.1.3; Harkfell's
// scripts/serve-site.mjs has the same rule): the nearest 404.html up the tree
// with status 404, and with no 404.html anywhere the root index.html with 200.
// The old server answered a bare 404 here, so no leg could see that the
// deployed site answered every missing path with its landing page and 200
// (topics/cloudflare-pages-serves-index-for-a-missing-path).
function readable(fp) { try { return fs.statSync(fp).isFile(); } catch { return false; } }
function notFound(urlPath) {
  let dir = path.posix.dirname(urlPath.endsWith("/") ? urlPath + "x" : urlPath);
  for (;;) {
    const rel = path.posix.join(dir, "404.html");
    if (!hidden.has(rel) && readable(path.join(root, rel))) return [404, path.join(root, rel)];
    if (dir === "/" || dir === ".") break;
    dir = path.posix.dirname(dir);
  }
  indexed.push(`${root === STAGED ? "staged" : "old"}:${urlPath}`);
  return [200, path.join(root, "index.html")];
}
function handler(req, res) {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  requests.push(urlPath);
  const rel = urlPath === "/" ? "/index.html" : (urlPath.endsWith("/") ? urlPath + "index.html" : urlPath);
  let fp = path.join(root, rel), status = 200;
  if (fp !== root && !fp.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (hidden.has(rel) || hidden.has(urlPath) || !readable(fp)) [status, fp] = notFound(urlPath);
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    res.writeHead(status, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
}
const server = http.createServer(handler);
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
// the analytics legs' server: the same tree with the staged _headers applied
// (Pages' format: a path pattern, then indented "Name: value" lines), so
// /jack-in/ and /tracker/ are cross-origin isolated from the first load as
// they are on crashthestack.com
const headerRules = [];
for (const line of fs.readFileSync(path.join(STAGED, "_headers"), "utf8").split("\n")) {
  if (/^\s*(#|$)/.test(line)) continue;
  if (!/^\s/.test(line)) headerRules.push({ re: new RegExp("^" + line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"), set: [] });
  else if (headerRules.length && line.includes(":")) { const i = line.indexOf(":"); headerRules[headerRules.length - 1].set.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
}
const pagesServer = http.createServer((req, res) => {
  const p = (req.url || "/").split("?")[0];
  // every matching rule applies; a header two rules set is joined, as Pages joins it
  const got = new Map();
  for (const r of headerRules) if (r.re.test(p)) for (const [k, v] of r.set) got.set(k.toLowerCase(), got.has(k.toLowerCase()) ? `${got.get(k.toLowerCase())}, ${v}` : v);
  for (const [k, v] of got) res.setHeader(k, v);
  handler(req, res);
});
await new Promise((r) => pagesServer.listen(0, "127.0.0.1", r));

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
let stub = null;   // plausible.io's stand-in (scripts/plausible-check.mjs)
function shutdown(code) {
  if (exiting) return; exiting = true;
  // the verdict first: the exit below sits in an unref'd timer, so a run whose
  // loop empties before it fires exits naturally, and without this it exits 0
  process.exitCode = code;
  try { server.close(); pagesServer.close(); } catch { /* not listening */ }
  if (stub) stub.close();
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
  if (stub) stub.onMessage(msg);
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    consoleLines.push(text);
    if (msg.params.type === "error") consoleErrors.push("console.error: " + text);
  }
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");
// no leg reaches the internet: https://plausible.io goes to a stub, and
// https://crashthestack.com (the analytics legs) to pagesServer
stub = await plausibleStub(send, { sites: { [`https://${PLAUSIBLE_HOST}`]: `http://127.0.0.1:${pagesServer.address().port}` } });
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
  if (!latest || !/^\/news\/[^/]+\/$/.test(latest[0])) detail.push(`no newest post on the landing (${JSON.stringify(latest)})`);
  const feeds = await evalJS(`Array.from(document.querySelectorAll('link[rel=alternate]')).map((l) => l.getAttribute('href')).join(' ')`);
  if (!/\/news\/feed\.xml/.test(feeds) || !/\/news\/feed\.json/.test(feeds)) detail.push(`feed links ${feeds}`);
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
  const index = text("news/index.html");
  const posts = fs.readdirSync(path.join(STAGED, "news")).filter((d) => fs.existsSync(path.join(STAGED, "news", d, "index.html")));
  const listed = Array.from(index.matchAll(/href="\/news\/([^/"]+)\/"/g)).map((m) => m[1]);
  const missing = posts.filter((p) => !listed.includes(p));
  if (missing.length) detail.push(`posts not on /news/: ${missing.join(", ")}`);
  const dates = Array.from(index.matchAll(/<time datetime="([^"]+)"/g)).map((m) => m[1]);
  const sorted = [...dates].sort().reverse();
  if (dates.join() !== sorted.join()) detail.push(`/news/ is not newest first: ${dates.join(" ")}`);
  const tracker = text("docs/tracker/index.html");
  if (!/Motif Tracker/.test(tracker)) detail.push("/docs/tracker/ is not the tracker manual");
  const trackerPage = text("tracker/index.html");
  if (!/crash-tracker/.test(trackerPage)) detail.push("/tracker/ is not the tracker page");
  // the pre-move deploy served the game from the root; none of its files may be there now
  // (the wasm lives under jack-in/w/<sha16>/ since the R2 move, never at the root)
  for (const f of ["crash-the-stack.wasm", "styles.css", "sigil-wasm-bridges.js"]) if (fs.existsSync(path.join(STAGED, f))) detail.push(`the old game's ${f} is at the root`);
  const headers = text("_headers");
  if (!/^\/jack-in\/\*/m.test(headers) || /^\/\*$/m.test(headers)) detail.push("_headers does not scope the isolation headers to /jack-in/*");
  if (detail.length) fail("pages", detail.join("; ")); else pass("pages", `/about/ carries the disclosure; /news/ lists ${posts.length} posts newest first; /docs/tracker/ and /tracker/ are what they should be; no game file at the root; _headers scoped`);
}

// ---- feeds ----------------------------------------------------------------
{
  const detail = [];
  const rss = text("news/feed.xml");
  const json = JSON.parse(text("news/feed.json"));
  if (!rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) detail.push("the RSS has no XML prolog");
  if (!/<rss version="2.0"/.test(rss)) detail.push("not RSS 2.0");
  const rssItems = Array.from(rss.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((m) => m[1]);
  const rssLinks = rssItems.map((i) => (i.match(/<link>([^<]+)<\/link>/) || [])[1]);
  const rssDates = rssItems.map((i) => (i.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1]);
  if (json.version !== "https://jsonfeed.org/version/1.1") detail.push(`JSON Feed version ${json.version}`);
  const jsonUrls = (json.items || []).map((i) => i.url);
  if (rssLinks.join() !== jsonUrls.join()) detail.push(`the two feeds list different posts: rss ${rssLinks.join(" ")} json ${jsonUrls.join(" ")}`);
  if (!rssLinks.length) detail.push("no entries");
  if (rssLinks.some((l) => !l.startsWith(SITE_URL + "/news/"))) detail.push(`an RSS link is not under ${SITE_URL}/news/: ${rssLinks.join(" ")}`);
  if (rssDates.some((d) => !/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} \+0000$/.test(d || ""))) detail.push(`an RSS pubDate is not RFC 822: ${rssDates.join(" | ")}`);
  if ((json.items || []).some((i) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(i.date_published || ""))) detail.push("a JSON Feed date_published is not RFC 3339");
  if (json.feed_url !== `${SITE_URL}/news/feed.json`) detail.push(`feed_url ${json.feed_url}`);
  if (!/<atom:link href="https:\/\/crashthestack\.com\/news\/feed\.xml" rel="self"/.test(rss)) detail.push("no atom self link");
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
    if (at !== `${origin}/jack-in/?trace&code=${CODE}`) {
      // why: what the old page is fetching (its worker answers most from its
      // cache, which never reaches the server: the page's own resource
      // entries see those too), and which paths got the index with 200
      const seen = await evalJS(`(() => { const n = {}; for (const e of performance.getEntriesByType("resource")) { const p = new URL(e.name).pathname; n[p] = (n[p] || 0) + 1; } return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p, c]) => p + " x" + c).join(" "); })()`).catch(() => "unreadable");
      const cache = await evalJS(`caches.keys().then((ks) => Promise.all(ks.map((k) => caches.open(k).then((c) => c.keys()).then((rs) => Promise.all(rs.map((r) => caches.match(r).then((res) => res && /text\\/html/.test(res.headers.get("content-type") || "") && !/\\/$|index\\.html$/.test(new URL(r.url).pathname) ? new URL(r.url).pathname : null))))))).then((xs) => xs.flat().filter(Boolean).join(" "))`).catch(() => "unreadable");
      detail.push(`after the deploy the old client sits at ${at} (requests since: ${requests.slice(before).join(" ")}; the page's resource entries: ${seen}; cached as HTML: ${cache || "none"}; answered with the index: ${indexed.join(" ") || "none"})`);
    }
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
  // The legs after this one test the NEW site, so they must not inherit this
  // leg's worker. A red tombstone leaves the old root worker controlling the
  // whole origin, and it answers every later navigation (/jack-in/ included)
  // with its cached old game page: the 0.1.3 gate saw version-missing and
  // console go red that way, downstream of this leg's own red. Clear it, as
  // the leg does before it starts.
  await navigate("about:blank");
  await send("Storage.clearDataForOrigin", { origin, storageTypes: "service_workers,cache_storage" });
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

// ---- version ----------------------------------------------------------------
// /version.json is what the game asks to find out whether a newer release
// exists and what to say about it. It is generated by publish-web into the
// staged tree, so the thing to check is that it DESCRIBES THIS TREE: a
// version.json left over from a previous publish would parse perfectly and
// announce the wrong build, which is the failure this leg exists for.
//
// The summary gets two checks the site cannot see the point of on its own.
// It is drawn in the game's HUD, in a 5x7 font of 56 characters, on a row
// that holds 91 of them. A curly quote or a long sentence in a News post's
// front matter would draw a hole or take a second HUD row, and nobody
// looking at the website would ever notice.
{
  const detail = [];
  const FONT = "!#$'()+,-./0123456789:;<=>?[]^abcdefghijklmnopqrstuvwxyz ";
  const LINE2_CHARS = 91;
  let v = null;
  if (!fs.existsSync(path.join(STAGED, "version.json"))) {
    detail.push("version.json is missing (publish-web generates it into the staged tree)");
  } else {
    try { v = JSON.parse(text("version.json")); } catch (e) { detail.push(`version.json does not parse: ${e.message}`); }
  }
  if (v) {
    for (const k of ["version", "released", "build", "summary", "news"]) {
      if (!v[k]) detail.push(`version.json has no ${k}`);
    }
    // the stamp the page carries is the truth about which bytes these are
    const stamp = (/version: "([^"]+)"/.exec(text("jack-in/index.html")) || [])[1];
    if (!stamp) detail.push("jack-in/index.html carries no build stamp to check version.json against");
    else if (v.build !== stamp) detail.push(`version.json says build ${v.build}, the staged game is ${stamp}`);
    if (v.summary) {
      const bad = [...new Set([...v.summary].filter((c) => !FONT.includes(c.toLowerCase())))];
      if (bad.length) detail.push(`version.json's summary uses characters the game's font cannot draw: ${bad.join(" ")}`);
      if (v.summary.length > LINE2_CHARS) detail.push(`version.json's summary is ${v.summary.length} characters; the game's HUD row holds ${LINE2_CHARS}`);
    }
    if (v.released && !/^\d{4}-\d{2}-\d{2}$/.test(v.released)) detail.push(`version.json's released is "${v.released}", not YYYY-MM-DD`);
    if (v.news && !/^\/news\/[^/]+\/$/.test(v.news)) detail.push(`version.json's news is "${v.news}", not /news/<slug>/`);
  }
  const headers = text("_headers");
  if (!/\/version\.json[\s\S]*?Cache-Control:\s*no-cache/.test(headers)) {
    detail.push("_headers does not serve /version.json no-cache, so a stale copy would keep announcing an old release");
  }
  if (detail.length) fail("version", detail.join("; "));
  else pass("version", `/version.json is ${v.version} (${v.released}), build ${v.build} matching the staged game, summary ${v.summary.length}/${LINE2_CHARS} chars and drawable, served no-cache`);
}

// ---- not-found (0.1.3) ----------------------------------------------------------
// A missing path is a real 404: the site's own 404.html, status 404, HTML. The
// server answers as Pages does, so without a 404.html in the staged tree
// every probe below answers 200 with the landing page, and this leg says so
// (its sabotage: stage without 404.html). /about/ is the positive control:
// a real page still answers 200.
{
  const detail = [];
  const probes = ["/definitely-not-here", "/news/no-such-post/", "/jack-in/assets/no-such.png", "/version.jsonx"];
  for (const p of probes) {
    const r = await fetch(`${origin}${p}`);
    const type = (r.headers.get("content-type") || "").split(";")[0];
    const body = await r.text();
    if (r.status !== 404) detail.push(`${p} answered ${r.status}${/JACK IN/.test(body) && /class="hero"/.test(body) ? " with the landing page" : ""}`);
    else if (type !== "text/html") detail.push(`${p} answered 404 as ${type}`);
    else if (!/404: link severed/.test(body)) detail.push(`${p} answered 404 but not with the site's 404 page`);
  }
  const about = await fetch(`${origin}/about/`);
  if (about.status !== 200) detail.push(`the control /about/ answered ${about.status}`);
  if (detail.length) fail("not-found", detail.join("; "));
  else pass("not-found", `${probes.length} missing paths answered 404 with the site's 404 page (${probes.join(" ")}); /about/ 200`);
}

// ---- preview (0.1.3) ----------------------------------------------------------
// A shared link shows a real board, not the app icon: every page a link can
// point at carries og:image = the gameplay shot and Twitter's large card, and
// the shot is a 1200x630 PNG in the tree. The soundtrack page links /news/,
// not the /devlog/ the news left behind.
{
  const detail = [];
  const OG = "https://crashthestack.com/og-image.png";
  for (const p of ["index.html", "about/index.html", "news/index.html", "jack-in/index.html"]) {
    const html = text(p);
    const og = (/<meta property="og:image" content="([^"]+)"/.exec(html) || [])[1];
    const card = (/<meta name="twitter:card" content="([^"]+)"/.exec(html) || [])[1];
    if (og !== OG) detail.push(`${p}: og:image is ${og || "absent"}`);
    if (card !== "summary_large_image") detail.push(`${p}: twitter:card is ${card || "absent"}`);
    if (!/<meta (property|name)="(og|twitter):description"/.test(html)) detail.push(`${p}: no description card`);
  }
  if (!fs.existsSync(path.join(STAGED, "og-image.png"))) detail.push("og-image.png is not in the tree");
  else {
    const png = fs.readFileSync(path.join(STAGED, "og-image.png"));
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    if (png.toString("ascii", 1, 4) !== "PNG" || w !== 1200 || h !== 630) detail.push(`og-image.png is ${w}x${h}, not a 1200x630 PNG`);
  }
  const og = await fetch(`${origin}/og-image.png`);
  if (og.status !== 200 || !/^image\/png/.test(og.headers.get("content-type") || "")) detail.push(`/og-image.png answered ${og.status} ${og.headers.get("content-type")}`);
  const stale = (text("soundtrack/index.html").match(/href="\/devlog\/[^"]*"/g) || []);
  if (stale.length) detail.push(`the soundtrack page still links ${stale.join(" ")}`);
  if (detail.length) fail("preview", detail.join("; "));
  else pass("preview", `the landing, /about/, /news/ and /jack-in/ carry og:image ${OG} and summary_large_image; the shot is 1200x630; the soundtrack page links /news/`);
}

// ---- devlog (2026-09-26) ---------------------------------------------------------
// The retired devlog's paths all 301 to /news/, and its feeds to the news
// feeds, by the staged _redirects as Cloudflare Pages reads it: the first
// rule whose source matches wins, a trailing * matches any rest of the path.
// This arm's server does not apply _redirects, so the leg resolves the file
// itself. Before these rules the live /devlog/ answered 200 with the old
// listing from the edge's cache. /news/ itself must not redirect (the
// control), and the tree must hold no devlog/ output for a rule to shadow.
{
  const detail = [], seen = [];
  const rules = text("_redirects").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.split(/\s+/));
  const resolve = (p) => {
    for (const [from, to, code] of rules) {
      if (from.endsWith("*") ? p.startsWith(from.slice(0, -1)) : p === from) return `${code || "302"} ${to}`;
    }
    return "none";
  };
  const want = [
    ["/devlog", "301 /news/"], ["/devlog/", "301 /news/"],
    ["/devlog/early-and-in-the-open/", "301 /news/"], ["/devlog/the-trace-has-phases/", "301 /news/"],
    ["/devlog/the-classics-are-sacred/", "301 /news/"], ["/devlog/three-tries/", "301 /news/"],
    ["/devlog/feed.json", "301 /news/feed.json"], ["/devlog/feed.xml", "301 /news/feed.xml"],
    ["/news/", "none"],
  ];
  for (const [p, w] of want) { const got = resolve(p); if (got !== w) detail.push(`${p} resolves to ${got}, not ${w}`); else seen.push(`${p} ${got}`); }
  if (fs.existsSync(path.join(STAGED, "devlog"))) detail.push("the tree has a devlog/ directory");
  const news = text("news/index.html");
  if (!/<h1>News<\/h1>/.test(news)) detail.push(`/news/ is headed ${(/<h1>([^<]*)<\/h1>/.exec(news) || [])[1] || "nothing"}, not News`);
  if (detail.length) fail("devlog", detail.join("; "));
  else pass("devlog", `${seen.length} paths by _redirects: ${seen.join(", ")}; no devlog/ in the tree; /news/ headed News`);
}

// ---- crosslink (2026-09-26) ------------------------------------------------------
// Every page's footer links the other Flux Harmonic game, beside the studio link.
{
  const detail = [];
  const pages = ["index.html", "about/index.html", "news/index.html", "docs/tracker/index.html", "soundtrack/index.html", "404.html"];
  for (const p of pages) {
    const foot = (/<footer class="foot">([\s\S]*?)<\/footer>/.exec(text(p)) || [])[1];
    if (!foot) { detail.push(`${p}: no footer`); continue; }
    if (!/<p>Also from Flux Harmonic: <a href="https:\/\/harkfell\.com\/">Harkfell<\/a><\/p>/.test(foot)) detail.push(`${p}: the footer does not link Harkfell`);
    if (!/href="https:\/\/fluxharmonic\.com"/.test(foot)) detail.push(`${p}: the footer lost the Flux Harmonic link`);
  }
  if (detail.length) fail("crosslink", detail.join("; "));
  else pass("crosslink", `${pages.length} pages' footers link Harkfell beside Flux Harmonic (${pages.join(" ")})`);
}

// ---- version-missing (0.1.3, t-5bb869) -------------------------------------------
// The game's version fetch must take its "missing" branch for BOTH answers
// a host gives a missing /version.json: a real 404 (the site with its
// 404.html), and 200 with the landing's HTML (a host with no 404.html, as
// Pages answered before 0.1.3). The second is the bug: r.ok is true, so
// only r.json() throwing on the HTML kept the readout honest, through the
// catch ("crash: version.json none ..."). The ?update=waiting door runs the
// page's real fetch. Sabotage: drop the content-type check, and the 200
// case logs "none" (the catch), never "missing 200".
{
  const detail = [], seen = [];
  for (const [hide, want] of [[["/version.json"], "missing 404 text/html"], [["/version.json", "/404.html"], "missing 200 text/html"]]) {
    hidden = new Set(hide);
    const mark = consoleLines.length;
    await navigate(`${origin}/jack-in/?trace&fresh&update=waiting`);
    const line = await waitLine(/^crash: version\.json (.+)$/, mark, 60000);
    if (!line) detail.push(`hiding ${hide.join(" ")}: the page said nothing about version.json`);
    else if (line.m[1] !== want) detail.push(`hiding ${hide.join(" ")}: "crash: version.json ${line.m[1]}", not "${want}"`);
    else seen.push(`${hide.join("+")} -> ${want}`);
  }
  hidden = new Set();
  if (detail.length) fail("version-missing", detail.join("; "));
  else pass("version-missing", seen.join("; "));
}

// ---- webgl (2026-09-29) ------------------------------------------------------------
// A browser with no WebGL 2 got "Failed to start: sigil_wasm_start failed
// (rc -1)" on both pages. scripts/webgl-check.mjs, one Chrome per case,
// against this server: WebGL off (the message, the loader switched off, no
// wasm; on the game, no service worker either, past the 90 s live timeout
// that registers it), WebGL 1 only, a context refused to the stage alone
// (the message in place of the raw error), and WebGL on (no message, the
// app started).
{
  const cases = [
    // (the line is logged once crashLive resolves: 90 s with no game)
    ["jack-in", "off", ["--wait", "100000", "--line", "^log: crash: sw not registered \\(no WebGL 2\\)$", "--no-sw"]],
    ["jack-in", "webgl1", []], ["jack-in", "late", []], ["jack-in", "on", []],
    ["tracker", "off", []], ["tracker", "webgl1", []], ["tracker", "late", []], ["tracker", "on", []],
  ];
  for (const [page, mode, extra] of cases) {
    const r = await new Promise((resolve) => {
      const ch = spawn("node", [path.join(path.dirname(fileURLToPath(import.meta.url)), "scripts/webgl-check.mjs"),
        "--url", `${origin}/${page}/`, "--mode", mode, "--wait", "2500", ...extra]);
      let o = "";
      ch.stdout.on("data", (d) => { o += d; }); ch.stderr.on("data", (d) => { o += d; });
      const kill = setTimeout(() => ch.kill("SIGKILL"), 240000);
      ch.on("close", (code) => { clearTimeout(kill); resolve({ status: code, out: o }); });
    });
    const verdict = r.out.trim().split("\n").pop();
    if (r.status === 0 && verdict === `PASS ${mode}`) pass("webgl", `/${page}/ ${mode}: ${{ off: "WebGL off: the message, no wasm" + (page === "jack-in" ? ", no service worker after 100 s" : ""),
      webgl1: "WebGL 1 only: the message, no wasm", late: "no context for the stage: the message, not the raw error", on: "WebGL 2: no message, the app started" }[mode]}`);
    else fail("webgl", `/${page}/ ${mode}: rc ${r.status}: ${r.out.split("\n").filter((l) => /FAIL|SETUP|TIMED/.test(l)).join(" | ").slice(0, 400)}`);
  }
}

// ---- analytics (no browser): the tag on every HTML page -------------------------------
{
  const { pages, problems } = auditTree(STAGED, PLAUSIBLE_ID, { gated: ["jack-in/index.html", "tracker/index.html"], host: PLAUSIBLE_HOST });
  // a floor, so an empty walk is no pass
  for (const p of ["index.html", "404.html", "about/index.html", "news/index.html", "docs/tracker/index.html", "soundtrack/index.html", "jack-in/index.html", "tracker/index.html"]) if (!pages.includes(p)) problems.push(`${p} is not in the tree`);
  if (!pages.some((p) => /^news\/[^/]+\/index\.html$/.test(p))) problems.push("no news post page in the tree");
  if (problems.length) fail("analytics", problems.slice(0, 6).join("; "));
  else pass("analytics", `${pages.length} HTML pages carry the snippet with ${PLAUSIBLE_ID} once, in <head>; jack-in/ and tracker/ the gated one (${PLAUSIBLE_HOST} only)`);
}

// ---- sw: the game's worker leaves plausible.io alone -----------------------------------
// The staged worker's own bytes in a sandbox. Its install is dispatched and
// what it precaches recorded; then every fetch listener, in order, as a
// worker runs them, is handed each of plausible.io's requests and must not
// call respondWith (a worker that answers one could cache it or hold it).
// A same-origin GET must be answered, or the sandbox proves nothing. (The
// review, 2026-09-30: the first version kept only the last listener and
// never ran install.)
{
  const detail = [];
  const listeners = {};
  const scope = "https://crashthestack.com/jack-in/";
  const precached = [];
  const urlOf = (r) => new URL(typeof r === "string" ? r : r.url, scope).href;
  class ScopedRequest extends Request { constructor(u, o) { super(typeof u === "string" ? new URL(u, scope).href : u, o); } }
  const cache = { match: async () => undefined, put: async (r) => { precached.push(urlOf(r)); }, add: async (r) => { precached.push(urlOf(r)); },
                  addAll: async (rs) => { for (const r of rs) precached.push(urlOf(r)); }, keys: async () => [] };
  const sandbox = {
    self: { location: new URL(scope + "sw.js"), addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); }, skipWaiting() {}, clients: { claim: async () => {} } },
    caches: { open: async () => cache, match: async () => undefined, keys: async () => [], delete: async () => true },
    fetch: async () => new Response("", { status: 200 }), Request: ScopedRequest, Response, Headers, URL, Promise, console,
  };
  try { vm.runInNewContext(text("jack-in/sw.js"), sandbox, { filename: "jack-in/sw.js" }); } catch (e) { detail.push(`jack-in/sw.js did not run: ${e.message}`); }
  // install: whatever it precaches, none of it from plausible.io
  const waits = [];
  for (const fn of listeners.install || []) {
    try { fn({ waitUntil: (p) => waits.push(Promise.resolve(p)) }); } catch (e) { detail.push(`install threw: ${e.message}`); }
  }
  const settled = await Promise.allSettled(waits);
  for (const r of settled) if (r.status === "rejected") detail.push(`install failed: ${String(r.reason).slice(0, 120)}`);
  const bad = precached.filter((u) => new URL(u).hostname === "plausible.io");
  if (bad.length) detail.push(`install precaches ${bad.join(", ")}`);
  if (!precached.length) detail.push("install precached nothing (the sandbox is not running it)");
  const answered = (url, method, mode) => {
    let called = false;
    const event = { request: { url, method, mode, headers: new Headers() }, respondWith: (p) => { called = true; Promise.resolve(p).catch(() => {}); } };
    for (const fn of listeners.fetch || []) {
      try { fn(event); } catch (e) { detail.push(`a fetch listener threw on ${method} ${url}: ${e.message}`); }
      if (called) break;
    }
    return called;
  };
  if (!(listeners.fetch || []).length) detail.push("jack-in/sw.js registered no fetch handler");
  else {
    for (const [url, method, mode] of [[`https://plausible.io/js/${PLAUSIBLE_ID}.js`, "GET", "no-cors"], ["https://plausible.io/api/event", "POST", "cors"],
                                       ["https://plausible.io/api/event", "POST", "no-cors"], ["https://plausible.io/api/event", "GET", "cors"]]) {
      if (answered(url, method, mode)) detail.push(`the worker answers ${method} ${url} (${mode})`);
    }
    if (!answered(scope + "styles.css", "GET", "no-cors")) detail.push("the control: the worker did not answer GET /jack-in/styles.css (the sandbox is not running its handler)");
  }
  if (detail.length) fail("sw", detail.join("; "));
  else pass("sw", `jack-in/sw.js precaches ${precached.length} files, none from plausible.io; ${listeners.fetch.length} fetch listener(s) answer a same-origin GET and leave plausible.io's script GET and event POST (fetch and beacon) to the network`);
}

// ---- itch: the game on a host that is not crashthestack.com ----------------------------
{
  const detail = [];
  for (const p of ["/jack-in/", "/tracker/"]) {
    const s0 = stub.scripts.length, e0 = stub.events.length;
    await navigate(`${origin}${p}`);
    if (p === "/jack-in/") { if (!(await gameUp(60000))) detail.push(`${p}: the game never came up`); }
    else await sleep(3000);
    await sleep(1500);
    const loaded = await evalJS("!!(window.plausible && window.plausible.l)").catch(() => null);
    if (stub.scripts.length !== s0 || stub.events.length !== e0 || loaded !== false) detail.push(`${p} at ${origin}: ${stub.scripts.length - s0} script and ${stub.events.length - e0} event requests to plausible.io; the script ${loaded ? "ran" : "did not run"}`);
  }
  if (detail.length) fail("itch", detail.join("; "));
  else pass("itch", `/jack-in/ and /tracker/ at ${origin}, not ${PLAUSIBLE_HOST} (as on itch.io): no request to plausible.io, no script`);
}

// ---- analytics, in Chrome, at https://crashthestack.com ----------------------------------
// (the game's worker is kept from registering on this origin: its install
// fetches its files from the worker, outside this page's interception, so
// they would reach the live site)
const NO_SW = `if (location.hostname === ${JSON.stringify(PLAUSIBLE_HOST)} && navigator.serviceWorker) navigator.serviceWorker.register = function () { return new Promise(function () {}); };`;
const noSw = await send("Page.addScriptToEvaluateOnNewDocument", { source: NO_SW });
{
  const detail = []; const got = [];
  const H = `https://${PLAUSIBLE_HOST}`;
  const missing = `/no-such-page-${Date.now()}`;
  const post = fs.readdirSync(path.join(STAGED, "news")).filter((d) => fs.existsSync(path.join(STAGED, "news", d, "index.html"))).sort().pop();
  if (!post) detail.push("no news post to visit");
  for (const p of ["/", "/about/", "/news/", post && `/news/${post}/`, "/soundtrack/", missing, "/jack-in/", "/tracker/"].filter(Boolean)) {
    await navigate(H + p);
    if (p === "/jack-in/" && !(await gameUp(60000))) detail.push(`${p}: the game never came up at ${H}`);
    const st = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 10000) { const v = await evalJS("window.__plausibleStub && window.__plausibleStub.length ? JSON.stringify({ st: window.__plausibleStub, coi: self.crossOriginIsolated, href: location.href }) : null").catch(() => null); if (v) return JSON.parse(v); await sleep(150); } return null; })();
    const evs = stub.events.filter((e) => e.body && e.body.u === H + p && e.body.n === "pageview");
    if (!st) detail.push(`${p}: no event status came back to the page (the script did not run, or its POST failed)`);
    else if (!st.st.includes(202)) detail.push(`${p}: the page got ${JSON.stringify(st.st)}, not 202`);
    else if (st.href !== H + p) detail.push(`${p}: the status came from ${st.href}, not ${H + p}`);
    if (!evs.length) detail.push(`${p}: the stub received no pageview for ${H + p}`);
    if ((p === "/jack-in/" || p === "/tracker/") && (!st || st.coi !== true)) detail.push(`${p} is not cross-origin isolated with the analytics loaded (${st && st.coi})`);
    if (st) got.push(p === missing ? "(404)" : p);
  }
  const wrongScript = stub.scripts.filter((sc) => sc.id !== PLAUSIBLE_ID);
  if (wrongScript.length) detail.push(`scripts requested for other IDs: ${[...new Set(wrongScript.map((sc) => sc.id))].join(", ")}`);
  const wrongDomain = stub.events.filter((e) => !e.body || e.body.d !== PLAUSIBLE_HOST);
  if (wrongDomain.length) detail.push(`${wrongDomain.length} event(s) not for ${PLAUSIBLE_HOST}: ${JSON.stringify(wrongDomain[0].body).slice(0, 120)}`);
  if (detail.length) fail("analytics", detail.slice(0, 6).join("; "));
  else pass("analytics", `at ${H}: ${got.join(", ")} each loaded the script and sent a pageview for ${PLAUSIBLE_HOST} that came back 202; /jack-in/ and /tracker/ cross-origin isolated with it (${stub.scripts.length} script requests, ${stub.events.length} events over the run)`);
}

// ---- coep: the isolated page really judges plausible.io's CORP --------------------------
// (the review, 2026-09-30: without this, "isolated with the script loaded"
// could not tell "COEP passed the script" from "COEP never looked")
{
  const detail = [];
  const H = `https://${PLAUSIBLE_HOST}`;
  stub.setMode("nocorp");
  const s0 = stub.scripts.length, e0 = stub.events.length;
  await navigate(`${H}/jack-in/`);
  if (!(await gameUp(60000))) detail.push("/jack-in/: the game never came up");
  await sleep(4000);
  const st = await evalJS("JSON.stringify({ st: window.__plausibleStub || null, coi: self.crossOriginIsolated, l: !!(window.plausible && window.plausible.l) })").then(JSON.parse).catch(() => null);
  if (stub.scripts.length === s0) detail.push("the script was never requested (the leg judged nothing)");
  if (!st || st.coi !== true) detail.push(`/jack-in/ is not cross-origin isolated (${st && st.coi})`);
  else if (st.l || st.st || stub.events.length !== e0) detail.push(`a plausible.io script without CORP ran on the isolated page (events ${stub.events.length - e0}, status ${JSON.stringify(st.st)})`);
  stub.setMode("stub");
  if (detail.length) fail("coep", detail.join("; "));
  else pass("coep", "/jack-in/ at crashthestack.com asked for a plausible.io script sent without CORP and COEP blocked it; the page stayed isolated");
}

// ---- privacy ---------------------------------------------------------------------------
{
  await navigate(`${origin}/`);
  await sleep(1000);
  const foot = await evalJS("(() => { const f = document.querySelector('footer'); if (!f) return null; const a = [...f.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Plausible'); return { text: f.innerText, link: a ? a.href : null }; })()").catch(() => null);
  if (!foot) fail("privacy", "the landing has no <footer>");
  else if (!foot.text.includes(PRIVACY)) fail("privacy", `the landing's footer does not say "${PRIVACY}"`);
  else if (foot.link !== "https://plausible.io/data-policy") fail("privacy", `the footer's "Plausible" links ${foot.link || "nowhere"}, not https://plausible.io/data-policy`);
  else pass("privacy", `the landing's footer says "${PRIVACY}", Plausible linking its data policy`);
}

// ---- analytics-down: plausible.io unreachable --------------------------------------------
{
  stub.setMode("down");
  const detail = []; const H = `https://${PLAUSIBLE_HOST}`;
  const f0 = stub.failed.length, e0 = consoleErrors.length;
  await navigate(`${H}/`);
  await sleep(2000);
  const title = await evalJS("document.title").catch(() => null);
  if (title !== "Crash The Stack") detail.push(`/: the landing did not render (title ${JSON.stringify(title)})`);
  const f1 = stub.failed.length;
  await navigate(`${H}/jack-in/`);
  if (!(await gameUp(60000))) detail.push("/jack-in/: the game never came up with plausible.io unreachable");
  await sleep(1500);
  const isolated = await evalJS("self.crossOriginIsolated").catch(() => null);
  if (isolated !== true) detail.push(`/jack-in/ is not cross-origin isolated (${isolated})`);
  const errs = consoleErrors.slice(e0);
  if (errs.length) detail.push(`errors: ${errs.slice(0, 3).join(" | ")}`);
  // the positive control: plausible.io really was refused on both pages
  if (f1 - f0 < 1 || stub.failed.length - f1 < 1) detail.push(`plausible.io was not refused on both pages (${f1 - f0} and ${stub.failed.length - f1})`);
  stub.setMode("stub");
  if (detail.length) fail("analytics-down", detail.join("; "));
  else pass("analytics-down", `with plausible.io refused (${stub.failed.length - f0} requests), the landing renders and /jack-in/ comes up, isolated, with no error or exception`);
}
await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: noSw.identifier });
await send("Storage.clearDataForOrigin", { origin: `https://${PLAUSIBLE_HOST}`, storageTypes: "all" }).catch(() => {});

// ---- console ----------------------------------------------------------------
{
  const sokol =consoleLines.filter((l) => /^sokol\[level=[01]\]/.test(l));
  // the tombstone leg's own window is left out: the old page's fetches die
  // as the tree switches under it, which is what a deploy does to it
  const errors = consoleErrors.filter((e, i) => !(i >= tombstoneWindow[0] && i < tombstoneWindow[1]) && !/image fetch failed: TypeError: Failed to fetch|Failed to load resource: net::ERR_FAILED/.test(e));
  if (sokol.length || errors.length) fail("console", `${errors.length} error(s), ${sokol.length} sokol refusal(s): ${errors.slice(0, 3).join(" | ")} ${sokol.slice(0, 2).join(" | ")}`);
  else pass("console", `${consoleLines.length} console lines, 0 errors, no sokol refusal`);
}

console.log(`RESULT: ${results.filter((r) => r.startsWith("PASS")).length} passed, ${failed} failed, ${results.filter((r) => r.startsWith("SKIP")).length} skipped`);
shutdown(failed ? 1 : 0);
