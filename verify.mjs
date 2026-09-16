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
//   boot        the game prints its boot line (seed, first solution pair, centres)
//   render      the board region of the WebGL canvas is drawn: many non-background
//               pixels in at least three suit colours (read in the same animation
//               frame the game draws, so preserveDrawingBuffer:false is not a problem)
//   tap-select  a synthetic pointerdown at tile A's centre -> "crash: select A"
//   tap-match   a second one at its pair B     -> "crash: removed A B tiles 142"
//   keys-match  Tab,Tab (cursor -> coords -> glyph), face key, Enter, face key,
//               Enter for the next solution pair -> "crash: removed ... tiles 140"
//   console     zero error-level console entries and zero exceptions
//
// --expect-no-selection is the positive control: run against a copy of the
// build whose page has POINTER_FORWARDING = false, tap-select must observe NO
// selection line, and keys-match must still remove a pair (so the arm is shown
// to see selections when they happen). tap-match is skipped in that mode.
//
// The tap target comes from the game's own boot line, so this arm proves the
// forwarding path (page -> dispatch -> input-frame -> board-select), not the
// geometry; test/test-input.sgl covers the geometry natively.

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
const planned = ["imports", "boot", "render", "tap-select", "tap-match", "keys-match", "console"];
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
  const expected = ["gl", "sigil_wasm_gles3", "wasi_snapshot_preview1"];
  const listing = modules.map((m) => `${m}(${byModule[m].length})`).join(" ");
  if (JSON.stringify(modules) === JSON.stringify(expected)) pass("imports", listing);
  else fail("imports", `expected modules ${expected.join(",")} got ${listing}`);
}

// ---- static server on loopback ---------------------------------------------
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
function shutdown(code) {
  try { chrome.kill("SIGTERM"); } catch {}
  server.close();
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  setTimeout(() => process.exit(code), 200);
}

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
if (PHONE) await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });

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
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html` });
const boot = await waitLine(/^crash: seed (\d+) pair (\d+) (-?[\d.]+) (-?[\d.]+) (\d+) (-?[\d.]+) (-?[\d.]+)$/, 0, 20000);
if (!boot) { fail("boot", "no boot line within 20 s"); timedOut("boot"); await new Promise(() => {}); }
const [, seed, A, AX, AY, B, BX, BY] = boot.m;
pass("boot", `seed ${seed} pair ${A}@(${AX},${AY}) ${B}@(${BX},${BY})`);
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
  let lit = 0, total = 0; const colours = new Set();
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * c.width + x) * 4; const r = d[i], gg = d[i + 1], b = d[i + 2]; total++;
    if (r + gg + b > 120) { lit++; colours.add(((r >> 5) << 6) | ((gg >> 5) << 3) | (b >> 5)); }
  }
  resolve({ lit, total, colours: colours.size, w: c.width, h: c.height });
}))`);
if (px.lit > px.total * 0.15 && px.colours >= 3) pass("render", `${px.lit}/${px.total} sampled pixels lit, ${px.colours} colour bins, buffer ${px.w}x${px.h}`);
else fail("render", `lit ${px.lit}/${px.total}, colour bins ${px.colours}, buffer ${px.w}x${px.h}`);

// ---- 4. tap-select ----------------------------------------------------------
// virtual centre -> buffer pixel (the letterbox the game applies) -> CSS point
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

// ---- 6. keys-match (glyph model) -------------------------------------------
// The boot line names only the first pair, so this arm finds a matchable
// pair through the model itself: in the glyph model a face key cycles the
// highlight through the playable tiles of that face and Enter picks. For
// each face: key, Enter (a "crash: select" line means a playable tile of
// that face exists), key, Enter again: either the second playable tile of
// the face matches ("crash: removed") or the highlight cycled back to the
// same tile and Enter deselected it; move on to the next face.
async function key(type, k) {
  await evalJS(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
}
async function press(k) { await key("keydown", k); await sleep(40); await key("keyup", k); await sleep(120); }
await press("Tab"); await press("Tab"); // cursor -> coords -> glyph
const FACES = "0123456789abcdefghijklmnopqrstuvwxyz";
let matched = null;
const tilesBefore = EXPECT_NO_SELECTION ? 144 : 142;
for (const f of FACES) {
  mark = consoleLines.length;
  await press(f); await press("Enter");
  const sel = await waitLine(/^crash: select (\d+)$/, mark, 800);
  if (!sel) continue; // no playable tile of this face right now
  mark = consoleLines.length;
  await press(f); await press("Enter");
  const rem = await waitLine(/^crash: removed (\d+) (\d+) tiles (\d+)$/, mark, 1500);
  if (rem) { matched = { face: f, line: rem.m[0], tiles: rem.m[3] }; break; }
  // one playable tile of this face only: the second Enter re-picked it
  // (deselect) or did nothing; move on to the next face
  await press("Escape");
}
if (matched && matched.tiles === String(tilesBefore - 2)) pass("keys-match", `glyph model, face ${matched.face}: ${matched.line}`);
else if (matched) fail("keys-match", `expected tiles ${tilesBefore - 2}, got "${matched.line}"`);
else fail("keys-match", `no face key produced a match through the glyph model`);

// ---- 7. console -------------------------------------------------------------
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
