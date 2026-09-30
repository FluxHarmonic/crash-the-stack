// plausible-check.mjs - the Plausible Analytics tag, for the site gates of
// the three Flux Harmonic game sites (the same file in Phantom Burn,
// Harkfell and Crash The Stack; each passes its own site's script ID).
//
//   import { auditTree, plausibleStub, PRIVACY } from "./plausible-check.mjs";
//   node scripts/plausible-check.mjs --live ID    (needs the internet)
//
// auditTree(DIR, ID, { gated, host }) reads every .html file under a staged
// tree and returns { pages, problems }: each page must carry David's snippet
// (below) exactly once, inside <head>, with this site's script ID, and name
// no other plausible.io script. The pages listed in gated carry the gated
// snippet instead: the same, except that the script tag is added only when
// the page is on host (or www.host), so a copy of the game page played
// elsewhere (the itch.io build, whose zip is the same web build) loads no
// script and sends nothing. The comparison ignores indentation only.
//
// plausibleStub(send, { mode }) stands in for plausible.io in a headless
// Chrome driven over CDP, so no gate depends on the internet (and nothing a
// gate does reaches David's stats). It pauses every https://plausible.io/*
// request and sends it on to a loopback server of its own (Fetch
// continueRequest with a new url: the page still sees plausible.io). The
// response then takes Chrome's real network path, so COEP judges it: a
// response made up in CDP (Fetch.fulfillRequest) is NOT judged, and a stub
// without CORP loaded on a require-corp page that way (measured 2026-09-30).
//   mode "stub"    the script, for the three known IDs (any other ID is a
//                  404, as plausible.io answers), with plausible.io's own
//                  headers (measured 2026-09-30: CORP cross-origin, ACAO *);
//                  an event POST answers 202 with ACAO *, and is recorded
//   mode "nocorp"  the same without the CORP header (sabotage: on a
//                  require-corp page the script must then be blocked)
//   mode "down"    every request fails (connection refused): plausible.io
//                  unreachable, or blocked by the visitor
// The stub script is not Plausible's: it keeps the queue-and-init contract
// the snippet relies on (plausible.q, plausible.o, plausible.init), sends
// one pageview to init's endpoint (default https://plausible.io/api/event)
// with the domain its ID belongs to, and pushes each event's HTTP status
// (or "error ...") onto window.__plausibleStub. The real script sends
// nothing from these harnesses anyway: it ignores localhost and 127.x, and
// a CDP-driven Chrome has navigator.webdriver true (both measured).
//
// { sites: { "https://harkfell.com": "http://127.0.0.1:PORT" } } also answers
// every request for that origin from the local server (the page keeps its
// URL, so it runs at its real hostname in a secure context: the gated
// snippet's own-host path, and cross-origin isolation, are exercised).
// These are fetched here and handed over whole (Fetch.fulfillRequest), with
// the server's headers: a rewritten URL would make Chrome judge the site's
// own CORP same-origin against 127.0.0.1 and block its same-origin scripts
// (measured). Only plausible.io's requests take the rewrite, because for
// them COEP's judgment is the thing under test. Each site origin is granted
// Chrome's localNetworkAccess permission, or the rewritten plausible.io
// request (a public page reaching 127.0.0.1) fails LocalNetworkAccess-
// PermissionDenied before the stub sees it (measured, Chrome 143).
//
// The caller forwards every CDP message to stub.onMessage(msg) and calls
// stub.close() at the end. stub.events lists the POSTs ({ body, origin,
// contentType }), stub.scripts the script requests ({ id, known }),
// stub.failed the requests failed in "down" mode. stub.setMode(m) switches.
//
// --live asks the real plausible.io what the stub assumes: the script's
// CORP and ACAO, and an event POST's status and ACAO (sent for the domain
// "coep-probe.invalid", which Plausible drops: x-plausible-dropped). A
// change there is what would break the cross-origin-isolated game pages.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

