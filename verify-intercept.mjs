// verify-intercept.mjs - INTERCEPT's browser arm (the rhythm game, CLASSIC).
//
//   node verify-intercept.mjs [build/web] [--port N] [--cdp N] [--phone] [--song NAME]
//                             [--full] [--shot PATH]
//
// SCAN's harness (loopback server, headless Chrome on SwiftShader, the
// DevTools Protocol, --mute-audio and the worker-null sink), with Chrome
// told to let audio start without a gesture (--autoplay-policy), so the
// ?intercept door's song plays in a page nobody has touched. Every lane
// press is a REAL input event from the DevTools Protocol
// (Input.dispatchKeyEvent, Input.dispatchTouchEvent), so it reaches the
// page's listeners the way a player's does. --phone is a landscape phone
// (844x390, touch, coarse pointer): INTERCEPT on touch is four wide pads.
// Sub-arms:
//
//   menu    a fresh origin's FREE PLAY lists INTERCEPT after SCAN:
//           stack cards scan intercept code scores back
//   select  Enter on INTERCEPT opens the song select on Black Glass, RUNNER,
//           keys (desktop) or touch (phone): "crash: intercept select"
//   open    Enter plays it: "crash: intercept open ..." and "start ... audio on"
//   hash    the chart's note count and hash equal the native pins
//           (test/test-intercept.sgl's PINNED): the same song makes the same
//           chart on both targets. Desktop plays RUNNER, the phone ELITE, so a
//           build's two runs cover two of the three tiers
//   input   in the lead-in: desktop, real key events D F J K reach lanes 0..3
//           ("crash: intercept press LANE MS" before the song's 0); phone, a
//           real TWO-FINGER touch reaches lanes 0 and 3 in one frame, then
//           single taps lanes 1 and 2
//   exit    out of the song and INTERCEPT by touch alone on the phone (the
//           pause button, SONGS, MENU), by Escape and clicks on the desktop
//   clock   ?intercept=SONG&autoplay: over 8 s of song, every clock line has
//           an audio reading and a drawn clock following it (error not "-")
//           within 50 ms, and the audio advances 1000 +- 100 ms a line
//   render  lane 0's C-COLD rule is drawn under its keycap (desktop) or along
//           its pad (phone), and a control strip beside it is not that blue
//   full    (--full) the song plays to its end on autoplay: "intercept end
//           held" with no DROP; the judgment counts are the web's frame jitter
//   console zero error-level console entries and zero exceptions
//
// Every sub-arm anchors on a "crash: intercept ..." line, which only
// INTERCEPT prints. A wait that runs out prints TIMED-OUT with everything
// collected and exits 2; SETUP-FAILED (exit 2) when the build is not there.
//
// Not covered here: a real press TIMED against a note (autoplay presses on
// the song clock itself, so it cannot see a wrong clock-at or OFFSET);
// test-intercept's table test holds OFFSET's judging, and David's play the rest.

import http from "node:http";
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--shot", "--port", "--cdp", "--song"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const SHOT = opt("--shot", null);
const PORT = parseInt(opt("--port", "8099"), 10);
const CDP = parseInt(opt("--cdp", "9239"), 10);
const SONG = opt("--song", "black-glass");
const FULL = flag("--full");   // play the song to its end on ?autoplay (about three minutes)
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const results = [];
const planned = ["menu", "select", "preview", "open", "hash", "input", "preview-stop", "exit", "clock", "render", ...(FULL ? ["full"] : []), "field", "console"];
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

const udd = fs.mkdtempSync("/tmp/crash-verify-intercept-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=844,390" : "--window-size=1000,760", "--autoplay-policy=no-user-gesture-required", "about:blank",
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
const WHOLE_RUN_MS = FULL ? 480000 : 240000;   // the full leg plays a whole song (about 175 s with its lead-in)
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
  await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 3, mobile: true });
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

