// verify.mjs - gate leg 5, the browser arm for the web build.
//
//   node verify.mjs [build/web] [--expect-no-selection] [--shot PATH]
//                   [--port N] [--cdp N] [--phone]
//
// Serves the build dir on 127.0.0.1, launches google-chrome headless with
// software WebGL (SwiftShader), drives the page over the DevTools Protocol
// (Node 22's built-in WebSocket, no puppeteer) and runs the sub-arms below in
// order. Each prints PASS / FAIL <name>: <detail>; any FAIL exits 1. A wait
// that runs out prints TIMED-OUT <name> with everything collected so far and
// exits 2, and says which sub-arms did not run.
//
//   imports     the wasm's import modules are exactly wasi + gl + sigil_wasm_gles3
//               + sigil_browser (localStorage) + sigil_wasm_audio (P3), no env,
//               no emscripten
//   boot        the game prints its boot line (seed, first solution pair, centers)
//   render      the board region of the WebGL canvas is drawn: many non-background
//               pixels in at least six color bins: the copper bars alone give two
//               or three, a board gives ten (read in the same animation
//               frame the game draws, so preserveDrawingBuffer:false is not a problem)
//   tap-select  a synthetic pointerdown at tile A's center -> "crash: select A"
//   tap-match   a second one at its pair B     -> "crash: removed A B tiles 142"
//   keys-match  undo (a tap on the game's own UNDO control, at the centre the
//               "crash: control undo X Y" boot line gives), then the hint-mode
//               tags of each tile of the same pair, from the game's
//               "crash: labels" boot line -> "crash: removed A B tiles 142"
//   look        taps on the TILES counter (the game's "crash: control look X Y"
//               line) step the look ("crash: look NAME", first in the boot
//               lines), each tap to a new name, around to the test-tile look
//               within twelve taps (P3, ruling D26's sheet switch on the phone)
//   assets      every resource the page loaded (performance entries: the
//               wasm, the bridges, assets/) answered 200, and the test tile the
//               look sub-arm asked for is among them (P3 gate leg 2, the web
//               half: a referenced asset resolves on the served build)
//   traced      SHUFFLES taps on the SHUF control fill the trace (60 each,
//               TRACE-AT 180 -> 3) -> "crash: shuffle" that many times, then
//               "crash: trace ... counter 0" on the next tick,
//               and within ICE-FIRST + 5 s the first counter-hack:
//               "crash: trace ... counter 1" with "crash: lock A B", a
//               "crash: remap" or (P3) "crash: scramble" naming six faces
//               (gate leg 2 on the product)
//   reload      the page is reloaded (fresh navigation, same origin) and the
//               game boots from localStorage: "crash: restored tiles 142 ...
//               phase counter ice 1 locked ..." (gate leg 4, web)
//   audio       after the reload the page is cross-origin isolated (sw.js's
//               COOP/COEP), the game's context is open and resumed by a tap,
//               a fresh pair is matched, and an AnalyserNode tap on the
//               destination reads a positive RMS from an AudioWorkletNode
//               (P3 gate leg 3, the web half)
//   update      ruling D14: with the game running under a controlling service
//               worker, the arm serves a sw.js with a new version and asks for
//               an update check; the new worker must reach WAITING without any
//               reload (the page's token survives, no new boot line) and the
//               game must be told "waiting" (its HUD mark), not "prompt" (the
//               launch window has passed); on the next launch the game must
//               be told "prompt", a tap on its APPLY box must answer "apply",
//               and the page must then reload onto the new version
//   title       (P3d) a fresh boot on the menu with ?seed=7&baud=9600: the game's
//               grid at settle equals the data module the pipeline wrote, every
//               dot of every cell on the settled canvas reads as the block
//               patterns say, the settled frame is still, the same seed gives
//               the same tick digests and another seed does not, two boots
//               without ?seed take different seeds from the page's clock, and a tap
//               during the reveal skips it without choosing an entry
//   preload     (P3d, ruling D40) with the ambient delayed 4 s the boot outlasts the
//               reveal: a tap after the settle chooses nothing and boots no board,
//               "crash: boot done" then arrives with the audio step last, and the
//               tap then chooses STACK
//   manifest    Page.getAppManifest parses assets/manifest.webmanifest with no
//               errors, it names the icons, and Page.getInstallabilityErrors
//               is empty on this (loopback, so secure) origin
//   console     zero error-level console entries and zero exceptions
//
// Chrome is launched with PULSE_SINK and PIPEWIRE_NODE naming the worker-null
// sink (the leader's standing rule, 2026-09-19: an arm's headless Chrome
// reached David's speakers); this arm needs the audio path, so it is not
// muted, only routed. verify-field, verify-cards, measure-ms and shot-web
// add --mute-audio as well.
//
// The page is always driven at a devicePixelRatio other than 1 (2 on the
// desktop run, 3 with --phone), because at 1 the template's CSS-to-buffer
// factor and its inverse coincide and a wrong factor cannot be seen.
//
// --expect-no-selection is the positive control: run against a copy of the
// build whose page has POINTER_FORWARDING = false, tap-select must observe NO
// selection line, and keys-match must still remove a pair (so the arm is shown
// to see selections when they happen). tap-match is skipped in that mode.
//
// The tap target comes from the game's own boot line, so this arm proves the
// forwarding path (page -> dispatch -> input-frame -> board-select), not the
// geometry; test/test-input.sgl covers hit-testing natively and
// test/test-viewport.sgl the letterbox inverse.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--shot", "--port", "--cdp"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const EXPECT_NO_SELECTION = flag("--expect-no-selection");
const SHOT = opt("--shot", "/tmp/crash-the-stack-verify.png");
const PORT = parseInt(opt("--port", "8095"), 10);
const CDP = parseInt(opt("--cdp", "9235"), 10);
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png" };

const results = [];
// the music must reach the output (the ambient loop's RMS peaked near 0.1
// at gain 0.55; the theme's opening bars sit near 0.02-0.06 over its first
// seconds, D50), and with it off the match cue must rise the RMS by this
// much (its first ping alone peaks near 0.1 at gain 0.35; a muted cue gives 0)
const AUDIO_AMBIENT = 0.02;
const AUDIO_RISE = 0.04;
const planned = ["imports", "boot", "render", "tap-select", "tap-match", "keys-match", "tools", "menu", "removed", "assets", "hud", "traced", "bar", "reload", "audio", "update", "title", "preload", "slow-link", "menu-return", "screens", "settings", "pause", "run", "code", "daily", "scores", "manifest", "console"];
function pass(name, detail) { results.push([name, "PASS"]); console.log(`PASS ${name}${detail ? ": " + detail : ""}`); }
function fail(name, detail) { results.push([name, "FAIL"]); console.log(`FAIL ${name}: ${detail}`); }
function skip(name, detail) { results.push([name, "SKIP"]); console.log(`SKIP ${name}: ${detail}`); }
function notRun() { const done = new Set(results.map((r) => r[0])); return planned.filter((p) => !done.has(p)); }

// ---- 1. imports, from the file on disk (no browser needed) -----------------
{
  const wasmPath = path.join(ROOT, "crash-the-stack.wasm");
  if (!fs.existsSync(wasmPath)) { console.log(`SETUP-FAILED imports: ${wasmPath} missing`); process.exit(2); }
  const mod = new WebAssembly.Module(fs.readFileSync(wasmPath));
  const byModule = {};
  for (const imp of WebAssembly.Module.imports(mod)) (byModule[imp.module] = byModule[imp.module] || []).push(imp.name);
  const modules = Object.keys(byModule).sort();
  const expected = ["gl", "sigil_browser", "sigil_wasm_audio", "sigil_wasm_gles3", "wasi_snapshot_preview1"];
  const listing = modules.map((m) => `${m}(${byModule[m].length})`).join(" ");
  if (JSON.stringify(modules) === JSON.stringify(expected)) pass("imports", listing);
  else fail("imports", `expected modules ${expected.join(",")} got ${listing}`);
}

// ---- static server on loopback ---------------------------------------------
// swVersionOverride, when set, is stamped into the served sw.js in place of
// the build's version: how the update sub-arm plays a new deploy.
let swVersionOverride = null;
// slowPaths: path -> ms; the boot sub-arm delays one asset to hold the boot
const slowPaths = {};
// a path answered with this buffer instead of the file (the title leg stands a
// flat backdrop in for the real one: the boot needs the texture to land, D45,
// and the dot read needs a ground that is never a logo color)
const substitutePaths = {};
// a solid-color PNG of w x h (RGB, one filter-0 scanline per row, zlib, CRC32)
function solidPng(w, h, rgb) {
  const crcTable = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable.push(c >>> 0); }
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "ascii"), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { row[1 + x * 3] = rgb[0]; row[2 + x * 3] = rgb[1]; row[3 + x * 3] = rgb[2]; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  const serve = (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    if (urlPath === "/sw.js" && swVersionOverride) buf = Buffer.from(buf.toString().replace(/var VERSION = "[^"]*"/, `var VERSION = "${swVersionOverride}"`));
    const delay = slowPaths[urlPath] || 0;
    setTimeout(() => {
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
    }, delay);
  };
  if (substitutePaths[urlPath]) serve(null, substitutePaths[urlPath]); else fs.readFile(fp, serve);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ---- headless chrome + software WebGL --------------------------------------
// ---- no leaked chrome ----------------------------------------------------------
// A headless chrome from an earlier run (its user-data-dir under
// /tmp/crash-verify-*) once outlived the arm by hours with its GPU process
// at several cores (David, 2026-09-18). Refuse to start while a leaked
// one is alive, and kill this run's chrome as a whole process group on EVERY
// way out: normal, a failed assertion, the whole-run timeout, SIGINT,
// SIGTERM (what `timeout` sends), SIGHUP, an uncaught exception.
// A LEAKED chrome is one whose arm is gone (reparented to init) or
// older than any arm run (STALE_S); another arm running right now on
// its own ports beside this one is not a leak and is only noted.
const STALE_S = 600;
function leakedVerifyChromes() {
  const out = [], running = [];
  const hz = 100, uptime = parseFloat(fs.readFileSync("/proc/uptime", "utf8"));
  for (const pid of fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n))) {
    let cmd = "", stat = "";
    try { cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").join(" "); stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8"); } catch { continue; }
    const m = cmd.match(/--user-data-dir=(\/tmp\/crash-verify-[^ ]+)/);
    if (!m || !/chrome/.test(cmd) || /--type=/.test(cmd)) continue;
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    const ppid = Number(fields[1]), ageS = uptime - Number(fields[19]) / hz;
    const entry = { pid: Number(pid), dir: m[1], ppid, ageS: Math.round(ageS) };
    if (ppid === 1 || ageS > STALE_S) out.push(entry); else running.push(entry);
  }
  return { leaked: out, running };
}
{
  const { leaked, running } = leakedVerifyChromes();
  if (leaked.length) {
    console.log(`SETUP-FAILED: a chrome from an earlier run is still alive: ${leaked.map((c) => `pid ${c.pid} (${c.dir}, ${c.ageS} s, parent ${c.ppid})`).join(", ")}; kill it (kill -- -<pid> takes its helpers too) and rerun`);
    process.exit(2);
  }
  if (running.length) console.log(`note: another arm's chrome is running beside this one: ${running.map((c) => `pid ${c.pid} (${c.dir})`).join(", ")}`);
}

const udd = fs.mkdtempSync("/tmp/crash-verify-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  // the audio sub-arm: a synthetic tap is not a user gesture, so the
  // context must be allowed to run without one
  "--autoplay-policy=no-user-gesture-required",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The one way out. chrome was spawned detached, so -chrome.pid is its
// process group: the browser and every helper (GPU, renderers) go
// together, whether or not the browser process is still there.
function killChromeGroup(sig) {
  try { process.kill(-chrome.pid, sig); } catch { /* already gone */ }
}
let exiting = false;
function shutdown(code) {
  if (exiting) return; exiting = true;
  try { server.close(); } catch { /* not listening */ }
  killChromeGroup("SIGTERM");
  let tries = 0;
  const rm = () => {
    try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* still being written */ }
    if (fs.existsSync(udd) && ++tries < 15) { setTimeout(rm, 200); return; }
    if (fs.existsSync(udd)) console.log(`note: profile dir left behind: ${udd}`);
    process.exit(code);
  };
  setTimeout(() => { killChromeGroup("SIGKILL"); rm(); }, 2000).unref();
  const onExit = () => { rm(); };
  if (chrome.exitCode !== null) onExit(); else chrome.once("exit", onExit);
}
// The last line of defense runs synchronously as the process exits, so
// a chrome never outlives the arm whatever path led here.
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("SIGHUP", () => shutdown(129));
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
const WHOLE_RUN_MS = 900000;   // P3d added a throttled boot (slow-link: the 20 MB wasm at 8 Mbps is ~25 s), three boots (title), a 4 s held ambient (preload) and two 300-frame ms windows (menu-return); 180 s fired under loadavg 28
setTimeout(() => { console.log(`TIMED-OUT whole run after ${WHOLE_RUN_MS} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, WHOLE_RUN_MS).unref();

let pageWs = null;
for (let i = 0; i < 80 && !pageWs; i++) {
  try { const ts = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); const p = ts.find((t) => t.type === "page"); if (p && p.webSocketDebuggerUrl) pageWs = p.webSocketDebuggerUrl; } catch {}
  await sleep(250);
}
if (!pageWs) { console.log("SETUP-FAILED: no chrome page target after 20 s; did not run: " + notRun().join(" ")); shutdown(2); }

const ws = new WebSocket(pageWs);
let msgId = 0; const pending = new Map();
const consoleLines = [];   // every console.log/warn text, in order
const consoleErrors = [];  // error-level entries and exceptions
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
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") consoleErrors.push("log: " + msg.params.entry.text);
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
// The audio tap (P3 gate leg 3, the web half): before any page script,
// every AudioNode.connect to a context's destination also feeds an
// AnalyserNode, and the connecting node's kind is remembered, so the arm
// can read the output's level and which path the bridge took
// (AudioWorkletNode under cross-origin isolation, ScriptProcessorNode
// otherwise) without touching the bridge.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `(function () {
  var tap = { nodes: [], analysers: [] };
  window.__crashAudioTap = tap;
  var connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      if (dest && dest.context && dest === dest.context.destination) {
        var an = dest.context.createAnalyser();
        an.fftSize = 32768;   // 680 ms at 48 kHz: a 160 ms cue cannot fall between two 50 ms reads under load (peaks of 0.02-0.03 did, three runs in ten)
        connect.call(this, an);
        tap.analysers.push(an);
        tap.nodes.push(this.constructor.name);
      }
    } catch (e) { tap.error = String(e); }
    return connect.apply(this, arguments);
  };
})();` });
// Never run at devicePixelRatio 1: the page's CSS-to-buffer factor is then 1 and
// its inverse is also 1, so a wrong factor (sabotage S5) is invisible. Measured
// 2026-09-16: the arm stayed green under S5 until this override existed.
if (PHONE) {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  // a phone: a coarse pointer that cannot hover, and touch, so the game
  // starts with its hint tags hidden (David's rule) and the arm shows them
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
} else {
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });
  // a desktop with a mouse (headless Chrome otherwise reports hover: none,
  // which reads as a touch screen)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "fine" }, { name: "hover", value: "hover" }] });
}

async function evalJS(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

// The canvas over a virtual rect (x y w h), one sample per virtual pixel
// at the pixel's center, read inside an animation frame like the render
// leg: { w, h, px: [r,g,b, ...] }. Palette matching happens here in node.
async function readRegion(x, y, w, h) {
  return evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
    const g = off.getContext("2d"); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const px = [];
    for (let j = 0; j < ${h}; j++) for (let i = 0; i < ${w}; i++) {
      const bx = Math.floor(ox + (${x} + i + 0.5) * scale), by = Math.floor(oy + (${y} + j + 0.5) * scale);
      const k = (by * c.width + bx) * 4; px.push(d[k], d[k + 1], d[k + 2]);
    }
    resolve({ w: ${w}, h: ${h}, px });
  }))`);
}
const PAL = { bg: [13, 10, 26], ice: [255, 159, 26], highlight: [255, 89, 217], textDim: [115, 128, 166], text: [204, 230, 255] };
const near = (px, i, c, tol = 40) => Math.abs(px[i] - c[0]) <= tol && Math.abs(px[i + 1] - c[1]) <= tol && Math.abs(px[i + 2] - c[2]) <= tol;
// the bounding box (in the region's own coordinates) of the pixels near a
// palette color, or null; and how many
function bbox(region, color) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, n = 0;
  for (let j = 0; j < region.h; j++) for (let i = 0; i < region.w; i++) {
    if (near(region.px, (j * region.w + i) * 3, color)) { n++; x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
  }
  return n ? { x0, y0, x1, y1, n } : null;
}
const sameRegion = (a, b) => a.w === b.w && a.h === b.h && a.px.every((v, i) => Math.abs(v - b.px[i]) <= 8);
const litCount = (r) => { let n = 0; for (let i = 0; i < r.px.length; i += 3) if (!near(r.px, i, PAL.bg, 30)) n++; return n; };

// Wait for a console line matching `re` that arrived at index >= from.
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
function timedOut(name) {
  console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`);
  dump(); shutdown(2);
}

// ---- 2. boot ----------------------------------------------------------------
// ?trace switches on the game's console lines; a player's page prints nothing.
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack` });
const BOOT_RE = /^crash: seed (\d+) tiles (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) (\d+) (-?[\d.]+) (-?[\d.]+)$/;
// any boot line, a restored board's "pair none" included
const BOOT_ANY = /^crash: seed \d+ tiles \d+ pair /;
const boot = await waitLine(BOOT_RE, 0, 20000);
if (!boot) { fail("boot", "no boot line within 20 s"); timedOut("boot"); await new Promise(() => {}); }
const [, seed, tiles0, A, AX, AY, B, BX, BY] = boot.m;
// the quoted literals' shapes (a sigil wasm runtime bug corrupted one on
// 2026-09-19; the game checks them at boot and says so)
const literals = await waitLine(/^crash: literal-check (ok|FAILED.*)$/, 0, 2000);
if (tiles0 !== "144") fail("boot", `expected a fresh 144-tile board, got tiles ${tiles0}`);
else if (!literals) fail("boot", "no \"crash: literal-check\" boot line");
else if (literals.m[1] !== "ok") fail("boot", `the game's literal check: ${literals.m[1]}`);
else pass("boot", `seed ${seed} tiles ${tiles0} pair ${A}@(${AX},${AY}) ${B}@(${BX},${BY}); literals ok`);
await sleep(1500); // a few frames so the first draw has happened

