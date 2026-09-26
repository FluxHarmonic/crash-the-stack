// measure-ms.mjs - the phone-shaped frame-cost measurement (P3c).
//
//   node scripts/measure-ms.mjs [build/web] [--phone] [--windows N]
//                               [--port N] [--cdp N] QUERY...
//
// Headless chrome on SwiftShader (a CPU rasterizer: every fragment is CPU
// time here, so a full-screen pass costs what a phone GPU never pays, and
// the STEP/PRESENT columns, the wasm's own issue time, are the honest
// CPU-side figures; the MS column is the frame's wall time under that
// rasterizer), at the desktop viewport (dpr 2) or the phone's (--phone:
// 390x844 CSS, dpr 3, portrait). For each QUERY (e.g. "bg=flow",
// "bg=reaction&dpr=2") the page opens on the stack table with ?trace&ms,
// and the game's own "crash: frame-ms MEAN MAX step MEAN present MEAN"
// lines (one per 120 frames) are collected for N windows; the first
// window is discarded (boot, the shaders' first compile) and the rest
// printed and averaged. The table shows the config, the buffer size, and
// MS / MAX / STEP / PRESENT in ms.
//
// A number here is a SwiftShader number at a phone viewport; the phone's
// own figure is David's ?ms read.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp", "--windows"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] && fs.existsSync(path.join(positional[0], "index.html")) ? positional.shift() : "build/web");
const QUERIES = positional.length ? positional : ["bg=off", "bg=reaction", "bg=cyclic", "bg=flow", "bg=signal", "bg=echo", "bg=synapse", "bg=flame", "bg=reaction-cpu"];
const PORT = parseInt(opt("--port", "8100"), 10);
const CDP = parseInt(opt("--cdp", "9240"), 10);
const WINDOWS = parseInt(opt("--windows", "3"), 10);
const PHONE = flag("--phone");
// --tap: after the first window, tap the first solution pair's tile A
// every TAP_MS (select, deselect, select ...), so the windows that
// follow carry the tap path; the worst-frame line says what ran in
// the longest frame.
const TAP = flag("--tap");
const TAP_MS = 400;
const VW = 640, VH = 400;
// The game's frame line, every optional part in order. "resize" (between
// pump and other) came later than this tool, and a regex with no slot for
// it matched NO line: every run reported "only 0 windows", a silent
// SETUP failure read as a measurement (t-665cde). So the regex is checked
// against a line in today's format before anything runs, and a mismatch
// is SETUP-FAILED, never zero windows. SAMPLE is a line in today's format
// (numbers made up), and the check after it holds its field names to the
// game's own (say "frame-ms" ...) in src/crash/shell/web.sgl, in order.
// --self-test runs only that check.
const RE = /^crash: frame-ms (\d+) (\d+) step ([\d.]+) present ([\d.]+)(?: gc (\d+) (\d+) alloc (-?\d+))?(?: gcms ([\d.]+))?(?: sim ([\d.]+) draw ([\d.]+) flush ([\d.]+))?(?: tick ([\d.]+) pump ([\d.]+)(?: resize [\d.]+)? other ([\d.]+))?(?: boot ([\d.]+) count ([\d.]+))?(?: underruns (\d+))?$/;
const SAMPLE = "crash: frame-ms 17 33 step 0.4 present 1.2 gc 3 0 alloc 123456 gcms 0.8 sim 2.1 draw 6.3 flush 0.2 tick 9.8 pump 0.3 resize 0.1 other 0.4 boot 0 count 0.1 underruns 0";
{
  const m = SAMPLE.match(RE);
  if (!m || m[12] !== "9.8" || m[14] !== "0.4" || m[17] !== "0") { console.log(`SETUP-FAILED: the frame-ms regex does not read today's line (${m ? "groups moved" : "no match"}): ${SAMPLE}`); process.exit(2); }
  // and SAMPLE is today's format, read from the game's own source: the
  // field names of its (say "frame-ms" ...) in order, so a field the game
  // gains or renames reddens this check instead of silently matching nothing
  const SRC = "src/crash/shell/web.sgl";
  if (fs.existsSync(SRC)) {
    const src = fs.readFileSync(SRC, "utf8");
    const at = src.indexOf('(say "frame-ms"');
    const end = at < 0 ? -1 : src.indexOf('"underruns"', at);
    const game = at < 0 || end < 0 ? null : src.slice(at, end + 11).match(/"([a-z-]+)"/g).map((w) => w.slice(1, -1));
    const sample = SAMPLE.replace(/^crash: /, "").split(" ").filter((w) => /^[a-z-]+$/.test(w));
    if (!game) { console.log(`SETUP-FAILED: no (say "frame-ms" ... "underruns") in ${SRC} to check SAMPLE against`); process.exit(2); }
    if (game.join(" ") !== sample.join(" ")) { console.log(`SETUP-FAILED: the game's frame-ms line has the fields ${game.join(" ")}; SAMPLE (and the regex) have ${sample.join(" ")}`); process.exit(2); }
  }
  if (flag("--self-test")) { console.log("measure-ms self-test: the frame-ms regex reads today's line (tick 9.8, other 0.4, underruns 0)"); process.exit(0); }
}
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };

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

