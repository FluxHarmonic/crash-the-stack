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
//               + sigil_browser (localStorage), no env, no emscripten
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
//   traced      SHUFFLES taps on the SHUF control fill the trace (60 each,
//               TRACE-AT 180 -> 3) -> "crash: shuffle" that many times, then
//               "crash: trace ... counter 0" on the next tick,
//               and within ICE-FIRST + 5 s the first counter-hack:
//               "crash: trace ... counter 1" with "crash: lock A B" or a sixth
//               "crash: shuffle" (gate leg 2 on the product)
//   reload      the page is reloaded (fresh navigation, same origin) and the
//               game boots from localStorage: "crash: restored tiles 142 ...
//               phase counter ice 1 locked ..." (gate leg 4, web)
//   update      ruling D14: with the game running under a controlling service
//               worker, the arm serves a sw.js with a new version and asks for
//               an update check; the new worker must reach WAITING without any
//               reload (the page's token survives, no new boot line) and the
//               game must be told "waiting" (its HUD mark), not "prompt" (the
//               launch window has passed); on the next launch the game must
//               be told "prompt", a tap on its APPLY box must answer "apply",
//               and the page must then reload onto the new version
//   manifest    Page.getAppManifest parses assets/manifest.webmanifest with no
//               errors, it names the icons, and Page.getInstallabilityErrors
//               is empty on this (loopback, so secure) origin
//   console     zero error-level console entries and zero exceptions
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
const planned = ["imports", "boot", "render", "tap-select", "tap-match", "keys-match", "traced", "reload", "update", "manifest", "console"];
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
  const expected = ["gl", "sigil_browser", "sigil_wasm_gles3", "wasi_snapshot_preview1"];
  const listing = modules.map((m) => `${m}(${byModule[m].length})`).join(" ");
  if (JSON.stringify(modules) === JSON.stringify(expected)) pass("imports", listing);
  else fail("imports", `expected modules ${expected.join(",")} got ${listing}`);
}

