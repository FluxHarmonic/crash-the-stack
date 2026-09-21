// verify-guard.mjs - the browser arm for the page guard and the visibility
// handling (the web soak row, 2026-09-21, [[t-7cef66]]: a tab left running
// for hours died with one FATAL and then the same FATAL on every dispatch).
//
//   node verify-guard.mjs [build/web] [--port N] [--cdp N] [--phone]
//
// The same plumbing as verify-field.mjs (loopback server, headless chrome
// on SwiftShader, CDP over Node's WebSocket, dpr 2 or 3 with --phone).
// Each sub-arm prints PASS / FAIL <name>: <detail>; any FAIL exits 1; a
// wait that runs out prints TIMED-OUT with everything collected and exits 2.
//
//   trap-frame     ?trace&stack&fresh&trap=frame: the game boots, then the
//                  page arms the trap door (("trap", "frame"): the next frame
//                  dispatch, and every dispatch
//                  after it calls the C native %fatal!, which prints a FATAL
//                  line and aborts, the runtime's own out-of-memory shape) so
//                  the NEXT frame tick dies inside the gles3 loop, the path
//                  Trev's died on. Then, over 4 s: exactly ONE "FATAL:" line
//                  (the door is sticky, so any dispatch that still reaches the
//                  instance prints another: the count IS the leak count),
//                  exactly one uncaught RuntimeError, and it came through the
//                  gles3 tick (its stack names sigil-wasm-gles3.js; the door
//                  armed for a frame fires only on a frame dispatch, so the
//                  copy poll cannot take it first), "crash: page dead fatal:
//                  FATAL: ..." (the guard reads the FATAL line ahead of the
//                  trap that follows it),
//                  SigilWebApp.dispatch answering -1
//                  without a new FATAL, a synthetic keydown, pointerdown and
//                  click on the page adding none, the audio context suspended,
//                  the RECONNECT card shown with its word lit in C-SELECTED
//                  and C-HIGHLIGHT, and a tap on the card booting the game
//                  again (a new boot line after the reload)
//   trap-dispatch  ?trap=now: the door fires inside a page dispatch instead
//                  (the app's deliver, where the polls and gestures call in; the
//                  RuntimeError's stack names sigil-web-app.js);
//                  the same assertions, plus the frame tick already queued
//                  when the page died never ran (it would have printed the
//                  second FATAL)
//   hidden         ?trace&stack&fresh, a tile selected; a second tab in front
//                  hides the page (headless chrome stops requestAnimationFrame
//                  and fires visibilitychange, as a browser does): the game
//                  says "crash: visibility hidden", the page "crash: page
//                  hidden", the audio context is suspended and no frame runs
//                  for 3 s; the page activated again: "crash: page visible
//                  after N s", "crash: visibility visible", frames run again,
//                  the context is running, and a tap on the pair's other tile
//                  removes it ("crash: removed A B tiles 142"); no sokol line
//                  and no error over the whole leg
//   context-lost   ?trace&stack&fresh; WEBGL_lose_context.loseContext() on the
//                  stage's context: "crash: page dead webgl context lost", no
//                  FATAL (the instance is alive but unusable), frames stopped,
//                  dispatch -1, the card, and the tap reboots the game
//   rollover       ?epoch= 75 s before UTC day 20717, DAILY STACK dealt from the
//                  menu (day 20716), the rollover waited out (95 s) with the
//                  game's own day read before and after (("day", ""): 20716
//                  then 20717, the oracle that the clock crossed under the
//                  live board): no error,
//                  no "car: expected pair", no sokol line, and the first pair
//                  still removes
//   console        over the four non-trap legs: zero error-level entries and
//                  zero exceptions (the trap legs account for their one)
//
// The plants that redden this arm are in the evidence note
// (investigations/crash-the-stack-web-soak): the guard's dead check removed
// from deliver (the copy poll then prints a FATAL every 300 ms: trap-* red
// on the count), the frame skip removed from the guard's rAF wrapper
// (trap-dispatch red: the queued tick runs), the visibility dispatch
// removed (hidden red on the game's line), the contextlost listener removed
// (context-lost red).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const VALUED = ["--port", "--cdp"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1])));
const ROOT = path.resolve(positional[0] || "build/web");
const PORT = parseInt(opt("--port", "8097"), 10);
const CDP = parseInt(opt("--cdp", "9237"), 10);
const PHONE = flag("--phone");

