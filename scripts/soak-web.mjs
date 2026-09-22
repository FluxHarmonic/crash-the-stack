// soak-web.mjs - the hidden-tab soak (the web soak row, 2026-09-21,
// [[t-7cef66]]: a tab left running for hours died of malloc returning NULL
// with the GC's own count at 36 MB). What grows while a tab sits hidden?
//
//   node scripts/soak-web.mjs (--url URL | --serve DIR [--port N]) [--query QS] [--minutes N]
//        [--show-every M] [--show-for S] [--settle S] [--cdp N] [--log FILE]
//        [--soak-dispatch] [--visible]
//
//   --serve DIR     serve DIR on 127.0.0.1:--port (8094) and soak it, or
//   --url           the page to soak (a build hosted elsewhere, or the
//                   published https://crashthestack.com/); the query string
//                   is added from --query (default "trace&stack&fresh": a
//                   board on the stack, the game's console lines on)
//   --minutes N     how long (default 240); SIGTERM ends it early with the
//                   same summary
//   --settle S      seconds visible after the boot line before hiding (the
//                   tunes land meanwhile; default 90)
//   --show-every M  every M minutes the tab comes to the front for
//                   --show-for seconds (default 60 and 30): frames run, the
//                   game's ?ms window prints, a hidden-to-visible edge is
//                   exercised each time; 0 for never
//   --soak-dispatch this build has the ("soak", "sample") dispatch (the
//                   feat/web-soak page): its gc line is read each minute
//   --visible       never hide (the control: the same page in front)
//
// Once a minute a sample line goes to the log (CSV, one header):
//   min, visible, wasm_bytes (memory.buffer.byteLength), js_heap_bytes
//   (performance.memory.usedJSHeapSize), gl_tex gl_buf gl_fb gl_rb gl_prog
//   gl_shader gl_vao gl_sampler (live WebGL2 objects: creates minus
//   deletes, counted by a prototype tap installed before the page's
//   scripts), audio (the AudioContext's state), gc_alloc gc_peak gc_next
//   gc_young gc_minor gc_major gc_ms tracks (the game's soak line, or -),
//   renderer_rss_kb (the sum of this chrome's renderer processes' VmRSS),
//   errors (console errors + exceptions so far), dead (window.crashGuard.dead)
// and every console error, exception, FATAL or "crash: page" line goes to
// the log as it happens, stamped with the minute.
//
// The chrome is headless (SwiftShader: a GPU driver's own growth is not
// in this picture), muted, on the worker-null sink, its own profile under
// /tmp, and run at the caller's nice level. The soak's own cost is one
// Runtime.evaluate a minute.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const SERVE = opt("--serve", null);
const SERVE_PORT = parseInt(opt("--port", "8094"), 10);
const URL_BASE = opt("--url", SERVE ? `http://127.0.0.1:${SERVE_PORT}/index.html` : null);
if (!URL_BASE) { console.log("soak-web: --url or --serve DIR is required"); process.exit(2); }
const QUERY = opt("--query", "trace&stack&fresh");
const MINUTES = parseFloat(opt("--minutes", "240"));
const SETTLE_S = parseFloat(opt("--settle", "90"));
const SHOW_EVERY = parseFloat(opt("--show-every", "60"));
const SHOW_FOR_S = parseFloat(opt("--show-for", "30"));
const CDP = parseInt(opt("--cdp", "9333"), 10);
const LOG = opt("--log", `/tmp/crash-soak-${Date.now()}.log`);
const SOAK_DISPATCH = flag("--soak-dispatch");
const VISIBLE = flag("--visible");

const out = fs.createWriteStream(LOG, { flags: "a" });
// --serve DIR: a loopback static server over a build directory (the arms' shape)
let server = null;
if (SERVE) {
  const ROOT = path.resolve(SERVE);
  const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
    ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json", ".ogg": "audio/ogg", ".txt": "text/plain;charset=utf-8" };
  server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
    if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(fp, (err, buf) => {
      if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(buf);
    });
  });
  await new Promise((r) => server.listen(SERVE_PORT, "127.0.0.1", r));
}
const t0 = Date.now();
const minute = () => ((Date.now() - t0) / 60000).toFixed(1);
function log(line) { const s = `[${minute()}] ${line}`; console.log(s); out.write(s + "\n"); }