// ---- 3. render --------------------------------------------------------------
// Read the WebGL canvas inside an animation frame: the game's tick registered
// its next frame first, so a callback registered now runs after the draw and
// before the buffer is discarded.
const px = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
  const c = document.getElementById("stage");
  const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
  const g = off.getContext("2d"); g.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  // the board region: the middle 80% of the viewport
  const x0 = Math.floor(c.width * 0.1), x1 = Math.floor(c.width * 0.9);
  const y0 = Math.floor(c.height * 0.1), y1 = Math.floor(c.height * 0.8);
  let lit = 0, total = 0; const colors = new Set();
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * c.width + x) * 4; const r = d[i], gg = d[i + 1], b = d[i + 2]; total++;
    if (r + gg + b > 120) { lit++; colors.add(((r >> 5) << 6) | ((gg >> 5) << 3) | (b >> 5)); }
  }
  resolve({ lit, total, colors: colors.size, w: c.width, h: c.height });
}))`);
if (px.lit > px.total * 0.15 && px.colors >= 6) pass("render", `${px.lit}/${px.total} sampled pixels lit, ${px.colors} color bins, buffer ${px.w}x${px.h}`);
else fail("render", `lit ${px.lit}/${px.total}, color bins ${px.colors}, buffer ${px.w}x${px.h}`);

// ---- 4. tap-select ----------------------------------------------------------
// virtual center -> buffer pixel (the letterbox the game applies) -> CSS point
// on the canvas -> a PointerEvent the page template's listener sees.
async function tap(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    const cx = r.left + bx * r.width / c.width, cy = r.top + by * r.height / c.height;
    c.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
    return { cx, cy, bx, by, css: [r.width, r.height], buffer: [c.width, c.height] };
  })()`);
}
let mark = consoleLines.length;
const t1 = await tap(AX, AY);
if (EXPECT_NO_SELECTION) {
  const sel = await waitLine(/^crash: (select|removed) /, mark, 1500);
  if (!sel) pass("tap-select", `expected no selection and saw none in 1.5 s (tap at css ${t1.cx.toFixed(1)},${t1.cy.toFixed(1)})`);
  else fail("tap-select", `expected no selection, got "${sel.m[0]}"`);
  skip("tap-match", "not meaningful without a selection");
} else {
  const sel = await waitLine(/^crash: select (\d+)$/, mark, 3000);
  if (!sel) fail("tap-select", `no "crash: select" line within 3 s after tap at css ${t1.cx.toFixed(1)},${t1.cy.toFixed(1)} (buffer ${t1.bx.toFixed(1)},${t1.by.toFixed(1)}; css ${t1.css.join("x")}, buffer ${t1.buffer.join("x")})`);
  else if (sel.m[1] !== A) fail("tap-select", `expected select ${A}, got select ${sel.m[1]}`);
  else pass("tap-select", `select ${A} (tap at css ${t1.cx.toFixed(1)},${t1.cy.toFixed(1)})`);

  // ---- 5. tap-match ---------------------------------------------------------
  mark = consoleLines.length;
  await tap(BX, BY);
  const rem = await waitLine(/^crash: removed (\d+) (\d+) tiles (\d+)$/, mark, 3000);
  if (!rem) fail("tap-match", `no "crash: removed" line within 3 s`);
  else {
    const gone = [rem.m[1], rem.m[2]].sort((a, b) => a - b).join(" ");
    const want = [A, B].sort((a, b) => a - b).join(" ");
    if (gone === want && rem.m[3] === "142") pass("tap-match", rem.m[0]);
    else fail("tap-match", `expected removed ${want} tiles 142, got "${rem.m[0]}"`);
  }
}

