// verify-scan.mjs - SCAN's browser arm (0.1.3; the design's gate leg 13).
//
//   node verify-scan.mjs [build/web] [--port N] [--cdp N] [--phone] [--seed N]
//                        [--throttle X] [--shot PATH]
//
// The same harness as verify-cards.mjs (loopback server, headless Chrome on
// SwiftShader, the DevTools Protocol, --mute-audio and the worker-null
// sink), with every board action a REAL input event from the DevTools
// Protocol (Input.dispatchMouseEvent / Input.dispatchTouchEvent), never a
// script-dispatched PointerEvent: only a real right button makes the
// browser fire contextmenu, only a real touch carries pointerType touch,
// and only real events reach the page's own SCAN listener the way a
// player's do. Sub-arms:
//
//   menu       a fresh origin's menu: FREE PLAY lists SCAN between DEFRAG and
//              ENTER CODE; SCAN's screen is NEW BOARD DAILY BOARD SIZE=LAN
//              BACK; Enter on NEW BOARD opens a LAN board ("crash: scan open lan")
//   open       ?scan=lan&seed=N: "crash: scan open lan N CELL X0 Y0 board"
//              with the design's LAN layout (36 px hosts, centered)
//   render     the board region of a screenshot is mostly the hidden host's
//              face (C-STATIC-B #2A2D3A): a board that draws nothing, or
//              draws only the background, fails
//   tap-scans  a real click (desktop) or tap (phone) on the middle host is
//              the uplink: "crash: scan dealt ..." then a state line with
//              hosts scanned and none tripped
//   flag       desktop: a real right-button click on a hidden host flags it
//              (the state's flagged count goes to 1) AND the contextmenu
//              event reached the document defaultPrevented (the page's
//              canvas listener; a script-dispatched event never fires one);
//              phone: a 600 ms still touch (the long press) flags it, with
//              "crash: scan request buzz", and scans nothing
//   map        phone: ?scan=backbone opens as a map (20 px hosts, under the
//              30 px floor, D71); a tap there zooms ("... zoomed") and scans
//              nothing (no deal starts); a tap in the zoomed window is the
//              uplink. Desktop: the same board opens as "board" (no map)
//   audio      D81: ?scan=backbone at a CPU throttle of --throttle (4 by
//              default), the music playing (a gesture first, then "crash:
//              music open"): the uplink's deal is sliced (more than one frame)
//              and the sink starved no frames over it and one second after
//              ("crash: scan deal-audio underruns 0 ..."). Its sabotage is a
//              deal in one frame (GEN-BUDGET-MS huge), which must starve it
//   console    zero error-level console entries and zero exceptions
//
// Every sub-arm anchors on a "crash: scan ..." line, which only the SCAN
// screen prints. A wait that runs out prints TIMED-OUT with everything
// collected and exits 2; SETUP-FAILED (exit 2) when the build is not there.

import http from "node:http";
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--shot", "--port", "--cdp", "--seed", "--throttle"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const SHOT = opt("--shot", null);
const PORT = parseInt(opt("--port", "8099"), 10);
const CDP = parseInt(opt("--cdp", "9239"), 10);
const SEED = opt("--seed", "5");
const THROTTLE = parseFloat(opt("--throttle", "4"));   // the audio leg's CPU throttle (a phone proxy, D81)
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const results = [];
const planned = ["menu", "open", "render", "tap-scans", "flag", "map", "audio", "console"];
function pass(name, detail) { results.push([name, "PASS"]); console.log(`PASS ${name}${detail ? ": " + detail : ""}`); }
function fail(name, detail) { results.push([name, "FAIL"]); console.log(`FAIL ${name}: ${detail}`); }
function notRun() { const done = new Set(results.map((r) => r[0])); return planned.filter((p) => !done.has(p)); }

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: ${ROOT}/index.html missing`); process.exit(2); }

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

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

const udd = fs.mkdtempSync("/tmp/crash-verify-scan-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
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
  // the verdict first: the exit below sits in an unref'd timer, so a run whose
  // loop empties before it fires exits naturally, and without this it exits 0
  process.exitCode = code;
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
const WHOLE_RUN_MS = 300000;
setTimeout(() => { console.log(`TIMED-OUT whole run after ${WHOLE_RUN_MS} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, WHOLE_RUN_MS).unref();