const udd = fs.mkdtempSync("/tmp/crash-soak-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--autoplay-policy=no-user-gesture-required",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch { /* gone */ } }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  summary();
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } out.end(); process.exit(code); }, 2000);
}
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("SIGHUP", () => shutdown(129));
process.on("unhandledRejection", (err) => { log("EXCEPTION " + (err && err.stack || err)); shutdown(2); });
process.on("uncaughtException", (err) => { log("EXCEPTION " + (err && err.stack || err)); shutdown(2); });

let pageWs = null, pageTargetId = null;
for (let i = 0; i < 100 && !pageWs; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) { pageWs = page.webSocketDebuggerUrl; pageTargetId = page.id; }
  } catch { /* not up */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { log("SETUP-FAILED: no DevTools page target within 20 s"); shutdown(2); await new Promise(() => {}); }

const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = [];
let errors = 0;
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    consoleLines.push(text);
    if (msg.params.type === "error") { errors++; log("console.error " + text.slice(0, 300)); }
    else if (/^FATAL:|^crash: page |^Error:|sokol\[/.test(text)) log("line " + text.slice(0, 300));
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") { errors++; log("log " + msg.params.entry.text.slice(0, 300)); }
  if (msg.method === "Runtime.exceptionThrown") { errors++; log("exception " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "").slice(0, 300)); }
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "fine" }, { name: "hover", value: "hover" }] });
// live WebGL2 object counts, from a prototype tap ahead of every page script
await send("Page.addScriptToEvaluateOnNewDocument", { source: `(function () {
  var P = window.WebGL2RenderingContext && WebGL2RenderingContext.prototype; if (!P) return;
  var counts = { tex: 0, buf: 0, fb: 0, rb: 0, prog: 0, shader: 0, vao: 0, sampler: 0, created: 0, deleted: 0 };
  window.__glCounts = counts;
  var pairs = [["createTexture", "deleteTexture", "tex"], ["createBuffer", "deleteBuffer", "buf"], ["createFramebuffer", "deleteFramebuffer", "fb"],
               ["createRenderbuffer", "deleteRenderbuffer", "rb"], ["createProgram", "deleteProgram", "prog"], ["createShader", "deleteShader", "shader"],
               ["createVertexArray", "deleteVertexArray", "vao"], ["createSampler", "deleteSampler", "sampler"]];
  pairs.forEach(function (p) {
    var c = P[p[0]], d = P[p[1]];
    P[p[0]] = function () { var r = c.apply(this, arguments); if (r) { counts[p[2]]++; counts.created++; } return r; };
    P[p[1]] = function (o) { if (o) { counts[p[2]]--; counts.deleted++; } return d.apply(this, arguments); };
  });
  var AC = window.AudioContext; if (typeof AC === "function") {
    window.__soakAudio = [];
    var T = function () { var c = arguments.length ? new AC(arguments[0]) : new AC(); window.__soakAudio.push(c); return c; };
    T.prototype = AC.prototype; window.AudioContext = T;
  }
})();` });

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
}
async function waitLine(re, from, ms) {
  const s = Date.now();
  while (Date.now() - s < ms) {
    for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) return { m, index: i }; }
    await sleep(100);
  }
  return null;
}
// the renderers' RSS: every chrome process of this profile with --type=renderer
function rendererRssKb() {
  let sum = 0, n = 0;
  for (const pid of fs.readdirSync("/proc").filter((p) => /^\d+$/.test(p))) {
    try {
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
      if (!cmd.includes(udd) || !cmd.includes("--type=renderer")) continue;
      const m = fs.readFileSync(`/proc/${pid}/status`, "utf8").match(/VmRSS:\s+(\d+)/);
      if (m) { sum += parseInt(m[1], 10); n++; }
    } catch { /* gone */ }
  }
  return { sum, n };
}

const SAMPLE_JS = `(() => {
  const app = globalThis.SigilWebApp;
  const mem = app && app.instance ? app.instance.exports.memory.buffer.byteLength : -1;
  const js = performance.memory ? performance.memory.usedJSHeapSize : -1;
  const g = window.__glCounts || {};
  const ac = (window.__soakAudio || []).map((c) => c.state).join("+") || "none";
  const dead = !!(window.crashGuard && window.crashGuard.dead);
  return { mem, js, g, ac, vis: document.visibilityState, dead };
})()`;