// ---- 6. keys-match (hint mode, the default keyboard model) -------------------
// The game's second boot line gives the first pair's hint tags (one or two
// letters each, on every uncovered tile). Typing A's tag must select A and
// typing B's tag must remove the pair. In the normal run the pair is already
// gone after tap-match, so the arm taps the game's UNDO control first (the
// pointer path through (crash input)'s control rects), which puts the tiles
// back and prints "crash: undo tiles 144"; the tags come back with the
// board. In the positive-control run the board is still full and no undo is
// needed (and with forwarding off the control could not be tapped anyway).
async function key(type, k) {
  await evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
}
async function press(k) { await key("keydown", k); await sleep(40); await key("keyup", k); await sleep(120); }
async function type(tag) { for (const ch of tag) await press(ch); }
// A tool through the pointer path (ruling D33): tap the corner button
// ("crash: control tool X Y"), wait for the stack to open and print its
// entries, tap the named one, wait for the stack to close. Answers "" or
// what went wrong.
async function tool(name) {
  const btn = await waitLine(/^crash: control tool (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
  if (!btn) return "no \"crash: control tool\" boot line";
  const from = consoleLines.length;
  await tap(btn.m[1], btn.m[2]);
  const open = await waitLine(/^crash: tools open$/, from, 2000);
  if (!open) return "the tool button opened no stack";
  const entry = await waitLine(new RegExp(`^crash: tool ${name} (-?[\\d.]+) (-?[\\d.]+) (on|off)$`), from, 2000);
  if (!entry) return `no "crash: tool ${name}" entry line`;
  if (entry.m[3] !== "on") return `the ${name} tool is disabled`;
  // the slide takes 8 ticks plus the stagger; wait it out before the tap
  await sleep(350);
  const before = consoleLines.length;
  await tap(entry.m[1], entry.m[2]);
  const closed = await waitLine(/^crash: tools closed$/, before, 2000);
  if (!closed) return `the ${name} entry did not close the stack`;
  return "";
}
const labels = await waitLine(/^crash: labels (\d+) ([a-z]+) (\d+) ([a-z]+)$/, 0, 2000);
let keysOk = false, keysDetail = "";
if (!labels) keysDetail = "no \"crash: labels\" boot line";
else {
  const [, LA, tagA, LB, tagB] = labels.m;
  const tapped = results.some((r) => r[0] === "tap-match" && r[1] === "PASS");
  if (!EXPECT_NO_SELECTION && !tapped) keysDetail = "SKIP: no pair removed by tap-match, nothing to undo";
  else if (!EXPECT_NO_SELECTION) {
    mark = consoleLines.length;
    const err = await tool("undo");
    if (err) keysDetail = `UNDO through the tool stack: ${err}`;
    else {
      const undo = await waitLine(/^crash: undo tiles (\d+)$/, mark, 2000);
      if (!undo) keysDetail = `the UNDO tool produced no "crash: undo" line`;
    }
  }
  if (!keysDetail) {
    // a touch screen starts with the tags hidden; Tab shows them (the game's
    // own "crash: tags" boot line says which; Space is the tool stack's, D33)
    const tags = await waitLine(/^crash: tags (shown|hidden) touch (on|off)/, 0, 2000);
    if (PHONE && (!tags || tags.m[2] !== "on")) keysDetail = `phone emulation but the game saw touch ${tags ? tags.m[2] : "?"}`;
    else if (tags && tags.m[1] === "hidden") { await press("Tab"); await sleep(150); }
  }
  if (!keysDetail) {
    mark = consoleLines.length;
    await type(tagA);
    const sel = await waitLine(/^crash: select (\d+)$/, mark, 2000);
    if (!sel) keysDetail = `no "crash: select" after typing ${tagA}`;
    else if (sel.m[1] !== LA) keysDetail = `expected select ${LA} after ${tagA}, got select ${sel.m[1]}`;
    else {
      mark = consoleLines.length;
      await type(tagB);
      const rem = await waitLine(/^crash: removed (\d+) (\d+) tiles (\d+)$/, mark, 2000);
      if (!rem) keysDetail = `no "crash: removed" after typing ${tagB}`;
      else if (rem.m[3] !== "142") keysDetail = `expected tiles 142, got "${rem.m[0]}"`;
      else { keysOk = true; keysDetail = `hint mode, ${tagA} then ${tagB}: ${rem.m[0]}`; }
    }
  }
}
if (keysOk) pass("keys-match", keysDetail);
else if (keysDetail.startsWith("SKIP: ")) skip("keys-match", keysDetail.slice(6));
else fail("keys-match", keysDetail);

// ---- 6a. tools: the tool stack by keyboard (ruling D33) ---------------------
// Space opens it (a "crash: tools open" line); while it is open a tile's
// tag letter reaches nothing (no "crash: select"); H fires HINT (the trace
// line counts one hint) and closes it; a tap outside closes it without a
// choice. With forwarding off the taps cannot land, so only the keys run.
{
  let detail = "";
  const tags = await waitLine(/^crash: tags (shown|hidden) touch (on|off)/, 0, 2000);
  mark = consoleLines.length;
  await press(" ");
  const open = await waitLine(/^crash: tools open$/, mark, 2000);
  if (!open) detail = "Space opened no stack (no \"crash: tools open\" line)";
  else {
    if (tags && tags.m[1] === "shown") {
      // a tile tag's letter while the stack is open (a, no tool's tag):
      // modal, nothing selected, the stack still open
      const before = consoleLines.length;
      await press("a");
      await sleep(200);
      const sel = consoleLines.slice(before).find((l) => /^crash: select /.test(l));
      if (sel) detail = `a tile tag typed with the stack open selected a tile (${sel})`;
      else if (consoleLines.slice(before).some((l) => l === "crash: tools closed")) detail = "a tile tag's letter closed the stack";
    }
    if (!detail) {
      mark = consoleLines.length;
      await press("h");
      const closed = await waitLine(/^crash: tools closed$/, mark, 2000);
      const traced = await waitLine(/^crash: trace (\d+) 1 (\d+) trace 0$/, mark, 2000);
      if (!closed) detail = "H did not close the stack";
      else if (!traced) detail = "H fired no hint (no trace line counting one hint)";
    }
    if (!detail && !EXPECT_NO_SELECTION) {
      mark = consoleLines.length;
      await press(" ");
      const open2 = await waitLine(/^crash: tools open$/, mark, 2000);
      if (!open2) detail = "Space did not reopen the stack";
      else {
        await sleep(350);
        mark = consoleLines.length;
        await tap(600, 60);
        const closed2 = await waitLine(/^crash: tools closed$/, mark, 2000);
        if (!closed2) detail = "a tap outside the column did not close the stack";
        else if (consoleLines.slice(mark).some((l) => /^crash: (trace|shuffle|undo|select)/.test(l))) detail = "a tap outside the column fired something";
      }
    }
  }
  if (detail) fail("tools", detail);
  else pass("tools", "Space opens, a tile tag is refused while open, H fires HINT and closes, a tap outside closes");
}

// From a live table to the main menu (D51): Escape opens the table's own
// overlay ("crash: pause on TICKS", its rows), and its exit row (BACK TO
// MENU in free play, DISCONNECT in a run) lands on the main menu's top
// screen. Answers the top line's index, or null with the reason in
// toMenuDetail.
let toMenuDetail = "";
async function toMenu(how) {
  const m0 = consoleLines.length;
  if (how === "button") {
    const btn = await waitLine(/^crash: control menu (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    if (!btn) { toMenuDetail = "no \"crash: control menu\" boot line"; return null; }
    await tap(btn.m[1], btn.m[2]);
  } else {
    await press("Escape");
  }
  const on = await waitLine(/^crash: pause on (\d+)$/, m0, 3000);
  const rows = on && await waitLine(/^crash: menu pause (.*)$/, m0, 3000);
  if (!on) { toMenuDetail = `${how}: no \"crash: pause on\" (the table's overlay did not open)`; return null; }
  if (!rows) { toMenuDetail = `${how}: the overlay said no rows`; return null; }
  const parts = rows.m[1].split(" ");
  const i = parts.findIndex((w) => w === "back-to-menu" || w === "disconnect");
  if (i < 0) { toMenuDetail = `${how}: the overlay has no exit row: ${rows.m[1]}`; return null; }
  const m1 = consoleLines.length;
  await tap(parseFloat(parts[i + 1]), parseFloat(parts[i + 2]));
  const top = await waitLine(/^crash: menu top /, m1, 3000);
  if (!top) { toMenuDetail = `${how}: the exit row ${parts[i]} did not land on the main menu`; return null; }
  return top;
}

// ---- 6a2. menu: Escape and the bar's MENU button open the menu (David 2026-09-19) --
// Escape on the board prints the menu's boot line; Enter on CONTINUE comes
// back to the same board (its boot line says tiles 142, the matched pair
// gone); then the button beside the wrench ("crash: control menu X Y")
// does the same by tap.
{
  let detail = "";
  const back = async (how) => {
    const m0 = consoleLines.length;
    await press("Enter");
    const chose = await waitLine(/^crash: menu chose continue$/, m0, 3000);
    const again = await waitLine(BOOT_ANY, m0, 5000);
    if (!chose) return `${how}: Enter on the menu did not choose CONTINUE`;
    if (!again) return `${how}: no boot line after CONTINUE`;
    await sleep(300);
    return "";
  };
  mark = consoleLines.length;
  // the menu is live only once the boot's steps are done (ruling D40): the
  // first visit's boot can outlast these sub-arms under load
  if (!(await waitLine(/^crash: boot done /, 0, 20000))) fail("menu", "no \"crash: boot done\" within 20 s of the boot");
  const menu = await toMenu("Escape");
  if (!menu) detail = toMenuDetail;
  else if (!/^crash: menu top continue /.test(consoleLines[menu.index])) detail = `the main menu opened without CONTINUE first: ${consoleLines[menu.index]}`;
  else {
    // the entries (P4, D14 and D19): CONTINUE, JACK IN, FREE PLAY, SETTINGS,
    // CREDITS, and UPDATE only while a version waits; the prototype rows
    // (LOOK, HUD, DEPTH) and the bare tables are gone
    const ids = consoleLines[menu.index].split(" ").slice(3).filter((w) => /^[a-z-]+$/.test(w));
    if (ids.some((id) => !["continue", "jack-in", "free-play", "settings", "credits", "update"].includes(id))) detail = `the menu shows an entry that is not the top screen's: ${ids.join(" ")}`;
    else if (ids.join(" ") !== "continue jack-in free-play settings credits") detail = `the menu's entries are ${ids.join(" ")}, not continue jack-in free-play settings credits`;
    else detail = await back("Escape");
  }
  if (!detail && !EXPECT_NO_SELECTION) {
    const menu2 = await toMenu("button");
    if (!menu2) detail = toMenuDetail;
    else detail = await back("the MENU button");
  }
  if (detail) fail("menu", detail);
  else pass("menu", "Escape opens the table's overlay and BACK TO MENU lands on the main menu with CONTINUE, which returns; the MENU button beside the wrench does the same");
}

// ---- 6b. removed: the polish row's prototype toggles do nothing ----------
// One look ("crash: look a" at boot and never again); a tap on the TILES
// readout and a tap on the meter change nothing: no look, trace, select
// or shuffle line, the meter's face still TRACE (its first five glyphs'
// pixels unchanged; a flip to clean would draw TIME), and the readout's
// pixels unchanged. The rects come from the "crash: bar" line. The ctrl
// chords (ctrl+t, ctrl+m) cannot be tested here: the loader drops every
// keydown with ctrlKey (sigil-web-app.js wireEvents), so they never reach
// the game on the web; a planted ctrl+m flip left this leg green
// (2026-09-20). test/test-hud.sgl and test/test-input.sgl hold them.
const BAR_RE = /^crash: bar meter (-?\d+) (-?\d+) (\d+) (\d+) readout (-?\d+) (-?\d+) (\d+) (\d+)$/;
let barRects = null;
{
  let detail = "";
  const boot = await waitLine(/^crash: look ([a-z-]+)$/, 0, 2000);
  const bar = await waitLine(BAR_RE, 0, 2000);
  if (!boot) detail = "no \"crash: look\" boot line";
  else if (boot.m[1] !== "a") detail = `the look at boot is ${boot.m[1]}, not a`;
  else if (!bar) detail = "no \"crash: bar meter ... readout ...\" boot line";
  else if (consoleLines.some((l) => /^crash: control (look|mode) /.test(l))) detail = "the boot still lists a look or mode control";
  else {
    barRects = { meter: bar.m.slice(1, 5).map(Number), readout: bar.m.slice(5, 9).map(Number) };
    const [mx, my] = barRects.meter, [rx, ry, rw, rh] = barRects.readout;
    const face = () => readRegion(mx + 3, my + 2, 30, 14);
    const readout = () => readRegion(rx, ry, rw, rh);
    const face0 = await face(), readout0 = await readout();
    mark = consoleLines.length;
    if (!EXPECT_NO_SELECTION) {
      await tap(rx + rw / 2, ry + rh / 2); await sleep(300);
      await tap(mx + 20, my + 6); await sleep(300);
    }
    const stray = consoleLines.slice(mark).filter((l) => /^crash: (look|trace|select|deselect|shuffle|undo|removed|tools) /.test(l) || /^crash: (shuffle|tools open)$/.test(l));
    const face1 = await face(), readout1 = await readout();
    if (stray.length) detail = `the readout tap or the meter tap did something: ${stray.slice(0, 3).join(" | ")}`;
    else if (litCount(face0) < 20) detail = `the meter's face shows nothing to compare (${litCount(face0)} lit pixels)`;
    else if (!sameRegion(face0, face1)) detail = "the meter's face changed (a flip to the clean face draws TIME where TRACE was)";
    else if (!sameRegion(readout0, readout1)) detail = "the TILES readout's pixels changed";
  }
  if (detail) fail("removed", detail);
  else if (EXPECT_NO_SELECTION) pass("removed", "one look (a); no look or mode control listed (the taps need forwarding)");
  else pass("removed", "one look (a); the readout tap and the meter tap changed nothing (no line, the meter's face and the readout pixel-identical); the ctrl chords are the unit tests' (the loader drops them)");
}

// ---- 6c. assets: everything the page fetched answered (P3 leg 2, web) -----
{
  try {
    const entries = await evalJS(`JSON.stringify(performance.getEntriesByType("resource").map((e) => [e.name.replace(location.origin + "/", ""), e.responseStatus]))`);
    const list = JSON.parse(entries);
    // every entry is same-origin (the page loads nothing else), so a status
    // other than 200 is a failure, 0 included (blocked, or never answered)
    // a fetch that failed and was asked for again (the ambient, a texture:
    // P3d, D40 starts them early and the page retries) is a later 200 for
    // the same name; counted and shown, not failed
    const retried = list.filter(([n, st], i) => st !== 200 && list.some(([m, s2], j) => j > i && m === n && s2 === 200));
    const bad = list.filter(([n, st]) => st !== 200 && !retried.some(([m]) => m === n));
    const assets = list.filter(([n]) => n.startsWith("assets/") || n.endsWith(".wasm"));
    // the losing looks' assets left the tree with the polish row: nothing
    // may still ask for them
    const gone = list.filter(([n]) => /^assets\/(test-tile\.png|tiles\/|glyphs\/b\.png)/.test(n));
    if (list.length === 0) fail("assets", "no resource entries at all");
    else if (bad.length) fail("assets", `${bad.length} of ${list.length} resources not 200: ${JSON.stringify(bad.slice(0, 5))}`);
    else if (assets.length === 0) fail("assets", `${list.length} resources, none under assets/ or the wasm`);
    else if (gone.length) fail("assets", `the page asked for a removed look's asset: ${gone.map(([n]) => n).join(" ")}`);
    else pass("assets", `${list.length} resources all 200${retried.length ? ` (${retried.length} retried after a failed first fetch)` : ""}, ${assets.length} assets/wasm, none of the removed looks' files`);
  } catch (err) {
    fail("assets", `CDP: ${err.message}`);
  }
}

// ---- 6d. hud: the one layout (A, zones; B and its setting left, D51) --------
{
  const zones = await waitLine(/^crash: hud (\w+)$/, 0, 2000);
  const meter = await waitLine(BAR_RE, 0, 2000);
  if (!zones || zones.m[1] !== "zones") fail("hud", `the boot's layout line was ${zones ? zones.m[0] : "missing"}, not zones`);
  else if (!meter) fail("hud", "no \"crash: bar meter\" line on the boot");
  // the padding (David's phone read, 2026-09-20): a pixel above and below the text, 18 tall
  else if (meter.m[4] !== "18") fail("hud", `the meter's height is ${meter.m[4]}, not 18`);
  else pass("hud", `zones, meter ${meter.m.slice(1, 5).join("x")}`);
}

// ---- 7. traced: the trace completes and the ICE fires, through SHUF --------
// Each shuffle costs SHUFFLE_COST on the trace, so SHUFFLES taps take the
// value past TRACE_AT and the next tick completes the trace ("crash: trace
// V H SHUFFLES counter 0"); the first
// counter-hack fires ICE-FIRST (10 s) later: "crash: trace ... counter 1"
// with either "crash: lock A B" or one more "crash: shuffle". With
// forwarding off the control cannot be tapped, so the positive-control run
// skips this.
const TRACE_AT = 180, SHUFFLE_COST = 60, SHUFFLES = Math.ceil(TRACE_AT / SHUFFLE_COST);
let iceLock = null;
{
  if (EXPECT_NO_SELECTION) skip("traced", "controls are not tappable with forwarding off");
  else {
    let detail = "";
    for (let i = 0; i < SHUFFLES && !detail; i++) {
      mark = consoleLines.length;
      const err = await tool("shuf");
      if (err) detail = `shuffle ${i + 1} through the tool stack: ${err}`;
      else {
        const sh = await waitLine(/^crash: shuffle$/, mark, 2000);
        if (!sh) detail = `shuffle ${i + 1}: no "crash: shuffle" line`;
      }
      await sleep(150);
    }
    if (!detail) {
      const traced = await waitLine(new RegExp(`^crash: trace (\\d+) (\\d+) ${SHUFFLES} counter 0$`), 0, 3000);
      if (!traced) detail = `${SHUFFLES} shuffles did not complete the trace (no "crash: trace V H ${SHUFFLES} counter 0" line)`;
      else {
        mark = traced.index + 1;
        const ice = await waitLine(/^crash: trace (\d+) (\d+) (\d+) counter 1$/, mark, 16000);
        if (!ice) detail = "no counter-hack within 16 s of the trace completing";
        else {
          const lock = consoleLines.slice(mark, ice.index + 3).map((l) => l.match(/^crash: lock (\d+) (\d+)$/)).find(Boolean);
          const remaps = consoleLines.slice(mark, ice.index + 3).filter((l) => l === "crash: remap").length;
          const scramble = consoleLines.slice(mark, ice.index + 3).map((l) => l.match(/^crash: scramble((?: \d+)+)$/)).find(Boolean);
          if (lock) { iceLock = [lock[1], lock[2]]; pass("traced", `traced after ${SHUFFLES} shuffles; ICE 1 locked ${lock[1]} ${lock[2]}`); }
          else if (remaps) pass("traced", `traced after ${SHUFFLES} shuffles; ICE 1 remapped the stack`);
          else if (scramble && scramble[1].trim().split(" ").length === 6) pass("traced", `traced after ${SHUFFLES} shuffles; ICE 1 scrambled${scramble[1]}`);
          else if (scramble) detail = `ICE 1 scrambled ${scramble[1].trim().split(" ").length} faces, not 6`;
          else detail = `ICE 1 fired (${ice.m[0]}) but no lock, remap or scramble line followed`;
        }
      }
    }
    if (detail) fail("traced", detail);
  }
}

// ---- 7b. bar: the HUD's polish (David's reads, 2026-09-19/20) ------------------
// Under the ICE (the traced leg's counter phase): (1) the keys line (92
// glyphs, wider than the span between the MENU and ? buttons) wraps onto
// two rows and the wrench and MENU buttons' pixels stay what they were
// with the one-row instruction: nothing of the line lands on a button;
// (2) the ? button ("crash: control keys") is a 24x24 square at the bar's
// right end, lit while the keys line shows, and a tap on it puts the phase
// line back (the band's rows pixel-identical to before ?); (3) a typed tag
// letter's prompt ("> A", C-HIGHLIGHT) sits left of the meter while ICE
// IN (C-ICE) sits at its right: the two bounding boxes are disjoint and on
// opposite sides of the meter's box.
{
  if (EXPECT_NO_SELECTION) skip("bar", "controls are not tappable with forwarding off");
  else if (!barRects) skip("bar", "no bar rects from the boot line");
  else {
    let detail = "";
    const keysCtl = await waitLine(/^crash: control keys (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    const toolCtl = await waitLine(/^crash: control tool (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    const menuCtl = await waitLine(/^crash: control menu (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    const [mx, my, mw, mh] = barRects.meter, [rx] = barRects.readout;
    const top = VH - 48;
    const button = (ctl) => readRegion(Math.round(ctl.m[1]) - 12, Math.round(ctl.m[2]) - 12, 24, 24);
    // the band's text rows between the buttons: y top+22..top+41
    const rows = () => readRegion(60, top + 22, VW - 60 - 32, 20);
    if (!keysCtl || !toolCtl || !menuCtl) detail = "a bar button's control line is missing";
    else if (Math.round(keysCtl.m[1]) !== VW - 16 || Math.round(keysCtl.m[2]) !== VH - 16) detail = `the ? button's center is (${keysCtl.m[1]},${keysCtl.m[2]}), not (${VW - 16},${VH - 16})`;
    // nothing draws under the ? button (David's laptop read): the readout
    // box, which the readout rows are right-aligned to, ends left of it
    else if (barRects.readout[0] + barRects.readout[2] > Math.round(keysCtl.m[1]) - 12 - 2) detail = `the readout box ends at ${barRects.readout[0] + barRects.readout[2]}, under the ? button (left edge ${Math.round(keysCtl.m[1]) - 12})`;
    else {
      const phase = consoleLines.some((l) => /^crash: trace \d+ \d+ \d+ counter \d+$/.test(l));
      const wrench0 = await button(toolCtl), menu0 = await button(menuCtl), keys0 = await button(keysCtl), rows0 = await rows();
      await press("?"); await sleep(400);
      const wrench1 = await button(toolCtl), menu1 = await button(menuCtl), keys1 = await button(keysCtl), rows1 = await rows();
      if (sameRegion(rows0, rows1)) detail = "? did not change the band's rows (no keys line)";
      else if (!sameRegion(wrench0, wrench1)) detail = "the keys line changed the wrench button's pixels";
      else if (!sameRegion(menu0, menu1)) detail = "the keys line changed the MENU button's pixels";
      else if (sameRegion(keys0, keys1)) detail = "the ? button did not light with the keys line";
      // the keys line wraps: lit pixels on both rows (top+24..30 and top+33..39)
      else {
        const upper = await readRegion(60, top + 24, VW - 92, 7), lower = await readRegion(60, top + 33, VW - 92, 7);
        if (litCount(upper) < 50 || litCount(lower) < 50) detail = `the keys line did not wrap onto two rows (lit pixels upper ${litCount(upper)}, lower ${litCount(lower)})`;
      }
      if (!detail) {
        mark = consoleLines.length;
        await tap(keysCtl.m[1], keysCtl.m[2]); await sleep(400);
        const rows2 = await rows(), keys2 = await button(keysCtl);
        if (consoleLines.slice(mark).some((l) => /^crash: (select|tools open)/.test(l))) detail = "the tap on ? selected a tile or opened the stack";
        else if (!sameRegion(keys0, keys2)) detail = "the tap on ? did not put the button back";
        // (the phase line's clocks tick, so the rows are compared with the
        // keys line's, not with the first read)
        else if (sameRegion(rows1, rows2)) detail = "the tap on ? did not put the line back";
      }
      if (!detail && !phase) detail = "the traced leg did not reach the ICE, so the prompt / ICE IN lanes went unchecked";
      if (!detail && phase) {
        // the prompt and ICE IN
        const ice0 = bbox(await readRegion(mx + mw, my, rx - mx - mw, mh), PAL.ice);
        // a typed letter needs the tags shown: hidden on a phone (Tab shows
        // them), shown on a desktop already
        const tagsLine = consoleLines.slice().reverse().find((l) => /^crash: tags (shown|hidden) /.test(l));
        const hidden = !tagsLine || /hidden/.test(tagsLine);
        if (hidden) { await press("Tab"); await sleep(200); }
        await press("a"); await sleep(400);
        const left = await readRegion(mx - 90, my - 2, 90, mh + 4);
        const right = await readRegion(mx + mw, my, rx - mx - mw, mh);
        const prompt = bbox(left, PAL.highlight), ice = bbox(right, PAL.ice), strayPrompt = bbox(right, PAL.highlight), strayIce = bbox(left, PAL.ice);
        await press("Backspace"); await sleep(100);
        if (hidden) { await press("Tab"); await sleep(200); }
        if (!ice0) detail = "no ICE IN (C-ICE) pixels right of the meter under the ICE";
        else if (!prompt) detail = "no prompt (C-HIGHLIGHT) pixels left of the meter after typing a tag letter";
        else if (strayPrompt) detail = "prompt pixels right of the meter (over the ICE countdown's lane)";
        else if (strayIce) detail = "ICE IN pixels left of the meter (over the prompt's lane)";
        else if (mx - 90 + prompt.x1 >= mx) detail = "the prompt reaches into the meter's box";
        else if (!ice) detail = "ICE IN vanished while the prompt showed";
      }
    }
    if (detail) fail("bar", detail);
    else pass("bar", `keys line wraps clear of the wrench and MENU; ? is a lit 24x24 button at (${keysCtl.m[1]},${keysCtl.m[2]}) and a tap on it toggles back; the prompt sits left of the meter, ICE IN right of it, disjoint`);
  }
}

// ---- 8. reload: the saved board comes back (gate leg 4, the web half) --------
// A fresh Chrome profile means an empty localStorage at the first boot (the
// boot line said tiles 144). After the taps above the board has 142 tiles,
// three shuffles and one locked pair; a reload must restore exactly that.
// The count in play is read from the page's own last "tiles N" line (a
// boot, a removal, an undo or a restore), and the sequence is held to 142
// separately: a leg that broke off on a fresh page once left 144 in play
// and this leg blamed the restore (2026-09-20).
{
  const tracedOk = results.some((r) => r[0] === "traced" && r[1] === "PASS");
  if (EXPECT_NO_SELECTION) skip("reload", "nothing was changed to restore with forwarding off");
  else if (!tracedOk) skip("reload", "the traced sub-arm did not reach a state to restore");
  else {
    const inPlay = consoleLines.slice().reverse().map((l) => l.match(/^crash: (?:seed \d+|removed(?: \d+)+|undo|restored) tiles (\d+)/)).find(Boolean);
    mark = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack` });
    const restored = await waitLine(/^crash: restored tiles (\d+) trace (\d+) phase (\w+) ice (\d+) locked ?((?:\d+ ?)*)$/, mark, 20000);
    if (!inPlay) fail("reload", "no \"tiles N\" line before the reload to hold the restore to");
    else if (inPlay[1] !== "142") fail("reload", `the legs before this one left ${inPlay[1]} tiles in play, not 142 (the sequence, not the restore, is off: ${inPlay[0]})`);
    else if (!restored) fail("reload", `no "crash: restored" line within 20 s of the reload`);
    else {
      const got = restored.m[5].trim().split(/\s+/).filter(Boolean).sort((a, b) => a - b).join(" ");
      const want = iceLock ? iceLock.slice().sort((a, b) => a - b).join(" ") : "";
      if (restored.m[1] !== inPlay[1]) fail("reload", `expected tiles ${inPlay[1]} after the reload (the page's last count), got ${restored.m[0]}`);
      else if (restored.m[3] !== "counter") fail("reload", `expected phase counter after the reload, got ${restored.m[0]}`);
      else if (parseInt(restored.m[4], 10) < 1) fail("reload", `expected at least one counter-hack restored, got ${restored.m[0]}`);
      else if (iceLock && got !== want) fail("reload", `expected locked ${want}, got ${restored.m[0]}`);
      else pass("reload", restored.m[0]);
    }
  }
}

// ---- 8b. audio: the match cue reaches the output (gate leg 3, web) ---------
// After the reload the page is controlled by the service worker, which adds
// COOP/COEP, so this navigation is cross-origin isolated and the bridge takes
// its AudioWorklet path; the arm asserts both, taps a fresh pair (a match
// cue), and reads the analyser's RMS over the next 400 ms.
{
  const reloadOk = results.some((r) => r[0] === "reload" && r[1] === "PASS");
  if (EXPECT_NO_SELECTION) skip("audio", "no taps with forwarding off");
  else if (!reloadOk) skip("audio", "the reload sub-arm did not run");
  else {
    let detail = "";
    const isolated = await evalJS("crossOriginIsolated === true");
    // the last boot's audio line (the arm has booted the page more than once)
    let openAt = -1;
    for (let i = consoleLines.length - 1; i >= 0; i--) if (/^crash: audio (open|closed)$/.test(consoleLines[i])) { openAt = i; break; }
    const open = openAt >= 0 ? { m: consoleLines[openAt].match(/^crash: audio (open|closed)$/) } : null;
    // the ambient loop lands a few seconds after the boot (the page fetches
    // it late, on purpose) and must be playing under the cue
    const ambient = open && open.m[1] === "open" ? await waitLine(/^crash: ambient (\d+)$/, openAt, 20000) : null;
    // and it starts once the screen is ready (the menu live, or a table up with the boot done): the start line
    const started = ambient ? await waitLine(/^crash: ambient start$/, ambient.index, 10000) : null;
    if (!isolated) detail = "the page is not crossOriginIsolated after the reload (sw.js should add COOP/COEP)";
    else if (!open || open.m[1] !== "open") detail = `the game did not open its audio context (${open ? open.m[0] : "no line"})`;
    else if (!ambient) detail = "the ambient loop never landed (no \"crash: ambient N\" line within 20 s of the boot (the page retries a failed fetch, D40))";
    else if (!started) detail = "the ambient landed but never started (no \"crash: ambient start\" line within 10 s: the boot is not done, or the start is not wired)";
    else {
      // a fresh pair to match: NEW deals the next seed; its boot line gives a pair
      mark = consoleLines.length;
      const nextErr = await tool("next");
      if (nextErr) detail = `NEXT through the tool stack: ${nextErr}`;
      else {
        const pair = await waitLine(/^crash: seed (\d+) tiles (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) (\d+) (-?[\d.]+) (-?[\d.]+)$/, mark, 5000);
        const resumed = consoleLines.some((l) => l === "crash: audio resumed");
        if (!pair) detail = "no boot line after NEXT";
        else if (!resumed) detail = "the context was never resumed from a tap";
        else {
          // the music's level, its peak over 2 s: it must be audible (the
          // theme, spy, opens quietly: a 400 ms window read 0.023 against
          // the 0.02 floor on the first run with the tunes, D50); then the
          // music is dropped so the cue is measured by itself (over the
          // ambient a muted cue hid inside the music's own swings)
          const rms = `(() => { const t = window.__crashAudioTap; if (!t.analysers.length) return -1; const a = t.analysers[t.analysers.length - 1]; const d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); })()`;
          let ambientPeak = -1;
          for (let i = 0; i < 20; i++) {
            const r = await evalJS(rms);
            if (r < 0) { ambientPeak = r; break; }
            ambientPeak = Math.max(ambientPeak, r);
            await sleep(100);
          }
          await evalJS("window.__crashUpdates.app.dispatch('ambient', 'off')");
          await sleep(1000);   // past the analyser's 680 ms window, so the ambient's tail is out of the before-read
          let before = 0;
          for (let i = 0; i < 4; i++) { before = Math.max(before, await evalJS(rms)); await sleep(50); }
          mark = consoleLines.length;
          await tap(pair.m[4], pair.m[5]);
          await sleep(120);
          await tap(pair.m[7], pair.m[8]);
          const removed = await waitLine(/^crash: removed /, mark, 3000);
          let peak = 0;
          // 16 reads over 800 ms: under load the cue landed after a 400 ms window twice (peaks 0.03 and 0)
          for (let i = 0; i < 16; i++) {
            const r = await evalJS(rms);
            peak = Math.max(peak, r);
            await sleep(50);
          }
          const kinds = JSON.parse(await evalJS("JSON.stringify(window.__crashAudioTap.nodes)"));
          if (!removed) detail = "the pair did not match after NEXT";
          else if (ambientPeak < 0) detail = "no AudioNode ever connected to a destination (the tap saw nothing)";
          else if (!(ambientPeak > AUDIO_AMBIENT)) detail = `the ambient landed but its RMS peaked at ${ambientPeak.toFixed(4)}: not playing`;
          else if (!(peak > before + AUDIO_RISE)) detail = `RMS peaked ${peak.toFixed(4)} after the match against ${before.toFixed(4)} with the ambient off: no cue (nodes ${kinds.join(",")})`;
          else if (!kinds.includes("AudioWorkletNode")) detail = `RMS ${peak.toFixed(4)} but the bridge used ${kinds.join(",")}, not the AudioWorkletNode path`;
          else pass("audio", `crossOriginIsolated, ${kinds.join(",")}; ambient ${ambient.m[1]} frames at RMS ${ambientPeak.toFixed(4)}; with it off, RMS ${before.toFixed(4)} before the match, peak ${peak.toFixed(4)} after`);
        }
      }
    }
    if (detail) fail("audio", detail);
  }
}

// ---- 9. update: a new service-worker version waits, never interrupts -------
{
  const builtVersion = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/version: "([^"]+)"/) || [])[1];
  const swExists = fs.existsSync(path.join(ROOT, "sw.js"));
  if (EXPECT_NO_SELECTION) skip("update", "not part of the positive-control run");
  else if (!swExists || !builtVersion) fail("update", `build has no sw.js or no stamped version (sw.js ${swExists}, version ${builtVersion})`);
  else {
    let detail = "";
    // the page after the reload sub-arm is controlled by the build's worker
    const controlled = await evalJS(`!!navigator.serviceWorker.controller`);
    const active = controlled ? await evalJS(`window.crashUpdate.activeVersion()`) : null;
    if (!controlled) detail = "the reloaded page is not controlled by a service worker";
    else if (active !== builtVersion) detail = `active worker version ${active}, built ${builtVersion}`;
    if (!detail) {
      // past the launch window, with a board in play: a new deploy lands.
      // The window is 8 s from the worker's REGISTRATION (after boot done and
      // the ambient, not the navigation), so the page says when it closes; a
      // fixed sleep from here landed inside it once when the audio leg was
      // skipped and this leg read "prompt" (2026-09-20)
      {
        let until = 0;
        for (let i = 0; i < 120 && !(until > 0); i++) { until = await evalJS("window.crashUpdate.launchUntil || 0"); if (!(until > 0)) await sleep(250); }
        if (!(until > 0)) detail = "the worker never registered on the reloaded page (no launch window)";
        else { const wait = until - Date.now() + 500; if (wait > 0) await sleep(wait); }
      }
    }
    if (!detail) {
      await evalJS(`window.__crashToken = "still-here"`);
      const bootsBefore = consoleLines.filter((l) => BOOT_ANY.test(l)).length;
      mark = consoleLines.length;
      swVersionOverride = "v-next";
      await evalJS(`window.crashUpdate.check()`);
      let state = null;
      for (let i = 0; i < 40 && state !== "waiting"; i++) { await sleep(250); state = await evalJS(`window.crashUpdate.state`); }
      const told = await waitLine(/^crash: update (\w+)$/, mark, 3000);
      const token = await evalJS(`window.__crashToken`);
      const bootsAfter = consoleLines.filter((l) => BOOT_ANY.test(l)).length;
      if (state !== "waiting") detail = `new worker did not reach waiting within 10 s (state ${state})`;
      else if (token !== "still-here" || bootsAfter !== bootsBefore) detail = `the page reloaded under a running board (token ${token}, boots ${bootsBefore} -> ${bootsAfter})`;
      else if (!told) detail = "the game was not told about the waiting version";
      else if (told.m[1] !== "waiting") detail = `mid-board the game was told "${told.m[1]}", expected "waiting" (the mark, not the launch prompt)`;
    }
    if (!detail) {
      // the next launch: the prompt, then a tap on the game's APPLY box
      mark = consoleLines.length;
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack` });
      const boot2 = await waitLine(BOOT_ANY, mark, 20000);
      const prompt = boot2 ? await waitLine(/^crash: update prompt$/, mark, 20000) : null;   // the worker registers once the board's boot is done (the ambient in ~18 frames)
      const applyCtl = boot2 ? await waitLine(/^crash: control apply (-?[\d.]+) (-?[\d.]+)$/, mark, 3000) : null;
      if (!boot2) detail = "no boot line on the next launch";
      else if (!prompt) detail = "the game was not told \"prompt\" on the next launch with a version waiting";
      else if (!applyCtl) detail = "no \"crash: control apply\" boot line to tap";
      else {
        mark = consoleLines.length;
        await tap(applyCtl.m[1], applyCtl.m[2]);
        const chose = await waitLine(/^crash: update apply$/, mark, 3000);
        const boot3 = chose ? await waitLine(BOOT_ANY, chose.index + 1, 20000) : null;
        const version = boot3 ? await evalJS(`window.crashUpdate.activeVersion()`) : null;
        if (!chose) detail = "tapping APPLY did not answer \"crash: update apply\"";
        else if (!boot3) detail = `applying the update did not reload the page (page state ${await evalJS("JSON.stringify({state: window.crashUpdate.state, told: window.crashUpdate.told, waiting: !!(window.crashUpdate.reg && window.crashUpdate.reg.waiting)})")})`;
        else if (version !== "v-next") detail = `after applying, the active worker is ${version}, expected v-next`;
        else pass("update", `waited without a reload mid-board (told waiting), prompted on the next launch, APPLY tapped, applied to ${version}`);
      }
    }
    swVersionOverride = null;
    if (detail) fail("update", detail);
  }
}

// ---- 9b. title: the ANSI logo's reveal settles correct and reproduces (P3d) --
// A fresh boot on the menu with a fixed seed and a fast baud (the pace is
// a per-tick count, so the arm's run is short): the game says the grid
// row by row at settle, held here to the data module the pipeline wrote
// (src/crash/title/logo.sgl, parsed from the source next to this file);
// the settled canvas is read at every dot of every cell and held to the
// block patterns of (crash font); a second boot with the same seed gives
// the same tick digests, a third with another seed does not (the
// positive control for "reproduces"); the settled frame is still for
// 200 ms; and a tap during a reveal skips it (no boot line: the tap
// picked nothing).
{
  const TITLE_SEED = 7, OTHER_SEED = 8, TITLE_BAUD = 9600;
  // the slant: row r of a letter line sits (5 - r) x the slant the game reports
  // (thousandths of a cell per row) cells right, rounded to a pixel
  const stairOf = (r) => (r < 0 || r > 5) ? 0 : 5 - r;
  const CELL = 8, TX = 0, TY = 8;
  let detail = "";
  const modulePath = path.join(path.dirname(new URL(import.meta.url).pathname), "src/crash/title/logo.sgl");
  const moduleRows = [];
  try {
    const src = fs.readFileSync(modulePath, "utf8");
    // every ("glyphs" "fg" "bg") triple after the LOGO-ROWS define (nothing follows it)
    const at = src.indexOf("(define LOGO-ROWS");
    const re = /\("([^"]*)" "([^"]*)" "([^"]*)"\)/g; let r;
    while ((r = re.exec(at >= 0 ? src.slice(at) : ""))) moduleRows.push([r[1], r[2], r[3]]);
  } catch (e) { detail = `cannot read ${modulePath}: ${e.message}`; }
  const hexes = {}; // role name -> [r, g, b], from assets/palette.sgl
  try {
    const pal = fs.readFileSync(path.join(path.dirname(modulePath), "../../../assets/palette.sgl"), "utf8");
    for (const [, role, hex] of pal.matchAll(/\((C-[A-Z0-9-]+) +"#([0-9A-Fa-f]{6})"/g)) hexes[role] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  } catch (e) { detail = detail || `cannot read the palette: ${e.message}`; }
  const rolesM = (() => { try { const s = fs.readFileSync(modulePath, "utf8").match(/\(define LOGO-ROLES\s+'#\(([^)]*)\)/); return s ? [...s[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : []; } catch { return []; } })();
  // the letter lines, for the stair: every third number of LOGO-LETTERS is a line's top row
  const lineTops = (() => { try { const s = fs.readFileSync(modulePath, "utf8").match(/\(define LOGO-LETTERS\s+'#\(([^)]*)\)/); const ns = s ? s[1].trim().split(/\s+/).map(Number) : []; return [...new Set(ns.filter((_, i) => i % 3 === 0))]; } catch { return []; } })();
  const lineRowOf = (y) => { for (const t of lineTops) if (y >= t && y < t + 6) return y - t; return 6; };
  if (!detail && moduleRows.length === 0) detail = "no LOGO-ROWS parsed from the module";
  // the publisher card's module (D43): its frame count, roles and the
  // resolved frame's samples; the card's length from (crash title)
  const cardPath = path.join(path.dirname(modulePath), "card.sgl");
  let cardSamples = [], cardRoles = [], cardFrames = 0, cardTicks = 0, cardBox = [0, 0, 0, 0];
  try {
    const src = fs.readFileSync(cardPath, "utf8");
    cardFrames = parseInt((src.match(/\(define CARD-FRAMES (\d+)\)/) || [])[1] || "0", 10);
    const rs = src.match(/\(define CARD-ROLES\s+'#\(([^)]*)\)/); cardRoles = rs ? [...rs[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
    const bx = src.match(/\(define CARD-BOX\s+'#\(([^)]*)\)/); cardBox = bx ? bx[1].trim().split(/\s+/).map(Number) : [0, 0, 0, 0];
    const at = src.indexOf("(define CARD-SAMPLES");
    for (const [, x, y, r] of (at >= 0 ? src.slice(at) : "").matchAll(/\((\d+) (\d+) (\d+)\)/g)) cardSamples.push([+x, +y, +r]);
    const title = fs.readFileSync(path.join(path.dirname(modulePath), "../title.sgl"), "utf8");
    cardTicks = ["CARD-IN", "CARD-HOLD", "CARD-OUT"].reduce((s, k) => s + parseInt((title.match(new RegExp(`\\(define ${k} (\\d+)\\)`)) || [])[1] || "0", 10), 0);
  } catch (e) { detail = detail || `cannot read the card module: ${e.message}`; }
  if (!detail && (cardSamples.length < 300 || cardFrames < 2 || cardTicks < 60 || cardRoles.length !== 6)) detail = `the card module is short: ${cardSamples.length} samples, ${cardFrames} frames, ${cardRoles.length} roles, ${cardTicks} ticks`;
  // ink(g, dx, dy): the same 4x4 dot patterns (crash font) draws
  const ink = (g, dx, dy) => g === "#" ? true : g === "3" ? !(dx % 2 === 1 && dy % 2 === 1) : g === "2" ? (dx + dy) % 2 === 0 : g === "1" ? (dx % 2 === 0 && dy % 2 === 0) : g === "^" ? dy < 2 : g === "v" ? dy >= 2 : g === "<" ? dx < 2 : g === ">" ? dx >= 2 : false;
  // the gate (ruling D42): a menu boot opens on the boot screen and the
  // reveal waits for a tap; the first boot also checks that nothing sounds
  // before the tap and that the dial and the first beep sound after it
  const rms = `(() => { const t = window.__crashAudioTap; if (!t || !t.analysers.length) return -1; const a = t.analysers[t.analysers.length - 1]; const d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); })()`;
  // the publisher card (ruling D43) between the gate and the reveal: on a
  // "read" the arm waits for the card's first resolved tick, reads the
  // canvas at CARD-SAMPLES (src/crash/title/card.sgl: the resolved frame's
  // pixels at 1x, roles into CARD-ROLES) and then lets the card run out
  // (its "done" tick is the full length); on a "skip" it taps the card
  // away as soon as the strip is up (the "done" tick is short of the
  // full length); "none" leaves it alone (a tap in the skip leg lands
  // during the card first)
  const readCard = async (m0, mode, from) => {
    if (mode === "none") return {};
    // D45: the DIALING meter holds the card until the boot is done (this leg holds the
    // backdrop off, so its texture step ends by giving up: a few seconds)
    const first = await waitLine(/^crash: title card tick (\d+) frame (\d+) ms (\d+)$/, m0, 20000);
    if (!first) return { error: "no \"crash: title card tick\" line within 20 s of the connect (the card's strip never came, the boot never finished, or the card did not start)" };
    // counted from the page's boot, not the tap: a quiet box finishes the boot during the gate wait
    if (!consoleLines.slice(from, first.index).some((l) => /^crash: boot done /.test(l))) return { error: "the card started before the boot was done (D45: the meter must hold it)" };
    if (mode === "skip") {
      const t0 = consoleLines.length;
      await tap(320, 200);
      const done = await waitLine(/^crash: title card done (\d+)$/, t0, 5000);
      if (!done) return { error: "a tap during the card did not end it" };
      if (parseInt(done.m[1], 10) >= cardTicks - 1) return { error: `the tap ended the card at tick ${done.m[1]}, its full length: not a skip` };
      return { cardSkippedAt: parseInt(done.m[1], 10) };
    }
    const hold = await waitLine(new RegExp(`^crash: title card tick (\\d+) frame ${cardFrames} ms (\\d+)$`), first.index, 15000);   // a loaded box runs the card at 100 ms a tick
    if (!hold) return { error: `the card never reached its resolved frame ${cardFrames}` };
    // the read lands inside the hold (CARD-HOLD ticks from the resolve): the
    // whole frame is the strip's last frame, sampled at every module sample
    const card = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
      const c = document.getElementById("stage");
      const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
      const g = off.getContext("2d"); g.drawImage(c, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const scale = Math.min(c.width / ${VW}, c.height / ${VH});
      const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
      const samples = ${JSON.stringify(cardSamples)}, wants = ${JSON.stringify(cardRoles.map((r) => hexes[r] || null))};
      // the band under the mark's box holds the PRESENTS line the game draws over the frame: not sampled
      const presentsTop = ${cardBox[1] + cardBox[3]}, presentsBottom = presentsTop + 20;
      let n = 0, wrong = 0, sample = null; const byRole = {};
      for (const [x, y, r] of samples) {
        const want = wants[r]; if (!want || (y >= presentsTop && y < presentsBottom)) continue;
        // the 320x200 sample is a 2x2 block on the 640x400 virtual grid; its center
        const px = Math.floor(ox + (2 * x + 1) * scale), py = Math.floor(oy + (2 * y + 1) * scale);
        const i = (py * c.width + px) * 4; n++; byRole[r] = (byRole[r] || 0) + 1;
        const near = Math.abs(d[i] - want[0]) <= 12 && Math.abs(d[i + 1] - want[1]) <= 12 && Math.abs(d[i + 2] - want[2]) <= 12;
        if (!near) { wrong++; if (!sample) sample = [x, y, r, [d[i], d[i + 1], d[i + 2]], want]; }
      }
      resolve({ n, wrong, sample, byRole });
    }))`);
    const done = await waitLine(/^crash: title card done (\d+)$/, hold.index, 30000);
    if (!done) return { error: "the card never ended (no \"crash: title card done\" line within 4 s of its resolve)" };
    if (parseInt(done.m[1], 10) !== cardTicks - 1) return { error: `the card ended at tick ${done.m[1]}, not its full length ${cardTicks} (nothing tapped it)` };
    return { card, cardDone: parseInt(done.m[1], 10), cardFirst: parseInt(first.m[1], 10) };
  };
  const openGate = async (from, listen, cardMode) => {
    const gate = await waitLine(/^crash: title gate (.+)$/, from, 20000);
    if (!gate) return { error: "no \"crash: title gate\" line within 20 s" };
    let before = 0;
    if (listen) { await sleep(400); for (let i = 0; i < 6; i++) { before = Math.max(before, await evalJS(rms)); await sleep(50); } }
    const m0 = consoleLines.length;
    await tap(320, 200);
    const connect = await waitLine(/^crash: title connect$/, m0, 3000);
    if (!connect) return { error: "a tap on the gate did not connect" };
    let peak = 0;
    if (listen) { for (let i = 0; i < 20; i++) { peak = Math.max(peak, await evalJS(rms)); await sleep(50); } }
    const card = await readCard(m0, cardMode || "skip", from);
    if (card.error) return card;
    return { gate: gate.m[1], before, peak, ...card };
  };
  const bootTitle = async (seed, listen) => {
    const from = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&seed=${seed}&baud=${TITLE_BAUD}` });
    const opened = await openGate(from, listen, listen ? "read" : "skip");   // the first boot reads the card, the others tap it away
    if (opened.error) return opened;
    const head = await waitLine(/^crash: title seed (\d+) baud (\d+) glitch (\d+) settle (\d+) cells (\d+)$/, from, 20000);
    if (!head) return { error: `no "crash: title seed" line within 20 s (seed ${seed})` };
    const settled = await waitLine(/^crash: title settled (\d+) digest (\d+) shear (\d+)$/, head.index, 30000);
    if (!settled) return { error: `no "crash: title settled" line within 30 s (seed ${seed})` };
    // the frame's ms on each tick line is the box's, not the seed's: dropped before the compare
    const ticks = consoleLines.slice(head.index, settled.index).filter((l) => /^crash: title tick /.test(l)).map((l) => l.replace(/ ms \d+$/, ""));
    await sleep(200);
    const rows = consoleLines.slice(settled.index).filter((l) => /^crash: title row /.test(l)).map((l) => l.slice("crash: title row ".length));
    return { head: head.m, settled: settled.m, ticks, rows, gate: opened.gate, before: opened.before, peak: opened.peak, card: opened.card, cardDone: opened.cardDone, cardSkippedAt: opened.cardSkippedAt, from };
  };
  // a flat C-BG backdrop stands in for the real one on this leg: the boot needs
  // the texture to land (D45: the card waits for it; a boot fetch is never given
  // up), and the dots with no bg must show a ground that is never a logo color
  substitutePaths["/assets/title/backdrop.png"] = solidPng(640, 400, hexes["C-BG"] || [0, 0, 0]);
  await send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "service_workers,cache_storage" });
  let a = null;
  if (!detail) {
    a = await bootTitle(TITLE_SEED, true);
    if (a.error) detail = a.error;
    else if (a.head[1] !== String(TITLE_SEED) || a.head[2] !== String(TITLE_BAUD)) detail = `the game took seed ${a.head[1]} baud ${a.head[2]}`;
    else if (parseInt(a.settled[3], 10) < 1) detail = `the settled logo is upright (slant ${a.settled[3]}/1000); the slant did not land`;
    else if (a.before > 0.005) detail = `sound before the gate's tap: RMS ${a.before.toFixed(4)}`;
    else if (!(a.peak > 0.02)) detail = `no sound after the gate's tap: RMS peaked ${a.peak.toFixed(4)} (the dial and the first beeps)`;
    else if (a.ticks.length < 10) detail = `only ${a.ticks.length} tick lines before settle`;
    else if (!a.card) detail = "the first boot read no card";
    else if (a.card.n < 300) detail = `only ${a.card.n} card samples read`;
    else if (!(a.card.byRole[1] > 20 && (a.card.byRole[2] || 0) + (a.card.byRole[3] || 0) >= 4)) detail = `the card's samples miss the mark: ${JSON.stringify(a.card.byRole)} by role (1 the lettering, 2/3 the ring)`;
    // up to 1 % off: at the phone profile's 780x488 buffer (scale 1.22, a letterbox of a quarter pixel) three samples beside the lettering read a bilinear blend of two blocks; the desktop reads all 460 exact
    else if (a.card.wrong > Math.ceil(a.card.n / 100)) detail = `${a.card.wrong} of ${a.card.n} card samples off the module's resolved frame: first at ${a.card.sample[0]},${a.card.sample[1]} role ${cardRoles[a.card.sample[2]]} read ${a.card.sample[3]} want ${a.card.sample[4]}`;
  }
  // the reveal's frames: the game's own max/mean over the reveal; a stall
  // inside it (a decode, a bake, a precache) shows as a max far over the
  // mean (David, phone: "extremely glitchy at startup ... with the beeps")
  let reveal = null;
  if (!detail) {
    reveal = await waitLine(/^crash: title reveal frames (\d+) max (\d+) over33 (\d+) underruns (\d+) dial (\d+) mean (\d+)$/, 0, 3000);
    if (!reveal) detail = "no \"crash: title reveal frames\" line at settle";
    else if (parseInt(reveal.m[2], 10) > 5 * Math.max(8, parseInt(reveal.m[6], 10))) detail = `a stall inside the reveal: max frame ${reveal.m[2]} ms against a mean of ${reveal.m[6]} (${reveal.m[3]} of ${reveal.m[1]} frames over 33 ms)`;
    // the phone viewport is where the sink can be fed at all on this box (the desktop
    // viewport starves under SwiftShader on every screen): no starved frame under the beeps
    else if (PHONE && parseInt(reveal.m[4], 10) > 0) detail = `the audio sink starved for ${reveal.m[4]} frames during the reveal (David: the typing beeps lag)`;
    else if (PHONE && parseInt(reveal.m[5], 10) > 0) detail = `the audio sink starved for ${reveal.m[5]} frames under the DIALING meter (David: the dial beeps sound glitchy)`;
  }
  // the grid the game holds, against the module
  if (!detail) {
    const W = moduleRows[0][0].length;
    const bad = [];
    if (a.rows.length !== moduleRows.length) bad.push(`rows ${a.rows.length} vs module ${moduleRows.length}`);
    for (let y = 0; y < Math.min(a.rows.length, moduleRows.length); y++) {
      const line = a.rows[y]; const sp = line.indexOf(" ");
      const yy = parseInt(line.slice(0, sp), 10); const rest = line.slice(sp + 1);
      const g = rest.slice(0, W), f = rest.slice(W + 1, 2 * W + 1), b = rest.slice(2 * W + 2, 3 * W + 2);
      if (yy !== y || g !== moduleRows[y][0] || f !== moduleRows[y][1] || b !== moduleRows[y][2]) bad.push(`row ${y}`);
    }
    if (bad.length) detail = `the game's grid differs from src/crash/title/logo.sgl: ${bad.slice(0, 4).join(", ")}`;
  }
  // the settled pixels: every dot of every cell, in the same animation frame the game draws
  let pix = null;
  if (!detail) {
    pix = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
      const c = document.getElementById("stage");
      const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
      const g = off.getContext("2d"); g.drawImage(c, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const scale = Math.min(c.width / ${VW}, c.height / ${VH});
      const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
      const rows = ${JSON.stringify(moduleRows)}, roles = ${JSON.stringify(rolesM)}, hexes = ${JSON.stringify(hexes)};
      const shear = ${parseInt(a.settled[3], 10) / 1000}, lineTops = ${JSON.stringify(lineTops)}, shadowRole = roles.length === 3 ? "c" : null;
      const lineRowOf = ${lineRowOf.toString()}, stairOf = ${stairOf.toString()};
      const ink = ${ink.toString()};
      let dots = 0, wrong = 0, sample = null, negatives = 0, negTotal = 0;
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y][0].length; x++) {
        const gl = rows[y][0][x]; if (gl === " ") continue;
        const fg = rows[y][1][x], bg = rows[y][2][x];
        for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
          // an ink dot must be the fg; a dot with no bg must NOT be the fg (a draw
          // that painted every code as a full block passed the ink-only read: the
          // review); the backdrop is a flat C-BG on this boot, so the ground is never a logo color
          const isInk = ink(gl, dx, dy); const role = isInk ? fg : bg;
          // (a shadow cell's fg is a bar tone, and the bars are what shows through: no negative read there)
          const negative = role === "-"; if (negative && (fg === "-" || fg === shadowRole)) continue;
          const want = hexes[roles[(negative ? fg : role).charCodeAt(0) - 97]]; if (!want) continue;
          const stair = stairOf(lineRowOf(y));
          // Math.round is half-up, Sigil's round half-even: they agree except at an exact .5, which the default slant never makes
          const vx = ${TX} + x * ${CELL} + Math.round(stair * shear * ${CELL}) + dx * 2 + 1, vy = ${TY} + y * ${CELL} + dy * 2 + 1;
          const px = Math.floor(ox + vx * scale), py = Math.floor(oy + vy * scale);
          const i = (py * c.width + px) * 4; dots++;
          const near = Math.abs(d[i] - want[0]) <= 12 && Math.abs(d[i + 1] - want[1]) <= 12 && Math.abs(d[i + 2] - want[2]) <= 12;
          if (negative ? near : !near) { wrong++; if (negative) negatives++; if (!sample) sample = [x, y, gl, dx, dy, [d[i], d[i + 1], d[i + 2]], want, negative ? "must not be fg" : "want"]; }
          if (negative) negTotal++;
        }
      }
      resolve({ dots, wrong, sample, negTotal, w: c.width, h: c.height });
    }))`);
    if (pix.dots < 1000) detail = `only ${pix.dots} dots sampled`;
    else if (pix.negTotal < 500) detail = `only ${pix.negTotal} no-bg dots sampled`;
    else if (pix.wrong > 0) detail = `${pix.wrong} of ${pix.dots} dots off: first at cell ${pix.sample[0]},${pix.sample[1]} glyph ${pix.sample[2]} dot ${pix.sample[3]},${pix.sample[4]} read ${pix.sample[5]} ${pix.sample[7]} ${pix.sample[6]}`;
  }
  // the items (D41) are on screen once the boot is done: the flat items are
  // C-LABEL-LIT, so the entry band (virtual y 168..356) must hold hundreds of
  // that color's pixels (on the merge onto P3c the items vanished with the
  // atlas on while the logo and the footer drew, and no leg read them)
  let itemsLit = -1;
  if (!detail) {
    const bootDone = await waitLine(/^crash: boot done /, a.from, 25000);   // this boot's, not an earlier leg's
    if (!bootDone) detail = "no \"crash: boot done\" within 15 s of the title boot";
    else {
      await sleep(400);
      const want = hexes["C-LABEL-LIT"];
      itemsLit = await evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
        const c = document.getElementById("stage");
        const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
        const g = off.getContext("2d"); g.drawImage(c, 0, 0);
        const scale = Math.min(c.width / ${VW}, c.height / ${VH});
        const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
        const y0 = Math.floor(oy + 168 * scale), y1 = Math.floor(oy + 356 * scale);
        const d = g.getImageData(0, y0, c.width, y1 - y0).data;
        let n = 0; for (let i = 0; i < d.length; i += 8) if (Math.abs(d[i] - ${want[0]}) <= 12 && Math.abs(d[i + 1] - ${want[1]}) <= 12 && Math.abs(d[i + 2] - ${want[2]}) <= 12) n++;
        resolve(n);
      }))`);
      if (itemsLit < 200) detail = `the menu's items are not on screen after the boot: ${itemsLit} C-LABEL-LIT pixels in the entry band (every other pixel sampled)`;
      // the ambient (David, 2026-09-20): silent under the card and the reveal,
      // started once the menu is ready: its start line follows the boot's done
      // line and never precedes the settle
      else {
        const start = await waitLine(/^crash: ambient start$/, a.from, 5000);
        const settledAt = consoleLines.findIndex((l, i) => i >= a.from && /^crash: title settled /.test(l));
        if (!start) detail = "no \"crash: ambient start\" line within 5 s of the boot's done line: the loop never began";
        else if (start.index < settledAt) detail = "the ambient started before the reveal settled";
        else if (start.index < bootDone.index) detail = "the ambient started before the boot was done (the items were not in)";
      }
    }
  }
  // still: the settled canvas does not change over 300 ms (two reads of the
  // logo band, every 4th pixel, compared; the tick-line check alone was
  // tautological, the game prints none after settle: the review)
  if (!detail) {
    const readBand = () => evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
      const c = document.getElementById("stage");
      const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
      const g = off.getContext("2d"); g.drawImage(c, 0, 0);
      const scale = Math.min(c.width / ${VW}, c.height / ${VH});
      const oy = (c.height - ${VH} * scale) / 2;
      const y0 = Math.floor(oy + ${TY} * scale), y1 = Math.floor(oy + (${TY} + 14 * ${CELL}) * scale);
      const d = g.getImageData(0, y0, c.width, y1 - y0).data;
      let h = 7; for (let i = 0; i < d.length; i += 16) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) % 1000000007;
      resolve(h);
    }))`);
    const h1 = await readBand(); await sleep(300); const h2 = await readBand();
    if (h1 !== h2) detail = `the settled logo band changed between two reads 300 ms apart (${h1} vs ${h2}): not still`;
    else if (consoleLines.slice(0).filter((l) => /^crash: title tick /.test(l)).length === 0) detail = "no tick lines at all";
  }
  // reproduces: the same seed, the same digests; another seed, different ones
  let b = null, c = null;
  if (!detail) {
    b = await bootTitle(TITLE_SEED);
    if (b.error) detail = b.error;
    else if (!(b.cardSkippedAt >= 0)) detail = "the second boot did not skip the card";
    else if (JSON.stringify(a.ticks) !== JSON.stringify(b.ticks) || a.settled[2] !== b.settled[2]) detail = `seed ${TITLE_SEED} twice: ${a.ticks.length} vs ${b.ticks.length} tick lines, first difference at ${a.ticks.findIndex((l, i) => l !== b.ticks[i])}`;
  }
  if (!detail) {
    c = await bootTitle(OTHER_SEED);
    if (c.error) detail = c.error;
    else if (JSON.stringify(a.ticks) === JSON.stringify(c.ticks)) detail = `seeds ${TITLE_SEED} and ${OTHER_SEED} gave the same tick digests`;
    else if (a.settled[2] !== c.settled[2]) detail = `seeds ${TITLE_SEED} and ${OTHER_SEED} settle on different frames (${a.settled[2]} vs ${c.settled[2]})`;
  }
  // varies each boot: two boots with no ?seed take different seeds from the
  // page's clock, and neither is the guard's fallback 1 (measured 2026-09-19:
  // current-second is not available on the web and every boot was seed 1)
  if (!detail) {
    const seedsSeen = [];
    for (let i = 0; i < 2 && !detail; i++) {
      const from = consoleLines.length;
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&baud=${TITLE_BAUD}` });
      const gated = await openGate(from, false); if (gated.error) { detail = gated.error; break; }
      const head = await waitLine(/^crash: title seed (\d+) baud /, from, 20000);
      if (!head) detail = "no title line on a boot without ?seed";
      else seedsSeen.push(head.m[1]);
      await sleep(1100);
    }
    if (!detail && seedsSeen.some((s) => s === "1")) detail = `a boot without ?seed took seed 1, the fallback: no per-boot variation (seeds ${seedsSeen.join(", ")})`;
    else if (!detail && seedsSeen[0] === seedsSeen[1]) detail = `two boots without ?seed took the same seed ${seedsSeen[0]}`;
  }
  // a tap during the reveal skips it and picks nothing
  if (!detail) {
    const from = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&seed=${TITLE_SEED}&baud=600` });
    const gated2 = await openGate(from, false);
    const head = gated2.error ? null : await waitLine(/^crash: title seed /, from, 20000);
    if (!head) detail = "no title line on the slow boot";
    else {
      await sleep(300);
      // the menu's boot line names each entry's center; the tap lands on the first
      const ml = await waitLine(/^crash: menu top ([\w-]+) (-?[\d.]+) (-?[\d.]+)/, from, 3000);
      const r = ml ? { x: parseFloat(ml.m[2]), y: parseFloat(ml.m[3]) } : null;
      const entry = r || {};
      await tap(entry.x || 320, entry.y || 150);
      const settled = await waitLine(/^crash: title settled (\d+) digest/, head.index, 3000);
      const chose = await waitLine(/^crash: menu chose /, head.index, 500);
      if (!settled) detail = "a tap during the reveal did not settle it";
      else if (parseInt(settled.m[1], 10) < 60) detail = `the tap settled at tick ${settled.m[1]}, too early to have been a skip`;
      else if (chose) detail = `the skipping tap also chose: ${chose.m[0]}`;
    }
  }
  delete substitutePaths["/assets/title/backdrop.png"];
  if (detail) fail("title", detail);
  else pass("title", `seed ${TITLE_SEED}: grid ${a.rows.length} rows = module, ${pix.dots} dots read on the settled canvas all as drawn (buffer ${pix.w}x${pix.h}), ${a.ticks.length} ticks reproduced, seed ${OTHER_SEED} differs, unseeded boots differ, a tap skips, ${itemsLit} item pixels after the boot, the ambient started after; card ${a.card.n - a.card.wrong}/${a.card.n} samples = module (ran ${a.cardDone} ticks; a tap ended the next at ${b.cardSkippedAt}); reveal ${reveal.m[1]} frames mean ${reveal.m[6]} max ${reveal.m[2]} ms, ${reveal.m[3]} over 33, ${reveal.m[4]} underruns (${reveal.m[5]} under the meter)`);
}

// ---- 9c. preload: the card waits for the boot (ruling D45), nothing pops in later --
// The server delays the menu theme (spy.ogg, D50) by BOOT_SLOW ms, so the boot's audio step
// outlasts the tap: after the gate's tap the DIALING meter must hold until
// "crash: boot done" (the ambient landed, the audio step last), a tap during
// the meter must choose nothing and skip nothing, the card must start only
// after the boot is done ("crash: title dialed" after "crash: boot done",
// no card tick before it), and once the reveal settles the menu is live at
// once: a tap on STACK chooses it and boots a board. The origin's service
// worker and caches are cleared first (the worker serves cache first and the
// audio sub-arm already fetched the theme), so the theme's fetch reaches
// the arm's server and its delay.
{
  const BOOT_SLOW = 4000, TITLE_SEED = 7, TITLE_BAUD = 9600;
  let detail = "";
  slowPaths["/assets/audio/spy.ogg"] = BOOT_SLOW;
  await send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "service_workers,cache_storage" });
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&seed=${TITLE_SEED}&baud=${TITLE_BAUD}&fresh` });
  const menuLine = await waitLine(/^crash: menu top .*\bjack-in (-?[\d.]+) (-?[\d.]+)/, from, 20000);
  const gateP = await waitLine(/^crash: title gate /, from, 20000);
  let connect = null;
  if (gateP) { await tap(320, 200); connect = await waitLine(/^crash: title connect$/, gateP.index, 3000); }
  if (!menuLine) detail = "no menu line on the boot";
  else if (!gateP) detail = "no gate line on the boot";
  else if (!connect) detail = "the gate's tap did not connect";
  // a tap during the meter: nothing chosen, nothing skipped
  let tapAt = -1;
  if (!detail) {
    await sleep(300);
    if (consoleLines.slice(connect.index).some((l) => /^crash: title dialed /.test(l))) detail = `the meter ended within 300 ms of the tap: the ${BOOT_SLOW} ms ambient delay did not hold the boot (a slow asset that does not hold the card is the bug this leg exists for)`;
    else {
      tapAt = consoleLines.length;
      await tap(parseFloat(menuLine.m[1]), parseFloat(menuLine.m[2]));
      await sleep(500);
      const after = consoleLines.slice(tapAt);
      if (after.some((l) => /^crash: menu chose /.test(l))) detail = "a tap during the meter chose an entry";
      else if (after.some((l) => /^crash: title (dialed|card tick|seed) /.test(l))) detail = "a tap during the meter skipped it (the card or the reveal began)";
    }
  }
  let done = null, dialed = null;
  if (!detail) {
    done = await waitLine(/^crash: boot done (\d+)$/, from, BOOT_SLOW + 20000);
    dialed = done && await waitLine(/^crash: title dialed (\d+) (\d+) underruns (\d+)$/, from, 5000);
    if (!done) detail = `no "crash: boot done" within ${BOOT_SLOW + 20000} ms`;
    else if (!dialed) detail = "the boot is done but the meter never ended (no \"crash: title dialed\" line within 5 s)";
    else if (dialed.index < done.index) detail = "the meter ended before the boot was done";
    else if (consoleLines.slice(from, done.index).some((l) => /^crash: title card tick /.test(l))) detail = "the card started before the boot was done";
    else if (dialed.m[1] !== dialed.m[2]) detail = `the meter ended at ${dialed.m[1]} of ${dialed.m[2]} steps`;
    else {
      const steps = consoleLines.slice(from, done.index).filter((l) => /^crash: boot step /.test(l));
      if (steps.length !== parseInt(done.m[1], 10)) detail = `boot done says ${done.m[1]} steps, ${steps.length} step lines seen`;
      else if (!/^crash: boot step audio done$/.test(steps[steps.length - 1])) detail = `the last step was not audio: ${steps[steps.length - 1]}`;
    }
  }
  // the card, then the reveal; the menu live at settle: a tap chooses STACK
  let settled = null;
  if (!detail) {
    // 90 s: with SCANLINES on by default (P4c) the post pass costs SwiftShader ~200 ms a frame at dpr 3, and the card is 164 ticks
    const cardDone = await waitLine(/^crash: title card done /, dialed.index, 90000);
    settled = cardDone && await waitLine(/^crash: title settled /, cardDone.index, 60000);
    if (!cardDone) detail = "the card never ended after the meter";
    else if (!settled) detail = "the reveal did not settle after the card";
    else {
      await sleep(300);
      const m0 = consoleLines.length;
      await tap(parseFloat(menuLine.m[1]), parseFloat(menuLine.m[2]));
      const chose = await waitLine(/^crash: menu chose jack-in$/, m0, 3000);
      const booted = chose && await waitLine(BOOT_ANY, m0, 5000);
      if (!chose) detail = "after the settle, a tap on JACK IN chose nothing (the menu was not live at once)";
      else if (!booted) detail = "after the settle, JACK IN chosen but no board booted (the run's first layer)";
    }
  }
  delete slowPaths["/assets/audio/spy.ogg"];
  if (detail) fail("preload", detail);
  else pass("preload", `ambient held ${BOOT_SLOW} ms: the meter held, a tap under it chose and skipped nothing, boot done after ${done.m[1]} steps (audio last), then the meter ended at ${dialed.m[1]}/${dialed.m[2]}, the card ran, the reveal settled and a tap chose STACK and booted a board`);
}