// ---- INTERCEPT's helpers -------------------------------------------------------
// test/test-intercept.sgl's PINNED rows for Black Glass (notes hash), keyed tier/device
const PINNED = {
  "black-glass": { "script-kid": [219, 2172806], "runner": [483, 3062157], "elite": [852, 7809115] },   // one chart per tier since the four-lane ruling
};
const DEVICE = PHONE ? "touch" : "keys";
const OPEN_RE = /^crash: intercept open (\S+) (\S+) (keys|touch) notes (\d+) hash (\d+) lanes (\d+)$/;
const START_RE = /^crash: intercept start (\S+) lead (\d+) audio (on|off)$/;
const PRESS_RE = /^crash: intercept press (\d+) (-?\d+)$/;
const CLOCK_RE = /^crash: intercept clock (-?\d+) error (\S+) audio (\S+) wall (\S+)$/;
const END_RE = /^crash: intercept end (held|severed) score (\d+) acc (\S+) max-combo (\d+) counts (\d+) (\d+) (\d+) (\d+)$/;
// A real key: keyDown then keyUp from the DevTools Protocol (trusted events).
const KEYDEF = { s: ["KeyS", 83], d: ["KeyD", 68], f: ["KeyF", 70], j: ["KeyJ", 74], k: ["KeyK", 75], l: ["KeyL", 76],
                 a: ["KeyA", 65], ";": ["Semicolon", 186], Enter: ["Enter", 13] };
async function realKey(k) {
  const [code, vk] = KEYDEF[k];
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, text: k.length === 1 ? k : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
}
// The centre of a touch pad (lane of 4, 160 virtual px wide) in client px.
const padCenter = (lane) => client(lane * 160 + 80, 330);
function linesFrom(re, from) {
  const out = [];
  for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) out.push(m); }
  return out;
}

// ---- menu, select ------------------------------------------------------------------
{
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh` });
  const menu = await waitLine(/^crash: menu top (.+)$/, mark, 30000);
  if (!menu) { fail("menu", "no top menu line within 30 s"); timedOut("menu"); await new Promise(() => {}); }
  await sleep(800);
  if (await waitLine(/^crash: title gate /, mark, 20000)) { await key("ArrowUp"); await waitLine(/^crash: title connect$/, mark, 3000); }
  if (await waitLine(/^crash: title card tick /, mark, 20000)) { await key("ArrowUp"); await waitLine(/^crash: title card done /, mark, 3000); }
  await key("ArrowUp");
  const booted = await waitLine(/^crash: boot done /, mark, 30000);
  const settled = await waitLine(/^crash: title settled /, mark, 5000);
  let m0 = consoleLines.length;
  await key("ArrowDown"); await key("Enter");   // JACK IN is first; FREE PLAY second (no CONTINUE on a fresh origin)
  const free = await waitLine(/^crash: menu free (.+)$/, m0, 3000);
  const rows = free ? free.m[1].split(" ").filter((_, i) => i % 3 === 0).map((id) => id.split("=")[0]) : [];
  if (!booted || !settled) fail("menu", "the menu never went live (no boot done / title settled)");
  else if (!free) fail("menu", "ArrowDown, Enter did not open FREE PLAY");
  else if (rows.join(" ") !== "stack cards scan intercept code scores back") fail("menu", `FREE PLAY's rows are ${rows.join(" ")}, not stack cards scan intercept code scores back`);
  else pass("menu", `FREE PLAY ${rows.join(" ")}`);
  m0 = consoleLines.length;
  await key("ArrowDown"); await key("ArrowDown"); await key("ArrowDown"); await key("Enter");
  const sel = await waitLine(/^crash: intercept select (\S+) (\S+) (keys|touch)$/, m0, 5000);
  if (!sel) fail("select", "Enter on INTERCEPT opened no song select (no \"crash: intercept select\" line)");
  else if (sel.m[1] !== "black-glass" || sel.m[2] !== "runner" || sel.m[3] !== DEVICE) fail("select", `${sel.m[0]}: expected black-glass runner ${DEVICE} on a fresh origin`);
  else pass("select", sel.m[0]);
}
await waitForWorker();


// ---- preview (t-2844c8): the highlighted song plays; a fast scroll opens only where it stops ----
const PREVIEW_RE = /^crash: intercept preview (\S+) at (\d+)$/;
async function starvedCount() {
  const s = await evalJS("window.crashPageStats ? window.crashPageStats() : ''");
  const l = (s.split("\n").find((x) => x.startsWith("page starved-at ")) || "").slice("page starved-at ".length);
  return l === "(none)" || l === "" ? 0 : l.split(", ").length;
}
let previewMark = consoleLines.length;
{
  let detail = "";
  const first = await waitLine(PREVIEW_RE, previewMark, 10000);
  if (!first) detail = "no \"crash: intercept preview\" on the song list within 10 s";
  else if (first.m[1] !== "black-glass" || +first.m[2] <= 0) detail = `${first.m[0]}: expected black-glass from its tense section (a position past 0)`;
  else {
    await sleep(600);
    const s0 = await starvedCount();
    const m1 = consoleLines.length;
    for (let i = 0; i < 4; i++) await key("ArrowDown");   // 190 ms apart: under the 250 ms debounce
    const landed = await waitLine(PREVIEW_RE, m1, 5000);
    await sleep(1500);
    const s1 = await starvedCount();
    const opened = linesFrom(PREVIEW_RE, m1).map((m) => m[1]);
    if (!landed) detail = "no preview after scrolling four songs down";
    else if (opened.join(" ") !== "glass-current") detail = `the scroll opened ${opened.join(" ")}: only glass-current (where it stopped) should open`;
    else if (s1 - s0 !== 0) detail = `the audio sink starved ${s1 - s0} times while scrolling`;
    else pass("preview", `${first.m[0]}; four downs opened only ${landed.m[0]}; sink starvations over the scroll 0`);
    for (let i = 0; i < 4; i++) await key("ArrowUp");   // back to Black Glass for the legs that follow
    await waitLine(/^crash: intercept preview black-glass at /, m1 + 1, 5000);
  }
  if (detail) fail("preview", detail);
  previewMark = consoleLines.length;
}

