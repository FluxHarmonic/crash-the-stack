// verify-field.mjs - the browser arm for the GPU field, the copper raster
// and the phosphor persistence (P3c, rulings D35 and D36).
//
//   node verify-field.mjs [build/web] [--phone] [--port N] [--cdp N]
//                         [--steps N] [--expect-steps N] [--shot DIR]
//
// The same plumbing as verify.mjs (loopback server, headless chrome on
// SwiftShader, CDP over Node's WebSocket), a page at dpr 2 (desktop) or 3
// (--phone). Each sub-arm prints PASS / FAIL <name>: <detail>; any FAIL
// exits 1; a wait that runs out prints TIMED-OUT and exits 2.
//
//   field-life      the page with ?bg=life&bghold=N&bgonly is read at every
//                   half-cell center of the board area (80x44 samples) once
//                   the game says "crash: bg held N"; then the same page
//                   with ?bg=life-cpu, the CPU field, the oracle. Every
//                   sample must be one of the ramp's eight palette colors,
//                   the field must be alive (at least four tones, no tone
//                   over 90 % of the samples) and the two maps must be
//                   IDENTICAL (the life rule is integer arithmetic on both
//                   sides: nothing may differ)
//   field-reaction  the same with ?bg=reaction: the reaction's arithmetic is
//                   float32 on the GPU and double on the CPU between 16-bit
//                   quantizations, so the maps are compared as dither levels
//                   (base tone x 4 + quarter, 32 per ring): at least 97 % of
//                   the cells at the same level and every cell within one
//                   (a wrong neighbor, wrap, orientation, feed rate or
//                   laplacian weight moves most cells by whole levels within
//                   the held steps; the plants in the evidence note show it)
//   copper          ?bg=off&copper=bitmap (the painted bars, the reference)
//                   and ?bg=off (the raster) read down one column of the
//                   board area at every scanline: identical; then
//                   ?bg=off&raster=30: the rows above the middle show the
//                   reference pattern rolled 30 scanlines down, the rows
//                   below rolled 30 up (the split), the same three colors
//   phosphor        ?bg=off&phosphor=probe: the game draws a block in
//                   C-SELECTED on even frames and C-HIGHLIGHT on odd with
//                   persistence on; six reads of the block's center must all
//                   be one of the two steady-state mixes of the two (within
//                   4 per channel) and never a pure one: the previous frame
//                   lingers under the new at PHOSPHOR = 0.12
//   atlas           the stack and the card table at seed 3 with the field off, drawn from the
//                   glyph atlas (the default) and again with ?atlas=off
//                   ((crash font)'s rectangles, the oracle): every row of the
//                   canvas hashes identically, the frames are pixel-identical
//                   (a wrong cell, a flipped bake, an off-by-one region or a
//                   scale rounding shows as differing rows, the HUD band with its
//                   time-moving readouts left out, and the count of
//                   lit rows floors it against a blank frame)
//   gl-log          no sokol refusal reached the console (a "sokol[level=0|1]"
//                   line: a failed pass or resource prints at log level with
//                   no message on the web build)
//   console         zero error-level console entries and zero exceptions
//
// --expect-steps N is the assertion-layer control: the CPU page is held at
// N instead of --steps, so the two maps come from different step counts and
// field-life must go red (and field-reaction, on a lively field).
//
// --shot DIR writes the GPU and CPU field captures (PNG) into DIR.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp", "--steps", "--expect-steps", "--shot"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const PORT = parseInt(opt("--port", "8099"), 10);
const CDP = parseInt(opt("--cdp", "9239"), 10);
const STEPS = parseInt(opt("--steps", "12"), 10);
const EXPECT_STEPS = parseInt(opt("--expect-steps", String(STEPS)), 10);
const SHOT = opt("--shot", null);
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const CELL = 16, GRID_W = 40, GRID_H = 22, RAMP = 8;
const HALF = CELL / 2, COLS = 2 * GRID_W, ROWS = 2 * GRID_H;
const BOARD_H = CELL * GRID_H; // 352: the board area above the HUD
// The ramp, (crash gpu bg)'s RAMP-COLORS as the swap chain rounds them
// (palette.sgl's (r g b) x 255, nearest): C-BG C-BAR-A C-BAR-C C-ARCHIVE
// C-MOSS C-WIRE-DARK C-STATIC-B C-BAR-B. Matched within TONE_TOL per
// channel (the two float paths may round a .5 apart).
const TONES = [[13, 10, 26], [23, 18, 46], [46, 28, 77], [92, 77, 140], [74, 90, 43], [31, 58, 77], [42, 45, 58], [33, 23, 61]];
const TONE_TOL = 2;
const C_SELECTED = [77, 242, 217], C_HIGHLIGHT = [255, 89, 217];
const PHOSPHOR = 0.12;
const REACTION_SAME_MIN = 0.97;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const results = [];
const planned = ["field-life", "field-reaction", "copper", "phosphor", "atlas", "gl-log", "console"];
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