const VW = 640, VH = 400;
const TYPES = { ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8",
  ".wasm": "application/wasm", ".json": "application/json;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json",
  ".ogg": "audio/ogg", ".txt": "text/plain;charset=utf-8" };
const C_SELECTED = [77, 242, 217], C_HIGHLIGHT = [255, 89, 217];

const results = [];
const planned = ["trap-frame", "trap-dispatch", "hidden", "context-lost", "rollover", "console"];
function pass(name, detail) { results.push([name, "PASS"]); console.log(`PASS ${name}${detail ? ": " + detail : ""}`); }
function fail(name, detail) { results.push([name, "FAIL"]); console.log(`FAIL ${name}: ${detail}`); }
function notRun() { const done = new Set(results.map((r) => r[0])); return planned.filter((p) => !done.has(p)); }

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.log(`SETUP-FAILED: ${ROOT}/index.html missing`); process.exit(2); }
// the door must be in the build under test: the shell's dispatch names it
// and the wasm carries the native's FATAL text (a build without either
// would time out on the first leg for a reason unrelated to the guard)
{
  const wasm = fs.readFileSync(path.join(ROOT, "crash-the-stack.wasm"));
  if (!wasm.includes(Buffer.from("FATAL: crash: the trap door fired"))) { console.log("SETUP-FAILED: the wasm has no trap door (%fatal! in src/c/crash-native.c); build --config web at this tree first"); process.exit(2); }
  const page = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (!page.includes("window.crashGuard")) { console.log("SETUP-FAILED: the page has no guard (window.crashGuard); build --config web at this tree first"); process.exit(2); }
}

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