let pageWs = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) pageWs = page.webSocketDebuggerUrl;
  } catch { /* chrome not up yet */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s"); shutdown(2); await new Promise(() => {}); }

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
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") consoleErrors.push("log: " + msg.params.entry.text);
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
if (PHONE) {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  // a phone: a coarse pointer that cannot hover, and touch, so the table
  // starts with its tags hidden (David's rule) and the arm shows them
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
} else {
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 760, deviceScaleFactor: 2, mobile: false });
  // a desktop with a mouse (headless Chrome otherwise reports hover: none,
  // which the page reads as a touch screen; P1's finding)
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
function timedOut(name) {
  console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`);
  dump(); shutdown(2);
}
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

// The service worker's activation races the first page's fetches (P3's
// finding, and D40 starts them at swReady + 750 ms): a loader-side
// "image fetch failed" console.error whose fetch the game then landed is
// the loader's line, not the game's. As verify-field.mjs does (P3c,
// bb6e8b5): the first page waits for the worker to control it before the
// second boot, and in the console leg a raced loader line with no
// "crash: texture missing" after it is a note, not a failure; the page's
// own "crash: tune-unavailable NAME" is a console.log the arm never
// counted, and its retry is asserted by the boot's audio step.
let swWaited = false;
async function waitForWorker() {
  if (swWaited) return; swWaited = true;
  const ok = await evalJS(`(async () => { if (!navigator.serviceWorker) return "none"; const t0 = Date.now(); while (Date.now() - t0 < 15000) { const r = await navigator.serviceWorker.getRegistration(); if (r && r.active && navigator.serviceWorker.controller) return "controlling"; await new Promise((res) => setTimeout(res, 100)); } return "timeout"; })()`);
  console.log(`note: service worker ${ok}`);
}


// ---- helpers ---------------------------------------------------------------------


// A virtual point to the client (CSS px) point on the canvas, through the
// letterbox, as a player's finger or pointer lands.
async function client(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    return { cx: r.left + bx * r.width / c.width, cy: r.top + by * r.height / c.height };
  })()`);
}
const BITS = { left: 1, right: 2, middle: 4 };
async function mouseAt(type, cx, cy, button, buttons) {
  await send("Input.dispatchMouseEvent", { type, x: cx, y: cy, button, buttons, clickCount: type === "mouseMoved" ? 0 : 1, pointerType: "mouse" });
}
// A real click: move, press, release (the browser makes the pointer events,
// and for the right button the contextmenu event).
async function click(vx, vy, button = "left") {
  const { cx, cy } = await client(vx, vy);
  await mouseAt("mouseMoved", cx, cy, "none", 0);
  await mouseAt("mousePressed", cx, cy, button, BITS[button]);
  await sleep(80);
  await mouseAt("mouseReleased", cx, cy, button, 0);
}
// A real touch held holdMs, then lifted.
async function touch(vx, vy, holdMs = 80) {
  const { cx, cy } = await client(vx, vy);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await sleep(holdMs);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
const act = (vx, vy) => (PHONE ? touch(vx, vy) : click(vx, vy));
async function key(k) {
  await evalJS(`document.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
  await sleep(40);
  await evalJS(`document.dispatchEvent(new KeyboardEvent("keyup", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
  await sleep(150);
}
const STATE_RE = /^crash: scan state (\d+) (\d+) (\d+) (\w+) (\w+) (-?\d+)$/;
const OPEN_RE = /^crash: scan open (\w+) (\d+) (\d+) (-?\d+) (-?\d+) (\w+)$/;
async function open(query) {
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh&${query}` });
  const o = await waitLine(OPEN_RE, mark, 30000);
  if (!o) return null;
  await sleep(1200);   // a few frames drawn
  const [, preset, seed, cell, x0, y0, view] = o.m;
  return { preset, seed: +seed, cell: +cell, x0: +x0, y0: +y0, view, index: o.index };
}
// the center of host (col, row) in the board layout (virtual px)
const hostCenter = (o, col, row) => [o.x0 + col * o.cell + o.cell / 2, o.y0 + row * o.cell + o.cell / 2];

// A PNG from Page.captureScreenshot, decoded (8-bit RGB or RGBA, no interlace).
function decodePng(buf) {
  let off = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw new Error("png: not 8-bit non-interlaced"); }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error("png: colour type " + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
// The share of a virtual rect's pixels that read as the hidden host's face,
// C-STATIC-B #2A2D3A, allowing for the scanline pass's darker rows: a
// neutral gray with a little blue, 20..70 in every channel.
async function faceShare(vx, vy, vw, vh) {
  const a = await client(vx, vy), b = await client(vx + vw, vy + vh);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: a.cx, y: a.cy, width: b.cx - a.cx, height: b.cy - a.cy, scale: 1 } });
  const buf = Buffer.from(shot.data, "base64");
  if (SHOT) fs.writeFileSync(SHOT, buf);
  const img = decodePng(buf);
  let face = 0, n = 0;
  for (let i = 0; i < img.w * img.h; i++) {
    const r = img.px[i * img.bpp], g = img.px[i * img.bpp + 1], bl = img.px[i * img.bpp + 2];
    n++;
    if (r >= 20 && r <= 70 && g >= 20 && g <= 72 && bl >= 25 && bl <= 85 && Math.abs(r - g) <= 12 && bl - r >= 4 && bl - r <= 26) face++;
  }
  return { share: face / n, n };
}

// ---- menu ------------------------------------------------------------------------
{
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace` });
  const menu = await waitLine(/^crash: menu top (.+)$/, mark, 20000);
  if (!menu) { fail("menu", "no top menu line within 20 s"); timedOut("menu"); await new Promise(() => {}); }
  await sleep(800);
  if (await waitLine(/^crash: title gate /, mark, 20000)) { await key("ArrowUp"); await waitLine(/^crash: title connect$/, mark, 3000); }
  if (await waitLine(/^crash: title card tick /, mark, 20000)) { await key("ArrowUp"); await waitLine(/^crash: title card done /, mark, 3000); }
  await key("ArrowUp");
  const booted = await waitLine(/^crash: boot done /, mark, 20000);
  const settled = await waitLine(/^crash: title settled /, mark, 5000);
  let m0 = consoleLines.length;
  await key("ArrowDown"); await key("Enter");   // JACK IN is first; FREE PLAY second (no CONTINUE on a fresh origin)
  const free = await waitLine(/^crash: menu free (.+)$/, m0, 3000);
  const rows = free ? free.m[1].split(" ").filter((_, i) => i % 3 === 0).map((id) => id.split("=")[0]) : [];
  let detail = "";
  if (!booted || !settled) detail = "the menu never went live (no boot done / title settled)";
  else if (!free) detail = "ArrowDown, Enter did not open FREE PLAY";
  else if (rows.join(" ") !== "stack cards scan code scores back") detail = `FREE PLAY's rows are ${rows.join(" ")}, not stack cards scan code scores back`;
  else {
    m0 = consoleLines.length;
    await key("ArrowDown"); await key("ArrowDown"); await key("Enter");
    const game = await waitLine(/^crash: menu free-scan (.+)$/, m0, 3000);
    const grows = game ? game.m[1].split(" ").filter((_, i) => i % 3 === 0).join(" ") : "";
    if (!game) detail = "Enter on SCAN did not open SCAN's screen (no \"crash: menu free-scan\" line)";
    else if (grows !== "new-board daily-board size=LAN back") detail = `SCAN's rows are ${grows}, not new-board daily-board size=LAN back`;
    else {
      m0 = consoleLines.length;
      await key("Enter");
      const o = await waitLine(OPEN_RE, m0, 5000);
      if (!o) detail = "Enter on NEW BOARD opened no SCAN board";
      else if (o.m[1] !== "lan") detail = `NEW BOARD opened ${o.m[0]}, not a LAN board`;
      else pass("menu", `FREE PLAY ${rows.join(" ")}; SCAN's screen ${grows}; NEW BOARD -> ${o.m[0]}`);
    }
  }
  if (detail) fail("menu", detail);
}
await waitForWorker();

// ---- open, render, tap-scans, flag ------------------------------------------------
let lan = await open(`scan=lan&seed=${SEED}`);
if (!lan) { fail("open", "no \"crash: scan open\" line within 30 s of ?scan=lan"); timedOut("open"); await new Promise(() => {}); }
// LAN: 9x9 at 36 px (the band 640x352 less an 8 px margin, rounded down to even), centered
if (lan.preset !== "lan" || lan.seed !== +SEED || lan.cell !== 36 || lan.x0 !== 158 || lan.y0 !== 14 || lan.view !== "board") fail("open", `expected lan ${SEED} 36 158 14 board, got ${consoleLines[lan.index]}`);
else pass("open", consoleLines[lan.index]);

{
  const r = await faceShare(lan.x0, lan.y0, 9 * lan.cell, 9 * lan.cell);
  if (r.share < 0.5) fail("render", `only ${(100 * r.share).toFixed(1)} % of the board region reads as the hidden face (of ${r.n} px); the board is not drawn`);
  else pass("render", `${(100 * r.share).toFixed(1)} % of the board region (${r.n} px) is the hidden host's face`);
}

let hidden = null;
{
  const m0 = consoleLines.length;
  const [ux, uy] = hostCenter(lan, 4, 4);
  await act(ux, uy);
  const dealt = await waitLine(/^crash: scan dealt (\d+) frames (\d+) worst (\d+)$/, m0, 15000);
  const st = dealt && await waitLine(STATE_RE, m0, 3000);
  const hid = st && await waitLine(/^crash: scan hidden (-?\d+) (-?\d+) (-?\d+)$/, st.index, 2000);
  if (!dealt) fail("tap-scans", `a real ${PHONE ? "tap" : "click"} on the middle host dealt nothing (no "crash: scan dealt")`);
  else if (!st) fail("tap-scans", "the deal left no state line");
  else if (+st.m[1] < 9) fail("tap-scans", `the uplink scanned ${st.m[1]} hosts; its 3x3 alone is 9`);
  else if (+st.m[3] !== 0) fail("tap-scans", `the uplink tripped ICE: ${st.m[0]}`);
  else {
    pass("tap-scans", `${PHONE ? "tap" : "click"} -> ${dealt.m[0]}; ${st.m[0]}`);
    if (hid && +hid.m[1] >= 0) hidden = [+hid.m[2], +hid.m[3]];
  }
}

if (!hidden) fail("flag", "no hidden host to flag (the tap-scans leg did not name one)");
else if (PHONE) {
  const m0 = consoleLines.length;
  await touch(hidden[0], hidden[1], 650);
  const st = await waitLine(STATE_RE, m0, 3000);
  const buzz = await waitLine(/^crash: scan request buzz$/, m0, 2000);
  if (!st) fail("flag", "a 650 ms still touch changed nothing (no state line)");
  else if (st.m[2] !== "1") fail("flag", `the long press did not flag: ${st.m[0]}`);
  else if (!buzz) fail("flag", "the long press flagged with no buzz request");
  else pass("flag", `long press -> ${st.m[0]}, buzz asked`);
} else {
  await evalJS(`(() => { window.__ctx = []; document.addEventListener("contextmenu", (e) => window.__ctx.push(e.defaultPrevented)); return true; })()`);
  const m0 = consoleLines.length;
  await click(hidden[0], hidden[1], "right");
  const st = await waitLine(STATE_RE, m0, 3000);
  await sleep(200);
  const ctx = await evalJS("window.__ctx");
  if (!ctx.length) fail("flag", "the right click fired no contextmenu event (not a real right button?)");
  else if (ctx.some((p) => !p)) fail("flag", `contextmenu reached the document NOT prevented (${JSON.stringify(ctx)}): the browser's menu would open`);
  else if (!st) fail("flag", "a real right click changed nothing (no state line)");
  else if (st.m[2] !== "1") fail("flag", `the right click did not flag: ${st.m[0]}`);
  else pass("flag", `right click -> ${st.m[0]}; contextmenu prevented ${JSON.stringify(ctx)}`);
}

// ---- map ---------------------------------------------------------------------------
{
  const bb = await open(`scan=backbone&seed=${SEED}`);
  if (!bb) fail("map", "no open line for ?scan=backbone");
  else if (!PHONE) {
    if (bb.view !== "board" || bb.cell !== 20) fail("map", `a desktop BACKBONE should open as a 20 px board, got ${consoleLines[bb.index]}`);
    else pass("map", `desktop: ${consoleLines[bb.index]} (no map without touch)`);
  } else if (bb.view !== "map" || bb.cell !== 20) fail("map", `a phone BACKBONE should open as a 20 px map, got ${consoleLines[bb.index]}`);
  else {
    let m0 = consoleLines.length;
    const [mx, my] = hostCenter(bb, 15, 8);
    await touch(mx, my);
    const st = await waitLine(STATE_RE, m0, 3000);
    await sleep(500);
    const dealt = consoleLines.slice(m0).some((l) => /^crash: scan dealt /.test(l));
    if (!st) fail("map", "a tap on the map changed nothing (no state line)");
    else if (st.m[5] !== "zoomed" || st.m[1] !== "0") fail("map", `a tap on the map must zoom and scan nothing: ${st.m[0]}`);
    else if (dealt) fail("map", "a tap on the map started the deal");
    else {
      // the zoomed window is centered on the tapped host: the middle of the band
      m0 = consoleLines.length;
      await touch(336, 176);   // host (15, 8): column 10 of the window from column 5
      const d = await waitLine(/^crash: scan dealt /, m0, 15000);
      const st2 = d && await waitLine(STATE_RE, m0, 3000);
      if (!d || !st2 || +st2.m[1] < 4) fail("map", `a tap in the zoomed window did not scan the uplink: ${st2 ? st2.m[0] : "no dealt line"}`);
      else pass("map", `${consoleLines[bb.index]}; map tap -> ${st.m[0]}; window tap -> ${st2.m[0]}`);
    }
  }
}

// ---- audio (D81) ----------------------------------------------------------------------
{
  const bb = await open(`scan=backbone&seed=${SEED}`);
  let detail = "";
  if (!bb) detail = "no open line for ?scan=backbone";
  else {
    const m0 = bb.index;
    // a real gesture off the board (the bar's middle) resumes the context,
    // once the game has opened it: a gesture before "crash: audio open" is
    // ignored by design, and the board opens before the boot's audio step
    // (the phone run's first try tapped 1.2 s in, too early)
    await waitLine(/^crash: boot done /, m0, 30000);
    let resumed = null;
    for (let i = 0; i < 3 && !resumed; i++) {
      await act(320, 392);
      resumed = await waitLine(/^crash: audio resumed$/, m0, 3000);
    }
    const music = await waitLine(/^crash: music open /, m0, 20000);
    if (!resumed) detail = "the audio context never resumed (no \"crash: audio resumed\" after a gesture): nothing to starve";
    else if (!music) detail = "no \"crash: music open\": the music is not playing, so an underrun could not be seen";
    else {
      await sleep(1500);   // the ring full
      await send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
      const m1 = consoleLines.length;
      const [ux, uy] = PHONE ? [336, 176] : hostCenter(bb, 15, 8);
      if (PHONE) { await touch(320, 176); await sleep(300); }   // the map zooms first, onto host (15, 8)
      await act(ux, uy);
      const dealt = await waitLine(/^crash: scan dealt (\d+) frames (\d+) worst (\d+)$/, m1, 60000);
      const au = dealt && await waitLine(/^crash: scan deal-audio underruns (\d+) worst (\d+)$/, dealt.index, 15000);
      await send("Emulation.setCPUThrottlingRate", { rate: 1 });
      if (!dealt) detail = `the uplink's deal did not finish within 60 s at ${THROTTLE}x`;
      else if (!au) detail = "no \"crash: scan deal-audio\" line after the deal";
      else if (+dealt.m[2] < 2) detail = `the deal ran in ${dealt.m[2]} frame: it was not sliced (D81) (${dealt.m[0]})`;
      else if (+au.m[1] !== 0) detail = `the first click starved the audio sink: ${au.m[0]} (${dealt.m[0]}, ${THROTTLE}x)`;
      else pass("audio", `${THROTTLE}x: ${dealt.m[0]}; ${au.m[0]}; music ${music.m[0].replace("crash: music open ", "")}`);
    }
  }
  if (detail) fail("audio", detail);
}

// ---- console ---------------------------------------------------------------------------
{
  const scheme = consoleLines.filter((l) => /^(Error:|Scheme error)/.test(l));
  const errs = consoleErrors.concat(scheme);
  if (errs.length) fail("console", `${errs.length} error line(s): ${errs.slice(0, 3).join(" | ")}`);
  else pass("console", `0 errors over ${consoleLines.length} lines`);
}

const failed = results.filter((r) => r[1] !== "PASS");
if (failed.length) dump();
console.log(failed.length ? `verify-scan: ${failed.length} FAIL (${failed.map((r) => r[0]).join(" ")})` : `verify-scan: ALL PASS (${results.length} sub-arms${PHONE ? ", phone" : ""})`);
shutdown(failed.length ? 1 : 0);