// ---- open, hash, input (the menu's path, no autoplay) --------------------------------
{
  const m0 = consoleLines.length;
  // the phone plays ELITE (right on a song row steps DIFFICULTY: RUNNER to ELITE),
  // so the two runs of the arm cover two tiers' charts against the native pins
  if (PHONE) await key("ArrowRight");
  await key("Enter");
  const o = await waitLine(OPEN_RE, m0, 30000);
  const s = await waitLine(START_RE, m0, 5000);
  if (!o || !s) { fail("open", `no ${o ? "start" : "open"} line within 30 s of Enter`); timedOut("open"); await new Promise(() => {}); }
  if (o.m[1] !== "black-glass" || o.m[3] !== DEVICE || s.m[3] !== "on") fail("open", `${o.m[0]} / ${s.m[0]}`);
  else pass("open", `${o.m[0]}; ${s.m[0]}`);
  const want = PINNED["black-glass"][o.m[2]];
  if (!want) fail("hash", `no pinned value for ${o.m[2]}/${o.m[3]}`);
  else if (+o.m[4] !== want[0] || +o.m[5] !== want[1]) fail("hash", `web: notes ${o.m[4]} hash ${o.m[5]}; native pinned: notes ${want[0]} hash ${want[1]}`);
  else pass("hash", `notes ${o.m[4]} hash ${o.m[5]} = the native pin (${o.m[2]}/${o.m[3]})`);

  const pm = consoleLines.length;
  if (!PHONE) {
    for (const k of ["d", "f", "j", "k"]) { await realKey(k); await sleep(30); }
    await sleep(600);
    const ps = linesFrom(PRESS_RE, pm);
    const lanes = ps.map((m) => +m[1]);
    const early = ps.every((m) => +m[2] < 0);
    if (lanes.join(" ") !== "0 1 2 3") fail("input", `real keys D F J K reached lanes [${lanes.join(" ")}], not [0 1 2 3]`);
    else if (!early) fail("input", `the presses were not in the lead-in: ${ps.map((m) => m[0]).join("; ")}`);
    else pass("input", `real keys D F J K -> lanes 0..3 at song ms ${ps.map((m) => m[2]).join(" ")}`);
  } else {
    const a = await padCenter(0), b = await padCenter(3);
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.cx, y: a.cy, id: 1 }, { x: b.cx, y: b.cy, id: 2 }] });
    await sleep(60);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(150);
    for (const lane of [1, 2]) {
      const c = await padCenter(lane);
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.cx, y: c.cy, id: 1 }] });
      await sleep(50);
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(120);
    }
    await sleep(600);
    const ps = linesFrom(PRESS_RE, pm);
    const lanes = ps.map((m) => +m[1]);
    const two = ps.slice(0, 2);
    const together = two.length === 2 && Math.abs(+two[0][2] - +two[1][2]) <= 25;
    if (lanes.slice(0, 2).sort().join(" ") !== "0 3" || lanes.slice(2).join(" ") !== "1 2") fail("input", `real touches reached lanes [${lanes.join(" ")}], not [0 3] then [1 2]`);
    else if (!together) fail("input", `the two-finger touch's presses were ${two.map((m) => m[2]).join(" / ")} ms apart on the song clock (more than 25)`);
    else pass("input", `two-finger touch -> lanes 0 and 3 at ${two.map((m) => m[2]).join(" / ")} ms, then taps -> lanes 1, 2`);
  }
}

