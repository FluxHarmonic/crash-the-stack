// verify-decrypt.mjs - DECRYPT's browser arm (the match-3 table, the 2026-09-29 draft).
//
//   node verify-decrypt.mjs [build/web] [--port N] [--cdp N] [--phone] [--throttle N] [--shot PATH]
//
// INTERCEPT's harness (loopback server, headless Chrome on SwiftShader, the
// DevTools Protocol, --mute-audio and the worker-null sink, audio allowed
// without a gesture). Every swap is made by REAL input events from the
// DevTools Protocol (Input.dispatchMouseEvent / dispatchTouchEvent /
// dispatchKeyEvent), found from the page's own board line
// ("crash: decrypt board TEXT cursor N") with a move finder of the arm's own.
// --phone is a landscape phone (844x390, touch, coarse pointer). Sub-arms:
//
//   menu     a fresh origin's FREE PLAY lists DECRYPT after INTERCEPT; Enter
//            opens its screen (NEW BOARD, DAILY BOARD, BACK); NEW BOARD opens
//            ENDLESS ("crash: decrypt open endless SEED")
//   swipe    desktop: a real mouse DRAG from a glyph toward its neighbor;
//            phone: a real touch swipe. A move lands ("crash: decrypt move 1")
//   tap      tap then tap (phone: two touches; desktop: click, click)
//   keys     desktop only: arrow keys walk the cursor, Space then an arrow swaps
//   beat     every collision cue ("crash: decrypt cue NAME delay FRAMES") was
//            held to the tune (a delay >= 0, not -1) once the music plays
//   audio    at --throttle (4x) CPU, three moves (their cascades, cues and
//            falls) starve the cues' sink of no frame: the move lines'
//            "underruns" do not grow (SCAN's leg 13 for this table)
//   field    frame time with the living background on against ?bg=off, on
//            an idle board: p50 and p95 of 4 s of rAF gaps; FAIL if the field
//            takes the p50 past 16.7 ms when off stays under it
//   daily    ?decrypt=daily: 40 moves by taps, then "crash: decrypt over N"
//            and the end panel; JACK OUT by the panel's row reaches the menu
//   console  zero error-level console entries and zero exceptions
//
// --shot PATH writes the play screenshot there, and the end panel and FREE
// PLAY beside it (PATH with -panel / -menu before .png).
// A wait that runs out prints TIMED-OUT with everything collected and
// exits 2; SETUP-FAILED (exit 2) when the build is not there.

import http from "node:http";
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--shot", "--port", "--cdp", "--throttle"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const SHOT = opt("--shot", null);
const PORT = parseInt(opt("--port", "8099"), 10);
const CDP = parseInt(opt("--cdp", "9239"), 10);
const THROTTLE = parseFloat(opt("--throttle", "4"));   // the audio leg's CPU throttle (a phone proxy)
const FULL = false;
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const results = [];
const planned = PHONE ? ["menu", "swipe", "tap", "beat", "audio", "field", "daily", "console"] : ["menu", "swipe", "tap", "keys", "beat", "audio", "field", "daily", "console"];
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

const udd = fs.mkdtempSync("/tmp/crash-verify-decrypt-chrome-");
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
const WHOLE_RUN_MS = 420000;
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


// ---- DECRYPT's helpers -------------------------------------------------------------
const OPEN_RE = /^crash: decrypt open (endless|daily) (\d+)$/;
const BOARD_RE = /^crash: decrypt board (\S{64}) cursor (\d+)$/;
const MOVE_RE = /^crash: decrypt move (\d+) score (\d+) level (\d+) underruns (\d+) source (\d+)$/;
const CUE_RE = /^crash: decrypt cue (\S+) delay (-?\d+)$/;
const OVER_RE = /^crash: decrypt over (\d+)$/;
// A real key from the DevTools Protocol (a trusted event: it also counts as the gesture that resumes audio)
const KEYS = { ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40], ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39],
               Enter: ["Enter", 13], " ": ["Space", 32], Escape: ["Escape", 27], h: ["KeyH", 72], j: ["KeyJ", 74], k: ["KeyK", 75], l: ["KeyL", 76] };