const samples = [];
async function sample(label) {
  let s = null;
  try { s = await evalJS(SAMPLE_JS); } catch (e) { log(`sample failed: ${e.message}`); return; }
  let gc = "- - - - - - - -";
  if (SOAK_DISPATCH) {
    const from = consoleLines.length;
    try {
      await evalJS(`globalThis.SigilWebApp.dispatch("soak", "sample")`);
      const l = await waitLine(/^crash: soak gc (\d+) peak (\d+) next (\d+) young (\d+) minor (\d+) major (\d+) gcms ([\d.]+) tracks (\d+)$/, from, 3000);
      if (l) gc = l.m.slice(1).join(" ");
    } catch (e) { log(`soak dispatch failed: ${e.message}`); }
  }
  const rss = rendererRssKb();
  const row = [minute(), s.vis === "visible" ? 1 : 0, s.mem, s.js, s.g.tex, s.g.buf, s.g.fb, s.g.rb, s.g.prog, s.g.shader, s.g.vao, s.g.sampler, s.ac, gc, rss.sum, errors, s.dead ? 1 : 0].join(" ");
  samples.push({ min: parseFloat(minute()), mem: s.mem, js: s.js, gl: s.g, gc, rss: rss.sum, errors, dead: s.dead, vis: s.vis });
  log(`sample ${label || ""} ${row}`);
}
function summary() {
  if (samples.length < 2) { log("summary: fewer than two samples"); return; }
  const a = samples[0], b = samples[samples.length - 1];
  const maxMem = Math.max(...samples.map((s) => s.mem)), maxJs = Math.max(...samples.map((s) => s.js)), maxRss = Math.max(...samples.map((s) => s.rss));
  log(`summary: ${samples.length} samples over ${b.min} min; wasm ${a.mem} -> ${b.mem} (max ${maxMem}, delta ${b.mem - a.mem}); js heap ${a.js} -> ${b.js} (max ${maxJs}); renderer rss kB ${a.rss} -> ${b.rss} (max ${maxRss}); gl tex ${a.gl.tex} -> ${b.gl.tex} buf ${a.gl.buf} -> ${b.gl.buf} fb ${a.gl.fb} -> ${b.gl.fb} prog ${a.gl.prog} -> ${b.gl.prog}; gc first "${a.gc}" last "${b.gc}"; errors ${b.errors}; dead ${b.dead}`);
}

log(`soak-web: ${URL_BASE}?${QUERY} for ${MINUTES} min, settle ${SETTLE_S} s, show every ${SHOW_EVERY} min for ${SHOW_FOR_S} s${VISIBLE ? " (never hidden)" : ""}, log ${LOG}, profile ${udd}, chrome pid ${chrome.pid}`);
log("columns: min visible wasm_bytes js_heap gl_tex gl_buf gl_fb gl_rb gl_prog gl_shader gl_vao gl_sampler audio gc_alloc gc_peak gc_next gc_young gc_minor gc_major gc_ms tracks renderer_rss_kb errors dead");
await send("Page.navigate", { url: `${URL_BASE}?${QUERY}` });
const boot = await waitLine(/^crash: (seed \d+ tiles \d+ pair |cards seed )/, 0, 90000);
if (!boot) { log("SETUP-FAILED: no boot line within 90 s"); shutdown(2); await new Promise(() => {}); }
log(`booted: ${boot.m[0]}`);
await sleep(SETTLE_S * 1000);
await sample("settled");
let blank = null;
async function hide() {
  if (VISIBLE) return;
  if (!blank) blank = await send("Target.createTarget", { url: "about:blank" });
  else await send("Target.activateTarget", { targetId: blank.targetId });
}
async function show() { await send("Target.activateTarget", { targetId: pageTargetId }); }
await hide();
await sleep(2000);
await sample("hidden");
const endAt = t0 + MINUTES * 60000;
let lastShow = Date.now();
while (Date.now() < endAt) {
  await sleep(60000);
  await sample();
  if (!VISIBLE && SHOW_EVERY > 0 && Date.now() - lastShow >= SHOW_EVERY * 60000) {
    await show();
    log("shown");
    await sleep(SHOW_FOR_S * 1000);
    await sample("visible");
    await hide();
    lastShow = Date.now();
    log("hidden again");
  }
}
await show();
await sleep(5000);
await sample("final-visible");
shutdown(0);
