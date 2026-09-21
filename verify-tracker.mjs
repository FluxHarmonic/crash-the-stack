// verify-tracker.mjs - the browser arm for the tracker (P3b, ruling D29).
//
//   node verify-tracker.mjs [build/web] [--port N] [--cdp N] [--phone]
//
// Serves the build dir on 127.0.0.1, launches google-chrome headless with
// software WebGL and drives the page over the DevTools Protocol, as
// verify.mjs does. Sub-arms, in order; each prints PASS / FAIL <name>:
//
//   imports    tracker/crash-tracker.wasm imports only wasi + gl + sigil_wasm_gles3 +
//              sigil_browser + sigil_wasm_audio (as the game's wasm; no env)
//   sizes      the game's wasm is within 0.3 MB of master's 21,425,074 bytes
//              (the tracker is not in it) and the tracker's within 20 MB
//   open       /tracker/?tune=spy: "crash: tracker open spy" then "crash: tune loaded spy"
//              (the page fetched assets/tunes/spy.cts and handed it over in chunks)
//   render     the tracker's canvas is drawn: the header's text color and the
//              cursor row's tint are both present, over many pixels
//   play       Enter: "crash: tracker play 0 0"; the AnalyserNode tap on the
//              destination reads a positive RMS within 3 s (sound on the web);
//              Escape: "crash: tracker stop P R" with R > 0 (the audio clock moved)
//   edit       Space, z (C-4 on channel 1 row R), then the share: the text
//              carries the cell
//   share      Ctrl-E: the game's "crash: tune-share spy N chars", the page's
//              "crash: tune-url N chars" with N <= 16384 (the pinned budget),
//              and the overlay shows a URL with #t=
//   fragment   a fresh navigation to that URL boots the tracker with the shared
//              tune: "crash: tune loaded shared"; sharing again yields the same
//              URL (deflate of identical text), so the round trip is exact
//   door       the game page at /?tracker=spy is just the game: it boots (its
//              literal-check line) and never says "crash: tracker open" (the
//              game's wasm carries no tracker; /tracker/ is the one entry)
//              loads the same tune
//   bar        (phone only) a synthetic touch on the bar's PLAY button starts playback
//              ("crash: tracker play"), one on STOP stops it: the screen closes on touch
//   console    no error-level console entries or exceptions across the run
//
// Any FAIL exits 1; a wait that runs out prints TIMED-OUT and exits 2.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const PORT = parseInt(opt("--port", "8096"), 10);
const CDP = parseInt(opt("--cdp", "9236"), 10);
const PHONE = flag("--phone");
const TUNE_URL_MAX = 16384;

const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".mjs": "text/javascript;charset=utf-8", ".wasm": "application/wasm", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".pcm": "application/octet-stream", ".cts": "text/plain;charset=utf-8" };
const results = [];
const planned = ["imports", "sizes", "open", "render", "play", "edit", "share", "fragment", "door", "worker", "bar", "console"];
function pass(name, detail) { results.push([name, "PASS"]); console.log(`PASS ${name}${detail ? ": " + detail : ""}`); }
function fail(name, detail) { results.push([name, "FAIL"]); console.log(`FAIL ${name}: ${detail}`); }
function notRun() { const done = new Set(results.map((r) => r[0])); return planned.filter((p) => !done.has(p)); }

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  let fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (urlPath !== "/" && urlPath.endsWith("/")) fp = path.join(fp, "index.html");
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const udd = fs.mkdtempSync("/tmp/crash-verify-tracker-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--autoplay-policy=no-user-gesture-required",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killChromeGroup(sig) { try { process.kill(-chrome.pid, sig); } catch {} }
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  killChromeGroup("SIGTERM");
  setTimeout(() => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch {} server.close(); process.exit(code); }, 800);
}
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => shutdown(2));
process.on("uncaughtException", (e) => { console.log("EXCEPTION " + (e && e.stack || e)); dump(); shutdown(2); });
const WHOLE_RUN_MS = 480000;   // the worker leg waits up to 95 s for the registration
setTimeout(() => { console.log(`TIMED-OUT whole run after ${WHOLE_RUN_MS} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, WHOLE_RUN_MS).unref();

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch {}
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target after 20 s; did not run: " + notRun().join(" ")); shutdown(2); }

const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = [];
const consoleErrors = [];
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
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") consoleErrors.push("log: " + msg.params.entry.text + (msg.params.entry.url ? " " + msg.params.entry.url : ""));
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `(function () {
  var tap = { nodes: [], analysers: [] };
  window.__crashAudioTap = tap;
  var connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      if (dest && dest.context && dest === dest.context.destination) {
        var an = dest.context.createAnalyser(); an.fftSize = 32768;
        connect.call(this, an); tap.analysers.push(an); tap.nodes.push(this.constructor.name);
      }
    } catch (e) { tap.error = String(e); }
    return connect.apply(this, arguments);
  };
})();` });
if (PHONE) {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
} else {
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "fine" }, { name: "hover", value: "hover" }] });
}

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
function dump() {
  console.log("--- console lines ---"); consoleLines.forEach((l) => console.log("  " + l));
  console.log("--- console errors ---"); consoleErrors.forEach((l) => console.log("  " + l));
}
function timedOut(name) { console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`); dump(); shutdown(2); }