// ---- 9c'. slow-link: a boot on a throttled link loads every texture ----------
// David's phone over WireGuard (2026-09-20): every texture fetch in the
// boot's first ~4 s failed while the service worker precached the wasm,
// and the loader's two tries a second apart gave the card and the backdrop
// up for good. Now the worker registers only once the menu is live (the
// page's crashLive), a boot fetch is retried with backoff and never given
// up, and the DIALING meter (D45) covers the wait. This leg boots a fresh
// origin (workers and caches cleared) on an emulated link of SLOW_KBPS
// with SLOW_RTT ms round trips (Network.emulateNetworkConditions, switched
// on at the game's first line so the wasm itself is not throttled) and
// holds: every boot texture step done with no "texture missing" line, the
// meter ended after the boot's done line, the card and the reveal ran, and
// "crash: sw registered" came after the settle.
{
  const SLOW_KBPS = 2000, SLOW_RTT = 200, TITLE_SEED = 7, TITLE_BAUD = 9600;
  let summary = "";
  await send("Network.enable");
  let detail = "";
  await send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "service_workers,cache_storage" });
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&seed=${TITLE_SEED}&baud=${TITLE_BAUD}&fresh` });
  const first = await waitLine(/^crash: page /, from, 60000);
  if (!first) detail = "the game never printed its first line";
  else await send("Network.emulateNetworkConditions", { offline: false, latency: SLOW_RTT, downloadThroughput: SLOW_KBPS * 1000 / 8, uploadThroughput: SLOW_KBPS * 1000 / 8 });
  const gateS = !detail && await waitLine(/^crash: title gate /, from, 20000);
  let connect = null;
  if (!detail && !gateS) detail = "no gate line";
  if (gateS) { await tap(320, 200); connect = await waitLine(/^crash: title connect$/, gateS.index, 3000); if (!connect) detail = "the gate's tap did not connect"; }
  let done = null, dialed = null, settled = null, sw = null;
  if (!detail) {
    done = await waitLine(/^crash: boot done (\d+)$/, from, 120000);
    dialed = done && await waitLine(/^crash: title dialed (\d+) (\d+) underruns (\d+)$/, from, 10000);
    if (!done) detail = "no \"crash: boot done\" within 120 s on the slow link";
    else if (!dialed) detail = "the boot is done but the meter never ended";
    else if (dialed.index < done.index) detail = "the meter ended before the boot was done";
    else {
      const lines = consoleLines.slice(from, done.index);
      const missing = lines.filter((l) => /^crash: texture missing /.test(l));
      const steps = lines.filter((l) => /^crash: boot step assets\//.test(l)).map((l) => l.replace(/^crash: boot step (\S+) done$/, "$1"));
      const tries = lines.filter((l) => /^crash: texture fetch /.test(l)).length;
      const mustHave = ["assets/title/card-fade.png", "assets/title/backdrop.png", "assets/packets/portraits.png"];
      const lost = mustHave.filter((p) => !steps.includes(p));
      if (missing.length) detail = `a texture was given up on the slow link: ${missing[0]}`;
      else if (lost.length) detail = `boot texture steps not done before boot done: ${lost.join(", ")}`;
      else if (lines.some((l) => /^crash: sw registered$/.test(l))) detail = "the worker registered before the boot was done (its precache shares the link with the boot's fetches)";
      else if (lines.some((l) => /^crash: title card tick /.test(l))) detail = "the card started before the boot was done";
      else if (PHONE && parseInt(dialed.m[3], 10) > 0) detail = `the audio sink starved for ${dialed.m[3]} frames under the DIALING meter on the slow link`;
      else summary = `${SLOW_KBPS} kbps / ${SLOW_RTT} ms: ${steps.length} texture steps done in ${tries} fetches, none given up, boot done then the meter ended at ${dialed.m[1]}/${dialed.m[2]} with ${dialed.m[3]} underruns`;
    }
  }
  if (!detail) {
    settled = await waitLine(/^crash: title settled /, dialed.index, 60000);
    sw = settled && await waitLine(/^crash: sw registered$/, from, 30000);
    if (!settled) detail = "the reveal did not settle after the meter";
    else if (!sw) detail = "the worker never registered within 30 s of the settle";
    else if (sw.index < settled.index) detail = "the worker registered before the settle";
  }
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  if (detail) fail("slow-link", detail);
  else pass("slow-link", `${summary}, the reveal settled, the worker registered after`);
}

// ---- 9d. menu-return: board -> menu -> board stays drawn and under a bound --
// David (laptop, 9f897bc): "went back to the main menu and then it got
// completely bogged down and then the screen went black". A fresh boot
// on the board with ?ms, a minute of frames, Escape to the menu, then: the
// menu's boot is done (nothing re-runs), five canvas reads over three
// seconds are each non-black in the menu region, and the game's own
// frame-ms window on the menu stays under MENU_FRAME_FACTOR times the
// board's; then Enter on CONTINUE boots the board again.
{
  const MENU_FRAME_FACTOR = 2.5;
  let detail = "";
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&ms&seed=1&fresh` });
  const booted = await waitLine(BOOT_ANY, from, 20000);
  if (!booted) detail = "no boot line";
  let boardMs = null, menuMs = null;
  const MS_RE = /^crash: frame-ms (\d+) (\d+).* underruns (\d+)$/;
  let menuUnderruns = null, l1Under = null;
  let boardUnder = null;
  if (!detail) {
    const l = await waitLine(MS_RE, booted.index, 60000);
    if (!l) detail = "no frame-ms line on the board within 60 s";
    else {
      // the first window holds the boot; the second is the board at rest, the
      // reference for the menu's frame and for whether this box feeds the sink at all
      const l2 = await waitLine(MS_RE, l.index + 1, 40000);
      if (!l2) detail = "no second frame-ms line on the board";
      else { boardMs = parseInt(l2.m[1], 10); boardUnder = parseInt(l2.m[3], 10); }
    }
  }
  const readMenu = () => evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
    const g = off.getContext("2d"); g.drawImage(c, 0, 0);
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const y0 = Math.floor(oy + 8 * scale), y1 = Math.floor(oy + 356 * scale);
    const d = g.getImageData(Math.floor(ox), y0, Math.floor(${VW} * scale), y1 - y0).data;
    let lit = 0, n = 0; for (let i = 0; i < d.length; i += 16) { n++; if (d[i] + d[i + 1] + d[i + 2] > 90) lit++; }
    resolve({ lit, n });
  }))`);
  if (!detail) {
    const m0 = consoleLines.length;
    const menu = await toMenu("Escape");
    if (!menu) detail = toMenuDetail;
    else {
      // nothing re-runs on the return: no new boot step line, no new title seed line
      await sleep(1500);
      const after = consoleLines.slice(m0);
      if (after.some((l) => /^crash: boot step /.test(l))) detail = "the return to the menu re-ran the boot's steps";
      else if (after.some((l) => /^crash: title seed /.test(l))) detail = "the return to the menu re-ran the reveal";
    }
  }
  const reads = [];
  if (!detail) {
    for (let i = 0; i < 5; i++) { reads.push(await readMenu()); await sleep(600); }
    const black = reads.filter((r) => r.lit < r.n * 0.05);
    if (black.length) detail = `${black.length} of 5 menu frames black (lit ${reads.map((r) => r.lit).join("/")} of ${reads[0].n})`;
  }
  if (!detail) {
    const m1 = consoleLines.length;
    const l = await waitLine(MS_RE, m1, 40000);
    if (!l) detail = "no frame-ms line on the menu within 40 s";
    else {
      menuMs = parseInt(l.m[1], 10);
      // the window that holds the return (the first after Escape) and the next: no starved
      // audio frames (David, 2026-09-20: "going back to the menu ... causes the music to slow down")
      const l2 = await waitLine(MS_RE, l.index + 1, 40000);   // a window is 120 frames: 40 s covers a box at 300 ms a frame
      menuUnderruns = parseInt(l.m[3], 10) + (l2 ? parseInt(l2.m[3], 10) : 0); l1Under = l.m[3];
      if (menuMs > boardMs * MENU_FRAME_FACTOR) detail = `the menu's frame mean ${menuMs} ms is over ${MENU_FRAME_FACTOR} x the board's ${boardMs} ms`;
      else if (!l2) detail = "no second frame-ms line on the menu";
      // the bound holds where it can be read: a box whose board at rest starves the sink
      // (SwiftShader on the desktop viewport runs the GPU field at ~80 ms a frame) reports both
      else if (boardUnder === 0 && parseInt(l2.m[3], 10) > 0) detail = `the audio sink starved for ${l2.m[3]} frames on the settled menu while the board at rest starved it for none (${l.m[3]} in the window of the return, which holds the one-time bake of the logo and the items)`;
    }
  }
  if (!detail) {
    const m2 = consoleLines.length;
    await press("Enter");
    const chose = await waitLine(/^crash: menu chose continue$/, m2, 3000);
    const back = chose && await waitLine(BOOT_ANY, m2, 5000);
    if (!chose) detail = "Enter on the menu did not choose CONTINUE";
    else if (!back) detail = "CONTINUE did not boot the board";
  }
  if (detail) fail("menu-return", detail);
  else pass("menu-return", `board ${boardMs} ms, menu ${menuMs} ms a frame (mean over 300), 5 menu frames lit (${reads.map((r) => r.lit).join("/")} of ${reads[0].n}), nothing re-ran, audio underruns board ${boardUnder} / return ${l1Under} / menu ${menuUnderruns - parseInt(l1Under, 10)}${boardUnder > 0 ? " (the board starves on this box: bound not read)" : ""}, CONTINUE back`);
}

// ---- 9e. P4: the menu's screens, the settings, share codes, the daily, the scoreboard --
// The real menu (D14, D19, D41) and what sits behind it. Each leg starts
// from a board booted fresh and Escape (the pause menu is live at once,
// no title reveal to wait out), then walks the sub-screens by keyboard
// and by tap on the row centers the game's own "crash: menu SCREEN ID X Y"
// line names (a value row reads ID=VALUE).
function parseMenuLine(line) {
  const parts = line.split(" ").slice(2);   // after "crash: menu"
  const rows = {};
  const order = [];
  for (let i = 1; i + 2 < parts.length; i += 3) {
    const [id, value] = parts[i].split("=");
    rows[id] = { x: parseFloat(parts[i + 1]), y: parseFloat(parts[i + 2]), value };
    order.push(id);
  }
  return { screen: parts[0], rows, order };
}
const MENU_LINE = /^crash: menu ([a-z-]+) /;
// the menu line for a screen, said after `from`
async function menuOn(screen, from, ms = 3000) {
  const l = await waitLine(new RegExp(`^crash: menu ${screen}( |$)`), from, ms);
  return l ? parseMenuLine(consoleLines[l.index]) : null;
}
// the top screen's highlight after a sub-screen closes stays on the row
// that opened it (SCORES and CODE close to the top screen with FREE PLAY
// highlighted); the arm tracks it
let topAt = 0;
// a fresh board, then Escape: the pause menu's top screen
async function pauseMenu(extra = "") {
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&seed=1${extra}` });
  const booted = await waitLine(BOOT_ANY, from, 20000);
  if (!booted) return { error: "no boot line" };
  if (!(await waitLine(/^crash: boot done /, from, 20000))) return { error: "no \"crash: boot done\" within 20 s" };
  await sleep(200);
  const m0 = consoleLines.length;
  const line = await toMenu("Escape");
  const top = line && parseMenuLine(consoleLines[line.index]);
  topAt = 0;   // a fresh menu highlights its first row
  return top ? { top, from: m0 } : { error: toMenuDetail };
}
// the highlight to a row: the rows wrap, so Down from wherever it is
// (the last Escape or step left it somewhere) lands by going round
async function downTo(order, id, at = 0) {
  const n = order.length, i = order.indexOf(id);
  for (let k = 0; k < (i - at + n) % n; k++) await press("ArrowDown");
}