// ---- static server on loopback ---------------------------------------------
// swVersionOverride, when set, is stamped into the served sw.js in place of
// the build's version: how the update sub-arm plays a new deploy.
let swVersionOverride = null;
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const fp = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end("not found: " + urlPath); return; }
    if (urlPath === "/sw.js" && swVersionOverride) buf = Buffer.from(buf.toString().replace(/var VERSION = "[^"]*"/, `var VERSION = "${swVersionOverride}"`));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ---- headless chrome + software WebGL --------------------------------------
const udd = fs.mkdtempSync("/tmp/crash-verify-chrome-");
const chrome = spawn("google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--enable-webgl", "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${udd}`,
  PHONE ? "--window-size=390,844" : "--window-size=1000,760", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Stop chrome and the server, remove the profile dir once chrome has exited
// (removing it while chrome is still writing leaves it behind), then exit.
let exiting = false;
function shutdown(code) {
  if (exiting) return;
  exiting = true;
  server.close();
  // Chrome's helper processes outlive the main one by a moment and keep
  // writing the profile; retry the removal a few times before giving up.
  const finish = () => {
    let tries = 0;
    const rm = () => {
      try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
      if (fs.existsSync(udd) && ++tries < 10) { setTimeout(rm, 200); return; }
      process.exit(code);
    };
    rm();
  };
  if (chrome.exitCode !== null) { finish(); return; }
  chrome.once("exit", finish);
  try { chrome.kill("SIGTERM"); } catch { finish(); return; }
  setTimeout(() => { try { chrome.kill("SIGKILL"); } catch {} }, 3000).unref();
  setTimeout(finish, 5000).unref();
}
// Nothing below may hang the arm: a thrown CDP call, a chrome that dies
// mid-run, or a wait that never ends all reach shutdown, so the chrome and
// its CDP port are never leaked for the next run to drive by mistake.
process.on("unhandledRejection", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
process.on("uncaughtException", (err) => { console.log("EXCEPTION: " + (err && err.stack || err)); dump(); shutdown(2); });
const WHOLE_RUN_MS = 180000;
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
if (tiles0 !== "144") fail("boot", `expected a fresh 144-tile board, got tiles ${tiles0}`);
else pass("boot", `seed ${seed} tiles ${tiles0} pair ${A}@(${AX},${AY}) ${B}@(${BX},${BY})`);
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
const labels = await waitLine(/^crash: labels (\d+) ([a-z]+) (\d+) ([a-z]+)$/, 0, 2000);
let keysOk = false, keysDetail = "";
if (!labels) keysDetail = "no \"crash: labels\" boot line";
else {
  const [, LA, tagA, LB, tagB] = labels.m;
  const tapped = results.some((r) => r[0] === "tap-match" && r[1] === "PASS");
  if (!EXPECT_NO_SELECTION && !tapped) keysDetail = "SKIP: no pair removed by tap-match, nothing to undo";
  else if (!EXPECT_NO_SELECTION) {
    const ctl = await waitLine(/^crash: control undo (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
    if (!ctl) keysDetail = "no \"crash: control undo\" boot line";
    else {
      mark = consoleLines.length;
      await tap(ctl.m[1], ctl.m[2]);
      const undo = await waitLine(/^crash: undo tiles (\d+)$/, mark, 2000);
      if (!undo) keysDetail = `UNDO control at (${ctl.m[1]},${ctl.m[2]}) produced no "crash: undo" line`;
    }
  }
  if (!keysDetail) {
    // a touch screen starts with the tags hidden; Space shows them (the game's
    // own "crash: tags" boot line says which)
    const tags = await waitLine(/^crash: tags (shown|hidden) touch (on|off)/, 0, 2000);
    if (PHONE && (!tags || tags.m[2] !== "on")) keysDetail = `phone emulation but the game saw touch ${tags ? tags.m[2] : "?"}`;
    else if (tags && tags.m[1] === "hidden") { await press(" "); await sleep(150); }
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
  const ctl = await waitLine(/^crash: control shuf (-?[\d.]+) (-?[\d.]+)$/, 0, 2000);
  if (EXPECT_NO_SELECTION) skip("traced", "controls are not tappable with forwarding off");
  else if (!ctl) fail("traced", "no \"crash: control shuf\" boot line");
  else {
    let detail = "";
    for (let i = 0; i < SHUFFLES && !detail; i++) {
      mark = consoleLines.length;
      await tap(ctl.m[1], ctl.m[2]);
      const sh = await waitLine(/^crash: shuffle$/, mark, 2000);
      if (!sh) detail = `shuffle ${i + 1}: no "crash: shuffle" line`;
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
          if (lock) { iceLock = [lock[1], lock[2]]; pass("traced", `traced after ${SHUFFLES} shuffles; ICE 1 locked ${lock[1]} ${lock[2]}`); }
          else if (remaps) pass("traced", `traced after ${SHUFFLES} shuffles; ICE 1 remapped the stack`);
          else detail = `ICE 1 fired (${ice.m[0]}) but neither a lock nor a remap line followed`;
        }
      }
    }
    if (detail) fail("traced", detail);
  }
}

// ---- 8. reload: the saved board comes back (gate leg 4, the web half) --------
// A fresh Chrome profile means an empty localStorage at the first boot (the
// boot line said tiles 144). After the taps above the board has 142 tiles,
// three shuffles and one locked pair; a reload must restore exactly that.
{
  const tracedOk = results.some((r) => r[0] === "traced" && r[1] === "PASS");
  if (EXPECT_NO_SELECTION) skip("reload", "nothing was changed to restore with forwarding off");
  else if (!tracedOk) skip("reload", "the traced sub-arm did not reach a state to restore");
  else {
    mark = consoleLines.length;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?trace&stack` });
    const restored = await waitLine(/^crash: restored tiles (\d+) trace (\d+) phase (\w+) ice (\d+) locked ?((?:\d+ ?)*)$/, mark, 20000);
    if (!restored) fail("reload", `no "crash: restored" line within 20 s of the reload`);
    else {
      const got = restored.m[5].trim().split(/\s+/).filter(Boolean).sort((a, b) => a - b).join(" ");
      const want = iceLock ? iceLock.slice().sort((a, b) => a - b).join(" ") : "";
      if (restored.m[1] !== "142") fail("reload", `expected tiles 142 after the reload, got ${restored.m[0]}`);
      else if (restored.m[3] !== "counter") fail("reload", `expected phase counter after the reload, got ${restored.m[0]}`);
      else if (parseInt(restored.m[4], 10) < 1) fail("reload", `expected at least one counter-hack restored, got ${restored.m[0]}`);
      else if (iceLock && got !== want) fail("reload", `expected locked ${want}, got ${restored.m[0]}`);
      else pass("reload", restored.m[0]);
    }
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
      // past the launch window, with a board in play: a new deploy lands
      await sleep(8500);
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
      const prompt = boot2 ? await waitLine(/^crash: update prompt$/, mark, 10000) : null;
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
if (consoleErrors.length === 0) pass("console", `${consoleLines.length} console lines, 0 errors`);
else fail("console", `${consoleErrors.length} error(s): ${JSON.stringify(consoleErrors.slice(0, 5))}`);

// ---- screenshot for the record ----------------------------------------------
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(SHOT, Buffer.from(shot.data, "base64"));
console.log(`screenshot -> ${SHOT}`);

const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(`RESULT: ${results.filter((r) => r[1] === "PASS").length} passed, ${failed} failed, ${results.filter((r) => r[1] === "SKIP").length} skipped`);
if (failed) dump();
shutdown(failed ? 1 : 0);