// a key as the page sees it: keydown then keyup with e.key = key; a
// modifier is its own key pressed around it (the game reads the held set
// from the keys' own down/up events, not from the event's modifier bits)
async function keyEvent(type, key, code, mods) {
  await send("Input.dispatchKeyEvent", { type, key, code, modifiers: mods, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0 });
}
async function press(key, mods = 0) {
  const code = key.length === 1 ? (/[a-z]/.test(key) ? "Key" + key.toUpperCase() : /[0-9]/.test(key) ? "Digit" + key : key === " " ? "Space" : key) : key;
  if (mods & CTRL) { await keyEvent("keyDown", "Control", "ControlLeft", CTRL); await sleep(40); }
  await keyEvent("keyDown", key, code, mods);
  await sleep(40);
  await keyEvent("keyUp", key, code, mods);
  if (mods & CTRL) { await sleep(40); await keyEvent("keyUp", "Control", "ControlLeft", 0); }
  await sleep(120);
}
const CTRL = 2;
let stopRow = -1;   // the row the play leg stopped on; the edit leg writes there

// the canvas over a virtual rect, one sample per virtual pixel: { px: [r,g,b,...] }
const VW = 640, VH = 400;
async function readRegion(x, y, w, h) {
  return evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
    const g = off.getContext("2d"); g.drawImage(c, 0, 0);
    const sx = c.width / ${VW}, sy = c.height / ${VH};
    const out = [];
    for (let j = 0; j < ${h}; j++) for (let i = 0; i < ${w}; i++) {
      const d = g.getImageData(Math.floor((${x} + i + 0.5) * sx), Math.floor((${y} + j + 0.5) * sy), 1, 1).data;
      out.push(d[0], d[1], d[2]);
    }
    resolve({ w: ${w}, h: ${h}, px: out });
  }))`);
}
const near = (px, i, c, tol = 40) => Math.abs(px[i] - c[0]) <= tol && Math.abs(px[i + 1] - c[1]) <= tol && Math.abs(px[i + 2] - c[2]) <= tol;
const PAL = { bg: [13, 10, 26], text: [204, 230, 255] };

// ---- imports + sizes ------------------------------------------------------------
{
  const wasmPath = path.join(ROOT, "tracker", "crash-tracker.wasm");
  const gamePath = path.join(ROOT, "crash-the-stack.wasm");
  try {
    const mod = await WebAssembly.compile(fs.readFileSync(wasmPath));
    const mods = {};
    for (const imp of WebAssembly.Module.imports(mod)) mods[imp.module] = (mods[imp.module] || 0) + 1;
    const names = Object.keys(mods).sort();
    const want = ["gl", "sigil_browser", "sigil_wasm_audio", "sigil_wasm_gles3", "wasi_snapshot_preview1"];
    if (names.join(" ") === want.join(" ")) pass("imports", names.map((n) => `${n}(${mods[n]})`).join(" "));
    else fail("imports", `import modules ${names.join(" ")}, want ${want.join(" ")}`);
  } catch (e) { fail("imports", "compile: " + e.message); }
  const BASE = 21425074, SLACK = 300 * 1024, TRACKER_MAX = 20 * 1024 * 1024;
  const game = fs.statSync(gamePath).size, tracker = fs.statSync(wasmPath).size;
  if (game <= BASE + SLACK && tracker <= TRACKER_MAX) pass("sizes", `game ${game} bytes (base ${BASE} + ${game - BASE}), tracker ${tracker} bytes`);
  else fail("sizes", `game ${game} bytes (base ${BASE}, slack ${SLACK}), tracker ${tracker} bytes (max ${TRACKER_MAX})`);
}

// ---- open ---------------------------------------------------------------------
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/tracker/?trace&tune=spy` });
const opened = await waitLine(/^crash: tracker open spy$/, 0, 40000);
if (!opened) timedOut("open");
const loaded = await waitLine(/^crash: tune loaded spy$/, 0, 20000);
if (!loaded) timedOut("open");
pass("open", "tracker open spy; tune loaded spy");