{
  // preview-stop: Enter stopped the preview before the song opened
  const stop = linesFrom(/^crash: intercept preview stop$/, previewMark);
  const openAt = consoleLines.findIndex((l, i) => i >= previewMark && OPEN_RE.test(l));
  const stopAt = consoleLines.findIndex((l, i) => i >= previewMark && /^crash: intercept preview stop$/.test(l));
  if (!stop.length) fail("preview-stop", "no \"crash: intercept preview stop\" when the song was entered");
  else if (openAt >= 0 && stopAt > openAt) fail("preview-stop", "the preview stopped after the song opened");
  else pass("preview-stop", "the preview stopped before the song opened");
}

// ---- exit: out of a song and out of INTERCEPT without a keyboard ----------------------
// David on the phone: "no way to get out of INTERCEPT". The song from the input
// leg is still playing. Phone: a real touch on the pause button (top left), a
// real touch on SONGS, a real touch on the song screen's MENU. Desktop: Escape,
// then clicks on SONGS and MENU. Each step anchors on a line only it prints.
{
  const m0 = consoleLines.length;
  const at = (vx, vy) => (PHONE ? touch(vx, vy, 60) : click(vx, vy));
  if (PHONE) await at(20, 12); else await key("Escape");
  const paused = await waitLine(/^crash: intercept pause (-?\d+)$/, m0, 3000);
  const m1 = consoleLines.length;
  if (paused) await at(320, 245);   // SONGS on the pause panel
  const songs = paused && await waitLine(/^crash: intercept songs$/, m1, 3000);
  const m2 = consoleLines.length;
  if (songs) await at(44, 18);      // MENU on the song screen
  const menu = songs && await waitLine(/^crash: menu (top|free) /, m2, 3000);
  if (!paused) fail("exit", `${PHONE ? "a touch on the pause button" : "Escape"} did not pause the song`);
  else if (!songs) fail("exit", "SONGS on the pause panel did not leave the song");
  else if (!menu) fail("exit", "MENU on the song screen did not reach the game's menu");
  else pass("exit", `${PHONE ? "touch" : "keys and clicks"}: paused at ${paused.m[1]} ms, SONGS, then MENU -> ${menu.m[0].slice(0, 40)}`);
}

// ---- clock, render, full (the door, on autoplay) -------------------------------------
let doorMark = 0;
{
  doorMark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh&intercept=${SONG}&autoplay` });
  const s = await waitLine(START_RE, doorMark, 60000);
  if (!s) { fail("clock", "the door's song never started (no start line within 60 s)"); timedOut("clock"); await new Promise(() => {}); }
  const t0 = Date.now();
  while (Date.now() - t0 < 25000 && linesFrom(CLOCK_RE, s.index).filter((m) => +m[1] >= 1000).length < 9) await sleep(250);
  const cl = linesFrom(CLOCK_RE, s.index).filter((m) => +m[1] >= 1000).slice(0, 9);
  const bad = [];
  if (cl.length < 9) bad.push(`only ${cl.length} clock lines in 25 s`);
  cl.forEach((m, i) => {
    if (m[3] === "-") bad.push(`no audio reading at ${m[1]}`);
    else if (m[2] === "-") bad.push(`the drawn clock is not following the audio at ${m[1]} (error "-")`);
    else if (Math.abs(+m[2]) > 50) bad.push(`drawn clock ${m[2]} ms off the audio at ${m[1]}`);
    if (i > 0 && m[3] !== "-" && cl[i - 1][3] !== "-") { const d = +m[3] - +cl[i - 1][3]; if (d < 900 || d > 1100) bad.push(`audio advanced ${d.toFixed(0)} ms between lines`); }
  });
  if (bad.length) fail("clock", bad.join("; "));
  else pass("clock", `8 s of song: errors ${cl.map((m) => m[2]).join(" ")} ms; audio ${cl[0][3]} .. ${cl[cl.length - 1][3]}`);

  // render: the lane-coloured rule of lane 0 (C-COLD #1A73D9, the left hand's
  // colour): under the keycap on a keyboard, along the pad's top on a phone.
  // No layer behind the lanes uses that blue (the review: C-BAR-C, which the
  // first version read, is also a tone of the living background, so a strip
  // with no keycaps could pass). The control: a strip of the same size in
  // the pad or under the keycaps, where the rule is not, must not read blue.
  const HIT_Y = PHONE ? 262 : 312;
  const x0 = PHONE ? 0 : (640 - (4 * 48 + 16)) / 2;
  const blueShare = async (vx, vy, vw, vh) => {
    const a = await client(vx, vy), b = await client(vx + vw, vy + vh);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: a.cx, y: a.cy, width: b.cx - a.cx, height: b.cy - a.cy, scale: 1 } });
    const buf = Buffer.from(shot.data, "base64");
    if (SHOT) fs.writeFileSync(SHOT, buf);
    const img = decodePng(buf);
    let hit = 0;
    for (let i = 0; i < img.w * img.h; i++) {
      const r = img.px[i * img.bpp], g = img.px[i * img.bpp + 1], bl = img.px[i * img.bpp + 2];
      if (bl > 120 && bl > r + 80 && g > r + 20 && bl > g) hit++;   // C-COLD, allowing the scanline pass; not C-WIRE-LIT (a lit pad), whose green beats its blue
    }
    return hit / (img.w * img.h);
  };
  const rule = PHONE ? await blueShare(x0 + 8, HIT_Y + 12, 144, 2) : await blueShare(x0 + 6, HIT_Y + 30, 36, 2);
  const control = PHONE ? await blueShare(x0 + 8, HIT_Y + 40, 144, 2) : await blueShare(x0 + 6, HIT_Y + 40, 36, 2);
  if (rule < 0.6) fail("render", `only ${(100 * rule).toFixed(1)} % of lane 0's rule reads C-COLD: the ${PHONE ? "pads" : "keycaps"} are not drawn`);
  else if (control > 0.1) fail("render", `the control strip reads ${(100 * control).toFixed(1)} % C-COLD: the colour test cannot tell the rule from its surroundings`);
  else pass("render", `lane 0's rule ${(100 * rule).toFixed(1)} % C-COLD; the control strip ${(100 * control).toFixed(1)} %`);

  if (FULL) {
    const e = await waitLine(END_RE, doorMark, 220000);
    if (!e) fail("full", "no end line within 220 s of the start");
    else if (e.m[1] !== "held" || +e.m[8] !== 0) fail("full", e.m[0]);
    else pass("full", `${e.m[0]} (SYNC CLEAN LOSSY DROP: the web's frame jitter under autoplay)`);
  }
}