// every Flux Harmonic site's script ID, so a page carrying another site's is named
export const SITES = {
  "pa-5iTMFNFjYxMn3THin-cwJ": "crashthestack.com",
  "pa-N4Ba55rWhDJmIzpZceg0x": "harkfell.com",
  "pa-GxdOlotIbYY0LzO4WRsIV": "phantomburn.net",
};
export const PRIVACY = "Privacy-friendly analytics by Plausible: no cookies, no personal data.";
export const EVENT_URL = "https://plausible.io/api/event";

// David's snippet (2026-09-30), with this site's ID
export function snippet(id) {
  return [
    "<!-- Privacy-friendly analytics by Plausible -->",
    `<script async src="https://plausible.io/js/${id}.js"></script>`,
    "<script>",
    "  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};",
    "  plausible.init()",
    "</script>",
  ].join("\n");
}
// the game page's variant: the script only on the site's own host
export function snippetGated(id, host) {
  const re = "/^(www\\.)?" + host.replace(/\./g, "\\.") + "$/";
  return [
    `<!-- Privacy-friendly analytics by Plausible (on ${host} only: a copy played elsewhere, such as the itch.io build, sends nothing) -->`,
    "<script>",
    `  if (${re}.test(location.hostname)) (function (s) { s.async = true; s.src = "https://plausible.io/js/${id}.js"; document.head.appendChild(s); })(document.createElement("script"));`,
    "  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};",
    "  plausible.init()",
    "</script>",
  ].join("\n");
}
const squash = (s) => s.replace(/\s+/g, " ");
const count = (hay, needle) => { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; };