// ---- no leaked chrome (verify.mjs's rule) ----------------------------------------
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

const udd = fs.mkdtempSync("/tmp/crash-verify-field-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore", detached: true, env: { ...process.env, PULSE_SINK: "worker-null", PIPEWIRE_NODE: "worker-null" } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
process.on("exit", () => { killChromeGroup("SIGKILL"); try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* scratch */ } });
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("SIGHUP", () => shutdown(129));
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
const WHOLE_RUN_MS = 240000;
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
function timedOut(name) {
  console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`);
  dump(); shutdown(2);
}

// ---- reading the canvas ----------------------------------------------------------
// Inside an animation frame (the game's tick registered its frame first,
// so this runs after the draw and before the buffer is discarded): the
// RGB at a list of virtual points, each mapped through the letterbox the
// game applies (scale = min(w/640, h/400), centered) to the device pixel
// holding that virtual point.
async function samplePoints(points) {
  return evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
    const g = off.getContext("2d"); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    // sigil-graphics' letterbox exactly: an integer viewport floor(VW *
    // scale) x floor(VH * scale) centered by integer division, the virtual
    // axes projected onto it (a float model was half a device pixel off
    // at dpr 3 and read a scanline's neighbor)
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const vpw = Math.floor(${VW} * scale), vph = Math.floor(${VH} * scale);
    const ox = Math.floor((c.width - vpw) / 2), oy = Math.floor((c.height - vph) / 2);
    const sx = vpw / ${VW}, sy = vph / ${VH};
    const out = [];
    for (const [vx, vy] of ${JSON.stringify(points)}) {
      const x = Math.floor(ox + vx * sx), y = Math.floor(oy + vy * sy);
      const i = (y * c.width + x) * 4; out.push([d[i], d[i + 1], d[i + 2]]);
    }
    resolve({ w: c.width, h: c.height, scale, samples: out });
  }))`);
}
const halfCellCenters = () => {
  const pts = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) pts.push([c * HALF + HALF / 2, r * HALF + HALF / 2]);
  return pts;
};
async function shot(name) {
  if (!SHOT) return;
  fs.mkdirSync(SHOT, { recursive: true });
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(SHOT, name), Buffer.from(s.data, "base64"));
}
const near = (a, b, tol) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
const toneOf = (rgb) => { for (let t = 0; t < RAMP; t++) if (near(rgb, TONES[t], TONE_TOL)) return t; return -1; };
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