async function realKey(k) {
  const [code, vk] = KEYS[k];
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, text: k.length === 1 ? k : undefined });
  await sleep(30);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
  await sleep(120);
}
// the arm's own move finder over the board line's letters (test-decrypt's)
function kindOf(c) {
  if (c >= "0" && c <= "5") return +c;
  if (c >= "a" && c <= "f") return c.charCodeAt(0) - 97;
  if (c >= "A" && c <= "F") return c.charCodeAt(0) - 65;
  return null;
}
function runThrough(cells, i) {
  const k = kindOf(cells[i]); if (k === null) return false;
  const x = i % 8, y = Math.floor(i / 8);
  const same = (xx, yy) => xx >= 0 && xx < 8 && yy >= 0 && yy < 8 && kindOf(cells[yy * 8 + xx]) === k;
  const count = (dx, dy) => { let n = 0, xx = x + dx, yy = y + dy; while (same(xx, yy)) { n++; xx += dx; yy += dy; } return n; };
  return 1 + count(-1, 0) + count(1, 0) >= 3 || 1 + count(0, -1) + count(0, 1) >= 3;
}
function swapOk(cells, i, j) {
  if (cells[i] === "*" || cells[j] === "*") return true;
  const c = cells.split(""); [c[i], c[j]] = [c[j], c[i]];
  return runThrough(c, i) || runThrough(c, j);
}
function findMove(cells) {
  for (let i = 0; i < 64; i++) {
    if (i % 8 < 7 && swapOk(cells, i, i + 1)) return [i, i + 1];
    if (i < 56 && swapOk(cells, i, i + 8)) return [i, i + 8];
  }
  return null;
}
const cellX = (i) => 144 + 44 * (i % 8) + 22;
const cellY = (i) => 36 + 44 * Math.floor(i / 8) + 22;
function lastBoard() {
  for (let i = consoleLines.length - 1; i >= 0; i--) { const m = consoleLines[i].match(BOARD_RE); if (m) return { cells: m[1], cursor: +m[2], index: i }; }
  return null;
}
let moves = 0;   // moves made on the board open now
// wait for the next move line and the board after it; null on a timeout
async function moveLanded(from, ms = 15000) {
  const mv = await waitLine(new RegExp(`^crash: decrypt move ${moves + 1} `), from, ms);
  if (!mv) return null;
  moves++;
  const b = await waitLine(BOARD_RE, mv.index, 3000);
  return { move: mv.m[0], index: mv.index, board: b && b.m[1] };
}
async function tapCell(i) { if (PHONE) await touch(cellX(i), cellY(i)); else await click(cellX(i), cellY(i)); await sleep(60); }
async function tapTap(i, j) { await tapCell(i); await tapCell(j); }
async function swipe(i, j) {
  const dx = (j % 8) - (i % 8), dy = Math.floor(j / 8) - Math.floor(i / 8);
  const a = await client(cellX(i), cellY(i));
  const steps = [8, 16, 26].map((d) => client(cellX(i) + dx * d, cellY(i) + dy * d));
  if (PHONE) {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.cx, y: a.cy, id: 1 }] });
    for (const p of steps) { const q = await p; await sleep(30); await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: q.cx, y: q.cy, id: 1 }] }); }
    await sleep(40);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await mouseAt("mouseMoved", a.cx, a.cy, "none", 0);
    await mouseAt("mousePressed", a.cx, a.cy, "left", 1);
    for (const p of steps) { const q = await p; await sleep(30); await mouseAt("mouseMoved", q.cx, q.cy, "left", 1); }
    await sleep(40);
    const q = await steps[2];
    await mouseAt("mouseReleased", q.cx, q.cy, "left", 0);
  }
}
async function shot(suffix) {
  if (!SHOT) return;
  const r = await send("Page.captureScreenshot", { format: "png" });
  const p = suffix ? SHOT.replace(/\.png$/, "") + "-" + suffix + ".png" : SHOT;
  fs.mkdirSync(path.dirname(path.resolve(p)), { recursive: true });
  fs.writeFileSync(p, Buffer.from(r.data, "base64"));
  console.log(`note: shot ${p}`);
}
async function frameGaps(ms) {
  return evalJS(`new Promise((res) => { const gaps = []; let last = null; const t0 = performance.now();
    const f = (t) => { if (last !== null) gaps.push(t - last); last = t; if (t - t0 < ${ms}) requestAnimationFrame(f); else res(gaps); };
    requestAnimationFrame(f); })`);
}
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const r1 = (x) => Math.round(x * 10) / 10;