// the problems with one page's tag (an empty list when it is right)
export function auditPage(html, id, host = null) {
  const out = [];
  const flat = squash(html), want = squash(host ? snippetGated(id, host) : snippet(id));
  const n = count(flat, want);
  if (n !== 1) out.push(`the ${host ? `gated snippet (${host} only)` : "snippet"} with ${id} is there ${n} times (want 1)`);
  // one script reference in all (the other variant, or a stray tag, is a second)
  const refs = count(html, "plausible.io/js/");
  if (refs !== 1) out.push(`${refs} plausible.io script references (want 1)`);
  const others = [...html.matchAll(/plausible\.io\/js\/([^"'\s>]*)/g)].map((m) => m[1]).filter((r) => r !== `${id}.js`);
  if (others.length) out.push(`other plausible.io scripts: ${others.map((r) => { const s = SITES[r.replace(/\.js$/, "")]; return s ? `${r} (${s}'s)` : r; }).join(", ")}`);
  // where it runs: after <head> opens and before it closes, and not inside an
  // element whose content never runs as markup (the review, 2026-09-30:
  // a snippet in <noscript>, <template>, <style>, <textarea>, <title>, or
  // before <head>, passed a presence check)
  if (n === 1) {
    const at = flat.indexOf(want);
    const open = flat.search(/<head[\s>]/i), close = flat.search(/<\/head>/i);
    if (open < 0 || close < 0 || at < open || at > close) out.push("the snippet is not inside <head>");
    else {
      const before = flat.slice(open, at).replace(/<!--[\s\S]*?-->/g, "");
      for (const tag of ["noscript", "template", "style", "textarea", "title", "script", "xmp", "iframe", "noembed", "noframes"]) {
        const opens = (before.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
        const closes = (before.match(new RegExp(`</${tag}>`, "gi")) || []).length;
        if (opens > closes) out.push(`the snippet is inside <${tag}>, where it never runs`);
      }
      if (/<!--(?![\s\S]*?-->)/.test(flat.slice(open, at))) out.push("the snippet is inside an HTML comment");
    }
  }
  return out;
}

export function auditTree(dir, id, { gated = [], host = null } = {}) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const pages = walk(dir).filter((f) => /\.html?$/i.test(f)).map((f) => path.relative(dir, f)).sort();
  const problems = [];
  for (const g of gated) if (!pages.includes(g)) problems.push(`${g}: not in the tree (it should carry the gated snippet)`);
  for (const p of pages) for (const why of auditPage(fs.readFileSync(path.join(dir, p), "utf8"), id, gated.includes(p) ? host : null)) problems.push(`${p}: ${why}`);
  return { pages, problems };
}

export function stubScript(domain) {
  return `/* a stand-in for plausible.io's script (the site gate's stub; not Plausible's code) */
!function(){var o={},D=${JSON.stringify(domain)};
window.__plausibleStub=window.__plausibleStub||[];
function send(n,x){var b={n:n,u:(x&&(x.u||x.url))||location.href,d:D,r:document.referrer||null,v:"stub"};
if(x&&x.props)b.p=x.props;
fetch(o.endpoint,{method:"POST",headers:{"Content-Type":"text/plain"},keepalive:true,body:JSON.stringify(b)})
.then(function(r){window.__plausibleStub.push(r.status);x&&x.callback&&x.callback({status:r.status})},
function(e){window.__plausibleStub.push("error "+e);x&&x.callback&&x.callback({error:e})})}
function S(i){if(window.plausible&&window.plausible.l)return;
var q=window.plausible&&window.plausible.q||[];
o=Object.assign({endpoint:${JSON.stringify(EVENT_URL)}},i||{});
window.plausible=function(n,x){send(n,x)};window.plausible.init=S;window.plausible.l=true;
if(o.autoCapturePageviews!==false)send("pageview");
for(var k=0;k<q.length;k++)send.apply(null,q[k])}
window.plausible=window.plausible||{};plausible.o&&S(plausible.o);plausible.init=S}();
`;
}

export async function plausibleStub(send, { mode = "stub", sites = {} } = {}) {
  const stub = { mode, events: [], scripts: [], failed: [] };
  stub.setMode = (m) => { stub.mode = m; };
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (d) => { body += d; });
    req.on("end", () => {
      const cors = { "access-control-allow-origin": "*" };
      const js = req.url.match(/^\/js\/([^/?]+)\.js(\?|$)/);
      if (req.method === "GET" && js) {
        const domain = SITES[js[1]];
        stub.scripts.push({ id: js[1], known: !!domain, mode: stub.mode });
        if (!domain) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8", ...cors }); res.end("Not found"); return; }
        const h = { "content-type": "application/javascript", "cache-control": "no-store", ...cors };
        if (stub.mode !== "nocorp") h["cross-origin-resource-policy"] = "cross-origin";
        res.writeHead(200, h); res.end(stubScript(domain)); return;
      }
      if (req.url === "/api/event" && req.method === "OPTIONS") {
        res.writeHead(204, { ...cors, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type" }); res.end(); return;
      }
      if (req.url === "/api/event" && req.method === "POST") {
        let parsed = body; try { parsed = JSON.parse(body); } catch { /* recorded as it came */ }
        stub.events.push({ body: parsed, origin: req.headers.origin || "", contentType: req.headers["content-type"] || "" });
        res.writeHead(202, { "content-type": "text/plain; charset=utf-8", ...cors }); res.end("ok"); return;
      }
      res.writeHead(404, { "content-type": "text/plain", ...cors }); res.end("Not found");
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  stub.close = () => { try { server.close(); server.closeAllConnections?.(); } catch { /* closed */ } };
  stub.onMessage = async (msg) => {
    if (msg.method !== "Fetch.requestPaused") return;
    const { requestId, request } = msg.params;
    try {
      const site = Object.keys(sites).find((o) => request.url === o || request.url.startsWith(o + "/"));
      if (site) {
        const r = await fetch(sites[site] + request.url.slice(site.length), { method: request.method, redirect: "manual",
          headers: Object.fromEntries(Object.entries(request.headers).filter(([k]) => !/^(host|connection|content-length)$/i.test(k))),
          body: /^(GET|HEAD)$/.test(request.method) ? undefined : request.postData });
        const body = Buffer.from(await r.arrayBuffer());
        const responseHeaders = [];
        r.headers.forEach((value, name) => {
          if (/^(content-encoding|content-length|transfer-encoding|connection)$/i.test(name)) return;   // fetch decoded the body
          responseHeaders.push({ name, value: name.toLowerCase() === "location" ? value.replace(sites[site], site) : value });
        });
        await send("Fetch.fulfillRequest", { requestId, responseCode: r.status, responseHeaders, body: body.toString("base64") });
        return;
      }
      if (stub.mode === "down") {
        stub.failed.push(request.url);
        await send("Fetch.failRequest", { requestId, errorReason: "ConnectionRefused" });
        return;
      }
      const u = new URL(request.url);
      await send("Fetch.continueRequest", { requestId, url: `http://127.0.0.1:${port}${u.pathname}${u.search}` });
    } catch { /* the page went away mid-request */ }
  };
  for (const origin of Object.keys(sites)) {
    // Loud on failure (the review, 2026-09-30): a Chrome that renamed the
    // permission answers the same "Unknown permission type" as one without
    // Local Network Access, and would otherwise surface as "no pageview"
    try { await send("Browser.grantPermissions", { permissions: ["localNetworkAccess"], origin }); }
    catch (e) { throw new Error(`SETUP-FAILED: Chrome refused the localNetworkAccess permission for ${origin} (${e.message}); without it the rewritten plausible.io requests from that origin are blocked. A Chrome that renamed the permission needs this module updated`); }
  }
  await send("Fetch.enable", { patterns: [{ urlPattern: "https://plausible.io/*", requestStage: "Request" },
    ...Object.keys(sites).map((o) => ({ urlPattern: o + "/*", requestStage: "Request" }))] });
  return stub;
}

// a failure that "down" mode causes on purpose: the script or an event not
// reaching plausible.io (Chrome's own console line, or the failed request)
// Only the two shapes a refused plausible.io request takes in the harnesses:
// Chrome's console line (a Log entry, "log: <text> <url>") and a failed
// request ("request <url> <error>"), each ending in the plausible.io URL or
// the refusal, so a site error that merely mentions plausible.io is kept.
export const isPlausibleFailure = (line) =>
  /^log: Failed to load resource: net::ERR_CONNECTION_REFUSED https:\/\/plausible\.io\/\S+$/.test(line.trim())
  || /^request https:\/\/plausible\.io\/\S+ +net::ERR_CONNECTION_REFUSED$/.test(line.trim());

// --live: what plausible.io answers today (the internet; never a runner gate)
export async function liveHeaders(id) {
  const out = [];
  const s = await fetch(`https://plausible.io/js/${id}.js`);
  const text = await s.text();
  out.push([s.status === 200, `script ${id}: ${s.status}`]);
  out.push([s.headers.get("cross-origin-resource-policy") === "cross-origin", `script CORP: ${s.headers.get("cross-origin-resource-policy")} (want cross-origin: a require-corp page loads it)`]);
  out.push([s.headers.get("access-control-allow-origin") === "*", `script ACAO: ${s.headers.get("access-control-allow-origin")}`]);
  out.push([text.includes(`domain:"${SITES[id]}"`), `the script is ${SITES[id] || "an unknown site"}'s`]);
  const e = await fetch(EVENT_URL, { method: "POST", headers: { "content-type": "text/plain", origin: `https://${SITES[id] || "example.invalid"}` },
    body: JSON.stringify({ n: "pageview", u: "https://coep-probe.invalid/", d: "coep-probe.invalid", r: null, v: 36 }) });
  out.push([e.status === 202, `event POST: ${e.status} (dropped: ${e.headers.get("x-plausible-dropped")})`]);
  out.push([e.headers.get("access-control-allow-origin") === "*", `event ACAO: ${e.headers.get("access-control-allow-origin")}`]);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const i = process.argv.indexOf("--live"), id = i >= 0 ? process.argv[i + 1] : null;
  if (!id) { console.log("usage: plausible-check.mjs --live ID"); process.exit(2); }
  let bad = 0;
  try { for (const [good, what] of await liveHeaders(id)) { if (!good) bad++; console.log(`  ${good ? "ok  " : "FAIL"} ${what}`); } }
  catch (e) { console.log(`SETUP-FAILED: ${e.message} (no internet?)`); process.exit(2); }
  console.log(bad ? "FAIL" : "PASS"); process.exit(bad ? 1 : 0);
}