// The field of one page: navigate, wait for the held line, read the map.
// Returns { tones (COLS*ROWS), bad (samples outside the ramp), counts } or
// a string naming what went wrong.
// The service worker's activation races the first page's fetches (P3's
// finding: a fetch pending while the worker activates over the boot's
// first frames fails; the game retries a second later and lands). This
// arm navigates a dozen pages, so the first one waits for the worker to
// control the page before the rest run, and a loader-side
// "image fetch failed" console.error whose fetch the game then landed
// (no "crash: texture missing" line) is a note, not a failure: it is
// the loader's line, and the game's contract (one retry, never a
// console error of its own) held. The reviewer saw the console sub-arm
// red on that race in 2 of 3 clean runs at b9c8bf2.
let swWaited = false;
async function waitForWorker() {
  if (swWaited) return; swWaited = true;
  const ok = await evalJS(`(async () => { if (!navigator.serviceWorker) return "none"; const t0 = Date.now(); while (Date.now() - t0 < 15000) { const r = await navigator.serviceWorker.getRegistration(); if (r && r.active && navigator.serviceWorker.controller) return "controlling"; await new Promise((res) => setTimeout(res, 100)); } return "timeout"; })()`);
  console.log(`note: service worker ${ok}`);
}
let mark = 0;
async function readField(rule, steps) {
  mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&bg=${rule}&bghold=${steps}&bgonly` });
  const said = await waitLine(/^crash: bg (gpu|cpu) (\w+)$/, mark, 20000);
  await waitForWorker();
  if (!said) return `no "crash: bg gpu|cpu" boot line within 20 s`;
  const held = await waitLine(/^crash: bg held (\d+)$/, mark, 30000);
  if (!held) return `no "crash: bg held ${steps}" line within 30 s (the field never reached the hold)`;
  if (held.m[1] !== String(steps)) return `held at ${held.m[1]}, asked for ${steps}`;
  await sleep(300); // a few frames past the line: the held field is what every frame shows
  const read = await samplePoints(halfCellCenters());
  const tones = read.samples.map(toneOf);
  const bad = [];
  tones.forEach((t, i) => { if (t < 0 && bad.length < 5) bad.push(`(${i % COLS},${Math.floor(i / COLS)})=${hex(read.samples[i])}`); });
  const counts = new Array(RAMP).fill(0);
  tones.forEach((t) => { if (t >= 0) counts[t]++; });
  return { path: said.m[1], tones, bad, badN: tones.filter((t) => t < 0).length, counts, buffer: `${read.w}x${read.h}` };
}

// The dither level of each cell from its four half cells: base x 4 +
// quarter, or -1 when the four do not form one of the four patterns
// ((crash bg)'s dither: bottom-left is always the base).
function levels(tones) {
  const out = [];
  for (let cy = 0; cy < GRID_H; cy++) for (let cx = 0; cx < GRID_W; cx++) {
    const at = (dx, dy) => tones[(2 * cy + dy) * COLS + 2 * cx + dx];
    const tl = at(0, 0), tr = at(1, 0), bl = at(0, 1), br = at(1, 1);
    const up = (bl + 1) % RAMP;
    let q = -1;
    if (tl === bl && tr === bl && br === bl) q = 0;
    else if (tl === up && tr === bl && br === bl) q = 1;
    else if (tl === up && tr === bl && br === up) q = 2;
    else if (tl === up && tr === up && br === up) q = 3;
    out.push(q < 0 || bl < 0 ? -1 : bl * 4 + q);
  }
  return out;
}
const alive = (counts) => {
  const total = counts.reduce((a, b) => a + b, 0);
  const present = counts.filter((n) => n > 0).length;
  const top = Math.max(...counts) / total;
  return { present, top, ok: present >= 4 && top <= 0.9 };
};

// ---- field-life ---------------------------------------------------------------------
for (const rule of ["life", "reaction"]) {
  const name = `field-${rule}`;
  const gpu = await readField(rule, STEPS);
  if (typeof gpu === "string") { fail(name, `gpu page: ${gpu}`); if (/within/.test(gpu)) timedOut(name); continue; }
  await shot(`field-${rule}-gpu${PHONE ? "-phone" : ""}.png`);
  const cpu = await readField(`${rule}-cpu`, EXPECT_STEPS);
  if (typeof cpu === "string") { fail(name, `cpu page: ${cpu}`); if (/within/.test(cpu)) timedOut(name); continue; }
  await shot(`field-${rule}-cpu${PHONE ? "-phone" : ""}.png`);
  const detail = [];
  if (gpu.path !== "gpu") detail.push(`the ?bg=${rule} page took the ${gpu.path} path`);
  if (cpu.path !== "cpu") detail.push(`the ?bg=${rule}-cpu page took the ${cpu.path} path`);
  if (gpu.badN) detail.push(`${gpu.badN} GPU samples outside the ramp: ${gpu.bad.join(" ")}`);
  if (cpu.badN) detail.push(`${cpu.badN} CPU samples outside the ramp: ${cpu.bad.join(" ")}`);
  const life = alive(gpu.counts), lifeCpu = alive(cpu.counts);
  if (!life.ok) detail.push(`the GPU field is not alive: ${life.present} tones, the top one at ${life.top.toFixed(2)}`);
  if (!lifeCpu.ok) detail.push(`the CPU field is not alive: ${lifeCpu.present} tones, the top one at ${lifeCpu.top.toFixed(2)}`);
  let same = 0; const diffs = [];
  gpu.tones.forEach((t, i) => { if (t === cpu.tones[i]) same++; else if (diffs.length < 6) diffs.push(`(${i % COLS},${Math.floor(i / COLS)}) gpu ${t} cpu ${cpu.tones[i]}`); });
  const total = gpu.tones.length;
  if (rule === "life") {
    if (same !== total) detail.push(`${total - same} of ${total} half cells differ between the GPU and CPU fields at step ${STEPS}: ${diffs.join("; ")}`);
  } else {
    const lg = levels(gpu.tones), lc = levels(cpu.tones);
    let equal = 0, within = 0, torn = 0; const far = [];
    lg.forEach((a, i) => {
      const b = lc[i];
      if (a < 0 || b < 0) { torn++; return; }
      const d = Math.min((a - b + 32) % 32, (b - a + 32) % 32);
      if (d === 0) equal++;
      if (d <= 1) within++; else if (far.length < 6) far.push(`(${i % GRID_W},${Math.floor(i / GRID_W)}) gpu ${a} cpu ${b}`);
    });
    const cells = lg.length;
    if (torn) detail.push(`${torn} cells whose four half cells form no dither pattern`);
    if (equal < REACTION_SAME_MIN * cells) detail.push(`only ${equal} of ${cells} cells at the same dither level (need ${Math.ceil(REACTION_SAME_MIN * cells)})`);
    if (within < cells - torn) detail.push(`${cells - torn - within} cells more than one level apart: ${far.join("; ")}`);
    if (!detail.length) detail.push(`ok: ${equal}/${cells} cells at the same level, all within one`);
  }
  if (detail.length && !(rule === "reaction" && detail.length === 1 && detail[0].startsWith("ok:"))) fail(name, detail.join("; "));
  else pass(name, `${same}/${total} half cells identical at step ${STEPS} (${gpu.path} vs ${cpu.path}, buffer ${gpu.buffer}); GPU field ${life.present} tones, top ${life.top.toFixed(2)}${rule === "reaction" ? "; " + detail[0] : ""}`);
}

// ---- copper -----------------------------------------------------------------------------
{
  const column = [];
  for (let y = 0; y < BOARD_H; y++) column.push([4.5, y + 0.5]);
  async function readColumn(query) {
    mark = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&bg=off&bgonly&${query}` });
    const boot = await waitLine(/^crash: seed \d+ tiles \d+ pair /, mark, 20000);
    if (!boot) return null;
    await sleep(600);
    return (await samplePoints(column)).samples;
  }
  const ref = await readColumn("copper=bitmap");
  const raster = ref && await readColumn("copper=roll");
  const split = raster && await readColumn("raster=30");
  const sweep = split && await readColumn("raster=40");
  if (!ref || !raster || !split || !sweep) { fail("copper", "a page did not boot within 20 s"); timedOut("copper"); }
  else {
    const detail = [];
    let differ = 0; const where = [];
    ref.forEach((c, y) => { if (!near(c, raster[y], 1)) { differ++; if (where.length < 6) where.push(`y=${y} bitmap ${hex(c)} raster ${hex(raster[y])}`); } });
    if (differ) detail.push(`${differ} of ${BOARD_H} scanlines differ between the painted bars and the raster at rest: ${where.join("; ")}`);
    // the pattern's period from the reference: 36 scanlines
    let periodic = true;
    for (let y = 36; y < BOARD_H; y++) if (!near(ref[y], ref[y - 36], 1)) { periodic = false; break; }
    if (!periodic) detail.push("the painted bars are not periodic over 36 scanlines: the reference is wrong");
    const colors = new Set(ref.map(hex));
    if (colors.size !== 4) detail.push(`the reference column shows ${colors.size} colors, expected 4 (three bar colors and the ground)`);
    // the split: above the middle rolled 30 down (row y shows ref[y - 30]),
    // below rolled 30 up (ref[y + 30])
    const mid = BOARD_H / 2;
    let bad = 0; const badWhere = [];
    for (let y = 0; y < BOARD_H; y++) {
      const src = y < mid ? ((y - 30) % 36 + 36) % 36 : (y + 30) % 36;
      if (!near(split[y], ref[src], 1)) { bad++; if (badWhere.length < 6) badWhere.push(`y=${y} got ${hex(split[y])} want ${hex(ref[src])}`); }
    }
    if (bad) detail.push(`${bad} scanlines of the split roll do not match the reference rolled +30 above / -30 below: ${badWhere.join("; ")}`);
    // the sweep: at roll 40 the phase is floor(40 / 36) mod 3 = 1, so the
    // bar colors rotate one place (A -> B -> C -> A: the reference's rows
    // 0, 12, 24 are A, B, C) on top of the split roll
    const A = hex(ref[0]), B = hex(ref[12]), C = hex(ref[24]);
    const rotate = (c) => { const h = hex(c); return h === A ? ref[12] : h === B ? ref[24] : h === C ? ref[0] : c; };
    let badSweep = 0; const sweepWhere = [];
    for (let y = 0; y < BOARD_H; y++) {
      const src = y < mid ? ((y - 40) % 36 + 36) % 36 : (y + 40) % 36;
      const want = rotate(ref[src]);
      if (!near(sweep[y], want, 1)) { badSweep++; if (sweepWhere.length < 6) sweepWhere.push(`y=${y} got ${hex(sweep[y])} want ${hex(want)}`); }
    }
    if (new Set([A, B, C]).size !== 3) detail.push(`the reference's rows 0, 12, 24 are not three bar colors: ${A} ${B} ${C}`);
    if (badSweep) detail.push(`${badSweep} scanlines of the sweep (roll 40, phase 1) do not match the reference rolled and rotated: ${sweepWhere.join("; ")}`);
    if (detail.length) fail("copper", detail.join("; "));
    else pass("copper", `raster == painted bars on ${BOARD_H} scanlines (${colors.size} colors, period 36); split roll at 30: above +30, below -30; sweep at 40: the colors rotated one place`);
  }
}