// ---- field (t-15acbf): the living field's frame cost, and that the drawn clock (which the
// presses are judged on) does not drift with it: on against ?bg=off, the same song on autoplay ----
{
  const run = async (q) => {
    const m0 = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh&intercept=${SONG}&autoplay${q}` });
    const s = await waitLine(START_RE, m0, 60000);
    if (!s) return null;
    const t0 = Date.now();
    while (Date.now() - t0 < 12000 && linesFrom(CLOCK_RE, s.index).filter((m) => +m[1] >= 1000).length < 6) await sleep(250);
    const gaps = await evalJS(`new Promise((res) => { const g = []; let last = null; const t0 = performance.now();
      const f = (t) => { if (last !== null) g.push(t - last); last = t; if (t - t0 < 4000) requestAnimationFrame(f); else res(g); };
      requestAnimationFrame(f); })`);
    const errs = linesFrom(CLOCK_RE, s.index).filter((m) => +m[1] >= 1000 && m[2] !== "-").map((m) => Math.abs(+m[2]));
    const pct = (xs, p) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.floor(p * v.length))] : NaN; };
    return { p50: pct(gaps, 0.5), p95: pct(gaps, 0.95), err: pct(errs, 0.5), n: errs.length };
  };
  const on = await run("");
  const off = await run("&bg=off");
  if (!on || !off) fail("field", "the door's song did not start");
  else {
    const r = (x) => Math.round(x * 10) / 10;
    const txt = `on p50 ${r(on.p50)} p95 ${r(on.p95)} ms, clock error median ${on.err} ms; off p50 ${r(off.p50)} p95 ${r(off.p95)} ms, error ${off.err} ms`;
    console.log(`MEASURE field ${PHONE ? "phone" : "desktop"}: ${txt}`);
    if (off.p50 > 16.7) fail("field", `INCONCLUSIVE: over 16.7 ms with the field off: ${txt}`);
    else if (on.p50 > 16.7) fail("field", `the field takes the frame past 16.7 ms: ${txt}`);
    else if (on.err > off.err + 10) fail("field", `the drawn clock strays with the field on: ${txt}`);
    else pass("field", txt);
  }
}

// ---- console ---------------------------------------------------------------------------
if (consoleErrors.length) fail("console", `${consoleErrors.length} error(s): ${consoleErrors.slice(0, 5).join(" | ")}`);
else pass("console", "no errors, no exceptions");

const failed = results.filter((r) => r[1] !== "PASS").length;
console.log(`${failed ? "FAIL" : "PASS"}: ${results.length - failed}/${results.length} legs${failed ? "" : ""}`);
if (failed) dump();
shutdown(failed ? 1 : 0);