// ---- menu: FREE PLAY's DECRYPT row, its screen, NEW BOARD --------------------------------
{
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&fresh` });
  const menu = await waitLine(/^crash: menu top (.+)$/, mark, 30000);
  if (!menu) { fail("menu", "no top menu line within 30 s"); timedOut("menu"); await new Promise(() => {}); }
  await sleep(800);
  if (await waitLine(/^crash: title gate /, mark, 20000)) { await realKey("ArrowUp"); await waitLine(/^crash: title connect$/, mark, 3000); }
  if (await waitLine(/^crash: title card tick /, mark, 20000)) { await realKey("ArrowUp"); await waitLine(/^crash: title card done /, mark, 3000); }
  await realKey("ArrowUp");
  const booted = await waitLine(/^crash: boot done /, mark, 30000);
  const settled = await waitLine(/^crash: title settled /, mark, 5000);
  let m0 = consoleLines.length;
  await realKey("ArrowDown"); await realKey("Enter");
  const free = await waitLine(/^crash: menu free (.+)$/, m0, 3000);
  const rows = free ? free.m[1].split(" ").filter((_, i) => i % 3 === 0).map((id) => id.split("=")[0]) : [];
  let detail = "";
  if (!booted || !settled) detail = "the menu never went live (no boot done / title settled)";
  else if (!free) detail = "ArrowDown, Enter did not open FREE PLAY";
  else if (rows.join(" ") !== "stack cards scan intercept decrypt code scores back") detail = `FREE PLAY's rows are ${rows.join(" ")}`;
  if (!detail) {
    for (let i = 0; i < 4; i++) await realKey("ArrowDown");
    await sleep(300); await shot("menu");
    m0 = consoleLines.length;
    await realKey("Enter");
    const scr = await waitLine(/^crash: menu free-decrypt (.+)$/, m0, 3000);
    const srows = scr ? scr.m[1].split(" ").filter((_, i) => i % 3 === 0).map((id) => id.split("=")[0]) : [];
    if (!scr) detail = "Enter on DECRYPT did not open its screen";
    else if (srows.join(" ") !== "new-board daily-board back") detail = `DECRYPT's rows are ${srows.join(" ")}`;
    else {
      m0 = consoleLines.length;
      await realKey("Enter");
      const open = await waitLine(OPEN_RE, m0, 10000);
      const b = open && await waitLine(BOARD_RE, open.index, 3000);
      if (!open || open.m[1] !== "endless") detail = "NEW BOARD did not open ENDLESS";
      else if (!b) detail = "no board line after the open";
      else pass("menu", `FREE PLAY ${rows.join(" ")}; DECRYPT ${srows.join(" ")}; ${open.m[0]}`);
    }
  }
  if (detail) { fail("menu", detail); timedOut("menu"); await new Promise(() => {}); }
}

// ---- swipe, tap, keys: each control makes a move on the live board ------------------------
async function controlLeg(name, doIt) {
  const b = lastBoard();
  const mv = b && findMove(b.cells);
  if (!mv) { fail(name, "no legal move on the board line (the arm's finder)"); return; }
  const from = consoleLines.length;
  await doIt(mv[0], mv[1], b);
  const landed = await moveLanded(from);
  if (!landed) fail(name, `no "crash: decrypt move ${moves + 1}" within 15 s after the ${name} on ${mv[0]}<->${mv[1]}`);
  else pass(name, `${mv[0]}<->${mv[1]}: ${landed.move}`);
}
await sleep(500);
await controlLeg("swipe", (i, j) => swipe(i, j));
await sleep(300);
await controlLeg("tap", (i, j) => tapTap(i, j));
if (!PHONE) {
  await sleep(300);
  await controlLeg("keys", async (i, j, b) => {
    // walk the cursor from where the board line says it is to i: h / l across, arrows down / up
    let c = b.cursor;
    while (c % 8 !== i % 8) { await realKey(c % 8 < i % 8 ? "l" : "h"); c += c % 8 < i % 8 ? 1 : -1; }
    while (Math.floor(c / 8) !== Math.floor(i / 8)) { await realKey(c < i ? "ArrowDown" : "ArrowUp"); c += c < i ? 8 : -8; }
    await realKey(" ");
    await realKey(j === i + 1 ? "ArrowRight" : j === i - 1 ? "ArrowLeft" : j === i + 8 ? "j" : "k");
  });
}

// ---- audio: three moves at a throttled CPU starve the cues' sink of nothing ---------------
{
  let detail = "";
  const music = await waitLine(/^crash: music (open|playing) /, 0, 20000);
  const resumed = await waitLine(/^crash: audio resumed$/, 0, 1000);
  const before = [...consoleLines].reverse().map((l) => l.match(MOVE_RE)).find((m) => m);
  if (!music) detail = "no \"crash: music open\": the music is not playing, so neither the beat nor an underrun could be seen";
  else if (!before) detail = "no move line to count underruns from";
  else {
    await send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    let after = null, why = "";
    for (let k = 0; k < 3 && !why; k++) {
      const b = lastBoard(); const mv = b && findMove(b.cells);
      if (!mv) { why = "no legal move"; break; }
      const from = consoleLines.length;
      await tapTap(mv[0], mv[1]);
      const landed = await moveLanded(from, 30000);
      if (!landed) why = `move ${moves + 1} did not land within 30 s at ${THROTTLE}x`;
      else after = consoleLines[landed.index].match(MOVE_RE);
      await sleep(200);
    }
    await send("Emulation.setCPUThrottlingRate", { rate: 1 });
    if (why) detail = why;
    else {
      const du = +after[4] - +before[4], ds = +after[5] - +before[5];
      if (du !== 0) detail = `the moves starved the cues' sink: underruns ${before[4]} -> ${after[4]} over 3 moves at ${THROTTLE}x (source ${before[5]} -> ${after[5]})`;
      else pass("audio", `${THROTTLE}x, 3 moves (${after[0]}): cue sink starved 0 frames; music sink ${ds}; context ${resumed ? "resumed" : "running without a gesture"}`);
    }
  }
  if (detail) fail("audio", detail);
}