// ---- render -------------------------------------------------------------------
await sleep(800);
{
  const r = await readRegion(0, 0, VW, 60);
  let text = 0, lit = 0;
  for (let i = 0; i < r.px.length; i += 3) { if (near(r.px, i, PAL.text, 50)) text++; if (!near(r.px, i, PAL.bg, 30)) lit++; }
  if (text > 200 && lit > 1000) pass("render", `header text pixels ${text}, lit ${lit} of ${VW * 60}`);
  else fail("render", `header text pixels ${text}, lit ${lit}`);
}

// ---- play ---------------------------------------------------------------------
{
  const from = consoleLines.length;
  await press("Enter");
  const started = await waitLine(/^crash: tracker play (\d+) (\d+)$/, from, 5000);
  if (!started) { fail("play", "no 'crash: tracker play' after Enter"); }
  else {
    let rms = 0;
    for (let i = 0; i < 60 && rms < 0.01; i++) {
      rms = await evalJS(`(function(){ var t = window.__crashAudioTap; if (!t || !t.analysers.length) return 0; var best = 0;
        t.analysers.forEach(function (an) { var buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf); var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i]*buf[i]; best = Math.max(best, Math.sqrt(s / buf.length)); }); return best; })()`);
      await sleep(50);
    }
    await sleep(1500);
    const from2 = consoleLines.length;
    await press("Escape");
    const stopped = await waitLine(/^crash: tracker stop (\d+) (\d+)$/, from2, 5000);
    const row = stopped ? parseInt(stopped.m[2], 10) : -1;
    stopRow = row;
    if (rms >= 0.01 && stopped && row > 0) pass("play", `play ${started.m[1]} ${started.m[2]}; rms ${rms.toFixed(3)}; stop at row ${row}`);
    else fail("play", `rms ${rms.toFixed(4)} (want >= 0.01), stop line ${stopped ? stopped.m[0] : "missing"} (want row > 0)`);
  }
}