// ---- phosphor -----------------------------------------------------------------------------
{
  mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack&fresh&bg=off&phosphor=probe` });
  const boot = await waitLine(/^crash: seed \d+ tiles \d+ pair /, mark, 20000);
  if (!boot) { fail("phosphor", "the page did not boot within 20 s"); timedOut("phosphor"); }
  else {
    await sleep(800);
    await shot(`phosphor-probe${PHONE ? "-phone" : ""}.png`);
    // the probe block: (crash render)'s PROBE rect, its center
    const center = [[200 + 120, 120 + 50]];
    // the steady state of two colors alternating under persistence p:
    // F_a = (1-p) A + p F_b, F_b = (1-p) B + p F_a
    const p = PHOSPHOR, q = 1 - p;
    const mixA = C_SELECTED.map((a, i) => (q * a + p * q * C_HIGHLIGHT[i]) / (1 - p * p));
    const mixB = C_HIGHLIGHT.map((b, i) => (q * b + p * q * C_SELECTED[i]) / (1 - p * p));
    const reads = [];
    for (let i = 0; i < 6; i++) { reads.push((await samplePoints(center)).samples[0]); await sleep(70); }
    const pure = reads.filter((c) => near(c, C_SELECTED, 2) || near(c, C_HIGHLIGHT, 2));
    const off = reads.filter((c) => !(near(c, mixA, 4) || near(c, mixB, 4)));
    const seen = new Set(reads.map(hex));
    if (pure.length) fail("phosphor", `${pure.length} of 6 reads are a pure probe color (no persistence): ${reads.map(hex).join(" ")}`);
    else if (off.length) fail("phosphor", `${off.length} of 6 reads are not a steady-state mix at PHOSPHOR ${p} (want ${hex(mixA.map(Math.round))} or ${hex(mixB.map(Math.round))} within 4): ${reads.map(hex).join(" ")}`);
    else {
      // the play path: the DEFRAG cascade on demand must say the phosphor
      // engaged (the probe above forces the phosphor's own branch; this
      // is the branch play takes)
      mark = consoleLines.length;
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&cards&fresh&bg=off&demo=cleared` });
      const won = await waitLine(/^crash: cards won moves /, mark, 25000);
      const engaged = won && await waitLine(/^crash: phosphor cascade$/, mark, 5000);
      if (!won) fail("phosphor", `probe ok (${[...seen].join(" ")}), but the demo deal was not won within 25 s (no "crash: cards won")`);
      else if (!engaged) fail("phosphor", `probe ok, the deal was won, but the cascade never engaged the phosphor (no "crash: phosphor cascade" line)`);
      else pass("phosphor", `6 reads all a mix of the two probe colors at ${p} (${[...seen].join(" ")}), never pure; the DEFRAG cascade engaged the phosphor's play path`);
    }
  }
}