const udd = fs.mkdtempSync("/tmp/crash-verify-ms-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
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
const consoleLines = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); return; }
  if (msg.method === "Runtime.consoleAPICalled") consoleLines.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
await send("Page.enable"); await send("Runtime.enable");
// Every WebGL2 call counted from the page side (the wasm's gl imports
// land on these prototype methods): the mechanism behind the numbers,
// per frame; the top names show what a pass costs in calls.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  (() => { const P = WebGL2RenderingContext.prototype; const counts = {}; let total = 0; let frames = 0;
    for (const name of Object.getOwnPropertyNames(P)) { const d = Object.getOwnPropertyDescriptor(P, name); if (!d || typeof d.value !== 'function' || name === 'constructor') continue;
      const f = d.value; P[name] = function () { total++; counts[name] = (counts[name] || 0) + 1; return f.apply(this, arguments); }; }
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (cb) { return raf.call(window, function (t) { frames++; return cb(t); }); };
    window.__gl = { counts, get total() { return total; }, get frames() { return frames; }, reset() { total = 0; frames = 0; for (const k in counts) delete counts[k]; } }; })();
` });
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

const WORST = /^crash: worst-frame (\d+) sim ([\d.]+) draw ([\d.]+) flush ([\d.]+) step ([\d.]+) advance ([\d.]+) save ([\d.]+) cues ([\d.]+) fx ([\d.]+)$/;
async function waitLine(re, from, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (let i = from; i < consoleLines.length; i++) { const m = consoleLines[i].match(re); if (m) return { m, index: i }; }
    await sleep(50);
  }
  return null;
}
async function tap(vx, vy) {
  return evalJS(`(() => {
    const c = document.getElementById("stage"); const r = c.getBoundingClientRect();
    const scale = Math.min(c.width / ${VW}, c.height / ${VH});
    const ox = (c.width - ${VW} * scale) / 2, oy = (c.height - ${VH} * scale) / 2;
    const bx = ox + ${vx} * scale, by = oy + ${vy} * scale;
    const cx = r.left + bx * r.width / c.width, cy = r.top + by * r.height / c.height;
    c.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
    return 1;
  })()`);
}
const rows = [];
for (const q of QUERIES) {
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&ms&fresh&${/^menu/.test(q) ? q.replace(/^menu&?/, "") : "stack&" + q}` });
  const t0 = Date.now();
  let tapping = null;
  if (TAP) {
    const boot = await waitLine(/^crash: seed (\d+) tiles (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) /, mark, 20000);
    if (boot) {
      const [ax, ay] = [parseFloat(boot.m[4]), parseFloat(boot.m[5])];
      // let the first window pass untouched, then tap through the rest
      tapping = (async () => { while (consoleLines.slice(mark).filter((l) => RE.test(l)).length < 1) await sleep(100); while (tapping) { await tap(ax, ay); await sleep(TAP_MS); } })();
    }
  }
  let lines = [];
  while (Date.now() - t0 < 180000) {
    lines = consoleLines.slice(mark).map((l) => l.match(RE)).filter(Boolean);
    if (lines.length >= WINDOWS + 1) break;
    await sleep(250);
  }
  const gl = await evalJS(`(() => { const g = window.__gl; const top = Object.entries(g.counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + (v / Math.max(1, g.frames)).toFixed(1)).join(', '); return { perFrame: g.total / Math.max(1, g.frames), frames: g.frames, top }; })()`);
  if (tapping) { const t = tapping; tapping = null; await t.catch(() => {}); }
  const page = await evalJS(`typeof crashPageStats === "function" ? crashPageStats().split("\\n").join("; ") : "no page stats"`).catch(() => "no page stats");
  const buffer = await evalJS(`(() => { const c = document.getElementById("stage"); return c.width + "x" + c.height; })()`);
  const errors = consoleLines.slice(mark).filter((l) => /^(Error: |Scheme error)/.test(l)).length;
  if (lines.length < WINDOWS + 1) { rows.push({ q, buffer, note: `only ${lines.length} windows in 180 s`, errors }); continue; }
  const kept = lines.slice(1, WINDOWS + 1);
  const mean = (i) => (kept.reduce((a, m) => a + parseFloat(m[i]), 0) / kept.length);
  rows.push({ q, buffer, ms: mean(1), max: Math.max(...kept.map((m) => parseFloat(m[2]))), step: mean(3), present: mean(4), gc: kept.map((m) => m[5] ? `${m[5]}/${m[6]}/${(parseInt(m[7], 10) / 1048576).toFixed(1)}MB` : "-").join(" "), phases: kept[0][9] ? `gc pauses ${kept.map((m) => m[8]).join("/")} ms; sim ${mean(9).toFixed(1)} draw ${mean(10).toFixed(1)} (min ${Math.min(...kept.map((m) => parseFloat(m[10]))).toFixed(1)}) flush ${mean(11).toFixed(1)}${kept[0][12] ? ` tick ${mean(12).toFixed(1)} pump ${mean(13).toFixed(1)} other ${mean(14).toFixed(1)}${kept[0][15] ? ` boot ${mean(15).toFixed(1)} count ${mean(16).toFixed(1)}` : ""}` : ""}` : "", windows: kept.map((m) => `${m[1]}/${m[2]}/${m[3]}/${m[4]}`).join(" "), errors, gl, page, selects: consoleLines.slice(mark).filter((l) => /^crash: (select|deselect) /.test(l)).length, worst: consoleLines.slice(mark).map((l) => l.match(WORST)).filter(Boolean).slice(1, WINDOWS + 1).map((m) => `${m[1]}ms(sim ${m[2]} draw ${m[3]} flush ${m[4]}; step ${m[5]} adv ${m[6]} save ${m[7]} cues ${m[8]} fx ${m[9]})`).join(" | ") });
}
console.log(`viewport ${PHONE ? "phone 390x844 dpr 3" : "desktop 1000x760 dpr 2"}; ${WINDOWS} windows of 120 frames after the first; SwiftShader`);
console.log("config                     buffer      MS    MAX   STEP  PRESENT  windows (ms/max/step/present)");
for (const r of rows) {
  if (r.note) { console.log(`${r.q.padEnd(26)} ${r.buffer.padEnd(11)} ${r.note}${r.errors ? ` (${r.errors} error lines)` : ""}`); continue; }
  console.log(`${r.q.padEnd(26)} ${r.buffer.padEnd(11)} ${r.ms.toFixed(1).padStart(5)} ${String(r.max).padStart(5)} ${r.step.toFixed(1).padStart(6)} ${r.present.toFixed(1).padStart(8)}  ${r.windows}${r.errors ? ` (${r.errors} error lines)` : ""}`);
  if (r.gl) console.log(`${"".padEnd(26)} gl calls/frame ${r.gl.perFrame.toFixed(0)} over ${r.gl.frames} frames: ${r.gl.top}; gc minor/major/alloc per window: ${r.gc}; ${r.phases}`);
  if (r.worst) console.log(`${"".padEnd(26)} worst frame per window: ${r.worst}; taps seen: ${r.selects}`);
  if (r.page) console.log(`${"".padEnd(26)} ${r.page}`);
}
shutdown(0);