// ---- beat: every collision cue once the tune plays was held to its 16th -------------------
{
  const playing = await waitLine(/^crash: music playing /, 0, 1000);
  const from = playing ? playing.index : 0;
  const cues = linesFrom(CUE_RE, from);
  const unheld = cues.filter((m) => +m[2] < 0);
  if (!playing) fail("beat", "no \"crash: music playing\" line: no tune reached the ear, so there was no beat to hold to");
  else if (cues.length < 3) fail("beat", `only ${cues.length} collision cues after the music played`);
  else if (unheld.length) fail("beat", `${unheld.length} of ${cues.length} cues played with no tune clock (delay -1): ${unheld.slice(0, 3).map((m) => m[0]).join("; ")}`);
  else pass("beat", `${cues.length} cues held to the tune: delays ${cues.slice(0, 8).map((m) => m[2]).join(" ")} frames`);
}
function linesFrom(re, from) {
  const out = [];
  for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) out.push(m); }
  return out;
}

// ---- field: the living background's frame cost on an idle board -------------------------------
{
  const measure = async (q) => {
    const m0 = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&decrypt=endless${q}` });
    const open = await waitLine(OPEN_RE, m0, 30000);
    if (!open) return null;
    await sleep(2500);
    const g = await frameGaps(4000);
    return { p50: pct(g, 0.5), p95: pct(g, 0.95), n: g.length };
  };
  const on = await measure("");
  const off = await measure("&bg=off");
  if (!on || !off) fail("field", "?decrypt=endless did not open");
  else {
    const txt = `field on p50 ${r1(on.p50)} p95 ${r1(on.p95)} ms (${on.n} frames); off p50 ${r1(off.p50)} p95 ${r1(off.p95)} ms`;
    console.log(`MEASURE field ${PHONE ? "phone" : "desktop"}: ${txt}`);
    if (on.p50 > 16.7 && off.p50 <= 16.7) fail("field", `the field takes the frame past 16.7 ms: ${txt}`);
    else pass("field", txt);
  }
}

// ---- daily: 40 moves, the end panel, JACK OUT -------------------------------------------------
{
  let detail = "";
  const m0 = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&decrypt=daily` });
  const open = await waitLine(OPEN_RE, m0, 30000);
  if (!open || open.m[1] !== "daily") detail = "?decrypt=daily did not open the DAILY";
  else {
    await waitLine(BOARD_RE, open.index, 3000);
    moves = 0;
    for (let k = 0; k < 40 && !detail; k++) {
      const b = lastBoard(); const mv = b && findMove(b.cells);
      if (!mv) { detail = `no legal move at move ${k + 1}`; break; }
      const from = consoleLines.length;
      await tapTap(mv[0], mv[1]);
      if (k === 20) { await sleep(350); await shot(""); }   // mid-cascade, for David
      const landed = await moveLanded(from, 20000);
      if (!landed) detail = `move ${k + 1} did not land within 20 s`;
    }
    if (!detail) {
      const over = await waitLine(OVER_RE, m0, 5000);
      if (!over) detail = "no \"crash: decrypt over\" after 40 moves";
      else {
        await sleep(600); await shot("panel");
        const mq = consoleLines.length;
        await realKey("ArrowDown"); await realKey("ArrowDown"); await realKey("Enter");   // RETRY DAILY, ENDLESS, JACK OUT
        const top = await waitLine(/^crash: menu top /, mq, 5000);
        if (!top) detail = `${over.m[0]}, but JACK OUT did not reach the menu`;
        else pass("daily", `40 moves; ${over.m[0]}; JACK OUT -> menu`);
      }
    }
  }
  if (detail) fail("daily", detail);
}

// ---- console ---------------------------------------------------------------------------------
if (consoleErrors.length) fail("console", `${consoleErrors.length} error entries: ${consoleErrors.slice(0, 5).join(" | ")}`);
else pass("console", "no error-level entries, no exceptions");

const failed = results.filter((r) => r[1] !== "PASS");
console.log(failed.length ? `verify-decrypt: ${failed.length} FAILED (${failed.map((r) => r[0]).join(" ")})` : `verify-decrypt: ALL PASS (${results.length})`);
if (failed.length) dump();
shutdown(failed.length ? 1 : 0);