// screens: every entry of every screen reachable by keyboard and by tap
{
  let detail = "";
  const seen = [];
  const r = await pauseMenu();
  if (r.error) detail = r.error;
  else {
    const want = { free: "stack cards daily-stack daily-cards code scores version back",
                   settings: "music sfx volume scanlines veil background back",
                   credits: "", scores: "back", code: "back" };   // the credits crawl has no rows: Escape or a tap leaves
    if (r.top.order.join(" ") !== "continue jack-in free-play settings credits") detail = `the pause menu's rows are ${r.top.order.join(" ")}`;
    // by keyboard: FREE PLAY, SETTINGS, CREDITS from the top; SCORES and CODE from FREE PLAY
    const walk = [["free-play", "free", null], ["settings", "settings", null], ["credits", "credits", null], ["free-play", "free", "scores"], ["free-play", "free", "code"]];
    for (const [id, screen, sub] of walk) {
      if (detail) break;
      let m0 = consoleLines.length;
      // the highlight is wherever the last Escape left it: Up past the top clamps there
      await downTo(r.top.order, id, topAt); topAt = r.top.order.indexOf(id);
      await press("Enter");
      const s = await menuOn(screen, m0);
      if (!s) { detail = `Enter on ${id} did not open the ${screen} screen (keyboard)`; break; }
      if (s.order.join(" ") !== want[screen]) { detail = `the ${screen} screen's rows are ${s.order.join(" ")}, not ${want[screen]}`; break; }
      if (sub) {
        m0 = consoleLines.length;
        await downTo(s.order, sub);
        await press("Enter");
        const s2 = await menuOn(sub, m0);
        if (!s2) { detail = `Enter on ${sub} did not open the ${sub} screen (keyboard)`; break; }
        if (sub === "scores" && !consoleLines.slice(m0).some((l) => /^crash: scores stack hacker /.test(l))) { detail = "the SCORES screen said no \"crash: scores\" line"; break; }
        if (sub === "code" && !consoleLines.slice(m0).some((l) => /^crash: keypad 0 /.test(l))) { detail = "the CODE screen said no \"crash: keypad\" line"; break; }
        seen.push(`${sub} (keys)`);
      }
      seen.push(`${screen} (keys)`);
      m0 = consoleLines.length;
      await press("Escape");
      if (!(await menuOn("top", m0))) { detail = `Escape on ${sub || screen} did not return to the top screen`; break; }
    }
    // by tap: the same screens from the row centers; the sub-screens' BACK row by tap
    if (!detail && !EXPECT_NO_SELECTION) {
      for (const [id, screen, sub] of walk) {
        if (detail) break;
        let m0 = consoleLines.length;
          await tap(r.top.rows[id].x, r.top.rows[id].y);
        const s = await menuOn(screen, m0);
        if (!s) { detail = `a tap on ${id} did not open the ${screen} screen`; break; }
        let backRow = s.rows.back || { x: 320, y: 200 };   // the crawl: any tap leaves
        if (sub) {
          m0 = consoleLines.length;
          await tap(s.rows[sub].x, s.rows[sub].y);
          const s2 = await menuOn(sub, m0);
          if (!s2) { detail = `a tap on ${sub} did not open the ${sub} screen`; break; }
          seen.push(`${sub} (tap)`);
          backRow = s2.rows.back;
        }
        seen.push(`${screen} (tap)`);
        m0 = consoleLines.length;
        await tap(backRow.x, backRow.y);
        if (!(await menuOn("top", m0))) { detail = `a tap on BACK did not leave the ${sub || screen} screen`; break; }
      }
    }
    // Escape on the pause menu is CONTINUE (D14): the board comes back
    if (!detail) {
      const m0 = consoleLines.length;
      await press("Escape");
      const chose = await waitLine(/^crash: menu chose continue$/, m0, 3000);
      if (!chose) detail = "Escape on the pause menu did not choose CONTINUE";
      else if (!(await waitLine(BOOT_ANY, m0, 5000))) detail = "CONTINUE did not boot the board back";
    }
  }
  if (detail) fail("screens", detail);
  else pass("screens", `top continue jack-in free-play settings credits; ${seen.join(", ")}; Escape continues`);
}