const udd = fs.mkdtempSync("/tmp/crash-verify-guard-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  // the audio context must run without a gesture so its suspend on hide and
  // on death can be seen (the arm reads state, not sound: routed to the
  // null sink and muted)
  "--autoplay-policy=no-user-gesture-required", "--mute-audio",
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
const WHOLE_RUN_MS = 480000;   // six boots and a 95 s rollover wait (four legs and a reload each in three) at 20-45 s each under load
setTimeout(() => { console.log(`TIMED-OUT whole run after ${WHOLE_RUN_MS} ms; did not run: ${notRun().join(" ")}`); dump(); shutdown(2); }, WHOLE_RUN_MS).unref();

let pageWs = null, pageTargetId = null;
for (let i = 0; i < 50 && !pageWs; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) { pageWs = page.webSocketDebuggerUrl; pageTargetId = page.id; }
  } catch { /* chrome not up yet */ }
  if (!pageWs) await sleep(200);
}
if (!pageWs) { console.log("SETUP-FAILED: no DevTools page target within 10 s"); shutdown(2); await new Promise(() => {}); }

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
const countLines = (re, from = 0) => consoleLines.slice(from).filter((l) => re.test(l)).length;
const FATAL_RE = /^FATAL:/;
function dump() {
  console.log("--- console lines ---"); consoleLines.forEach((l) => console.log("  " + l));
  console.log("--- console errors ---"); consoleErrors.forEach((l) => console.log("  " + l));
}
function timedOut(name) {
  console.log(`TIMED-OUT ${name}; did not run: ${notRun().filter((n) => n !== name).join(" ")}`);
  dump(); shutdown(2);
}
// a synthetic pointerdown on the stage at a virtual point (verify.mjs's tap)
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
// does an animation frame fire within ms? (the page's own wrapper drops
// requests once dead; a hidden page gets none from the browser)
async function frameWithin(ms) {
  return evalJS(`new Promise((resolve) => { let done = false; requestAnimationFrame(() => { done = true; resolve(true); }); setTimeout(() => { if (!done) resolve(false); }, ${ms}); })`);
}
const BOOT_RE = /^crash: seed (\d+) tiles (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) (\d+) (-?[\d.]+) (-?[\d.]+)$/;
async function boot(query) {
  const mark = consoleLines.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?${query}` });
  const b = await waitLine(BOOT_RE, mark, 45000);
  return b ? { mark, seed: b.m[1], tiles: b.m[2], A: b.m[3], AX: +b.m[4], AY: +b.m[5], B: b.m[6], BX: +b.m[7], BY: +b.m[8] } : null;
}
// the state the guard leaves, read from the page
async function guardState() {
  return evalJS(`(() => {
    const g = window.crashGuard || {};
    const card = document.getElementById("reconnect");
    const shown = card && !card.hidden && getComputedStyle(card).display !== "none";
    let word = null;
    if (shown) {
      const c = document.getElementById("reconnect-word");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sel = 0, hi = 0, lit = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue; lit++;
        if (d[i] === ${C_SELECTED[0]} && d[i + 1] === ${C_SELECTED[1]} && d[i + 2] === ${C_SELECTED[2]}) sel++;
        if (d[i] === ${C_HIGHLIGHT[0]} && d[i + 1] === ${C_HIGHLIGHT[1]} && d[i + 2] === ${C_HIGHLIGHT[2]}) hi++;
      }
      word = { w: c.width, h: c.height, lit, sel, hi };
    }
    let rc = null; try { rc = globalThis.SigilWebApp.dispatch("copy", "asked?"); } catch (e) { rc = "threw " + e; }
    return { dead: !!g.dead, why: g.why || "", fatals: g.fatals || 0, shown, word, rc };
  })()`);
}
async function audioState() {
  return evalJS(`(() => { try { const a = window.__crashAudioContexts || []; return a.length ? a.map((c) => c.state).join(",") : "none"; } catch (e) { return "error " + e; } })()`);
}
// the page keeps its contexts in a closure; the arm reaches them through
// a constructor tap installed before any script runs
await send("Page.addScriptToEvaluateOnNewDocument", { source: `(function () {
  var AC = window.AudioContext; if (typeof AC !== "function") return;
  window.__crashAudioContexts = [];
  var Tapped = function () { var c = arguments.length ? new AC(arguments[0]) : new AC(); window.__crashAudioContexts.push(c); return c; };
  Tapped.prototype = AC.prototype; window.AudioContext = Tapped;
})();` });

// ---- the two trap legs ------------------------------------------------------
async function trapLeg(name, door) {
  const b = await boot(`trace&stack&fresh&trap=${door}`);
  if (!b) { fail(name, "no boot line within 45 s"); timedOut(name); await new Promise(() => {}); }
  const errorsBefore = consoleErrors.length;
  const dead = await waitLine(/^crash: page dead (.*)$/, b.mark, 30000);
  if (!dead) { fail(name, "the page never said \"crash: page dead\" within 30 s of the boot (the door did not fire, or the guard did not see it)"); timedOut(name); await new Promise(() => {}); }
  // the pending tick, the polls (300 ms), the gestures: give them 4 s
  await sleep(4000);
  const s1 = await guardState();
  // poke: the loader's own listeners dispatch keydown, pointerdown and click
  await evalJS(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }))`);
  await tap(VW / 2, VH / 2);
  await evalJS(`document.getElementById("stage").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))`);
  await sleep(1500);
  const fatals = countLines(FATAL_RE, b.mark);
  const trapErrors = consoleErrors.slice(errorsBefore).filter((e) => /RuntimeError|unreachable/.test(e));
  const traps = trapErrors.length;
  // the path the trap took, from the uncaught error's stack: the gles3 loop's tick
  // for the frame door, the loader's dispatch for the page-dispatch door
  const pathRe = door === "frame" ? /sigil-wasm-gles3\.js/ : /sigil-web-app\.js/;
  const onPath = trapErrors.filter((e) => pathRe.test(e)).length;
  const otherErrors = consoleErrors.slice(errorsBefore).filter((e) => !/RuntimeError|unreachable/.test(e));
  const frames = await frameWithin(1500);
  const audio = await audioState();
  const problems = [];
  if (fatals !== 1) problems.push(`FATAL lines ${fatals} (want exactly 1: each extra is a dispatch that reached the dead instance)`);
  if (traps === 1 && onPath !== 1) problems.push(`the trap did not come through ${door === "frame" ? "the gles3 frame tick" : "the loader's dispatch"}: ${trapErrors[0].split("\n").slice(0, 4).join(" / ")}`);
  // the guard sees the door's FATAL line (console.warn) before the trap it aborts with
  if (!/^(fatal: FATAL: crash: the trap door|trap)/.test(dead.m[1])) problems.push(`died of "${dead.m[1]}", expected the door's FATAL line or its trap`);
  if (traps !== 1) problems.push(`uncaught RuntimeErrors ${traps} (want exactly 1: the trap itself)`);
  if (otherErrors.length) problems.push(`other errors: ${otherErrors.join(" | ")}`);
  if (s1.rc !== -1) problems.push(`SigilWebApp.dispatch after death answered ${JSON.stringify(s1.rc)}, want -1`);
  if (!s1.shown) problems.push("the RECONNECT card is not shown");
  if (s1.word && !(s1.word.sel > 200 && s1.word.hi > 200)) problems.push(`the word's canvas: ${JSON.stringify(s1.word)} (want C-SELECTED and C-HIGHLIGHT pixels)`);
  if (frames) problems.push("an animation frame still fires after death");
  // the arm's chrome allows autoplay, so the game's context is open and running by
  // now; "none" would leave the suspend unobserved and is a failure of its own
  if (!/^suspended(,suspended)*$/.test(audio)) problems.push(`audio context ${audio}, want suspended`);
  if (problems.length) { fail(name, problems.join("; ")); return; }
  // the tap on the card: a reload and a fresh boot
  const mark2 = consoleLines.length;
  await evalJS(`document.getElementById("reconnect").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))`);
  const again = await waitLine(BOOT_RE, mark2, 45000);
  if (!again) { fail(name, "no boot line within 45 s of the tap on the card (the reload did not happen)"); return; }
  pass(name, `died of "${dead.m[1]}"; 1 FATAL, 1 RuntimeError, dispatch -1, no frame, audio ${audio}, card ${s1.word.w}x${s1.word.h} sel ${s1.word.sel} hi ${s1.word.hi}; the tap rebooted (seed ${again.m[1]})`);
}
await trapLeg("trap-frame", "frame");
await trapLeg("trap-dispatch", "now");