// ---- atlas -----------------------------------------------------------------------------
{
  // FNV-1a per canvas row over the RGB bytes, plus how many rows hold
  // anything but the letterbox black. Rows and columns whose device
  // pixel center sits within TIE of a virtual pixel edge are left out:
  // there the rasterizer's coverage rule (the rect path) and nearest
  // sampling with float32 texture coordinates (the atlas) may pick
  // either side, one device row apart. Measured 2026-09-19: at dpr 2
  // (scale 3.125, a binary fraction) every differing pixel of 1332 lay
  // exactly on such an edge (y = 4 mod 8); at dpr 3 (487/400, not
  // representable) rows within 0.03 of an edge flipped too. A wrong
  // cell, a flipped bake or an off-by-one region differs on the rows
  // that remain, which are nine in ten.
  const rowHashes = () => evalJS(`new Promise((resolve) => requestAnimationFrame(() => {
    const c = document.getElementById("stage");
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height;
    const g = off.getContext("2d"); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const vpw = Math.floor(${VW} * scale), vph = Math.floor(${VH} * scale);
    const ox = Math.floor((c.width - vpw) / 2), oy = Math.floor((c.height - vph) / 2);
    const sx = vpw / ${VW}, sy = vph / ${VH};
    const TIE = 0.05;
    const tie = (v) => Math.abs(v - Math.round(v)) < TIE;
    const tieCol = []; let tieCols = 0; for (let x = 0; x < c.width; x++) { tieCol[x] = tie((x + 0.5 - ox) / sx); if (tieCol[x]) tieCols++; }
    const rows = []; let lit = 0, tieRows = 0;
    for (let y = 0; y < c.height; y++) { let h = 2166136261, any = false;
      // the HUD band (virtual y >= 352) is left out too: its readouts move with
      // time (the trace meter), and two page loads land on different values
      // under load (measured 2026-09-19: 40 rows at the cards meter); the HUD
      // text draws through the same atlas path as the labels above it
      if ((y + 0.5 - oy) / sy >= ${BOARD_H}) { rows.push(-1); tieRows++; continue; }
      if (tie((y + 0.5 - oy) / sy)) { rows.push(-1); tieRows++; continue; }
      for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (d[i] + d[i + 1] + d[i + 2] > 0) any = true; if (tieCol[x]) continue; h = Math.imul(h ^ d[i], 16777619); h = Math.imul(h ^ d[i + 1], 16777619); h = Math.imul(h ^ d[i + 2], 16777619); }
      rows.push(h >>> 0); if (any) lit++; }
    resolve({ rows, lit, tieRows, tieCols, w: c.width, h: c.height });
  }))`);
  async function readTable(table, query) {
    mark = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&${table}&fresh&seed=3&bg=off${query}` });
    const boot = await waitLine(table === "stack" ? /^crash: seed 3 tiles 144 pair / : /^crash: cards seed 3 moves 0 /, mark, 20000);
    if (!boot) return null;
    const said = await waitLine(/^crash: atlas (on|off)$/, mark, 5000);
    if (!said || said.m[1] !== (query ? "off" : "on")) return null;
    await sleep(1200);
    return rowHashes();
  }
  const verdicts = [];
  for (const table of ["stack", "cards"]) {
  const on = await readTable(table, "");
  const off = on && await readTable(table, "&atlas=off");
  if (!on || !off) { fail("atlas", `the ${table} page did not boot within 20 s, or did not say "crash: atlas on|off" as asked`); timedOut("atlas"); }
  else {
    const differing = []; on.rows.forEach((h, y) => { if (h >= 0 && h !== off.rows[y]) differing.push(y); });
    if (on.h - on.tieRows < on.h * 0.5) verdicts.push(`FAIL ${table}: only ${on.h - on.tieRows} of ${on.h} rows compared`);
    else if (on.lit < on.h * 0.5) verdicts.push(`FAIL ${table}: only ${on.lit} of ${on.h} rows lit on the atlas frame`);
    else if (differing.length) verdicts.push(`FAIL ${table}: ${differing.length} of ${on.h} canvas rows differ between the atlas and the rect path at seed 3: rows ${differing.slice(0, 8).join(" ")}${differing.length > 8 ? " ..." : ""}`);
    else verdicts.push(`${table}: atlas == rectangles on ${on.h - on.tieRows} of ${on.h} rows (${on.lit} lit; ${on.tieRows} rows left out as ties or the HUD band, ${on.tieCols} tie columns) of ${on.w}x${on.h}`);
  }
  }
  if (verdicts.some((v) => v.startsWith("FAIL"))) fail("atlas", verdicts.join("; "));
  else pass("atlas", verdicts.join("; "));
}

// ---- gl-log, console -------------------------------------------------------------------------
{
  const sokol = consoleLines.filter((l) => /^sokol\[level=[01]\]/.test(l));
  if (sokol.length) fail("gl-log", `${sokol.length} sokol refusal line(s): ${sokol.slice(0, 3).join(" | ")}`);
  else pass("gl-log", `${consoleLines.length} console lines, no sokol[level=0|1] line`);
}
// A Scheme error the loader prints at log level ("Error: unbound variable",
// "Scheme error in frame") is an error too: measured 2026-09-19, an
// unbound variable inside a render pass blacked the frame and reached
// the console as plain text.
for (const l of consoleLines) if (/^(Error: |Scheme error)/.test(l)) consoleErrors.push("log-level: " + l);
{
  const raced = consoleErrors.filter((e) => /image fetch failed/.test(e));
  const missing = consoleLines.filter((l) => /^crash: texture missing/.test(l));
  if (raced.length && !missing.length) {
    console.log(`note: ${raced.length} loader "image fetch failed" line(s) on the service-worker race; the game's retry landed (no "crash: texture missing")`);
    for (const e of raced) consoleErrors.splice(consoleErrors.indexOf(e), 1);
  }
}
// A texture fetch cut by the arm's next navigation (the boot's texture steps
// start their fetches at once on a table boot, P3d/D40, and this arm boots a
// dozen pages) is logged by the gles3 bridge as "image fetch failed:
// TypeError: Failed to fetch"; counted and shown, not failed (verify.mjs
// classifies the same line).
const ABORTED = /image fetch failed: TypeError: Failed to fetch|Failed to load resource: net::ERR_FAILED/;
const abortedFetches = consoleErrors.filter((l) => ABORTED.test(l));
const realErrors = consoleErrors.filter((l) => !ABORTED.test(l));
if (realErrors.length) { fail("console", `${realErrors.length} error(s): ${JSON.stringify(realErrors.slice(0, 5))}`); dump(); }
else pass("console", `${consoleLines.length} console lines, 0 errors${abortedFetches.length ? `, ${abortedFetches.length} image fetch(es) cut by a navigation` : ""}`);

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`${results.length - failed} passed, ${failed} failed of ${results.length}${PHONE ? " (phone)" : " (desktop)"}`);
shutdown(failed ? 1 : 0);