// settings (D51): the main menu's SETTINGS is the general five; DEFRAG's
// PULL and SCORING live in the table's own overlay (GAME SETTINGS) and a
// step there is stored and read back the same after a reload (gate leg 4,
// the web half); the deal after honours them; then the defaults back.
{
  let detail = "";
  let r = await pauseMenu();
  if (r.error) detail = r.error;
  if (!detail) {
    let m0 = consoleLines.length;
    await downTo(r.top.order, "settings", topAt); topAt = r.top.order.indexOf("settings");
    await press("Enter");
    const s = await menuOn("settings", m0);
    if (!s) detail = "SETTINGS did not open";
    else if (s.order.join(" ") !== "music sfx volume scanlines veil background back") detail = `the main menu's SETTINGS rows are ${s.order.join(" ")}, not the general six`;
    else if (s.rows.music.value !== "ON" || s.rows.sfx.value !== "ON" || s.rows.volume.value !== "10" || s.rows.scanlines.value !== "ON" || s.rows.veil.value !== "ON" || s.rows.background.value !== "LIVE") detail = `the fresh defaults read ${s.order.map((id) => `${id}=${s.rows[id].value}`).join(" ")}`;
    else {
      // BACKGROUND: STILL is a seeded gradient the field never steps: the next
      // deal's field line says still, and no "bg held"/step line follows
      m0 = consoleLines.length;
      await downTo(s.order, "background");
      await press("Enter");
      const still = await waitLine(/^crash: setting background (\w+)$/, m0, 2000);
      if (!still || still.m[1] !== "still") detail = `Enter on BACKGROUND said ${still ? still.m[0] : "nothing"}`;
      else {
        m0 = consoleLines.length;
        await press("Escape");
        if (!(await menuOn("top", m0))) detail = "Escape did not leave SETTINGS";
      }
    }
  }
  if (!detail) {
    // a deal under STILL: its field line names the still rule with the board's seed
    let m0 = consoleLines.length;
    const r2 = await pauseMenu();
    if (r2.error) detail = r2.error;
    else {
      m0 = consoleLines.length;
      await downTo(r2.top.order, "free-play", topAt); topAt = r2.top.order.indexOf("free-play");
      await press("Enter");
      const free = await menuOn("free", m0);
      if (!free) detail = "FREE PLAY did not open";
      else {
        m0 = consoleLines.length;
        await downTo(free.order, "stack");
        await press("Enter");
        const field = await waitLine(/^crash: field (\w+) (\d+)$/, m0, 5000);
        const spec = field && await waitLine(/^crash: spec stack \w+ (\d+) /, m0, 5000);
        if (!field) detail = "FREE PLAY -> STACK said no field line";
        else if (field.m[1] !== "still") detail = `the deal's field is ${field.m[1]}, not still`;
        else if (!spec || spec.m[1] !== field.m[2]) detail = `the still field's seed ${field.m[2]} is not the board's ${spec ? spec.m[1] : "?"}`;
        else {
          await sleep(2500);
          if (consoleLines.slice(m0).some((l) => /^crash: bg held /.test(l))) detail = "the still field stepped (a bg held line)";
        }
      }
    }
    // LIVE back through the main menu's SETTINGS
    if (!detail) {
      const r3 = await pauseMenu();
      if (!r3.error) {
        m0 = consoleLines.length;
        await downTo(r3.top.order, "settings", topAt); topAt = r3.top.order.indexOf("settings");
        await press("Enter");
        const s3 = await menuOn("settings", m0);
        if (s3) { await downTo(s3.order, "background"); m0 = consoleLines.length; await press("Enter"); await waitLine(/^crash: setting background live$/, m0, 2000); await press("Escape"); }
      }
    }
  }
  // DEFRAG's overlay: GAME SETTINGS with PULL and SCORING
  const overlayGame = async () => {
    let m0 = consoleLines.length;
    await press("Escape");
    const p = await menuOn("pause", m0);
    if (!p) return { error: "Escape on the deal did not open the table's overlay" };
    if (p.order.join(" ") !== "resume game-settings settings share back-to-menu") return { error: `DEFRAG's overlay rows are ${p.order.join(" ")}` };
    m0 = consoleLines.length;
    await downTo(p.order, "game-settings");
    await press("Enter");
    const g = await menuOn("pause-game", m0);
    if (!g) return { error: "GAME SETTINGS did not open from the overlay" };
    if (g.order.join(" ") !== "draw scoring back") return { error: `GAME SETTINGS rows are ${g.order.join(" ")}` };
    return { g };
  };
  const dealCards = async () => {
    const r = await pauseMenu();
    if (r.error) return { error: r.error };
    let m0 = consoleLines.length;
    await downTo(r.top.order, "free-play", topAt); topAt = r.top.order.indexOf("free-play");
    await press("Enter");
    const free = await menuOn("free", m0);
    if (!free) return { error: "FREE PLAY did not open" };
    m0 = consoleLines.length;
    await downTo(free.order, "cards");
    await press("Enter");
    const dealt = await waitLine(/^crash: cards seed (\d+) moves \d+ draw (\d) scoring (\w+)$/, m0, 5000);
    if (!dealt) return { error: "FREE PLAY -> DEFRAG dealt no seed line" };
    await sleep(300);
    return { dealt };
  };
  if (!detail) {
    const d = await dealCards();
    if (d.error) detail = d.error;
    else if (d.dealt.m[2] !== "1" || d.dealt.m[3] !== "vegas") detail = `the fresh deal is draw ${d.dealt.m[2]} scoring ${d.dealt.m[3]}`;
    else {
      const o = await overlayGame();
      if (o.error) detail = o.error;
      else if (o.g.rows.draw.value !== "1" || o.g.rows.scoring.value !== "BOUNTY") detail = `GAME SETTINGS reads draw=${o.g.rows.draw.value} scoring=${o.g.rows.scoring.value} on a fresh store`;
      else {
        let m0 = consoleLines.length;
        await press("ArrowRight");
        const draw = await waitLine(/^crash: setting draw (\d)$/, m0, 2000);
        m0 = consoleLines.length;
        await press("ArrowDown"); await press("Enter");
        const scoring = await waitLine(/^crash: setting scoring (\w+)$/, m0, 2000);
        const said = await menuOn("pause-game", m0);
        if (!draw || draw.m[1] !== "3") detail = `Right on PULL said ${draw ? draw.m[0] : "nothing"}`;
        else if (!scoring || scoring.m[1] !== "standard") detail = `Enter on SCORING said ${scoring ? scoring.m[0] : "nothing"}`;
        else if (!said || said.rows.draw.value !== "3" || said.rows.scoring.value !== "AUDIT") detail = `the screen re-said ${said ? `draw=${said.rows.draw.value} scoring=${said.rows.scoring.value}` : "nothing"} after the steps`;
      }
    }
  }
  if (!detail) {
    // a reload: the stored keys hold them, the overlay reads them, the next deal honours them
    await sleep(500);
    const stored = await evalJS(`[localStorage.getItem("draw"), localStorage.getItem("scoring")]`);
    const d = await dealCards();
    if (d.error) detail = d.error;
    else if (d.dealt.m[2] !== "3" || d.dealt.m[3] !== "standard") detail = `after the reload the deal is draw ${d.dealt.m[2]} scoring ${d.dealt.m[3]} (stored ${JSON.stringify(stored)})`;
    else {
      const o = await overlayGame();
      if (o.error) detail = o.error;
      else if (o.g.rows.draw.value !== "3" || o.g.rows.scoring.value !== "AUDIT") detail = `after the reload GAME SETTINGS reads draw=${o.g.rows.draw.value} scoring=${o.g.rows.scoring.value}`;
      else if (stored[0] !== "3" || stored[1] !== "standard") detail = `the store holds draw=${stored[0]} scoring=${stored[1]}`;
      else {
        // the defaults back through the same rows
        let m0 = consoleLines.length;
        await press("ArrowRight");
        await waitLine(/^crash: setting draw 1$/, m0, 2000);
        await press("ArrowDown");
        m0 = consoleLines.length;
        await press("ArrowRight");
        await waitLine(/^crash: setting scoring vegas$/, m0, 2000);
        await sleep(300);
      }
    }
  }
  if (detail) fail("settings", detail);
  else pass("settings", "the main menu's SETTINGS is music sfx volume scanlines veil background (defaults on/on/10/on/on/live); BACKGROUND STILL dealt a still field seeded by the board with no step; DEFRAG's overlay GAME SETTINGS stepped PULL 3 and AUDIT, re-said, stored (draw=3 scoring=standard), the same after a reload and honoured by the deal; defaults restored");
}