// ---- hidden -------------------------------------------------------------------
{
  const name = "hidden";
  const errorsBefore = consoleErrors.length;
  const b = await boot("trace&stack&fresh");
  if (!b) { fail(name, "no boot line within 45 s"); timedOut(name); await new Promise(() => {}); }
  await sleep(1500);
  let mark = consoleLines.length;
  await tap(b.AX, b.AY);
  const sel = await waitLine(/^crash: select (\d+)$/, mark, 3000);
  if (!sel || sel.m[1] !== b.A) { fail(name, `no "crash: select ${b.A}" after the first tap`); }
  else {
    const audio0 = await audioState();
    mark = consoleLines.length;
    // a second tab in front: the page is hidden, requestAnimationFrame stops
    const t = await send("Target.createTarget", { url: "about:blank" });
    const hid = await waitLine(/^crash: visibility hidden$/, mark, 5000);
    const pageHid = await waitLine(/^crash: page hidden$/, mark, 1000);
    await sleep(3000);
    const audio1 = await audioState();
    const frozen = !(await frameWithin(1500));
    // back in front
    mark = consoleLines.length;
    await send("Target.activateTarget", { targetId: pageTargetId });
    const shown = await waitLine(/^crash: visibility visible$/, mark, 5000);
    const pageShown = await waitLine(/^crash: page visible after (\d+) s$/, mark, 1000);
    await sleep(500);
    const running = await frameWithin(1500);
    const audio2 = await audioState();
    await send("Target.closeTarget", { targetId: t.targetId }).catch(() => {});
    mark = consoleLines.length;
    await tap(b.BX, b.BY);
    const rem = await waitLine(/^crash: removed (\d+) (\d+) tiles (\d+)$/, mark, 5000);
    const sokol = countLines(/sokol\[/, b.mark);
    const errors = consoleErrors.slice(errorsBefore);
    const problems = [];
    if (!hid) problems.push("no \"crash: visibility hidden\" from the game");
    if (!pageHid) problems.push("no \"crash: page hidden\" from the page");
    if (!frozen) problems.push("an animation frame fired while hidden");
    if (audio0 !== "running") problems.push(`audio context before hiding ${audio0}, want running (the arm allows autoplay)`);
    if (!/^suspended(,suspended)*$/.test(audio1)) problems.push(`audio context while hidden ${audio1}, want suspended (was ${audio0})`);
    if (!shown) problems.push("no \"crash: visibility visible\" from the game");
    if (!pageShown) problems.push("no \"crash: page visible after N s\" from the page");
    if (!running) problems.push("no animation frame within 1.5 s of coming back");
    if (audio2 !== "running") problems.push(`audio context after showing ${audio2}, want running`);
    if (!rem) problems.push("no \"crash: removed\" after the tap on the pair's other tile");
    else if (rem.m[3] !== "142") problems.push(`removed line: ${rem.m[0]}`);
    if (sokol) problems.push(`${sokol} sokol line(s) over the leg`);
    if (errors.length) problems.push(`errors: ${errors.join(" | ")}`);
    if (problems.length) fail(name, problems.join("; "));
    else pass(name, `hidden ${pageShown.m[1]} s: game and page said so, no frame, audio ${audio0} -> ${audio1} -> ${audio2}; back: frames run, ${rem.m[0]}`);
  }
}

// ---- context-lost -------------------------------------------------------------
{
  const name = "context-lost";
  const errorsBefore = consoleErrors.length;
  const b = await boot("trace&stack&fresh");
  if (!b) { fail(name, "no boot line within 45 s"); timedOut(name); await new Promise(() => {}); }
  await sleep(1500);
  const mark = consoleLines.length;
  const lost = await evalJS(`(() => { const gl = document.getElementById("stage").getContext("webgl2"); const ext = gl && gl.getExtension("WEBGL_lose_context"); if (!ext) return "no WEBGL_lose_context"; ext.loseContext(); return "lost"; })()`);
  const dead = await waitLine(/^crash: page dead (.*)$/, mark, 10000);
  await sleep(2500);
  const s = await guardState();
  const frames = await frameWithin(1500);
  const fatals = countLines(FATAL_RE, mark);
  const errors = consoleErrors.slice(errorsBefore);
  const problems = [];
  if (lost !== "lost") problems.push(lost);
  if (!dead) problems.push("no \"crash: page dead\" within 10 s of loseContext()");
  else if (dead.m[1] !== "webgl context lost") problems.push(`died of "${dead.m[1]}"`);
  if (fatals) problems.push(`${fatals} FATAL line(s): the instance should be alive, only unusable`);
  if (s.rc !== -1) problems.push(`dispatch answered ${JSON.stringify(s.rc)}, want -1`);
  if (!s.shown) problems.push("the RECONNECT card is not shown");
  if (frames) problems.push("an animation frame still fires");
  if (errors.length) problems.push(`errors: ${errors.join(" | ")}`);
  if (problems.length) fail(name, problems.join("; "));
  else {
    const mark2 = consoleLines.length;
    await evalJS(`document.getElementById("reconnect").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))`);
    const again = await waitLine(BOOT_RE, mark2, 45000);
    if (!again) fail(name, "no boot line within 45 s of the tap on the card");
    else pass(name, `"${dead.m[1]}": no FATAL, dispatch -1, no frame, the card; the tap rebooted (seed ${again.m[1]})`);
  }
}

// ---- rollover -----------------------------------------------------------------
// A DAILY board live across a UTC midnight, faked through the ?epoch door
// (the page's clock at boot; the game's second is that plus the time since):
// the boot lands 75 s before day 20717 begins, the daily is dealt from the
// menu (Escape, the exit row, FREE PLAY, DAILY STACK), the page waits the
// rollover out, and the board must still play (its first pair removed), with
// no error, no "car: expected pair" and no sokol line over the two minutes.
{
  const name = "rollover";
  const errorsBefore = consoleErrors.length;
  const MIDNIGHT = 20717 * 86400;
  const b = await boot(`trace&stack&fresh&seed=1&epoch=${MIDNIGHT - 75}`);
  if (!b) { fail(name, "no boot line within 45 s"); timedOut(name); await new Promise(() => {}); }
  const bootDone = await waitLine(/^crash: boot done /, b.mark, 30000);
  if (!bootDone) { fail(name, "no \"crash: boot done\" within 30 s"); }
  else {
    await sleep(300);
    const key = async (type, k) => evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
    const press = async (k) => { await key("keydown", k); await sleep(40); await key("keyup", k); await sleep(150); };
    const parseMenu = (line) => { const parts = line.split(" ").slice(2); const order = []; for (let i = 1; i + 2 < parts.length; i += 3) order.push(parts[i].split("=")[0]); return { screen: parts[0], order, parts }; };
    let detail = "";
    let m0 = consoleLines.length;
    await press("Escape");
    const pauseRows = await waitLine(/^crash: menu pause (.*)$/, m0, 3000);
    if (!pauseRows) detail = "Escape opened no pause menu";
    else {
      const parts = pauseRows.m[1].split(" ");
      const i = parts.findIndex((w) => w === "back-to-menu" || w === "disconnect");
      m0 = consoleLines.length;
      if (i < 0) detail = `no exit row on the pause menu: ${pauseRows.m[1]}`;
      else { await tap(parseFloat(parts[i + 1]), parseFloat(parts[i + 2])); }
    }
    const top = !detail && await waitLine(/^crash: menu top .*$/, m0, 3000);
    if (!detail && !top) detail = "the exit row did not land on the main menu";
    if (!detail) {
      const t = parseMenu(top.m[0]);
      const at = t.order.indexOf("free-play");
      for (let k = 0; k < at; k++) await press("ArrowDown");
      m0 = consoleLines.length;
      await press("Enter");
      const free = await waitLine(/^crash: menu free .*$/, m0, 3000);
      if (!free) detail = "FREE PLAY did not open";
      else {
        const f = parseMenu(free.m[0]);
        const j = f.order.indexOf("daily-stack");
        if (j < 0) detail = `no daily-stack row: ${f.order.join(" ")}`;
        else {
          for (let k = 0; k < j; k++) await press("ArrowDown");
          m0 = consoleLines.length;
          await press("Enter");
          const day = await waitLine(/^crash: daily (\d+) (\d+-\d+-\d+)$/, m0, 5000);
          const dealt = day && await waitLine(BOOT_RE, m0, 10000);
          if (!day) detail = "DAILY STACK said no daily line";
          else if (day.m[1] !== "20716") detail = `the daily's day read ${day.m[1]} before the rollover, not 20716`;
          else if (!dealt) detail = "the daily dealt no boot line";
          else {
            // the rollover: the epoch reaches day 20717 about 60 s from here
            const linesBefore = consoleLines.length;
            // the oracle: the game's own UTC day (the epoch door plus the time since), read
            // before and after the wait: 20716 then 20717, or the door was not honoured
            const dayBefore = await evalJS(`globalThis.SigilWebApp.dispatch("day", "")`);
            await sleep(95000);
            const dayAfter = await evalJS(`globalThis.SigilWebApp.dispatch("day", "")`);
            const cars = countLines(/car: expected pair/, linesBefore);
            const sokol = countLines(/sokol\[/, linesBefore);
            const errors = consoleErrors.slice(errorsBefore);
            const frames = await frameWithin(1500);
            const mark = consoleLines.length;
            await tap(+dealt.m[4], +dealt.m[5]);
            const sel = await waitLine(/^crash: select (\d+)$/, mark, 3000);
            await tap(+dealt.m[7], +dealt.m[8]);
            const rem = await waitLine(/^crash: removed (\d+) (\d+) tiles (\d+)$/, mark, 5000);
            const problems = [];
            if (dayBefore !== 20716) problems.push(`the game read day ${dayBefore} before the wait, want 20716`);
            if (dayAfter !== 20717) problems.push(`the game read day ${dayAfter} after the wait, want 20717 (the rollover did not happen under the board)`);
            if (cars) problems.push(`${cars} "car: expected pair" line(s)`);
            if (sokol) problems.push(`${sokol} sokol line(s)`);
            if (errors.length) problems.push(`errors: ${errors.join(" | ")}`);
            if (!frames) problems.push("no animation frame after the rollover");
            if (!sel || sel.m[1] !== dealt.m[3]) problems.push(`the first tap after the rollover selected ${sel ? sel.m[1] : "nothing"}, want ${dealt.m[3]}`);
            if (!rem || rem.m[3] !== "142") problems.push(`no pair removed after the rollover${rem ? " (" + rem.m[0] + ")" : ""}`);
            if (problems.length) detail = problems.join("; ");
            else pass(name, `daily day 20716 seed ${dealt.m[1]} dealt at midnight - 75 s; the game read day ${dayBefore} -> ${dayAfter} across the wait; then ${rem.m[0]}, no errors, no car, no sokol`);
          }
        }
      }
    }
    if (detail) fail(name, detail);
  }
}

// ---- console ------------------------------------------------------------------
{
  const traps = consoleErrors.filter((e) => /RuntimeError|unreachable/.test(e)).length;
  const others = consoleErrors.filter((e) => !/RuntimeError|unreachable/.test(e));
  if (others.length) fail("console", `${others.length} error(s) beyond the two legs' traps: ${others.slice(0, 5).join(" | ")}`);
  else if (traps !== 2) fail("console", `${traps} uncaught RuntimeError(s) over the run, want exactly 2 (one per trap leg)`);
  else pass("console", "no errors beyond the two trap legs' own RuntimeErrors");
}

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`${results.length - failed}/${results.length} passed`);
if (failed) dump();
shutdown(failed ? 1 : 0);