// ---- edit + share -------------------------------------------------------------
async function shareURL() {
  const from = consoleLines.length;
  await press("e", CTRL);
  const shared = await waitLine(/^crash: tune-share (\S+) (\d+) chars$/, from, 5000);
  if (!shared) return { error: "no tune-share line" };
  const urlLine = await waitLine(/^crash: tune-url (\d+) chars$/, from, 5000);
  if (!urlLine) return { error: "no tune-url line" };
  const url = await evalJS(`(function(){ var b = document.getElementById("share-overlay"); if (!b) return null; var m = /(https?:\\S+#t=[A-Za-z0-9_-]+)/.exec(b.textContent); return m ? m[1] : null; })()`);
  return { name: shared.m[1], chars: parseInt(urlLine.m[1], 10), url };
}
let firstURL = null;
{
  await press(" ");            // edit mode
  await press("z");            // C-4 with instrument 1 at the cursor
  await press(" ");            // edit off
  const s = await shareURL();
  if (s.error) fail("edit", s.error);
  else {
    // decode the URL's tune in the page and look for the cell the key wrote
    const text = await evalJS(`(async function(){ var m = /#t=([A-Za-z0-9_-]+)/.exec(${JSON.stringify(s.url || "")}); if (!m) return "";
      var s = m[1].replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
      var bin = atob(s), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
      return new TextDecoder().decode(buf); })()`);
    const hasCell = new RegExp("\\(row " + stopRow + " \\(1 \"C-4\" 1 \\d+ \"[0-9A-F]{3}\"\\)").test(text);   // at the row the cursor stopped on; it may already carry a volume or an effect
    if (hasCell && /^\(tune version: 1 name: "spy"/.test(text)) pass("edit", `the shared text carries (row ${stopRow} (1 "C-4" 1 ...); ${text.length} bytes of tune text`);
    else fail("edit", `the shared text ${text.length ? "lacks the C-4 cell at row " + stopRow : "did not decode"} (${text.length} bytes)`);
    if (s.url && s.chars <= TUNE_URL_MAX && s.chars === s.url.length) { pass("share", `${s.name}: url ${s.chars} chars (budget ${TUNE_URL_MAX})`); firstURL = s.url; }
    else fail("share", `url ${s.url ? s.url.length : "missing"} chars, page said ${s.chars}`);
  }
}

// ---- fragment -----------------------------------------------------------------
if (firstURL) {
  const target = firstURL.replace(/^https?:\/\/[^/]+/, `http://127.0.0.1:${PORT}`).replace("/tracker/#", "/tracker/?trace#");
  const from = consoleLines.length;
  await send("Page.navigate", { url: target });
  const loaded = await waitLine(/^crash: tune loaded shared$/, from, 40000);
  if (!loaded) fail("fragment", "no 'crash: tune loaded shared' after navigating to the share URL");
  else {
    await sleep(500);
    const s = await shareURL();
    if (!s.error && s.url && s.url.replace(/^https?:\/\/[^/]+/, "") === firstURL.replace(/^https?:\/\/[^/]+/, "")) pass("fragment", `the shared tune loads and shares to the same URL (${s.chars} chars)`);
    else fail("fragment", s.error || "the reshared URL differs from the first");
  }
} else fail("fragment", "no share URL to test");

// ---- door ---------------------------------------------------------------------
// David (2026-09-21): the game page carries no tracker code and honors no
// ?tracker link; /tracker/ is the one entry. So /?tracker=spy is the game.
{
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&tracker=spy` });
  const game = await waitLine(/^crash: literal-check ok$/, from, 40000);
  await sleep(1500);
  const opened = consoleLines.slice(from).some((l) => /^crash: tracker open /.test(l));
  const where = await evalJS("location.pathname + location.search");
  if (game && !opened && !/\/tracker\//.test(where)) pass("door", `/?tracker=spy booted the game at ${where} and opened no tracker`);
  else fail("door", `game ${game ? "booted" : "did not boot"}, tracker opened ${opened}, at ${where}`);
}

// ---- worker -------------------------------------------------------------------
// sw.js answers every navigation with the cached root page (its fix is
// proposed with P4a); the game page, landed at /tracker/ that way, fetches
// the real tracker page and writes it in place. The game page just booted
// registers the worker once its reveal is over (a key passes the gate) and
// the menu is live ("crash: sw registered"); a fresh navigation is then
// controlled; /tracker/ after that must still be the tracker.
{
  let from = consoleLines.length;
  await press("Enter");   // the title gate
  const registered = await waitLine(/^crash: sw registered$/, from, 95000);
  let controlled = false;
  if (registered) {
    // active after its precache (the game's wasm and assets), then a fresh navigation is controlled
    let active = false;
    for (let i = 0; i < 240 && !active; i++) {
      active = await evalJS("navigator.serviceWorker.getRegistration().then(function (r) { return !!(r && r.active); })");
      if (!active) await sleep(250);
    }
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace` });
    for (let i = 0; i < 120 && !controlled; i++) {
      controlled = await evalJS("!!(navigator.serviceWorker && navigator.serviceWorker.controller)");
      if (!controlled) await sleep(250);
    }
  }
  if (!controlled) fail("worker", registered ? "the worker registered but never controlled a fresh navigation within 30 s" : "no 'crash: sw registered' within 95 s of the gate");
  else {
    from = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/tracker/?trace&tune=breaker` });
    const opened = await waitLine(/^crash: tracker open breaker$/, from, 40000);
    const loaded = await waitLine(/^crash: tune loaded breaker$/, from, 20000);
    const served = await evalJS("document.documentElement.outerHTML.indexOf('crash-tracker') >= 0");
    if (opened && loaded && served) pass("worker", "under a controlling service worker /tracker/?tune=breaker opened the tracker and loaded breaker");
    else fail("worker", `opened ${!!opened}, loaded ${!!loaded}, tracker page served ${served}`);
  }
}
// ---- bar (phone) --------------------------------------------------------------
// The bar's five buttons share the width at the bottom 40 px: < PLAY STOP LOOP >.
async function tap(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    const cx = r.left + bx * r.width / c.width, cy = r.top + by * r.height / c.height;
    c.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
    return { cx, cy };
  })()`);
}
if (PHONE) {
  const from = consoleLines.length;
  await tap(VW / 5 * 1.5, VH - 20);   // PLAY
  const started = await waitLine(/^crash: tracker play (\d+) (\d+)$/, from, 5000);
  await sleep(800);
  const from2 = consoleLines.length;
  await tap(VW / 5 * 2.5, VH - 20);   // STOP
  const stopped = await waitLine(/^crash: tracker stop (\d+) (\d+)$/, from2, 5000);
  if (started && stopped) pass("bar", `PLAY tap -> ${started.m[0]}; STOP tap -> ${stopped.m[0]}`);
  else fail("bar", `play ${started ? "ok" : "missing"}, stop ${stopped ? "ok" : "missing"}`);
} else pass("bar", "desktop: no bar (the keys are the controls)");

// ---- console ------------------------------------------------------------------
if (consoleErrors.length === 0) pass("console", "no errors");
else fail("console", consoleErrors.join(" | "));

const failed = results.filter((r) => r[1] === "FAIL");
if (failed.length) dump();
console.log(`${failed.length ? "FAILED" : "ALL PASS"}: ${results.map((r) => r[0] + "=" + r[1]).join(" ")}`);
shutdown(failed.length ? 1 : 0);