// pause (D51): Escape on the board opens the table's own overlay over the
// paused table: its rows by context (free play: RESUME, SETTINGS, CODE,
// BACK TO MENU; the stack has no GAME SETTINGS), the table's clock holds
// while it is up (the pause lines carry the ticks), RESUME (Escape again)
// returns to the same board and the clock runs on, the bar's MENU button
// opens it too, and BACK TO MENU lands on the main menu with CONTINUE.
{
  let detail = "";
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&seed=1` });
  const booted = await waitLine(BOOT_ANY, from, 20000);
  if (!booted) detail = "no boot line";
  else if (!(await waitLine(/^crash: boot done /, from, 20000))) detail = "no \"crash: boot done\"";
  let on = null, off = null, on2 = null;
  if (!detail) {
    await sleep(1500);   // the clock runs a while first
    let m0 = consoleLines.length;
    await press("Escape");
    on = await waitLine(/^crash: pause on (\d+)$/, m0, 3000);
    const p = on && await menuOn("pause", m0);
    if (!on) detail = "Escape on the board said no \"crash: pause on\"";
    else if (!p) detail = "no overlay rows were said";
    else if (p.order.join(" ") !== "resume settings share back-to-menu") detail = `the stack's overlay rows are ${p.order.join(" ")}`;
    else {
      await sleep(2000);
      m0 = consoleLines.length;
      await press("Escape");
      off = await waitLine(/^crash: pause off (\d+)$/, m0, 3000);
      if (!off) detail = "Escape on the overlay did not resume (no \"crash: pause off\")";
      else if (off.m[1] !== on.m[1]) detail = `the table's clock moved under the overlay: ${on.m[1]} -> ${off.m[1]} ticks over 2 s`;
      else if (consoleLines.slice(on.index, off.index).some((l) => BOOT_ANY.test(l))) detail = "the board was re-dealt across the pause";
    }
  }
  if (!detail) {
    // the clock runs on after RESUME; the bar's MENU button opens the overlay too
    await sleep(1500);
    const btn = await waitLine(/^crash: control menu (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    const m0 = consoleLines.length;
    if (!btn) detail = "no \"crash: control menu\" line";
    else {
      await tap(btn.m[1], btn.m[2]);
      on2 = await waitLine(/^crash: pause on (\d+)$/, m0, 3000);
      if (!on2) detail = "the bar's MENU button did not open the overlay";
      else if (!(parseInt(on2.m[1], 10) > parseInt(off.m[1], 10))) detail = `the clock did not run on after RESUME: ${off.m[1]} then ${on2.m[1]}`;
    }
  }
  if (!detail) {
    // BACK TO MENU: the main menu with CONTINUE; CONTINUE returns to the same board
    const p = await menuOn("pause", on2.index, 3000);
    let m0 = consoleLines.length;
    if (!p) detail = "no overlay rows after the button";
    else {
      await tap(p.rows["back-to-menu"].x, p.rows["back-to-menu"].y);
      const chose = await waitLine(/^crash: menu chose back-to-menu$/, m0, 3000);
      const top = chose && await menuOn("top", m0);
      if (!chose) detail = "a tap on BACK TO MENU chose nothing";
      else if (!top || top.order[0] !== "continue") detail = `BACK TO MENU did not land on the main menu with CONTINUE (${top ? top.order.join(" ") : "no top line"})`;
      else {
        m0 = consoleLines.length;
        await press("Enter");
        const back = await waitLine(BOOT_ANY, m0, 5000);
        if (!back) detail = "CONTINUE did not boot the board back";
        else if (back.m[0].split(" ")[2] !== booted.m[0].split(" ")[2]) detail = `CONTINUE booted ${back.m[0]}, not the board's seed`;
      }
    }
  }
  if (detail) fail("pause", detail);
  else pass("pause", `Escape opened the stack's overlay (resume settings share back-to-menu); the clock held at ${on.m[1]} ticks over 2 s and ran on after RESUME (${on2.m[1]} at the button's second open); BACK TO MENU landed on CONTINUE, which booted the same board`);
}

// run (D51, David 2026-09-21): a JACK IN layer's overlay carries DISCONNECT,
// which lands on the main menu with CONTINUE resuming the layer; a cleared
// layer (the demo door) shows the ledger with NEXT LAYER once the cascade
// is over, and pulls the next layer by itself after the hold.
{
  let detail = "";
  const from = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&seed=1` });
  const booted = await waitLine(BOOT_ANY, from, 20000);
  if (!booted) detail = "no boot line";
  else if (!(await waitLine(/^crash: boot done /, from, 20000))) detail = "no \"crash: boot done\"";
  let layer = null;
  if (!detail) {
    // to the main menu, then the demo door armed for the next spec'd board,
    // then JACK IN: the run's first layer clears with one match
    let m0 = consoleLines.length;
    await press("Escape");
    const p = await menuOn("pause", m0);
    if (!p) detail = "no overlay on the board";
    else {
      m0 = consoleLines.length;
      await tap(p.rows["back-to-menu"].x, p.rows["back-to-menu"].y);
      const top = await menuOn("top", m0);
      if (!top) detail = "BACK TO MENU did not open the main menu";
      else {
        m0 = consoleLines.length;
        await tap(top.rows["jack-in"].x, top.rows["jack-in"].y);
        const start = await waitLine(/^crash: run start (\d+) ([0-9A-Z]{10})$/, m0, 5000);
        layer = start && await waitLine(/^crash: spec stack hacker (\d+) /, m0, 5000);
        if (!start) detail = "JACK IN started no run";
        else if (!layer) detail = "the run dealt no stack layer";
      }
    }
  }
  if (!detail) {
    // DISCONNECT: the main menu with CONTINUE; CONTINUE resumes the layer
    await sleep(500);
    let m0 = consoleLines.length;
    await press("Escape");
    const p = await menuOn("pause", m0);
    if (!p) detail = "no overlay on the run's layer";
    else if (p.order.join(" ") !== "resume settings share disconnect") detail = `the run layer's overlay rows are ${p.order.join(" ")}`;
    else {
      m0 = consoleLines.length;
      await downTo(p.order, "disconnect");
      await press("Enter");
      const chose = await waitLine(/^crash: menu chose disconnect$/, m0, 3000);
      const top = chose && await menuOn("top", m0);
      if (!chose) detail = "Enter on DISCONNECT chose nothing";
      else if (!top || top.order[0] !== "continue") detail = "DISCONNECT did not land on the main menu with CONTINUE";
      else {
        m0 = consoleLines.length;
        await press("Enter");
        const back = await waitLine(BOOT_ANY, m0, 5000);
        if (!back) detail = "CONTINUE did not resume the layer";
        else if (back.m[0].split(" ")[2] !== layer.m[1]) detail = `CONTINUE booted seed ${back.m[0].split(" ")[2]}, not the layer's ${layer.m[1]}`;
      }
    }
  }
  let done = null, next = null;
  if (!detail) {
    // a second run with the demo door armed: its first layer clears at once
    // (the door's own match), the cascade runs, the ledger opens, the pull
    let m0 = consoleLines.length;
    const t = await toMenu("Escape");
    const top = t && parseMenuLine(consoleLines[t.index]);
    if (!top) detail = toMenuDetail;
    else {
      await evalJS("window.__crashUpdates.app.dispatch('demo', 'cleared')");
      m0 = consoleLines.length;
      await tap(top.rows["jack-in"].x, top.rows["jack-in"].y);
      const demo = await waitLine(/^crash: demo cleared stack$/, m0, 5000);
      const removed = demo && await waitLine(/^crash: removed /, m0, 5000);
      done = removed && await waitLine(/^crash: run layer-done stack$/, m0, 20000);
      const rows = done && await menuOn("run-layer", done.index, 3000);
      if (!demo) detail = "the demo door did not arm the new run's layer";
      else if (!removed) detail = "the demo's match did not fire";
      else if (!done) detail = "no \"crash: run layer-done\" after the clear's cascade";
      else if (!rows || rows.order.join(" ") !== "next-layer") detail = `the ledger screen's rows are ${rows ? rows.order.join(" ") : "missing"}`;
      else {
        next = await waitLine(/^crash: run layer (\d+)$/, done.index, 8000);
        if (!next) detail = "the next layer was not pulled by itself within 8 s";
        else if (next.m[1] !== "2") detail = `the pull went to layer ${next.m[1]}, not 2`;
        else if (!(await waitLine(/^crash: spec cards hacker /, done.index, 5000))) detail = "layer 2 (DEFRAG) was not dealt";
      }
    }
  }
  if (detail) fail("run", detail);
  else pass("run", `JACK IN layer ${layer.m[1]}: DISCONNECT landed on CONTINUE, which resumed it; a second run's demo clear ended in the ledger (next-layer) and layer 2 was pulled by itself`);
}

// code: a share code round-trips (gate leg 2). FREE PLAY -> DEFRAG says
// the deal's spec (table, version, seed, code); ?code= with that code reads
// it and deals the same seed on the same table (the deal is regenerated
// from the fields, so structurally equal by construction: same seed, same
// draw and scoring); the pause menu shows the code line and COPY hands
// it to the page; one flipped character is refused (no spec line, the
// menu opens) and the CODE screen refuses it typed too.
{
  let detail = "";
  let code = null, seed = null, table = null;
  const r = await pauseMenu();
  if (r.error) detail = r.error;
  else {
    let m0 = consoleLines.length;
    await downTo(r.top.order, "free-play", topAt); topAt = r.top.order.indexOf("free-play");
    await press("Enter");
    const free = await menuOn("free", m0);
    if (!free) detail = "FREE PLAY did not open";
    else {
      m0 = consoleLines.length;
      await downTo(free.order, "cards");
      await press("Enter");
      const spec = await waitLine(/^crash: spec (\w+) (\w+) (\d+) ([0-9A-Z]{10})$/, m0, 5000);
      if (!spec) detail = "FREE PLAY -> DEFRAG said no spec line";
      else { table = spec.m[1]; seed = spec.m[3]; code = spec.m[4]; }
    }
  }
  let copied = null;
  if (!detail) {
    // the overlay's CODE row shows the code (D51); then the main menu's code line, and COPY
    await sleep(300);
    let m0 = consoleLines.length;
    const top = await toMenu("Escape");
    const overlayRow = top && consoleLines.slice(m0, top.index).find((l) => /^crash: menu pause /.test(l));
    const shareOk = overlayRow && overlayRow.includes(`share=${code.slice(0, 5)}-${code.slice(5)}`);
    const line = top && await waitLine(/^crash: menu-code ([0-9A-Z]{5}-[0-9A-Z]{5}) (-?[\d.]+) (-?[\d.]+)$/, m0, 2000);
    if (!top) detail = toMenuDetail;
    else if (!shareOk) detail = `the overlay's CODE row did not show ${code}: ${overlayRow}`;
    else if (!line) detail = "the pause menu said no code line for the live deal";
    else if (line.m[1] !== `${code.slice(0, 5)}-${code.slice(5)}`) detail = `the pause menu's code is ${line.m[1]}, the deal's ${code}`;
    else if (!EXPECT_NO_SELECTION) {
      m0 = consoleLines.length;
      await tap(parseFloat(line.m[2]), parseFloat(line.m[3]));
      const copy = await waitLine(/^crash: copy ([0-9A-Z-]+)$/, m0, 2000);
      if (!copy) detail = "a tap on the code line asked no COPY";
      else {
        await sleep(700);   // the page's poll runs every 300 ms
        copied = await evalJS(`localStorage.getItem("code")`);
        if (copied !== line.m[1]) detail = `after COPY the page's code key holds ${JSON.stringify(copied)}, not ${line.m[1]}`;
      }
    }
  }
  if (!detail) {
    // ?code= deals the same
    const from = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&code=${code}` });
    const read = await waitLine(/^crash: code read ([0-9A-Z]{10}) (\w+)$/, from, 20000);
    const spec = read && await waitLine(/^crash: spec (\w+) (\w+) (\d+) ([0-9A-Z]{10})$/, from, 10000);
    const dealt = spec && await waitLine(/^crash: cards seed (\d+) /, from, 10000);
    if (!read) detail = `?code=${code} was not read`;
    else if (read.m[1] !== code || read.m[2] !== table) detail = `?code= read ${read.m[0]}`;
    else if (!spec || spec.m[1] !== table || spec.m[3] !== seed || spec.m[4] !== code) detail = `?code= dealt ${spec ? spec.m[0] : "nothing"}, not ${table} seed ${seed}`;
    else if (!dealt || dealt.m[1] !== seed) detail = `the deal's own seed line was ${dealt ? dealt.m[0] : "missing"}`;
  }
  let flipped = null;
  if (!detail) {
    // one character flipped: refused, the menu opens, no spec line
    const i = 7;   // a payload digit (the seed's), not a check digit
    const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    const other = alphabet[(alphabet.indexOf(code[i]) + 1) % 32];
    flipped = code.slice(0, i) + other + code.slice(i + 1);
    const from = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&code=${flipped}` });
    const refused = await waitLine(/^crash: code refused ([0-9A-Z]+)$/, from, 20000);
    await sleep(1500);
    const after = consoleLines.slice(from);
    if (!refused || refused.m[1] !== flipped) detail = `the flipped code ${flipped} was not refused (${refused ? refused.m[0] : "no refused line"})`;
    else if (after.some((l) => /^crash: (spec|code read) /.test(l))) detail = `the flipped code ${flipped} dealt a board: ${after.find((l) => /^crash: (spec|code read) /.test(l))}`;
    else if (!after.some((l) => /^crash: menu top /.test(l))) detail = "after the refusal no menu opened";
  }
  if (!detail) {
    // typed on the CODE screen: the flipped code refused, the good one read
    const r2 = await pauseMenu();
    if (r2.error) detail = r2.error;
    else {
      let m0 = consoleLines.length;
      await downTo(r2.top.order, "free-play", topAt); topAt = r2.top.order.indexOf("free-play");
      await press("Enter");
      const free = await menuOn("free", m0);
      m0 = consoleLines.length;
      if (free) { await downTo(free.order, "code"); await press("Enter"); }
      const screen = free && await menuOn("code", m0);
      if (!screen) detail = "the CODE screen did not open";
      else {
        m0 = consoleLines.length;
        await type(flipped.toLowerCase());
        await press("Enter");
        const refused = await waitLine(/^crash: code refused ([0-9A-Z]+)$/, m0, 3000);
        if (!refused || refused.m[1] !== flipped) detail = `typed, the flipped code was not refused (${refused ? refused.m[0] : "no line"})`;
        else {
          // the screen reopened clears the typed text (ten Backspaces can land
          // two to a frame under load and leave characters behind)
          m0 = consoleLines.length;
          await press("Escape");
          if (!(await menuOn("top", m0))) detail = "Escape did not leave the CODE screen";
          await downTo(r2.top.order, "free-play", topAt); topAt = r2.top.order.indexOf("free-play");
          await press("Enter");
          const free2 = await menuOn("free", m0);
          if (free2) { await downTo(free2.order, "code"); await press("Enter"); }
          if (!(free2 && await menuOn("code", m0))) detail = detail || "the CODE screen did not reopen";
          m0 = consoleLines.length;
          await type(code.toLowerCase());
          await press("Enter");
          const read = await waitLine(/^crash: code read ([0-9A-Z]{10}) (\w+)$/, m0, 3000);
          const spec = read && await waitLine(/^crash: spec (\w+) (\w+) (\d+) /, m0, 5000);
          if (!read || read.m[1] !== code) detail = `typed, the good code was not read (${read ? read.m[0] : "no line"})`;
          else if (!spec || spec.m[3] !== seed) detail = `typed, the good code dealt ${spec ? spec.m[0] : "nothing"}`;
        }
      }
    }
  }
  if (detail) fail("code", detail);
  else pass("code", `${table} seed ${seed} -> ${code}; the pause menu shows it${copied ? " and COPY handed it to the page" : ""}; ?code= and the CODE screen deal seed ${seed} again; ${flipped} (one character flipped) refused by both`);
}

// daily: the seed for a fixed date is the pinned value (gate leg 3).
// ?epoch=1789947000 is 2026-09-20T23:30:00Z (day 20716): DAILY STACK deals
// seed 2029908705 and DAILY DEFRAG 182 (test/test-daily.sgl pins the same);
// the day after (+86400) deals 1007910919; and with no ?epoch the day is
// today's UTC day, read under a timezone where the local date is not the
// UTC date (the S2 sabotage, a daily from local time, shows here as a day
// off in either the fixture or the live boot).
{
  let detail = "";
  const FIXTURE = 1789947000;
  const dealDaily = async (extra, which) => {
    const r = await pauseMenu(extra);
    if (r.error) return { error: r.error };
    let m0 = consoleLines.length;
    await downTo(r.top.order, "free-play", topAt); topAt = r.top.order.indexOf("free-play");
    await press("Enter");
    const free = await menuOn("free", m0);
    if (!free) return { error: "FREE PLAY did not open" };
    m0 = consoleLines.length;
    await downTo(free.order, which);
    await press("Enter");
    const day = await waitLine(/^crash: daily (\d+) (\d+-\d+-\d+)$/, m0, 3000);
    const spec = day && await waitLine(/^crash: spec (\w+) (\w+) (\d+) ([0-9A-Z]{10})$/, m0, 5000);
    if (!day) return { error: `${which} said no daily line` };
    if (!spec) return { error: `${which} dealt no spec line` };
    return { day: parseInt(day.m[1], 10), date: day.m[2], table: spec.m[1], version: spec.m[2], seed: spec.m[3] };
  };
  const a = await dealDaily(`&epoch=${FIXTURE}`, "daily-stack");
  const b = a.error ? a : await dealDaily(`&epoch=${FIXTURE}`, "daily-cards");
  const c = b.error ? b : await dealDaily(`&epoch=${FIXTURE + 86400}`, "daily-stack");
  if (a.error) detail = a.error;
  else if (a.day !== 20716 || a.date !== "2026-9-20") detail = `the fixture's day read ${a.day} ${a.date}, not 20716 2026-9-20`;
  else if (a.table !== "stack" || a.version !== "hacker" || a.seed !== "2029908705") detail = `DAILY STACK at the fixture dealt ${a.table} ${a.version} ${a.seed}, not stack hacker 2029908705`;
  else if (b.error) detail = b.error;
  else if (b.table !== "cards" || b.version !== "hacker" || b.seed !== "182") detail = `DAILY DEFRAG at the fixture dealt ${b.table} ${b.version} ${b.seed}, not cards hacker 182`;
  else if (c.error) detail = c.error;
  else if (c.day !== 20717 || c.seed !== "1007910919") detail = `the day after dealt day ${c.day} seed ${c.seed}, not 20717 1007910919`;
  let live = null;
  if (!detail) {
    // no ?epoch: today's UTC day, with the page's clock in a zone whose local
    // date differs from UTC right now (+14 in the UTC afternoon, -12 in its morning)
    const zone = new Date().getUTCHours() >= 12 ? "Pacific/Kiritimati" : "Etc/GMT+12";
    await send("Emulation.setTimezoneOverride", { timezoneId: zone });
    live = await dealDaily("", "daily-stack");
    const today = Math.floor(Date.now() / 86400000);
    await send("Emulation.setTimezoneOverride", { timezoneId: "" });
    if (live.error) detail = live.error;
    else if (live.day !== today) detail = `with the page's clock in ${zone} the live daily's day read ${live.day}, today's UTC day is ${today}`;
    else live.zone = zone;
  }
  if (detail) fail("daily", detail);
  else pass("daily", `epoch ${FIXTURE} = day 20716 (${a.date}): stack ${a.seed}, cards ${b.seed}; day 20717: stack ${c.seed}; live boot under ${live.zone} read UTC day ${live.day}`);
}

// scores: the scoreboard persists across a reload (gate leg 4, the web
// half) and shows on the SCORES screen. A fresh origin reads every cell
// empty; a board written in the game's own datum shape ((crash scores)'s,
// the same text scores-save! writes: the arm cannot clear a real board
// here, and the demo door keeps the scoreboard clean by design) reads back
// after a reload as the game's own "crash: scores" line; and a live clear's
// recording is test-scores' and test-store's (record-clear! -> scores-save!).
{
  let detail = "";
  const SCORES_RE = /^crash: scores stack hacker (\S+) (\S+) (\d+) stack original (\S+) (\S+) (\d+) cards hacker (\S+) (\S+) (\d+) cards original (\S+) (\S+) (\d+) streak stack (\d+) cards (\d+)$/;
  const readScores = async () => {
    const r = await pauseMenu();
    if (r.error) return { error: r.error };
    let m0 = consoleLines.length;
    await downTo(r.top.order, "free-play", topAt); topAt = r.top.order.indexOf("free-play");
    await press("Enter");
    const free = await menuOn("free", m0);
    if (!free) return { error: "FREE PLAY did not open" };
    m0 = consoleLines.length;
    await downTo(free.order, "scores");
    await press("Enter");
    const l = await waitLine(SCORES_RE, m0, 3000);
    return l ? { m: l.m } : { error: "the SCORES screen said no scores line" };
  };
  await evalJS(`localStorage.removeItem("scores")`);
  const empty = await readScores();
  if (empty.error) detail = empty.error;
  else if (empty.m.slice(1, 13).join(" ") !== "- - 0 - - 0 - - 0 - - 0" || empty.m[13] !== "0" || empty.m[14] !== "0") detail = `a fresh origin's board reads ${empty.m[0]}`;
  if (!detail) {
    await evalJS(`localStorage.setItem("scores", "(crash-scores 1 (best stack hacker 1234 72 3) (best cards original 900 110 1) (daily stack 20716 4))")`);
    const again = await readScores();
    if (again.error) detail = again.error;
    else if (again.m[1] !== "1234" || again.m[2] !== "72" || again.m[3] !== "3" || again.m[10] !== "900" || again.m[11] !== "110" || again.m[12] !== "1" || again.m[13] !== "4" || again.m[14] !== "0") detail = `after the reload the board reads ${again.m[0]}`;
  }
  await evalJS(`localStorage.removeItem("scores")`);
  if (detail) fail("scores", detail);
  else pass("scores", "a fresh origin reads every cell empty; a stored board (stack hacker 1234/72/3, cards original 900/110/1, stack streak 4) reads back on the SCORES screen after a reload");
}

// ---- 10. manifest: the PWA is installable from this origin ------------------
{
  try {
    const m = await send("Page.getAppManifest");
    const errors = m.errors || [];
    let detail = "";
    if (!m.url || !m.url.endsWith("assets/manifest.webmanifest")) detail = `manifest url ${m.url}`;
    else if (errors.length) detail = `manifest errors: ${JSON.stringify(errors.slice(0, 3))}`;
    else {
      let data = null;
      try { data = JSON.parse(m.data); } catch { detail = "manifest data is not JSON"; }
      if (data && (!data.icons || data.icons.length < 2 || data.name !== "Crash The Stack")) detail = `manifest content: ${m.data.slice(0, 120)}`;
    }
    if (!detail) {
      const inst = await send("Page.getInstallabilityErrors");
      const errs = (inst.installabilityErrors || []).map((e) => e.errorId);
      if (errs.length) detail = `installability errors: ${errs.join(", ")}`;
      else pass("manifest", `${m.url.replace(/^.*\//, "")} parsed, 0 errors, installable`);
    }
    if (detail) fail("manifest", detail);
  } catch (err) {
    fail("manifest", `CDP: ${err.message}`);
  }
}

// ---- 11. console ------------------------------------------------------------
// The runtime prints its own errors ("Error: ...", "Scheme error in
// frame: ...") through the WASI shim as plain console lines, not
// console.error, so they count here too (2026-09-17: a per-frame "=:
// expected number" left this sub-arm reading "0 errors").
const runtimeErrors = consoleLines.filter((l) => /^(Error:|Scheme error)/.test(l));
// A texture fetch the page's own reload aborts is logged by the gles3
// bridge as console.error ("image fetch failed: TypeError: Failed to
// fetch") and by the browser as "Failed to load resource: net::ERR_FAILED"
// (the title leg holds the backdrop 120 s and then navigates away from it;
// the game asks again on the next boot; P3d, D40: fetches start
// as soon as the worker is ready, so a reload the arm forces mid-boot
// can cut one). Counted and shown, not failed.
const ABORTED = /image fetch failed: TypeError: Failed to fetch|Failed to load resource: net::ERR_FAILED/;
const abortedFetches = consoleErrors.filter((l) => ABORTED.test(l));
const realErrors = consoleErrors.filter((l) => !ABORTED.test(l));
// the three lines before the first error are the context a reader needs
const firstErrorAt = consoleLines.findIndex((l) => /^Error: /.test(l));
if (firstErrorAt > 0) console.log(`  before the first error: ${JSON.stringify(consoleLines.slice(Math.max(0, firstErrorAt - 3), firstErrorAt))}`);
if (realErrors.length === 0 && runtimeErrors.length === 0) pass("console", `${consoleLines.length} console lines, 0 errors${abortedFetches.length ? `, ${abortedFetches.length} image fetch(es) aborted by a reload` : ""}`);
else fail("console", `${realErrors.length + runtimeErrors.length} error(s): ${JSON.stringify(realErrors.concat(runtimeErrors).slice(0, 5))}`);

// ---- screenshot for the record ----------------------------------------------
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(SHOT, Buffer.from(shot.data, "base64"));
console.log(`screenshot -> ${SHOT}`);

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`RESULT: ${results.filter((r) => r[1] === "PASS").length} passed, ${failed} failed, ${results.filter((r) => r[1] === "SKIP").length} skipped`);
if (failed) dump();
shutdown(failed ? 1 : 0);
